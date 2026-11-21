/**
 * Horizon Portal — Payroll Security, Identity & Maker-Checker Governance Utilities
 * src/lib/payroll/payroll-security.ts
 *
 * Implements strict server-side authorization and dual-control checks:
 * - Server-side actor validation against live database (never trusts client claims)
 * - Active account enforcement for operational actions
 * - Historical attribution preservation for deactivated personnel
 * - Dual-control Maker-Checker separation of duties enforcement
 * - Idempotency key format and concurrency validation
 */

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export interface ActorValidationResult {
  valid: boolean;
  error?: string;
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
    isActive: boolean;
    employeeId: string | null;
  };
}

export interface MakerCheckerValidationResult {
  valid: boolean;
  error?: string;
}

export interface IdempotencyValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates that an actor initiating an action exists in the database,
 * possesses an active account, and holds either HR or Admin role.
 */
export async function validatePayrollActor(
  userId: string | null | undefined,
  tx?: Prisma.TransactionClient
): Promise<ActorValidationResult> {
  if (!userId || typeof userId !== "string" || userId.trim() === "") {
    return {
      valid: false,
      error: "Authentication required: Missing or empty actor identifier.",
    };
  }

  const client = tx || prisma;
  const user = await client.user.findUnique({
    where: { id: userId.trim() },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      employeeId: true,
    },
  });

  if (!user) {
    return {
      valid: false,
      error: `Actor validation failed: User account with ID "${userId}" does not exist.`,
    };
  }

  if (!user.isActive) {
    return {
      valid: false,
      error: `Actor validation failed: Account "${user.email}" (${user.id}) is deactivated. Active accounts are required for operational payroll actions.`,
    };
  }

  const roleUpper = (user.role || "").toUpperCase();
  if (roleUpper !== "ADMIN" && roleUpper !== "HR") {
    return {
      valid: false,
      error: `Authorization failed: User "${user.email}" possesses role "${user.role}". Payroll operations require Admin or HR privileges.`,
    };
  }

  return {
    valid: true,
    user,
  };
}

/**
 * Validates a historical actor reference (e.g. For audit verification or past record lookup).
 * Unlike validatePayrollActor, historical validation allows deactivated users because past
 * actions remain permanently attributed to the individual who executed them.
 */
export async function validateHistoricalPayrollActor(
  userId: string | null | undefined,
  tx?: Prisma.TransactionClient
): Promise<ActorValidationResult> {
  if (!userId || typeof userId !== "string" || userId.trim() === "") {
    return {
      valid: false,
      error: "Missing historical actor identifier.",
    };
  }

  const client = tx || prisma;
  const user = await client.user.findUnique({
    where: { id: userId.trim() },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      employeeId: true,
    },
  });

  if (!user) {
    return {
      valid: false,
      error: `Historical actor "${userId}" not found in database records.`,
    };
  }

  return {
    valid: true,
    user,
  };
}

/**
 * Enforces the Maker-Checker dual-control policy:
 * The user who prepared or reconciled a payroll adjustment CANNOT approve it.
 * An independent authorized reviewer is required.
 */
export function validateMakerChecker(
  preparerOrReconcilerId: string | null | undefined,
  approverId: string | null | undefined
): MakerCheckerValidationResult {
  if (!preparerOrReconcilerId || typeof preparerOrReconcilerId !== "string" || preparerOrReconcilerId.trim() === "") {
    return {
      valid: false,
      error: "Maker-Checker validation error: Preparer/Reconciler identifier is missing.",
    };
  }

  if (!approverId || typeof approverId !== "string" || approverId.trim() === "") {
    return {
      valid: false,
      error: "Maker-Checker validation error: Approver identifier is missing.",
    };
  }

  const normPreparer = preparerOrReconcilerId.trim();
  const normApprover = approverId.trim();

  if (normPreparer === normApprover) {
    return {
      valid: false,
      error: "Maker-Checker violation: The user who prepared or reconciled this payroll run cannot approve it. An independent authorized reviewer is strictly required under financial governance policy.",
    };
  }

  return {
    valid: true,
  };
}

/**
 * Validates the format, character set, and minimum entropy of a client-submitted idempotency key.
 */
export function validateIdempotencyKey(key: string | null | undefined): IdempotencyValidationResult {
  if (!key || typeof key !== "string" || key.trim() === "") {
    return {
      valid: false,
      error: "Missing idempotency key. A unique idempotency key is required for state-mutating payroll operations.",
    };
  }

  const trimmed = key.trim();

  if (trimmed.length < 8 || trimmed.length > 128) {
    return {
      valid: false,
      error: `Invalid idempotency key length (${trimmed.length}). Must be between 8 and 128 characters.`,
    };
  }

  // Alphanumeric, underscores, hyphens, colons, dots
  const validPattern = /^[a-zA-Z0-9_\-\.:]+$/;
  if (!validPattern.test(trimmed)) {
    return {
      valid: false,
      error: "Invalid idempotency key format. May only contain alphanumeric characters, underscores, hyphens, colons, and dots.",
    };
  }

  return {
    valid: true,
  };
}

/**
 * Validates sequential adjustment revisions (e.g. Revision 1 -> Revision 2).
 */
export function validateAdjustmentRevision(
  currentLatestRevision: number,
  proposedRevision: number
): { valid: boolean; error?: string } {
  if (!Number.isInteger(proposedRevision) || proposedRevision <= 0) {
    return {
      valid: false,
      error: `Invalid proposed revision: ${proposedRevision}. Revision must be a positive integer.`,
    };
  }

  const expectedRevision = currentLatestRevision + 1;
  if (proposedRevision !== expectedRevision) {
    return {
      valid: false,
      error: `Revision sequencing conflict: Expected revision ${expectedRevision}, but received ${proposedRevision}.`,
    };
  }

  return {
    valid: true,
  };
}

