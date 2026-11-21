/**
 * Horizon Portal — AI Insights Authorization & Access Control
 * src/lib/hr-insights/auth.ts
 *
 * Implements strict server-side RBAC scoping for Day 15: AI Insights:
 * - Admin: Allowed (Full organization-wide access).
 * - HR: Allowed (Full organization-wide access).
 * - Manager: HTTP 403 Forbidden.
 * - Employee: HTTP 403 Forbidden.
 * - Unauthenticated: HTTP 401 Unauthorized.
 */

import { AuthenticatedUser } from "@/lib/auth/user";

export const NO_CACHE_HEADERS = {
  "Cache-Control": "private, no-cache, no-store, must-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

export interface HRInsightsAuthResult {
  isAuthorized: boolean;
  role: string;
  errorMessage?: string;
  statusCode?: number;
}

/**
 * Validates whether the authenticated user has sufficient role permissions
 * to access AI Insights data and filters.
 */
export function verifyHRInsightsAccess(user: AuthenticatedUser | null): HRInsightsAuthResult {
  if (!user) {
    return {
      isAuthorized: false,
      role: "ANONYMOUS",
      errorMessage: "Unauthorized: Active session required to access AI Insights.",
      statusCode: 401,
    };
  }

  const { role } = user;
  if (role !== "Admin" && role !== "HR") {
    return {
      isAuthorized: false,
      role,
      errorMessage: "Forbidden: AI Insights are strictly restricted to Admin and HR roles.",
      statusCode: 403,
    };
  }

  return {
    isAuthorized: true,
    role,
  };
}
