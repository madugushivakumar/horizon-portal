/**
 * Logout API Endpoint
 * POST /api/v1/auth/logout
 *
 * Clears the HTTP-only authentication session cookie.
 */

import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth/session";

export async function POST() {
  const response = NextResponse.json(
    { success: true, message: "Logged out successfully." },
    { status: 200 }
  );

  clearSessionCookie(response);
  return response;
}
