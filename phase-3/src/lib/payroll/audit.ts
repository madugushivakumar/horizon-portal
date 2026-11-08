/**
 * Horizon Portal — Privacy-Conscious Payroll Access Audit Logger
 * src/lib/payroll/audit.ts
 *
 * Implements security and compliance auditing for sensitive personal financial data.
 * Records ONLY necessary access metadata (user, record identifier, timestamp, outcome).
 * Strictly omits financial details, tokens, payloads, or bank information.
 */

export interface PayslipAuditEntry {
  userId: string;
  userEmail: string;
  employeeId?: string | null;
  recordIdentifier: string;
  action: "LIST_PAYSLIPS" | "VIEW_PAYSLIP_DETAIL";
  outcome: "SUCCESS" | "FORBIDDEN" | "NOT_FOUND" | "UNAUTHENTICATED";
  ipAddress?: string;
}

export function logPayslipAccess(entry: PayslipAuditEntry): void {
  const timestamp = new Date().toISOString();
  // Safe sanitized structured log entry
  const sanitizedLog = {
    timestamp,
    event: "PAYSLIP_ACCESS_AUDIT",
    action: entry.action,
    userId: entry.userId,
    userEmail: entry.userEmail,
    employeeId: entry.employeeId || "NONE",
    targetRecord: entry.recordIdentifier,
    outcome: entry.outcome,
  };

  // When developing or running audits, emit structured JSON log to stdout
  console.log(`[AUDIT ${timestamp}] ${entry.action} by ${entry.userEmail} (Emp: ${entry.employeeId ?? "N/A"}) -> Record: ${entry.recordIdentifier} | Outcome: ${entry.outcome}`, JSON.stringify(sanitizedLog));
}
