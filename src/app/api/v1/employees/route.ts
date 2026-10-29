/**
 * Employees Directory API Endpoint
 * GET /api/v1/employees
 *
 * Supports search, department filtering, and database-backed pagination.
 * PRIVACY ENFORCEMENT:
 * - Uses explicit Prisma select clauses. Strictly excludes salary, bank accounts,
 *   and authentication tokens.
 */

import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { DirectoryApiResponse, SafeEmployeeSummary } from "@/types/employee";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Search query parameter
    const search = searchParams.get("search")?.trim() || "";

    // Department filter parameter (ID or "all")
    const department = searchParams.get("department")?.trim() || "";

    // Pagination parameters
    const pageParam = parseInt(searchParams.get("page") || "1", 10);
    const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;

    const limitParam = parseInt(
      searchParams.get("pageSize") || searchParams.get("limit") || "12",
      10
    );
    const pageSize = Number.isFinite(limitParam)
      ? Math.min(Math.max(limitParam, 1), 100)
      : 12;

    // Construct Prisma where filter
    const whereConditions: Prisma.EmployeeWhereInput[] = [];

    // Search across name, employee ID, and email
    if (search.length > 0) {
      const words = search.split(/\s+/).filter(Boolean);
      const searchOrConditions: Prisma.EmployeeWhereInput[] = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { id: { contains: search } },
        { email: { contains: search } },
      ];

      // Support multi-word searches (e.g. "Alexander Wright" matches firstName + lastName)
      if (words.length > 1) {
        searchOrConditions.push(
          {
            AND: [
              { firstName: { contains: words[0] } },
              { lastName: { contains: words[words.length - 1] } },
            ],
          },
          {
            AND: [
              { firstName: { contains: words[words.length - 1] } },
              { lastName: { contains: words[0] } },
            ],
          }
        );
      }

      whereConditions.push({ OR: searchOrConditions });
    }

    // Filter by department if not empty or "all"
    if (department.length > 0 && department.toLowerCase() !== "all") {
      whereConditions.push({
        OR: [
          { departmentId: department },
          { department: { name: { equals: department } } },
          { department: { name: { contains: department } } },
          { department: { code: { equals: department } } },
        ],
      });
    }

    const where = whereConditions.length > 0 ? { AND: whereConditions } : {};

    // Execute count and query concurrently
    const [total, rawEmployees] = await Promise.all([
      prisma.employee.count({ where }),
      prisma.employee.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }, { id: "asc" }],
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
        },
      }),
    ]);

    const totalPages = Math.ceil(total / pageSize) || 1;

    // Transform into SafeEmployeeSummary DTOs
    const safeData: SafeEmployeeSummary[] = rawEmployees.map((emp) => ({
      id: emp.id,
      firstName: emp.firstName,
      lastName: emp.lastName,
      name: `${emp.firstName} ${emp.lastName}`.trim(),
      email: emp.email,
      phone: emp.phone,
      hireDate: emp.hireDate ? emp.hireDate.toISOString() : null,
      status: emp.status,
      managerId: emp.managerId,
      department: emp.department,
      role: emp.role,
      manager: emp.manager
        ? {
            id: emp.manager.id,
            firstName: emp.manager.firstName,
            lastName: emp.manager.lastName,
            name: `${emp.manager.firstName} ${emp.manager.lastName}`.trim(),
            email: emp.manager.email,
            role: emp.manager.role,
          }
        : null,
    }));

    const response: DirectoryApiResponse = {
      data: safeData,
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
      },
    };

    return NextResponse.json(response, { status: 200 });
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
    console.error("Employee directory query error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve employee directory." },
      { status: 500 }
    );
  }
}

// Re-export POST handler for employee creation compatibility
export { POST } from "@/app/api/v1/admin/employees/route";
