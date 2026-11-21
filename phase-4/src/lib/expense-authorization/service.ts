/**
 * Corporate Expense Authorization Business Logic & Domain Service
 * src/lib/expense-authorization/service.ts
 *
 * Implements:
 * - Request creation and reference code generation (CEA-YYYY-XXXX)
 * - Server-side authorization check (reporting chain for managers, org-wide for HR/Admin)
 * - Strict self-approval prohibition (HTTP 403 if requester === approver)
 * - Concurrency & idempotency protection (HTTP 409 if already decided)
 * - Mandatory rejection reason validation
 * - Atomic transaction execution via Prisma.$transaction
 * - Immutable audit trail logging (EXPENSE_AUTH_CREATED, EXPENSE_AUTH_APPROVED, EXPENSE_AUTH_REJECTED)
 * - Decision notifications for requesters
 * - Complete isolation from Accounts Payable (Expense) payment records
 */

import { prisma } from "@/lib/prisma";
import { AuthenticatedUser } from "@/lib/auth/user";
import {
  CreateExpenseAuthorizationInput,
  ExpenseAuthorizationDecisionInput,
  UnifiedApprovalsQueryInput,
} from "@/lib/validations/expense-authorization";

export interface ExpenseAuthDecisionResult {
  success: boolean;
  statusCode: number;
  message: string;
  data?: any;
}

/**
 * Generate sequential, unique reference numbers: CEA-YYYY-XXXX
 */
async function generateReferenceNumber(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const prefix = `CEA-${currentYear}-`;

  const lastRecord = await prisma.corporateExpenseAuthorization.findFirst({
    where: {
      referenceNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      referenceNumber: true,
    },
  });

  let nextSequence = 1;
  if (lastRecord && lastRecord.referenceNumber) {
    const parts = lastRecord.referenceNumber.split("-");
    const numPart = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(numPart)) {
      nextSequence = numPart + 1;
    }
  }

  return `${prefix}${nextSequence.toString().padStart(4, "0")}`;
}

/**
 * Helper to retrieve all subordinate employee IDs for a given manager
 */
async function getSubordinateEmployeeIds(managerEmployeeId: string): Promise<string[]> {
  const directReports = await prisma.employee.findMany({
    where: { managerId: managerEmployeeId },
    select: { id: true },
  });

  const allIds = new Set<string>();
  const toProcess = directReports.map((r) => r.id);

  while (toProcess.length > 0) {
    const currentId = toProcess.pop()!;
    allIds.add(currentId);

    const nextReports = await prisma.employee.findMany({
      where: { managerId: currentId },
      select: { id: true },
    });

    for (const r of nextReports) {
      if (!allIds.has(r.id)) {
        toProcess.push(r.id);
      }
    }
  }

  return Array.from(allIds);
}

/**
 * Verify whether an approver has authority over a requester
 */
export async function verifyExpenseApproverAuthorization(
  actor: AuthenticatedUser,
  requesterEmployeeId: string
): Promise<{ authorized: boolean; isSelf: boolean; reason?: string }> {
  const isSelf = actor.employeeId === requesterEmployeeId;
  if (isSelf) {
    return {
      authorized: false,
      isSelf: true,
      reason: "Self-approval is strictly prohibited: Requesters cannot approve their own expense authorizations.",
    };
  }

  if (actor.role === "Admin" || actor.role === "HR") {
    return { authorized: true, isSelf: false };
  }

  if (actor.role === "Manager") {
    if (!actor.employeeId) {
      return { authorized: false, isSelf: false, reason: "Manager has no assigned employee record." };
    }

    const subordinateIds = await getSubordinateEmployeeIds(actor.employeeId);
    if (subordinateIds.includes(requesterEmployeeId)) {
      return { authorized: true, isSelf: false };
    }

    return {
      authorized: false,
      isSelf: false,
      reason: "Forbidden: You are not authorized to approve expense authorizations outside your reporting scope.",
    };
  }

  return {
    authorized: false,
    isSelf: false,
    reason: "Forbidden: Employees do not possess approval permissions.",
  };
}

/**
 * Create a new Corporate Expense Authorization Request
 */
