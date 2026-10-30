/**
 * Horizon Portal — Server-Side Leave Approval & Team Oversight Engine
 * src/lib/leave/approval-service.ts
 *
 * Provides transactional, concurrency-safe leave approvals and rejections:
 * - Strict role-based scoping (Manager = team direct reports & delegated, HR/Admin = organization-wide)
 * - Self-approval prevention (HTTP 403/400)
 * - Manager absence detection & acting manager routing with safe HR fallback
 * - Circular delegation prevention
 * - Concurrency protection: Atomic state transition (Pending -> Approved / Rejected)
 * - Exact-once leave balance deduction on approval
 * - Idempotent personal decision notification via notify()
 * - Full audit compliance logging via logLeaveDecision()
 */

import { prisma } from "@/lib/prisma";
import { AuthenticatedUser } from "@/lib/auth/user";
import { getActorSnapshot, logLeaveDecision } from "@/lib/audit/audit-logger";
import { notify } from "@/lib/notifications/notify";

export interface LeaveDecisionResult {
  success: boolean;
  statusCode: number;
  message: string;
  data?: Record<string, unknown>;
  error?: string;
}

export interface LeaveQueryFilters {
  status?: string; // "Pending" | "Approved" | "Rejected" | "All"
  departmentId?: string;
  leaveTypeCode?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
  sortBy?: "appliedOn" | "startDate" | "endDate" | "days";
  sortOrder?: "asc" | "desc";
}

/**
 * Checks whether an actor is authorized to view or decide a leave request.
 * - Manager: Can only access direct reports OR employees where actor is active designated acting manager.
 * - HR & Admin: Can access all organizational employees.
 * - Self-approval is strictly forbidden for all roles.
 */
export async function verifyApproverAuthorization(
  actor: AuthenticatedUser,
  applicantEmployeeId: string
): Promise<{
  authorized: boolean;
  isSelf: boolean;
  isDelegated: boolean;
  delegationId?: string;
  reason?: string;
}> {
  // 1. Strict self-approval check
  if (actor.employeeId && actor.employeeId === applicantEmployeeId) {
    return {
      authorized: false,
      isSelf: true,
      isDelegated: false,
      reason: "Self-approval is strictly prohibited. You cannot approve or reject your own leave request.",
    };
  }

  // 2. HR & Admin have organization-wide authorization
  if (actor.role === "HR" || actor.role === "Admin") {
    return {
      authorized: true,
      isSelf: false,
      isDelegated: false,
    };
  }

  // 3. Manager authorization
  if (actor.role === "Manager") {
    if (!actor.employeeId) {
      return {
        authorized: false,
        isSelf: false,
        isDelegated: false,
        reason: "No employee profile linked to manager user account.",
      };
    }

    // Direct report check
    const employee = await prisma.employee.findUnique({
      where: { id: applicantEmployeeId },
      select: { id: true, managerId: true },
    });

    if (!employee) {
      return {
        authorized: false,
        isSelf: false,
        isDelegated: false,
        reason: "Applicant employee record not found.",
      };
    }

    if (employee.managerId === actor.employeeId) {
      return {
        authorized: true,
        isSelf: false,
        isDelegated: false,
      };
    }

    // Check active manager delegation
    if (employee.managerId) {
      const now = new Date();
      const activeDelegation = await prisma.managerDelegation.findFirst({
        where: {
          managerId: employee.managerId,
          actingManagerId: actor.employeeId,
          status: "Active",
          startDate: { lte: now },
          endDate: { gte: now },
        },
      });

      if (activeDelegation) {
        return {
          authorized: true,
          isSelf: false,
          isDelegated: true,
          delegationId: activeDelegation.id,
        };
      }
    }

    return {
      authorized: false,
      isSelf: false,
      isDelegated: false,
      reason: "You are not authorized to review leave requests for this employee (outside your team).",
    };
  }

  // 4. Employee role is never authorized to review/approve
  return {
    authorized: false,
    isSelf: false,
    isDelegated: false,
    reason: "Access forbidden. Employees cannot access approval operations.",
  };
}

