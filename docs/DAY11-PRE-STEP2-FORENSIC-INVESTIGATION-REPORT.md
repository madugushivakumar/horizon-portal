# Day 11 — Pre-Step 2 Forensic Investigation Report
## August Payroll Approval Status & Referential Integrity Governance Audit
### Aura Workforce by Growmar — Horizon Portal

**Document Version:** 1.0.0  
**Date:** 2026-11-06  
**Investigation Type:** Read-Only Forensic Architecture & Security Audit  
**Status:** Complete — Ready for Review  
**Lead Auditor / Architect:** Senior Backend Engineer, Prisma/SQLite Database Architect, Payroll Systems Auditor, Application Security Engineer  

---

## 1. Executive Summary

A forensic, read-only investigation was conducted across the codebase, schema, migration history, API service layers, and SQLite database catalog to address two architectural questions prior to beginning Step 2 backend API implementation:

### 1.1 August Payroll Approval Status Finding
- **Database Reality:** In `prisma/dev.db`, `PR-2026-08` contains `status = "PAID"`, `pay_date = 2026-09-01`, but `approval_status = "Pending"`, `approved_by_id = NULL`, and `approved_at = NULL`.
- **Broader Scope:** This is **not unique to August**. All 18 payroll runs in SQLite (`PR-2025-04` through `PR-2026-09`) have `approval_status = "Pending"`.
- **Root Cause:** Approval tracking columns were introduced on 2026-11-02 via migration `20261102044852_add_payroll_approval_fields` with a column default `DEFAULT 'Pending'`. The migration did not backfill historical paid runs.
- **Application Layer Synthesis:** The application layer (`src/app/api/v1/payroll/runs/route.ts`, `src/app/api/v1/payroll/runs/[runId]/route.ts`, and `src/lib/payroll/reconciliation-service.ts`) explicitly synthesizes approval status:
  ```ts
  approvalStatus: run.status.toUpperCase().includes("PAID") ? "Approved" : (run.approvalStatus || "Pending")
  ```
  Earlier project reports describing `PR-2026-08` as `Approved` were reporting the **API/UI presentation layer output**, where payment completion logically subsumes approval. The raw SQLite record remains at the migration default `'Pending'`.

### 1.2 Referential Integrity Finding
- **Database Constraints:** In the `payroll_adjustments` table, only `payroll_run_id` has a database-level foreign key constraint (`REFERENCES payroll_runs(id) ON DELETE RESTRICT ON UPDATE CASCADE`).
- **Application-Managed References:** `reconciled_by_id`, `approved_by_id`, `audit_log_id`, and `audit_event_id` are stored as indexed `TEXT` columns without SQLite foreign-key constraints.
- **Architectural Design Alignment:** This design is 100% consistent with the system architecture:
  1. `payroll_runs` similarly stores `preparer_id` and `approved_by_id` as plain `TEXT` without foreign keys to `users`.
  2. `audit_logs` stores `actor_id` as plain `TEXT` without foreign keys to `users`.
  3. The portal uses **soft deactivation** (`User.isActive = false`), never hard deletes (`DELETE FROM users`).
  4. Decoupling ensures that audit and financial adjustment records can never be cascade-deleted or corrupted by user account de-provisioning.
- **Requirement for Step 2:** Because database FKs do not exist for actors, the Step 2 API route handlers **must enforce server-side user existence, active status, role authorization, and maker-checker validation** within atomic `prisma.$transaction` boundaries.

### 1.3 Readiness Decision
**`READY WITH DOCUMENTED LIMITATIONS`**  
Step 2A can safely proceed provided that the backend API implementation strictly adheres to the server-side validation matrix specified in this report.

---

## 2. August Payroll Status Investigation

### 2.1 Exact Database Evidence
Executing direct SQL queries against `prisma/dev.db`:

```sql
SELECT id, status, approval_status, approved_by_id, approved_at, pay_date, payment_date, employees_paid, total_gross, total_net 
FROM payroll_runs 
WHERE id IN ('PR-2026-08', 'PR-2026-09')
```

