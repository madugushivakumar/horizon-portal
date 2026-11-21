/**
 * Admin Audit Logs API Endpoint
 * GET /api/v1/admin/audit
 *
 * Returns paginated, filterable immutable audit logs for authorized HR and Admin users.
 * Unauthorized roles (Employee, Manager) are strictly denied with HTTP 403.
 */

import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { getAuthenticatedUserFromToken } from "@/lib/auth/user";
import { queryAuditLogs } from "@/lib/audit/audit-logger";
import { auditLogsQuerySchema } from "@/lib/validations/audit";
import { createValidationErrorResponse } from "@/lib/validations/common";

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

    const role = authResult.user.role;
    if (role !== "Admin" && role !== "HR") {
      return NextResponse.json(
        { error: "Forbidden: HR or Admin privileges are required to access audit compliance records." },
        { status: 403, headers: NO_CACHE_HEADERS }
      );
    }

    const { searchParams } = new URL(request.url);

    const queryValidation = auditLogsQuerySchema.safeParse({
      employeeId: searchParams.get("employeeId") ?? undefined,
      action: searchParams.get("action") ?? undefined,
      actorId: searchParams.get("actorId") ?? undefined,
      page: searchParams.get("page") ?? undefined,
      pageSize: searchParams.get("pageSize") || searchParams.get("limit") || undefined,
    });

    if (!queryValidation.success) {
      return createValidationErrorResponse(queryValidation.error, undefined, NO_CACHE_HEADERS);
    }

    const { employeeId, action, actorId, page, pageSize } = queryValidation.data;

    const result = await queryAuditLogs({
      employeeId,
      action,
      actorId,
      page,
      pageSize,
    });

    return NextResponse.json(result, { status: 200, headers: NO_CACHE_HEADERS });
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
    console.error("Audit log query error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve audit log records." },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}
