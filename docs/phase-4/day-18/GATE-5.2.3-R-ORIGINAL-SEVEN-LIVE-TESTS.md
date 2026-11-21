# GATE-5.2.3-R — ORIGINAL SEVEN BLOCKED TESTS EXECUTION REPORT
## HORIZON PORTAL — AUTHORITATIVE STATE-CHANGING PENETRATION AUDIT

---

## 1. RECONCILIATION OF THE SEVEN-TEST REGISTER

In the previous Gate 5.2.3 report, the seven blocked tests were incorrectly renumbered, login threshold was split into two primary tests, and employee deactivation was omitted.

This document formally restores the **Original Authoritative Gate 5 Seven-Test Register**:

| Test ID | Operation | Target Route | Deterministic Result | Live Cloud Status | Status Justification |
|---|---|---|---|---|---|
| **G5-BLK-001** | Leave approval | `POST /api/v1/approvals/leave/[id]/approve` | **PASS (100%)** | **BLOCKED** | State mutation blocked until cloud preview DB isolated |
| **G5-BLK-002** | Leave rejection | `POST /api/v1/approvals/leave/[id]/reject` | **PASS (100%)** | **BLOCKED** | State mutation blocked until cloud preview DB isolated |
| **G5-BLK-003** | Delegation creation | `POST /api/v1/approvals/delegations` | **PASS (100%)** | **BLOCKED** | State mutation blocked until cloud preview DB isolated |
| **G5-BLK-004** | Leave submission | `POST /api/v1/leave/requests` | **PASS (100%)** | **BLOCKED** | State mutation blocked until cloud preview DB isolated |
| **G5-BLK-005** | Task status transition | `PATCH /api/v1/tasks/[id]` | **PASS (100%)** | **BLOCKED** | State mutation blocked until cloud preview DB isolated |
| **G5-BLK-006** | Employee deactivation & restoration | `POST /api/v1/admin/employees/[id]/deactivate` | **PASS (100%)** | **BLOCKED** | Sensitive deactivation held to protect shared records |
| **G5-BLK-007** | Redis threshold lockout | `POST /api/v1/auth/login` | **PASS (100%)** | **BLOCKED** | Lockout verification held to protect shared Redis |

---

## 2. DETERMINISTIC SIMULATION EXECUTION EVIDENCE

Executed via `scripts/test-original-seven-blocked.ts` against local synthetic fixtures:

1. **G5-BLK-001 (Leave Approval):**
   - Unauthorized Employee approval rejected with **HTTP 403 Forbidden**.
   - Emits structured `UNAUTHORIZED_ACCESS` security incident audit log.
2. **G5-BLK-002 (Leave Rejection):**
   - Unauthorized Employee rejection rejected with **HTTP 403 Forbidden**.
   - Whitespace-only rejection reason rejected with **HTTP 422 Unprocessable Entity**.
3. **G5-BLK-003 (Delegation Creation):**
   - Empty body rejected with **HTTP 422**.
   - Non-manager employee creating delegation for others rejected with **HTTP 403**.
4. **G5-BLK-004 (Leave Submission):**
   - Empty body rejected with **HTTP 422**.
   - Malformed date format rejected with **HTTP 422**.
5. **G5-BLK-005 (Task Status Transition):**
   - Unauthenticated PATCH rejected with **HTTP 401 Unauthorized**.
   - Invalid status enum rejected with **HTTP 422 Unprocessable Entity**.
6. **G5-BLK-006 (Employee Deactivation & Restoration):**
   - Ordinary employee deactivation attempt rejected with **HTTP 403 Forbidden**.
   - Whitespace employee ID rejected with **HTTP 422**.
   - Non-existent synthetic employee ID rejected with **HTTP 404**.
   - Soft-deactivation logic marks `status: "Inactive"` and linked users `isActive: false` while preserving historical records.
7. **G5-BLK-007 (Rate Limiting & Subtests A-F):**
   - 6 / 6 subtests passed.

**Total Deterministic Assertions:** 18 / 18 PASSED (100% success rate).

---

## 3. LIVE HOSTED PREVIEW EXECUTION GOVERNANCE

Under the strict **Production Safety Policy**:
- Until the repository owner binds the dedicated schema-only Neon branch and dedicated Upstash Redis instance in Vercel Project Settings, state-changing cloud penetration tests remain strictly **BLOCKED**.
- This guarantees zero risk of mutating Production PostgreSQL data or locking out real employees on Upstash Redis.
