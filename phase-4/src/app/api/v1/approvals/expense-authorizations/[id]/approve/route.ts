/**
 * Corporate Expense Authorization Approval Decision Endpoint
 * POST /api/v1/approvals/expense-authorizations/[id]/approve
 */

import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { getAuthenticatedUserFromToken } from "@/lib/auth/user";
import { decideExpenseAuthorization } from "@/lib/expense-authorization/service";
import { logSecurityIncident } from "@/lib/security/audit";
import { idParamSchema, createValidationErrorResponse } from "@/lib/validations/common";

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
    const { id: rawId } = await context.params;
    const idValidation = idParamSchema.safeParse(rawId);
    if (!idValidation.success) {
      return createValidationErrorResponse(idValidation.error, undefined, NO_CACHE_HEADERS);
    }
    const id = idValidation.data;

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
      logSecurityIncident({
        event: "UNAUTHORIZED_ACCESS",
        resourceType: "SYSTEM",
        actorId: authResult.user.id,
        actorEmail: authResult.user.email,
        actorRole: authResult.user.role,
        targetResourceId: id,
        route: "/api/v1/approvals/expense-authorizations/[id]/approve",
        method: "POST",
        status: 403,
        reason: "Employee role attempted to approve corporate expense authorization.",
      });

      return NextResponse.json(
        { error: "Forbidden: Employees cannot approve corporate expense authorizations." },
        { status: 403, headers: NO_CACHE_HEADERS }
      );
    }

    let body: any = {};
    try {
      body = await request.json();
    } catch {
      // Empty body is acceptable for approve
    }

    const result = await decideExpenseAuthorization(authResult.user, id, {
      action: "APPROVE",
      approvalNotes: body.approvalNotes || null,
    });

    if (!result.success) {
      if (result.statusCode === 403) {
        logSecurityIncident({
          event: "IDOR_ACCESS_DENIED",
          resourceType: "SYSTEM",
          actorId: authResult.user.id,
          actorEmail: authResult.user.email,
          actorRole: authResult.user.role,
          targetResourceId: id,
          route: "/api/v1/approvals/expense-authorizations/[id]/approve",
          method: "POST",
          status: 403,
          reason: result.message,
        });
      }
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
    console.error("Error in POST /api/v1/approvals/expense-authorizations/[id]/approve:", error);
    return NextResponse.json(
      { error: "Internal server error approving expense authorization." },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}
