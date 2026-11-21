/**
 * Departments API Endpoint
 * GET /api/v1/departments
 *
 * Returns departments from the database for directory filtering and organizational grouping.
 */

import { NextRequest, NextResponse } from "next/server";
import { unstable_rethrow } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { getAuthenticatedUserFromToken } from "@/lib/auth/user";

export async function GET(request: NextRequest) {
  try {
    // SEC-FIND-03b: Handler-level authentication
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

    const departments = await prisma.department.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        code: true,
        description: true,
        _count: {
          select: {
            employees: true,
          },
        },
      },
    });

    const data = departments.map((d) => ({
      id: d.id,
      name: d.name,
      code: d.code,
      description: d.description,
      employeeCount: d._count.employees,
    }));

    return NextResponse.json({ data }, { status: 200 });
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
    console.error("Departments API error:", error);
    return NextResponse.json(
      { error: "Failed to load departments." },
      { status: 500 }
    );
  }
}
