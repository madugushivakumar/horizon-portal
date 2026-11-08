/**
 * Login API Endpoint
 * POST /api/v1/auth/login
 *
 * Validates credentials, checks account status, issues signed JWT,
 * and sets HTTP-only session cookie.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { createAuthToken } from "@/lib/auth/token";
import { setSessionCookie } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  try {
    let body: { email?: unknown; password?: unknown };
    try {
      body = (await request.json()) as { email?: unknown; password?: unknown };
    } catch {
      return NextResponse.json(
        { error: "Invalid request payload. Expected JSON body." },
        { status: 400 }
      );
    }

    const email = typeof body?.email === "string" ? body.email : undefined;
    const password = typeof body?.password === "string" ? body.password : undefined;

    // Input validation
    if (!email || typeof email !== "string" || !password || typeof password !== "string") {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (normalizedEmail.length > 255 || password.length > 255) {
      return NextResponse.json(
        { error: "Invalid email or password length." },
        { status: 400 }
      );
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
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    // Check account status
    if (!user.isActive) {
      return NextResponse.json(
        { error: "This account has been deactivated. Please contact support." },
        { status: 403 }
      );
    }

    // Verify password against stored bcrypt hash
    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

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
    console.error("Login endpoint failure:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during login. Please try again." },
      { status: 500 }
    );
  }
}
