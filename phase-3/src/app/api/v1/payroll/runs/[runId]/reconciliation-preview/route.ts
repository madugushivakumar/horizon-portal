/**
 * Horizon Portal — Read-Only Payroll Reconciliation Preview API Endpoint
 * GET /api/v1/payroll/runs/[runId]/reconciliation-preview
 *
 * Strict Security & Financial Governance:
 * 1. Role-Based Access Control: Permitted ONLY to HR and Admin roles.
 * 2. Unauthenticated requests return HTTP 401.
 * 3. Employee and Manager roles return HTTP 403.
 * 4. Read-Only Guarantee: Zero database mutations, zero snapshot updates, zero audit rows.
 * 5. Exact Paise Arithmetic: Computes tie-outs down to the exact paise using 64-bit BigInt.
 * 6. BigInt-Safe Serialization: Converts BigInt paise to strings for JSON compliance.
 * 7. Privacy Protection: Omits employee-level personal or banking secrets; returns aggregate totals.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { getAuthenticatedUserFromToken } from "@/lib/auth/user";
import {
  calculatePayrollReconciliation,
  serializeReconciliationResult,
} from "@/lib/payroll/reconciliation-engine";

const NO_CACHE_HEADERS = {
  "Cache-Control": "private, no-cache, no-store, must-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

interface RouteContext {
  params: Promise<{ runId: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { runId } = await context.params;

    if (!runId || typeof runId !== "string" || runId.trim() === "") {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid payroll run identifier.",
        },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    const sanitizedRunId = runId.trim();

    // 1. Authenticate session
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const authResult = await getAuthenticatedUserFromToken(token);

    if (!authResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: authResult.message,
        },
        { status: authResult.status, headers: NO_CACHE_HEADERS }
      );
    }

    const { user } = authResult;
    const roleUpper = (user.role || "").toUpperCase();

    // 2. Authorize role: strictly HR and Admin
    if (roleUpper !== "ADMIN" && roleUpper !== "HR") {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden: Payroll reconciliation preview is restricted to HR and Admin roles.",
        },
        { status: 403, headers: NO_CACHE_HEADERS }
      );
    }

    // 3. Execute pure read-only reconciliation calculation inside an explicit transaction
    // Under SQLite/Prisma, wrapping reads in $transaction guarantees point-in-time snapshot
    // consistency across the PayrollRun query and its itemized payslip relations on a single connection.
    const reconciliation = await prisma.$transaction(async (tx) => {
      return calculatePayrollReconciliation(sanitizedRunId, { tx });
    });

    if (!reconciliation) {
      return NextResponse.json(
        {
          success: false,
          error: `Payroll run "${sanitizedRunId}" was not found.`,
        },
        { status: 404, headers: NO_CACHE_HEADERS }
      );
    }

    // 4. Return serialized, BigInt-safe response
    const serializedData = serializeReconciliationResult(reconciliation);

    return NextResponse.json(
      {
        success: true,
        data: serializedData,
      },
      { status: 200, headers: NO_CACHE_HEADERS }
    );
  } catch (error) {
    console.error("[RECONCILIATION_PREVIEW_ERROR]", error);
    return NextResponse.json(
      {
        success: false,
        error: "An unexpected error occurred while generating the payroll reconciliation preview.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}

