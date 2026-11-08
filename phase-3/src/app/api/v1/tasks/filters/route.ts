/**
 * Horizon Portal — Task Board Filter Options API
 * GET /api/v1/tasks/filters
 *
 * Returns actual teams and sprints for populating the Task Board filter selectors.
 * - Authenticated access only.
 * - Teams: id, teamName (sorted alphabetically).
 * - Sprints: id, sprintName (sorted by start date descending).
 * - NO_CACHE_HEADERS applied.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { getAuthenticatedUserFromToken } from "@/lib/auth/user";
import { NO_CACHE_HEADERS } from "@/lib/tasks/auth";

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

    const [departments, teams, sprints] = await Promise.all([
      prisma.department.findMany({
        select: {
          id: true,
          name: true,
        },
        orderBy: {
          name: "asc",
        },
      }),
      prisma.team.findMany({
        select: {
          id: true,
          teamName: true,
          departmentId: true,
        },
        orderBy: {
          teamName: "asc",
        },
      }),
      prisma.sprint.findMany({
        select: {
          id: true,
          sprintName: true,
          startDate: true,
        },
        orderBy: {
          startDate: "desc",
        },
      }),
    ]);

    return NextResponse.json(
      {
        success: true,
        departments: departments.map((d) => ({ id: d.id, name: d.name })),
        teams: teams.map((t) => ({ id: t.id, teamName: t.teamName, departmentId: t.departmentId })),
        sprints: sprints.map((s) => ({ id: s.id, sprintName: s.sprintName })),
      },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (error) {
    console.error("Error in GET /api/v1/tasks/filters:", error);
    return NextResponse.json(
      { error: "Internal server error fetching filter options." },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}
