# DAY 18 — IDOR SECURITY LOGGING & AUDIT TRAIL REPORT

**Project:** Horizon Portal  
**Branch:** `day18-preview-validation`  
**Date:** November 19, 2026  
**Auditor:** DevSecOps Specialist & Security Operations Lead  

---

## 1. Executive Summary

The Day 18 security specification asks:
> *"What would you log to know someone tried to read other people's payslips?"*

To detect and respond to unauthorized access attempts and IDOR probes, a dedicated security audit module was implemented in `src/lib/security/audit.ts`. This report details the logged security fields, privacy exclusions, correlation strategies, and automated SIEM detection rules.

---

## 2. Security Event Schema (`src/lib/security/audit.ts`)

```typescript
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
```

### Emitted Event Example:
```json
{
  "timestamp": "2026-11-19T05:34:21.282Z",
  "event": "IDOR_ACCESS_DENIED",
  "resourceType": "PAYSLIP",
  "actorId": "usr_emp_004",
  "actorEmail": "employee@growmar.com",
  "actorRole": "Employee",
  "targetResourceId": "PI-004844",
  "resourceOwnerId": "EMP-0099",
  "route": "/api/v1/payslips/[run_id]",
  "method": "GET",
  "status": 403,
  "reason": "Cross-employee payslip access attempt rejected."
}
```

---

## 3. Strict Privacy Exclusions

In compliance with data protection principles and OWASP standards, the security logger strictly prohibits recording:
- `salary`, `netPay`, `grossPay`, or any earnings/deductions numbers.
- `bankAccount` or banking details.
- `panNumber` or national identity identifiers.
- Passwords, hashes, or plain credentials.
- Session tokens, cookies, or JWT signatures.

---

## 4. Threat Detection & Alerting Recommendations

Security Operations (SecOps) should configure alerting thresholds for the following patterns:

1. **Repeated IDOR Probing:**
   - *Rule:* More than 3 `IDOR_ACCESS_DENIED` events from the same `actorId` within 5 minutes.
   - *Action:* Flag account for immediate review; escalate to security team.
2. **Sequential Resource Enumeration:**
   - *Rule:* Multiple sequential resource IDs targeted within short intervals (e.g., `PI-004844`, `PI-004845`, `PI-004846`).
   - *Action:* Temporarily throttle IP address and require session re-authentication.
3. **Cross-Role Escalation Probes:**
   - *Rule:* `UNAUTHORIZED_ACCESS` on administrative endpoints (`/api/v1/admin/*`, `/api/v1/payroll/runs`) from `Employee` accounts.
   - *Action:* Invalidate session and alert compliance team.
