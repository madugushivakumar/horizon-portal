/**
 * Admin Employee Management API Endpoint
 * GET  /api/v1/admin/employees - Paginated, searchable, sortable list with department filtering
 * POST /api/v1/admin/employees - Create employee with atomic audit trail logging
 *
 * PRIVACY & SECURITY:
 * - Only authenticated HR and Admin users are permitted.
 * - Employee and Manager roles receive HTTP 403 Forbidden.
 * - Strictly excludes salary, password hashes, and credential secrets.
 */

import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { getAuthenticatedUserFromToken } from "@/lib/auth/user";
import { employeeCreateSchema } from "@/lib/validations/employee";
import {
  getActorSnapshot,
  logEmployeeCreation,
} from "@/lib/audit/audit-logger";

const NO_CACHE_HEADERS = {
  "Cache-Control": "private, no-cache, no-store, must-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

/**
 * Helper to authenticate and authorize HR/Admin requests.
 */
async function authenticateAdminOrHR(request: NextRequest) {
  const token =
    request.cookies.get(SESSION_COOKIE_NAME)?.value ||
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  const authResult = await getAuthenticatedUserFromToken(token);
  if (!authResult.success) {
    return {
      authorized: false as const,
      status: authResult.status,
      error: authResult.message,
    };
  }

  const role = authResult.user.role;
  if (role !== "Admin" && role !== "HR") {
    return {
      authorized: false as const,
      status: 403,
      error: "Forbidden: HR or Admin privileges are required to access this resource.",
    };
  }

  return { authorized: true as const, user: authResult.user };
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/admin/employees
// ─────────────────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateAdminOrHR(request);
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status, headers: NO_CACHE_HEADERS }
      );
    }

    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search")?.trim() || "";
    const department = searchParams.get("department")?.trim() || "";
    const status = searchParams.get("status")?.trim() || "";
    const sortBy = searchParams.get("sortBy")?.trim() || "id";
    const sortOrder = searchParams.get("sortOrder")?.toLowerCase() === "desc" ? "desc" : "asc";

    const pageParam = parseInt(searchParams.get("page") || "1", 10);
    const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;

    const limitParam = parseInt(
      searchParams.get("pageSize") || searchParams.get("limit") || "10",
      10
    );
    const pageSize = Number.isFinite(limitParam)
      ? Math.min(Math.max(limitParam, 1), 100)
      : 10;

    // Build filter query
    const whereConditions: Prisma.EmployeeWhereInput[] = [];

    // Search across name, employee ID, and email
    if (search.length > 0) {
      const words = search.split(/\s+/).filter(Boolean);
      const searchOr: Prisma.EmployeeWhereInput[] = [
        { id: { contains: search } },
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { email: { contains: search } },
        { workEmail: { contains: search } },
        { phone: { contains: search } },
      ];

      if (words.length > 1) {
        searchOr.push(
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

      whereConditions.push({ OR: searchOr });
    }

    // Filter by department
    if (department.length > 0 && department.toLowerCase() !== "all") {
      whereConditions.push({
        OR: [
          { departmentId: department },
          { department: { name: { equals: department } } },
          { department: { code: { equals: department } } },
        ],
      });
    }

    // Filter by status
    if (status.length > 0 && status.toLowerCase() !== "all") {
      whereConditions.push({
        status: { equals: status },
      });
    }

    const where = whereConditions.length > 0 ? { AND: whereConditions } : {};

    // Determine sorting criteria
    let orderBy: Prisma.EmployeeOrderByWithRelationInput[] = [];
    switch (sortBy) {
      case "name":
        orderBy = [{ firstName: sortOrder }, { lastName: sortOrder }];
        break;
      case "firstName":
        orderBy = [{ firstName: sortOrder }, { lastName: "asc" }];
        break;
      case "lastName":
        orderBy = [{ lastName: sortOrder }, { firstName: "asc" }];
        break;
      case "email":
        orderBy = [{ email: sortOrder }];
        break;
      case "department":
        orderBy = [{ department: { name: sortOrder } }];
        break;
      case "role":
        orderBy = [{ role: { name: sortOrder } }];
        break;
      case "status":
        orderBy = [{ status: sortOrder }, { id: "asc" }];
        break;
      case "hireDate":
        orderBy = [{ hireDate: sortOrder }];
        break;
      case "id":
      default:
        orderBy = [{ id: sortOrder }];
        break;
    }

    const [total, rawEmployees] = await Promise.all([
      prisma.employee.count({ where }),
      prisma.employee.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          fullName: true,
          email: true,
          workEmail: true,
          phone: true,
          status: true,
          hireDate: true,
          workLocation: true,
          workMode: true,
          employmentType: true,
          departmentId: true,
          roleId: true,
          managerId: true,
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
              roleTitle: true,
            },
          },
          manager: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          createdAt: true,
          updatedAt: true,
        },
      }),
    ]);

    const totalPages = Math.ceil(total / pageSize) || 1;

    const data = rawEmployees.map((emp) => ({
      id: emp.id,
      firstName: emp.firstName,
      lastName: emp.lastName,
      fullName: emp.fullName || `${emp.firstName} ${emp.lastName}`.trim(),
      email: emp.email,
      workEmail: emp.workEmail || emp.email,
      phone: emp.phone,
      status: emp.status,
      hireDate: emp.hireDate ? emp.hireDate.toISOString().split("T")[0] : null,
      workLocation: emp.workLocation,
      workMode: emp.workMode,
      employmentType: emp.employmentType,
      departmentId: emp.departmentId,
      departmentName: emp.department?.name || null,
      departmentCode: emp.department?.code || null,
      roleId: emp.roleId,
      roleName: emp.role?.name || emp.role?.roleTitle || null,
      managerId: emp.managerId,
      managerName: emp.manager ? `${emp.manager.firstName} ${emp.manager.lastName}`.trim() : null,
      createdAt: emp.createdAt.toISOString(),
      updatedAt: emp.updatedAt.toISOString(),
    }));

    return NextResponse.json(
      {
        data,
        pagination: {
          page,
          pageSize,
          total,
          totalPages,
        },
      },
      { status: 200, headers: NO_CACHE_HEADERS }
    );
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
    console.error("Admin employees query error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve employee management records." },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/admin/employees
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateAdminOrHR(request);
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status, headers: NO_CACHE_HEADERS }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON request body." },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    const validation = employeeCreateSchema.safeParse(body);
    if (!validation.success) {
      const fieldErrors = validation.error.flatten().fieldErrors;
      const firstErrorMessage =
        Object.values(fieldErrors)[0]?.[0] || "Validation failed for employee data.";
      return NextResponse.json(
        {
          error: firstErrorMessage,
          details: fieldErrors,
        },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    const input = validation.data;

    // Check unique employee identifier
    const existingById = await prisma.employee.findUnique({
      where: { id: input.id },
      select: { id: true },
    });
    if (existingById) {
      return NextResponse.json(
        { error: `An employee with ID "${input.id}" already exists.` },
        { status: 409, headers: NO_CACHE_HEADERS }
      );
    }

    // Check unique email
    const existingByEmail = await prisma.employee.findUnique({
      where: { email: input.email },
      select: { id: true },
    });
    if (existingByEmail) {
      return NextResponse.json(
        { error: `An employee with email "${input.email}" already exists.` },
        { status: 409, headers: NO_CACHE_HEADERS }
      );
    }

    // Validate foreign keys if provided
    if (input.departmentId) {
      const dept = await prisma.department.findUnique({
        where: { id: input.departmentId },
        select: { id: true },
      });
      if (!dept) {
        return NextResponse.json(
          { error: `Department "${input.departmentId}" not found.` },
          { status: 400, headers: NO_CACHE_HEADERS }
        );
      }
    }

    if (input.roleId) {
      const role = await prisma.role.findUnique({
        where: { id: input.roleId },
        select: { id: true },
      });
      if (!role) {
        return NextResponse.json(
          { error: `Organizational role "${input.roleId}" not found.` },
          { status: 400, headers: NO_CACHE_HEADERS }
        );
      }
    }

    if (input.managerId) {
      if (input.managerId === input.id) {
        return NextResponse.json(
          { error: "An employee cannot be their own manager." },
          { status: 400, headers: NO_CACHE_HEADERS }
        );
      }
      const manager = await prisma.employee.findUnique({
        where: { id: input.managerId },
        select: { id: true },
      });
      if (!manager) {
        return NextResponse.json(
          { error: `Reporting manager with ID "${input.managerId}" not found.` },
          { status: 400, headers: NO_CACHE_HEADERS }
        );
      }
    }

    const actor = getActorSnapshot(auth.user);
    const fullName = `${input.firstName} ${input.lastName}`.trim();

    // Persist employee creation and initial audit trail atomically
    const newEmployee = await prisma.$transaction(async (tx) => {
      const created = await tx.employee.create({
        data: {
          id: input.id,
          firstName: input.firstName,
          lastName: input.lastName,
          fullName,
          email: input.email,
          workEmail: input.workEmail || input.email,
          phone: input.phone || null,
          departmentId: input.departmentId || null,
          roleId: input.roleId || null,
          managerId: input.managerId || null,
          workLocation: input.workLocation || null,
          workMode: input.workMode || null,
          employmentType: input.employmentType || null,
          hireDate: input.hireDate ? new Date(input.hireDate) : null,
          status: input.status || "Active",
        },
        include: {
          department: { select: { id: true, name: true, code: true } },
          role: { select: { id: true, name: true } },
          manager: { select: { id: true, firstName: true, lastName: true } },
        },
      });

      // Atomic audit logging
      await logEmployeeCreation(tx, actor, {
        id: created.id,
        firstName: created.firstName,
        lastName: created.lastName,
        email: created.email,
        workEmail: created.workEmail,
        phone: created.phone,
        departmentId: created.departmentId,
        roleId: created.roleId,
        managerId: created.managerId,
        workLocation: created.workLocation,
        workMode: created.workMode,
        employmentType: created.employmentType,
        hireDate: created.hireDate,
        status: created.status,
      });

      return created;
    });

    const responseData = {
      id: newEmployee.id,
      firstName: newEmployee.firstName,
      lastName: newEmployee.lastName,
      fullName: newEmployee.fullName,
      email: newEmployee.email,
      workEmail: newEmployee.workEmail,
      phone: newEmployee.phone,
      status: newEmployee.status,
      hireDate: newEmployee.hireDate ? newEmployee.hireDate.toISOString().split("T")[0] : null,
      workLocation: newEmployee.workLocation,
      workMode: newEmployee.workMode,
      employmentType: newEmployee.employmentType,
      departmentId: newEmployee.departmentId,
      departmentName: newEmployee.department?.name || null,
      departmentCode: newEmployee.department?.code || null,
      roleId: newEmployee.roleId,
      roleName: newEmployee.role?.name || null,
      managerId: newEmployee.managerId,
      managerName: newEmployee.manager
        ? `${newEmployee.manager.firstName} ${newEmployee.manager.lastName}`.trim()
        : null,
    };

    return NextResponse.json(
      {
        message: "Employee created successfully.",
        data: responseData,
      },
      { status: 201, headers: NO_CACHE_HEADERS }
    );
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
    console.error("Employee creation error:", error);
    return NextResponse.json(
      { error: "Failed to create employee record." },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}
