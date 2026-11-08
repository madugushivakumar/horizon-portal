/**
 * Horizon Portal — Audit Logging & Compliance System
 * src/lib/audit/audit-logger.ts
 *
 * Provides immutable, database-backed audit trail logging for employee mutations:
 * - Atomic persistence with Prisma transactions
 * - Exact field-level diff calculation (previous value vs. new value)
 * - Strict omission of unchanged fields (no-op prevention)
 * - Strict exclusion of sensitive secrets (passwords, tokens, salary)
 * - Actor identity snapshot derived securely from authenticated server session
 */

import { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { AuthenticatedUser } from "@/lib/auth/user";

export type AuditAction =
  | "EMPLOYEE_CREATED"
  | "EMPLOYEE_UPDATED"
  | "EMPLOYEE_DEACTIVATED"
  | "EMPLOYEE_EXPORTED"
  | "LEAVE_APPROVED"
  | "LEAVE_REJECTED"
  | "LEAVE_DELEGATED"
  | "LEAVE_ESCALATED"
  | "ATTENDANCE_ACCESSED";

export interface FieldDiff {
  fieldName: string;
  oldValue: string | null;
  newValue: string | null;
}

export interface AuditActorSnapshot {
  actorId: string;
  actorEmail?: string | null;
  actorRole?: string | null;
}

export interface AuditLogQueryFilters {
  employeeId?: string;
  action?: string;
  actorId?: string;
  page?: number;
  pageSize?: number;
}

// Fields that must NEVER be logged to audit entries for security & privacy
const RESTRICTED_AUDIT_FIELDS = new Set([
  "password",
  "passwordHash",
  "password_hash",
  "salary",
  "token",
  "secret",
  "bankAccount",
  "bank_account",
]);

/**
 * Extracts actor snapshot from an authenticated user object.
 */
export function getActorSnapshot(user: AuthenticatedUser): AuditActorSnapshot {
  return {
    actorId: user.id,
    actorEmail: user.email,
    actorRole: user.role,
  };
}

/**
 * Calculates field-level diffs between existing employee record and incoming update data.
 * Skips identical/unchanged values and completely ignores sensitive fields.
 */
export function calculateEmployeeDiff(
  existing: Record<string, unknown>,
  updated: Record<string, unknown>
): FieldDiff[] {
  const diffs: FieldDiff[] = [];

  for (const [key, nextVal] of Object.entries(updated)) {
    if (RESTRICTED_AUDIT_FIELDS.has(key)) {
      continue;
    }

    // Skip internal or undefined fields
    if (nextVal === undefined || key === "updatedAt" || key === "createdAt") {
      continue;
    }

    const prevVal = existing[key];

    // Normalize values for comparison
    const normalizedPrev = normalizeAuditValue(prevVal);
    const normalizedNext = normalizeAuditValue(nextVal);

    if (normalizedPrev !== normalizedNext) {
      diffs.push({
        fieldName: key,
        oldValue: normalizedPrev,
        newValue: normalizedNext,
      });
    }
  }

  return diffs;
}

/**
 * Normalizes different value types into standardized string representations for audit logs.
 */
function normalizeAuditValue(val: unknown): string | null {
  if (val === null || val === undefined) {
    return null;
  }
  if (val instanceof Date) {
    return val.toISOString().split("T")[0];
  }
  if (typeof val === "object") {
    return JSON.stringify(val);
  }
  return String(val).trim();
}

/**
 * Generates a unique correlation / event identifier for multi-field changes.
 */
export function generateAuditEventId(): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).substring(2, 8);
  return `evt_${ts}_${rand}`;
}

/**
 * Persists audit log entries for a newly created employee record inside a Prisma transaction.
 */
export async function logEmployeeCreation(
  tx: Prisma.TransactionClient,
  actor: AuditActorSnapshot,
  employee: Record<string, unknown>,
  correlationId?: string
): Promise<string> {
  const eventId = correlationId || generateAuditEventId();
  const employeeId = String(employee.id);

  const initialFields: Array<{ key: string; value: unknown }> = [
    { key: "id", value: employee.id },
    { key: "firstName", value: employee.firstName },
    { key: "lastName", value: employee.lastName },
    { key: "email", value: employee.email },
    { key: "workEmail", value: employee.workEmail },
    { key: "phone", value: employee.phone },
    { key: "departmentId", value: employee.departmentId },
    { key: "roleId", value: employee.roleId },
    { key: "managerId", value: employee.managerId },
    { key: "workLocation", value: employee.workLocation },
    { key: "workMode", value: employee.workMode },
    { key: "employmentType", value: employee.employmentType },
    { key: "hireDate", value: employee.hireDate },
    { key: "status", value: employee.status || "Active" },
  ];

  const auditEntries = initialFields
    .filter((f) => f.value !== null && f.value !== undefined && f.value !== "")
    .map((f) => ({
      eventId,
      actorId: actor.actorId,
      actorEmail: actor.actorEmail || null,
      actorRole: actor.actorRole || null,
      action: "EMPLOYEE_CREATED" as const,
      employeeId,
      fieldName: f.key,
      oldValue: null,
      newValue: normalizeAuditValue(f.value),
      details: null,
    }));

  if (auditEntries.length > 0) {
    await tx.auditLog.createMany({
      data: auditEntries,
    });
  }

  return eventId;
}

