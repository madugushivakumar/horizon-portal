/**
 * Employees API Endpoint
 * GET /api/v1/employees
 *
 * Returns database-backed employee records.
 * Deterministic ordering, explicit field selection (no salary or private details exposed).
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? Math.min(Math.max(parseInt(limitParam, 10) || 25, 1), 100) : 25;

    const employees = await prisma.employee.findMany({
      take: limit,
      orderBy: { id: "asc" },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        status: true,
        hireDate: true,
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        role: {
          select: {
            id: true,
            name: true,
          },
        },
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        data: employees,
        count: employees.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Employee API query error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve employee directory." },
      { status: 500 }
    );
  }
}
