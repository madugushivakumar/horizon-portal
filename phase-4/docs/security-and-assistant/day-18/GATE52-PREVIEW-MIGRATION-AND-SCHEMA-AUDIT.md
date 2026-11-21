# GATE 5.2 — PREVIEW DATABASE MIGRATION & SCHEMA COMPATIBILITY AUDIT

**Project:** Horizon Portal  
**Branch:** `day18-preview-validation`  
**Date:** November 19, 2026  
**Auditor:** Senior PostgreSQL Reliability Engineer & Prisma Architect  

---

## 1. Schema Validation & Parity Analysis

Horizon Portal maintains full dual-database schema synchronization:
- SQLite schema: `prisma/schema.prisma`
- PostgreSQL schema: `prisma/schema.postgresql.prisma`

### Prisma Validation Status
- `npx prisma validate --schema=prisma/schema.postgresql.prisma` -> **VALID**
- Model count: 24 models (Employees, Roles, Departments, Users, LeaveRequests, PayrollRuns, Payslips, Invoices, Expenses, Tasks, etc.).
- Enum count: 8 PostgreSQL enums (`RoleLevel`, `LeaveStatus`, `PayrollStatus`, `InvoiceStatus`, etc.).

---

## 2. Migration Artifacts Inspection

The authoritative baseline migration for PostgreSQL is tracked at:
`prisma/migrations_postgresql/20261117000000_init_postgresql/migration.sql`

Key characteristics:
1. **Idempotence & Safety:**
   - Creates required PostgreSQL ENUM types safely.
   - Defines all relational tables with proper foreign key constraints and `ON DELETE` rules.
   - Creates performance indexes on frequently filtered columns (`employeeId`, `payrollRunId`, `status`, `leaveTypeCode`).
2. **Direct Connection Execution (`DIRECT_URL`):**
   - Running Prisma migrations requires a direct connection to PostgreSQL port 5432 without connection pooling (which can interfere with advisory locks and transactional DDL).
   - In Gate 5.2, `DIRECT_URL` must point to the dedicated preview branch compute node when applying migrations.

---

## 3. Migration Application Command Reference (Preview-Only)

Once the repository owner provisions the Preview branch and configures `DIRECT_URL` / `DATABASE_URL`:
```powershell
# Verify migration status against Preview database
npx prisma migrate status --schema=prisma/schema.postgresql.prisma

# Deploy baseline migration to Preview database
npx prisma migrate deploy --schema=prisma/schema.postgresql.prisma
```

*CRITICAL WARNING: The commands above must ONLY be run against the verified isolated Preview database, NEVER against the Production endpoint (`ep-broad-hall-b3dtqwdp`).*