**Retrieved Record State:**
```json
[
  {
    "id": "PR-2026-08",
    "status": "PAID",
    "approval_status": "Pending",
    "approved_by_id": null,
    "approved_at": null,
    "pay_date": 1788220800000,
    "payment_date": 1788220800000,
    "employees_paid": 429,
    "total_gross": 48685007.97,
    "total_net": 43173318.36
  },
  {
    "id": "PR-2026-09",
    "status": "POSTED - PAYMENT PENDING",
    "approval_status": "Pending",
    "approved_by_id": null,
    "approved_at": null,
    "pay_date": null,
    "payment_date": null,
    "employees_paid": 444,
    "total_gross": 54788660.03,
    "total_net": 48089678.30
  }
]
```

#### Historical Context across All 18 Payroll Runs
Inspection of all 18 payroll runs (`PR-2025-04` through `PR-2026-09`) confirmed:
- **17 runs** have operational `status = "PAID"`, `pay_date` populated, but `approval_status = "Pending"` and `approved_by_id = NULL`.
- **1 run** (`PR-2026-09`) has operational `status = "POSTED - PAYMENT PENDING"`, `pay_date = NULL`, and `approval_status = "Pending"`.

### 2.2 Source Data Pack Evidence (`03_Data_Pack/payroll_runs.json`)
Inspection of the authoritative source file `03_Data_Pack/payroll_runs.json` reveals:
```json
{
  "run_id": "PR-2026-08",
  "period_start": "2026-08-01",
  "period_end": "2026-08-31",
  "pay_date": "2026-09-01",
  "employees_paid": 429,
  "total_gross": 48685007.97,
  "total_net": 43173318.36,
  "status": "PAID"
}
```
**Finding:** The original data pack had **no concept of approval status**. It provided only operational `status` (`PAID` vs. `POSTED - PAYMENT PENDING`), `pay_date`, and financial totals.

### 2.3 Migration Evidence (`prisma/migrations/20261102044852_add_payroll_approval_fields`)
On 2026-11-02, the approval tracking schema was introduced:
```sql
-- AlterTable
ALTER TABLE "payroll_runs" ADD COLUMN "approval_notes" TEXT;
ALTER TABLE "payroll_runs" ADD COLUMN "approval_status" TEXT DEFAULT 'Pending';
ALTER TABLE "payroll_runs" ADD COLUMN "approved_at" DATETIME;
ALTER TABLE "payroll_runs" ADD COLUMN "approved_by_id" TEXT;
ALTER TABLE "payroll_runs" ADD COLUMN "preparer_id" TEXT;
```
**Mechanism:** SQLite `ALTER TABLE ADD COLUMN ... DEFAULT 'Pending'` automatically populated the value `'Pending'` into all existing rows in `payroll_runs`. The migration author did not include an `UPDATE payroll_runs SET approval_status = 'Approved' WHERE status = 'PAID';` data migration statement.

### 2.4 API & Service Lifecycle Evidence
To reconcile this historical database condition, the software engineers implemented an explicit mapping rule across all payroll API endpoints and calculation services:

1. **`src/app/api/v1/payroll/runs/route.ts` (Line 96):**
   ```ts
   approvalStatus: run.status.toUpperCase().includes("PAID") ? "Approved" : (run.approvalStatus || "Pending"),
   ```
2. **`src/app/api/v1/payroll/runs/[runId]/route.ts` (Line 194):**
   ```ts
   approvalStatus: run.status.toUpperCase().includes("PAID") ? "Approved" : (run.approvalStatus || "Pending"),
   ```
3. **`src/lib/payroll/reconciliation-service.ts` (Lines 139 & 237):**
   ```ts
   approvalStatus: run.status.toUpperCase().includes("PAID") ? "Approved" : (run.approvalStatus || "Pending"),
   ```
4. **`src/components/payroll/PayrollRunDetails.tsx` (Line 327):**
   ```tsx
   {header.approvedById || (isPaid ? "System Root / Finance" : "Pending Authorization")}
   ```
5. **Approval Endpoint Invariant Guard (`src/app/api/v1/payroll/runs/[runId]/approve/route.ts` Lines 108–117):**
   ```ts
   if (run.status.toUpperCase().includes("PAID")) {
     return NextResponse.json(
       {
         error: "Conflict: This payroll run has already been paid and finalized.",
         status: run.status,
         approvalStatus: run.approvalStatus,
       },
       { status: 409, headers: NO_CACHE_HEADERS }
     );
   }
   ```

