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
    const statusParam = searchParams.get("status") || "Pending";
    const departmentId = searchParams.get("department") || searchParams.get("departmentId") || undefined;
    const leaveTypeCode = searchParams.get("leaveType") || searchParams.get("leaveTypeCode") || undefined;
    const search = searchParams.get("search") || undefined;
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "25", 10);
    const sortBy = (searchParams.get("sortBy") as any) || "appliedOn";
    const sortOrder = (searchParams.get("sortOrder") as any) || "desc";

    const result = await getApprovalQueue(authResult.user, {
      status: statusParam,
      departmentId,
      leaveTypeCode,
      search,
      startDate,
      endDate,
      page,
      pageSize,
      sortBy,
      sortOrder,
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
