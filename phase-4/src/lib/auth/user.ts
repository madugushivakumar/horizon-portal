/**
 * Authenticated User Resolution & Database Verification
 * src/lib/auth/user.ts
 *
 * Ensures authorization is never based on stale token claims:
 * 1. Verifies signed JWT token.
 * 2. Fetches current user from SQLite database.
 * 3. Enforces account active status (deactivated accounts rejected immediately).
 * 4. Returns current database role.
 */

import { prisma } from "@/lib/prisma";
import { verifyAuthToken, AuthTokenPayload } from "./token";

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: "Admin" | "HR" | "Manager" | "Employee" | string;
  isActive: boolean;
  employeeId: string | null;
  employee?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    department?: { id: string; name: string } | null;
    role?: { id: string; name: string } | null;
  } | null;
}

export type AuthResult =
  | { success: true; user: AuthenticatedUser }
  | { success: false; status: 401 | 403 | 500; message: string };

/**
 * Resolves and validates the authenticated user from a session token.
 * Performs database lookup to ensure account is active and role is current.
 */
export async function getAuthenticatedUserFromToken(
  token: string | undefined | null
): Promise<AuthResult> {
  if (!token) {
    return { success: false, status: 401, message: "Authentication required. No session found." };
  }

  const payload: AuthTokenPayload | null = await verifyAuthToken(token);
  if (!payload || !payload.sub) {
    return { success: false, status: 401, message: "Invalid or expired session token." };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            department: { select: { id: true, name: true } },
            role: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!user) {
      return { success: false, status: 401, message: "User account no longer exists." };
    }

    if (!user.isActive) {
      return {
        success: false,
        status: 403,
        message: "This account has been deactivated. Please contact your administrator.",
      };
    }

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
        employeeId: user.employeeId,
        employee: user.employee,
      },
    };
  } catch (error) {
    console.error("Database error during user authentication:", error);
    return { success: false, status: 500, message: "Authentication service error." };
  }
}
