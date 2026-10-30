/**
 * Team Attendance Oversight API Endpoint
 * GET /api/v1/team/attendance
 *
 * Scoped attendance overview for managers and HR:
 * - Managers view only direct reports in their authorized team.
 * - HR and Admin view organization-wide workforce attendance.
 * - Month and year selection against historical attendance_monthly dataset.
 * - Accurately accounts for approved leave vs. unexcused absence.
 * - Clearly distinguishes missing data from confirmed absences.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { getAuthenticatedUserFromToken } from "@/lib/auth/user";

const NO_CACHE_HEADERS = {
  "Cache-Control": "private, no-cache, no-store, must-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

export async function GET(request: NextRequest) {
  try {
    const token =
      request.cookies.get(SESSION_COOKIE_NAME)?.value ||
      request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

    const authResult = await getAuthenticatedUserFromToken(token);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.message },
        { status: authResult.status, headers: NO_CACHE_HEADERS }
      );
    }

    const { role, employeeId } = authResult.user;
    if (role === "Employee") {
      return NextResponse.json(
        { error: "Forbidden: Employees cannot view team attendance oversight." },
        { status: 403, headers: NO_CACHE_HEADERS }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const yearParam = searchParams.get("year");
    const monthParam = searchParams.get("month");
    const departmentFilter = searchParams.get("department");
    const searchFilter = searchParams.get("search");
    const statusFilter = searchParams.get("status");

    // Resolve target month & year (default to 2026-09)
    let year = 2026;
    let month = 9;

    if (monthParam && monthParam.includes("-")) {
      const parts = monthParam.split("-");
      year = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10);
    } else {
      if (yearParam) year = parseInt(yearParam, 10);
      if (monthParam) month = parseInt(monthParam, 10);
    }

    // End date of the selected month at UTC midnight
    const periodEndDate = new Date(Date.UTC(year, month, 0, 0, 0, 0, 0));
    const periodEndStr = periodEndDate.toISOString().split("T")[0];

    // Determine target employees based on role
    const employeeWhere: any = {};

    if (role === "Manager") {
      if (!employeeId) {
        return NextResponse.json(
          {
            data: [],
            summary: { totalEmployees: 0, presentCount: 0, onLeaveCount: 0, absentCount: 0, avgAttendanceRate: 0 },
            availablePeriods: [],
          },
          { status: 200, headers: NO_CACHE_HEADERS }
        );
      }
      // Manager sees only direct reports (never self in team attendance)
      employeeWhere.managerId = employeeId;
      employeeWhere.id = { not: employeeId };
    }

    if ((role === "HR" || role === "Admin") && departmentFilter) {
      employeeWhere.departmentId = departmentFilter;
    }

    if (searchFilter) {
      const term = searchFilter.trim();
      employeeWhere.OR = [
        { id: { contains: term } },
        { firstName: { contains: term } },
        { lastName: { contains: term } },
        { fullName: { contains: term } },
      ];
    }

    // Fetch in-scope employees
    const employees = await prisma.employee.findMany({
      where: employeeWhere,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        fullName: true,
        departmentId: true,
        department: { select: { id: true, name: true, code: true } },
        managerId: true,
        status: true,
      },
      orderBy: { id: "asc" },
    });

    const employeeIds = employees.map((e) => e.id);

    // Fetch monthly attendance records for the selected period
    const attendanceRecords = await prisma.attendanceMonthly.findMany({
      where: {
        employeeId: { in: employeeIds },
        periodEndDate: periodEndDate,
      },
    });

    const recordByEmpId = new Map(attendanceRecords.map((r) => [r.employeeId, r]));

    // Query distinct periods for the month selector
    const distinctPeriods = await prisma.attendanceMonthly.findMany({
      select: { periodEndDate: true },
      distinct: ["periodEndDate"],
      orderBy: { periodEndDate: "desc" },
    });

    const availablePeriods = distinctPeriods.map((p) => {
      const dateStr = p.periodEndDate.toISOString().split("T")[0];
      const d = new Date(p.periodEndDate);
      const monthNames = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
      ];
      const label = `${monthNames[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
      return { value: dateStr, label, year: d.getUTCFullYear(), month: d.getUTCMonth() + 1 };
    });

    // Map each employee with attendance data
    const rows = employees.map((emp) => {
      const att = recordByEmpId.get(emp.id);

      if (!att) {
        return {
          employeeId: emp.id,
          employeeName: emp.fullName || `${emp.firstName} ${emp.lastName}`.trim(),
          departmentId: emp.departmentId,
          departmentName: emp.department?.name || emp.departmentId || "General",
          hasRecord: false,
          scheduledDays: 0,
          presentDays: 0,
          wfhDays: 0,
          paidLeaveDays: 0,
          unpaidAbsenceDays: 0,
          lateArrivals: 0,
          avgHoursWorked: 0,
          attendanceRate: 0,
          attendancePercentage: 0,
          attendanceStatus: "No Record",
        };
      }

      // Calculate attendance status
      let attendanceStatus = "Regular";
      if (att.attendanceRate >= 0.95) {
        attendanceStatus = "Excellent";
      } else if (att.paidLeaveDays > 0 && att.unpaidAbsenceDays === 0) {
        attendanceStatus = "On Leave";
      } else if (att.unpaidAbsenceDays > 0) {
        attendanceStatus = "Absence Recorded";
      } else if (att.attendanceRate < 0.8) {
        attendanceStatus = "Low Attendance";
      }

      return {
        employeeId: emp.id,
        employeeName: emp.fullName || `${emp.firstName} ${emp.lastName}`.trim(),
        departmentId: emp.departmentId,
        departmentName: emp.department?.name || emp.departmentId || "General",
        hasRecord: true,
        scheduledDays: att.scheduledDays,
        presentDays: att.presentDays,
        wfhDays: att.wfhDays,
        paidLeaveDays: att.paidLeaveDays,
        unpaidAbsenceDays: att.unpaidAbsenceDays,
        lateArrivals: att.lateArrivals,
        avgHoursWorked: att.avgHoursWorked,
        attendanceRate: att.attendanceRate,
        attendancePercentage: Math.round(att.attendanceRate * 100),
        attendanceStatus,
      };
    });

    // Apply status filter if provided
    const filteredRows = statusFilter && statusFilter !== "All"
      ? rows.filter((r) => r.attendanceStatus === statusFilter)
      : rows;

    // Summary calculations across rows with records
    const recordsWithData = rows.filter((r) => r.hasRecord);
    const totalPresent = recordsWithData.filter((r) => r.presentDays > 0 && r.unpaidAbsenceDays === 0).length;
    const totalOnLeave = recordsWithData.filter((r) => r.paidLeaveDays > 0).length;
    const totalAbsent = recordsWithData.filter((r) => r.unpaidAbsenceDays > 0).length;
    const avgRate =
      recordsWithData.length > 0
        ? Math.round(
            (recordsWithData.reduce((sum, r) => sum + r.attendancePercentage, 0) /
              recordsWithData.length)
          )
        : 0;

    return NextResponse.json(
      {
        success: true,
        period: {
          year,
          month,
          periodEndDate: periodEndStr,
        },
        summary: {
          totalEmployees: rows.length,
          recordedEmployees: recordsWithData.length,
          presentCount: totalPresent,
          onLeaveCount: totalOnLeave,
          absentCount: totalAbsent,
          avgAttendanceRate: avgRate,
        },
        availablePeriods,
        data: filteredRows,
      },
      { status: 200, headers: NO_CACHE_HEADERS }
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
    console.error("Error retrieving team attendance:", error);
    return NextResponse.json(
      { error: "Internal server error retrieving team attendance." },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}
