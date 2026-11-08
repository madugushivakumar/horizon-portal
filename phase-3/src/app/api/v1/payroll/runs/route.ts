/**
 * Horizon Portal — Admin Payroll Runs List API Endpoint
 * GET /api/v1/payroll/runs
 *
 * Strict Server-Side Role-Based Access Control:
 * - Permitted: HR, Admin
 * - Forbidden: Employee, Manager (HTTP 403)
 * - Unauthenticated: HTTP 401
 *
 * Returns all payroll runs chronologically (newest first) with:
 * - Operational status (e.g. POSTED - PAYMENT PENDING, PAID)
 * - Approval status (e.g. Pending, Approved)
 * - Financial reconciliation status badge
 * - Filterable by search keyword and status
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { getAuthenticatedUserFromToken } from "@/lib/auth/user";
import { reconcilePayrollRun } from "@/lib/payroll/reconciliation-service";

const NO_CACHE_HEADERS = {
  "Cache-Control": "private, no-cache, no-store, must-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

export async function GET(request: NextRequest) {
  try {
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

    // Strict HR and Admin role enforcement
    if (role !== "ADMIN" && role !== "HR") {
      return NextResponse.json(
        { error: "Forbidden: Administrative payroll console is restricted to HR and Admin roles." },
        { status: 403, headers: NO_CACHE_HEADERS }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim().toLowerCase() || "";
    const statusFilter = searchParams.get("status")?.trim().toLowerCase() || "all";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.max(1, Math.min(100, parseInt(searchParams.get("pageSize") || "20", 10)));

    // Fetch all runs ordered newest first by periodStart
    const allRuns = await prisma.payrollRun.findMany({
      orderBy: { periodStart: "desc" },
      include: {
        _count: { select: { payslips: true } },
      },
    });

    // Compute reconciliation summaries for each run
    const runsWithReconciliation = await Promise.all(
      allRuns.map(async (run) => {
        const reconciliation = await reconcilePayrollRun(run.id);
        const actualCount = run._count.payslips;

        const periodStartStr = run.periodStart.toISOString().split("T")[0];
        const periodEndStr = run.periodEnd.toISOString().split("T")[0];
        const periodLabel = new Intl.DateTimeFormat("en-IN", {
          month: "long",
          year: "numeric",
        }).format(run.periodStart);

        const storedGross = run.totalGross ?? 0;
        const storedNet = run.totalNet ?? 0;
        const impliedDeductions = Number((storedGross - storedNet).toFixed(2));

        return {
          id: run.id,
          periodStart: periodStartStr,
          periodEnd: periodEndStr,
          periodLabel,
          paymentDate: run.paymentDate ? run.paymentDate.toISOString().split("T")[0] : null,
          payDate: run.payDate ? run.payDate.toISOString().split("T")[0] : null,
          employeesPaid: run.employeesPaid ?? 0,
          actualPayslipCount: actualCount,
          totalGross: storedGross,
          totalNet: storedNet,
          totalDeductions: impliedDeductions,
          status: run.status,
          approvalStatus: run.status.toUpperCase().includes("PAID") ? "Approved" : (run.approvalStatus || "Pending"),
          reconciliationStatus: reconciliation?.reconciliationStatus || (actualCount === 0 ? "NO_ITEMS" : "MISMATCH"),
          grossDifference: reconciliation?.grossDifference ?? 0,
          netDifference: reconciliation?.netDifference ?? 0,
          employeeCountDifference: reconciliation?.employeeCountDifference ?? 0,
          preparerId: run.preparerId,
          approvedById: run.approvedById,
          approvedAt: run.approvedAt ? run.approvedAt.toISOString() : null,
          approvalNotes: run.approvalNotes,
          createdAt: run.createdAt.toISOString(),
        };
      })
    );

    // Apply in-memory search and filter
    let filteredRuns = runsWithReconciliation;

    if (search) {
      filteredRuns = filteredRuns.filter(
        (r) =>
          r.id.toLowerCase().includes(search) ||
          r.periodLabel.toLowerCase().includes(search) ||
          r.periodStart.includes(search) ||
          r.periodEnd.includes(search)
      );
    }

    if (statusFilter && statusFilter !== "all") {
      filteredRuns = filteredRuns.filter((r) => {
        const opStatus = r.status.toLowerCase();
        const appStatus = r.approvalStatus.toLowerCase();
        if (statusFilter === "paid") return opStatus.includes("paid");
        if (statusFilter === "pending") return opStatus.includes("pending") || appStatus === "pending";
        if (statusFilter === "approved") return appStatus === "approved";
        return opStatus === statusFilter || appStatus === statusFilter;
      });
    }

    // Pagination
    const total = filteredRuns.length;
    const startIndex = (page - 1) * pageSize;
    const paginatedData = filteredRuns.slice(startIndex, startIndex + pageSize);

    // Calculate executive KPIs across all runs
    const totalRunsCount = allRuns.length;
    const pendingApprovalCount = allRuns.filter(
      (r) => (r.approvalStatus || "Pending").toLowerCase() === "pending" && !r.status.toUpperCase().includes("PAID")
    ).length;
    const latestRun = allRuns[0];

    const kpiSummary = {
      totalRuns: totalRunsCount,
      pendingApprovals: pendingApprovalCount,
      latestPeriod: latestRun ? new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" }).format(latestRun.periodStart) : "—",
      latestGross: latestRun?.totalGross ?? 0,
      latestNet: latestRun?.totalNet ?? 0,
      latestStatus: latestRun?.status ?? "—",
    };

    return NextResponse.json(
      {
        data: paginatedData,
        kpiSummary,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize) || 1,
        },
      },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "digest" in error &&
      typeof (error as { digest?: unknown }).digest === "string" &&
      (error as { digest: string }).digest.startsWith("NEXT_")
    ) {
      throw error;
    }

    console.error("Error retrieving payroll runs list:", error);
    return NextResponse.json(
      { error: "Internal server error retrieving payroll runs." },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}
