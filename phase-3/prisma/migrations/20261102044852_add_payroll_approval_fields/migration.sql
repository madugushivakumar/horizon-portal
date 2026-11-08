-- AlterTable
ALTER TABLE "payroll_runs" ADD COLUMN "approval_notes" TEXT;
ALTER TABLE "payroll_runs" ADD COLUMN "approval_status" TEXT DEFAULT 'Pending';
ALTER TABLE "payroll_runs" ADD COLUMN "approved_at" DATETIME;
ALTER TABLE "payroll_runs" ADD COLUMN "approved_by_id" TEXT;
ALTER TABLE "payroll_runs" ADD COLUMN "preparer_id" TEXT;
