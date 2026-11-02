/**
 * Horizon Portal — Admin Payroll Run Detail API Endpoint
 * GET /api/v1/payroll/runs/[runId]
 *
 * Strict Server-Side Role-Based Access Control:
 * - Permitted: HR, Admin
 * - Forbidden: Employee, Manager (HTTP 403)
 * - Unauthenticated: HTTP 401
 *
 * Returns detailed run inspection with:
 * - Header summary & approval records
 * - Month-over-Month comparison metrics
 * - Detailed financial reconciliation tie-out breakdown
 * - Searchable and paginated itemized payslips
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { getAuthenticatedUserFromToken } from "@/lib/auth/user";
import {
  reconcilePayrollRun,
  calculateMonthOverMonth,
} from "@/lib/payroll/reconciliation-service";

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

    if (!runId || typeof runId !== "string") {
      return NextResponse.json(
        { error: "Invalid payroll run identifier." },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

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

    if (role !== "ADMIN" && role !== "HR") {
      return NextResponse.json(
        { error: "Forbidden: Payroll inspection is restricted to HR and Admin roles." },
        { status: 403, headers: NO_CACHE_HEADERS }
      );
    }

    // Retrieve payroll run
    const run = await prisma.payrollRun.findUnique({
      where: { id: runId },
    });

    if (!run) {
      return NextResponse.json(
        { error: `Payroll run ${runId} was not found.` },
        { status: 404, headers: NO_CACHE_HEADERS }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim().toLowerCase() || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.max(1, Math.min(100, parseInt(searchParams.get("pageSize") || "25", 10)));

    // Perform financial reconciliation and MoM calculation
    const [reconciliation, momComparison] = await Promise.all([
      reconcilePayrollRun(runId),
      calculateMonthOverMonth(runId),
    ]);

    // Query itemized payslips with pagination and employee filtering
    const whereClause: {
      payrollRunId: string;
      OR?: Array<{
        employeeId?: { contains: string };
        employee?: {
          OR: Array<{
            firstName?: { contains: string };
            lastName?: { contains: string };
            fullName?: { contains: string };
          }>;
        };
      }>;
    } = {
      payrollRunId: runId,
    };

    if (search) {
      whereClause.OR = [
        { employeeId: { contains: search } },
        {
          employee: {
            OR: [
              { firstName: { contains: search } },
              { lastName: { contains: search } },
              { fullName: { contains: search } },
            ],
          },
        },
      ];
    }

    const [totalItems, payslipRecords] = await Promise.all([
      prisma.payslip.count({ where: whereClause }),
      prisma.payslip.findMany({
        where: whereClause,
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              fullName: true,
              department: { select: { id: true, name: true } },
              role: { select: { id: true, name: true, roleTitle: true } },
            },
          },
        },
        orderBy: { employeeId: "asc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    // Format safe itemized rows (strictly omitting sensitive secrets)
    const formattedItems = payslipRecords.map((p) => {
      const empName = p.employee.fullName || `${p.employee.firstName} ${p.employee.lastName}`;
      const departmentName = p.employee.department?.name || "General";
      const roleTitle = p.employee.role?.roleTitle || p.employee.role?.name || "Employee";

      const totalDeductions = p.totalDeductions ?? p.deductions ?? 0;
      const otherAllowances = (p.conveyance || 0) + (p.medical || 0) + (p.specialAllowance || 0) + (p.overtimePay || 0) + (p.variablePay || 0);

      return {
        id: p.id,
        employeeId: p.employeeId,
        employeeName: empName,
        department: departmentName,
        role: roleTitle,
        basic: p.basic ?? 0,
        hra: p.hra ?? 0,
        allowances: otherAllowances,
        grossPay: p.grossPay,
        pfEmployee: p.pfEmployee ?? 0,
        esiEmployee: p.esiEmployee ?? 0,
        professionalTax: p.professionalTax ?? 0,
        tds: p.tds ?? 0,
        otherDeductions: p.otherDeductions ?? 0,
        totalDeductions,
        netPay: p.netPay,
        currency: p.currency || "INR",
      };
    });

    const periodStartStr = run.periodStart.toISOString().split("T")[0];
    const periodEndStr = run.periodEnd.toISOString().split("T")[0];
    const periodLabel = new Intl.DateTimeFormat("en-IN", {
      month: "long",
      year: "numeric",
    }).format(run.periodStart);

    const storedGross = run.totalGross ?? 0;
    const storedNet = run.totalNet ?? 0;
    const impliedDeductions = Number((storedGross - storedNet).toFixed(2));

    const safeResponse = {
      header: {
        id: run.id,
        periodStart: periodStartStr,
        periodEnd: periodEndStr,
        periodLabel,
        paymentDate: run.paymentDate ? run.paymentDate.toISOString().split("T")[0] : null,
        payDate: run.payDate ? run.payDate.toISOString().split("T")[0] : null,
        status: run.status,
        approvalStatus: run.status.toUpperCase().includes("PAID") ? "Approved" : (run.approvalStatus || "Pending"),
        employeesPaid: run.employeesPaid ?? 0,
        actualPayslipCount: reconciliation?.actualPayslipCount ?? totalItems,
        preparerId: run.preparerId || null,
        approvedById: run.approvedById || null,
        approvedAt: run.approvedAt ? run.approvedAt.toISOString() : null,
        approvalNotes: run.approvalNotes || null,
        createdAt: run.createdAt.toISOString(),
      },
      financialSummary: {
        storedGross,
        storedNet,
        storedDeductions: impliedDeductions,
        calculatedGross: reconciliation?.calculatedGross ?? 0,
        calculatedNet: reconciliation?.calculatedNet ?? 0,
        calculatedDeductions: reconciliation?.calculatedDeductions ?? 0,
      },
      reconciliation,
      monthOverMonth: momComparison,
      items: {
        data: formattedItems,
        pagination: {
          page,
          pageSize,
          total: totalItems,
          totalPages: Math.ceil(totalItems / pageSize) || 1,
        },
      },
    };

    return NextResponse.json({ data: safeResponse }, { headers: NO_CACHE_HEADERS });
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

    console.error("Error retrieving payroll run details:", error);
    return NextResponse.json(
      { error: "Internal server error retrieving payroll run details." },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}
