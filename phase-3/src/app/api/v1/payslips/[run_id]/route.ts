/**
 * Payslip Detail API Endpoint
 * GET /api/v1/payslips/[run_id]
 *
 * Returns itemized payslip breakdown for the authenticated employee.
 * Strictly enforces server-side authorization and employee ownership:
 * - 200 OK: Valid owned payslip
 * - 403 Forbidden: Requesting another employee's payslip
 * - 404 Not Found: Nonexistent record
 * - 401 Unauthorized: Unauthenticated request
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

interface RouteContext {
  params: Promise<{ run_id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { run_id } = await context.params;

    if (!run_id || typeof run_id !== "string") {
      return NextResponse.json(
        { error: "Invalid payroll run identifier." },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const authResult = await getAuthenticatedUserFromToken(token);

    if (!authResult.success) {
      logPayslipAccess({
        userId: "UNAUTHENTICATED",
        userEmail: "anonymous",
        recordIdentifier: run_id,
        action: "VIEW_PAYSLIP_DETAIL",
        outcome: "UNAUTHENTICATED",
      });
      return NextResponse.json(
        { error: authResult.message },
        { status: authResult.status, headers: NO_CACHE_HEADERS }
      );
    }

    const { user } = authResult;
    const currentEmployeeId = user.employeeId;

    if (!currentEmployeeId) {
      return NextResponse.json(
        { error: "No employee profile linked to user account." },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    // 1. Attempt to find the payslip owned by this employee
    const ownedPayslip = await prisma.payslip.findFirst({
      where: {
        employeeId: currentEmployeeId,
        OR: [{ id: run_id }, { payrollRunId: run_id }],
      },
      include: {
        payrollRun: true,
        employee: {
          include: {
            department: true,
            role: true,
          },
        },
      },
    });

    if (ownedPayslip) {
      logPayslipAccess({
        userId: user.id,
        userEmail: user.email,
        employeeId: currentEmployeeId,
        recordIdentifier: run_id,
        action: "VIEW_PAYSLIP_DETAIL",
        outcome: "SUCCESS",
      });

      const payDate =
        ownedPayslip.payrollRun?.paymentDate || ownedPayslip.payrollRun?.payDate;

      const safeDetail = {
        id: ownedPayslip.id,
        payrollRunId: ownedPayslip.payrollRunId || ownedPayslip.payPeriod || run_id,
        periodStart: ownedPayslip.periodStart
          ? ownedPayslip.periodStart.toISOString().split("T")[0]
          : null,
        periodEnd: ownedPayslip.periodEnd
          ? ownedPayslip.periodEnd.toISOString().split("T")[0]
          : null,
        paymentDate: payDate ? payDate.toISOString().split("T")[0] : null,
        status: ownedPayslip.payrollRun?.status || "PAID",
        currency: ownedPayslip.currency || "INR",

        // Attendance & Days
        calendarDays: ownedPayslip.calendarDays ?? 30,
        payableDays: ownedPayslip.payableDays ?? 30,
        lopDays: ownedPayslip.lopDays ?? 0,

        // Employee Information
        employee: {
          id: ownedPayslip.employee.id,
          fullName:
            ownedPayslip.employee.fullName ||
            `${ownedPayslip.employee.firstName} ${ownedPayslip.employee.lastName}`,
          email: ownedPayslip.employee.email || ownedPayslip.employee.workEmail,
          department: ownedPayslip.employee.department?.name || "General",
          role:
            ownedPayslip.employee.role?.roleTitle ||
            ownedPayslip.employee.role?.name ||
            "Employee",
          workLocation: ownedPayslip.employee.workLocation || "Bengaluru HQ",
          workMode: ownedPayslip.employee.workMode || "Hybrid",
          employmentType: ownedPayslip.employee.employmentType || "Full-Time",
        },

        // Employer Information
        employer: {
          companyName: "Aura Workforce by Growmar",
          legalEntity: "Growmar Technologies Pvt. Ltd.",
          address: "Horizon Tech Park, Outer Ring Road, Whitefield, Bengaluru, Karnataka 560066",
          taxRegistration: "GSTIN: 29AABCG1234F1Z8 | PAN: AABCG1234F",
        },

        // Itemized Earnings
        earnings: {
          basic: ownedPayslip.basic ?? 0,
          hra: ownedPayslip.hra ?? 0,
          conveyance: ownedPayslip.conveyance ?? 0,
          medical: ownedPayslip.medical ?? 0,
          specialAllowance: ownedPayslip.specialAllowance ?? 0,
          overtimePay: ownedPayslip.overtimePay ?? 0,
          variablePay: ownedPayslip.variablePay ?? 0,
          grossPay: ownedPayslip.grossPay,
        },

        // Itemized Deductions
        deductions: {
          pfEmployee: ownedPayslip.pfEmployee ?? 0,
          esiEmployee: ownedPayslip.esiEmployee ?? 0,
          professionalTax: ownedPayslip.professionalTax ?? 0,
          tds: ownedPayslip.tds ?? 0,
          otherDeductions: ownedPayslip.otherDeductions ?? 0,
          totalDeductions: ownedPayslip.totalDeductions ?? ownedPayslip.deductions ?? 0,
        },

        // Net Pay
        netPay: ownedPayslip.netPay,
      };

      return NextResponse.json({ data: safeDetail }, { headers: NO_CACHE_HEADERS });
    }

    // 2. The employee does NOT own this payslip. Check if this record exists in DB belonging to someone else
    const foreignPayslip = await prisma.payslip.findFirst({
      where: {
        OR: [{ id: run_id }, { payrollRunId: run_id }],
      },
      select: {
        id: true,
        employeeId: true,
      },
    });

    if (foreignPayslip && foreignPayslip.employeeId !== currentEmployeeId) {
      // Cross-employee breach attempt detected: return 403 Forbidden without leaking data
      logPayslipAccess({
        userId: user.id,
        userEmail: user.email,
        employeeId: currentEmployeeId,
        recordIdentifier: run_id,
        action: "VIEW_PAYSLIP_DETAIL",
        outcome: "FORBIDDEN",
      });

      return NextResponse.json(
        { error: "Forbidden: You do not have permission to view this payslip." },
        { status: 403, headers: NO_CACHE_HEADERS }
      );
    }

    // 3. Check if the payroll run exists generally
    const runExists = await prisma.payrollRun.findUnique({
      where: { id: run_id },
      select: { id: true },
    });

    logPayslipAccess({
      userId: user.id,
      userEmail: user.email,
      employeeId: currentEmployeeId,
      recordIdentifier: run_id,
      action: "VIEW_PAYSLIP_DETAIL",
      outcome: "NOT_FOUND",
    });

    if (runExists) {
      return NextResponse.json(
        { error: "No payslip found for the authenticated employee for this payroll period." },
        { status: 404, headers: NO_CACHE_HEADERS }
      );
    }

    return NextResponse.json(
      { error: "Payroll record not found." },
      { status: 404, headers: NO_CACHE_HEADERS }
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

    console.error("Error retrieving payslip detail:", error);
    return NextResponse.json(
      { error: "Internal server error retrieving payslip." },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}
