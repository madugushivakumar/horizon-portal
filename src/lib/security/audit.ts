/**
 * Horizon Portal — Security Incident & IDOR Audit Logger
 * src/lib/security/audit.ts
 *
 * Implements strict, structured security audit logging for unauthorized access attempts,
 * horizontal privilege escalation (IDOR), and permission violations.
 *
 * Compliance & Privacy Guard:
 * Strictly omits salary, PAN, bank account numbers, passwords, session tokens, or JWTs.
 */

export interface SecurityEventPayload {
  event:
    | "IDOR_ACCESS_DENIED"
    | "UNAUTHORIZED_ACCESS"
    | "CROSS_EMPLOYEE_ACCESS_ATTEMPT"
    | "SELF_APPROVAL_VIOLATION"
    | "RATE_LIMIT_EXCEEDED";
  resourceType: "PAYSLIP" | "LEAVE_REQUEST" | "EMPLOYEE" | "TASK" | "SYSTEM";
  actorId: string;
  actorEmail?: string | null;
  actorRole?: string | null;
  targetResourceId: string;
  resourceOwnerId?: string | null;
  route: string;
  method: string;
  status: number;
  requestId?: string | null;
  reason?: string;
  clientIp?: string | null;
}

export interface SecurityEventRecord extends SecurityEventPayload {
  timestamp: string;
}

export function logSecurityIncident(payload: SecurityEventPayload): SecurityEventRecord {
  const timestamp = new Date().toISOString();
  const record: SecurityEventRecord = {
    timestamp,
    ...payload,
  };

  // Structured sanitized log output for SIEM ingestion and security monitoring
  console.warn(
    `[SECURITY AUDIT ${timestamp}] ${record.event} - Actor: ${record.actorEmail || record.actorId} (${record.actorRole || "N/A"}) -> Target: ${record.resourceType}:${record.targetResourceId} | HTTP ${record.status} ${record.method} ${record.route}`,
    JSON.stringify(record)
  );

  return record;
}
