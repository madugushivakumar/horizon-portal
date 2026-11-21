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
