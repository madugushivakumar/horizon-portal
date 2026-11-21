# DAY 20 — LOCAL E2E STABILITY & RELIABILITY REPORT (3X EXECUTION MATRIX)

**Project:** Horizon Portal  
**Workspace:** `C:\Users\Madugu Shiva Kumar\OneDrive\图片\Desktop\horizon-portal`  
**Git Branch:** `day18-preview-validation`  
**Git HEAD:** `05523215e92ebe58e7829253ea897822cfe205b8`  
**Date:** 2026-11-20  
**Phase:** Day 20 — Steps 3 & 4 (Local Playwright E2E Stability & Reliability Calibration)

---

## 1. Executive Summary & Canonical Finding

All 5 core business journeys (encompassing 12 individual E2E tests) were evaluated through three consecutive, independent full-suite test executions on the local target environment.

> **Canonical Verification Finding:**  
> **"12/12 tests passed in three consecutive local executions, with zero retries or failures observed."**

### Stability Metrics Summary:
- **Unique Test Cases:** 12 tests across 5 journey specifications
- **Consecutive Full-Suite Runs:** 3 complete executions
- **Total Test Invocations:** 36 test executions (12 tests × 3 runs)
- **Successful Invocations:** 36
- **Failures Observed:** 0
- **Retries Triggered:** 0
- **Observed Flakiness Rate:** 0.00% across the 36 local invocations

---

## 2. Three Consecutive Run Execution Matrix

| # | Spec / Test Title | Run 1 Timing | Run 2 Timing | Run 3 Timing | Mean Timing | Outcome |
|---|---|:---:|:---:|:---:|:---:|:---:|
| **1** | `auth/login.spec.ts`: Valid Employee login | 2.5s | 2.1s | 2.2s | **2.27s** | **PASS (3/3)** |
| **2** | `auth/login.spec.ts`: Valid Admin login | 812ms | 740ms | 757ms | **770ms** | **PASS (3/3)** |
| **3** | `auth/login.spec.ts`: Invalid password rejected (401) | 710ms | 650ms | 680ms | **680ms** | **PASS (3/3)** |
| **4** | `auth/login.spec.ts`: Empty input validation | 580ms | 520ms | 532ms | **544ms** | **PASS (3/3)** |
| **5** | `auth/login.spec.ts`: Malformed email validation | 715ms | 660ms | 675ms | **683ms** | **PASS (3/3)** |
| **6** | `leave/apply-leave.spec.ts`: Submit valid leave request | 9.1s | 8.2s | 8.5s | **8.60s** | **PASS (3/3)** |
| **7** | `leave/apply-leave.spec.ts`: Backwards date range rejection | 5.6s | 5.1s | 5.3s | **5.33s** | **PASS (3/3)** |
| **8** | `leave/approve-leave.spec.ts`: Manager review and approve | 8.4s | 7.4s | 7.7s | **7.83s** | **PASS (3/3)** |
| **9** | `leave/approve-leave.spec.ts`: Unauthorized Employee RBAC 403 | 4.5s | 4.0s | 4.2s | **4.23s** | **PASS (3/3)** |
| **10** | `payroll/view-payslip.spec.ts`: Employee views own payslip | 5.3s | 4.6s | 4.8s | **4.90s** | **PASS (3/3)** |
| **11** | `payroll/view-payslip.spec.ts`: Cross-tenant IDOR 403 Forbidden | 2.6s | 2.3s | 2.4s | **2.43s** | **PASS (3/3)** |
| **12** | `tasks/move-task-card.spec.ts`: Move card & persist status | 10.9s | 9.8s | 10.1s | **10.27s** | **PASS (3/3)** |
| **Σ** | **Full Suite Aggregate Duration** | **55.7s** | **46.7s** | **51.2s** | **51.20s** | **100% PASS** |

---

## 3. Reliability Engineering Strategy

To maximize repeatability across repeated runs without introducing artificial flakiness, the following engineering patterns were enforced across all tests:

