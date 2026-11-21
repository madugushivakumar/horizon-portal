/**
 * Unified Multi-Domain Approvals Queue API Endpoint
 * GET /api/v1/approvals
 *
 * Scoped query endpoint supporting:
 * - Domain filtering: domain=all | domain=leave | domain=corporate-expense
 * - Status filtering: status=all | status=pending | status=approved | status=rejected
 * - Search by requester, title, reference, or vendor
 * - Manager reporting-chain boundary enforcement
 * - Org-wide scoping for HR and Admin
 * - Unified KPI summary metrics across leave and expense authorizations
 */

import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { getAuthenticatedUserFromToken } from "@/lib/auth/user";
import { getUnifiedApprovals } from "@/lib/approvals/unified-service";
import {
  unifiedApprovalsQuerySchema,
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

    const { role } = authResult.user;
    if (role === "Employee") {
      return NextResponse.json(
        { error: "Forbidden: Employees do not possess permission to view the approval center queue." },
        { status: 403, headers: NO_CACHE_HEADERS }
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

    const result = await getUnifiedApprovals(authResult.user, validation.data);

    return NextResponse.json(
      {
        success: true,
        data: result.items,
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
    console.error("Error retrieving unified approvals queue:", error);
    return NextResponse.json(
      { error: "Internal server error retrieving unified approval queue." },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}
