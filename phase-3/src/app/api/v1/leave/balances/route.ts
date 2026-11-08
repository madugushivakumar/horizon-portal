/**
 * Leave Balances API Endpoint
 * GET /api/v1/leave/balances
 *
 * Returns real-time allocated, used, pending, and available leave balances
 * for the currently authenticated employee.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { getAuthenticatedUserFromToken } from "@/lib/auth/user";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const authResult = await getAuthenticatedUserFromToken(token);

    if (!authResult.success) {
      return NextResponse.json({ error: authResult.message }, { status: authResult.status });
    }

    const employeeId = authResult.user.employeeId;
    if (!employeeId) {
      return NextResponse.json(
        { error: "No employee profile linked to this user account." },
        { status: 400 }
      );
    }

    // Fetch leave types and employee balance record concurrently
    const [leaveTypes, balanceRecord, pendingRequests] = await Promise.all([
      prisma.leaveType.findMany({
        orderBy: { annualQuotaDays: "desc" },
      }),
      prisma.leaveBalance.findUnique({
        where: { employeeId },
      }),
      prisma.leaveRequest.findMany({
        where: {
          employeeId,
          status: "Pending",
        },
        select: {
          leaveTypeCode: true,
          days: true,
        },
      }),
    ]);

    // Sum pending days per leave type
    const pendingByCode: Record<string, number> = {};
    for (const req of pendingRequests) {
      const code = req.leaveTypeCode || "UNKNOWN";
      pendingByCode[code] = (pendingByCode[code] || 0) + req.days;
    }

    // Default fallback if balance record doesn't exist
    const clEntitlement = balanceRecord?.clEntitlement ?? 12;
    const clUsed = balanceRecord?.clUsed ?? 0;
    const clBal = balanceRecord?.clBalance ?? (clEntitlement - clUsed);

    const slEntitlement = balanceRecord?.slEntitlement ?? 12;
    const slUsed = balanceRecord?.slUsed ?? 0;
    const slBal = balanceRecord?.slBalance ?? (slEntitlement - slUsed);

    const elBal = balanceRecord?.elBalance ?? 15;
    const elUsed = balanceRecord?.elUsedFy ?? 0;
    const elEntitlement = (balanceRecord ? elBal + elUsed : 15);

    const balances = leaveTypes.map((type) => {
      const code = type.code || type.id;
      const pending = pendingByCode[code] || 0;

      let entitlement = type.annualQuotaDays || 0;
      let used = 0;
      let available = 0;

      if (code === "CL") {
        entitlement = clEntitlement;
        used = clUsed;
        available = Math.max(0, clBal - pending);
      } else if (code === "SL") {
        entitlement = slEntitlement;
        used = slUsed;
        available = Math.max(0, slBal - pending);
      } else if (code === "EL") {
        entitlement = elEntitlement;
        used = elUsed;
        available = Math.max(0, elBal - pending);
      } else if (code === "ML") {
        entitlement = type.annualQuotaDays || 182;
        available = Math.max(0, entitlement - pending);
      } else if (code === "BL") {
        entitlement = type.annualQuotaDays || 3;
        available = Math.max(0, entitlement - pending);
      } else {
        // LOP / Unpaid
        entitlement = 0;
        available = 0;
      }

      return {
        code,
        name: type.name || type.leaveTypeName || code,
        entitlement,
        used,
        pending,
        available: parseFloat(available.toFixed(1)),
        payType: type.payType || "Paid",
        policyNote: type.policyNote || null,
      };
    });

    return NextResponse.json({
      data: {
        financialYear: balanceRecord?.financialYear || "FY2026-27",
        asOfDate: balanceRecord?.asOfDate ? balanceRecord.asOfDate.toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
        employeeId,
        balances,
      },
    });
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
    console.error("Error fetching leave balances:", error);
    return NextResponse.json(
      { error: "Internal server error retrieving leave balances." },
      { status: 500 }
    );
  }
}