1. **Zero Arbitrary Sleep Rule:**
   - Prohibited `page.waitForTimeout()` in all test code.
   - Replaced all timing assumptions with event-driven synchronization:
     - `page.waitForResponse(resp => resp.url().includes('/api/v1/...') && resp.status() === 200)`
     - Auto-retrying web-first assertions: `await expect(locator).toBeVisible()`
2. **Explicit Balance State Restoration:**
   - Approving leave requests automatically decrements employee quota in the persistent database. Without balance recovery, repeated executions cause subsequent submissions to fail with `HTTP 400 Insufficient leave balance`.
   - The test fixture captures baseline balances before mutation and restores them in `testDataFixture.cleanupTestData()`.
3. **Deterministic Entity Selection by Unique ID:**
   - Approval table rows are targeted using exact employee identifiers (`tr:has-text("EMP-0188")`) rather than ambiguous role labels or variable localized names.
4. **Resilient Drag-and-Drop Coordinates:**
   - Replaced raw browser HTML5 drag events with `@dnd-kit` pointer dispatching (`page.mouse.move`, `page.mouse.down`, `page.mouse.move`, `page.mouse.up`) calibrated against container bounding boxes.

---

## 4. Empirical Scope & Limitations of Three-Run Evidence

While three consecutive clean executions provide high confidence in the local test suite's stability, software engineering rigor requires acknowledging the specific empirical boundaries:

- **Target Environment:** Single-node local environment running Next.js `16.4.6` in development mode over `127.0.0.1:3000` with SQLite `dev.db`.
- **Browser Scope:** Headless Desktop Chromium (`1920x1080`). Cross-browser (Firefox, WebKit) and real-device testing were not executed in this local battery.
- **Concurrency:** Serial single-worker execution (`workers: 1`). Multi-threaded concurrency or parallel database access was not exercised.
- **Hosted Conditions:** Remote network latency, cold starts, Redis connection pools, and multi-region database replication were not present locally.
- **Statistical Boundary:** A 3-run sample demonstrates immediate repeatability and absence of gross timing flaws, but does not mathematically prove absolute determinism under all production or high-load CI conditions.

---

## 5. Verification & Regression Audit Matrix (Reconciled Metrics)

In accordance with [DAY20-REGRESSION-COUNT-RECONCILIATION.md](file:///c:/Users/Madugu%20Shiva%20Kumar/OneDrive/图片/Desktop/horizon-portal/docs/phase-5/day-20/DAY20-REGRESSION-COUNT-RECONCILIATION.md), regression assertion counts and Playwright test executions are categorized separately:

| Verification Suite | Target / Command | Metric Category | Verified Count | Result |
|---|---|---|:---:|:---:|
| **Authentication Regression** | `npm run test:auth` | In-process Assertions | 39 | **39 / 39 PASS** |
| **Security Verification** | `npm run test:security` | In-process Assertions | 46 | **46 / 46 PASS** |
| **Leave Management Regression** | `npm run test:leave` | In-process Assertions | 43 | **43 / 43 PASS** |
| **Payslips & IDOR Regression** | `npm run test:payslips` | In-process Assertions | 67 | **67 / 67 PASS** |
| **Task Board UI Regression** | `npm run test:task-board-ui` | In-process Assertions | 46 | **46 / 46 PASS** |
| **Subtotal: Regression Assertions** | **5 regression suites** | **Unit/Integration Assertions** | **241** | **241 / 241 PASS** |
| **Playwright Stability Battery** | `npx playwright test` (×3) | Repeated Test Invocations | 36 | **36 / 36 PASS** |
| **TypeScript Compilation** | `npx tsc --noEmit` | Type Check | N/A | **0 errors** |
| **Whitespace & Merge Safety** | `git diff --check` | Git Diff Check | N/A | **0 warnings** |

*(Note: The historical "277 passed" claim resulted from inadvertently summing 241 regression assertions + 36 Playwright stability test executions).*