export async function createExpenseAuthorization(
  actor: AuthenticatedUser,
  input: CreateExpenseAuthorizationInput
) {
  const requestedById = actor.employeeId || actor.id;

  const employee = await prisma.employee.findUnique({
    where: { id: requestedById },
    select: { id: true, departmentId: true },
  });

  const departmentId = input.departmentId || employee?.departmentId;
  if (!departmentId) {
    throw new Error("Unable to resolve valid department for expenditure authorization.");
  }

  const referenceNumber = await generateReferenceNumber();

  const record = await prisma.corporateExpenseAuthorization.create({
    data: {
      referenceNumber,
      title: input.title,
      description: input.description,
      category: input.category,
      requestedAmount: input.requestedAmount,
      currency: input.currency || "USD",
      departmentId,
      requestedById,
      status: "PENDING_APPROVAL",
      requiredByDate: input.requiredByDate ? new Date(input.requiredByDate) : null,
      vendorName: input.vendorName || null,
      submittedAt: new Date(),
    },
    include: {
      requester: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
      department: {
        select: { id: true, name: true, code: true },
      },
    },
  });

  // Audit log creation
  await prisma.auditLog.create({
    data: {
      actorId: actor.id,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: "EXPENSE_AUTH_CREATED",
      fieldName: "status",
      oldValue: null,
      newValue: "PENDING_APPROVAL",
      details: JSON.stringify({
        authorizationId: record.id,
        referenceNumber: record.referenceNumber,
        title: record.title,
        category: record.category,
        requestedAmount: record.requestedAmount,
        currency: record.currency,
        departmentId: record.departmentId,
        requestedById: record.requestedById,
      }),
    },
  });

  return record;
}

/**
 * Retrieve Corporate Expense Authorizations Queue
 */
export async function getExpenseAuthorizationQueue(
  actor: AuthenticatedUser,
  filters: UnifiedApprovalsQueryInput
) {
  const where: any = {};

  // Role scoping
  if (actor.role === "Manager") {
    if (!actor.employeeId) {
      return { data: [], total: 0, summary: { pending: 0, approved: 0, rejected: 0 } };
    }
    const subordinateIds = await getSubordinateEmployeeIds(actor.employeeId);
    where.requestedById = { in: subordinateIds };
  } else if (actor.role === "Employee") {
    where.requestedById = actor.employeeId || actor.id;
  }

  // Status filtering
  if (filters.status && filters.status !== "all") {
    const statusMap: Record<string, string> = {
      pending: "PENDING_APPROVAL",
      approved: "APPROVED",
      rejected: "REJECTED",
    };
    where.status = statusMap[filters.status.toLowerCase()] || filters.status.toUpperCase();
  }

  // Department filtering
  if (filters.departmentId) {
    where.departmentId = filters.departmentId;
  }

  // Search filtering
  if (filters.search) {
    const search = filters.search.trim();
    where.OR = [
      { referenceNumber: { contains: search } },
      { title: { contains: search } },
      { vendorName: { contains: search } },
      { requester: { firstName: { contains: search } } },
      { requester: { lastName: { contains: search } } },
      { requester: { email: { contains: search } } },
    ];
  }

  const page = filters.page || 1;
  const pageSize = filters.pageSize || 20;
  const skip = (page - 1) * pageSize;

  let orderBy: any = { createdAt: "desc" };
  if (filters.sortBy === "amount") {
    orderBy = { requestedAmount: filters.sortOrder || "desc" };
  } else if (filters.sortBy === "status") {
    orderBy = { status: filters.sortOrder || "asc" };
  }

  const [items, total, pendingCount, approvedCount, rejectedCount] = await Promise.all([
    prisma.corporateExpenseAuthorization.findMany({
      where,
      skip,
      take: pageSize,
      orderBy,
      include: {
        requester: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            fullName: true,
            email: true,
            workEmail: true,
            departmentId: true,
          },
        },
        department: {
          select: { id: true, name: true, code: true },
        },
        approver: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    }),
    prisma.corporateExpenseAuthorization.count({ where }),
    prisma.corporateExpenseAuthorization.count({
      where: { ...where, status: "PENDING_APPROVAL" },
    }),
    prisma.corporateExpenseAuthorization.count({
      where: { ...where, status: "APPROVED" },
    }),
    prisma.corporateExpenseAuthorization.count({
      where: { ...where, status: "REJECTED" },
    }),
  ]);

  return {
    data: items,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize) || 1,
    },
    summary: {
      pending: pendingCount,
      approved: approvedCount,
      rejected: rejectedCount,
    },
  };
}

/**
 * Retrieve Single Corporate Expense Authorization by ID
 */
export async function getExpenseAuthorizationById(
  actor: AuthenticatedUser,
  id: string
) {
  const record = await prisma.corporateExpenseAuthorization.findUnique({
    where: { id },
    include: {
      requester: {
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
          manager: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      },
      department: {
        select: { id: true, name: true, code: true },
      },
      approver: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
    },
  });

  if (!record) {
    return null;
  }

  // Authorization check
  const authCheck = await verifyExpenseApproverAuthorization(actor, record.requestedById);
  if (!authCheck.authorized && !authCheck.isSelf) {
    throw new Error("Forbidden: You are not authorized to view this corporate expense authorization.");
  }

  // Query audit history
  const auditLogs = await prisma.auditLog.findMany({
    where: {
      action: { in: ["EXPENSE_AUTH_CREATED", "EXPENSE_AUTH_APPROVED", "EXPENSE_AUTH_REJECTED"] },
      details: { contains: id },
    },
    orderBy: { createdAt: "desc" },
  });

  return {
    ...record,
    canApprove: authCheck.authorized && record.status === "PENDING_APPROVAL",
    isSelf: authCheck.isSelf,
    auditHistory: auditLogs.map((log) => ({
      id: log.id,
      action: log.action,
      actorId: log.actorId,
      actorEmail: log.actorEmail,
      actorRole: log.actorRole,
      createdAt: log.createdAt.toISOString(),
      details: log.details ? JSON.parse(log.details) : null,
    })),
  };
}

