/**
 * Corporate Expense Authorization Detail Endpoint
 * GET /api/v1/approvals/expense-authorizations/[id]
 */

import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { getAuthenticatedUserFromToken } from "@/lib/auth/user";
import { getExpenseAuthorizationById } from "@/lib/expense-authorization/service";
import { idParamSchema, createValidationErrorResponse } from "@/lib/validations/common";

const NO_CACHE_HEADERS = {
  "Cache-Control": "private, no-cache, no-store, must-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

export async function GET(
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

    const record = await getExpenseAuthorizationById(authResult.user, id);
    if (!record) {
      return NextResponse.json(
        { error: `Corporate expense authorization with ID "${id}" was not found.` },
        { status: 404, headers: NO_CACHE_HEADERS }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: record,
      },
      { status: 200, headers: NO_CACHE_HEADERS }
    );
  } catch (error: any) {
    if (error?.message?.startsWith("Forbidden")) {
      return NextResponse.json(
        { error: error.message },
        { status: 403, headers: NO_CACHE_HEADERS }
      );
    }
    console.error("Error in GET /api/v1/approvals/expense-authorizations/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error retrieving expense authorization details." },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}
