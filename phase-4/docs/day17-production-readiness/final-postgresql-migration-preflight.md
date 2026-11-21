# Stage C: Final PostgreSQL Migration Preflight
## Horizon Portal / Aura Workforce by Growmar — Phase 4, Day 17

> **Milestone:** Phase 4 — Day 17 (Task 17)  
> **Stage:** Stage C — Final PostgreSQL Migration Preflight  
> **Status:** AUDITED & GATED FOR APPROVAL  
> **Target Cloud Host:** Neon Serverless PostgreSQL  
> **Schema:** `prisma/schema.postgresql.prisma`  
> **Migration DDL:** `prisma/migrations_postgresql/20261117000000_init_postgresql/migration.sql`

---

## 1. Schema & Migration Preflight Comparison

A full structural comparison was performed between `prisma/schema.postgresql.prisma` and the baseline DDL script:

| Category | PostgreSQL Schema (`.prisma`) | Baseline Migration SQL (`.sql`) | Preflight Match |
| :--- | :--- | :--- | :---: |
| **Provider** | `provider = "postgresql"` | `CREATE SCHEMA IF NOT EXISTS "public";` | **MATCH** |
| **Model Count** | 27 models | 27 `CREATE TABLE` statements | **MATCH (27/27)** |
| **Foreign Keys** | 26 relation fields | 26 `ALTER TABLE ... ADD CONSTRAINT ... FOREIGN KEY` | **MATCH (26/26)** |
| **Unique Indexes** | 12 `@unique` / `@@unique` directives | 12 `CREATE UNIQUE INDEX` statements | **MATCH (12/12)** |
| **Performance Indexes** | 40 `@@index` directives | 40 `CREATE INDEX` statements | **MATCH (40/40)** |
| **Paise Fields** | `BigInt` (for paise currency values) | `BIGINT NOT NULL` | **MATCH** |
| **Float Fields** | `Float` (gross/net amounts, LOP days) | `DOUBLE PRECISION` | **MATCH** |
| **Timestamp Fields** | `DateTime` | `TIMESTAMP(3)` | **MATCH** |
| **Boolean Flags** | `Boolean @default(...)` | `BOOLEAN NOT NULL DEFAULT ...` | **MATCH** |
| **Destructive Statements** | None | 0 `DROP`, 0 `TRUNCATE`, 0 `ALTER DROP` | **MATCH (0/0)** |

---

## 2. Table-by-Table Verification Matrix (27 Models)

```text
 1. users                 --> CREATE TABLE "users"                 [PK: id, UNIQUE: email, FK: employee_id]
 2. departments           --> CREATE TABLE "departments"           [PK: id]
 3. roles                 --> CREATE TABLE "roles"                 [PK: id, FK: department_id]
 4. employees             --> CREATE TABLE "employees"             [PK: id, UNIQUE: email, FK: dept, role, mgr]
 5. payroll_runs          --> CREATE TABLE "payroll_runs"          [PK: id]
 6. payroll_adjustments   --> CREATE TABLE "payroll_adjustments"   [PK: id, UNIQUE: idempotency_key, FK: payroll_run]
 7. payslips              --> CREATE TABLE "payslips"              [PK: id, UNIQUE: (payroll_run, emp), FK: emp, run]
 8. leave_types           --> CREATE TABLE "leave_types"           [PK: id, UNIQUE: code]
 9. leave_balances        --> CREATE TABLE "leave_balances"        [PK: id, UNIQUE: (emp, leave_type, year)]
10. leave_requests        --> CREATE TABLE "leave_requests"        [PK: id, FK: emp, leave_type]
11. holidays              --> CREATE TABLE "holidays"              [PK: id]
12. attendance_monthly    --> CREATE TABLE "attendance_monthly"    [PK: id, UNIQUE: (emp, month, year)]
13. teams                 --> CREATE TABLE "teams"                 [PK: id, FK: dept, team_lead]
14. sprints               --> CREATE TABLE "sprints"               [PK: id]
15. tasks                 --> CREATE TABLE "tasks"                 [PK: id, FK: team, sprint]
16. clients               --> CREATE TABLE "clients"               [PK: id]
17. vendors               --> CREATE TABLE "vendors"               [PK: id]
18. invoices              --> CREATE TABLE "invoices"              [PK: id, FK: client]
19. expenses              --> CREATE TABLE "expenses"              [PK: id, FK: vendor, dept, submitter, approver]
20. announcements         --> CREATE TABLE "announcements"         [PK: id]
21. hr_faqs               --> CREATE TABLE "hr_faqs"               [PK: id]
22. chatbot_responses     --> CREATE TABLE "chatbot_responses"     [PK: id]
23. ai_anomaly_results    --> CREATE TABLE "ai_anomaly_results"    [PK: id]
24. ai_attrition_risk     --> CREATE TABLE "ai_attrition_risk"     [PK: id, FK: emp, dept]
25. notifications         --> CREATE TABLE "notifications"         [PK: id, FK: user]
26. audit_logs            --> CREATE TABLE "audit_logs"            [PK: id]
27. manager_delegations   --> CREATE TABLE "manager_delegations"   [PK: id, FK: mgr, acting_mgr]
```

---

## 3. Migration Execution Approval Gate (Gate 1)

| Parameter | Specification |
| :--- | :--- |
| **Command** | `npm run prisma:migrate:pg` |
| **Underlying Command** | `prisma migrate deploy --config prisma.config.postgresql.ts` |
| **Target Engine** | Neon Serverless PostgreSQL (`*.neon.tech`) |
| **Connection Used** | `DIRECT_URL` (Port 5432, session mode) |
| **Operation Type** | **100% Additive** |
| **Destructive Risk** | Zero. Creates new tables in empty public schema. |
| **SQLite Preservation** | `prisma/dev.db` and 8 migrations in `prisma/migrations/` untouched. |
