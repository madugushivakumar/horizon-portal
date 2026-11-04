/**
 * Horizon Portal — Task Authorization & Role Scoping Helper
 * src/lib/tasks/auth.ts
 *
 * Implements role-based access control (RBAC) scoping for tasks:
 * - Admin: Read/Write all tasks
 * - HR: Read all tasks, Write forbidden (HTTP 403)
 * - Manager: Read/Write tasks belonging to led teams OR self-assigned OR assigned to direct reports
 * - Employee: Read/Write tasks assigned to self only
 *
 * Direct report relationships are resolved via `Employee.managerId`.
 * Safe employee projections omit sensitive fields (salary, bank info, passwords).
 */

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { AuthenticatedUser } from "@/lib/auth/user";

export const NO_CACHE_HEADERS = {
  "Cache-Control": "private, no-cache, no-store, must-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

/**
 * Returns whether a given user role has permission to mutate tasks.
 * HR has read-only access and is explicitly forbidden from modifying tasks.
 */
export function canUserModifyTasks(role: string): boolean {
  if (role === "HR") return false;
  return role === "Admin" || role === "Manager" || role === "Employee";
}

/**
 * Generates the Prisma where condition scoping tasks accessible by the authenticated user.
 * Returns null if the user has unrestricted read access (Admin & HR).
 */
export async function getTaskRoleScope(
  user: AuthenticatedUser
): Promise<Prisma.TaskWhereInput | null> {
  const { role, employeeId } = user;

  // Admin & HR have unrestricted read visibility
  if (role === "Admin" || role === "HR") {
    return null;
  }

  // Manager: led teams OR assigned to self OR assigned to direct reports
  if (role === "Manager") {
    if (!employeeId) {
      return { id: "__UNAUTHORIZED_NO_EMPLOYEE_ID__" };
    }

    // Resolve direct reports via Employee.managerId
    const directReports = await prisma.employee.findMany({
      where: { managerId: employeeId },
      select: { id: true },
    });
    const directReportIds = directReports.map((dr) => dr.id);

    const conditions: Prisma.TaskWhereInput[] = [
      // 1. Task belongs to a team where this user is team lead
      {
        team: {
          teamLeadEmployeeId: employeeId,
        },
      },
      // 2. Task is assigned directly to the manager
      {
        assigneeEmployeeId: employeeId,
      },
    ];

    // 3. Task is assigned to one of manager's direct reports
    if (directReportIds.length > 0) {
      conditions.push({
        assigneeEmployeeId: {
          in: directReportIds,
        },
      });
    }

    return { OR: conditions };
  }

  // Employee: assigned to self only
  if (role === "Employee") {
    if (!employeeId) {
      return { id: "__UNAUTHORIZED_NO_EMPLOYEE_ID__" };
    }
    return { assigneeEmployeeId: employeeId };
  }

  // Any other role has no task access
  return { id: "__UNAUTHORIZED_ROLE__" };
}

/**
 * Safe selection fields for Employee projections in task endpoints.
 * Explicitly omits salary, passwords, and sensitive HR details.
 */
export const SAFE_EMPLOYEE_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  fullName: true,
  email: true,
} as const;

export type SafeEmployee = {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string | null;
  email: string;
};
