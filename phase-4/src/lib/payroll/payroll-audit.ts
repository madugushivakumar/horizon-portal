/**
 * Horizon Portal — Payroll Correction Audit Foundation & Payload Builder
 * src/lib/payroll/payroll-audit.ts
 *
 * Provides standardized, structured audit event payload builders for future
 * payroll correction transactions:
 * - Deterministic correlation ID generation (auditEventId)
 * - Before-and-after financial snapshot captures
 * - Structured metadata with integer paise representation
 * - Safe transaction compatibility for atomic prisma.$transaction commits
 *
 * NOTE: This is a preparation utility for future Step 2B mutations.
 * Step 2A is strictly read-only and DOES NOT create or persist audit rows.
 */

import { Prisma } from "@prisma/client";

export type PayrollCorrectionAuditAction =
  | "PAYROLL_PRE_APPROVAL_CORRECTION"
  | "PAYROLL_HISTORICAL_ADJUSTED"
  | "PAYROLL_ADJUSTMENT_PROPOSED"
  | "PAYROLL_ADJUSTMENT_APPROVED"
  | "PAYROLL_ADJUSTMENT_REJECTED";

export interface PayrollCorrectionActor {
  actorId: string;
  actorEmail: string;
  actorRole: string;
}

export interface PayrollCorrectionAuditSnapshot {
  employeesPaid: number;
  grossPaise: string;
  deductionsPaise: string;
  netPaise: string;
  grossRupees: number;
  deductionsRupees: number;
  netRupees: number;
}

export interface BuildPayrollAuditPayloadParams {
  action: PayrollCorrectionAuditAction;
  payrollRunId: string;
  adjustmentId?: string;
  actor: PayrollCorrectionActor;
  reason: string;
  correlationId?: string;
  beforeSnapshot: PayrollCorrectionAuditSnapshot;
  afterSnapshot: PayrollCorrectionAuditSnapshot;
  variance: {
    headcount: number;
    grossPaise: string;
    deductionsPaise: string;
    netPaise: string;
  };
  reconciliationStatus: string;
  additionalDetails?: Record<string, unknown>;
}

export interface StructuredPayrollAuditEntry {
  eventId: string;
  actorId: string;
  actorEmail: string;
  actorRole: string;
  action: string;
  fieldName: string;
  oldValue: string;
  newValue: string;
  details: string; // JSON serialized
}

/**
 * Generates a unique, high-entropy business correlation identifier
 * for distributed tracing and cross-subsystem audit tie-outs.
 * Format: evt_adj_<timestamp>_<random>
 */
export function generatePayrollAuditEventId(prefix: string = "evt_adj"): string {
  const timestamp = Date.now();
  const randomPart = Math.random().toString(36).substring(2, 10);
  return `${prefix}_${timestamp}_${randomPart}`;
}

/**
 * Constructs an immutable, structured audit log entry payload ready
 * for atomic insertion into the audit_logs table inside a transaction.
 */
export function buildPayrollCorrectionAuditPayload(
  params: BuildPayrollAuditPayloadParams
): StructuredPayrollAuditEntry {
  const eventId = params.correlationId || generatePayrollAuditEventId();

  const detailsObj = {
    payrollRunId: params.payrollRunId,
    adjustmentId: params.adjustmentId || null,
    reason: params.reason,
    reconciliationStatus: params.reconciliationStatus,
    before: params.beforeSnapshot,
    after: params.afterSnapshot,
    variance: params.variance,
    appliedAt: new Date().toISOString(),
    ...(params.additionalDetails || {}),
  };

  return {
    eventId,
    actorId: params.actor.actorId,
    actorEmail: params.actor.actorEmail,
    actorRole: params.actor.actorRole,
    action: params.action,
    fieldName: "reconciliation_status",
    oldValue: params.beforeSnapshot.grossRupees.toString(),
    newValue: params.afterSnapshot.grossRupees.toString(),
    details: JSON.stringify(detailsObj),
  };
}

/**
 * Helper to persist an audit log entry within an existing Prisma transaction.
 * Designed for use in future Step 2B mutation endpoints.
 * (NOT executed during Step 2A read-only preview).
 */
export async function persistPayrollAuditLog(
  tx: Prisma.TransactionClient,
  entry: StructuredPayrollAuditEntry
): Promise<string> {
  const record = await tx.auditLog.create({
    data: {
      eventId: entry.eventId,
      actorId: entry.actorId,
      actorEmail: entry.actorEmail,
      actorRole: entry.actorRole,
      action: entry.action,
      fieldName: entry.fieldName,
      oldValue: entry.oldValue,
      newValue: entry.newValue,
      details: entry.details,
    },
  });

  return record.id;
}

