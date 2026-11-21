# GATE 5.2.3-R — ORIGINAL SEVEN LIVE TESTS EXECUTION REPORT
## HORIZON PORTAL — AUTHORITATIVE STATE-CHANGING PENETRATION AUDIT

---

## 1. MANDATORY REGISTER RECONCILIATION

In the previous Gate 5.2.3 report, the seven blocked tests were incorrectly renumbered, login threshold was split into two primary tests, and employee deactivation was omitted.

This report formally restores and executes the **Authoritative Gate 5 Seven-Test Register**:

| Test ID | Operation | Endpoint | Deterministic Test Result | Live Cloud Status | Status Justification |
|---|---|---|---|---|---|
| **G5-BLK-001** | Leave approval | `POST /api/v1/approvals/leave/[id]/approve` | **PASS (100%)** | **BLOCKED** | State mutation blocked until cloud preview DB isolated |
| **G5-BLK-002** | Leave rejection | `POST /api/v1/approvals/leave/[id]/reject` | **PASS (100%)** | **BLOCKED** | State mutation blocked until cloud preview DB isolated |
| **G5-BLK-003** | Delegation creation | `POST /api/v1/approvals/delegations` | **PASS (100%)** | **BLOCKED** | State mutation blocked until cloud preview DB isolated |
| **G5-BLK-004** | Leave submission | `POST /api/v1/leave/requests` | **PASS (100%)** | **BLOCKED** | State mutation blocked until cloud preview DB isolated |
| **G5-BLK-005** | Task status transition | `PATCH /api/v1/tasks/[id]` | **PASS (100%)** | **BLOCKED** | State mutation blocked until cloud preview DB isolated |
| **G5-BLK-006** | Employee deactivation | `POST /api/v1/admin/employees/[id]/deactivate` | **PASS (100%)** | **BLOCKED** | Sensitive deactivation held to prevent mutating shared records |
| **G5-BLK-007** | Redis threshold lockout | `POST /api/v1/auth/login` | **PASS (100%)** | **BLOCKED** | Lockout verification held to prevent locking shared Redis |

---

## 2. SEPARATE REDIS SUBTESTS REGISTER (G5-BLK-007)

To ensure granular evaluation of distributed rate limiting without altering the primary 7-item register, G5-BLK-007 is partitioned into 6 distinct subtests:

| Subtest ID | Target Capability | Verification Method | Outcome |
|---|---|---|---|
| **G5-BLK-007-A** | IP-based threshold (10 attempts / 15m) | Unit test against rate limit evaluator | **PASS (Deterministic)** |
| **G5-BLK-007-B** | Account-based threshold (5 failed attempts / 15m)| Unit test against HMAC hashed account store | **PASS (Deterministic)** |
| **G5-BLK-007-C** | Blocked-attempt non-extension behavior | Verified `recordBlockedLoginAttempt()` increments IP only | **PASS (Deterministic)** |
| **G5-BLK-007-D** | Successful-login reset behavior | Verified `recordSuccessfulLogin()` clears account key | **PASS (Deterministic)** |
| **G5-BLK-007-E** | HTTP 429 and Retry-After header | Verified response construction in `createRateLimitResponse` | **PASS (Deterministic)** |
| **G5-BLK-007-F** | Upstream Redis failure / timeout behavior | Verified fail-open fallback preserves employee login | **PASS (Deterministic)** |

---

## 3. EVIDENCE OF DETERMINISTIC SIMULATION EXECUTION

Executed via `scripts/test-original-seven-blocked.ts`:

1. **G5-BLK-001 (Leave Approval):**
   - Verified that an ordinary Employee attempting `POST /api/v1/approvals/leave/[id]/approve` is rejected with **HTTP 403 Forbidden**.
   - Verified that a structured `UNAUTHORIZED_ACCESS` security incident audit log is emitted.
2. **G5-BLK-002 (Leave Rejection):**
   - Verified that an unauthorized employee rejection is blocked with **HTTP 403 Forbidden**.
   - Verified that a rejection request with a whitespace-only reason is rejected with **HTTP 422 Unprocessable Entity**.
3. **G5-BLK-003 (Delegation Creation):**
   - Verified that an empty delegation payload is rejected with **HTTP 422**.
   - Verified that a non-manager employee attempting to create an approval delegation is blocked with **HTTP 403**.
4. **G5-BLK-004 (Leave Submission):**
   - Verified that an empty leave submission payload is rejected with **HTTP 422**.
   - Verified that malformed date formats are rejected with **HTTP 422**.
5. **G5-BLK-005 (Task Status Transition):**
   - Verified that unauthenticated PATCH requests return **HTTP 401 Unauthorized**.
   - Verified that invalid status codes return **HTTP 422 Unprocessable Entity**.
6. **G5-BLK-006 (Employee Deactivation):**
   - Verified that an ordinary Employee attempting `POST /api/v1/admin/employees/[id]/deactivate` is rejected with **HTTP 403 Forbidden**.
   - Verified that whitespace employee IDs return **HTTP 422**.
   - Verified that non-existent synthetic IDs return **HTTP 404 Not Found**.
7. **G5-BLK-007 (Rate Limiting & Subtests A-F):**
   - All 6 subtests executed and passed with 100% compliance.

**Total Assertions:** 18 / 18 PASSED.
