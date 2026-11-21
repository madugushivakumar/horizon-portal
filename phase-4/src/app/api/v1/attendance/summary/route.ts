/**
 * Monthly Attendance Summary API Endpoint
 * GET /api/v1/attendance/summary
 *
 * Returns the latest monthly attendance summary for the authenticated employee.
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

    // Retrieve latest monthly attendance record
    const latest = await prisma.attendanceMonthly.findFirst({
      where: { employeeId },
      orderBy: { periodEndDate: "desc" },
    });

    if (!latest) {
      return NextResponse.json({ data: null });
    }

    return NextResponse.json({
      data: {
        id: latest.id,
        employeeId: latest.employeeId,
        periodEndDate: latest.periodEndDate.toISOString().split("T")[0],
        scheduledDays: latest.scheduledDays,
        presentDays: latest.presentDays,
        wfhDays: latest.wfhDays,
        paidLeaveDays: latest.paidLeaveDays,
        unpaidAbsenceDays: latest.unpaidAbsenceDays,
        lateArrivals: latest.lateArrivals,
        avgHoursWorked: latest.avgHoursWorked,
        overtimeHours: latest.overtimeHours,
        attendanceRate: latest.attendanceRate,
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
    console.error("Error fetching attendance summary:", error);
    return NextResponse.json(
      { error: "Internal server error retrieving attendance summary." },
      { status: 500 }
    );
  }
}
