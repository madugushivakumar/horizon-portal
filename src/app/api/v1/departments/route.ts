/**
 * Departments API Endpoint
 * GET /api/v1/departments
 *
 * Returns departments from the database for directory filtering and organizational grouping.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
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
    console.error("Departments API error:", error);
    return NextResponse.json(
      { error: "Failed to load departments." },
      { status: 500 }
    );
  }
}
