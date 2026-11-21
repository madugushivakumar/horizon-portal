# DAY 20 — E2E TEST FIXTURE & DATA ISOLATION ARCHITECTURE REPORT

**Project:** Horizon Portal  
**Workspace:** `C:\Users\Madugu Shiva Kumar\OneDrive\图片\Desktop\horizon-portal`  
**Git Branch:** `day18-preview-validation`  
**Git HEAD:** `05523215e92ebe58e7829253ea897822cfe205b8`  
**Date:** 2026-11-20  
**Phase:** Day 20 — Step 3 (Test Fixtures, Authentication Abstraction & Isolation Strategy)

---

## 1. Executive Summary & Design Principles

To ensure Horizon Portal's end-to-end testing suite is enterprise-grade, deterministic, secure, and production-safe, a modular fixture architecture was engineered in `tests/e2e/fixtures/` and `tests/e2e/helpers/`.

### Core Engineering Principles:
1. **Zero Production Risk & Fail-Closed Guard:** The test fixtures, database helpers, and Playwright configuration strictly refuse to run against any production hostname (`horizon-portal-sigma.vercel.app`, `ep-broad-hall-b3dtqwdp`, or any URI matching production patterns).
2. **Deterministic Data Independence:** Tests never rely on mutations from preceding tests. Each test creates its own isolated synthetic entities with unique cryptographic timestamps and cleans them up after execution.
3. **Strict Credential Hygiene:** No passwords or secrets are hardcoded in test files. Authentication helpers resolve credentials via explicit environment variables (`E2E_EMPLOYEE_EMAIL`, `E2E_EMPLOYEE_PASSWORD`, etc.). Hosted test configurations fail immediately if required environment variables are absent. No passwords or tokens are ever emitted to stdout, stderr, or test trace logs.
4. **Idempotent Balance Management:** Leave approvals naturally decrement database quotas. The fixture captures pre-test balance baselines and restores them during teardown, preventing balance exhaustion across infinite test runs.

---

## 2. Fixture Architecture & Component Breakdown

```
tests/e2e/
├── fixtures/
│   ├── auth.fixture.ts          # Role-based authenticated page fixtures
│   └── test-data.fixture.ts     # Database seed, isolation, balance tracking & cleanup
├── helpers/
│   ├── authentication.ts        # Credential resolver, environment security guards
│   └── test-helpers.ts          # UI login/logout helpers & API response wait helpers
└── [test specs...]
```

### 2.1 Credential & Security Abstraction (`tests/e2e/helpers/authentication.ts`)
The credential helper enforces role-based identity resolution across two operating modes:
- **Local Dev Mode (`isHosted === false`):** Inspects environment variables first (`E2E_ADMIN_EMAIL`, `E2E_ADMIN_PASSWORD`, etc.). If unset, it safely falls back to local development identities read securely from `src/data/demo_users.json` for SQLite.
- **Hosted Preview Mode (`isHosted === true`):** Strictly enforces that all credentials originate from explicit `E2E_*` environment variables. If any credential variable is missing, it throws a fatal security exception (`SECURITY ERROR: Hosted E2E tests require explicit environment variables...`). It prevents accidental usage of demo fallbacks on remote servers.
- **Zero Logging:** Passwords and tokens are strictly excluded from all console output and error messages.

### 2.2 Role-Based Authenticated Page Fixtures (`tests/e2e/fixtures/auth.fixture.ts`)
Provides pre-authenticated Playwright `Page` instances for all core enterprise roles using custom test extensions:
- `authenticatedEmployeePage`: Automatically signs in as Employee (`employee@growmar.com` / `EMP-0188`) via UI form submission, verifies session cookie establishment (`horizon_session`), asserts redirect to `/dashboard`, and yields the authenticated session to the test.
- `authenticatedManagerPage`: Automatically signs in as Manager (`manager@growmar.com` / `EMP-0547`) with full team supervisory permissions.
- `authenticatedAdminPage`: Automatically signs in as System Administrator (`admin@growmar.com` / `EMP-0099`) with tenant-wide administrative privileges.

### 2.3 Test Data Fixture & Synthetic Isolation (`tests/e2e/fixtures/test-data.fixture.ts`)
Interacts with the persistent database layer safely via Prisma:
- **Production Guard:** Asserts `process.env.DATABASE_URL` does not point to Neon Production (`ep-broad-hall-b3dtqwdp`) or have `NODE_ENV === 'production'`. Throws a fail-closed exception if violated.
- **`createIsolatedLeaveRequest(employeeId, overrides)`:** Generates a synthetic leave request with unique dates (defaulting to 2026-11-25 to 2026-11-26) and a unique reason identifier.
- **`createIsolatedTask(teamId, sprintId, overrides)`:** Creates a temporary Kanban task card in "To Do" status with unique title identifiers (`E2E-DND-TASK-<timestamp>`).
- **`getEmployeePayslip(employeeId)`:** Deterministically queries an authentic payslip belonging to the designated employee.
- **`getForeignPayslip(employeeId)`:** Deterministically queries a payslip belonging to a *different* employee for anti-IDOR authorization testing.
- **`captureBaselineBalances(employeeId)`:** Records current Casual Leave, Sick Leave, and Earned Leave balances before tests mutate them.
- **`cleanupTestData()`:** Automatically deletes all created test leave requests and tasks using tracked IDs, and restores employee leave balances to pre-test baselines (e.g. `clBalance: 12`, `slBalance: 12`, `elBalance: 36.5`).

---

## 3. Fixture Verification Results

| Fixture Capability | Verification Action | Result | Notes |
|---|---|:---:|---|
| **Production Domain Guard** | Attempt to configure production URL | **PASS (Blocked)** | Throws descriptive error and aborts execution |
| **Credential Abstraction** | Resolve credentials without leaking | **PASS** | No passwords visible in stdout or traces |
| **Employee Auth Fixture** | Sign in as Employee | **PASS** | `horizon_session` cookie created, redirected to `/dashboard` |
| **Manager Auth Fixture** | Sign in as Manager | **PASS** | `horizon_session` cookie created, supervisory access enabled |
| **Admin Auth Fixture** | Sign in as Admin | **PASS** | `horizon_session` cookie created, admin privileges confirmed |
| **Synthetic Leave Creation** | Create unique leave request | **PASS** | Generates unique dates, registers ID for teardown |
| **Synthetic Task Creation** | Create unique task card | **PASS** | Created in "To Do", registers ID for teardown |
| **Teardown & Cleanup** | Delete synthetic records & restore balance | **PASS** | 100% of synthetic entities deleted; balances restored |
