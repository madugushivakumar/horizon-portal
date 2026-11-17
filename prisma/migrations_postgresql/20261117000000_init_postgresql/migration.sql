-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "employee_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "cost_center" TEXT,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role_title" TEXT,
    "level" INTEGER,
    "grade" TEXT,
    "description" TEXT,
    "department_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employees" (
    "id" TEXT NOT NULL,
    "full_name" TEXT,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "work_email" TEXT,
    "phone" TEXT,
    "hire_date" TIMESTAMP(3),
    "salary" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "work_location" TEXT,
    "work_mode" TEXT,
    "employment_type" TEXT,
    "department_id" TEXT,
    "role_id" TEXT,
    "manager_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_runs" (
    "id" TEXT NOT NULL,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "payment_date" TIMESTAMP(3),
    "pay_date" TIMESTAMP(3),
    "employees_paid" INTEGER,
    "total_gross" DOUBLE PRECISION,
    "total_net" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'Completed',
    "approval_status" TEXT DEFAULT 'Pending',
    "preparer_id" TEXT,
    "approved_by_id" TEXT,
    "approved_at" TIMESTAMP(3),
    "approval_notes" TEXT,
    "original_employees_paid" INTEGER,
    "original_total_gross" DOUBLE PRECISION,
    "original_total_deductions" DOUBLE PRECISION,
    "original_total_net" DOUBLE PRECISION,
    "reconciled_at" TIMESTAMP(3),
    "reconciled_by_id" TEXT,
    "reconciliation_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payroll_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_adjustments" (
    "id" TEXT NOT NULL,
    "payroll_run_id" TEXT NOT NULL,
    "adjustment_type" TEXT NOT NULL DEFAULT 'HISTORICAL_REPORTING_ADJUSTMENT',
    "status" TEXT NOT NULL DEFAULT 'PROPOSED',
    "revision" INTEGER NOT NULL DEFAULT 1,
    "idempotency_key" TEXT NOT NULL,
    "original_employees_paid" INTEGER NOT NULL,
    "original_gross_paise" BIGINT NOT NULL,
    "original_deductions_paise" BIGINT NOT NULL,
    "original_net_paise" BIGINT NOT NULL,
    "original_total_gross" DOUBLE PRECISION NOT NULL,
    "original_total_deductions" DOUBLE PRECISION NOT NULL,
    "original_total_net" DOUBLE PRECISION NOT NULL,
    "adjusted_employees_paid" INTEGER NOT NULL,
    "adjusted_gross_paise" BIGINT NOT NULL,
    "adjusted_deductions_paise" BIGINT NOT NULL,
    "adjusted_net_paise" BIGINT NOT NULL,
    "adjusted_total_gross" DOUBLE PRECISION NOT NULL,
    "adjusted_total_deductions" DOUBLE PRECISION NOT NULL,
    "adjusted_total_net" DOUBLE PRECISION NOT NULL,
    "variance_gross_paise" BIGINT NOT NULL,
    "variance_deductions_paise" BIGINT NOT NULL,
    "variance_net_paise" BIGINT NOT NULL,
    "variance_employees" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "reconciliation_source" TEXT NOT NULL DEFAULT 'ITEMIZED_PAYSLIPS',
    "source_dataset_reference" TEXT,
    "reconciled_by_id" TEXT NOT NULL,
    "reconciled_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approved_by_id" TEXT,
    "approved_at" TIMESTAMP(3),
    "effective_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "audit_log_id" TEXT,
    "audit_event_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payroll_adjustments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payslips" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "payroll_run_id" TEXT,
    "period_start" TIMESTAMP(3),
    "period_end" TIMESTAMP(3),
    "calendar_days" INTEGER,
    "lop_days" DOUBLE PRECISION,
    "payable_days" DOUBLE PRECISION,
    "basic" DOUBLE PRECISION,
    "hra" DOUBLE PRECISION,
    "conveyance" DOUBLE PRECISION,
    "medical" DOUBLE PRECISION,
    "special_allowance" DOUBLE PRECISION,
    "overtime_pay" DOUBLE PRECISION,
    "variable_pay" DOUBLE PRECISION,
    "gross_pay" DOUBLE PRECISION NOT NULL,
    "pf_employee" DOUBLE PRECISION,
    "esi_employee" DOUBLE PRECISION,
    "professional_tax" DOUBLE PRECISION,
    "tds" DOUBLE PRECISION,
    "other_deductions" DOUBLE PRECISION,
    "total_deductions" DOUBLE PRECISION,
    "net_pay" DOUBLE PRECISION NOT NULL,
    "deductions" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "pay_period" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payslips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leave_types" (
    "id" TEXT NOT NULL,
    "leave_type_code" TEXT,
    "name" TEXT NOT NULL,
    "leave_type_name" TEXT,
    "pay_type" TEXT,
    "annual_quota_days" INTEGER,
    "prorated_for_joiners" TEXT,
    "carry_forward_allowed" TEXT,
    "max_carry_forward_days" INTEGER,
    "policy_note" TEXT,
    "description" TEXT,
    "default_days" INTEGER NOT NULL DEFAULT 15,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leave_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leave_balances" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "as_of_date" TIMESTAMP(3) NOT NULL,
    "financial_year" TEXT NOT NULL,
    "cl_entitlement" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cl_used" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cl_balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sl_entitlement" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sl_used" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sl_balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "el_used_fy" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "el_balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pending_days" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "balance" DOUBLE PRECISION,
    "used" DOUBLE PRECISION DEFAULT 0,
    "year" INTEGER DEFAULT 2026,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leave_balances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leave_requests" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "leave_type_code" TEXT,
    "leave_type_id" TEXT,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "days" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "reason" TEXT,
    "applied_on" TIMESTAMP(3),
    "approver_id" TEXT,
    "decided_on" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "delegated_approver_id" TEXT,
    "is_escalated" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leave_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "holidays" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "holiday_date" TEXT,
    "holiday_name" TEXT,
    "holiday_type" TEXT,
    "weekday" TEXT,
    "falls_on_weekend" TEXT,
    "calendar_note" TEXT,
    "is_recurring" BOOLEAN NOT NULL DEFAULT false,
    "location" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "holidays_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance_monthly" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "period_end_date" TIMESTAMP(3) NOT NULL,
    "scheduled_days" DOUBLE PRECISION NOT NULL,
    "present_days" DOUBLE PRECISION NOT NULL,
    "wfh_days" DOUBLE PRECISION NOT NULL,
    "paid_leave_days" DOUBLE PRECISION NOT NULL,
    "unpaid_absence_days" DOUBLE PRECISION NOT NULL,
    "late_arrivals" INTEGER NOT NULL,
    "avg_hours_worked" DOUBLE PRECISION NOT NULL,
    "overtime_hours" DOUBLE PRECISION NOT NULL,
    "attendance_rate" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendance_monthly_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teams" (
    "id" TEXT NOT NULL,
    "team_name" TEXT NOT NULL,
    "department_id" TEXT NOT NULL,
    "team_lead_employee_id" TEXT,
    "active_members" INTEGER NOT NULL,
    "planning_cadence" TEXT NOT NULL,
    "board_tool" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sprints" (
    "id" TEXT NOT NULL,
    "sprint_name" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "working_days" INTEGER NOT NULL,
    "financial_year" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sprints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,
    "sprint_id" TEXT NOT NULL,
    "assignee_employee_id" TEXT NOT NULL,
    "task_type" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "story_points" INTEGER NOT NULL,
    "created_date" TIMESTAMP(3) NOT NULL,
    "started_date" TIMESTAMP(3),
    "due_date" TIMESTAMP(3) NOT NULL,
    "completed_date" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "reopened_count" INTEGER NOT NULL DEFAULT 0,
    "cycle_time_days" DOUBLE PRECISION,
    "is_overdue_at_cutoff" TEXT NOT NULL,
    "completed_on_time" TEXT,
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" TEXT NOT NULL,
    "client_name" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "payment_terms_days" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendors" (
    "id" TEXT NOT NULL,
    "vendor_name" TEXT NOT NULL,
    "primary_expense_account" INTEGER NOT NULL,
    "payment_terms_days" INTEGER NOT NULL,
    "city" TEXT NOT NULL,
    "gst_registration" TEXT NOT NULL,
    "is_active" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "invoice_number" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "invoice_date" TIMESTAMP(3) NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "service_line_account" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "gst_rate_percent" DOUBLE PRECISION NOT NULL,
    "gst_amount" DOUBLE PRECISION NOT NULL,
    "total_amount" DOUBLE PRECISION NOT NULL,
    "amount_paid" DOUBLE PRECISION NOT NULL,
    "balance_due" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL,
    "last_payment_date" TIMESTAMP(3),
    "po_number" TEXT,
    "carried_in_from_prior_period" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "created_at_source" TIMESTAMP(3) NOT NULL,
    "ledger_entry_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expenses" (
    "id" TEXT NOT NULL,
    "expense_date" TIMESTAMP(3) NOT NULL,
    "category_account" INTEGER NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "bill_reference" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "department_id" TEXT NOT NULL,
    "amount_excl_gst" DOUBLE PRECISION NOT NULL,
    "gst_rate_percent" DOUBLE PRECISION NOT NULL,
    "gst_amount" DOUBLE PRECISION NOT NULL,
    "total_amount" DOUBLE PRECISION NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "paid_date" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "payment_mode" TEXT,
    "submitted_by" TEXT NOT NULL,
    "approved_by" TEXT NOT NULL,
    "ledger_entry_id" TEXT NOT NULL,
    "payment_ledger_entry_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcements" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "posted_on" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_faqs" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "policy_source" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_faqs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chatbot_responses" (
    "id" TEXT NOT NULL,
    "intent" TEXT NOT NULL,
    "response_template" TEXT NOT NULL,
    "requires_login" TEXT NOT NULL,
    "allowed_roles" TEXT NOT NULL,
    "backend_or_service_call" TEXT,
    "on_failure" TEXT,
    "policy_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chatbot_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_anomaly_results" (
    "id" TEXT NOT NULL,
    "source_dataset" TEXT NOT NULL,
    "record_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "period" TIMESTAMP(3) NOT NULL,
    "anomaly_score" DOUBLE PRECISION NOT NULL,
    "flagged" TEXT NOT NULL,
    "reason_code" TEXT NOT NULL,
    "reason_text" TEXT NOT NULL,
    "money_at_risk" DOUBLE PRECISION,
    "model_version" TEXT NOT NULL,
    "scored_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_anomaly_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_attrition_risk" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "department_id" TEXT NOT NULL,
    "as_of_date" TIMESTAMP(3) NOT NULL,
    "risk_score_12m" DOUBLE PRECISION NOT NULL,
    "risk_band" TEXT NOT NULL,
    "top_reason_1" TEXT NOT NULL,
    "top_reason_2" TEXT NOT NULL,
    "top_reason_3" TEXT NOT NULL,
    "model_version" TEXT NOT NULL,
    "model_note" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_attrition_risk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "event_key" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "event_id" TEXT,
    "actor_id" TEXT NOT NULL,
    "actor_email" TEXT,
    "actor_role" TEXT,
    "action" TEXT NOT NULL,
    "employee_id" TEXT,
    "field_name" TEXT,
    "old_value" TEXT,
    "new_value" TEXT,
    "details" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "manager_delegations" (
    "id" TEXT NOT NULL,
    "manager_id" TEXT NOT NULL,
    "acting_manager_id" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "manager_delegations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "departments_name_key" ON "departments"("name");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE INDEX "roles_department_id_idx" ON "roles"("department_id");

-- CreateIndex
CREATE UNIQUE INDEX "employees_email_key" ON "employees"("email");

-- CreateIndex
CREATE INDEX "employees_department_id_idx" ON "employees"("department_id");

-- CreateIndex
CREATE INDEX "employees_role_id_idx" ON "employees"("role_id");

-- CreateIndex
CREATE INDEX "employees_manager_id_idx" ON "employees"("manager_id");

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

-- CreateIndex
CREATE INDEX "payslips_employee_id_idx" ON "payslips"("employee_id");

-- CreateIndex
CREATE INDEX "payslips_payroll_run_id_idx" ON "payslips"("payroll_run_id");

-- CreateIndex
CREATE UNIQUE INDEX "leave_types_leave_type_code_key" ON "leave_types"("leave_type_code");

-- CreateIndex
CREATE UNIQUE INDEX "leave_types_name_key" ON "leave_types"("name");

-- CreateIndex
CREATE UNIQUE INDEX "leave_balances_employee_id_key" ON "leave_balances"("employee_id");

-- CreateIndex
CREATE INDEX "leave_requests_employee_id_idx" ON "leave_requests"("employee_id");

-- CreateIndex
CREATE INDEX "leave_requests_approver_id_idx" ON "leave_requests"("approver_id");

-- CreateIndex
CREATE INDEX "leave_requests_status_idx" ON "leave_requests"("status");

-- CreateIndex
CREATE UNIQUE INDEX "holidays_holiday_date_key" ON "holidays"("holiday_date");

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
CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");

-- CreateIndex
CREATE INDEX "notifications_user_id_is_read_idx" ON "notifications"("user_id", "is_read");

-- CreateIndex
CREATE INDEX "notifications_user_id_created_at_idx" ON "notifications"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "notifications_event_key_idx" ON "notifications"("event_key");

-- CreateIndex
CREATE INDEX "audit_logs_employee_id_idx" ON "audit_logs"("employee_id");

-- CreateIndex
CREATE INDEX "audit_logs_actor_id_idx" ON "audit_logs"("actor_id");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "audit_logs_event_id_idx" ON "audit_logs"("event_id");

-- CreateIndex
CREATE INDEX "manager_delegations_manager_id_idx" ON "manager_delegations"("manager_id");

-- CreateIndex
CREATE INDEX "manager_delegations_acting_manager_id_idx" ON "manager_delegations"("acting_manager_id");

-- CreateIndex
CREATE INDEX "manager_delegations_status_idx" ON "manager_delegations"("status");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_adjustments" ADD CONSTRAINT "payroll_adjustments_payroll_run_id_fkey" FOREIGN KEY ("payroll_run_id") REFERENCES "payroll_runs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payslips" ADD CONSTRAINT "payslips_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payslips" ADD CONSTRAINT "payslips_payroll_run_id_fkey" FOREIGN KEY ("payroll_run_id") REFERENCES "payroll_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_balances" ADD CONSTRAINT "leave_balances_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_leave_type_id_fkey" FOREIGN KEY ("leave_type_id") REFERENCES "leave_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_monthly" ADD CONSTRAINT "attendance_monthly_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_team_lead_employee_id_fkey" FOREIGN KEY ("team_lead_employee_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_sprint_id_fkey" FOREIGN KEY ("sprint_id") REFERENCES "sprints"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_submitted_by_fkey" FOREIGN KEY ("submitted_by") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_attrition_risk" ADD CONSTRAINT "ai_attrition_risk_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_attrition_risk" ADD CONSTRAINT "ai_attrition_risk_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manager_delegations" ADD CONSTRAINT "manager_delegations_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manager_delegations" ADD CONSTRAINT "manager_delegations_acting_manager_id_fkey" FOREIGN KEY ("acting_manager_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
