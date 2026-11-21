/**
 * Leave Approval Queue API Endpoint
 * GET /api/v1/approvals/leave
 *
 * Scoped query endpoint for managers and HR:
 * - Managers only receive pending/historical requests belonging to their authorized team or delegated reports.
 * - HR and Admin receive organization-wide requests.
 * - Employees receive HTTP 403 Forbidden.
 * - Default view filters for status: "Pending".
 */

import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { getAuthenticatedUserFromToken } from "@/lib/auth/user";
import { getApprovalQueue } from "@/lib/leave/approval-service";
import { leaveApprovalQueueQuerySchema, createValidationErrorResponse } from "@/lib/validations";

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

    const { role } = authResult.user;
    if (role === "Employee") {
      return NextResponse.json(
        { error: "Forbidden: Employees do not have permission to view the approval queue." },
        { status: 403, headers: NO_CACHE_HEADERS }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const queryObj: Record<string, string | undefined> = {};
    for (const [key, value] of searchParams.entries()) {
      queryObj[key] = value;
    }

    const validation = leaveApprovalQueueQuerySchema.safeParse(queryObj);
    if (!validation.success) {
      return createValidationErrorResponse(validation.error);
    }

    const validQuery = validation.data;
    const departmentId = validQuery.department || validQuery.departmentId;
    const leaveTypeCode = validQuery.leaveType || validQuery.leaveTypeCode;

    const result = await getApprovalQueue(authResult.user, {
      status: validQuery.status,
      departmentId,
      leaveTypeCode,
      search: validQuery.search,
      startDate: validQuery.startDate,
      endDate: validQuery.endDate,
      page: validQuery.page,
      pageSize: validQuery.pageSize,
      sortBy: validQuery.sortBy,
      sortOrder: validQuery.sortOrder,
    });

    return NextResponse.json(
      {
        success: true,
        data: result.data,
        pagination: result.pagination,
        summary: result.summary,
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
    console.error("Error retrieving approval queue:", error);
    return NextResponse.json(
      { error: "Internal server error retrieving approval queue." },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}
