/**
 * Leave Approval Decision Endpoint
 * POST /api/v1/approvals/leave/[id]/approve
 *
 * Transactional approval operation:
 * - Server-side authorization check (team boundary for managers, org-wide for HR).
 * - Rejects self-approval attempts (HTTP 403).
 * - Enforces state is strictly "Pending" (HTTP 409 if already decided).
 * - Atomically deducts leave balance and releases pendingDays.
 * - Records audit trail log and dispatches decision notification to employee.
 */

import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { getAuthenticatedUserFromToken } from "@/lib/auth/user";
import { approveLeaveRequest } from "@/lib/leave/approval-service";

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
        { error: "Forbidden: Employees cannot approve leave requests." },
        { status: 403, headers: NO_CACHE_HEADERS }
      );
    }

    const result = await approveLeaveRequest(authResult.user, id);

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
    console.error("Error approving leave request:", error);
    return NextResponse.json(
      { error: "Internal server error approving leave request." },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}
