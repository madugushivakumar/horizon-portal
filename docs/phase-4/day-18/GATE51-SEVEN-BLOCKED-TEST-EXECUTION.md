# GATE 5.1 — SEVEN BLOCKED TEST RE-EXECUTION AUDIT REPORT

**Project:** Horizon Portal  
**Date:** November 19, 2026  
**Auditor:** Principal Software Architect & QA Automation Lead  

---

## 1. Status of the Seven Previously Blocked Tests

In strict adherence to Hard Stop Rule 1, Rule 4, and Section 14 of the Master Prompt, state-changing live write operations against the deployed Preview environment were held **BLOCKED** to safeguard the shared Neon PostgreSQL database (`ep-broad-hall-b3dtqwdp`).

However, the complete application logic, authorization rules, and state transition constraints were independently asserted and validated using deterministic route-handler and service-layer test harnesses.

---

## 2. Comprehensive Test Execution & Evidence Matrix

| Test ID | Objective | Endpoint | Deterministic Logic Status | Live Preview Status | Primary Evidence Source |
| :--- | :--- | :--- | :---: | :---: | :--- |
| **G5-BLK-001** | Live leave request approval | `POST /api/v1/approvals/leave/[id]/approve` | **PASS** | **BLOCKED** | `scripts/test-day18-idor-attack.ts` (Sec 2) |
| **G5-BLK-002** | Live leave request rejection | `POST /api/v1/approvals/leave/[id]/reject` | **PASS** | **BLOCKED** | `scripts/test-day18-validation.ts` (Sec E) |
| **G5-BLK-003** | Live delegation creation | `POST /api/v1/approvals/delegations` | **PASS** | **BLOCKED** | `scripts/test-day18-validation.ts` (Sec D) |
| **G5-BLK-004** | Live leave request submission | `POST /api/v1/leave/requests` | **PASS** | **BLOCKED** | `scripts/test-day18-validation.ts` (Sec E) |
| **G5-BLK-005** | Live task status transition | `PATCH /api/v1/tasks/[id]` | **PASS** | **BLOCKED** | `scripts/test-day18-tasks-verification.ts` |
| **G5-BLK-006** | Live employee deactivation | `POST /api/v1/admin/employees/[id]/deactivate` | **PASS** | **BLOCKED** | `scripts/test-day18-security.ts` (Sec 2) |
| **G5-BLK-007** | Live Redis threshold lockout | `POST /api/v1/auth/login` | **PASS** | **BLOCKED** | `scripts/test-day18-login-rate-limit.ts` (Sec 4-7) |

---

## 3. Verification Details

1. **Leave Approval & Self-Approval Prevention (G5-BLK-001, G5-BLK-002):**
   - Employee role attempting approval returns `HTTP 403 Forbidden`.
   - Cross-team manager attempting approval returns `HTTP 403 Forbidden`.
   - Manager attempting self-approval is rejected at service layer with `isSelf: true` and explicit self-approval prohibition.
2. **Delegation & Submission Validation (G5-BLK-003, G5-BLK-004):**
   - Invalid dates, missing leave types, and empty bodies are rejected with `HTTP 400 Bad Request` before reaching database layers.
3. **Task Status & Scoping (G5-BLK-005):**
   - Tasks API enforces strict role-based visibility: Employee sees only own tasks; Manager sees team tasks; Admin sees all non-cancelled tasks.
4. **Rate Limiting (G5-BLK-007):**
   - Confirmed dual-layer limits: 10 IP attempts per 15 min, 5 failed account attempts per 15 min.
   - HTTP 429 and positive `Retry-After` verified on threshold exhaustion.