### 2.5 Root-Cause Conclusion & Remediation Recommendation
- **Conclusion:** The divergence between earlier documentation (`Approved`) and SQLite (`Pending`) is a **known presentation-layer synthesis versus storage-layer default artifact**.
- **Business Logic Invariant:** In the application design, payment disbursement (`PAID`) represents the final, immutable operational state of a payroll run. The approval workflow is designed strictly as an **in-flight gate for unpaid batches** (`PR-2026-09`).
- **Remediation Recommendation:** **No manual database mutation is authorized or required.**
  - Modifying `approval_status = 'Approved'` directly in SQLite without an authoritative audit trail would violate financial data preservation constraints.
  - The API and UI already treat `PR-2026-08` as approved.
  - If the enterprise requires historical database alignment, an audited data-fix migration can be scheduled under explicit executive authorization.

---

## 3. Referential Integrity Investigation

### 3.1 Prisma Relationship Matrix

| Field | Referenced Model | Prisma Relation Defined? | Nullable? | Delete Behavior | Update Behavior |
| :--- | :--- | :---: | :---: | :---: | :---: |
| `payrollRunId` | `PayrollRun` | **YES** (`@relation`) | **NO** | `ON DELETE RESTRICT` | `ON UPDATE CASCADE` |
| `auditLogId` | `AuditLog` | **NO** (Unlinked `String?`) | **YES** | None (Decoupled) | None |
| `reconciledById` | `User` | **NO** (Unlinked `String`) | **NO** | None (Decoupled) | None |
| `approvedById` | `User` | **NO** (Unlinked `String?`) | **YES** | None (Decoupled) | None |
| `auditEventId` | N/A (Correlation UUID) | **NO** (Unlinked `String?`) | **YES** | None (Correlation) | None |

### 3.2 SQLite Foreign Key Inspection (`PRAGMA foreign_key_list`)

Executing `PRAGMA foreign_key_list(payroll_adjustments)`:
```json
[
  {
    "id": 0,
    "seq": 0,
    "table": "payroll_runs",
    "from": "payroll_run_id",
    "to": "id",
    "on_update": "CASCADE",
    "on_delete": "RESTRICT",
    "match": "NONE"
  }
]
```
**Engine Verification:**
- SQLite enforces referential integrity strictly on `payroll_run_id`.
- SQLite does **NOT** enforce foreign-key constraints on `audit_log_id`, `reconciled_by_id`, or `approved_by_id`.

### 3.3 Indexing Inspection (`PRAGMA index_list`)
While database foreign keys are omitted on user and audit fields, **dedicated B-tree indexes exist for query performance and relational lookups**:
- `payroll_adjustments_idempotency_key_key` (UNIQUE)
- `payroll_adjustments_payroll_run_id_revision_key` (UNIQUE on `[payroll_run_id, revision]`)
- `payroll_adjustments_payroll_run_id_idx` (INDEX)
- `payroll_adjustments_status_idx` (INDEX)
- `payroll_adjustments_audit_event_id_idx` (INDEX)
- `payroll_adjustments_reconciled_by_id_idx` (INDEX)

### 3.4 Architecture & Security Evaluation: Why Actor & Audit FKs are Decoupled
1. **Audit Ledger Immutability:**
   In compliance systems, audit records and financial adjustments must represent an **indelible chronological record**. If a relational foreign key existed to `User`, deleting a user could trigger cascade deletion or referential integrity failures that block administrative functions.
2. **Circular Dependency Avoidance:**
   When an adjustment is created, the audit log entry references the adjustment, while the adjustment references the audit log. Having bidirectional database foreign keys creates chicken-and-egg insertion deadlocks.
3. **Soft Deactivation Invariant:**
   Inspection of `src/app/api/v1/admin/employees/[id]/deactivate/route.ts` and `src/lib/auth/user.ts` confirms that **portal users are never deleted (`DELETE FROM users`)**. They are deactivated via `User.isActive = false`. Deactivated user records remain permanently stored in SQLite, preserving historical author attribution indefinitely.
4. **Decoupled System Attribution:**
   System-level or automated batch adjustments (e.g., initial system migrations or external ERP integrations) may use system identifiers (e.g., `"SYSTEM_FINANCE"`) that do not exist as human accounts in the `users` table.

