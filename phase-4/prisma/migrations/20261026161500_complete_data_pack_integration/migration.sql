-- AlterTable
ALTER TABLE "departments" ADD COLUMN "cost_center" TEXT;

-- AlterTable
ALTER TABLE "employees" ADD COLUMN "employment_type" TEXT;
ALTER TABLE "employees" ADD COLUMN "full_name" TEXT;
ALTER TABLE "employees" ADD COLUMN "work_email" TEXT;
ALTER TABLE "employees" ADD COLUMN "work_location" TEXT;
ALTER TABLE "employees" ADD COLUMN "work_mode" TEXT;

-- AlterTable
ALTER TABLE "holidays" ADD COLUMN "calendar_note" TEXT;
ALTER TABLE "holidays" ADD COLUMN "falls_on_weekend" TEXT;
ALTER TABLE "holidays" ADD COLUMN "holiday_date" TEXT;
ALTER TABLE "holidays" ADD COLUMN "holiday_name" TEXT;
ALTER TABLE "holidays" ADD COLUMN "holiday_type" TEXT;
ALTER TABLE "holidays" ADD COLUMN "weekday" TEXT;

-- AlterTable
ALTER TABLE "leave_types" ADD COLUMN "annual_quota_days" INTEGER;
ALTER TABLE "leave_types" ADD COLUMN "carry_forward_allowed" TEXT;
ALTER TABLE "leave_types" ADD COLUMN "leave_type_code" TEXT;
ALTER TABLE "leave_types" ADD COLUMN "leave_type_name" TEXT;
ALTER TABLE "leave_types" ADD COLUMN "max_carry_forward_days" INTEGER;
ALTER TABLE "leave_types" ADD COLUMN "pay_type" TEXT;
ALTER TABLE "leave_types" ADD COLUMN "policy_note" TEXT;
ALTER TABLE "leave_types" ADD COLUMN "prorated_for_joiners" TEXT;

