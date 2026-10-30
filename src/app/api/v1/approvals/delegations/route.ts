/**
 * Manager Delegations API Endpoint
 * GET  /api/v1/approvals/delegations - List active and historical delegations
 * POST /api/v1/approvals/delegations - Create delegation with circular validation
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { getAuthenticatedUserFromToken } from "@/lib/auth/user";
import { validateDelegationChain } from "@/lib/leave/approval-service";
import { getActorSnapshot, generateAuditEventId } from "@/lib/audit/audit-logger";

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

    if (authResult.user.role === "Employee") {
      return NextResponse.json(
        { error: "Forbidden: Employees cannot view delegations." },
        { status: 403, headers: NO_CACHE_HEADERS }
      );
    }

    const where: any = {};
    if (authResult.user.role === "Manager" && authResult.user.employeeId) {
      where.OR = [
        { managerId: authResult.user.employeeId },
        { actingManagerId: authResult.user.employeeId },
      ];
    }

    const delegations = await prisma.managerDelegation.findMany({
      where,
      include: {
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            fullName: true,
            email: true,
          },
        },
        actingManager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(
      {
        success: true,
        data: delegations.map((d) => ({
          id: d.id,
          managerId: d.managerId,
          managerName: d.manager.fullName || `${d.manager.firstName} ${d.manager.lastName}`.trim(),
          actingManagerId: d.actingManagerId,
          actingManagerName:
            d.actingManager.fullName ||
            `${d.actingManager.firstName} ${d.actingManager.lastName}`.trim(),
          startDate: d.startDate.toISOString().split("T")[0],
          endDate: d.endDate.toISOString().split("T")[0],
          status: d.status,
          reason: d.reason,
          createdAt: d.createdAt.toISOString(),
        })),
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
    console.error("Error retrieving delegations:", error);
    return NextResponse.json(
      { error: "Internal server error retrieving delegations." },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}

export async function POST(request: NextRequest) {
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

    if (authResult.user.role === "Employee") {
      return NextResponse.json(
        { error: "Forbidden: Employees cannot create delegations." },
        { status: 403, headers: NO_CACHE_HEADERS }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid request payload." },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    const { managerId: requestedManagerId, actingManagerId, startDate, endDate, reason } = body;

    // Resolve which manager is delegating
    let managerId = requestedManagerId;
    if (authResult.user.role === "Manager") {
      managerId = authResult.user.employeeId;
    }

    if (!managerId || typeof managerId !== "string") {
      return NextResponse.json(
        { error: "Original manager ID is required." },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    if (!actingManagerId || typeof actingManagerId !== "string") {
      return NextResponse.json(
        { error: "Acting manager ID is required." },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "Start date and end date are required." },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    const start = new Date(`${startDate.split("T")[0]}T00:00:00.000Z`);
    const end = new Date(`${endDate.split("T")[0]}T23:59:59.999Z`);
    if (start > end) {
      return NextResponse.json(
        { error: "Start date cannot be after end date." },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    // 1. Verify acting manager exists and is active
    const actingManager = await prisma.employee.findUnique({
      where: { id: actingManagerId },
      select: { id: true, firstName: true, lastName: true, status: true },
    });

    if (!actingManager || actingManager.status !== "Active") {
      return NextResponse.json(
        { error: `Acting manager "${actingManagerId}" is not found or is inactive.` },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    // 2. Validate against circular or self delegation
    const chainValidation = await validateDelegationChain(managerId, actingManagerId);
    if (!chainValidation.valid) {
      return NextResponse.json(
        { error: chainValidation.error },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    // 3. Persist delegation record and audit log
    const created = await prisma.$transaction(async (tx) => {
      const delegation = await tx.managerDelegation.create({
        data: {
          managerId,
          actingManagerId,
          startDate: start,
          endDate: end,
          status: "Active",
          reason: typeof reason === "string" ? reason.trim() : null,
        },
      });

      const actorSnapshot = getActorSnapshot(authResult.user);
      const eventId = generateAuditEventId();
      await tx.auditLog.create({
        data: {
          eventId,
          actorId: actorSnapshot.actorId,
          actorEmail: actorSnapshot.actorEmail || null,
          actorRole: actorSnapshot.actorRole || null,
          action: "LEAVE_DELEGATED",
          employeeId: managerId,
          fieldName: "actingManagerId",
          oldValue: null,
          newValue: actingManagerId,
          details: JSON.stringify({
            delegationId: delegation.id,
            startDate: startDate.split("T")[0],
            endDate: endDate.split("T")[0],
            reason: reason || null,
          }),
        },
      });

      return delegation;
    });

    return NextResponse.json(
      {
        success: true,
        message: "Manager delegation established successfully.",
        data: {
          id: created.id,
          managerId: created.managerId,
          actingManagerId: created.actingManagerId,
          startDate: created.startDate.toISOString().split("T")[0],
          endDate: created.endDate.toISOString().split("T")[0],
          status: created.status,
        },
      },
      { status: 201, headers: NO_CACHE_HEADERS }
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
    console.error("Error creating delegation:", error);
    return NextResponse.json(
      { error: "Internal server error creating delegation." },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}