---

## 4. Cross-System Security & Consistency Invariants

The following table evaluates the enforcement level of all required security and business invariants across the application:

| Invariant | Enforcement Level | Verification Evidence / Mechanism |
| :--- | :---: | :--- |
| **Adjustment cannot reference nonexistent payroll run** | **Verified in database** | SQLite Foreign Key: `payroll_adjustments_payroll_run_id_fkey` with `ON DELETE RESTRICT`. |
| **Deleting a payroll run cannot delete its adjustments** | **Verified in database** | `ON DELETE RESTRICT` triggers SQLite error if deletion of parent run is attempted. |
| **Duplicate submissions cannot create duplicate adjustments** | **Verified in database** | `CREATE UNIQUE INDEX "payroll_adjustments_idempotency_key_key"`. |
| **Concurrent competing revisions are blocked** | **Verified in database** | `CREATE UNIQUE INDEX "payroll_adjustments_payroll_run_id_revision_key"`. |
| **Paid historical runs (`PR-2026-08`) cannot be overwritten** | **Verified in application & schema** | Schema isolates historical changes in `payroll_adjustments`. `approve/route.ts` rejects paid runs with HTTP 409. |
| **Preparer/Reconciler cannot approve their own adjustment** | **Must be implemented in Step 2** | Maker-checker check: `if (session.user.id === run.reconciledById) throw HTTP 403`. |
| **Reconciler / Approver must exist and be active** | **Must be implemented in Step 2** | `getAuthenticatedUserFromToken` verifies `user.isActive === true` and role `ADMIN` or `HR`. |
| **Actor identity derived securely from session** | **Verified in application framework** | `src/lib/auth/user.ts` reads JWT cookie and validates active user in SQLite database. |
| **Exact 0-paise balance ($\text{Gross} - \text{Deductions} = \text{Net}$)** | **Must be implemented in Step 2** | Integer paise arithmetic assertions on all incoming and computed adjustment figures. |
| **Atomic creation of adjustment and audit log** | **Must be implemented in Step 2** | Enclosed within `prisma.$transaction(async (tx) => { ... })`. |

---

## 5. Risk Register

| ID | Finding | Evidence | Risk | Recommended Action | Requires Business Approval? |
| :---: | :--- | :--- | :---: | :--- | :---: |
| **RSK-01** | `approval_status = 'Pending'` on paid historical runs in SQLite | `PRAGMA table_info` and direct SELECT on `PR-2026-08` | Low (UI and API already synthesize `'Approved'` based on `status = 'PAID'`) | Maintain current application layer synthesis. Do not mutate historical database records. | **YES** (if DB backfill is desired) |
| **RSK-02** | No DB foreign key from `reconciledById` / `approvedById` to `users` | `PRAGMA foreign_key_list(payroll_adjustments)` | Medium (Risk of orphaned IDs if arbitrary input accepted) | Enforce server-side session identity validation in Step 2 route handlers. Never accept client-supplied actor IDs. | **NO** (Standard backend practice) |
| **RSK-03** | No DB foreign key from `auditLogId` to `audit_logs` | `PRAGMA foreign_key_list(payroll_adjustments)` | Low (Standard decoupled audit pattern) | Create adjustment and audit log within a single `prisma.$transaction`. Store correlation `auditEventId`. | **NO** (Architectural design) |
| **RSK-04** | Potential race conditions under high concurrent adjustment submissions | Database indexing | Low (Protected by unique constraints) | Catch Prisma code `P2002` (unique violation) and return graceful HTTP 409 Conflict. | **NO** (Standard backend practice) |
| **RSK-05** | Native `BigInt` serialization in Next.js JSON API responses | `typeof BigInt === 'bigint'` | High (Next.js `NextResponse.json` throws TypeError on BigInt) | Implement explicit serialization helper (`paise.toString()` or formatting to INR floats) in Step 2. | **NO** (Implementation requirement) |

---

## 6. Recommended Remediation & Implementation Guidelines

### 6.1 No Change Required (Preserve Existing State)
- **Do not alter `prisma/dev.db` historical records:** Keep `PR-2026-08` raw values intact.
- **Do not add DB foreign keys to `User` or `AuditLog`:** Retain the decoupled audit and actor architecture to protect against cascade deletion and circular dependencies.

