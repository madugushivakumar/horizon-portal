# HOSTED POSTGRESQL AND DEPLOYMENT VERIFICATION REPORT
## Infrastructure Readiness, DDL Inspection, Role Isolation & Hosted Deployment Runbook

**Project:** Horizon Portal — HR Operations & Enterprise Management Platform  
**Target Release:** `v1.0.0`  
**Phase:** Phase 4 — Day 17 (Task 17)  
**Workspace:** `C:\HorizonPortal-Development\horizon-portal`  
**Active Development Branch:** `day20-final-challenge`  
**Evaluation Date:** 2026-11-20  
**Lead Roles:** DevOps and Cloud Deployment Engineer, PostgreSQL Migration Specialist, Application Security Auditor  

---

## 1. HOSTING DECISION & PROVIDER EVALUATION

To satisfy enterprise operational requirements, cost boundaries, and zero-maintenance serverless scalability, Horizon Portal selected a modern serverless deployment stack:

| Provider | Free Limits | Sleep Behavior | Database / Storage Size | Monthly Price | Suitability Assessment |
|---|---|---|---|---|---|
| **Neon Serverless PostgreSQL** *(Selected)* | 0.5 GiB storage, 1 compute project, branching support | Scale-to-zero compute (activates in < 500ms on demand) | 0.5 GiB free tier (expandable to TB scale) | Free tier / $19/mo Pro | **Ideal:** Native database branching enables zero-risk isolated Preview testing without touching Production. |
| **Supabase PostgreSQL** | 500 MB database, 2 free projects | Pauses after 7 days of inactivity | 500 MB free tier | Free tier / $25/mo Pro | **Good:** Rich ecosystem, but compute pause behavior requires active keep-alive pings. |
| **Render Managed PostgreSQL** | 1 GB SSD, 90 days expiration | Free instance expires after 90 days | 1 GB | Free for 90d / $7/mo | **Unsuitable:** 90-day hard expiration risks catastrophic data loss during operations. |
| **AWS RDS (db.t4g.micro)** | 750 hours/mo (1 year free tier) | Always-on | 20 GB gp2 storage | Free tier (1 yr) / ~$15/mo | **High Overhead:** Requires manual VPC peering, subnet routing, and complex IAM role management. |
| **Vercel** *(Selected Host)* | Unlimited deployments, 100 GB bandwidth | Serverless edge & lambda functions | CDN static edge caching | Free tier / $20/mo Pro | **Ideal:** Direct GitHub repository integration, preview URLs for every branch, zero server patching. |
| **Upstash Redis** *(Selected Cache)* | 10,000 commands/day | Serverless REST API (no idle connection limits) | 256 MB memory | Free tier / $0.20 per 100k cmds | **Ideal:** Stateless HTTP rate limiting avoids persistent connection pooling bottlenecks in serverless functions. |

---

## 2. ENVIRONMENT CONFIGURATION AUDIT

### 2.1 Schema Separation
The project maintains strict separation between development and production database providers:
- **Local Development:** `prisma/schema.prisma` targeting SQLite (`provider = "sqlite"`).
- **Hosted Production:** `prisma/schema.postgresql.prisma` targeting PostgreSQL 16+ on Neon Serverless (`provider = "postgresql"`).
- **Client Routing Singleton (`src/lib/prisma.ts`):** Automatically detects `DATABASE_URL` prefix:
  - If `DATABASE_URL` starts with `postgresql://` or `postgres://`, loads the dedicated PostgreSQL client from `src/generated/postgresql-client`.
  - Otherwise, loads the standard SQLite Prisma Client from `@prisma/client`.
  - **Fail-Closed Security Guard:** Explicitly throws `SECURITY VIOLATION` if a Preview environment attempts to connect to the Neon Production endpoint (`ep-broad-hall-b3dtqwdp`).

### 2.2 Migration Directory Structure
- SQLite Migrations: `prisma/migrations/` (9 migrations applied).
- PostgreSQL Migrations: `prisma/migrations_postgresql/` contains:
  1. `20261117000000_init_postgresql/migration.sql` (Initial full schema DDL).
  2. `20261120180000_add_corporate_expense_authorizations/migration.sql` (Final Challenge spend authorization table and indexes).
- Configuration: `prisma.config.postgresql.ts` specifies:
  ```typescript
  export default defineConfig({
    schema: "prisma/schema.postgresql.prisma",
    migrations: {
      path: "prisma/migrations_postgresql",
      seed: "tsx prisma/seed.postgresql.ts",
    },
    datasource: {
      url: env("DATABASE_URL"),
    },
  });
  ```

---

## 3. MIGRATION EXECUTION & PROVISIONING STATUS

### 3.1 DDL & Schema Syntax Verification
- **Prisma PostgreSQL Validation:** Executed `npx prisma validate --schema=prisma/schema.postgresql.prisma`.
  - Output: `The schema at prisma\schema.postgresql.prisma is valid 🚀` (Exit code: 0).
- **Migration SQL Inspection:**
  - Table: `corporate_expense_authorizations` with 19 strongly-typed columns.
  - Primary Key: `CONSTRAINT "corporate_expense_authorizations_pkey" PRIMARY KEY ("id")`.
  - Unique Constraint: `reference_number` unique index enforcing `CEA-YYYY-XXXX` format.
  - Foreign Keys:
    - `department_id` references `departments(id)` ON DELETE CASCADE.
    - `requested_by_id` references `employees(id)` ON DELETE CASCADE.
    - `approver_id` references `employees(id)` ON DELETE SET NULL.
  - Indexes: B-tree indexes on `requested_by_id`, `approver_id`, `department_id`, `status`, and `created_at`.

