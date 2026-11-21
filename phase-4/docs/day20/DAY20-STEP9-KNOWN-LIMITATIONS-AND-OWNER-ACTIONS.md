# DAY 20 — STEP 9: KNOWN LIMITATIONS & OWNER ACTIONS RUNBOOK
## Operational Handover, Deferred Scope & Post-Acceptance Guide

**Project:** Horizon Portal  
**Document:** `DAY20-STEP9-KNOWN-LIMITATIONS-AND-OWNER-ACTIONS.md`  
**Date:** 2026-11-20  
**Release Target:** `v1.0.0` (Conditionally Accepted — Grade B)  
**Lead Roles:** Technical Release Manager, Principal Software Engineer, Senior DevOps Specialist  

---

## 1. INVENTORY OF KNOWN LIMITATIONS & ARCHITECTURAL TRADE-OFFS

### 1.1 Expense Authorization Lifecycle: Outcome B (Direct Submission)
- **Status:** **Implemented as Designed (Direct Submission)**.
- **Description:** In the current release, corporate expense authorizations submit directly to `PENDING_APPROVAL` via `POST /api/v1/approvals/expense-authorizations`.
- **Limitation / Deferred Scope:** While the `DRAFT` status is architecturally defined in the database schema enum (`status String @default("PENDING_APPROVAL") // PENDING_APPROVAL | APPROVED | REJECTED | DRAFT | CLOSED`), an interactive UI workflow for saving incomplete draft requests before submission has been deferred to v1.1.0.
- **Impact:** Employees must fill out all required fields (title, amount, category, description) in a single session. Incomplete submissions are not saved.

### 1.2 Referential Integrity Deletion Strategy (`onDelete: Cascade`)
- **Status:** **Operational in v1.0.0; Remediation Recommended for v1.1.0**.
- **Description:** The `corporate_expense_authorizations` table establishes foreign keys:
  - `departmentId -> Department` (`onDelete: Cascade`)
  - `requestedById -> Employee` (`onDelete: Cascade`)
  - `approverId -> Employee` (`onDelete: SetNull`)
- **Limitation / Compliance Risk:** Under SOX 404, GAAP, and ISO 27001 data retention standards, financial authorizations must not be destroyed if an employee or department is deleted. If an employee is hard-deleted, their submitted authorizations would cascade-delete.
- **Mitigation in v1.0.0:** The Horizon Portal application strictly uses soft-deletion (`isActive = false`) across all employee and administrative modules; hard deletion is never invoked in business workflows.
- **Permanent Remediation (v1.1.0):** Migrate `departmentId` and `requestedById` to `onDelete: Restrict` via a non-breaking migration in the next release cycle.

### 1.3 Concurrency at Massive Distributed Scale
- **Status:** **Application-Level & Transaction-Level Protected**.
- **Description:** `decideExpenseAuthorization` enforces that requests must be in `PENDING_APPROVAL` status before deciding, throwing `HTTP 409 Conflict` on duplicate or conflicting attempts. All state changes execute inside `prisma.$transaction`.
- **Limitation:** At extremely high concurrent serverless volumes (>1,000 req/sec on the exact same authorization record), optimistic concurrency via row versioning (`version Int @default(1)`) or conditional atomic SQL queries (`WHERE id = :id AND status = 'PENDING_APPROVAL'`) provides stronger serializability guarantees.
- **Recommendation:** Introduce optimistic row versioning in v1.1.0 if horizontal scaling expands beyond current multi-instance tiers.

---

## 2. OUTSTANDING OWNER ACTIONS RUNBOOK

To transition Horizon Portal from **Grade B (Conditionally Accepted)** to **Grade A (Fully Released)**, the project owner must execute the following three operational procedures:

---

### ACTION 1: Hosted Neon Preview Database & Vercel Deployment

**Objective:** Provision the isolated Neon Preview database branch, execute the PostgreSQL migrations, configure least-privilege roles, and deploy the Vercel Preview environment.

#### Prerequisites:
- Neon Cloud Console access (Admin permissions).
- Vercel Team Admin access.
- PowerShell 7+ on administrative workstation.

#### Execution Steps:
1. **Branch Provisioning in Neon Console:**
   - Log into the Neon Console (`console.neon.tech`).
   - Navigate to the Horizon Portal project.
   - Click **Branches** → **Create Branch**.
   - Set **Branch Name:** `preview-day20-final`.
   - Set **Parent:** `main` (snapshot of schema).
   - Generate connection string for the `cloud_admin` user.

2. **Run Database Migration Script:**
   - Open PowerShell and set connection strings:
     ```powershell
     $env:MIGRATION_DATABASE_URL = "postgresql://cloud_admin:<PASSWORD>@ep-preview-day20.neon.tech/horizon_db?sslmode=require"
     $env:DIRECT_URL = $env:MIGRATION_DATABASE_URL
     ```
   - Execute the migration deployer:
     ```powershell
     cd C:\HorizonPortal-Development\horizon-portal
     .\scripts\deploy-migrations.ps1
     ```
   - Verify that all migrations (including `20261120180000_add_corporate_expense_authorizations`) apply with status `SUCCESS`.

3. **Apply Least-Privilege Grants:**
   - Connect via `psql` to the preview branch:
     ```bash
     psql "$MIGRATION_DATABASE_URL" -f scripts/day18-preview-runtime-grants.sql
     ```
   - This configures `app_runtime` with restricted privileges (`SELECT`, `INSERT`, `UPDATE` on operational tables; `SELECT`, `INSERT` on `audit_logs`; no `DROP`, `ALTER`, or `TRUNCATE`).