/**
 * Approve or Reject a Corporate Expense Authorization
 */
export async function decideExpenseAuthorization(
  actor: AuthenticatedUser,
  id: string,
  input: ExpenseAuthorizationDecisionInput
): Promise<ExpenseAuthDecisionResult> {
  // 1. Fetch request
  const record = await prisma.corporateExpenseAuthorization.findUnique({
    where: { id },
    include: {
      requester: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          users: { select: { id: true, email: true } },
        },
      },
    },
  });

  if (!record) {
    return {
      success: false,
      statusCode: 404,
      message: `Corporate expense authorization with ID "${id}" was not found.`,
    };
  }

  // 2. Concurrency & Idempotency: Must be PENDING_APPROVAL
  if (record.status !== "PENDING_APPROVAL") {
    return {
      success: false,
      statusCode: 409,
      message: `Cannot decide request: Expense authorization is already ${record.status}. Only pending requests can be decided.`,
    };
  }

  // 3. Strict Self-Approval Prevention
  const authCheck = await verifyExpenseApproverAuthorization(actor, record.requestedById);
  if (!authCheck.authorized) {
    return {
      success: false,
      statusCode: 403,
      message: authCheck.reason || "Unauthorized to decide this expense authorization.",
    };
  }

  // 4. Rejection validation
  if (input.action === "REJECT" && (!input.rejectionReason || input.rejectionReason.trim().length < 3)) {
    return {
      success: false,
      statusCode: 422,
      message: "A mandatory rejection reason of at least 3 characters is required when rejecting a request.",
    };
  }

  const isApproved = input.action === "APPROVE";
  const newStatus = isApproved ? "APPROVED" : "REJECTED";
  const approverEmployeeId = actor.employeeId || actor.id;

  // 5. Transactional execution with atomic conditional update
  try {
    const updatedRecord = await prisma.$transaction(async (tx) => {
      // Atomic conditional update: guarantees only one transaction transitions from PENDING_APPROVAL
      const updateResult = await tx.corporateExpenseAuthorization.updateMany({
        where: {
          id,
          status: "PENDING_APPROVAL",
        },
        data: {
          status: newStatus,
          approverId: approverEmployeeId,
          decidedAt: new Date(),
          rejectionReason: isApproved ? null : input.rejectionReason?.trim(),
          approvalNotes: input.approvalNotes?.trim() || null,
        },
      });

      if (updateResult.count === 0) {
        throw new Error("CONCURRENCY_CONFLICT_ALREADY_DECIDED");
      }

      const updated = await tx.corporateExpenseAuthorization.findUniqueOrThrow({
        where: { id },
      });

      // Record audit event
      await tx.auditLog.create({
        data: {
          actorId: actor.id,
          actorEmail: actor.email,
          actorRole: actor.role,
          action: isApproved ? "EXPENSE_AUTH_APPROVED" : "EXPENSE_AUTH_REJECTED",
          fieldName: "status",
          oldValue: "PENDING_APPROVAL",
          newValue: newStatus,
          details: JSON.stringify({
            authorizationId: id,
            referenceNumber: record.referenceNumber,
            decision: input.action,
            rejectionReason: input.rejectionReason || null,
            approvalNotes: input.approvalNotes || null,
            requestedAmount: record.requestedAmount,
            currency: record.currency,
            approverId: approverEmployeeId,
          }),
        },
      });

      // Send notification to requester if User relation exists
      if (record.requester.users && record.requester.users.length > 0) {
        const recipientUserId = record.requester.users[0].id;
        await tx.notification.create({
          data: {
            userId: recipientUserId,
            title: `Expense Authorization ${isApproved ? "Approved" : "Rejected"}`,
            message: `Your corporate expense authorization ${record.referenceNumber} (${record.title}) has been ${newStatus.toLowerCase()} by ${actor.name || actor.email}.`,
            eventKey: `EXPENSE_AUTH_${newStatus}_${id}`,
          },
        });
      }

      return updated;
    });

    return {
      success: true,
      statusCode: 200,
      message: `Corporate expense authorization ${record.referenceNumber} has been successfully ${newStatus.toLowerCase()}.`,
      data: updatedRecord,
    };
  } catch (err: any) {
    if (err?.message === "CONCURRENCY_CONFLICT_ALREADY_DECIDED") {
      return {
        success: false,
        statusCode: 409,
        message: `Cannot decide request: Expense authorization was already decided by another concurrent transaction. Only pending requests can be decided.`,
      };
    }
    throw err;
  }
}
