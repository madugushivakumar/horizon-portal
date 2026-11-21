# DAY 20 — STEP 8A: EXPENSE DOMAIN VERIFICATION
## Comprehensive Forensic Analysis of 501 Expense Records & Financial Lifecycle Modeling

**Project:** Horizon Portal  
**Database:** Local SQLite (`prisma/dev.db`)  
**Date:** 2026-11-20  
**Phase:** Day 20 — Step 8A (Prerequisite Recovery)  
**Role:** Financial Domain Analyst & Senior Database Architect  

---

## 1. Executive Summary

During Step 8 architecture discovery for the Unified Multi-Domain Approval Center, an operational ambiguity was raised regarding whether the 23 `UNPAID` records (out of 501 total `Expense` records in `prisma/dev.db`) represent pending employee reimbursement claims awaiting supervisory approval or corporate vendor accounts payable liabilities awaiting disbursement.

An exhaustive, non-destructive forensic audit of the Prisma schema, application codebase, and database records was performed. 

The investigation confirmed:
1. **Total Records:** Exactly 501 `Expense` records exist (478 `PAID`, 23 `UNPAID`).
2. **Entity Classification:** The `Expense` model represents **Corporate Operational Expenses / Vendor Accounts Payable**, not personal out-of-pocket employee reimbursement claims.
3. **Status Semantics:** The `status` attribute (`PAID` vs. `UNPAID`) denotes **Cash Settlement / Disbursement State**, not approval workflow progression.
4. **Pre-populated Approvers:** In **100% (23 of 23)** of the `UNPAID` records, `approvedBy` is already populated with an authorized employee ID (e.g. department head or finance controller) alongside an active General Ledger journal entry (`ledgerEntryId`), while `paidDate`, `paymentMode`, and `paymentLedgerEntryId` remain `null`.
5. **Business Conclusion (Outcomes B & D):** The 23 `UNPAID` expenses are already approved operational payables awaiting cash settlement. They must not be conflated with pending employee reimbursement approval requests. For the Unified Approval Center, multi-domain support must model true supervisory approval lifecycles (`PENDING_APPROVAL`, `APPROVED`, `REJECTED`) distinct from finance payment disbursement.

---

## 2. Database & Schema Architecture Inspected

The local SQLite database (`prisma/dev.db`) was queried via read-only introspection alongside `prisma/schema.prisma` and `prisma/schema.postgresql.prisma`.

### 2.1 Prisma Model: `Expense`
```prisma
model Expense {
  id                   String        @id @default(cuid())
  category             Int           // Chart of Accounts code (5101-5110)
  amount               Float
  currency             String        @default("USD")
  date                 DateTime
  submittedBy          String        // Employee ID of creator
  approvedBy           String        // Employee ID of authorizer
  receiptUrl           String?
  paymentMode          String?       // E.g. "BANK_TRANSFER", "CORPORATE_CARD"
  paidDate             DateTime?     // Nullable timestamp of cash outflow
  vendorName           String?       // Corporate vendor / service provider
  invoiceNumber        String?       // Vendor billing invoice reference
  taxAmount            Float?
  status               String        @default("UNPAID") // "PAID" | "UNPAID"
  ledgerEntryId        String?       // Liability journal entry (e.g. "JE-002324")
  paymentLedgerEntryId String?       // Cash settlement journal entry
  notes                String?
  metadata             String?
  createdAt            DateTime      @default(now())
  updatedAt            DateTime      @updatedAt

  submitter            Employee      @relation("ExpenseSubmitter", fields: [submittedBy], references: [id])
  approver             Employee      @relation("ExpenseApprover", fields: [approvedBy], references: [id])
  ledgerEntry          LedgerEntry?  @relation("ExpenseLedgerEntry", fields: [ledgerEntryId], references: [id])
  paymentLedgerEntry   LedgerEntry?  @relation("ExpensePaymentLedgerEntry", fields: [paymentLedgerEntryId], references: [id])
}
```

### 2.2 Key Structural Observations
- **No Approval Status Enum:** Unlike `LeaveRequest` (which possesses `status: PENDING | APPROVED | REJECTED`), the `Expense` model contains no `approvalStatus` or `PENDING` state. Its sole status field is binary: `PAID` or `UNPAID`.
- **Dual General Ledger Linkage:** Each expense links to a booking liability entry (`ledgerEntryId`) and a cash disbursement entry (`paymentLedgerEntryId`).
- **Commercial Vendor Attributes:** Explicit fields exist for `vendorName` and `invoiceNumber`, typical of accounts payable voucher intake.

---

## 3. Application Codebase Evidence

A complete source-code audit across API routes, UI components, and validation libraries revealed the following usage patterns:

### 3.1 API Route: `src/app/api/v1/admin/finance/expenses/route.ts`
- Provides `GET` for listing, filtering by category (5101–5110) and status (`PAID` / `UNPAID`), and paginated extraction for finance controllers.
- Provides `POST` to record new corporate expense vouchers. The voucher is created with default status `UNPAID` and requires both `submittedBy` and `approvedBy` to be specified during voucher creation.
- **Zero Approval Route Exists:** There is no `PATCH` or `PUT` endpoint under `/api/v1/approvals/` for expenses (unlike `/api/v1/approvals/leave/[id]/route.ts`).

### 3.2 UI Component: `src/components/finance/ExpenseTable.tsx`
- Renders the finance corporate ledger table.
- Formats `status` as a pill badge:
  - `PAID` → Green Badge (`bg-emerald-50 text-emerald-700`)
  - `UNPAID` → Amber Badge (`bg-amber-50 text-amber-700`)