/**
 * Persists audit log entries for an employee update.
 * Only records fields that actually changed.
 */
export async function logEmployeeUpdate(
  tx: Prisma.TransactionClient,
  actor: AuditActorSnapshot,
  employeeId: string,
  diffs: FieldDiff[],
  correlationId?: string
): Promise<string | null> {
  if (diffs.length === 0) {
    return null;
  }

  const eventId = correlationId || generateAuditEventId();

  const auditEntries = diffs.map((d) => ({
    eventId,
    actorId: actor.actorId,
    actorEmail: actor.actorEmail || null,
    actorRole: actor.actorRole || null,
    action: "EMPLOYEE_UPDATED" as const,
    employeeId,
    fieldName: d.fieldName,
    oldValue: d.oldValue,
    newValue: d.newValue,
    details: null,
  }));

  await tx.auditLog.createMany({
    data: auditEntries,
  });

  return eventId;
}

/**
 * Persists audit log for an employee deactivation.
 */
export async function logEmployeeDeactivation(
  tx: Prisma.TransactionClient,
  actor: AuditActorSnapshot,
  employeeId: string,
  previousStatus: string,
  reason?: string,
  correlationId?: string
): Promise<string> {
  const eventId = correlationId || generateAuditEventId();

  await tx.auditLog.create({
    data: {
      eventId,
      actorId: actor.actorId,
      actorEmail: actor.actorEmail || null,
      actorRole: actor.actorRole || null,
      action: "EMPLOYEE_DEACTIVATED",
      employeeId,
      fieldName: "status",
      oldValue: previousStatus,
      newValue: "Inactive",
      details: reason ? JSON.stringify({ reason }) : null,
    },
  });

  return eventId;
}

/**
 * Records an employee export event without dumping the full dataset into the audit table.
 */
export async function logEmployeeExport(
  actor: AuditActorSnapshot,
  filterSummary: Record<string, unknown>,
  rowCount: number
): Promise<string> {
  const eventId = generateAuditEventId();

  await prisma.auditLog.create({
    data: {
      eventId,
      actorId: actor.actorId,
      actorEmail: actor.actorEmail || null,
      actorRole: actor.actorRole || null,
      action: "EMPLOYEE_EXPORTED",
      employeeId: null,
      fieldName: null,
      oldValue: null,
      newValue: null,
      details: JSON.stringify({
        rowCount,
        filters: filterSummary,
        exportedAt: new Date().toISOString(),
      }),
    },
  });

  return eventId;
}

export interface LeaveDecisionAuditParams {
  actor: AuditActorSnapshot;
  action: "LEAVE_APPROVED" | "LEAVE_REJECTED" | "LEAVE_DELEGATED" | "LEAVE_ESCALATED";
  employeeId: string;
  leaveRequestId: string;
  previousStatus: string;
  newStatus: string;
  reason?: string | null;
  delegationContext?: Record<string, unknown> | null;
  correlationId?: string;
}

/**
 * Persists an audit log entry for leave decisions (approval, rejection, delegation, escalation).
 */
export async function logLeaveDecision(
  tx: Prisma.TransactionClient,
  params: LeaveDecisionAuditParams
): Promise<string> {
  const eventId = params.correlationId || generateAuditEventId();

  await tx.auditLog.create({
    data: {
      eventId,
      actorId: params.actor.actorId,
      actorEmail: params.actor.actorEmail || null,
      actorRole: params.actor.actorRole || null,
      action: params.action,
      employeeId: params.employeeId,
      fieldName: "status",
      oldValue: params.previousStatus,
      newValue: params.newStatus,
      details: JSON.stringify({
        leaveRequestId: params.leaveRequestId,
        reason: params.reason || null,
        delegation: params.delegationContext || null,
        decidedAt: new Date().toISOString(),
      }),
    },
  });

  return eventId;
}

/**
 * Queries audit logs with pagination and optional filtering by employee, action, or actor.
 */
export async function queryAuditLogs(filters: AuditLogQueryFilters = {}) {
  const page = Math.max(1, filters.page || 1);
  const pageSize = Math.min(100, Math.max(1, filters.pageSize || 25));

  const where: Prisma.AuditLogWhereInput = {};

  if (filters.employeeId) {
    where.employeeId = filters.employeeId;
  }
  if (filters.action) {
    where.action = filters.action;
  }
  if (filters.actorId) {
    where.actorId = filters.actorId;
  }

  const [total, records] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return {
    data: records,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize) || 1,
    },
  };
}
