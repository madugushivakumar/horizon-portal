/**
 * Horizon Portal — Capacity Authorization & Scope Resolver
 * src/lib/capacity/auth.ts
 *
 * Implements role-based access control (RBAC) and organizational scoping for Workload & Capacity:
 * - Admin: Unrestricted organization-wide capacity across all teams and sprints.
 * - HR: Workforce-wide capacity; strictly omits compensation, credentials, and medical notes.
 * - Manager: Scoped to led teams + direct reports (Employee.managerId) + self.
 * - Employee: Strictly scoped to self-assigned workload and individual capacity.
 *
 * Server-side authorization guarantees that unauthorized teamId parameters or data scopes
 * are rejected with HTTP 403 Forbidden.
 */

import { prisma } from "@/lib/prisma";
import { AuthenticatedUser } from "@/lib/auth/user";

export const NO_CACHE_HEADERS = {
  "Cache-Control": "private, no-cache, no-store, must-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

export const SAFE_CAPACITY_EMPLOYEE_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  fullName: true,
  email: true,
  department: {
    select: {
      id: true,
      name: true,
    },
  },
  role: {
    select: {
      id: true,
      name: true,
      roleTitle: true,
    },
  },
} as const;

export type SafeCapacityEmployee = {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string | null;
  email: string;
  department: { id: string; name: string } | null;
  role: { id: string; name: string; roleTitle: string | null } | null;
};

export interface UserCapacityScope {
  role: string;
  isUnrestricted: boolean;
  authorizedTeamIds: string[];
  isTeamAuthorized: (teamId: string) => boolean;
  getAuthorizedEmployees: (requestedTeamId?: string) => Promise<SafeCapacityEmployee[]>;
}

/**
 * Resolves the role-based capacity scope for an authenticated user.
 */
