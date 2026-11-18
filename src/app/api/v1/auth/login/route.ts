/**
 * Login API Endpoint
 * POST /api/v1/auth/login
 *
 * Validates credentials, checks account status, issues signed JWT,
 * and sets HTTP-only session cookie.
 */

import { NextRequest, NextResponse } from "next/server";
import { unstable_rethrow } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { createAuthToken } from "@/lib/auth/token";
import { setSessionCookie } from "@/lib/auth/session";
import { loginInputSchema } from "@/lib/validations/auth";
import {
  checkLoginRateLimit,
  recordFailedLoginAttempt,
  recordBlockedLoginAttempt,
  recordSuccessfulLogin,
  createRateLimitResponse,
} from "@/lib/security/rate-limit";

export async function POST(request: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request payload. Expected JSON body." },
        { status: 400 }
      );
    }

    const validation = loginInputSchema.safeParse(body);
    if (!validation.success) {
      const fieldErrors = validation.error.flatten().fieldErrors;
      const firstErrorMessage =
        validation.error.issues[0]?.message || "Email and password are required.";
      return NextResponse.json(
        { error: firstErrorMessage, details: fieldErrors },
        { status: 400 }
      );
    }

    const { email: normalizedEmail, password } = validation.data;

    // Rate-limit check across IP and Account dimensions
    const rateLimitDecision = await checkLoginRateLimit(request, normalizedEmail);
    if (!rateLimitDecision.allowed) {
      // SEC-FIND-06 Remediation: Blocked attempt contributes to IP throttling without extending account lockout
      await recordBlockedLoginAttempt(request);
      return createRateLimitResponse(rateLimitDecision);
    }

    // Look up user by email
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // If user does not exist, return generic error (prevent email enumeration)
    if (!user) {
      await recordFailedLoginAttempt(request, normalizedEmail);
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    // Check account status
    if (!user.isActive) {
      await recordFailedLoginAttempt(request, normalizedEmail);
      return NextResponse.json(
        { error: "This account has been deactivated. Please contact support." },
        { status: 403 }
      );
    }

    // Verify password against stored bcrypt hash
    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      await recordFailedLoginAttempt(request, normalizedEmail);
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    // Reset account failure counter on successful authentication
    await recordSuccessfulLogin(request, normalizedEmail);

    // Issue signed token
    const token = await createAuthToken({
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      employeeId: user.employeeId,
    });

    // Build success response with safe public user info (never password hash)
    const response = NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          employeeId: user.employeeId,
        },
      },
      { status: 200 }
    );

    // Set secure HTTP-only cookie
    setSessionCookie(response, token);

    return response;
  } catch (error) {
    unstable_rethrow(error);
    if (
      typeof error === "object" &&
      error !== null &&
      "digest" in error &&
      typeof (error as { digest?: unknown }).digest === "string" &&
      (error as { digest: string }).digest.startsWith("NEXT_")
    ) {
      throw error;
    }
    console.error("Login endpoint failure:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during login. Please try again." },
      { status: 500 }
    );
  }
}