-- CreateTable
CREATE TABLE "attendance_monthly" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employee_id" TEXT NOT NULL,
    "period_end_date" DATETIME NOT NULL,
    "scheduled_days" REAL NOT NULL,
    "present_days" REAL NOT NULL,
    "wfh_days" REAL NOT NULL,
    "paid_leave_days" REAL NOT NULL,
    "unpaid_absence_days" REAL NOT NULL,
    "late_arrivals" INTEGER NOT NULL,
    "avg_hours_worked" REAL NOT NULL,
    "overtime_hours" REAL NOT NULL,
    "attendance_rate" REAL NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "attendance_monthly_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "teams" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "team_name" TEXT NOT NULL,
    "department_id" TEXT NOT NULL,
    "team_lead_employee_id" TEXT,
    "active_members" INTEGER NOT NULL,
    "planning_cadence" TEXT NOT NULL,
    "board_tool" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "teams_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "teams_team_lead_employee_id_fkey" FOREIGN KEY ("team_lead_employee_id") REFERENCES "employees" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sprints" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sprint_name" TEXT NOT NULL,
    "start_date" DATETIME NOT NULL,
    "end_date" DATETIME NOT NULL,
    "working_days" INTEGER NOT NULL,
    "financial_year" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "team_id" TEXT NOT NULL,
    "sprint_id" TEXT NOT NULL,
    "assignee_employee_id" TEXT NOT NULL,
    "task_type" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "story_points" INTEGER NOT NULL,
    "created_date" DATETIME NOT NULL,
    "started_date" DATETIME,
    "due_date" DATETIME NOT NULL,
    "completed_date" DATETIME,
    "status" TEXT NOT NULL,
    "reopened_count" INTEGER NOT NULL DEFAULT 0,
    "cycle_time_days" REAL,
    "is_overdue_at_cutoff" TEXT NOT NULL,
    "completed_on_time" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "tasks_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "tasks_sprint_id_fkey" FOREIGN KEY ("sprint_id") REFERENCES "sprints" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "clients" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "client_name" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "payment_terms_days" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "vendors" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vendor_name" TEXT NOT NULL,
    "primary_expense_account" INTEGER NOT NULL,
    "payment_terms_days" INTEGER NOT NULL,
    "city" TEXT NOT NULL,
    "gst_registration" TEXT NOT NULL,
    "is_active" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoice_number" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "invoice_date" DATETIME NOT NULL,
    "due_date" DATETIME NOT NULL,
    "service_line_account" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "subtotal" REAL NOT NULL,
    "gst_rate_percent" REAL NOT NULL,
    "gst_amount" REAL NOT NULL,
    "total_amount" REAL NOT NULL,
    "amount_paid" REAL NOT NULL,
    "balance_due" REAL NOT NULL,
    "status" TEXT NOT NULL,
    "last_payment_date" DATETIME,
    "po_number" TEXT,
    "carried_in_from_prior_period" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "created_at_source" DATETIME NOT NULL,
    "ledger_entry_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "invoices_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "expenses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "expense_date" DATETIME NOT NULL,
    "category_account" INTEGER NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "bill_reference" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "department_id" TEXT NOT NULL,
    "amount_excl_gst" REAL NOT NULL,
    "gst_rate_percent" REAL NOT NULL,
    "gst_amount" REAL NOT NULL,
    "total_amount" REAL NOT NULL,
    "due_date" DATETIME NOT NULL,
    "paid_date" DATETIME,
    "status" TEXT NOT NULL,
    "payment_mode" TEXT,
    "submitted_by" TEXT NOT NULL,
    "approved_by" TEXT NOT NULL,
    "ledger_entry_id" TEXT NOT NULL,
    "payment_ledger_entry_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "expenses_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "expenses_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "expenses_submitted_by_fkey" FOREIGN KEY ("submitted_by") REFERENCES "employees" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "expenses_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "employees" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "announcements" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "posted_on" DATETIME NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "hr_faqs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "policy_source" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "chatbot_responses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "intent" TEXT NOT NULL,
    "response_template" TEXT NOT NULL,
    "requires_login" TEXT NOT NULL,
    "allowed_roles" TEXT NOT NULL,
    "backend_or_service_call" TEXT,
    "on_failure" TEXT,
    "policy_note" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ai_anomaly_results" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "source_dataset" TEXT NOT NULL,
    "record_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "period" DATETIME NOT NULL,
    "anomaly_score" REAL NOT NULL,
    "flagged" TEXT NOT NULL,
    "reason_code" TEXT NOT NULL,
    "reason_text" TEXT NOT NULL,
    "money_at_risk" REAL,
    "model_version" TEXT NOT NULL,
    "scored_at" DATETIME NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ai_attrition_risk" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employee_id" TEXT NOT NULL,
    "department_id" TEXT NOT NULL,
    "as_of_date" DATETIME NOT NULL,
    "risk_score_12m" REAL NOT NULL,
    "risk_band" TEXT NOT NULL,
    "top_reason_1" TEXT NOT NULL,
    "top_reason_2" TEXT NOT NULL,
    "top_reason_3" TEXT NOT NULL,
    "model_version" TEXT NOT NULL,
    "model_note" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "ai_attrition_risk_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ai_attrition_risk_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_leave_balances" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employee_id" TEXT NOT NULL,
    "as_of_date" DATETIME NOT NULL,
    "financial_year" TEXT NOT NULL,
    "cl_entitlement" REAL NOT NULL DEFAULT 0,
    "cl_used" REAL NOT NULL DEFAULT 0,
    "cl_balance" REAL NOT NULL DEFAULT 0,
    "sl_entitlement" REAL NOT NULL DEFAULT 0,
    "sl_used" REAL NOT NULL DEFAULT 0,
    "sl_balance" REAL NOT NULL DEFAULT 0,
    "el_used_fy" REAL NOT NULL DEFAULT 0,
    "el_balance" REAL NOT NULL DEFAULT 0,
    "pending_days" REAL NOT NULL DEFAULT 0,
    "balance" REAL,
    "used" REAL DEFAULT 0,
    "year" INTEGER DEFAULT 2026,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "leave_balances_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_leave_balances" ("balance", "created_at", "employee_id", "id", "updated_at", "used", "year") SELECT "balance", "created_at", "employee_id", "id", "updated_at", "used", "year" FROM "leave_balances";
DROP TABLE "leave_balances";
ALTER TABLE "new_leave_balances" RENAME TO "leave_balances";
CREATE UNIQUE INDEX "leave_balances_employee_id_key" ON "leave_balances"("employee_id");
CREATE TABLE "new_leave_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employee_id" TEXT NOT NULL,
    "leave_type_code" TEXT,
    "leave_type_id" TEXT,
    "start_date" DATETIME NOT NULL,
    "end_date" DATETIME NOT NULL,
    "days" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "reason" TEXT,
    "applied_on" DATETIME,
    "approver_id" TEXT,
    "decided_on" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "leave_requests_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "leave_requests_leave_type_id_fkey" FOREIGN KEY ("leave_type_id") REFERENCES "leave_types" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_leave_requests" ("created_at", "days", "employee_id", "end_date", "id", "leave_type_id", "reason", "start_date", "status", "updated_at") SELECT "created_at", "days", "employee_id", "end_date", "id", "leave_type_id", "reason", "start_date", "status", "updated_at" FROM "leave_requests";
DROP TABLE "leave_requests";
ALTER TABLE "new_leave_requests" RENAME TO "leave_requests";
CREATE INDEX "leave_requests_employee_id_idx" ON "leave_requests"("employee_id");
CREATE INDEX "leave_requests_approver_id_idx" ON "leave_requests"("approver_id");
CREATE TABLE "new_payroll_runs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "period_start" DATETIME NOT NULL,
    "period_end" DATETIME NOT NULL,
    "payment_date" DATETIME,
    "pay_date" DATETIME,
    "employees_paid" INTEGER,
    "total_gross" REAL,
    "total_net" REAL,
    "status" TEXT NOT NULL DEFAULT 'Completed',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);