export async function resolveUserCapacityScope(
  user: AuthenticatedUser
): Promise<UserCapacityScope> {
  const { role, employeeId } = user;

  // 1. Admin and HR: Organization-wide unrestricted access
  if (role === "Admin" || role === "HR") {
    const allTeams = await prisma.team.findMany({ select: { id: true } });
    const allTeamIds = allTeams.map((t) => t.id);

    return {
      role,
      isUnrestricted: true,
      authorizedTeamIds: allTeamIds,
      isTeamAuthorized: () => true,
      getAuthorizedEmployees: async (requestedTeamId?: string) => {
        if (requestedTeamId) {
          // Find employees associated with this team
          const team = await prisma.team.findUnique({
            where: { id: requestedTeamId },
            select: { teamLeadEmployeeId: true },
          });

          const teamTasks = await prisma.task.findMany({
            where: { teamId: requestedTeamId },
            select: { assigneeEmployeeId: true },
          });

          const memberIdSet = new Set<string>();
          if (team?.teamLeadEmployeeId) memberIdSet.add(team.teamLeadEmployeeId);
          teamTasks.forEach((t) => memberIdSet.add(t.assigneeEmployeeId));

          return prisma.employee.findMany({
            where: { id: { in: Array.from(memberIdSet) } },
            select: SAFE_CAPACITY_EMPLOYEE_SELECT,
            orderBy: [{ lastName: "asc" }, { firstName: "asc" }, { id: "asc" }],
          });
        }

        // Organization-wide active employees
        return prisma.employee.findMany({
          where: { status: "Active" },
          select: SAFE_CAPACITY_EMPLOYEE_SELECT,
          orderBy: [{ lastName: "asc" }, { firstName: "asc" }, { id: "asc" }],
        });
      },
    };
  }

  // 2. Manager: Led teams + direct reports + self
  if (role === "Manager") {
    if (!employeeId) {
      return createEmptyScope(role);
    }

    // Direct reports
    const directReports = await prisma.employee.findMany({
      where: { managerId: employeeId },
      select: { id: true },
    });
    const directReportIds = directReports.map((d) => d.id);

    // Teams led
    const teamsLed = await prisma.team.findMany({
      where: { teamLeadEmployeeId: employeeId },
      select: { id: true },
    });
    const ledTeamIds = teamsLed.map((t) => t.id);

    // Teams where manager or direct reports have tasks
    const activeTasks = await prisma.task.findMany({
      where: {
        assigneeEmployeeId: { in: [employeeId, ...directReportIds] },
      },
      select: { teamId: true },
    });
    const activeTeamIds = activeTasks.map((t) => t.teamId);

    const authorizedTeamIdSet = new Set<string>([...ledTeamIds, ...activeTeamIds]);
    const authorizedTeamIds = Array.from(authorizedTeamIdSet);

    // All employees in manager's scope: self + direct reports + members of teams led
    let teamMemberIds: string[] = [];
    if (ledTeamIds.length > 0) {
      const ledTasks = await prisma.task.findMany({
        where: { teamId: { in: ledTeamIds } },
        select: { assigneeEmployeeId: true },
      });
      teamMemberIds = ledTasks.map((t) => t.assigneeEmployeeId);
    }

    const allManagerEmployeeIds = Array.from(
      new Set([employeeId, ...directReportIds, ...teamMemberIds])
    );

    return {
      role,
      isUnrestricted: false,
      authorizedTeamIds,
      isTeamAuthorized: (teamId: string) => authorizedTeamIdSet.has(teamId),
      getAuthorizedEmployees: async (requestedTeamId?: string) => {
        if (requestedTeamId) {
          // Team must be in authorized teams
          if (!authorizedTeamIdSet.has(requestedTeamId)) {
            return [];
          }

          const team = await prisma.team.findUnique({
            where: { id: requestedTeamId },
            select: { teamLeadEmployeeId: true },
          });

          const teamTasks = await prisma.task.findMany({
            where: { teamId: requestedTeamId },
            select: { assigneeEmployeeId: true },
          });

          const teamMemberSet = new Set<string>();
          if (team?.teamLeadEmployeeId) teamMemberSet.add(team.teamLeadEmployeeId);
          teamTasks.forEach((t) => teamMemberSet.add(t.assigneeEmployeeId));

          // Intersect team members with manager's allowed population
          const filteredIds = Array.from(teamMemberSet).filter((id) =>
            allManagerEmployeeIds.includes(id)
          );

          return prisma.employee.findMany({
            where: { id: { in: filteredIds } },
            select: SAFE_CAPACITY_EMPLOYEE_SELECT,
            orderBy: [{ lastName: "asc" }, { firstName: "asc" }, { id: "asc" }],
          });
        }

        // All authorized employees under this manager
        return prisma.employee.findMany({
          where: { id: { in: allManagerEmployeeIds } },
          select: SAFE_CAPACITY_EMPLOYEE_SELECT,
          orderBy: [{ lastName: "asc" }, { firstName: "asc" }, { id: "asc" }],
        });
      },
    };
  }

  // 3. Employee: Self-only access
  if (role === "Employee") {
    if (!employeeId) {
      return createEmptyScope(role);
    }

    // Teams the employee has tasks in
    const empTasks = await prisma.task.findMany({
      where: { assigneeEmployeeId: employeeId },
      select: { teamId: true },
    });
    const authorizedTeamIdSet = new Set<string>(empTasks.map((t) => t.teamId));
    const authorizedTeamIds = Array.from(authorizedTeamIdSet);

    return {
      role,
      isUnrestricted: false,
      authorizedTeamIds,
      isTeamAuthorized: (teamId: string) => authorizedTeamIdSet.has(teamId),
      getAuthorizedEmployees: async (requestedTeamId?: string) => {
        // If employee specified a teamId, verify they belong to it
        if (requestedTeamId && !authorizedTeamIdSet.has(requestedTeamId)) {
          return [];
        }

        // Return strictly self
        return prisma.employee.findMany({
          where: { id: employeeId },
          select: SAFE_CAPACITY_EMPLOYEE_SELECT,
        });
      },
    };
  }

  return createEmptyScope(role);
}

function createEmptyScope(role: string): UserCapacityScope {
  return {
    role,
    isUnrestricted: false,
    authorizedTeamIds: [],
    isTeamAuthorized: () => false,
    getAuthorizedEmployees: async () => [],
  };
}
