# GATE 5.2.3 — SEVEN BLOCKED TESTS EXECUTION MATRIX
## HORIZON PORTAL — CONTROLLED STATE-CHANGING PENETRATION AUDIT

---

## 1. BACKGROUND & GOVERNANCE RULES

During the Gate 5 audit, seven state-changing security tests were identified as potentially mutating live backend database tables or Redis keys:
- If executed against an environment sharing the Production database (`ep-broad-hall-b3dtqwdp`), these tests would create orphan rows, trigger false lockouts for real users, or corrupt production data.
- **Protocol Rule:** Under no circumstances may a test be marked as "LIVE PASS" unless executed against a verified, isolated non-production database.
- **Local Simulation:** To ensure code correctness without endangering production, comprehensive offline simulations using local SQLite fixtures and synthetic models were executed.

---

## 2. SEVEN BLOCKED TESTS STATUS REGISTER

| Test ID | Description | Targeted Endpoint | Local / Simulated Outcome | Live Hosted Preview Verdict | Blocker Resolution Requirement |
|---|---|---|---|---|---|
| **G5-BLK-001** | Failed login counter increment | `POST /api/v1/auth/login` | **PASS (Simulated)** | **BLOCKED** | Bind preview Redis prefix (`rl:preview:auth`) and preview DB |
| **G5-BLK-002** | Account brute-force lockout (5 fails) | `POST /api/v1/auth/login` | **PASS (Simulated)** | **BLOCKED** | Prevent lockout of production email on shared Redis |
| **G5-BLK-003** | State-changing leave request creation | `POST /api/v1/leave/requests` | **PASS (Simulated)** | **BLOCKED** | Bind `horizon-portal-preview-isolated` in Vercel |
| **G5-BLK-004** | State-changing leave approval | `POST /api/v1/approvals/leave/[id]/approve` | **PASS (Simulated)** | **BLOCKED** | Bind `horizon-portal-preview-isolated` in Vercel |
| **G5-BLK-005** | State-changing leave rejection | `POST /api/v1/approvals/leave/[id]/reject` | **PASS (Simulated)** | **BLOCKED** | Bind `horizon-portal-preview-isolated` in Vercel |
| **G5-BLK-006** | State-changing delegation creation | `POST /api/v1/approvals/delegations` | **PASS (Simulated)** | **BLOCKED** | Bind `horizon-portal-preview-isolated` in Vercel |
| **G5-BLK-007** | State-changing task status update | `PATCH /api/v1/tasks/[id]` | **PASS (Simulated)** | **BLOCKED** | Bind `horizon-portal-preview-isolated` in Vercel |

---

## 3. EVIDENCE OF SIMULATED EXECUTION

All 7 test cases were comprehensively verified using automated test runners (`scripts/test-day18-validation.ts`, `scripts/test-day18-tasks-verification.ts`, `scripts/test-day18-final-remediation.ts`):

1. **G5-BLK-001 & G5-BLK-002 (Rate Limiting & Lockout):**
   - Memory and local Redis mock verified dual-dimension counters.
   - 10 attempts allowed for IP; 5 failed attempts triggered HTTP 429 `Too many login attempts`.
   - Successful login resets account counter while preserving IP counter.
2. **G5-BLK-003, G5-BLK-004, G5-BLK-005 (Leave Lifecycle):**
   - Verified input validation (rejecting malformed dates and invalid payloads with HTTP 422).
   - Verified unauthorized rejection/approval attempts are blocked with HTTP 403.
   - Successful approval/rejection transitions leave status deterministically.
3. **G5-BLK-006 (Approval Delegation):**
   - Verified date validation, overlapping delegation conflict detection, and role verification.
4. **G5-BLK-007 (Task Status Lifecycle):**
   - Verified Employee can only update own assigned tasks; Manager can update team tasks; Admin can update organization tasks.
   - 113 / 113 task assertions passing.
