/**
 * Horizon Portal — Team Task Board API
 * GET /api/v1/tasks
 *
 * Scoped task retrieval for the Kanban board:
 * - Admin & HR: All organization tasks.
 * - Manager: Tasks for teams led + self-assigned + direct reports.
 * - Employee: Tasks assigned to self only.
 * - Filters: teamId, sprintId, pagination (page, pageSize).
 * - Excludes "Cancelled" tasks by default for Kanban board view.
 * - Safe projection for employee information (no salaries/sensitive data).
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { getAuthenticatedUserFromToken } from "@/lib/auth/user";
import { taskQuerySchema } from "@/lib/validations/task";
import {
  getTaskRoleScope,
  NO_CACHE_HEADERS,
  SAFE_EMPLOYEE_SELECT,
} from "@/lib/tasks/auth";
import { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate user from session cookie or Authorization header
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

    // 2. Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams;
    const rawQuery = {
      teamId: searchParams.get("teamId") ?? undefined,
      sprintId: searchParams.get("sprintId") ?? undefined,
      page: searchParams.get("page") ?? undefined,
      pageSize: searchParams.get("pageSize") ?? undefined,
    };

    const parsedQuery = taskQuerySchema.safeParse(rawQuery);
    if (!parsedQuery.success) {
      const firstError = parsedQuery.error.issues[0]?.message || "Invalid query parameters.";
      return NextResponse.json(
        { error: firstError },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    const { teamId, sprintId, page, pageSize } = parsedQuery.data;

    // 3. Build role-based scope and query conditions
    const roleScope = await getTaskRoleScope(authResult.user);

    const andConditions: Prisma.TaskWhereInput[] = [
      // Exclude Cancelled tasks by default from Kanban board
      { status: { not: "Cancelled" } },
    ];

    if (roleScope) {
      andConditions.push(roleScope);
    }

    if (teamId) {
      andConditions.push({ teamId });
    }

    if (sprintId) {
      andConditions.push({ sprintId });
    }

    const where: Prisma.TaskWhereInput = {
      AND: andConditions,
    };

    const skip = (page - 1) * pageSize;
    const take = pageSize;

    // 4. Fetch matching tasks and total count in parallel
    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        skip,
        take,
        orderBy: [{ dueDate: "asc" }, { id: "asc" }],
        select: {
          id: true,
          teamId: true,
          sprintId: true,
          assigneeEmployeeId: true,
          taskType: true,
          priority: true,
          storyPoints: true,
          createdDate: true,
          startedDate: true,
          dueDate: true,
          completedDate: true,
          status: true,
          version: true,
          createdAt: true,
          updatedAt: true,
          team: {
            select: {
              id: true,
              teamName: true,
            },
          },
          sprint: {
            select: {
              id: true,
              sprintName: true,
            },
          },
        },
      }),
      prisma.task.count({ where }),
    ]);

    // 5. Safely resolve assignee employee profiles (avoid N+1 and omit sensitive data)
    const assigneeIds = Array.from(
      new Set(tasks.map((t) => t.assigneeEmployeeId).filter(Boolean))
    );

    const assignees =
      assigneeIds.length > 0
        ? await prisma.employee.findMany({
            where: { id: { in: assigneeIds } },
            select: SAFE_EMPLOYEE_SELECT,
          })
        : [];

    const assigneeMap = new Map(assignees.map((emp) => [emp.id, emp]));

    const enrichedTasks = tasks.map((task) => ({
      ...task,
      assignee: assigneeMap.get(task.assigneeEmployeeId) || null,
    }));

    const totalPages = Math.ceil(total / pageSize);

    // 6. Return response
    return NextResponse.json(
      {
        success: true,
        data: enrichedTasks,
        pagination: {
          page,
          pageSize,
          total,
          totalPages,
        },
      },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (error) {
    console.error("Error in GET /api/v1/tasks:", error);
    return NextResponse.json(
      { error: "Internal server error fetching tasks." },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}
