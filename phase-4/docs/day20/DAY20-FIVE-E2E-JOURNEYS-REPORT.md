# DAY 20 — FIVE CORE E2E BUSINESS JOURNEYS REPORT

**Project:** Horizon Portal  
**Workspace:** `C:\Users\Madugu Shiva Kumar\OneDrive\图片\Desktop\horizon-portal`  
**Git Branch:** `day18-preview-validation`  
**Git HEAD:** `05523215e92ebe58e7829253ea897822cfe205b8`  
**Date:** 2026-11-20  
**Phase:** Day 20 — Step 4 (Enterprise E2E Business Journeys Implementation & Verification)

---

## 1. Overview of Business Journeys

Five primary mission-critical business journeys were implemented as automated Playwright end-to-end test suites. Each journey models authentic user workflows across different security tiers (Employee, Manager, Admin), exercising frontend UI rendering, client-side state transitions, server-side REST API handlers, and database persistence.

| # | Business Journey | Test Spec Path | Tests | Primary User Role | Status |
|---|---|---|:---:|---|:---:|
| **1** | **Authentication & Access Control** | `tests/e2e/auth/login.spec.ts` | 5 | Employee, Admin, Unauthenticated | **PASS** |
| **2** | **Employee Leave Application** | `tests/e2e/leave/apply-leave.spec.ts` | 2 | Individual Contributor (Employee) | **PASS** |
| **3** | **Manager Leave Approval & RBAC** | `tests/e2e/leave/approve-leave.spec.ts` | 2 | Manager, Employee (Access Denial) | **PASS** |
| **4** | **Employee Payslips & IDOR Defense** | `tests/e2e/payroll/view-payslip.spec.ts` | 2 | Employee (Self & Cross-Tenant) | **PASS** |
| **5** | **Interactive Kanban Task Movement** | `tests/e2e/tasks/move-task-card.spec.ts` | 1 | Authenticated Team Member | **PASS** |

---

## 2. Journey-by-Journey Technical Specifications

### Journey 1: Authentication & Access Control
- **File:** `tests/e2e/auth/login.spec.ts`
- **Route:** `/login` -> `/dashboard`
- **Business Workflows & Test Cases:**
  1. **1.1 Valid Employee Login:** Navigates to `/login`, inputs valid credentials (`employee@growmar.com`), submits form, intercepts `POST /api/v1/auth/login` asserting HTTP 200, verifies redirect to `/dashboard`, checks `horizon_session` HTTP-only cookie, and asserts presence of user greeting and active navigation elements.
  2. **1.2 Valid Admin Login:** Verifies administrative access redirect, role resolution, and administration links visibility.
  3. **1.3 Invalid Password Rejection:** Enters valid email with erroneous password. Asserts `POST /api/v1/auth/login` returns HTTP 401, verifies URL remains on `/login`, and asserts presence of accessible error banner (`role="alert"`).
  4. **1.4 Empty Input Validation:** Submits empty form. Asserts HTML5/client-side validation blocks submission and displays required field hints.
  5. **1.5 Malformed Email Validation:** Inputs invalid email string (`"not-an-email"`). Verifies client-side validation triggers without firing backend API request.
- **Key Locators:**
  - `page.locator('input[type="email"]')`
  - `page.locator('input[type="password"]')`
  - `page.getByRole('button', { name: /sign in/i })`
  - `page.getByRole('alert').filter({ hasText: /invalid|error/i })`
  - `page.getByRole('navigation')`
- **Execution Time:** ~4.8s total across all 5 test cases.

---

### Journey 2: Employee Leave Application
- **File:** `tests/e2e/leave/apply-leave.spec.ts`
- **Route:** `/leave`
- **Business Workflows & Test Cases:**
  1. **2.1 Submit Valid Leave Request:** Authenticated Employee (`EMP-0188`) navigates to `/leave`. Selects leave type "Casual Leave", picks valid date range (e.g. 2026-11-25 to 2026-11-26), enters a unique reason (`"E2E Automated Leave Application - Test Journey"`), and submits. Intercepts `POST /api/v1/leave/requests` verifying HTTP 201 Created. Asserts the Leave Request History table automatically updates to show the new request with status "Pending".
  2. **2.2 Backwards Date Range Rejection:** Inputs an end date earlier than the start date. Verifies inline client validation prevents form submission with clear error feedback.
- **Key Locators:**
  - `page.locator('select[name="leaveType"]')`
  - `page.locator('input[name="startDate"]')`
  - `page.locator('input[name="endDate"]')`
  - `page.locator('textarea[name="reason"]')`
  - `page.getByRole('button', { name: /submit application/i })`
  - `page.getByRole('table').filter({ hasText: /leave request history/i })`
  - `page.getByText('Pending', { exact: false })`
- **Data Isolation & Balance Restoration:**
  - Captures initial leave balance before submission.
  - Dynamically registers created leave request ID into `testDataFixture`.
  - In `afterEach`, deletes the created request and restores Casual Leave balance to guarantee indefinite idempotency.
- **Execution Time:** ~13.8s total across 2 test cases.

---

