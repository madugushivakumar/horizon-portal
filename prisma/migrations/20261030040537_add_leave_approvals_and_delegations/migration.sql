-- CreateTable
CREATE TABLE "manager_delegations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "manager_id" TEXT NOT NULL,
    "acting_manager_id" TEXT NOT NULL,
    "start_date" DATETIME NOT NULL,
    "end_date" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "reason" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "manager_delegations_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "employees" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "manager_delegations_acting_manager_id_fkey" FOREIGN KEY ("acting_manager_id") REFERENCES "employees" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
    "rejection_reason" TEXT,
    "delegated_approver_id" TEXT,
    "is_escalated" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "leave_requests_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "leave_requests_leave_type_id_fkey" FOREIGN KEY ("leave_type_id") REFERENCES "leave_types" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_leave_requests" ("applied_on", "approver_id", "created_at", "days", "decided_on", "employee_id", "end_date", "id", "leave_type_code", "leave_type_id", "reason", "start_date", "status", "updated_at") SELECT "applied_on", "approver_id", "created_at", "days", "decided_on", "employee_id", "end_date", "id", "leave_type_code", "leave_type_id", "reason", "start_date", "status", "updated_at" FROM "leave_requests";
DROP TABLE "leave_requests";
ALTER TABLE "new_leave_requests" RENAME TO "leave_requests";
CREATE INDEX "leave_requests_employee_id_idx" ON "leave_requests"("employee_id");
CREATE INDEX "leave_requests_approver_id_idx" ON "leave_requests"("approver_id");
CREATE INDEX "leave_requests_status_idx" ON "leave_requests"("status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "manager_delegations_manager_id_idx" ON "manager_delegations"("manager_id");

-- CreateIndex
CREATE INDEX "manager_delegations_acting_manager_id_idx" ON "manager_delegations"("acting_manager_id");

-- CreateIndex
CREATE INDEX "manager_delegations_status_idx" ON "manager_delegations"("status");