/**
 * Evaluates whether a manager is currently unavailable (inactive or on approved leave).
 * If unavailable, resolves designated acting manager or signals escalation to HR.
 */
export async function resolveManagerAvailability(managerEmployeeId: string): Promise<{
  isAvailable: boolean;
  actingManagerId: string | null;
  actingManagerName: string | null;
  isEscalatedToHR: boolean;
  reason?: string;
}> {
  const manager = await prisma.employee.findUnique({
    where: { id: managerEmployeeId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      status: true,
      users: { select: { isActive: true } },
    },
  });

  if (!manager) {
    return {
      isAvailable: false,
      actingManagerId: null,
      actingManagerName: null,
      isEscalatedToHR: true,
      reason: "Manager record not found.",
    };
  }

  const now = new Date();
  const isInactive =
    manager.status !== "Active" ||
    manager.users.some((u) => !u.isActive) ||
    manager.users.length === 0;

  // Check if manager is on approved leave today
  const onLeave = await prisma.leaveRequest.findFirst({
    where: {
      employeeId: managerEmployeeId,
      status: "Approved",
      startDate: { lte: now },
      endDate: { gte: now },
    },
  });

  if (!isInactive && !onLeave) {
    return {
      isAvailable: true,
      actingManagerId: null,
      actingManagerName: null,
      isEscalatedToHR: false,
    };
  }

  // Manager is unavailable. Check for active delegation
  const delegation = await prisma.managerDelegation.findFirst({
    where: {
      managerId: managerEmployeeId,
      status: "Active",
      startDate: { lte: now },
      endDate: { gte: now },
    },
    include: {
      actingManager: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          status: true,
        },
      },
    },
  });

  if (
    delegation &&
    delegation.actingManager &&
    delegation.actingManager.status === "Active"
  ) {
    return {
      isAvailable: false,
      actingManagerId: delegation.actingManager.id,
      actingManagerName: `${delegation.actingManager.firstName} ${delegation.actingManager.lastName}`.trim(),
      isEscalatedToHR: false,
      reason: isInactive ? "Manager is inactive" : "Manager is on approved leave",
    };
  }

  // No active delegation found -> Escalate to HR
  return {
    isAvailable: false,
    actingManagerId: null,
    actingManagerName: null,
    isEscalatedToHR: true,
    reason: isInactive
      ? "Manager is inactive and no acting manager configured. Escalated to HR."
      : "Manager is on leave and no acting manager configured. Escalated to HR.",
  };
}

/**
 * Validates that adding a new manager delegation does not introduce circular delegation.
 * e.g., if A delegates to B, B cannot delegate to A (or in a chain).
 */
export async function validateDelegationChain(
  managerId: string,
  actingManagerId: string
): Promise<{ valid: boolean; error?: string }> {
  if (managerId === actingManagerId) {
    return { valid: false, error: "A manager cannot delegate approval authority to themselves." };
  }

  const visited = new Set<string>([managerId]);
  let current: string | null = actingManagerId;

  while (current) {
    if (visited.has(current)) {
      return {
        valid: false,
        error: `Circular delegation detected. Assigning this delegation would create a circular loop (${managerId} -> ... -> ${current}).`,
      };
    }
    visited.add(current);

    // Look for active outgoing delegations from current
    const outgoing: { actingManagerId: string } | null =
      await prisma.managerDelegation.findFirst({
        where: {
          managerId: current,
          status: "Active",
          endDate: { gte: new Date() },
        },
        select: { actingManagerId: true },
      });

    current = outgoing?.actingManagerId || null;
  }

  return { valid: true };
}

/**
 * Retrieves the leave approval queue with scoping and filters:
 * - Managers view only their direct reports + delegated requests.
 * - HR & Admin view organization-wide requests.
 */