4. **Deploy Vercel Preview Environment:**
   - In Vercel CLI or Dashboard:
     ```powershell
     vercel --preview
     ```
   - Set environment variables for the preview deployment:
     - `DATABASE_URL`: Restricted `app_runtime` connection string.
     - `DIRECT_URL`: Direct pooling connection string.
     - `UPSTASH_REDIS_REST_URL`: Authorized preview Redis instance.
     - `UPSTASH_REDIS_REST_TOKEN`: Preview Redis auth token.
   - Note the resulting preview URL (e.g., `https://horizon-portal-preview-xyz.vercel.app`).

5. **Execute E2E Tests Against Preview Deployment:**
   ```powershell
   $env:BASE_URL = "https://horizon-portal-preview-xyz.vercel.app"
   npx playwright test
   ```

---

### ACTION 2: Physical Mobile Device UX & Touch Validation

**Objective:** Validate real-world hardware interactions, touch targets, virtual keyboard behavior, and rendering across physical mobile devices.

#### Test Hardware Matrix:
- **iOS Device:** iPhone 13 / 14 / 15 running Safari on iOS 17+.
- **Android Device:** Google Pixel or Samsung Galaxy running Chrome on Android 14+.

#### Execution Checklist:
1. **Viewport & Hamburger Drawer:**
   - Open the Preview URL in mobile Safari / Chrome.
   - Verify the top navigation collapses to the mobile header with hamburger menu.
   - Tap hamburger menu: verify smooth slide-over animation without jitter.
   - Verify all navigation links are touch-accessible (minimum 44x44px touch targets).

2. **Unified Approval Center Mobile View:**
   - Navigate to `/approvals`.
   - Verify summary KPI cards wrap vertically (stacking cleanly without horizontal viewport overflow).
   - Verify domain filter pills (`All`, `Leave Requests`, `Corporate Expenses`) scroll horizontally if needed.
   - Verify approval cards display full title, department badge, amount, and status badge without truncation.

3. **Modal Dialogs & Virtual Keyboard:**
   - Tap on an expense authorization card to open the Detail Modal.
   - Verify modal fits within the mobile viewport with vertical scroll.
   - Tap **Reject** to open the Rejection Justification Modal.
   - Tap into the text area: verify the virtual keyboard does not obscure the modal or submit button.
   - Test submitting rejection and confirm the modal closes cleanly.

4. **Haptic & Gesture Testing:**
   - Verify pinch-to-zoom is disabled on interactive controls to prevent accidental zooming.
   - Verify pull-to-refresh does not prematurely trigger during internal modal scrolls.

---

### ACTION 3: Five-Minute Product Demo Video Recording

**Objective:** Record and publish a professional, polished five-minute video presentation communicating product capabilities, architectural engineering, and UX quality.

#### Recording Setup:
- **Software:** OBS Studio, Loom, or Camtasia.
- **Resolution:** 1920x1080 (1080p) at 60 fps.
- **Audio:** Dedicated microphone (Yeti, Shure, or quality headset) with noise cancellation.
- **Browser:** Google Chrome running in 100% zoom with clean bookmarks bar.

#### Scene-by-Scene Runbook (Follow Script `DAY20-FIVE-MINUTE-PRODUCT-DEMO-SCRIPT.md`):
- **Scene 1 (0:00 – 0:45): Platform Overview & Architecture**
  - Show Landing/Dashboard (`/`).
  - Introduce Horizon Portal, tech stack (Next.js 16, TypeScript, Neon/PostgreSQL, Tailwind).
- **Scene 2 (0:45 – 1:30): Employee Operations & Leave Application**
  - Log in as Employee (`john@horizon.internal`).
  - Show Leave Balance cards, submit 2-day Annual Leave request.
- **Scene 3 (1:30 – 2:30): Unified Multi-Domain Approval Center**
  - Switch session to Manager (`manager@horizon.internal`).
  - Navigate to `/approvals`.
  - Highlight the 5 KPI summary cards.
  - Switch between domain tabs (`All`, `Leave Requests`, `Corporate Expenses`).
  - Approve John's Leave Request.
- **Scene 4 (2:30 – 3:30): Corporate Spend Governance & Rejection**
  - Inspect Corporate Expense Authorization (`CEA-2026-0001`).
  - Open rejection dialog, explain mandatory justification enforcement.
  - Submit rejection with reason: *"Budget reallocated to Q4 infrastructure."*
  - Demonstrate instant audit trail logging.
- **Scene 5 (3:30 – 4:15): Enterprise Security & AP Isolation**
  - Show Finance Overview (`/admin/finance`).
  - Highlight the 501 preserved Accounts Payable records.
  - Explain strict decoupling between spend authorizations and vendor payables.
- **Scene 6 (4:15 – 5:00): Engineering Rigor, Testing & Handover**
  - Show terminal test suite execution (`scripts/test-unified-approvals.ts` passing 30/30).
  - Show Playwright E2E test report.
  - Conclude with v1.0.0 release readiness.

---

### ACTION 4: Official Release Tagging (`v1.0.0`)

Once Actions 1, 2, and 3 are completed and verified:
```powershell
cd C:\HorizonPortal-Development\horizon-portal
git checkout main
git merge day20-final-challenge
git tag -a v1.0.0 -m "Release v1.0.0 — Horizon Portal Production Release"
git push origin main --tags
```
