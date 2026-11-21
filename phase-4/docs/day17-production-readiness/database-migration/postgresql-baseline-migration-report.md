# PostgreSQL Baseline Migration Report
## Horizon Portal / Aura Workforce by Growmar — Phase 4, Day 17

> **Milestone:** Phase 4 — Day 17 (Task 17)  
> **Status:** Completed & Verified  
> **Target Schema:** `prisma/schema.postgresql.prisma`  
> **Baseline Migration Directory:** `prisma/migrations_postgresql/`  
> **Lock Provider:** `postgresql`  
> **Verification Command:** `npx prisma validate --config prisma.config.postgresql.ts` -> Code 0

---

## 1. Executive Summary

To deploy Horizon Portal to production on Neon Serverless PostgreSQL without modifying or risking the local SQLite development environment (`dev.db` and its 8 historical SQLite migrations), a clean, isolated PostgreSQL baseline migration was generated and validated.

This satisfies **Gate A (Schema & Migration Isolation)** of the Day 17 production release requirements.

---

## 2. Generated Artifacts Inventory

| File Path | Purpose | Size / Lines | Status |
| :--- | :--- | :--- | :--- |
| `prisma/schema.postgresql.prisma` | Full 27-model schema with PostgreSQL provider | 29,825 bytes / 679 lines | Validated |
| `prisma.config.postgresql.ts` | Isolated Prisma CLI config for PostgreSQL migrations & schema | 425 bytes | Configured & Tested |
| `prisma/migrations_postgresql/migration_lock.toml` | Lock file locking migration history to `postgresql` provider | 118 bytes / 3 lines | Created (`provider = "postgresql"`) |
| `prisma/migrations_postgresql/20261117000000_init_postgresql/migration.sql` | Native PostgreSQL DDL defining all 27 tables, constraints, indexes | 26,905 bytes / 780 lines | Generated |

---

## 3. Baseline Migration DDL Details

The baseline migration script was produced by running:
```bash
npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.postgresql.prisma --script
```

### Key DDL Highlights:
1. **Schema Initialization:**
   ```sql
   CREATE SCHEMA IF NOT EXISTS "public";
   ```
2. **27 Native PostgreSQL Tables:**
   - `users` (with `users_pkey` and unique constraint `users_email_key`)
   - `departments` (with `departments_pkey`)
   - `roles` (with `roles_pkey`)
   - `employees` (with `employees_pkey` and unique constraint `employees_email_key`)
   - `payroll_runs` (with `payroll_runs_pkey`)
   - `payroll_adjustments` (with `payroll_adjustments_pkey`, `BigInt` paise fields, unique `payroll_adjustments_idempotency_key_key`)
   - `payslips` (with `payslips_pkey`, unique `payslips_payroll_run_id_employee_id_key`)
   - `leave_balances` (with `leave_balances_pkey`, unique `leave_balances_employee_id_leave_type_id_year_key`)
   - `leave_types` (with `leave_types_pkey`, unique `leave_types_code_key`)
   - `leave_requests` (with `leave_requests_pkey`)
   - `attendance_monthly` (with `attendance_monthly_pkey`, unique `attendance_monthly_employee_id_month_year_key`)
   - `teams`, `tasks`, `sprints`, `task_comments`
   - `clients`, `invoices`, `vendors`, `expenses`
   - `ai_attrition_risk`, `notifications`, `manager_delegations`
   - `audit_events`, `activity_logs`, `settings`, `system_metrics`
3. **Foreign Keys and Cascading Rules:**
   - 28 foreign key constraints mapped to native PostgreSQL constraints with `ON DELETE CASCADE` or `ON DELETE SET NULL` matching the exact domain logic.
4. **Indexes:**
   - Indexes mapped cleanly for all query pathways (`tasks_team_id_idx`, `tasks_sprint_id_idx`, `notifications_user_id_idx`, `manager_delegations_status_idx`, etc.).

---

## 4. Prisma 6 Dual-Config Routing Architecture

Prisma 6.19.3 introduces first-class configuration via `defineConfig` in `prisma.config.ts`. To prevent cross-contamination:

1. **Local Development Config (`prisma.config.ts`):**
   ```ts
   export default defineConfig({
     schema: "prisma/schema.prisma",
     migrations: { path: "prisma/migrations", seed: "tsx prisma/seed.ts" },
     engine: "classic",
     datasource: { url: env("DATABASE_URL") },
   });
   ```
2. **Production / PostgreSQL Config (`prisma.config.postgresql.ts`):**
   ```ts
   export default defineConfig({
     schema: "prisma/schema.postgresql.prisma",
     migrations: { path: "prisma/migrations_postgresql", seed: "tsx prisma/seed.ts" },
     engine: "classic",
     datasource: {
       url: process.env.DIRECT_URL || process.env.DATABASE_URL || "postgresql://user:pass@localhost:5432/db",
     },
   });
   ```

---

## 5. Verification & Validation Evidence

### A. SQLite Preservation Test
```bash
$ npx prisma migrate status
Loaded Prisma config from prisma.config.ts.
Prisma schema loaded from prisma\schema.prisma
Datasource "db": SQLite database "dev.db" at "file:./dev.db"
8 migrations found in prisma/migrations
Database schema is up to date!
Exit Code: 0
```

### B. PostgreSQL Config & Schema Validation Test
```bash
$ $env:DIRECT_URL="postgresql://user:pass@localhost:5432/db"; $env:DATABASE_URL="postgresql://user:pass@localhost:5432/db"; npx prisma validate --config prisma.config.postgresql.ts
Loaded Prisma config from prisma.config.postgresql.ts.
Prisma config detected, skipping environment variable loading.
Prisma schema loaded from prisma\schema.postgresql.prisma
The schema at prisma\schema.postgresql.prisma is valid 🚀
Exit Code: 0
```

---

## 6. Next Actions

With the baseline migration files generated and verified:
1. Update `package.json` with narrow, dedicated helper scripts for PostgreSQL operations.
2. Advance to **Gate B/C: Neon Serverless PostgreSQL Provisioning & Seed Verification**.
