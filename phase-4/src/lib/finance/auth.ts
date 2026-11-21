/**
 * Horizon Portal — Finance Module Authorization Helper
 * src/lib/finance/auth.ts
 *
 * Enforces strict, Admin-only role authorization across all Finance Snapshot APIs
 * and server-rendered routes (/admin/finance/*).
 *
 * INVARIANTS:
 * - Only users with role === "Admin" are authorized.
 * - HR, Manager, and Employee roles receive HTTP 403 Forbidden.
 * - Unauthenticated requests receive HTTP 401 Unauthorized.
 * - Responses include NO_CACHE_HEADERS to prevent caching of sensitive financial telemetry.
 */

import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { getAuthenticatedUserFromToken, AuthenticatedUser } from "@/lib/auth/user";

export const NO_CACHE_HEADERS = {
  "Cache-Control": "private, no-cache, no-store, must-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

export type FinanceAuthSuccess = {
  authorized: true;
  user: AuthenticatedUser;
};

export type FinanceAuthFailure = {
  authorized: false;
  status: 401 | 403;
  error: string;
  response: NextResponse;
};

export type FinanceAuthResult = FinanceAuthSuccess | FinanceAuthFailure;

/**
 * Reusable API route authenticator and authorizer for Finance endpoints.
 * Extracts session from either cookie or Bearer token header.
 * Enforces strict Admin-only role check.
 */
export async function authenticateAdminRequest(request: NextRequest): Promise<FinanceAuthResult> {
  const token =
    request.cookies.get(SESSION_COOKIE_NAME)?.value ||
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  const authResult = await getAuthenticatedUserFromToken(token);
  if (!authResult.success) {
    const status = authResult.status === 403 ? 403 : 401;
    return {
      authorized: false,
      status,
      error: authResult.message,
      response: NextResponse.json(
        { error: authResult.message },
        { status, headers: NO_CACHE_HEADERS }
      ),
    };
  }

  // Strict Admin-only role check
  if (authResult.user.role !== "Admin") {
    const error = "Forbidden: Administrator privileges are strictly required to access finance records.";
    return {
      authorized: false,
      status: 403,
      error,
      response: NextResponse.json(
        { error },
        { status: 403, headers: NO_CACHE_HEADERS }
      ),
    };
  }

  return {
    authorized: true,
    user: authResult.user,
  };
}

/**
 * Validates whether a user has the Admin role.
 * Used by server components and page components for server-side route protection.
 */
export function isAuthorizedAdmin(user: AuthenticatedUser | null | undefined): boolean {
  if (!user || !user.isActive) {
    return false;
  }
  return user.role === "Admin";
}
