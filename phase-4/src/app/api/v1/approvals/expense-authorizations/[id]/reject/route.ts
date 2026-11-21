/**
 * Corporate Expense Authorization Rejection Decision Endpoint
 * POST /api/v1/approvals/expense-authorizations/[id]/reject
 */

import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { getAuthenticatedUserFromToken } from "@/lib/auth/user";
import { decideExpenseAuthorization } from "@/lib/expense-authorization/service";
import { logSecurityIncident } from "@/lib/security/audit";
import { idParamSchema, createValidationErrorResponse } from "@/lib/validations/common";
import { expenseAuthorizationDecisionSchema } from "@/lib/validations/expense-authorization";

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
        route: "/api/v1/approvals/expense-authorizations/[id]/reject",
        method: "POST",
        status: 403,
        reason: "Employee role attempted to reject corporate expense authorization.",
      });

      return NextResponse.json(
        { error: "Forbidden: Employees cannot reject corporate expense authorizations." },
        { status: 403, headers: NO_CACHE_HEADERS }
      );
    }

    let body: any = {};
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Malformed JSON body in request. Rejection requires a reason." },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    const payload = {
      action: "REJECT",
      rejectionReason: body.rejectionReason || body.reason,
      approvalNotes: body.approvalNotes || null,
    };

    const validation = expenseAuthorizationDecisionSchema.safeParse(payload);
    if (!validation.success) {
      return createValidationErrorResponse(validation.error);
    }

    const result = await decideExpenseAuthorization(authResult.user, id, validation.data);

    if (!result.success) {
      if (result.statusCode === 403) {
        logSecurityIncident({
          event: "IDOR_ACCESS_DENIED",
          resourceType: "SYSTEM",
          actorId: authResult.user.id,
          actorEmail: authResult.user.email,
          actorRole: authResult.user.role,
          targetResourceId: id,
          route: "/api/v1/approvals/expense-authorizations/[id]/reject",
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
    console.error("Error in POST /api/v1/approvals/expense-authorizations/[id]/reject:", error);
    return NextResponse.json(
      { error: "Internal server error rejecting expense authorization." },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}
