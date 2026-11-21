# DAY 20 — STEP 8B: DATABASE & MIGRATION REPORT
## Database Schema Extension, Dual-Provider Compatibility & Accounts Payable Isolation

**Project:** Horizon Portal  
**Branch:** `day20-final-challenge`  
**Date:** 2026-11-20  
**Phase:** Day 20 — Step 8B  
**Role:** Database Architect & Senior PostgreSQL Administrator  

---

## 1. Schema Extension Overview

To implement the Corporate Expense Authorization workflow without contaminating the historical Accounts Payable ledger, a dedicated entity was introduced:
`model CorporateExpenseAuthorization` (mapped to `corporate_expense_authorizations`).

Both schema definitions were updated and validated:
1. `prisma/schema.prisma` (SQLite - Local Development & Test Database)
2. `prisma/schema.postgresql.prisma` (PostgreSQL 16+ - Neon Serverless Preview / Production)

---

## 2. Prisma Model Definition

```prisma
model CorporateExpenseAuthorization {
  id              String    @id @default(cuid())
  referenceNumber String    @unique @map("reference_number")
  title           String
  description     String
  category        Int       // 5101-5110 (Corporate Chart of Accounts)
  requestedAmount Float     @map("requested_amount")
  currency        String    @default("USD")
  departmentId    String    @map("department_id")
  requestedById   String    @map("requested_by_id")
  approverId      String?   @map("approver_id")
  status          String    @default("PENDING_APPROVAL") // PENDING_APPROVAL | APPROVED | REJECTED | DRAFT | CLOSED
  requiredByDate  DateTime? @map("required_by_date")
  vendorName      String?   @map("vendor_name")
  rejectionReason String?   @map("rejection_reason")
  approvalNotes   String?   @map("approval_notes")
  submittedAt     DateTime  @default(now()) @map("submitted_at")
  decidedAt       DateTime? @map("decided_at")
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")

  department      Department @relation(fields: [departmentId], references: [id], onDelete: Cascade)
  requester       Employee   @relation("ExpenseAuthRequester", fields: [requestedById], references: [id], onDelete: Cascade)
  approver        Employee?  @relation("ExpenseAuthApprover", fields: [approverId], references: [id], onDelete: SetNull)

  @@index([requestedById])
  @@index([approverId])
  @@index([departmentId])
  @@index([status])
  @@index([createdAt])
  @@map("corporate_expense_authorizations")
}
```

### Relations Added:
- In `Department`: `expenseAuthorizations CorporateExpenseAuthorization[]`
- In `Employee`:
  - `requestedExpenseAuthorizations CorporateExpenseAuthorization[] @relation("ExpenseAuthRequester")`
  - `approvedExpenseAuthorizations CorporateExpenseAuthorization[] @relation("ExpenseAuthApprover")`

---

## 3. Indexing Strategy & Query Optimization

| Index Name | Indexed Fields | Query Optimization Role |
|---|---|---|
| `..._reference_number_key` | `referenceNumber` (UNIQUE) | Fast O(1) lookup by human-readable reference code |
| `..._requested_by_id_idx` | `requestedById` | Fast filtering for employee's own requests & manager hierarchy lookups |
| `..._approver_id_idx` | `approverId` | Fast filtering for requests decided by an authorized manager |
| `..._department_id_idx` | `departmentId` | Scoped filtering by business unit / department |
| `..._status_idx` | `status` | Accelerated filtering by pending, approved, or rejected states |
| `..._created_at_idx` | `createdAt` | High-performance chronological ordering and pagination |

---

## 4. Migration Artifacts

### 4.1 SQLite Migration (`prisma/migrations/20261120180000_add_corporate_expense_authorizations/migration.sql`)
- Creates table `corporate_expense_authorizations` with SQLite constraints.
- Foreign keys with `ON DELETE CASCADE` for department/requester, and `ON DELETE SET NULL` for approver.
- Six indexes created including unique reference index.

### 4.2 PostgreSQL Migration (`prisma/migrations_postgresql/20261120180000_add_corporate_expense_authorizations/migration.sql`)
- Creates table `corporate_expense_authorizations` using `DOUBLE PRECISION` for `requested_amount` and `TIMESTAMP(3)` for timestamps.
- Explicit `ALTER TABLE ... ADD CONSTRAINT` statements for referential integrity.
- Compatible with Neon serverless PostgreSQL 16+.

---

## 5. Verification on Disposable & Test Databases

In accordance with strict safety mandates (zero modification of the original `dev.db`):
1. **Disposable Migration Verification:** Applied migration SQL against `prisma/disposable_test.db`. Table creation, columns, indexes, and FK constraints were verified and the disposable DB was safely unlinked.
2. **Dedicated Test Database (`prisma/test-approvals.db`):** Initialized and seeded with 28 tables, synthetic organizational hierarchies, and the exact baseline 501 Accounts Payable `Expense` records.
3. **Accounts Payable Preservation Audit:**
   - Pre-test counts: 501 Total, 478 PAID, 23 UNPAID.
   - Post-test counts: 501 Total, 478 PAID, 23 UNPAID.
   - Proved that zero `Expense` records are modified, deleted, or converted to PAID when Corporate Expense Authorizations are created, approved, or rejected.
