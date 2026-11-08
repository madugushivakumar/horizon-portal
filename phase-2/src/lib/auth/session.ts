/**
 * Session & Cookie Management
 * src/lib/auth/session.ts
 *
 * Manages HTTP-only authentication cookies for `horizon_session`.
 * Security: httpOnly, sameSite: lax, secure in production, explicit maxAge.
 */

import { NextResponse } from "next/server";
import { AuthTokenPayload, verifyAuthToken } from "./token";

export const SESSION_COOKIE_NAME = "horizon_session";
export const SESSION_MAX_AGE_SECONDS = 8 * 60 * 60; // 8 hours

/**
 * Returns security cookie attributes configured for the current environment.
 */
export function getSessionCookieOptions() {
  const isProduction = process.env.NODE_ENV === "production";
  return {
    name: SESSION_COOKIE_NAME,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: isProduction,
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}

/**
 * Appends the set-cookie header on a NextResponse for the authenticated session.
 */
export function setSessionCookie(response: NextResponse, token: string): void {
  const options = getSessionCookieOptions();
  response.cookies.set({
    ...options,
    value: token,
  });
}

/**
 * Clears the session cookie on a NextResponse during logout or invalidation.
 */
export function clearSessionCookie(response: NextResponse): void {
  const options = getSessionCookieOptions();
  response.cookies.set({
    ...options,
    value: "",
    maxAge: 0,
    expires: new Date(0),
  });
}

/**
 * Extracts and verifies the session token from a cookie string or cookie store.
 */
export async function getVerifiedSessionFromToken(
  token: string | undefined | null
): Promise<AuthTokenPayload | null> {
  if (!token) return null;
  return verifyAuthToken(token);
}
