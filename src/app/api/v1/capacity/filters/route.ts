/**
 * Horizon Portal — Workload & Capacity Filter Options API
 * GET /api/v1/capacity/filters
 *
 * Returns authorized sprints and teams for the Workload & Capacity view.
 * - Authenticated access only.
 * - Admin/HR: All sprints, all teams.
 * - Manager: All sprints, only teams authorized in manager's scope.
 * - Employee: All sprints, only teams employee belongs to.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { getAuthenticatedUserFromToken } from "@/lib/auth/user";
import { NO_CACHE_HEADERS, resolveUserCapacityScope } from "@/lib/capacity/auth";
import { calculateWorkingDaysInRange, formatDateToISOString } from "@/lib/capacity/working-days";

export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate user
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

    // 2. Resolve role-based authorization scope
    const scope = await resolveUserCapacityScope(authResult.user);

    // 3. Query all sprints and official holidays
    const [sprints, holidays] = await Promise.all([
      prisma.sprint.findMany({
        select: {
          id: true,
          sprintName: true,
          startDate: true,
          endDate: true,
          workingDays: true,
        },
        orderBy: {
          startDate: "desc",
        },
      }),
      prisma.holiday.findMany({
        select: {
          holidayDate: true,
          date: true,
        },
      }),
    ]);

    const holidayDateStrings = new Set<string>(
      holidays.map((h) => h.holidayDate || formatDateToISOString(h.date))
    );

    // 4. Query teams authorized for this role
    let teams: Array<{ id: string; teamName: string }>;

    if (scope.isUnrestricted) {
      teams = await prisma.team.findMany({
        select: {
          id: true,
          teamName: true,
        },
        orderBy: {
          teamName: "asc",
        },
      });
    } else {
      teams = await prisma.team.findMany({
        where: {
          id: { in: scope.authorizedTeamIds },
        },
        select: {
          id: true,
          teamName: true,
        },
        orderBy: {
          teamName: "asc",
        },
      });
    }

    // 5. Calculate effective working days for each sprint (excluding weekends & holidays)
    const formattedSprints = sprints.map((s) => {
      const sprintDaysResult = calculateWorkingDaysInRange(
        s.startDate,
        s.endDate,
        holidayDateStrings
      );
      return {
        id: s.id,
        name: s.sprintName,
        startDate: formatDateToISOString(s.startDate),
        endDate: formatDateToISOString(s.endDate),
        workingDays: sprintDaysResult.workingDays,
      };
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          sprints: formattedSprints,
          teams,
        },
      },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (error) {
    console.error("Error in GET /api/v1/capacity/filters:", error);
    return NextResponse.json(
      { error: "Internal server error fetching capacity filters." },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}
