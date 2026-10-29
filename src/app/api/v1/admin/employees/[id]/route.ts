/**
 * Admin Employee Detail & Modification Endpoint
 * GET   /api/v1/admin/employees/[id] - Retrieve editable employee details
 * PATCH /api/v1/admin/employees/[id] - Update employee with atomic audit diff logging
 * PUT   /api/v1/admin/employees/[id] - Update employee alias
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { getAuthenticatedUserFromToken } from "@/lib/auth/user";
import { employeeUpdateSchema } from "@/lib/validations/employee";
import {
  calculateEmployeeDiff,
  getActorSnapshot,
  logEmployeeUpdate,
} from "@/lib/audit/audit-logger";

const NO_CACHE_HEADERS = {
  "Cache-Control": "private, no-cache, no-store, must-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

interface RouteContext {
  params: Promise<{ id: string }>;
}

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
// GET /api/v1/admin/employees/[id]
// ─────────────────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const auth = await authenticateAdminOrHR(request);
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status, headers: NO_CACHE_HEADERS }
      );
    }

    const { id: rawId } = await context.params;
    const employeeId = decodeURIComponent(rawId || "").trim();

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        department: { select: { id: true, name: true, code: true } },
        role: { select: { id: true, name: true, roleTitle: true } },
        manager: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    if (!employee) {
      return NextResponse.json(
        { error: `Employee with ID "${employeeId}" not found.` },
        { status: 404, headers: NO_CACHE_HEADERS }
      );
    }

    const safeData = {
      id: employee.id,
      firstName: employee.firstName,
      lastName: employee.lastName,
      fullName: employee.fullName || `${employee.firstName} ${employee.lastName}`.trim(),
      email: employee.email,
      workEmail: employee.workEmail || employee.email,
      phone: employee.phone,
      status: employee.status,
      hireDate: employee.hireDate ? employee.hireDate.toISOString().split("T")[0] : null,
      workLocation: employee.workLocation,
      workMode: employee.workMode,
      employmentType: employee.employmentType,
      departmentId: employee.departmentId,
      departmentName: employee.department?.name || null,
      departmentCode: employee.department?.code || null,
      roleId: employee.roleId,
      roleName: employee.role?.name || employee.role?.roleTitle || null,
      managerId: employee.managerId,
      managerName: employee.manager
        ? `${employee.manager.firstName} ${employee.manager.lastName}`.trim()
        : null,
      createdAt: employee.createdAt.toISOString(),
      updatedAt: employee.updatedAt.toISOString(),
    };

    return NextResponse.json(
      { data: safeData },
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
    console.error("Admin employee detail query error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve employee record." },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/v1/admin/employees/[id]
// ─────────────────────────────────────────────────────────────────────────────

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const auth = await authenticateAdminOrHR(request);
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status, headers: NO_CACHE_HEADERS }
      );
    }

    const { id: rawId } = await context.params;
    const employeeId = decodeURIComponent(rawId || "").trim();

    const existing = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        department: { select: { id: true, name: true, code: true } },
        role: { select: { id: true, name: true } },
        manager: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: `Employee with ID "${employeeId}" not found.` },
        { status: 404, headers: NO_CACHE_HEADERS }
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

    const validation = employeeUpdateSchema.safeParse(body);
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

    // Check unique email if modified
    if (input.email && input.email.toLowerCase() !== existing.email.toLowerCase()) {
      const emailConflict = await prisma.employee.findUnique({
        where: { email: input.email },
        select: { id: true },
      });
      if (emailConflict && emailConflict.id !== employeeId) {
        return NextResponse.json(
          { error: `An employee with email "${input.email}" already exists.` },
          { status: 409, headers: NO_CACHE_HEADERS }
        );
      }
    }

    // Validate foreign keys if provided
    if (input.departmentId !== undefined && input.departmentId !== null && input.departmentId !== "") {
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

    if (input.roleId !== undefined && input.roleId !== null && input.roleId !== "") {
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

    if (input.managerId !== undefined && input.managerId !== null && input.managerId !== "") {
      if (input.managerId === employeeId) {
        return NextResponse.json(
          { error: "An employee cannot be their own manager." },
          { status: 400, headers: NO_CACHE_HEADERS }
        );
      }
      const mgr = await prisma.employee.findUnique({
        where: { id: input.managerId },
        select: { id: true },
      });
      if (!mgr) {
        return NextResponse.json(
          { error: `Reporting manager with ID "${input.managerId}" not found.` },
          { status: 400, headers: NO_CACHE_HEADERS }
        );
      }
    }

    // Prepare fields to update
    const updateData: Record<string, unknown> = {};
    if (input.firstName !== undefined) updateData.firstName = input.firstName;
    if (input.lastName !== undefined) updateData.lastName = input.lastName;
    if (input.email !== undefined) updateData.email = input.email;
    if (input.workEmail !== undefined) updateData.workEmail = input.workEmail || null;
    if (input.phone !== undefined) updateData.phone = input.phone || null;
    if (input.departmentId !== undefined) updateData.departmentId = input.departmentId || null;
    if (input.roleId !== undefined) updateData.roleId = input.roleId || null;
    if (input.managerId !== undefined) updateData.managerId = input.managerId || null;
    if (input.workLocation !== undefined) updateData.workLocation = input.workLocation || null;
    if (input.workMode !== undefined) updateData.workMode = input.workMode || null;
    if (input.employmentType !== undefined) updateData.employmentType = input.employmentType || null;
    if (input.status !== undefined) updateData.status = input.status;
    if (input.hireDate !== undefined) {
      updateData.hireDate = input.hireDate ? new Date(input.hireDate) : null;
    }

    // Auto-update fullName if either name part changed
    const newFirst = input.firstName ?? existing.firstName;
    const newLast = input.lastName ?? existing.lastName;
    updateData.fullName = `${newFirst} ${newLast}`.trim();

    // Calculate exact diffs against existing record
    const diffs = calculateEmployeeDiff(existing as unknown as Record<string, unknown>, updateData);

    // If no fields changed, return without running mutation or creating false audit entries
    if (diffs.length === 0) {
      return NextResponse.json(
        {
          message: "No changes detected. Employee record remains unchanged.",
          data: {
            id: existing.id,
            firstName: existing.firstName,
            lastName: existing.lastName,
            fullName: existing.fullName,
            email: existing.email,
            workEmail: existing.workEmail,
            phone: existing.phone,
            status: existing.status,
            hireDate: existing.hireDate ? existing.hireDate.toISOString().split("T")[0] : null,
            workLocation: existing.workLocation,
            workMode: existing.workMode,
            employmentType: existing.employmentType,
            departmentId: existing.departmentId,
            departmentName: existing.department?.name || null,
            departmentCode: existing.department?.code || null,
            roleId: existing.roleId,
            roleName: existing.role?.name || null,
            managerId: existing.managerId,
            managerName: existing.manager
              ? `${existing.manager.firstName} ${existing.manager.lastName}`.trim()
              : null,
          },
        },
        { status: 200, headers: NO_CACHE_HEADERS }
      );
    }

    const actor = getActorSnapshot(auth.user);

    // Persist employee update and audit log entries atomically
    const updated = await prisma.$transaction(async (tx) => {
      const emp = await tx.employee.update({
        where: { id: employeeId },
        data: updateData,
        include: {
          department: { select: { id: true, name: true, code: true } },
          role: { select: { id: true, name: true } },
          manager: { select: { id: true, firstName: true, lastName: true } },
        },
      });

      // Record changed fields in audit log
      await logEmployeeUpdate(tx, actor, employeeId, diffs);

      return emp;
    });

    const responseData = {
      id: updated.id,
      firstName: updated.firstName,
      lastName: updated.lastName,
      fullName: updated.fullName,
      email: updated.email,
      workEmail: updated.workEmail,
      phone: updated.phone,
      status: updated.status,
      hireDate: updated.hireDate ? updated.hireDate.toISOString().split("T")[0] : null,
      workLocation: updated.workLocation,
      workMode: updated.workMode,
      employmentType: updated.employmentType,
      departmentId: updated.departmentId,
      departmentName: updated.department?.name || null,
      departmentCode: updated.department?.code || null,
      roleId: updated.roleId,
      roleName: updated.role?.name || null,
      managerId: updated.managerId,
      managerName: updated.manager
        ? `${updated.manager.firstName} ${updated.manager.lastName}`.trim()
        : null,
      diffs,
    };

    return NextResponse.json(
      {
        message: "Employee updated successfully.",
        data: responseData,
        diffs,
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
    console.error("Employee update error:", error);
    return NextResponse.json(
      { error: "Failed to update employee record." },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  return PATCH(request, context);
}
