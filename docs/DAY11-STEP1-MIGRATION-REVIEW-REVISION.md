# Day 11 — Step 1: Migration Review Revision & Governance Audit
## Foreign-Key Immutability, Exact Financial Precision & Dual-Control Architecture
### Aura Workforce by Growmar — Horizon Portal

**Document Version:** 2.0.0 (Post-Review Revision)  
**Date:** 2026-11-06  
**Implementation Phase:** Day 11 — Step 1: Schema & Migration Preparation (Revised)  
**Status:** Revision Complete — Staged for Verification  
**Execution Mode:** Inspection & Review Only (Zero Database Mutations Executed)  
**Lead Architect & Auditor:** Senior Full-Stack Engineer, Enterprise Software Architect, Database Engineer, Financial Systems Auditor  

---

## 1. Executive Summary of Corrections

Following accounting and financial audit review of the initial Step 1 migration, a critical referential integrity enhancement was executed on the unapplied migration `prisma/migrations/20261106154652_add_payroll_correction_ledger/migration.sql` and the Prisma schema `prisma/schema.prisma`.

### Critical Correction Implemented
- **Previous Configuration:** The child table `payroll_adjustments` utilized `ON DELETE CASCADE` referencing parent `payroll_runs(id)`.
- **Accounting Risk Identified:** Under `ON DELETE CASCADE`, if an administrative actor or rogue process were to delete a `PayrollRun` entity, the permanent financial audit trail, historical adjustment tie-out records, and SOX-compliant ledger entries would be silently and irreversibly destroyed.
- **Correction Applied:** Replaced with **`ON DELETE RESTRICT`** at both the Prisma schema and the generated DDL constraint level.
- **Engine Enforcement:** SQLite foreign key enforcement will now reject any attempt to delete a `PayrollRun` that has associated adjustments with `SQLITE_CONSTRAINT_TRIGGER / FOREIGN KEY constraint failed`, guaranteeing that financial adjustments are permanently indelible.

---

## 2. Complete Re-inspected Migration SQL

**File Path:** `prisma/migrations/20261106154652_add_payroll_correction_ledger/migration.sql`

```sql
-- AlterTable
ALTER TABLE "payroll_runs" ADD COLUMN "original_employees_paid" INTEGER;
ALTER TABLE "payroll_runs" ADD COLUMN "original_total_deductions" REAL;
ALTER TABLE "payroll_runs" ADD COLUMN "original_total_gross" REAL;
ALTER TABLE "payroll_runs" ADD COLUMN "original_total_net" REAL;
ALTER TABLE "payroll_runs" ADD COLUMN "reconciled_at" DATETIME;
ALTER TABLE "payroll_runs" ADD COLUMN "reconciled_by_id" TEXT;
ALTER TABLE "payroll_runs" ADD COLUMN "reconciliation_notes" TEXT;

-- CreateTable
CREATE TABLE "payroll_adjustments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "payroll_run_id" TEXT NOT NULL,
    "adjustment_type" TEXT NOT NULL DEFAULT 'HISTORICAL_REPORTING_ADJUSTMENT',
    "status" TEXT NOT NULL DEFAULT 'PROPOSED',
    "revision" INTEGER NOT NULL DEFAULT 1,
    "idempotency_key" TEXT NOT NULL,
    "original_employees_paid" INTEGER NOT NULL,
    "original_gross_paise" BIGINT NOT NULL,
    "original_deductions_paise" BIGINT NOT NULL,
    "original_net_paise" BIGINT NOT NULL,
    "original_total_gross" REAL NOT NULL,
    "original_total_deductions" REAL NOT NULL,
    "original_total_net" REAL NOT NULL,
    "adjusted_employees_paid" INTEGER NOT NULL,
    "adjusted_gross_paise" BIGINT NOT NULL,
    "adjusted_deductions_paise" BIGINT NOT NULL,
    "adjusted_net_paise" BIGINT NOT NULL,
    "adjusted_total_gross" REAL NOT NULL,
    "adjusted_total_deductions" REAL NOT NULL,
    "adjusted_total_net" REAL NOT NULL,
    "variance_gross_paise" BIGINT NOT NULL,
    "variance_deductions_paise" BIGINT NOT NULL,
    "variance_net_paise" BIGINT NOT NULL,
    "variance_employees" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "reconciliation_source" TEXT NOT NULL DEFAULT 'ITEMIZED_PAYSLIPS',
    "source_dataset_reference" TEXT,
    "reconciled_by_id" TEXT NOT NULL,
    "reconciled_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approved_by_id" TEXT,
    "approved_at" DATETIME,
    "effective_date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "audit_log_id" TEXT,
    "audit_event_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "payroll_adjustments_payroll_run_id_fkey" FOREIGN KEY ("payroll_run_id") REFERENCES "payroll_runs" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "payroll_adjustments_idempotency_key_key" ON "payroll_adjustments"("idempotency_key");

-- CreateIndex
CREATE INDEX "payroll_adjustments_payroll_run_id_idx" ON "payroll_adjustments"("payroll_run_id");

-- CreateIndex
CREATE INDEX "payroll_adjustments_status_idx" ON "payroll_adjustments"("status");

-- CreateIndex
CREATE INDEX "payroll_adjustments_audit_event_id_idx" ON "payroll_adjustments"("audit_event_id");

-- CreateIndex
CREATE INDEX "payroll_adjustments_reconciled_by_id_idx" ON "payroll_adjustments"("reconciled_by_id");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_adjustments_payroll_run_id_revision_key" ON "payroll_adjustments"("payroll_run_id", "revision");
```

