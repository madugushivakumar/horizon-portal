# Day 11 — Step 1: Prisma Schema & Migration Preparation Review Report
## Source-Backed Payroll Correction Ledger & Historical Adjustment Architecture
### Aura Workforce by Growmar — Horizon Portal

**Document Version:** 1.0.0  
**Date:** 2026-11-06  
**Implementation Phase:** Day 11 — Step 1: Schema & Migration Preparation  
**Status:** Complete — Staged for Review  
**Execution Mode:** `--create-only` (Zero Database Mutations Executed)  
**Lead Architect & Auditor:** Senior Full-Stack Engineer, Enterprise Software Architect, Database Engineer, Financial Systems Auditor  

---

## 1. Executive Summary & Review Scope

In accordance with explicit authorization for **Day 11 Step 1 — Prisma Schema and Migration Preparation**, the schema enhancement has been designed, validated, and converted into an isolated, non-destructive migration file using Prisma's create-only workflow.

### Verification Highlights
- **Database Status:** `prisma/dev.db` has **NOT** been modified. Zero tables or columns have been added to the live database, and zero rows have been mutated.
- **Record Integrity:** All **18 payroll runs**, **2,469 payslips**, and **441 employees** remain 100% intact.
- **Migration File:** Generated safely at `prisma/migrations/20261106154652_add_payroll_correction_ledger/migration.sql`.
- **Destructive Operation Audit:** Passed. Contains **zero** `DROP TABLE`, `DROP COLUMN`, `DELETE`, or table-recreation clauses. 100% additive DDL.
- **Exact Financial Representation:** All currency calculations are represented in integer paise using 64-bit `BigInt`, eliminating IEEE-754 floating-point precision drift.
- **Toolchain Verification:** Schema passed `npx prisma validate`, generated Prisma client v6.19.3, and verified with `npx tsc --noEmit` (exit code 0).
- **Consistent Backup:** Byte-level consistent snapshot generated at `prisma/backups/dev-backup-day11-step1-pre-migration.db` passing `PRAGMA integrity_check`.

---

## 2. Schema Changes & Model Definitions

### 2.1 Enhancements to `PayrollRun` (`prisma/schema.prisma`)

To support pre-approval reconciliation for in-flight batches (`PR-2026-09`) without losing historical context, 7 optional (nullable) snapshot columns and a relation to adjustments were added to `PayrollRun`:

```prisma
model PayrollRun {
  id            String    @id
  periodStart   DateTime  @map("period_start")
  periodEnd     DateTime  @map("period_end")
  paymentDate   DateTime? @map("payment_date")
  payDate       DateTime? @map("pay_date")
  employeesPaid Int?      @map("employees_paid")
  totalGross    Float?    @map("total_gross")
  totalNet      Float?    @map("total_net")
  status        String    @default("Completed")
  approvalStatus String?  @default("Pending") @map("approval_status")
  preparerId     String?  @map("preparer_id")
  approvedById   String?  @map("approved_by_id")
  approvedAt     DateTime? @map("approved_at")
  approvalNotes  String?  @map("approval_notes")

  // --- NEW: Original Snapshot Fields for In-Flight Pre-Approval Reconciliation ---
  originalEmployeesPaid   Int?      @map("original_employees_paid")
  originalTotalGross      Float?    @map("original_total_gross")
  originalTotalDeductions Float?    @map("original_total_deductions")
  originalTotalNet        Float?    @map("original_total_net")
  reconciledAt            DateTime? @map("reconciled_at")
  reconciledById          String?   @map("reconciled_by_id")
  reconciliationNotes     String?   @map("reconciliation_notes")

  // Existing relation
  payslips      Payslip[]

  // NEW: Relation to Historical Reporting Adjustments
  adjustments   PayrollAdjustment[]

  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")

  @@map("payroll_runs")
}
```

#### Rationale for Nullable Snapshot Fields
1. **Existing History Preservation:** All 18 existing payroll runs retain their existing structure without requiring backfill defaults.
2. **Pre-Approval Invariant:** Before `PR-2026-09` header numbers are corrected, the pre-correction values ($444$ employees, $₹54,788,660.03$ gross, $₹48,089,678.30$ net) are written into `originalEmployeesPaid`, `originalTotalGross`, and `originalTotalNet`.

---

### 2.2 New Model: `PayrollAdjustment` (`prisma/schema.prisma`)

To support formal prior-period adjustments on disbursed payroll runs (`PR-2026-08`) without altering the original payment record, a dedicated audit-ledger model `PayrollAdjustment` was introduced:

