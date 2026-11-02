/**
 * Horizon Portal — Controlled Payroll Approval API Endpoint
 * POST /api/v1/payroll/runs/[runId]/approve
 *
 * Strict Security & Financial Controls:
 * 1. Role-Based Access Control: Permitted ONLY to HR and Admin.
 * 2. Separation of Duties: The user who prepared the run cannot approve it.
 * 3. Concurrency Protection: Double approval returns HTTP 409 Conflict.
 * 4. Reconciliation Guard: Runs with MISMATCH or NO_ITEMS return HTTP 422 Unprocessable Entity.
 * 5. Lifecycle Preservation: Operational status (e.g. POSTED - PAYMENT PENDING) is preserved;
 *    approval is recorded in approvalStatus ("Approved").
 * 6. Transactional Consistency: Status transition and AuditLog creation execute atomically.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { getAuthenticatedUserFromToken } from "@/lib/auth/user";
import { reconcilePayrollRun } from "@/lib/payroll/reconciliation-service";
import { logPayrollApproval, getActorSnapshot } from "@/lib/audit/audit-logger";

const NO_CACHE_HEADERS = {
  "Cache-Control": "private, no-cache, no-store, must-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

interface RouteContext {
  params: Promise<{ runId: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { runId } = await context.params;

    if (!runId || typeof runId !== "string") {
      return NextResponse.json(
        { error: "Invalid payroll run identifier." },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    // 1. Authenticate session
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const authResult = await getAuthenticatedUserFromToken(token);

    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.message },
        { status: authResult.status, headers: NO_CACHE_HEADERS }
      );
    }

    const { user } = authResult;
    const role = (user.role || "").toUpperCase();

    // 2. Authorize role: strictly HR or Admin
    if (role !== "ADMIN" && role !== "HR") {
      return NextResponse.json(
        { error: "Forbidden: Payroll approval is restricted to HR and Admin roles." },
        { status: 403, headers: NO_CACHE_HEADERS }
      );
    }

    // Parse optional request payload
    let notes: string | null = null;
    try {
      const body = await request.json();
      if (body && typeof body.notes === "string") {
        notes = body.notes.trim();
      }
    } catch {
      // Body is optional
    }

    // 3. Fetch current run record
    const run = await prisma.payrollRun.findUnique({
      where: { id: runId },
    });

    if (!run) {
      return NextResponse.json(
        { error: `Payroll run ${runId} was not found.` },
        { status: 404, headers: NO_CACHE_HEADERS }
      );
    }

    // 4. Separation of Duties enforcement:
    // If a preparer is recorded, the preparer (by user.id or user.employeeId) cannot approve
    if (run.preparerId) {
      const isPreparer =
        user.id === run.preparerId ||
        (user.employeeId && user.employeeId === run.preparerId);

      if (isPreparer) {
        return NextResponse.json(
          {
            error:
              "Separation of duties violation: The administrator who prepared this payroll run cannot approve it. An independent HR or Admin reviewer is required.",
          },
          { status: 403, headers: NO_CACHE_HEADERS }
        );
      }
    }

    // 5. Invariant status checks:
    // Cannot approve an already finalized/paid run
    if (run.status.toUpperCase().includes("PAID")) {
      return NextResponse.json(
        {
          error: "Conflict: This payroll run has already been paid and finalized.",
          status: run.status,
          approvalStatus: run.approvalStatus,
        },
        { status: 409, headers: NO_CACHE_HEADERS }
      );
    }

    // Cannot approve an already approved run (double-approval prevention)
    if ((run.approvalStatus || "").toLowerCase() === "approved") {
      return NextResponse.json(
        {
          error: "Conflict: This payroll run is already approved.",
          approvalStatus: run.approvalStatus,
          approvedAt: run.approvedAt,
          approvedById: run.approvedById,
        },
        { status: 409, headers: NO_CACHE_HEADERS }
      );
    }

    // 6. Financial Reconciliation Guard:
    // Reconcile before approving; block approval if discrepancies exist
    const reconciliation = await reconcilePayrollRun(runId);

    if (!reconciliation) {
      return NextResponse.json(
        { error: "Could not execute financial reconciliation for this run." },
        { status: 500, headers: NO_CACHE_HEADERS }
      );
    }

    if (reconciliation.reconciliationStatus === "NO_ITEMS") {
      return NextResponse.json(
        {
          error:
            "Unprocessable Entity: Cannot approve a payroll run that has no itemized payslip records.",
          reconciliationStatus: "NO_ITEMS",
          details: reconciliation.discrepancyDetails,
        },
        { status: 422, headers: NO_CACHE_HEADERS }
      );
    }

    if (reconciliation.reconciliationStatus === "MISMATCH") {
      return NextResponse.json(
        {
          error:
            "Unprocessable Entity: Cannot approve a payroll run with unresolved financial reconciliation discrepancies.",
          reconciliationStatus: "MISMATCH",
          discrepancyDetails: reconciliation.discrepancyDetails,
          variances: {
            grossDifference: reconciliation.grossDifference,
            netDifference: reconciliation.netDifference,
            deductionsDifference: reconciliation.deductionsDifference,
            employeeCountDifference: reconciliation.employeeCountDifference,
          },
        },
        { status: 422, headers: NO_CACHE_HEADERS }
      );
    }

    // 7. Atomic transaction: update status + write audit log
    const now = new Date();
    const actorSnapshot = getActorSnapshot(user);

    const updatedRun = await prisma.$transaction(async (tx) => {
      // Concurrency check inside transaction: re-check approval status
      const freshRun = await tx.payrollRun.findUnique({
        where: { id: runId },
        select: { approvalStatus: true, status: true },
      });

      if (!freshRun || (freshRun.approvalStatus || "").toLowerCase() === "approved") {
        throw new Error("CONCURRENT_APPROVAL_CONFLICT");
      }

      // Preserve operational status (e.g. POSTED - PAYMENT PENDING) and set approvalStatus to "Approved"
      const updated = await tx.payrollRun.update({
        where: { id: runId },
        data: {
          approvalStatus: "Approved",
          approvedById: user.id,
          approvedAt: now,
          approvalNotes: notes || null,
        },
      });

      // Write immutable audit log
      await logPayrollApproval(tx, {
        actor: actorSnapshot,
        payrollRunId: runId,
        previousStatus: freshRun.status,
        newStatus: freshRun.status,
        previousApprovalStatus: freshRun.approvalStatus || "Pending",
        newApprovalStatus: "Approved",
        notes: notes || null,
        reconciliationStatus: reconciliation.reconciliationStatus,
        financialSummary: {
          storedGross: run.totalGross,
          storedNet: run.totalNet,
          employeesPaid: run.employeesPaid,
          payslipsCount: reconciliation.actualPayslipCount,
          calculatedGross: reconciliation.calculatedGross,
          calculatedNet: reconciliation.calculatedNet,
        },
      });

      return updated;
    });

    return NextResponse.json(
      {
        success: true,
        message: `Payroll run ${runId} has been successfully approved.`,
        data: {
          id: updatedRun.id,
          status: updatedRun.status,
          approvalStatus: updatedRun.approvalStatus,
          approvedById: updatedRun.approvedById,
          approvedAt: updatedRun.approvedAt ? updatedRun.approvedAt.toISOString() : null,
          approvalNotes: updatedRun.approvalNotes,
        },
      },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "message" in error &&
      (error as { message: string }).message === "CONCURRENT_APPROVAL_CONFLICT"
    ) {
      return NextResponse.json(
        { error: "Conflict: This payroll run was approved by another administrator concurrently." },
        { status: 409, headers: NO_CACHE_HEADERS }
      );
    }

    if (
      typeof error === "object" &&
      error !== null &&
      "digest" in error &&
      typeof (error as { digest?: unknown }).digest === "string" &&
      (error as { digest: string }).digest.startsWith("NEXT_")
    ) {
      throw error;
    }

    console.error("Error approving payroll run:", error);
    return NextResponse.json(
      { error: "Internal server error processing payroll approval." },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}