### 6.2 Application-Level Controls for Step 2 Implementation
When implementing Step 2 API routes (`/reconciliation-preview`, `/reconcile-pre-approval`, and `/historical-adjustment`):
1. **Server-Side Identity:**
   Always resolve actor via `getAuthenticatedUserFromToken(request.cookies.get(SESSION_COOKIE_NAME)?.value)`. Reject unauthenticated callers (HTTP 401) and non-HR/Admin roles (HTTP 403).
2. **Maker-Checker Dual Control:**
   When approving an adjustment, verify:
   ```ts
   if (currentUser.id === adjustment.reconciledById) {
     return NextResponse.json(
       { error: "Maker-Checker violation: Reconciler cannot approve their own adjustment." },
       { status: 403 }
     );
   }
   ```
3. **Atomic Transactions:**
   Enclose adjustment creation and audit logging in `prisma.$transaction`:
   ```ts
   await prisma.$transaction(async (tx) => {
     const adjustment = await tx.payrollAdjustment.create({ ... });
     const auditLog = await tx.auditLog.create({ ... });
   });
   ```
4. **BigInt JSON Serialization:**
   Convert BigInt paise to strings or standard rupee numbers before passing to `NextResponse.json()`:
   ```ts
   const serializedAdjustment = {
     ...adjustment,
     originalGrossPaise: adjustment.originalGrossPaise.toString(),
     adjustedGrossPaise: adjustment.adjustedGrossPaise.toString(),
     varianceGrossPaise: adjustment.varianceGrossPaise.toString(),
   };
   ```

---

## 7. Final Readiness Decision

### Decision: **`READY WITH DOCUMENTED LIMITATIONS`**

#### Justification:
1. **Schema & Migration are Solid:** Step 1 migration is applied cleanly, non-destructively, and verified with `ON DELETE RESTRICT` active at the SQLite storage layer.
2. **August Status is Handled Gracefully:** The discrepancy between database `'Pending'` and application `'Approved'` is fully explained, controlled by existing API logic, and does not block Step 2.
3. **Referential Decoupling is Sound:** Application-level validation for actors and audit entries aligns with portal architectural standards, provided the Step 2 implementation follows the security rules detailed in Section 6.2.

---

## 8. Evidence Appendix

### 8.1 File Paths Inspected
- `prisma/schema.prisma`
- `prisma/dev.db`
- `03_Data_Pack/payroll_runs.json`
- `prisma/migrations/20261102044852_add_payroll_approval_fields/migration.sql`
- `prisma/migrations/20261106154652_add_payroll_correction_ledger/migration.sql`
- `src/app/api/v1/payroll/runs/route.ts`
- `src/app/api/v1/payroll/runs/[runId]/route.ts`
- `src/app/api/v1/payroll/runs/[runId]/approve/route.ts`
- `src/lib/payroll/reconciliation-service.ts`
- `src/lib/audit/audit-logger.ts`
- `src/lib/auth/user.ts`
- `src/components/payroll/AdminPayrollConsole.tsx`
- `src/components/payroll/PayrollRunDetails.tsx`
- `scripts/test-day11-payroll.ts`
- `scripts/test-day11-payroll-reconciliation.ts`

### 8.2 Commands Executed (Read-Only)
- `python scripts/forensic-inspect-payroll-runs.py` (inspected all 18 runs, schema defaults)
- `python scripts/forensic-inspect-referential-integrity.py` (inspected PRAGMA foreign_key_list, table_info, index_list, sqlite_master)
- `Get-ChildItem -Path "src" -Recurse -Filter "*.ts*" | Select-String ...` (traced approvalStatus usage)
- `git status` (verified working tree cleanliness)

### 8.3 Commands Deliberately Skipped
- `scripts/test-day11-payroll.ts`: **Skipped** because lines 248–320 insert test fixtures (`PR-TEST-NO-ITEMS`, `PR-TEST-ISOLATED-001`) into `prisma/dev.db`, which would violate the read-only execution constraint.
- Database mutation queries (`UPDATE`, `INSERT`, `DELETE`): **Skipped** per strict safety instructions.