```prisma
model PayrollAdjustment {
  id                      String      @id @default(cuid())
  payrollRunId            String      @map("payroll_run_id")
  payrollRun              PayrollRun  @relation(fields: [payrollRunId], references: [id], onDelete: Cascade)

  // Status and Classification
  adjustmentType          String      @default("HISTORICAL_REPORTING_ADJUSTMENT") @map("adjustment_type") // PRE_APPROVAL_CORRECTION | HISTORICAL_REPORTING_ADJUSTMENT
  status                  String      @default("PROPOSED") @map("status") // PROPOSED | APPROVED | REJECTED
  revision                Int         @default(1) @map("revision")

  // Idempotency & Unique Submission Control
  idempotencyKey          String      @unique @map("idempotency_key")

  // Original Disbursement Snapshot (Immutable Historical Reference)
  originalEmployeesPaid   Int         @map("original_employees_paid")
  originalGrossPaise      BigInt      @map("original_gross_paise")
  originalDeductionsPaise BigInt      @map("original_deductions_paise")
  originalNetPaise        BigInt      @map("original_net_paise")
  originalTotalGross      Float       @map("original_total_gross")
  originalTotalDeductions Float       @map("original_total_deductions")
  originalTotalNet        Float       @map("original_total_net")

  // Audited Reporting Figures (Itemized Tie-Out)
  adjustedEmployeesPaid   Int         @map("adjusted_employees_paid")
  adjustedGrossPaise      BigInt      @map("adjusted_gross_paise")
  adjustedDeductionsPaise BigInt      @map("adjusted_deductions_paise")
  adjustedNetPaise        BigInt      @map("adjusted_net_paise")
  adjustedTotalGross      Float       @map("adjusted_total_gross")
  adjustedTotalDeductions Float       @map("adjusted_total_deductions")
  adjustedTotalNet        Float       @map("adjusted_total_net")

  // Exact Variances (Paise & Headcount)
  varianceGrossPaise      BigInt      @map("variance_gross_paise")
  varianceDeductionsPaise BigInt      @map("variance_deductions_paise")
  varianceNetPaise        BigInt      @map("variance_net_paise")
  varianceEmployees       Int         @map("variance_employees")

  // Reconciliation Source & Business Justification
  reason                  String      @map("reason")
  reconciliationSource    String      @default("ITEMIZED_PAYSLIPS") @map("reconciliation_source")
  sourceDatasetReference  String?     @map("source_dataset_reference")

  // Maker-Checker Governance & Attribution
  reconciledById          String      @map("reconciled_by_id")
  reconciledAt            DateTime    @default(now()) @map("reconciled_at")
  approvedById            String?     @map("approved_by_id")
  approvedAt              DateTime?   @map("approved_at")
  effectiveDate           DateTime    @default(now()) @map("effective_date")

  // Audit Linkage
  auditLogId              String?     @map("audit_log_id")
  auditEventId            String?     @map("audit_event_id")

  createdAt               DateTime    @default(now()) @map("created_at")
  updatedAt               DateTime    @updatedAt @map("updated_at")

  @@unique([payrollRunId, revision])
  @@index([payrollRunId])
  @@index([status])
  @@index([auditEventId])
  @@index([reconciledById])
  @@map("payroll_adjustments")
}
```

---

## 3. Financial Exactness & Representation

In accordance with Requirement 6:
> *"Use a suitable exact financial representation. Do not introduce new Float-based calculations for monetary adjustments."*

### Mathematical Design
1. **Paise Integer Arithmetic:**
   - SQLite supports 64-bit signed integers (`INTEGER` up to $9 \times 10^{18}$), mapped in Prisma to TypeScript `BigInt`.
   - In India, ₹1 = 100 paise.
   - For example, August 2026 gross payslip sum of ₹47,847,409.45 is stored as `4784740945n` paise.
   - Variances are calculated strictly as `storedGrossPaise - actualGrossPaise`, guaranteeing $0.000000$ rounding drift.
2. **Dual-Ledger Float Storage for UI & API Compatibility:**
   - To avoid requiring the frontend to parse BigInt strings for simple tabular rendering, the corresponding `Float` values (`originalTotalGross`, `adjustedTotalGross`, etc.) are pre-calculated at write time from the integer paise (`Number(paise) / 100`).
   - All backend validation and integrity assertions operate strictly on integer paise.

---

## 4. Generated Migration SQL (Verbatim Inspection)

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
    CONSTRAINT "payroll_adjustments_payroll_run_id_fkey" FOREIGN KEY ("payroll_run_id") REFERENCES "payroll_runs" ("id") ON DELETE CASCADE ON UPDATE CASCADE
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

## 5. Destructive-Operation Inspection & Line-by-Line Safety Audit