### 3.2 Disposable Database Availability & Production Protection
In strict compliance with Section 3.4 of the Master Prompt:
- Inspection of `.env.production.local` reveals connection strings pointing to the **Neon Production Database** (`ep-broad-hall-b3dtqwdp.c-4.ap-southeast-1.aws.neon.tech`).
- **Production Protection Mandate:** Executing test migrations, running `prisma db push`, seeding, or resetting the Production database is strictly prohibited.
- Local PostgreSQL 18 probe (`localhost:5432`) failed password authentication; password cracking or file tampering is forbidden.
- Docker daemon is inactive on the local host; local containerized PostgreSQL is unavailable.
- **Current Status:** **BLOCKED — AWAITING OWNER PROVISIONING OF DISPOSABLE PREVIEW BRANCH**.

---

## 4. DATABASE ROLE-BASED LEAST-PRIVILEGE DESIGN

The project has prepared two least-privilege SQL scripts to enforce role separation in the database:

### 4.1 Migration Admin Role (`scripts/day18-preview-provisioning.sql`)
- Used exclusively by CI/CD during migration deployment.
- Granted DDL permissions (`CREATE`, `ALTER`, `DROP`, `REFERENCES`) on schema `public`.

### 4.2 Application Runtime Role (`scripts/day18-preview-runtime-grants.sql` & `scripts/post-migration-reconcile.sql`)
- Used by Next.js serverless functions during operational runtime.
- Granted DML permissions only: `SELECT`, `INSERT`, `UPDATE`, `DELETE` on operational business tables.
- **Append-Only Audit Log Protection:** `audit_logs` table permissions restricted to `SELECT` and `INSERT` only (`UPDATE` and `DELETE` revoked) to guarantee immutable regulatory audit preservation.

---

## 5. FOUR-ROLE HOSTED VERIFICATION PROTOCOL

Once the project owner provisions the Preview environment, the following 4-role verification matrix must be executed against the live Preview URL:

| Role | Account / Credentials | Core Verification Workflow | Expected Live Result |
|---|---|---|---|
| **Admin** | `admin@growmar.com` | Login -> Dashboard -> Employee Directory -> Organization Settings | Full administrative console access; employee drawer editing enabled; system settings visible. |
| **HR Specialist** | `hr@growmar.com` | Login -> Employee Profiles -> Leave Allocation -> Payroll Runs | Organization-wide leave view; compensation details visible; historical payroll run reconciliation accessible. |
| **People Manager** | `manager@growmar.com` | Login -> Team Hub -> Unified Approval Center (`/approvals`) | Subordinate leave requests visible; approve/reject actions active; peer/manager salary strictly masked. |
| **Employee** | `employee@growmar.com` | Login -> Self-Service Dashboard -> Apply Leave -> My Payslips | Own leave application functional; own payslips viewable; `/approvals` and `/admin` routes return HTTP 403 Forbidden. |

### 5.1 Cookie & Cross-Origin Security Verification
- Cookie name: `horizon_session`.
- Flags: `HttpOnly=true`, `Secure=true` (enforced on HTTPS preview), `SameSite=Lax`, `Path=/`, `Max-Age=28800`.
- CORS: Credentials enabled (`Access-Control-Allow-Credentials: true`) restricted to authorized Preview domain.
- State Persistence: Session persists across hard browser refresh (`Ctrl+F5`) and tab reopening.

---

## 6. AUTOMATIC DEPLOYMENT INTEGRATION (VERCEL RUNBOOK)

The continuous deployment pipeline is configured for zero-downtime automatic builds:
1. **GitHub Trigger:** Push to branch `day20-final-challenge` triggers Vercel Preview Build.
2. **Build Command:** `npm run build:prod`
   - Executes `prisma generate --schema=prisma/schema.postgresql.prisma` to compile the PostgreSQL client into `src/generated/postgresql-client`.
   - Executes `next build --webpack` with PostCSS and Tailwind CSS v4 compilation.
3. **Automatic Deployment Verification:** Vercel generates a unique preview URL (e.g., `https://horizon-portal-preview-git-day20-final-challenge.vercel.app`).

Because Git push and cloud deployment operations require explicit owner authorization under Section 3.5, the deployment remains staged locally.

---

## 7. OUTSTANDING OWNER ACTIONS

To transition Task 17 from **STAGED / BLOCKED** to **LIVE VERIFIED**:

1. **Action 1 (Provision Neon Preview Database):**
   - In Neon Console, create branch `preview-day20-final` from `main`.
   - Obtain migration connection string: `DIRECT_URL="postgresql://migration_admin:...@ep-preview.neon.tech/horizon_db?sslmode=require"`.
   - Obtain runtime connection string: `DATABASE_URL="postgresql://app_runtime:...@ep-preview.neon.tech/horizon_db?sslmode=require"`.
2. **Action 2 (Execute Migrations):**
   - Run: `powershell -ExecutionPolicy Bypass -File scripts/deploy-migrations.ps1`.
3. **Action 3 (Bind Vercel Preview Environment Variables):**
   - Configure `DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`, `UPSTASH_REDIS_REST_URL`, and `UPSTASH_REDIS_REST_TOKEN` in Vercel for Preview environment.
4. **Action 4 (Authorize Git Push & Trigger Preview Deployment):**
   - Authorize pushing `day20-final-challenge` to GitHub remote to trigger Vercel build.
5. **Action 5 (Execute 4-Role Verification):**
   - Verify Admin, HR, Manager, and Employee logins on the live deployment.
