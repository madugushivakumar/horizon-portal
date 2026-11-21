# DAY 20 — TEST DATA ISOLATION & FIXTURE SAFETY AUDIT

**Project:** Horizon Portal  
**Workspace:** `C:\Users\Madugu Shiva Kumar\OneDrive\图片\Desktop\horizon-portal`  
**Git Branch:** `day18-preview-validation`  
**Git HEAD:** `05523215e92ebe58e7829253ea897822cfe205b8`  
**Date:** 2026-11-20  
**Phase:** Day 20 — Review Point A1 Resolution

---

## 1. Executive Summary

This audit assesses the data isolation architecture, database targeting, state mutation dynamics, and teardown reliability of the Horizon Portal Playwright E2E testing framework. It evaluates the current use of demonstration accounts versus dedicated synthetic test personas and provides an architectural safety evaluation.

---

## 2. Database Identity & Target Verification

### 2.1 Local Execution Target
During local E2E test runs:
- `DATABASE_URL` is omitted or resolves to `"file:./dev.db"`.
- The Playwright tests, fixture helpers, and Next.js development server connect exclusively to the local SQLite database file `dev.db`.
- Zero cloud database connections are opened during local runs.

### 2.2 Production Defense-in-Depth Guards
Accidental execution against Production infrastructure is prevented at three separate code boundaries:
1. **Playwright Config Guard (`playwright.config.ts`):**
   Parses `PLAYWRIGHT_BASE_URL` before browser launch. If the hostname matches `horizon-portal-sigma.vercel.app` or any production pattern, execution immediately aborts with a security violation error.
2. **Prisma Runtime Singleton Guard (`src/lib/prisma.ts`):**
   Validates database connection strings against `KNOWN_PRODUCTION_ENDPOINTS` (`ep-broad-hall-b3dtqwdp`, `ep-broad-hall-b3dtqwdp-pooler`). Throws a fail-closed exception if detected.
3. **Fixture Guard (`tests/e2e/fixtures/test-data.fixture.ts`):**
   Inspects `process.env.DATABASE_URL`. Throws `[SECURITY HALT]` if it contains production endpoints or if `NODE_ENV === "production"`.

---

## 3. Account Strategy: Current Implementation vs Dedicated Synthetic Identities

### 3.1 Current Account Strategy (Local Demo Personas)
Local tests currently authenticate using the default seeded demo accounts defined in `src/data/demo_users.json` and persisted in `dev.db`:
- **Employee Persona:** `employee@growmar.com` (Mapped to `EMP-0188`, "Sasi Shetty / Sophie Chen")
- **Manager Persona:** `manager@growmar.com` (Mapped to `EMP-0547`, "Imran Philip / Marcus Brody")
- **Admin Persona:** `admin@growmar.com` (Mapped to `EMP-0099`, "Alexander Wright")
- **HR Persona:** `hr@growmar.com` (Mapped to `EMP-0011`, "Eleanor Vance")

### 3.2 Evaluation & Recommended Future Architecture
While the current approach allows local development tests to run immediately against `dev.db` without a separate seeding step, sharing personas between demo usage and automated tests introduces shared-state dependencies:

```
[Recommended Architecture for CI/Hosted Testing]

Dedicated Synthetic Test Personas (Isolated Tenant):
├── e2e.employee@horizon.test  (ID: EMP-E2E-001)  -> Direct IC
├── e2e.manager@horizon.test   (ID: EMP-E2E-002)  -> Direct Manager for EMP-E2E-001
└── e2e.admin@horizon.test     (ID: EMP-E2E-003)  -> System Administrator
```

**Implementation Recommendation:**
- For local verification, preserving `dev.db` without altering existing employee records is the safest path.
- In CI or automated preview pipelines, a dedicated database branch or seed script should inject these dedicated `*.test` personas with isolated quotas, ensuring zero overlap with demo personas.

---

## 4. State Mutation Inventory & Teardown Analysis

| Test Journey | Spec File | Database Mutation Type | Entity Mutated | Cleanup / Restoration Mechanism |
|---|---|---|---|---|
| **Journey 1: Login** | `auth/login.spec.ts` | **Zero** (Read-only) | None | N/A (Session cookies only) |
| **Journey 2: Apply Leave** | `apply-leave.spec.ts` | **INSERT** `LeaveRequest` | `LeaveRequest` (ID: `E2E-LV-...`) | Targeted `deleteMany({ id: { in: [...] } })` |
| **Journey 3: Approve Leave** | `approve-leave.spec.ts` | **INSERT** `LeaveRequest`<br>**UPDATE** `LeaveBalance` | Subordinate request<br>`EMP-0188` `clBalance` & `pendingDays` | Request deleted by ID;<br>Baseline balances captured before mutation and restored via `update` |
| **Journey 4: Payslips** | `view-payslip.spec.ts` | **Zero** (Read-only) | None | N/A (Queries existing records) |
| **Journey 5: Kanban Task** | `move-task-card.spec.ts` | **INSERT** `Task`<br>**UPDATE** `status` | `Task` (ID: `E2E-TSK-...`) | Targeted `deleteMany({ id: { in: [...] } })` |

### 4.1 Detailed Analysis of Leave Balance Mutation
When Manager approves a leave request via `PATCH /api/v1/approvals/leave/[id]`, the application service (`src/lib/leave/approval-service.ts`) executes:
1. `LeaveRequest.update({ status: "Approved" })`
2. `LeaveBalance.update({ clBalance: { decrement: days }, pendingDays: { decrement: days } })`

If unmitigated, repeated test executions decrement `clBalance` until reaching zero, causing subsequent submissions to fail with `HTTP 400 Insufficient leave balance`.

### 4.2 Teardown Mechanics & Failure Modes
- **Normal Teardown:**
  `tests/e2e/fixtures/test-data.fixture.ts` captures baseline balances in `baselineBalances` map before creating test requests. During `afterEach` or `afterAll`, `cleanupTestData()` updates `LeaveBalance` back to the exact initial baseline:
  ```typescript
  await prisma.leaveBalance.update({
    where: { employeeId: empId },
    data: { clBalance: base.cl, slBalance: base.sl, elBalance: base.el, pendingDays: base.pending }
  });
  ```
- **Failure Mode (Abrupt Process Termination):**
  If a test runner process is killed prematurely via `SIGKILL` or power failure before teardown executes, the decremented balance remains in `dev.db`.
- **Mitigation:**
  A pre-test sanity check or dedicated seed script can restore baseline quotas (`clBalance: 12`, `slBalance: 12`, `elBalance: 36.5`) prior to test suite execution.

---

## 5. Parallelism & Concurrency Safety

- In `playwright.config.ts`, `workers: 1` is strictly configured (`workers: process.env.CI ? 1 : 1`).
- Because all 12 tests execute serially in a single worker, there are zero race conditions between tests competing for `EMP-0188` leave balance quotas.
- If parallel execution with multiple workers is introduced in the future, each worker must be assigned an isolated test persona or run against isolated ephemeral database instances.

---

## 6. Audit Conclusion & Compliance Status

- [x] **Local SQLite verified:** Tests connect strictly to local SQLite `dev.db`.
- [x] **Production protected:** Three independent fail-closed guards prevent any connection to Neon Production.
- [x] **Mutations documented:** Leave balance decrement and status changes are comprehensively cataloged.
- [x] **Cleanup safe:** Deletes target exclusively unique `E2E-LV-*` and `E2E-TSK-*` IDs, preserving all pre-existing records.
- [x] **Failure behavior identified:** Process abortion risks are documented with recommended seed mitigations.