INSERT INTO "new_payroll_runs" ("created_at", "id", "payment_date", "period_end", "period_start", "status", "updated_at") SELECT "created_at", "id", "payment_date", "period_end", "period_start", "status", "updated_at" FROM "payroll_runs";
DROP TABLE "payroll_runs";
ALTER TABLE "new_payroll_runs" RENAME TO "payroll_runs";
CREATE TABLE "new_payslips" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employee_id" TEXT NOT NULL,
    "payroll_run_id" TEXT,
    "period_start" DATETIME,
    "period_end" DATETIME,
    "calendar_days" INTEGER,
    "lop_days" REAL,
    "payable_days" REAL,
    "basic" REAL,
    "hra" REAL,
    "conveyance" REAL,
    "medical" REAL,
    "special_allowance" REAL,
    "overtime_pay" REAL,
    "variable_pay" REAL,
    "gross_pay" REAL NOT NULL,
    "pf_employee" REAL,
    "esi_employee" REAL,
    "professional_tax" REAL,
    "tds" REAL,
    "other_deductions" REAL,
    "total_deductions" REAL,
    "net_pay" REAL NOT NULL,
    "deductions" REAL NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "pay_period" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "payslips_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "payslips_payroll_run_id_fkey" FOREIGN KEY ("payroll_run_id") REFERENCES "payroll_runs" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_payslips" ("created_at", "currency", "deductions", "employee_id", "gross_pay", "id", "net_pay", "pay_period", "payroll_run_id", "updated_at") SELECT "created_at", "currency", "deductions", "employee_id", "gross_pay", "id", "net_pay", "pay_period", "payroll_run_id", "updated_at" FROM "payslips";
DROP TABLE "payslips";
ALTER TABLE "new_payslips" RENAME TO "payslips";
CREATE INDEX "payslips_employee_id_idx" ON "payslips"("employee_id");
CREATE INDEX "payslips_payroll_run_id_idx" ON "payslips"("payroll_run_id");
CREATE TABLE "new_roles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "role_title" TEXT,
    "level" INTEGER,
    "grade" TEXT,
    "description" TEXT,
    "department_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "roles_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_roles" ("created_at", "description", "id", "name", "updated_at") SELECT "created_at", "description", "id", "name", "updated_at" FROM "roles";
DROP TABLE "roles";
ALTER TABLE "new_roles" RENAME TO "roles";
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");
CREATE INDEX "roles_department_id_idx" ON "roles"("department_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "attendance_monthly_employee_id_idx" ON "attendance_monthly"("employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_monthly_employee_id_period_end_date_key" ON "attendance_monthly"("employee_id", "period_end_date");

-- CreateIndex
CREATE INDEX "teams_department_id_idx" ON "teams"("department_id");

-- CreateIndex
CREATE INDEX "teams_team_lead_employee_id_idx" ON "teams"("team_lead_employee_id");

-- CreateIndex
CREATE INDEX "tasks_team_id_idx" ON "tasks"("team_id");

-- CreateIndex
CREATE INDEX "tasks_sprint_id_idx" ON "tasks"("sprint_id");

-- CreateIndex
CREATE INDEX "tasks_assignee_employee_id_idx" ON "tasks"("assignee_employee_id");

-- CreateIndex
CREATE INDEX "invoices_client_id_idx" ON "invoices"("client_id");

-- CreateIndex
CREATE INDEX "expenses_vendor_id_idx" ON "expenses"("vendor_id");

-- CreateIndex
CREATE INDEX "expenses_department_id_idx" ON "expenses"("department_id");

-- CreateIndex
CREATE INDEX "expenses_submitted_by_idx" ON "expenses"("submitted_by");

-- CreateIndex
CREATE INDEX "expenses_approved_by_idx" ON "expenses"("approved_by");

-- CreateIndex
CREATE UNIQUE INDEX "chatbot_responses_intent_key" ON "chatbot_responses"("intent");

-- CreateIndex
CREATE INDEX "ai_anomaly_results_employee_id_idx" ON "ai_anomaly_results"("employee_id");

-- CreateIndex
CREATE INDEX "ai_anomaly_results_source_dataset_idx" ON "ai_anomaly_results"("source_dataset");

-- CreateIndex
CREATE INDEX "ai_attrition_risk_employee_id_idx" ON "ai_attrition_risk"("employee_id");

-- CreateIndex
CREATE INDEX "ai_attrition_risk_department_id_idx" ON "ai_attrition_risk"("department_id");

-- CreateIndex
CREATE INDEX "employees_department_id_idx" ON "employees"("department_id");

-- CreateIndex
CREATE INDEX "employees_role_id_idx" ON "employees"("role_id");

-- CreateIndex
CREATE INDEX "employees_manager_id_idx" ON "employees"("manager_id");

-- CreateIndex
CREATE UNIQUE INDEX "holidays_holiday_date_key" ON "holidays"("holiday_date");

-- CreateIndex
CREATE UNIQUE INDEX "leave_types_leave_type_code_key" ON "leave_types"("leave_type_code");