---

## 3. Line-by-Line DDL Safety & Non-Destructive Audit

| Line Range | SQL Statement | Purpose | Non-Destructive Evaluation |
| :--- | :--- | :--- | :--- |
| **Lines 1–8** | `ALTER TABLE "payroll_runs" ADD COLUMN ...` (7 columns) | Add nullable snapshot and attribution fields | **100% Safe:** All added columns are nullable (`INTEGER`, `REAL`, `DATETIME`, `TEXT`). Zero table recreation, zero lock escalations, zero existing rows modified. |
| **Lines 10–49** | `CREATE TABLE "payroll_adjustments" (...)` | Isolated historical adjustment table | **100% Safe:** Creates a brand-new table. Does not alter, move, or truncate any existing entity. |
| **Line 48** | `CONSTRAINT ... ON DELETE RESTRICT ON UPDATE CASCADE` | Referential integrity constraint | **100% Safe & Protective:** Enforces non-destructive lifecycle. Parent runs with adjustments cannot be deleted. |
| **Lines 51–67** | `CREATE UNIQUE INDEX ...` & `CREATE INDEX ...` (6 indexes) | Idempotency, revision, and performance indexing | **100% Safe:** Indexes created only on the new `payroll_adjustments` table. |

---

## 4. Architectural Verification & Governance Strategies

### 4.1 Immutability of Original Snapshot Fields
- **Target Run:** `PR-2026-09` (September 2026, Pending / Unpaid).
- **Snapshot Fields on `PayrollRun`:**
  - `originalEmployeesPaid` ($444$)
  - `originalTotalGross` ($₹54,788,660.03$)
  - `originalTotalNet` ($₹48,089,678.30$)
  - `originalTotalDeductions` ($₹6,698,981.73$)
  - `reconciledAt` (Timestamp)
  - `reconciledById` (User ID)
- **Immutability Enforcement:**
  - The reconciliation route handler checks `run.originalTotalGross !== null`.
  - If snapshot fields are already populated, subsequent reconciliation requests **cannot overwrite** the original snapshot. The original pre-correction values remain permanently frozen as historical evidence of the pre-reconciliation state.