| Clause / Operation | Occurrences in SQL | Risk Level | Status |
| :--- | :---: | :---: | :--- |
| `DROP TABLE` | 0 | High / Critical | **REJECTED / NONE DETECTED** |
| `DROP COLUMN` | 0 | High / Critical | **REJECTED / NONE DETECTED** |
| `DELETE FROM` | 0 | High / Critical | **REJECTED / NONE DETECTED** |
| `TRUNCATE` | 0 | High / Critical | **REJECTED / NONE DETECTED** |
| Table Re-creation (`CREATE TABLE new_...`) | 0 | Medium / High | **REJECTED / NONE DETECTED** |
| `ALTER TABLE ... ADD COLUMN` (Nullable) | 7 | Zero (Pure Additive) | **VERIFIED SAFE** |
| `CREATE TABLE` (New Isolated Table) | 1 | Zero (New Entity) | **VERIFIED SAFE** |
| `CREATE INDEX` | 6 | Zero (Performance / Uniqueness) | **VERIFIED SAFE** |

### Safety Conclusion
The migration script is **100% additive**. Applying this migration in a future step will not alter any existing column, row, index, or constraint in `dev.db`.

---

## 6. Live Database State & Preservation Verification

To verify that the `--create-only` flag successfully isolated the database from schema generation:

```bash
python scripts/check-schema-status.py
```

**Verification Output:**
```
payroll_adjustments table exists: False
payroll_runs original columns present: []
applied migrations count: 7
recent applied migrations: ['20261104071800_add_task_version_for_concurrency', '20261102044852_add_payroll_approval_fields', '20261030040537_add_leave_approvals_and_delegations']
```

```bash
node scripts/verify-db-preservation.mjs
```

**Record Counts:**
```json
{
  "timestamp": "2026-11-06T15:52:50.718Z",
  "payrollRuns": 18,
  "payslips": 2469,
  "employees": 441
}
```

The database remains in its unmigrated state with zero mutation.

---

## 7. Backup and Rollback Strategy

### 7.1 Verified Pre-Migration Backup
An atomic, transactional hot backup was created using SQLite's native backup API:
- **Location:** `prisma/backups/dev-backup-day11-step1-pre-migration.db`
- **Size:** 3,637,248 bytes
- **Integrity Status:** `PRAGMA integrity_check` $\rightarrow$ `ok`

### 7.2 Rollback Plan
If the migration is applied in Step 2 and needs to be reverted:
1. **Database Rollback:**
   ```bash
   # Restore dev.db from verified backup
   Copy-Item "prisma/backups/dev-backup-day11-step1-pre-migration.db" "prisma/dev.db" -Force
   ```
2. **Migration Directory Rollback:**
   ```bash
   # Remove the migration folder from prisma/migrations
   Remove-Item -Recurse -Force "prisma/migrations/20261106154652_add_payroll_correction_ledger"
   ```
3. **Prisma Client Regenerate:**
   ```bash
   # Revert schema.prisma and regenerate client
   npx prisma generate
   ```

---

## 8. Prisma Validation & Toolchain Results

1. **Prisma Schema Validation:**
   ```
   $ npx prisma validate
   Loaded Prisma config from prisma.config.ts.
   Prisma schema loaded from prisma\schema.prisma
   The schema at prisma\schema.prisma is valid 🚀
   ```

2. **Prisma Client Generation:**
   ```
   $ npx prisma generate
   ✔ Generated Prisma Client (v6.19.3) to .\node_modules\@prisma\client in 560ms
   ```

3. **TypeScript Typecheck:**
   ```
   $ npx tsc --noEmit
   (Exit code 0, 0 errors across entire workspace)
   ```

---

## 9. Remaining Risks & Pre-Step 2 Architectural Checklist

Before applying the migration in Step 2, the following technical considerations are documented:

| Consideration | Mitigation Designed |
| :--- | :--- |
| **BigInt JSON Serialization** | In Next.js App Router API routes, native `BigInt` values cannot be directly serialized by `JSON.stringify()`. Custom route serializers will format BigInt paise as string fields or convert to formatted INR floats for response payloads. |
| **Maker-Checker Enforcement** | The API endpoint must strictly verify that `reconciledById !== approvedById` to satisfy SOX/accounting dual-control governance. |
| **Idempotency Protection** | The database `idempotencyKey` unique constraint protects against network re-transmissions. Handlers will catch Prisma unique violation code `P2002` and return the existing record gracefully. |
| **Dual Status Presentation** | `reconciliation-service.ts` will check both `PayrollRun` status and `PayrollAdjustment` presence to present `ADJUSTED_MATCHED` for `PR-2026-08` and `MATCHED` for `PR-2026-09`. |

---

## 10. Execution Checkpoint

> [!IMPORTANT]
> **STOPPED AT STEP 1 CHECKPOINT.**  
> - `prisma migrate dev` (without `--create-only`) was **NOT** executed.  
> - `prisma migrate deploy` was **NOT** executed.  
> - `db push` was **NOT** executed.  
> - Zero payroll financial records were updated.  
> - Awaiting explicit user approval of this review report before proceeding to Step 2 (Migration Application & Backend API Implementation).

