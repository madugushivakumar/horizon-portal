/**
 * Employee Profile API Endpoint
 * GET /api/v1/employees/[id]
 *
 * Returns safe public profile information and reporting hierarchy for a specific employee.
 * PRIVACY ENFORCEMENT:
 * - Explicit Prisma select clauses strictly exclude salary, compensation, bank accounts,
 *   and authentication credentials across root, manager, and direct reports.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SafeEmployeeProfile } from "@/types/employee";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id: rawId } = await context.params;

    if (!rawId || typeof rawId !== "string" || rawId.trim().length === 0) {
      return NextResponse.json(
        { error: "Invalid employee identifier provided." },
        { status: 400 }
      );
    }

    const employeeId = decodeURIComponent(rawId).trim();

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        status: true,
        hireDate: true,
        managerId: true,
        department: {
          select: {
            id: true,
            name: true,
            code: true,
            description: true,
          },
        },
        role: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        directReports: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: {
              select: {
                id: true,
                name: true,
              },
            },
            department: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: [{ lastName: "asc" }, { firstName: "asc" }, { id: "asc" }],
        },
      },
    });

    if (!employee) {
      return NextResponse.json(
        { error: `Employee with ID "${employeeId}" was not found.` },
        { status: 404 }
      );
    }

    // Transform into safe profile DTO
    const safeProfile: SafeEmployeeProfile = {
      id: employee.id,
      firstName: employee.firstName,
      lastName: employee.lastName,
      name: `${employee.firstName} ${employee.lastName}`.trim(),
      email: employee.email,
      phone: employee.phone,
      hireDate: employee.hireDate ? employee.hireDate.toISOString() : null,
      status: employee.status,
      managerId: employee.managerId,
      department: employee.department,
      role: employee.role,
      manager: employee.manager
        ? {
            id: employee.manager.id,
            firstName: employee.manager.firstName,
            lastName: employee.manager.lastName,
            name: `${employee.manager.firstName} ${employee.manager.lastName}`.trim(),
            email: employee.manager.email,
            role: employee.manager.role,
          }
        : null,
      directReports: employee.directReports.map((r) => ({
        id: r.id,
        firstName: r.firstName,
        lastName: r.lastName,
        name: `${r.firstName} ${r.lastName}`.trim(),
        email: r.email,
        role: r.role,
        department: r.department,
      })),
    };

    return NextResponse.json({ data: safeProfile }, { status: 200 });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "digest" in error &&
      typeof (error as { digest?: unknown }).digest === "string" &&
      (error as { digest: string }).digest.startsWith("NEXT_")
    ) {
      throw error;
    }
    console.error("Employee profile query error:", error);
    return NextResponse.json(
      { error: "Internal server error retrieving employee profile." },
      { status: 500 }
    );
  }
}

// Re-export PATCH and PUT handlers for employee update compatibility
export { PATCH, PUT } from "@/app/api/v1/admin/employees/[id]/route";