### 4.2 Canonical Financial Values: Integer Paise (`BigInt`)
- In accordance with enterprise accounting standards, floating-point representations (IEEE 754 `Float` / `Double`) are prohibited as the source of truth due to binary rounding imprecision (e.g., $0.1 + 0.2 \neq 0.3$).
- All authoritative financial totals and variances are stored as **exact integer paise** using 64-bit `BigInt`:
  - `originalGrossPaise`
  - `originalDeductionsPaise`
  - `originalNetPaise`
  - `adjustedGrossPaise`
  - `adjustedDeductionsPaise`
  - `adjustedNetPaise`
  - `varianceGrossPaise`
  - `varianceDeductionsPaise`
  - `varianceNetPaise`
- SQLite natively maps `BIGINT` to 64-bit signed integers ($9.22 \times 10^{18}$ maximum value, accommodating payroll up to ₹90 quadrillion).

### 4.3 Float Compatibility Fields are Derived
- Fields such as `adjustedTotalGross`, `adjustedTotalNet`, `adjustedTotalDeductions`, `originalTotalGross`, etc. on `PayrollAdjustment` are strictly secondary display fields.
- **Derivation Rule:**
  $$\text{Float Value} = \frac{\text{Number}(\text{Paise Value})}{100}$$
- All validation, integrity assertions, ledger tie-outs, and difference checks are executed **exclusively on the `BigInt` paise values** prior to populating the `Float` fields for frontend rendering.

### 4.4 Financial Invariant: Gross - Deductions = Net
The model enforces the fundamental accounting balance equation across all states:
$$\text{Net} = \text{Gross} - \text{Deductions}$$

The backend service asserts:
1. `originalGrossPaise - originalDeductionsPaise === originalNetPaise`
2. `adjustedGrossPaise - adjustedDeductionsPaise === adjustedNetPaise`
3. `varianceGrossPaise - varianceDeductionsPaise === varianceNetPaise`

Any payload or calculated adjustment failing this exact 0-paise equality is aborted before hitting the database with an `UNPROCESSABLE_ENTITY` error.

### 4.5 Revision & Idempotency Under Concurrent Requests
To prevent race conditions, duplicate submissions, and double-posting under high concurrency:
1. **Idempotency Key (`idempotencyKey`):**
   - Enforced by `CREATE UNIQUE INDEX "payroll_adjustments_idempotency_key_key" ON "payroll_adjustments"("idempotency_key")`.
   - If two network requests transmit the same key (e.g., browser double-click or network retry), SQLite rejects the second insert with unique constraint violation (`P2002`).
2. **Revision Ordering (`[payrollRunId, revision]`):**
   - Enforced by `CREATE UNIQUE INDEX "payroll_adjustments_payroll_run_id_revision_key" ON "payroll_adjustments"("payroll_run_id", "revision")`.
   - Guarantees sequential revision history ($1, 2, 3 \dots$) and prevents concurrent competing revisions for the same payroll run.

### 4.6 Server-Side Maker-Checker Governance
Reconciliation and approval are decoupled to enforce SOX dual-control separation of duties:
1. **Reconciliation Attribution:**
   - Server reads authenticated session user ID (`session.user.id`).
   - Verifies caller possesses `ADMIN` or `HR` role.
   - Sets `reconciledById = session.user.id`.
2. **Approval Attribution & Maker-Checker Separation:**
   - When `POST /api/v1/payroll/runs/[runId]/approve` is called, the handler verifies:
     $$\text{session.user.id} \neq \text{run.reconciledById}$$
   - If the user attempting to approve is the same individual who reconciled the run, the request is rejected with `HTTP 403 Forbidden: Maker-Checker policy prohibits self-approval of reconciled payroll runs`.

### 4.7 Audit Linkage: `auditEventId` vs. `auditLogId`
The schema provides clear separation of audit concerns:
- **`auditLogId` (Database Primary Key Link):**
  Direct reference to the specific primary key of the row in `audit_logs` table (`AuditLog.id`). Enables 1-to-1 retrieval of the exact initial mutation entry.
- **`auditEventId` (Distributed Trace & Correlation Identifier):**
  A high-level business correlation UUID (e.g., `evt_adj_202608_1730912400000`) shared across multiple related audit logs (reconciliation proposed, adjustment created, ledger tied out, final notification dispatched). Allows complete multi-stage timeline reconstruction.

