/**
 * Corporate Expense Authorizations Collection API Endpoint
 * GET  /api/v1/approvals/expense-authorizations — Retrieve expense authorization queue
 * POST /api/v1/approvals/expense-authorizations — Submit new corporate expense authorization
 */

import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { getAuthenticatedUserFromToken } from "@/lib/auth/user";
import {
  getExpenseAuthorizationQueue,
  createExpenseAuthorization,
} from "@/lib/expense-authorization/service";
import {
  unifiedApprovalsQuerySchema,
  createExpenseAuthorizationSchema,
  createValidationErrorResponse,
} from "@/lib/validations";

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

    const searchParams = request.nextUrl.searchParams;
    const queryObj: Record<string, string | undefined> = {};
    for (const [key, value] of searchParams.entries()) {
      queryObj[key] = value;
    }

    const validation = unifiedApprovalsQuerySchema.safeParse(queryObj);
    if (!validation.success) {
      return createValidationErrorResponse(validation.error);
    }

    const result = await getExpenseAuthorizationQueue(authResult.user, validation.data);

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
    console.error("Error in GET /api/v1/approvals/expense-authorizations:", error);
    return NextResponse.json(
      { error: "Internal server error retrieving expense authorizations." },
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

    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Malformed JSON body in request." },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    const validation = createExpenseAuthorizationSchema.safeParse(body);
    if (!validation.success) {
      return createValidationErrorResponse(validation.error);
    }

    const created = await createExpenseAuthorization(authResult.user, validation.data);

    return NextResponse.json(
      {
        success: true,
        message: `Corporate expense authorization ${created.referenceNumber} created successfully.`,
        data: created,
      },
      { status: 201, headers: NO_CACHE_HEADERS }
    );
  } catch (error: any) {
    console.error("Error in POST /api/v1/approvals/expense-authorizations:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error creating expense authorization." },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}
