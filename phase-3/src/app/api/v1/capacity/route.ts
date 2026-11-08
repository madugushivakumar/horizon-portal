/**
 * Horizon Portal — Workload & Capacity Management API
 * GET /api/v1/capacity
 *
 * Primary backend endpoint for Day 14:
 * - Authenticates request and resolves role-based organizational scope.
 * - Strict parameter validation via Zod (sprintId, optional teamId, page, pageSize <= 100).
 * - Enforces server-side RBAC (Admin, HR, Manager, Employee).
 * - Queries Sprint, Tasks, Approved Leaves, Holidays, and Employees.
 * - Invokes centralized Phase B capacity calculation engine.
 * - Produces sprint summary metrics over the entire authorized population before pagination.
 * - Serializes zero-capacity safely (utilizationPercentage: null, utilizationDisplay: "∞").
 * - Returns deterministic, paginated employee capacity records.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { getAuthenticatedUserFromToken } from "@/lib/auth/user";
import { NO_CACHE_HEADERS, resolveUserCapacityScope } from "@/lib/capacity/auth";
import { capacityQuerySchema } from "@/lib/validations/capacity";
import {
  calculateOverlappingLeaveWorkingDays,
  calculateWorkingDaysInRange,
  formatDateToISOString,
} from "@/lib/capacity/working-days";
import {
  calculateEmployeeCapacity,
  calculateSprintCapacitySummary,
} from "@/lib/capacity/capacity-calculator";
import {
  CapacityApiResponse,
  DEFAULT_CAPACITY_CONFIGURATION,
  SerializedEmployeeCapacityRecord,
} from "@/lib/capacity/capacity-types";

export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate user from session cookie or Authorization header
    const token =
      request.cookies.get(SESSION_COOKIE_NAME)?.value ||
      request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

    const authResult = await getAuthenticatedUserFromToken(token);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.message },
        { status: authResult.status, headers: NO_CACHE_HEADERS }
      );
    }

    // 2. Validate query parameters
    const searchParams = request.nextUrl.searchParams;
    const rawQuery = {
      sprintId: searchParams.get("sprintId") ?? undefined,
      teamId: searchParams.get("teamId") ?? undefined,
      page: searchParams.get("page") ?? undefined,
      pageSize: searchParams.get("pageSize") ?? undefined,
    };

    const parsedQuery = capacityQuerySchema.safeParse(rawQuery);
    if (!parsedQuery.success) {
      const firstError = parsedQuery.error.issues[0]?.message || "Invalid query parameters.";
      return NextResponse.json(
        { error: firstError },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    const { sprintId, teamId, page, pageSize } = parsedQuery.data;

    // 3. Resolve role-based authorization scope
    const scope = await resolveUserCapacityScope(authResult.user);

    // Verify teamId authorization if provided
    if (teamId) {
      if (!scope.isTeamAuthorized(teamId)) {
        return NextResponse.json(
          { error: "Forbidden: You are not authorized to view capacity for this team." },
          { status: 403, headers: NO_CACHE_HEADERS }
        );
      }

      // Check team existence
      const teamExists = await prisma.team.findUnique({
        where: { id: teamId },
        select: { id: true },
      });

      if (!teamExists) {
        return NextResponse.json(
          { error: `Team with ID '${teamId}' was not found.` },
          { status: 404, headers: NO_CACHE_HEADERS }
        );
      }
    }

    // 4. Verify sprint existence and fetch dates
    const sprint = await prisma.sprint.findUnique({
      where: { id: sprintId },
      select: {
        id: true,
        sprintName: true,
        startDate: true,
        endDate: true,
        workingDays: true,
      },
    });

    if (!sprint) {
      return NextResponse.json(
        { error: `Sprint with ID '${sprintId}' was not found.` },
        { status: 404, headers: NO_CACHE_HEADERS }
      );
    }

    // 5. Fetch organization holidays in sprint range
    const holidays = await prisma.holiday.findMany({
      where: {
        date: {
          gte: sprint.startDate,
          lte: sprint.endDate,
        },
      },
      select: {
        holidayDate: true,
        date: true,
      },
    });

    const holidayDateStrings = new Set<string>(
      holidays.map((h) => h.holidayDate || formatDateToISOString(h.date))
    );

    // 6. Calculate sprint working days
    const sprintDaysResult = calculateWorkingDaysInRange(
      sprint.startDate,
      sprint.endDate,
      holidayDateStrings
    );
    const sprintWorkingDays = sprintDaysResult.workingDays;

    // 7. Fetch authorized employees for this scope
    const employees = await scope.getAuthorizedEmployees(teamId);
    const employeeIds = employees.map((e) => e.id);

    // If no employees authorized in this scope
    if (employeeIds.length === 0) {
      const emptyResponse: CapacityApiResponse = {
        success: true,
        data: {
          sprint: {
            id: sprint.id,
            name: sprint.sprintName,
            startDate: formatDateToISOString(sprint.startDate),
            endDate: formatDateToISOString(sprint.endDate),
            workingDays: sprintWorkingDays,
          },
          configuration: DEFAULT_CAPACITY_CONFIGURATION,
          summary: {
            totalEmployees: 0,
            overloadedEmployees: 0,
            nearCapacityEmployees: 0,
            atCapacityEmployees: 0,
            availableEmployees: 0,
            totalGrossCapacity: 0,
            totalNetCapacity: 0,
            totalOpenPoints: 0,
            totalCompletedPoints: 0,
            totalPlannedPoints: 0,
            remainingPoints: 0,
            completionPercentage: 0,
            workingDays: sprintWorkingDays,
          },
          sprintProgress: {
            plannedPoints: 0,
            completedPoints: 0,
            remainingPoints: 0,
            completionPercentage: 0,
          },
          employees: [],
          pagination: {
            page,
            pageSize,
            total: 0,
            totalPages: 0,
          },
        },
      };

      return NextResponse.json(emptyResponse, { headers: NO_CACHE_HEADERS });
    }

    // 8. Fetch assigned tasks for this sprint and authorized employees
    const taskWhere: {
      sprintId: string;
      assigneeEmployeeId: { in: string[] };
      teamId?: string;
    } = {
      sprintId: sprint.id,
      assigneeEmployeeId: { in: employeeIds },
    };

    if (teamId) {
      taskWhere.teamId = teamId;
    }

    const tasks = await prisma.task.findMany({
      where: taskWhere,
      select: {
        id: true,
        assigneeEmployeeId: true,
        storyPoints: true,
        status: true,
        teamId: true,
        team: {
          select: {
            teamName: true,
          },
        },
      },
    });

    // 9. Fetch approved leave overlapping the sprint for authorized employees
    const leaves = await prisma.leaveRequest.findMany({
      where: {
        status: "Approved",
        employeeId: { in: employeeIds },
        startDate: { lte: sprint.endDate },
        endDate: { gte: sprint.startDate },
      },
      select: {
        id: true,
        employeeId: true,
        startDate: true,
        endDate: true,
        status: true,
        days: true,
      },
    });

    // 10. Fetch team affiliations for authorized employees
    const employeeTeamsMap = new Map<string, Set<string>>();

    // Teams led
    const ledTeams = await prisma.team.findMany({
      where: { teamLeadEmployeeId: { in: employeeIds } },
      select: { teamLeadEmployeeId: true, teamName: true },
    });
    for (const lt of ledTeams) {
      if (lt.teamLeadEmployeeId) {
        const set = employeeTeamsMap.get(lt.teamLeadEmployeeId) || new Set<string>();
        set.add(lt.teamName);
        employeeTeamsMap.set(lt.teamLeadEmployeeId, set);
      }
    }

    // Teams through task assignments
    const allEmployeeTasks = await prisma.task.findMany({
      where: { assigneeEmployeeId: { in: employeeIds } },
      select: { assigneeEmployeeId: true, team: { select: { teamName: true } } },
    });
    for (const at of allEmployeeTasks) {
      const set = employeeTeamsMap.get(at.assigneeEmployeeId) || new Set<string>();
      if (at.team?.teamName) set.add(at.team.teamName);
      employeeTeamsMap.set(at.assigneeEmployeeId, set);
    }

    // Group leaves and tasks by employee
    const leavesByEmployee = new Map<string, typeof leaves>();
    for (const l of leaves) {
      const list = leavesByEmployee.get(l.employeeId) || [];
      list.push(l);
      leavesByEmployee.set(l.employeeId, list);
    }

    const tasksByEmployee = new Map<string, typeof tasks>();
    for (const t of tasks) {
      const list = tasksByEmployee.get(t.assigneeEmployeeId) || [];
      list.push(t);
      tasksByEmployee.set(t.assigneeEmployeeId, list);
    }

    // 11. Calculate metrics for each employee
    const allEmployeeMetrics = employees.map((emp) => {
      const empLeaves = leavesByEmployee.get(emp.id) || [];
      const empTasks = tasksByEmployee.get(emp.id) || [];

      // Calculate approved overlapping leave days
      const leaveResult = calculateOverlappingLeaveWorkingDays(
        sprint.startDate,
        sprint.endDate,
        empLeaves,
        holidayDateStrings
      );

      // Calculate capacity and workload metrics
      return calculateEmployeeCapacity({
        employeeId: emp.id,
        sprintWorkingDays,
        approvedLeaveWorkingDays: leaveResult.approvedLeaveWorkingDays,
        tasks: empTasks,
      });
    });

    // 12. Calculate sprint-level summary metrics before pagination
    const summary = calculateSprintCapacitySummary(allEmployeeMetrics, sprintWorkingDays);

    // 13. Serialize employee records for API response (safe zero-capacity serialization)
    const employeeMap = new Map(employees.map((e) => [e.id, e]));

    const serializedRecords: SerializedEmployeeCapacityRecord[] = allEmployeeMetrics.map(
      (metric) => {
        const emp = employeeMap.get(metric.employeeId);
        const name = emp
          ? emp.fullName || `${emp.firstName} ${emp.lastName}`.trim()
          : metric.employeeId;
        const email = emp?.email || "";
        const department = emp?.department?.name || null;
        const roleTitle = emp?.role?.roleTitle || emp?.role?.name || null;
        const teamNames = Array.from(employeeTeamsMap.get(metric.employeeId) || []).sort();

        // Safe JSON serialization for utilization
        let utilizationPercentage: number | null = null;
        let utilizationDisplay = "0%";

        if (metric.netCapacity <= 0) {
          if (metric.plannedOpenPoints > 0) {
            utilizationPercentage = null; // Prevent JSON Infinity
            utilizationDisplay = "∞";
          } else {
            utilizationPercentage = 0;
            utilizationDisplay = "0%";
          }
        } else {
          utilizationPercentage = metric.utilizationPercentage;
          utilizationDisplay = `${metric.utilizationPercentage}%`;
        }

        return {
          employeeId: metric.employeeId,
          employeeName: name,
          email,
          department,
          roleTitle,
          teams: teamNames,
          sprintId: sprint.id,
          sprintName: sprint.sprintName,
          grossCapacity: metric.grossCapacity,
          approvedLeaveWorkingDays: metric.approvedLeaveWorkingDays,
          leaveCapacityReduction: metric.leaveCapacityReduction,
          availableWorkingDays: metric.availableWorkingDays,
          netCapacity: metric.netCapacity,
          plannedOpenPoints: metric.plannedOpenPoints,
          completedPoints: metric.completedPoints,
          totalPlannedPoints: metric.totalPlannedPoints,
          excessPoints: metric.excessPoints,
          utilizationPercentage,
          utilizationDisplay,
          classification: metric.classification,
          isOverloaded: metric.isOverloaded,
          warningMessage: metric.warningMessage,
        };
      }
    );

    // 14. Apply pagination consistently
    const total = serializedRecords.length;
    const totalPages = Math.ceil(total / pageSize);
    const skip = (page - 1) * pageSize;
    const paginatedEmployees = serializedRecords.slice(skip, skip + pageSize);

    // 15. Return formatted response
    const responsePayload: CapacityApiResponse = {
      success: true,
      data: {
        sprint: {
          id: sprint.id,
          name: sprint.sprintName,
          startDate: formatDateToISOString(sprint.startDate),
          endDate: formatDateToISOString(sprint.endDate),
          workingDays: sprintWorkingDays,
        },
        configuration: DEFAULT_CAPACITY_CONFIGURATION,
        summary: {
          ...summary,
          remainingPoints: summary.totalOpenPoints,
        },
        sprintProgress: {
          plannedPoints: summary.totalPlannedPoints,
          completedPoints: summary.totalCompletedPoints,
          remainingPoints: summary.totalOpenPoints,
          completionPercentage: summary.completionPercentage,
        },
        employees: paginatedEmployees,
        pagination: {
          page,
          pageSize,
          total,
          totalPages,
        },
      },
    };

    return NextResponse.json(responsePayload, { headers: NO_CACHE_HEADERS });
  } catch (error) {
    console.error("Error in GET /api/v1/capacity:", error);
    return NextResponse.json(
      { error: "Internal server error calculating workload and capacity." },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}
