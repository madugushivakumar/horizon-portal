/**
 * Current User API Endpoint
 * GET /api/v1/auth/me
 *
 * Identifies the currently authenticated user from the HTTP-only session cookie.
 * Validates against database to ensure account is active and role is current.
 */

import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, clearSessionCookie } from "@/lib/auth/session";
import { getAuthenticatedUserFromToken } from "@/lib/auth/user";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

    const authResult = await getAuthenticatedUserFromToken(token);

    if (!authResult.success) {
      const response = NextResponse.json(
        { error: authResult.message },
        { status: authResult.status }
      );

      // If token was invalid or account deactivated, clear the stale cookie
      if (token) {
        clearSessionCookie(response);
      }

      return response;
    }

    // Return safe public user profile
    return NextResponse.json(
      {
        success: true,
        user: {
          id: authResult.user.id,
          email: authResult.user.email,
          name: authResult.user.name,
          role: authResult.user.role,
          employeeId: authResult.user.employeeId,
          isActive: authResult.user.isActive,
          employee: authResult.user.employee,
        },
      },
      { status: 200 }
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
    console.error("Current user endpoint error:", error);
    return NextResponse.json(
      { error: "Internal server error fetching authenticated session." },
      { status: 500 }
    );
  }
}