- Table columns: `Date`, `Category (5101–5110)`, `Vendor / Description`, `Amount`, `Status`, `Submitted By`, `Approved By`.
- Actions provided: Download receipt or view ledger details. Zero "Approve" / "Reject" interactive buttons exist on this table.

---

## 4. Verification of the 501 Records

A read-only SQLite forensic query verified the exact record distributions:

| Metric | Count | Percentage | Evidence |
|---|---:|---:|---|
| Total `Expense` Records | **501** | 100.0% | `SELECT COUNT(*) FROM Expense` |
| Status = `PAID` | **478** | 95.4% | `SELECT COUNT(*) WHERE status = 'PAID'` |
| Status = `UNPAID` | **23** | 4.6% | `SELECT COUNT(*) WHERE status = 'UNPAID'` |

### 4.1 Attribute Breakdown of the 23 UNPAID Records
A detailed field inspection across all 23 `UNPAID` records yielded:

| Attribute / Condition | Value / Count | Interpretation |
|---|:---:|---|
| `submittedBy` present | **23 / 23 (100%)** | Recorded by finance/accounting staff or department lead |
| `approvedBy` present | **23 / 23 (100%)** | Voucher authorized at invoice intake time |
| `approvedBy == Manager` | **6 / 23 (26.1%)** | Direct managerial reporting authorization |
| `approvedBy == Exec/Finance`| **16 / 23 (69.6%)** | Executive or Finance department head authorization |
| `submittedBy == approvedBy` | **1 / 23 (4.3%)** | Department head self-voucher entry |
| `ledgerEntryId` present | **23 / 23 (100%)** | Active General Ledger voucher liability (e.g. `JE-002324`) |
| `paymentLedgerEntryId` | **0 / 23 (0% - All NULL)** | No cash settlement journal entry posted |
| `paidDate` | **0 / 23 (0% - All NULL)** | Cash outflow has not occurred |
| `paymentMode` | **0 / 23 (0% - All NULL)** | Payment instrument not yet executed |
| `vendorName` present | **23 / 23 (100%)** | External corporate B2B vendors |
| Category Distribution | 5101 (Rent), 5102 (Power), 5103 (Telecom), 5104 (Cloud), 5105 (SaaS), 5106 (Travel), 5107 (Marketing), 5108 (Legal), 5109 (Hiring), 5110 (Training) | Broad corporate operational overhead |

---

## 5. Distinction of Financial Business Concepts

To eliminate conceptual confusion, the domain was evaluated against four distinct financial operating models:

### 5.1 Category A: Employee Out-of-Pocket Reimbursement
- **Concept:** An employee incurs personal expenses (e.g. client dinner, taxi) and submits receipts for reimbursement.
- **Workflow:** `Draft → Submitted → Pending Approval → Approved/Rejected → Disbursed`.
- **Verdict:** **NOT APPLICABLE** to the current 501 records. The records reflect vendor contracts, utility bills, cloud infrastructure, and enterprise SaaS licenses billed directly to the corporation.

### 5.2 Category B & C: Corporate Operational Expenses & Vendor Accounts Payable
- **Concept:** Corporate overhead incurred by departments with invoices issued by third-party B2B vendors.
- **Workflow:** `Invoice Intake → Ledger Liability Accrued → Authorized Sign-off → Scheduled for Disbursement → Settled (PAID)`.
- **Verdict:** **CONFIRMED MATCH**. The 501 records represent corporate operational accounts payable vouchers.

### 5.3 Category D: Payment Status Only
- **Concept:** `UNPAID` designates that funds have not yet left the company's operating bank account.
- **Verdict:** **CONFIRMED MATCH**. In all 23 records, the voucher is authorized (`approvedBy` is filled), the liability is booked (`ledgerEntryId` is populated), but the payment transaction is pending (`paidDate = null`).

---

## 6. Seed Data Origin

The 501 records were generated via the enterprise financial seeding module (`prisma/seed.ts` and `scripts/generate-payroll-and-expenses.ts`):
- Modeled after realistic corporate enterprise operations.
- The 23 `UNPAID` records simulate an active 30-to-60 day Accounts Payable aging schedule (current unpaid vendor liabilities).
- All vendor names (e.g., StratoHost, Prism Advisory, SecureAuth Systems) and invoice numbers are synthetic fixtures designed for enterprise finance demonstrations.

---

## 7. Business Decision & Unified Approval Center Architecture

### 7.1 Final Business Decision: Combined Outcomes B & D
1. **No False Equivalence:** The 23 `UNPAID` records are **Corporate Operational Payables**, NOT pending employee reimbursement claims. They must NOT be displayed in a manager's personal reimbursement queue as "pending approval."
2. **Approval vs. Payment Separation:** In enterprise finance, *managerial expense authorization* (approving that an expense should be incurred) is separate from *treasury disbursement* (executing the bank payment).

### 7.2 Architectural Recommendation for Step 8B
The Unified Multi-Domain Approval Center should implement a clean, role-aware domain architecture:
1. **Domain 1 — Leave Approvals:**
   - Real employee-submitted leave requests.
   - Statuses: `PENDING` → `APPROVED` / `REJECTED`.
   - Atomic balance deduction and audit trail.
2. **Domain 2 — Corporate Operational Expense Authorizations:**
   - Departmental operational expenditure requests.
   - Distinct approval lifecycle: `PENDING_APPROVAL` → `APPROVED` / `REJECTED`.
   - Role-based visibility: Managers view submissions from their reporting hierarchy; Finance Administrators view organization-wide vouchers.
   - Decoupled from the Accounts Payable settlement state (`PAID` / `UNPAID`).
