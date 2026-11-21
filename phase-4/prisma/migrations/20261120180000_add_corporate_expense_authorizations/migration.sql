-- CreateTable
CREATE TABLE "corporate_expense_authorizations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reference_number" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" INTEGER NOT NULL,
    "requested_amount" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "department_id" TEXT NOT NULL,
    "requested_by_id" TEXT NOT NULL,
    "approver_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING_APPROVAL',
    "required_by_date" DATETIME,
    "vendor_name" TEXT,
    "rejection_reason" TEXT,
    "approval_notes" TEXT,
    "submitted_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decided_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "corporate_expense_authorizations_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "corporate_expense_authorizations_requested_by_id_fkey" FOREIGN KEY ("requested_by_id") REFERENCES "employees" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "corporate_expense_authorizations_approver_id_fkey" FOREIGN KEY ("approver_id") REFERENCES "employees" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "corporate_expense_authorizations_reference_number_key" ON "corporate_expense_authorizations"("reference_number");

-- CreateIndex
CREATE INDEX "corporate_expense_authorizations_requested_by_id_idx" ON "corporate_expense_authorizations"("requested_by_id");

-- CreateIndex
CREATE INDEX "corporate_expense_authorizations_approver_id_idx" ON "corporate_expense_authorizations"("approver_id");

-- CreateIndex
CREATE INDEX "corporate_expense_authorizations_department_id_idx" ON "corporate_expense_authorizations"("department_id");

-- CreateIndex
CREATE INDEX "corporate_expense_authorizations_status_idx" ON "corporate_expense_authorizations"("status");

-- CreateIndex
CREATE INDEX "corporate_expense_authorizations_created_at_idx" ON "corporate_expense_authorizations"("created_at");
