/**
 * Server-side Current User Resolution Helper
 * src/lib/auth/server-session.ts
 *
 * Securely resolves current user directly in Server Components and Layouts
 * without requiring redundant HTTP network roundtrips.
 */

import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME } from "./session";
import { getAuthenticatedUserFromToken, AuthenticatedUser } from "./user";

export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) {
      return null;
    }

    const auth = await getAuthenticatedUserFromToken(token);
    if (auth.success) {
      return auth.user;
    }
    return null;
  } catch (error) {
    console.error("Error fetching current user from server session:", error);
    return null;
  }
}
