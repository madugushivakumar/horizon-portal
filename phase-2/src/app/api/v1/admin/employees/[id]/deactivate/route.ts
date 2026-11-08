/**
 * Admin Safe Employee Deactivation Endpoint
 * POST /api/v1/admin/employees/[id]/deactivate
 *
 * Implements safe, reversible deactivation:
 * - Updates employee status to "Inactive"
 * - Deactivates linked portal User accounts (enforcing active user security policy)
 * - Preserves all historical records (leave requests, payslips, attendance, notifications)
 * - Records immutable audit trail entry atomically with previous and new status
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { getAuthenticatedUserFromToken } from "@/lib/auth/user";
import {
  getActorSnapshot,
  logEmployeeDeactivation,
} from "@/lib/audit/audit-logger";

const NO_CACHE_HEADERS = {
  "Cache-Control": "private, no-cache, no-store, must-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

interface RouteContext {
  params: Promise<{ id: string }>;
}

async function authenticateAdminOrHR(request: NextRequest) {
  const token =
    request.cookies.get(SESSION_COOKIE_NAME)?.value ||
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  const authResult = await getAuthenticatedUserFromToken(token);
  if (!authResult.success) {
    return {
      authorized: false as const,
      status: authResult.status,
      error: authResult.message,
    };
  }

  const role = authResult.user.role;
  if (role !== "Admin" && role !== "HR") {
    return {
      authorized: false as const,
      status: 403,
      error: "Forbidden: HR or Admin privileges are required to deactivate employee records.",
    };
  }

  return { authorized: true as const, user: authResult.user };
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const auth = await authenticateAdminOrHR(request);
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status, headers: NO_CACHE_HEADERS }
      );
    }

    const { id: rawId } = await context.params;
    const employeeId = decodeURIComponent(rawId || "").trim();

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        users: { select: { id: true, email: true, isActive: true } },
      },
    });

    if (!employee) {
      return NextResponse.json(
        { error: `Employee with ID "${employeeId}" not found.` },
        { status: 404, headers: NO_CACHE_HEADERS }
      );
    }

    let reason: string | undefined = undefined;
    try {
      const body = await request.json();
      if (body && typeof body.reason === "string") {
        reason = body.reason.trim();
      }
    } catch {
      // Body is optional
    }

    const previousStatus = employee.status;
    const actor = getActorSnapshot(auth.user);

    // Atomic transaction: update employee status, deactivate linked users, and persist audit record
    await prisma.$transaction(async (tx) => {
      // 1. Mark employee status as Inactive
      await tx.employee.update({
        where: { id: employeeId },
        data: { status: "Inactive" },
      });

      // 2. Deactivate any associated portal user accounts
      await tx.user.updateMany({
        where: { employeeId },
        data: { isActive: false },
      });

      // 3. Persist audit record
      await logEmployeeDeactivation(
        tx,
        actor,
        employeeId,
        previousStatus,
        reason || "Deactivated through Admin Employee Console"
      );
    });

    return NextResponse.json(
      {
        success: true,
        message: `Employee "${employee.fullName || employee.id}" has been safely deactivated.`,
        data: {
          id: employee.id,
          previousStatus,
          status: "Inactive",
          linkedUsersDeactivated: employee.users.length,
        },
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
    console.error("Employee deactivation error:", error);
    return NextResponse.json(
      { error: "Failed to deactivate employee record." },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}