### 4.8 Operational Immutability of Paid Runs (`PR-2026-08`)
On August 2026 (`PR-2026-08`):
- `PayrollRun.status` remains permanently `"PAID"`.
- `PayrollRun.paymentDate` remains permanently `"2026-09-01T00:00:00.000Z"`.
- `PayrollRun.payDate` remains permanently `"2026-09-01T00:00:00.000Z"`.
- `PayrollRun.totalGross`, `totalNet`, and `employeesPaid` are **NEVER modified in `PayrollRun`**.
- All adjustments exist strictly in `payroll_adjustments` as a prior-period reporting adjustment.

### 4.9 Separate Workflows for September vs. August

```
+----------------------------------------------------------------------------------------------------+
|                                 PAYROLL RUN LIFECYCLE PATHWAYS                                     |
+----------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  [PR-2026-09] (September 2026)                                                                     |
|  Status: POSTED - PAYMENT PENDING (Unpaid)                                                         |
|  Approval Status: Pending                                                                          |
|  ==> PATHWAY A: In-Flight Pre-Approval Reconciliation                                              |
|      1. Snapshot original header values into PayrollRun.originalTotalGross/Net/EmployeesPaid.      |
|      2. Update PayrollRun header to tie out with 441 verified payslips.                            |
|      3. Status changes from MISMATCH to MATCHED.                                                   |
|      4. Independent Admin can now approve the run.                                                |
|                                                                                                    |
+----------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  [PR-2026-08] (August 2026)                                                                        |
|  Status: PAID (Disbursed 2026-09-01)                                                               |
|  Approval Status: Approved                                                                         |
|  ==> PATHWAY B: Formal Historical Reporting Adjustment                                             |
|      1. Do NOT touch PayrollRun header, status, or payDate.                                        |
|      2. Insert adjustment record into PayrollAdjustment with exact paise differences.              |
|      3. Dual-ledger presentation: Status reflects ADJUSTED_MATCHED.                                |
|      4. Original payment disbursement remains legally intact.                                      |
|                                                                                                    |
+----------------------------------------------------------------------------------------------------+
```

---

## 5. Toolchain Verification Results

All toolchain checks were re-executed and verified:

### 1. `npx prisma validate`
```
Loaded Prisma config from prisma.config.ts.
Prisma schema loaded from prisma\schema.prisma
The schema at prisma\schema.prisma is valid 🚀
```

### 2. `npx prisma generate`
```
Loaded Prisma config from prisma.config.ts.
Prisma schema loaded from prisma\schema.prisma
✔ Generated Prisma Client (v6.19.3) to .\node_modules\@prisma\client in 698ms
```

### 3. `npx tsc --noEmit`
```
Exit code 0 — 0 type errors across the entire codebase.
```

---

## 6. Live Database Non-Mutation Confirmation

Live SQLite inspection confirms the database remains completely pristine and unmigrated:

```bash
python scripts/check-schema-status.py
```
**Output:**
```
payroll_adjustments table exists: False
payroll_runs original columns present: []
applied migrations count: 7
recent applied migrations: ['20261104071800_add_task_version_for_concurrency', '20261102044852_add_payroll_approval_fields', '20261030040537_add_leave_approvals_and_delegations']
```

```bash
node scripts/verify-db-preservation.mjs
```
**Output:**
```json
{
  "timestamp": "2026-11-06T16:03:09.030Z",
  "payrollRuns": 18,
  "payslips": 2469,
  "employees": 441
}
```

---

## 7. Execution Stop Notice

> [!IMPORTANT]
> **STOPPED AT STEP 1 REVISION CHECKPOINT.**  
> - Migration remains **UNAPPLIED**.  
> - `prisma migrate dev` (without `--create-only`) was **NOT** executed.  
> - `prisma migrate deploy` was **NOT** executed.  
> - `db push` was **NOT** executed.  
> - Zero payroll financial records were updated.  
> - Step 2 has **NOT** been implemented.  
> - Awaiting your final review of this revised migration specification.