export async function getApprovalQueue(
  actor: AuthenticatedUser,
  filters: LeaveQueryFilters = {}
) {
  if (actor.role === "Employee") {
    throw new Error("FORBIDDEN: Employees do not have access to approval queues.");
  }

  const page = Math.max(1, filters.page || 1);
  const pageSize = Math.min(100, Math.max(1, filters.pageSize || 25));

  // Determine allowed employee IDs for Manager
  let allowedEmployeeIds: string[] | null = null;
  if (actor.role === "Manager") {
    if (!actor.employeeId) {
      return {
        data: [],
        pagination: { page: 1, pageSize, total: 0, totalPages: 0 },
        summary: { pending: 0, approvedThisMonth: 0, rejectedThisMonth: 0, attention: 0 },
      };
    }

    // Direct reports
    const directReports = await prisma.employee.findMany({
      where: { managerId: actor.employeeId },
      select: { id: true },
    });

    const reportIds = new Set(directReports.map((e) => e.id));

    // Active delegations where actor is acting manager
    const now = new Date();
    const delegations = await prisma.managerDelegation.findMany({
      where: {
        actingManagerId: actor.employeeId,
        status: "Active",
        startDate: { lte: now },
        endDate: { gte: now },
      },
      select: { managerId: true },
    });

    if (delegations.length > 0) {
      const delegatedReports = await prisma.employee.findMany({
        where: {
          managerId: { in: delegations.map((d) => d.managerId) },
        },
        select: { id: true },
      });
      delegatedReports.forEach((e) => reportIds.add(e.id));
    }

    // Never include self in approval queue
    reportIds.delete(actor.employeeId);
    allowedEmployeeIds = Array.from(reportIds);

    if (allowedEmployeeIds.length === 0) {
      return {
        data: [],
        pagination: { page: 1, pageSize, total: 0, totalPages: 0 },
        summary: { pending: 0, approvedThisMonth: 0, rejectedThisMonth: 0, attention: 0 },
      };
    }
  }

  // Construct Prisma where clause
  const where: any = {};

  if (allowedEmployeeIds !== null) {
    where.employeeId = { in: allowedEmployeeIds };
  }

  if (filters.status && filters.status !== "All") {
    where.status = filters.status;
  }

  if (filters.leaveTypeCode) {
    where.leaveTypeCode = filters.leaveTypeCode;
  }

  if (filters.departmentId) {
    where.employee = {
      ...where.employee,
      departmentId: filters.departmentId,
    };
  }

  if (filters.search) {
    const term = filters.search.trim();
    where.employee = {
      ...where.employee,
      OR: [
        { id: { contains: term } },
        { firstName: { contains: term } },
        { lastName: { contains: term } },
        { fullName: { contains: term } },
        { email: { contains: term } },
      ],
    };
  }

  if (filters.startDate) {
    where.startDate = { gte: new Date(`${filters.startDate}T00:00:00.000Z`) };
  }

  if (filters.endDate) {
    where.endDate = { lte: new Date(`${filters.endDate}T23:59:59.999Z`) };
  }

  const orderBy: any = {};
  const sortCol = filters.sortBy || "appliedOn";
  const sortDir = filters.sortOrder || "desc";
  orderBy[sortCol] = sortDir;

  const [total, records] = await Promise.all([
    prisma.leaveRequest.count({ where }),
    prisma.leaveRequest.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            fullName: true,
            email: true,
            workEmail: true,
            departmentId: true,
            department: { select: { id: true, name: true, code: true } },
            managerId: true,
            manager: { select: { id: true, firstName: true, lastName: true } },
            leaveBalance: true,
          },
        },
        leaveType: {
          select: {
            id: true,
            code: true,
            name: true,
            payType: true,
          },
        },
      },
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  // Compute summary stats for the current view
  const baseScopeWhere = allowedEmployeeIds !== null ? { employeeId: { in: allowedEmployeeIds } } : {};
  const currentMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  const [pendingCount, approvedThisMonth, rejectedThisMonth] = await Promise.all([
    prisma.leaveRequest.count({
      where: { ...baseScopeWhere, status: "Pending" },
    }),
    prisma.leaveRequest.count({
      where: {
        ...baseScopeWhere,
        status: "Approved",
        decidedOn: { gte: currentMonthStart },
      },
    }),
    prisma.leaveRequest.count({
      where: {
        ...baseScopeWhere,
        status: "Rejected",
        decidedOn: { gte: currentMonthStart },
      },
    }),
  ]);

  return {
    data: records.map((r) => ({
      id: r.id,
      employeeId: r.employeeId,
      employeeName:
        r.employee.fullName || `${r.employee.firstName} ${r.employee.lastName}`.trim(),
      employeeEmail: r.employee.workEmail || r.employee.email,
      departmentId: r.employee.departmentId,
      departmentName: r.employee.department?.name || r.employee.departmentId || "General",
      managerId: r.employee.managerId,
      managerName: r.employee.manager
        ? `${r.employee.manager.firstName} ${r.employee.manager.lastName}`.trim()
        : null,
      leaveTypeCode: r.leaveTypeCode || r.leaveType?.code || "LEAVE",
      leaveTypeName: r.leaveType?.name || r.leaveTypeCode || "Leave",
      payType: r.leaveType?.payType || "Paid",
      startDate: r.startDate.toISOString().split("T")[0],
      endDate: r.endDate.toISOString().split("T")[0],
      days: r.days,
      status: r.status,
      reason: r.reason,
      appliedOn: r.appliedOn ? r.appliedOn.toISOString().split("T")[0] : null,
      approverId: r.approverId,
      decidedOn: r.decidedOn ? r.decidedOn.toISOString().split("T")[0] : null,
      rejectionReason: r.rejectionReason,
      delegatedApproverId: r.delegatedApproverId,
      isEscalated: r.isEscalated,
      leaveBalance: r.employee.leaveBalance
        ? {
            clBalance: r.employee.leaveBalance.clBalance,
            slBalance: r.employee.leaveBalance.slBalance,
            elBalance: r.employee.leaveBalance.elBalance,
            pendingDays: r.employee.leaveBalance.pendingDays,
          }
        : null,
    })),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize) || 1,
    },
    summary: {
      pending: pendingCount,
      approvedThisMonth,
      rejectedThisMonth,
      attention: pendingCount,
    },
  };
}

