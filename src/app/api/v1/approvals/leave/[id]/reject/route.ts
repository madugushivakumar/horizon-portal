/**
 * Leave Rejection Decision Endpoint
 * POST /api/v1/approvals/leave/[id]/reject
 *
 * Transactional rejection operation:
 * - Requires non-empty, non-whitespace rejection reason (HTTP 400).
 * - Server-side authorization check (team boundary for managers, org-wide for HR).
 * - Rejects self-rejection attempts (HTTP 403).
 * - Enforces state is strictly "Pending" (HTTP 409 if already decided).
 * - Atomically decrements pendingDays while preserving available leave balances.
 * - Records audit trail log and dispatches decision notification with reason to employee.
 */

import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { getAuthenticatedUserFromToken } from "@/lib/auth/user";
import { rejectLeaveRequest } from "@/lib/leave/approval-service";

const NO_CACHE_HEADERS = {
  "Cache-Control": "private, no-cache, no-store, must-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

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
        { error: "Forbidden: Employees cannot reject leave requests." },
        { status: 403, headers: NO_CACHE_HEADERS }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid request payload. Expected JSON object with 'reason'." },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    const { reason } = body;
    if (typeof reason !== "string" || !reason.trim()) {
      return NextResponse.json(
        { error: "A valid rejection reason is mandatory. Whitespace-only reasons are not accepted." },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    const result = await rejectLeaveRequest(authResult.user, id, reason);

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: result.statusCode, headers: NO_CACHE_HEADERS }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: result.message,
        data: result.data,
      },
      { status: result.statusCode, headers: NO_CACHE_HEADERS }
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
    console.error("Error rejecting leave request:", error);
    return NextResponse.json(
      { error: "Internal server error rejecting leave request." },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}
