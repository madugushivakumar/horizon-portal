/**
 * Leave Calendar API Endpoint
 * GET /api/v1/leave/calendar
 *
 * Returns holidays and approved leaves for the currently authenticated employee.
 * Supports filtering by year and month.
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

    const { searchParams } = new URL(request.url);
    const yearParam = searchParams.get("year");
    const monthParam = searchParams.get("month");

    // Fetch official corporate holidays
    const holidays = await prisma.holiday.findMany({
      orderBy: { date: "asc" },
    });

    // Fetch employee's approved and pending leave requests
    const leaves = await prisma.leaveRequest.findMany({
      where: {
        employeeId,
        status: { in: ["Approved", "Pending"] },
      },
      include: {
        leaveType: {
          select: { name: true, code: true },
        },
      },
      orderBy: { startDate: "asc" },
    });

    // Format holidays
    const holidayEvents = holidays.map((h) => ({
      id: h.id,
      date: h.holidayDate || h.date.toISOString().split("T")[0],
      title: h.holidayName || h.name,
      type: "holiday" as const,
      holidayType: h.holidayType || "Company Holiday",
      note: h.calendarNote || null,
    }));

    // Format leaves
    const leaveEvents = leaves.map((l) => ({
      id: l.id,
      startDate: l.startDate.toISOString().split("T")[0],
      endDate: l.endDate.toISOString().split("T")[0],
      title: `${l.leaveType?.name || l.leaveTypeCode || "Leave"} (${l.days}d)`,
      leaveTypeCode: l.leaveTypeCode,
      status: l.status,
      type: "leave" as const,
      reason: l.reason,
    }));

    // Optional year/month filter
    let filteredHolidays = holidayEvents;
    let filteredLeaves = leaveEvents;

    if (yearParam) {
      const yr = yearParam.trim();
      filteredHolidays = filteredHolidays.filter((h) => h.date.startsWith(yr));
      filteredLeaves = filteredLeaves.filter((l) => l.startDate.startsWith(yr) || l.endDate.startsWith(yr));
    }

    if (monthParam) {
      const mo = monthParam.trim().padStart(2, "0");
      filteredHolidays = filteredHolidays.filter((h) => {
        const parts = h.date.split("-");
        return parts.length >= 2 && parts[1] === mo;
      });
      filteredLeaves = filteredLeaves.filter((l) => {
        const sParts = l.startDate.split("-");
        const eParts = l.endDate.split("-");
        return (sParts.length >= 2 && sParts[1] === mo) || (eParts.length >= 2 && eParts[1] === mo);
      });
    }

    return NextResponse.json({
      data: {
        holidays: filteredHolidays,
        leaves: filteredLeaves,
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
    console.error("Error fetching calendar events:", error);
    return NextResponse.json(
      { error: "Internal server error retrieving calendar events." },
      { status: 500 }
    );
  }
}
