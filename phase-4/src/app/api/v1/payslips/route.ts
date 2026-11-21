/**
 * Payslip Month List API Endpoint
 * GET /api/v1/payslips
 *
 * Returns a chronological list of payslips belonging strictly to the currently authenticated employee.
 * Enforces server-side ownership: never trusts client-supplied identifiers.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { getAuthenticatedUserFromToken } from "@/lib/auth/user";
import { logPayslipAccess } from "@/lib/payroll/audit";

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
      logPayslipAccess({
        userId: "UNAUTHENTICATED",
        userEmail: "anonymous",
        recordIdentifier: "LIST_ALL",
        action: "LIST_PAYSLIPS",
        outcome: "UNAUTHENTICATED",
      });
      return NextResponse.json(
        { error: authResult.message },
        { status: authResult.status, headers: NO_CACHE_HEADERS }
      );
    }

    const { user } = authResult;
    const employeeId = user.employeeId;

    if (!employeeId) {
      return NextResponse.json(
        { error: "No employee profile is linked to this user account." },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    // Query payslips belonging strictly to the authenticated employee
    const payslips = await prisma.payslip.findMany({
      where: { employeeId },
      include: {
        payrollRun: {
          select: {
            id: true,
            payDate: true,
            paymentDate: true,
            status: true,
          },
        },
      },
      orderBy: { periodStart: "desc" },
    });

    logPayslipAccess({
      userId: user.id,
      userEmail: user.email,
      employeeId,
      recordIdentifier: `LIST_${payslips.length}_RECORDS`,
      action: "LIST_PAYSLIPS",
      outcome: "SUCCESS",
    });

    // Format safe response fields
    const safePayslips = payslips.map((p) => {
      const payDate = p.payrollRun?.paymentDate || p.payrollRun?.payDate;
      return {
        id: p.id,
        payrollRunId: p.payrollRunId || p.payPeriod || "N/A",
        periodStart: p.periodStart ? p.periodStart.toISOString().split("T")[0] : null,
        periodEnd: p.periodEnd ? p.periodEnd.toISOString().split("T")[0] : null,
        paymentDate: payDate ? payDate.toISOString().split("T")[0] : null,
        grossPay: p.grossPay,
        totalDeductions: p.totalDeductions ?? p.deductions ?? 0,
        netPay: p.netPay,
        currency: p.currency || "INR",
        status: p.payrollRun?.status || "PAID",
      };
    });

    return NextResponse.json({ data: safePayslips }, { headers: NO_CACHE_HEADERS });
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

    console.error("Error retrieving payslips list:", error);
    return NextResponse.json(
      { error: "Internal server error retrieving payslips." },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}
