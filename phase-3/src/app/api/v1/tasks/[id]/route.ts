/**
 * Horizon Portal — Task Status Update & Concurrency API
 * PATCH /api/v1/tasks/[id]
 *
 * Implements optimistic concurrency control and atomic status transitions:
 * - Admin: Can update any task status.
 * - HR: Read-only access; returns HTTP 403 Forbidden.
 * - Manager: Authorized for led teams, self-assigned tasks, and direct reports.
 * - Employee: Authorized for self-assigned tasks only.
 * - Uses atomic conditional update matching `id` and `expectedVersion`.
 * - Increments version atomically: `version: { increment: 1 }`.
 * - If version conflicts: returns HTTP 409 with latest task status and version.
 * - Does not alter historical analytics date fields (startedDate, completedDate, cycleTime).
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { getAuthenticatedUserFromToken } from "@/lib/auth/user";
import { taskStatusUpdateSchema } from "@/lib/validations/task";
import {
  canUserModifyTasks,
  getTaskRoleScope,
  NO_CACHE_HEADERS,
  SAFE_EMPLOYEE_SELECT,
} from "@/lib/tasks/auth";
import { Prisma } from "@prisma/client";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
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

    const { role } = authResult.user;

    // 2. Strict HR read-only check
    if (!canUserModifyTasks(role)) {
      return NextResponse.json(
        { error: "Forbidden: HR role has read-only access to tasks." },
        { status: 403, headers: NO_CACHE_HEADERS }
      );
    }

    // 3. Validate task identifier parameter
    const { id: rawId } = await context.params;
    if (!rawId || typeof rawId !== "string" || rawId.trim().length === 0) {
      return NextResponse.json(
        { error: "Invalid task identifier provided." },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }
    const taskId = decodeURIComponent(rawId).trim();

    // 4. Parse and validate JSON request body
    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON payload in request body." },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    const parsedBody = taskStatusUpdateSchema.safeParse(rawBody);
    if (!parsedBody.success) {
      const firstError = parsedBody.error.issues[0]?.message || "Invalid status update payload.";
      return NextResponse.json(
        { error: firstError },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    const { status: newStatus, expectedVersion } = parsedBody.data;

    // 5. Derive role-based authorization scope
    const roleScope = await getTaskRoleScope(authResult.user);

    const updateConditions: Prisma.TaskWhereInput[] = [
      { id: taskId },
      { version: expectedVersion },
    ];

    if (roleScope) {
      updateConditions.push(roleScope);
    }

    // 6. Perform atomic conditional update
    const updateResult = await prisma.task.updateMany({
      where: {
        AND: updateConditions,
      },
      data: {
        status: newStatus,
        version: {
          increment: 1,
        },
      },
    });

    // 7. Case A: Exactly 1 row updated -> Fetch enriched task and return 200
    if (updateResult.count === 1) {
      const updatedTask = await prisma.task.findUnique({
        where: { id: taskId },
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
      });

      if (!updatedTask) {
        return NextResponse.json(
          { error: "Task updated but could not be retrieved." },
          { status: 500, headers: NO_CACHE_HEADERS }
        );
      }

      // Safe employee projection for the assignee
      let assignee = null;
      if (updatedTask.assigneeEmployeeId) {
        assignee = await prisma.employee.findUnique({
          where: { id: updatedTask.assigneeEmployeeId },
          select: SAFE_EMPLOYEE_SELECT,
        });
      }

      return NextResponse.json(
        {
          success: true,
          data: {
            ...updatedTask,
            assignee,
          },
        },
        { status: 200, headers: NO_CACHE_HEADERS }
      );
    }

    // 8. Case B: 0 rows updated -> Determine specific failure condition (404, 403, or 409)
    const existingTask = await prisma.task.findUnique({
      where: { id: taskId },
      select: {
        id: true,
        status: true,
        version: true,
        assigneeEmployeeId: true,
        teamId: true,
      },
    });

    // Subcase 1: Task does not exist in database -> 404 Not Found
    if (!existingTask) {
      return NextResponse.json(
        { error: `Task '${taskId}' not found.` },
        { status: 404, headers: NO_CACHE_HEADERS }
      );
    }

    // Subcase 2: User is not authorized to update this task -> 403 Forbidden
    if (roleScope !== null) {
      const isAuthorized = await prisma.task.findFirst({
        where: {
          AND: [{ id: taskId }, roleScope],
        },
        select: { id: true },
      });

      if (!isAuthorized) {
        return NextResponse.json(
          { error: "Forbidden: You are not authorized to update this task." },
          { status: 403, headers: NO_CACHE_HEADERS }
        );
      }
    }

    // Subcase 3: User is authorized and task exists, so version must have conflicted -> 409 Conflict
    return NextResponse.json(
      {
        success: false,
        code: "VERSION_CONFLICT",
        message:
          "This task was updated by another user. The latest task state has been returned.",
        data: {
          id: existingTask.id,
          status: existingTask.status,
          version: existingTask.version,
        },
      },
      { status: 409, headers: NO_CACHE_HEADERS }
    );
  } catch (error) {
    console.error("Error in PATCH /api/v1/tasks/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error updating task." },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}