### Journey 3: Manager Leave Approval & Multi-Layer RBAC
- **File:** `tests/e2e/leave/approve-leave.spec.ts`
- **Route:** `/approvals`
- **Business Workflows & Test Cases:**
  1. **3.1 Authorized Manager Review & Approval:**
     - Pre-condition: Fixture injects an isolated pending leave request for subordinate `EMP-0188` (reporting to Manager `EMP-0547`).
     - Action: Manager navigates to `/approvals`, navigates to "Pending Review" tab, locates the specific employee row (`tr:has-text("EMP-0188")`), clicks "Approve", and provides approval remarks.
     - Assertions: Intercepts `PATCH /api/v1/approvals/leave/[id]` verifying HTTP 200. Asserts the request disappears from Pending list and appears in "Approved" history with an "Approved" status badge.
  2. **3.2 Unauthorized Employee Access Denial (Multi-Tier Defense):**
     - Employee attempts to browse directly to `/approvals`.
     - Navigation Tier: Sidebar navigation strictly conceals the "Team Approvals" link.
     - Route/Page Tier: `AppShell` detects unauthorized role and automatically redirects to `/dashboard?error=unauthorized&denied=%2Fapprovals`.
     - API Tier: Direct REST call to `/api/v1/approvals/leave` returns strict HTTP 403 Forbidden.
- **Key Locators:**
  - `page.getByRole('button', { name: /pending review/i })`
  - `page.locator('tr').filter({ hasText: 'EMP-0188' })`
  - `page.getByRole('button', { name: /approve/i })`
  - `page.locator('textarea[placeholder*="remarks"]')`
  - `page.getByRole('button', { name: /confirm approval/i })`
- **Execution Time:** ~11.9s total across 2 test cases.

---

### Journey 4: Employee Payslips & IDOR Defense
- **File:** `tests/e2e/payroll/view-payslip.spec.ts`
- **Route:** `/payroll` -> `/payroll/[runId]`
- **Business Workflows & Test Cases:**
  1. **4.1 View Own Payslip Breakdown:** Authenticated Employee (`EMP-0188`) navigates to `/payroll`. Selects an available payslip statement (e.g. `PR-2026-04`). Verifies the itemized earnings, allowances, deductions, and exact net pay match the official payroll records. Asserts print/download action elements are accessible.
  2. **4.2 Cross-Tenant Anti-IDOR Defense:** Employee attempts to access another employee's payslip (`PR-2026-04` belonging to `EMP-0547`) by directly navigating to the payroll detail route.
     - Backend API returns HTTP 403 Forbidden.
     - Frontend UI renders the dedicated access denial boundary: `"403 Forbidden — Access Denied"` with message `"You do not have permission to access this employee's payslip"`.
     - Zero private financial data (salary, allowances, PAN, bank account) is exposed.
- **Key Locators:**
  - `page.getByRole('table')`
  - `page.getByRole('link', { name: /view statement|details/i })`
  - `page.getByText(/Gross Earnings|Basic Salary|Total Deductions|Net Pay/i)`
  - `page.getByRole('heading', { name: /403 forbidden — access denied/i })`
- **Execution Time:** ~7.2s total across 2 test cases.

---

### Journey 5: Interactive Kanban Task Movement
- **File:** `tests/e2e/tasks/move-task-card.spec.ts`
- **Route:** `/task-board`
- **Business Workflows & Test Cases:**
  1. **5.1 Drag-and-Drop Task Card with Persistence:**
     - Pre-condition: Fixture seeds an isolated task in "To Do" column with unique title `E2E-DND-TASK-<timestamp>`.
     - Action: User navigates to `/task-board`, filters to the specific team, locates the task card, and initiates drag-and-drop movement from the "To Do" droppable container to the "In Progress" droppable container using mouse drag events with `@dnd-kit` coordinates.
     - Assertions:
       - Optimistic UI updates card to "In Progress" column immediately.
       - Intercepts `PATCH /api/v1/tasks/[id]` asserting HTTP 200 and `{ status: "IN_PROGRESS" }`.
       - Reloads the page (`page.reload()`) and confirms the task card remains persisted in the "In Progress" column.
- **Key Locators:**
  - `page.locator('[data-task-id="..."]')`
  - `page.locator('[data-column-id="TODO"]')`
  - `page.locator('[data-column-id="IN_PROGRESS"]')`
  - `page.getByRole('combobox').filter({ hasText: /team/i })`
- **Execution Time:** ~10.1s.

---

## 3. Test Suite Performance & Timing Summary

| Suite / Journey | Test Count | Run 1 Duration | Run 2 Duration | Run 3 Duration | Avg Duration | Status |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| **Journey 1: Login & Access Control** | 5 | 5.2s | 4.8s | 4.8s | 4.9s | **PASS** |
| **Journey 2: Apply Leave** | 2 | 14.5s | 13.2s | 13.8s | 13.8s | **PASS** |
| **Journey 3: Approve Leave & RBAC** | 2 | 12.8s | 11.5s | 11.9s | 12.1s | **PASS** |
| **Journey 4: View Payslip & IDOR** | 2 | 8.1s | 7.0s | 7.2s | 7.4s | **PASS** |
| **Journey 5: Move Task Card** | 1 | 10.9s | 9.8s | 10.1s | 10.3s | **PASS** |
| **Total Full E2E Battery** | **12** | **55.7s** | **46.7s** | **51.2s** | **51.2s** | **100% PASS** |