/**
 * Approve a leave request with concurrency protection, balance deduction, audit, and notifications.
 */
export async function approveLeaveRequest(
  actor: AuthenticatedUser,
  requestId: string
): Promise<LeaveDecisionResult> {
  // 1. Fetch request with applicant details
  const leaveReq = await prisma.leaveRequest.findUnique({
    where: { id: requestId },
    include: {
      employee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          managerId: true,
          users: { select: { id: true, email: true, isActive: true } },
          leaveBalance: true,
        },
      },
      leaveType: true,
    },
  });

  if (!leaveReq) {
    return {
      success: false,
      statusCode: 404,
      message: "Leave request not found.",
    };
  }

  // 2. Concurrency check: must be strictly pending
  if (leaveReq.status !== "Pending") {
    return {
      success: false,
      statusCode: 409,
      message: `Cannot approve request: Request is already ${leaveReq.status}. Only pending requests can be approved.`,
    };
  }

  // 3. Authorization & self-approval validation
  const authCheck = await verifyApproverAuthorization(actor, leaveReq.employeeId);
  if (!authCheck.authorized) {
    return {
      success: false,
      statusCode: 403,
      message: authCheck.reason || "Unauthorized to approve this leave request.",
    };
  }

  // 4. Leave balance sufficiency check
  const code = (leaveReq.leaveTypeCode || "CL").toUpperCase();
  const balance = leaveReq.employee.leaveBalance;
  if (code !== "LOP" && balance) {
    let currentBalance = 0;
    if (code === "CL") currentBalance = balance.clBalance;
    else if (code === "SL") currentBalance = balance.slBalance;
    else if (code === "EL") currentBalance = balance.elBalance;

    if (currentBalance < leaveReq.days) {
      return {
        success: false,
        statusCode: 400,
        message: `Insufficient leave balance to approve this request. Available: ${currentBalance} days, Requested: ${leaveReq.days} days.`,
      };
    }
  }

  // 5. Execute atomic transaction: state update, balance decrement, audit log
  const now = new Date();
  const approverIdentifier = actor.employeeId || actor.id;

  try {
    await prisma.$transaction(async (tx) => {
      // Concurrency lock: update status ONLY IF still Pending
      const updateResult = await tx.leaveRequest.updateMany({
        where: {
          id: requestId,
          status: "Pending",
        },
        data: {
          status: "Approved",
          approverId: approverIdentifier,
          decidedOn: now,
          delegatedApproverId: authCheck.isDelegated ? approverIdentifier : null,
        },
      });

      if (updateResult.count === 0) {
        throw new Error("CONCURRENCY_CONFLICT: Request was already decided by another approver.");
      }

      // Decrement pendingDays and deduct actual balance exactly once
      if (balance) {
        const balanceData: any = {
          pendingDays: {
            decrement: leaveReq.days,
          },
        };

        if (code === "CL") {
          balanceData.clBalance = { decrement: leaveReq.days };
          balanceData.clUsed = { increment: leaveReq.days };
        } else if (code === "SL") {
          balanceData.slBalance = { decrement: leaveReq.days };
          balanceData.slUsed = { increment: leaveReq.days };
        } else if (code === "EL") {
          balanceData.elBalance = { decrement: leaveReq.days };
          balanceData.elUsedFy = { increment: leaveReq.days };
        }

        if (balance.balance !== null && balance.balance !== undefined) {
          balanceData.balance = { decrement: leaveReq.days };
        }
        if (balance.used !== null && balance.used !== undefined) {
          balanceData.used = { increment: leaveReq.days };
        }

        await tx.leaveBalance.update({
          where: { employeeId: leaveReq.employeeId },
          data: balanceData,
        });
      }

      // Log audit compliance record
      const actorSnapshot = getActorSnapshot(actor);
      await logLeaveDecision(tx, {
        actor: actorSnapshot,
        action: authCheck.isDelegated ? "LEAVE_DELEGATED" : "LEAVE_APPROVED",
        employeeId: leaveReq.employeeId,
        leaveRequestId: requestId,
        previousStatus: "Pending",
        newStatus: "Approved",
        delegationContext: authCheck.isDelegated
          ? { delegationId: authCheck.delegationId, actingApprover: approverIdentifier }
          : null,
      });
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    if (errorMsg.includes("CONCURRENCY_CONFLICT")) {
      return {
        success: false,
        statusCode: 409,
        message: "Request has already been decided by another session.",
      };
    }
    console.error("Approval transaction failed:", err);
    return {
      success: false,
      statusCode: 500,
      message: `Failed to approve leave request: ${errorMsg}`,
    };
  }

  // 6. Post-transaction: Send single notification to applicant
  const activeUser = leaveReq.employee.users.find((u) => u.isActive);
  if (activeUser) {
    const startStr = leaveReq.startDate.toISOString().split("T")[0];
    const endStr = leaveReq.endDate.toISOString().split("T")[0];
    const approverName = actor.name || "Management";
    const daysLabel = leaveReq.days === 1 ? "1 day" : `${leaveReq.days} days`;

    await notify({
      userId: activeUser.id,
      title: "Leave Request Approved",
      message: `Your leave request from ${startStr} to ${endStr} (${daysLabel}) has been approved by ${approverName}.`,
      eventKey: `leave_approved:${requestId}`,
    });
  }

  return {
    success: true,
    statusCode: 200,
    message: "Leave request approved successfully.",
    data: {
      id: requestId,
      status: "Approved",
      approverId: approverIdentifier,
      decidedOn: now.toISOString(),
      days: leaveReq.days,
    },
  };
}

/**
 * Reject a leave request with mandatory reason validation, balance restoration, audit, and notifications.
 */
export async function rejectLeaveRequest(
  actor: AuthenticatedUser,
  requestId: string,
  rawReason: string
): Promise<LeaveDecisionResult> {
  // 1. Mandatory rejection reason validation
  if (!rawReason || typeof rawReason !== "string" || !rawReason.trim()) {
    return {
      success: false,
      statusCode: 400,
      message: "A non-empty rejection reason is mandatory. Whitespace-only reasons are not permitted.",
    };
  }

  const cleanReason = rawReason.trim();
  if (cleanReason.length < 3) {
    return {
      success: false,
      statusCode: 400,
      message: "Rejection reason must be at least 3 characters long.",
    };
  }

  if (cleanReason.length > 1000) {
    return {
      success: false,
      statusCode: 400,
      message: "Rejection reason exceeds maximum length of 1,000 characters.",
    };
  }

  // 2. Fetch request
  const leaveReq = await prisma.leaveRequest.findUnique({
    where: { id: requestId },
    include: {
      employee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          managerId: true,
          users: { select: { id: true, email: true, isActive: true } },
          leaveBalance: true,
        },
      },
    },
  });

  if (!leaveReq) {
    return {
      success: false,
      statusCode: 404,
      message: "Leave request not found.",
    };
  }

  // 3. Concurrency check: must be strictly pending
  if (leaveReq.status !== "Pending") {
    return {
      success: false,
      statusCode: 409,
      message: `Cannot reject request: Request is already ${leaveReq.status}. Only pending requests can be decided.`,
    };
  }

  // 4. Authorization & self-approval check
  const authCheck = await verifyApproverAuthorization(actor, leaveReq.employeeId);
  if (!authCheck.authorized) {
    return {
      success: false,
      statusCode: 403,
      message: authCheck.reason || "Unauthorized to reject this leave request.",
    };
  }

  // 5. Execute atomic transaction: state update, release pendingDays, audit log
  const now = new Date();
  const approverIdentifier = actor.employeeId || actor.id;

  try {
    await prisma.$transaction(async (tx) => {
      const updateResult = await tx.leaveRequest.updateMany({
        where: {
          id: requestId,
          status: "Pending",
        },
        data: {
          status: "Rejected",
          approverId: approverIdentifier,
          decidedOn: now,
          rejectionReason: cleanReason,
          delegatedApproverId: authCheck.isDelegated ? approverIdentifier : null,
        },
      });

      if (updateResult.count === 0) {
        throw new Error("CONCURRENCY_CONFLICT: Request was already decided by another approver.");
      }

      // Decrement pendingDays on balance record (actual balance untouched)
      if (leaveReq.employee.leaveBalance) {
        await tx.leaveBalance.update({
          where: { employeeId: leaveReq.employeeId },
          data: {
            pendingDays: {
              decrement: leaveReq.days,
            },
          },
        });
      }

      // Audit compliance log
      const actorSnapshot = getActorSnapshot(actor);
      await logLeaveDecision(tx, {
        actor: actorSnapshot,
        action: "LEAVE_REJECTED",
        employeeId: leaveReq.employeeId,
        leaveRequestId: requestId,
        previousStatus: "Pending",
        newStatus: "Rejected",
        reason: cleanReason,
        delegationContext: authCheck.isDelegated
          ? { delegationId: authCheck.delegationId, actingApprover: approverIdentifier }
          : null,
      });
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    if (errorMsg.includes("CONCURRENCY_CONFLICT")) {
      return {
        success: false,
        statusCode: 409,
        message: "Request has already been decided by another session.",
      };
    }
    console.error("Rejection transaction failed:", err);
    return {
      success: false,
      statusCode: 500,
      message: `Failed to reject leave request: ${errorMsg}`,
    };
  }

  // 6. Post-transaction: Send notification to employee
  const activeUser = leaveReq.employee.users.find((u) => u.isActive);
  if (activeUser) {
    const startStr = leaveReq.startDate.toISOString().split("T")[0];
    const endStr = leaveReq.endDate.toISOString().split("T")[0];

    await notify({
      userId: activeUser.id,
      title: "Leave Request Rejected",
      message: `Your leave request from ${startStr} to ${endStr} has been rejected.\n\nReason: ${cleanReason}`,
      eventKey: `leave_rejected:${requestId}`,
    });
  }

  return {
    success: true,
    statusCode: 200,
    message: "Leave request rejected.",
    data: {
      id: requestId,
      status: "Rejected",
      approverId: approverIdentifier,
      decidedOn: now.toISOString(),
      rejectionReason: cleanReason,
    },
  };
}
