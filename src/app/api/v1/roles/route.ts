/**
 * Roles API Endpoint
 * GET /api/v1/roles
 *
 * Returns organizational roles for employee assignment and directory filtering.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
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
    console.error("Roles API error:", error);
    return NextResponse.json(
      { error: "Failed to load roles." },
      { status: 500 }
    );
  }
}
