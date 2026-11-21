# HORIZON PORTAL v1.0.0 — HOSTED PREVIEW VERIFICATION REPORT
## Infrastructure Readiness, Preview Deployment Protocol & Verification Runbook

**Project:** Horizon Portal  
**Target Release:** `v1.0.0`  
**Evaluation Date:** 2026-11-20  
**Phase:** Phase 2 — Hosted Preview Provisioning and Verification  
**Status:** **PENDING OWNER CLOUD PROVISIONING**  
**Lead Roles:** DevOps and Cloud Infrastructure Engineer, QA Automation Engineer, Application Security Auditor  

---

## 1. PREVIEW INFRASTRUCTURE READINESS AUDIT

### 1.1 Infrastructure Inventory

| Component | Target Architecture | Current Local State | Release Gate Status |
|---|---|---|:---:|
| **PostgreSQL Database** | Isolated Neon Preview Branch (`preview-day20-final`) | Provisioning script ready (`scripts/deploy-migrations.ps1`) | **PENDING OWNER ACTION** |
| **Database Roles** | `migration_admin` & `app_runtime` separated | SQL grant script ready (`scripts/day18-preview-runtime-grants.sql`) | **PENDING OWNER ACTION** |
| **Distributed Cache** | Upstash Preview Redis instance | Configuration abstraction ready (`src/lib/security/rate-limit/config.ts`) | **PENDING OWNER ACTION** |
| **Hosting Platform** | Vercel Preview Deployment | `vercel.json` / build scripts verified | **PENDING OWNER ACTION** |
| **Automated E2E Suite**| Playwright 10 Business & Approval Journeys | Configured with fail-closed production guard (`playwright.config.ts`) | **READY FOR HOSTED RUN** |

---

## 2. OWNER-CONTROLLED PROVISIONING PROCEDURE (RUNBOOK)

Because cloud platform administration tokens (Neon Console, Upstash Console, Vercel Dashboard) are strictly owner-controlled and deliberately not stored in the repository, the project owner must execute the following step-by-step procedure:

---

### Step 1: Provision Neon Preview Database Branch
1. Log into the Neon Web Console (`https://console.neon.tech`).
2. Navigate to project: **Horizon Portal**.
3. Select **Branches** -> **New Branch**.
   - **Branch Name:** `preview-day20-final`
   - **Parent Branch:** `main`
4. In the Branch Dashboard, create two dedicated compute roles:
   - Role 1: `migration_admin` (Admin role for DDL).
   - Role 2: `app_runtime` (Restricted role for Next.js runtime).
5. Obtain the direct migration connection string:
   `postgresql://migration_admin:<PASSWORD>@ep-preview-day20.neon.tech/horizon_db?sslmode=require`

---

### Step 2: Execute Migration Deployment Pipeline
From administrative workstation (PowerShell 7+):
```powershell
cd C:\HorizonPortal-Development\horizon-portal

$env:DIRECT_URL = "postgresql://migration_admin:<PASSWORD>@ep-preview-day20.neon.tech/horizon_db?sslmode=require"
$env:EXPECTED_PREVIEW_ENDPOINT = "ep-preview-day20"
$env:MIGRATE_ENV = "preview"

# Execute controlled migration deployer
.\scripts\deploy-migrations.ps1
```
**Expected Output:**
- Pre-flight security guard validates endpoint identity (rejects production).
- Prisma applies all 9 migrations from `prisma/migrations_postgresql`.
- Post-migration isolation hook applies `scripts/post-migration-reconcile.sql`, shielding `_prisma_migrations`.

---

### Step 3: Apply Least-Privilege Grants
Connect to the preview branch via `psql`:
```bash
psql "$DIRECT_URL" -f scripts/day18-preview-runtime-grants.sql
```
This restricts `app_runtime` to:
- `SELECT`, `INSERT`, `UPDATE` on operational tables.
- `SELECT`, `INSERT` on `audit_logs` (Strictly no `DELETE` or `UPDATE`).
- No DDL permissions.

---

### Step 4: Provision Upstash Preview Redis
1. Log into Upstash Console (`https://console.upstash.com`).
2. Create database: `horizon-preview-redis` in region matching Neon/Vercel (e.g. `us-east-1`).
3. Copy REST URL and REST Token.

---

### Step 5: Configure Vercel Preview Deployment
1. In Vercel Project Settings -> **Environment Variables**, set for **Preview** environment:
   - `DATABASE_URL`: `postgresql://app_runtime:<PASSWORD>@ep-preview-day20-pooler.neon.tech/horizon_db?sslmode=require`
   - `DIRECT_URL`: Direct pooled endpoint string.
   - `UPSTASH_REDIS_REST_URL`: Upstash Preview REST URL.
   - `UPSTASH_REDIS_REST_TOKEN`: Upstash Preview REST Token.
   - `JWT_SECRET`: 64-character random preview signing secret.
2. Trigger Preview Deployment:
   ```powershell
   vercel --preview
   ```
3. Record the generated Preview URL: `https://horizon-portal-preview-xyz.vercel.app`.

---

## 3. HOSTED VERIFICATION PROTOCOLS (ONCE DEPLOYED)

### 3.1 Ten Core Business & Approval Journeys
Once the Preview URL is active, execute Playwright against the Preview deployment:
```powershell
$env:BASE_URL = "https://horizon-portal-preview-xyz.vercel.app"
$env:E2E_USER_EMAIL = "manager@horizon.internal"
$env:E2E_USER_PASSWORD = "<PREVIEW_PASSWORD>"
npx playwright test
```

#### Journeys to Validate:
1. **Authentication & RBAC:** Admin, Manager, and Employee login redirects.
2. **Leave Application:** Employee submits annual leave; balance updates.
3. **Leave Approval:** Manager approves leave; calendar and balance reflect status.
4. **Payslip Privacy:** Employee views payslip; IDOR prevention blocks peer payslip access.
5. **Task Management:** Move task cards across Kanban swimlanes.
6. **Unified Approval Center Dashboard:** Manager accesses `/approvals`; KPI summary cards render.
7. **Multi-Domain Filtering:** Domain pills (`All`, `Leave Requests`, `Corporate Expenses`) and status tabs filter items.
8. **Detail Modal Inspection:** Corporate expense metadata (category, department, requester) displays correctly.
9. **Rejection Modal Enforcement:** Rejection requires mandatory reason (>= 3 chars); throws validation error on empty submit.
10. **Employee Boundary Protection:** Employee role attempting to access `/approvals` receives HTTP 403 / redirect.

---

### 3.2 Hosted Security & Performance Targets

| Verification Domain | Standard Required | Target Metric |
|---|---|---|
| **HTTPS & Security Headers** | HSTS, CSP, X-Frame-Options: DENY, X-Content-Type-Options | Grade A on SecurityHeaders.io |
| **Cookie Flags** | `HttpOnly`, `Secure`, `SameSite=Lax` | Verified on session cookies |
| **Rate Limiting** | Upstash Redis Sliding Window | HTTP 429 on > 10 requests / min |
| **Lighthouse Performance** | Mobile & Desktop Performance audit | Performance >= 85, A11y >= 90 |
| **General Ledger Preservation** | SQL check on Preview database | Exactly 501 `Expense` records (478 PAID, 23 UNPAID) |

---

## 4. PHASE 2 CONCLUSION

All deployment scripts, security hooks, migration DDLs, and automated E2E test suites are **100% prepared and staged**.

Execution of hosted provisioning is legitimately held pending owner cloud credentials, as mandated by the project security boundary rules.
