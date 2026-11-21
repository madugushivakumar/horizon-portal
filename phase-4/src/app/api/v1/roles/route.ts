/**
 * Roles API Endpoint
 * GET /api/v1/roles
 *
 * Returns organizational roles for employee assignment and directory filtering.
 */

import { NextRequest, NextResponse } from "next/server";
import { unstable_rethrow } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { getAuthenticatedUserFromToken } from "@/lib/auth/user";

export async function GET(request: NextRequest) {
  try {
    // SEC-FIND-03c: Handler-level authentication
    const token =
      request.cookies.get(SESSION_COOKIE_NAME)?.value ||
      request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    const authResult = await getAuthenticatedUserFromToken(token);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.message },
        { status: authResult.status }
      );
    }

    const roles = await prisma.role.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        roleTitle: true,
        departmentId: true,
        level: true,
        grade: true,
      },
    });

    return NextResponse.json({ data: roles }, { status: 200 });
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
    console.error("Roles API error:", error);
    return NextResponse.json(
      { error: "Failed to load roles." },
      { status: 500 }
    );
  }
}
