/**
 * JWT Token Signing & Verification
 * src/lib/auth/token.ts
 *
 * Implements signed tokens using the `jose` library (HS256).
 * Cryptographically verifies signatures on every authenticated request.
 */

import { SignJWT, jwtVerify } from "jose";

export interface AuthTokenPayload {
  sub: string; // User ID
  email: string;
  role: "Admin" | "HR" | "Manager" | "Employee" | string;
  name?: string;
  employeeId?: string | null;
}

const DEFAULT_EXPIRATION = "8h";

function getSecretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.trim().length === 0) {
    throw new Error(
      "AUTH_SECRET environment variable is missing or empty. Please configure AUTH_SECRET in .env."
    );
  }
  return new TextEncoder().encode(secret);
}

/**
 * Creates and signs a compact JWT token.
 */
export async function createAuthToken(
  payload: AuthTokenPayload,
  expiresIn: string = DEFAULT_EXPIRATION
): Promise<string> {
  const secretKey = getSecretKey();

  return new SignJWT({
    email: payload.email,
    role: payload.role,
    name: payload.name,
    employeeId: payload.employeeId,
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secretKey);
}

/**
 * Verifies a compact JWT token signature and expiration.
 * Returns the decoded payload or null if verification fails.
 */
export async function verifyAuthToken(token: string): Promise<AuthTokenPayload | null> {
  if (!token || typeof token !== "string") {
    return null;
  }

  try {
    const secretKey = getSecretKey();
    const { payload } = await jwtVerify(token, secretKey, {
      algorithms: ["HS256"],
    });

    if (!payload.sub) {
      return null;
    }

    return {
      sub: payload.sub,
      email: (payload.email as string) ?? "",
      role: (payload.role as string) ?? "Employee",
      name: payload.name as string | undefined,
      employeeId: payload.employeeId as string | null | undefined,
    };
  } catch {
    // Expired, malformed, or invalid signature returns null
    return null;
  }
}
