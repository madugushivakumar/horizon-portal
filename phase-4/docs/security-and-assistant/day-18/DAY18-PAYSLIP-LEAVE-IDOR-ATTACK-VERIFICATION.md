# DAY 18 — PAYSLIP & LEAVE IDOR ATTACK VERIFICATION REPORT

**Project:** Horizon Portal  
**Branch:** `day18-preview-validation`  
**Date:** November 19, 2026  
**Auditor:** Senior Penetration Tester & Application Security Engineer  

---

## 1. Executive Summary

The Day 18 security specification requires testing horizontal privilege escalation:
> *"Try changing IDs in URLs and requests to read someone else's data. Fix every leak."*

This audit evaluated server-side resource ownership enforcement on:
1. Payslip details (`GET /api/v1/payslips/[run_id]`)
2. Leave requests and history (`GET /api/v1/leave/requests`)
3. Leave approval decisions (`POST /api/v1/approvals/leave/[id]/approve` and `reject`)

---

## 2. Server-Side Ownership Enforcement Architecture

### A. Payslips Endpoint (`GET /api/v1/payslips/[run_id]`)
1. Resolves caller's authenticated identity strictly from the verified session token (`authResult.user.employeeId`).
2. Performs ownership query:
   ```typescript
   const ownedPayslip = await prisma.payslip.findFirst({
     where: {
       employeeId: currentEmployeeId,
       OR: [{ id: run_id }, { payrollRunId: run_id }],
     },
   });
   ```
3. If not found, performs existence check:
   - If the record belongs to another employee (`foreignPayslip.employeeId !== currentEmployeeId`), it returns **HTTP 403 Forbidden** with zero data and triggers a security audit event.
   - If the record does not exist at all, it returns **HTTP 404 Not Found**.

### B. Leave History (`GET /api/v1/leave/requests`)
1. Binds query strictly to the session caller:
   ```typescript
   const requests = await prisma.leaveRequest.findMany({
     where: { employeeId: authResult.user.employeeId },
   });
   ```
2. Client-supplied query parameters (e.g. `?employeeId=EMP-9999`) are ignored and cannot override session ownership.

### C. Leave Approval Decision (`POST /api/v1/approvals/leave/[id]/approve` & `reject`)
1. Employees cannot approve or reject leaves (**HTTP 403 Forbidden**).
2. Managers can only decide leaves for direct reports or active delegations (**HTTP 403 Forbidden** for cross-team).
3. Self-approval is strictly forbidden (**HTTP 403 Forbidden**).

---

## 3. Employee A vs Employee B Attack Matrix

| Test Scenario | Caller | Target Resource | Resource Owner | Expected Status | Actual Status | Data Leaked? | Audit Event Logged? |
| :--- | :--- | :--- | :--- | :---: | :---: | :---: | :---: |
| **Own Payslip Access** | Employee A | `PI-004883` | Employee A | 200 OK | **200 OK** | Owned Only | `VIEW_PAYSLIP_DETAIL: SUCCESS` |
| **Cross-Employee Payslip Attack** | Employee A | `PI-004844` | Employee B | 403 Forbidden | **403 Forbidden** | **NONE** | `IDOR_ACCESS_DENIED: FORBIDDEN` |
| **Reverse Payslip Attack** | Employee B | `PI-004883` | Employee A | 403 Forbidden | **403 Forbidden** | **NONE** | `IDOR_ACCESS_DENIED: FORBIDDEN` |
| **Non-Existent Payslip ID** | Employee A | `PR-9999-99` | Non-Existent | 404 Not Found | **404 Not Found** | **NONE** | `VIEW_PAYSLIP_DETAIL: NOT_FOUND` |
| **Unauthenticated Payslip Access**| Anonymous | `PI-004883` | Employee A | 401 Unauthorized| **401 Unauthorized**| **NONE** | `VIEW_PAYSLIP_DETAIL: UNAUTHENTICATED` |
| **Own Leave History** | Employee A | `/api/v1/leave/requests` | Employee A | 200 OK | **200 OK** | Owned Only | N/A |
| **Leave Parameter Spoofing Attack**| Employee A | `?employeeId=EMP-0099` | Employee B | 200 OK (Scoped) | **200 OK (Scoped)**| **NONE** | Thwarted (Caller-scoped) |
| **Employee Leave Approval Attack**| Employee A | `LR-001/approve` | Any Employee | 403 Forbidden | **403 Forbidden** | **NONE** | `UNAUTHORIZED_ACCESS: 403` |
| **Employee Leave Rejection Attack**| Employee A | `LR-001/reject` | Any Employee | 403 Forbidden | **403 Forbidden** | **NONE** | `UNAUTHORIZED_ACCESS: 403` |

---

## 4. Live Test Isolation Safety Boundary

In accordance with Hard Stop Rule 1:
- Deterministic attacks were verified using local development database fixtures.
- State-changing live attacks against the Vercel Preview deployment remain held as **BLOCKED** until dedicated Neon Preview infrastructure is provisioned by the repository owner.
