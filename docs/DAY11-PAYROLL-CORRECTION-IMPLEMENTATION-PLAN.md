# Day 11 — Source-Backed Payroll Correction Implementation Plan
## Reconciling PR-2026-09 and PR-2026-08 with Complete Accounting Governance
### Aura Workforce by Growmar — Horizon Portal

**Document Version:** 1.0.0  
**Date:** 2026-11-06  
**Implementation Track:** Day 11 Financial Reconciliation Architecture  
**Document Status:** Complete Implementation Plan — Ready for Review  
**Execution Status:** Planning Only — Zero Database Mutations Executed  
**Auditor / Lead Architect:** Senior Full-Stack Engineer, Enterprise Software Architect, Database Engineer, Financial Systems Auditor  

---

## 1. Executive Summary & Objective

This implementation plan defines the complete engineering, architectural, and governance specification to reconcile **`PR-2026-09`** (September 2026) and **`PR-2026-08`** (August 2026) in the **Aura Workforce by Growmar (Horizon Portal)** enterprise application.

### The Accounting Problem
In Day 11, the Admin Payroll Console detected financial discrepancies between stored `PayrollRun` summary headers and itemized `Payslip` transactions:
- **`PR-2026-09`:** Stored header overstates headcount by $+3$ employees ($444$ stored vs. $441$ actual active workforce), creating a gross variance of $+₹358,328.51$ and net variance of $+₹307,351.70$.
- **`PR-2026-08`:** Stored header overstates headcount by $+5$ employees ($429$ stored vs. $424$ actual active workforce as of August 31, 2026), creating a gross variance of $+₹837,598.52$ and net variance of $+₹705,356.99$.

Forensic audits in [`docs/DAY11-RECONCILIATION-ROOT-CAUSE-REPORT.md`](file:///c:/Users/Madugu%20Shiva%20Kumar/OneDrive/图片/Desktop/horizon-portal/docs/DAY11-RECONCILIATION-ROOT-CAUSE-REPORT.md) and [`docs/DAY11-FINAL-CORRECTION-READINESS-REPORT.md`](file:///c:/Users/Madugu%20Shiva%20Kumar/OneDrive/图片/Desktop/horizon-portal/docs/DAY11-FINAL-CORRECTION-READINESS-REPORT.md) proved:
1. Every single payslip in `payslips.json` ($2,469$ records) is **100% mathematically balanced to the exact paise ($0.00$ discrepancy)**.
2. The itemized payslips cover **100% of all employees who were hired and active** during those respective months ($441$ in September, $424$ in August).
3. The stored headers in `payroll_runs.json` contain **phantom/projected headcount** that never existed in the enterprise workforce.

### Architectural Solution: Differentiated Correction Pathways
Because the two runs occupy different stages of the financial accounting lifecycle, they require fundamentally different correction procedures:
- **`PR-2026-09` (Pending & Unpaid):** Governed by an **In-Flight Pre-Approval Batch Alignment Workflow**. Updates the header to match the 441 verified payslips while permanently archiving original values, resolving the reconciliation lock, and enabling the maker-checker approval workflow.
- **`PR-2026-08` (Paid & Disbursed):** Governed by a **Formal Historical Adjustment Mechanism (Prior-Period Adjustment)**. The original paid payment records ($₹48,685,007.97$ Gross / $₹43,173,318.36$ Net / $429$ employees) are **never overwritten in-place**. Instead, an audited historical adjustment record is created separately to tie out reporting figures with itemized legal instruments without implying that past employee disbursements were modified.

---

## 2. Architecture and Data Model Changes

To support non-destructive reconciliation, separate reporting, and complete auditability, the Prisma schema is enhanced with dedicated tracking models and snapshot preservation fields.

### 2.1 Prisma Schema Modifications (`prisma/schema.prisma`)

```prisma
// ==========================================
// 5. Payroll Runs (Enhanced for Reconciliation & Adjustments)
// ==========================================
model PayrollRun {
  id                    String              @id
  periodStart           DateTime            @map("period_start")
  periodEnd             DateTime            @map("period_end")
  paymentDate           DateTime?           @map("payment_date")
  payDate               DateTime?           @map("pay_date")
  employeesPaid         Int?                @map("employees_paid")
  totalGross            Float?              @map("total_gross")
  totalNet              Float?              @map("total_net")
  status                String              @default("Completed")
  approvalStatus        String?             @default("Pending") @map("approval_status")
  preparerId            String?             @map("preparer_id")
  approvedById          String?             @map("approved_by_id")
  approvedAt            DateTime?           @map("approved_at")
  approvalNotes         String?             @map("approval_notes")

  // --- NEW: Original Snapshot Preservation (For In-Flight Reconciled Runs) ---
  originalEmployeesPaid Int?                @map("original_employees_paid")
  originalTotalGross    Float?              @map("original_total_gross")
  originalTotalNet      Float?              @map("original_total_net")
  reconciledAt          DateTime?           @map("reconciled_at")
  reconciledById        String?             @map("reconciled_by_id")
  reconciliationNotes   String?             @map("reconciliation_notes")

  // Relations
  payslips              Payslip[]
  adjustments           PayrollAdjustment[]

  createdAt             DateTime            @default(now()) @map("created_at")
  updatedAt             DateTime            @updatedAt @map("updated_at")

  @@map("payroll_runs")
}

// ==========================================
// 5B. Payroll Adjustments (New Model for Historical Adjustments)
// ==========================================
model PayrollAdjustment {
  id                      String      @id @default(cuid())
  payrollRunId            String      @map("payroll_run_id")
  adjustmentType          String      @map("adjustment_type") // "PRE_APPROVAL_CORRECTION" | "HISTORICAL_REPORTING_ADJUSTMENT"
  adjustmentStatus        String      @default("APPROVED") @map("adjustment_status") // "PROPOSED" | "APPROVED"

  // Original Disbursement Snapshot (Immutable)
  originalEmployeesPaid   Int         @map("original_employees_paid")
  originalTotalGross      Float       @map("original_total_gross")
  originalTotalNet        Float       @map("original_total_net")
  originalTotalDeductions Float       @map("original_total_deductions")

  // Audited Reporting Figures (Itemized Tie-Out)
  adjustedEmployeesPaid   Int         @map("adjusted_employees_paid")
  adjustedTotalGross      Float       @map("adjusted_total_gross")
  adjustedTotalNet        Float       @map("adjusted_total_net")
  adjustedTotalDeductions Float       @map("adjusted_total_deductions")

  // Exact Variances in Integer Paise (Calculated at 100 paise = 1 INR)
  varianceGrossPaise      BigInt      @map("variance_gross_paise")
  varianceNetPaise        BigInt      @map("variance_net_paise")
  varianceDeductionsPaise BigInt      @map("variance_deductions_paise")
  varianceEmployees       Int         @map("variance_employees")

  // Audit & Governance Attribution
  proposedById            String      @map("proposed_by_id")
  authorizedById          String      @map("authorized_by_id")
  justification           String      @map("justification")
  effectiveDate           DateTime    @default(now()) @map("effective_date")
  createdAt               DateTime    @default(now()) @map("created_at")

  // Relations
  payrollRun              PayrollRun  @relation(fields: [payrollRunId], references: [id], onDelete: Cascade)

  @@index([payrollRunId])
  @@index([adjustmentType])
  @@map("payroll_adjustments")
}
```

### 2.2 Data Integrity Invariants
1. **Zero Overwrite of Paid Data:** On `PR-2026-08`, `totalGross = 48685007.97`, `totalNet = 43173318.36`, and `employeesPaid = 429` remain **completely untouched in `PayrollRun`**.
2. **Dual-Ledger Reporting:** Historical adjustment figures are stored in `PayrollAdjustment`. Services querying financial metrics can access both:
   - *Actual Historical Payout Ledger:* `PayrollRun.totalGross` / `totalNet`
   - *Audited Transaction Tie-Out Ledger:* `PayrollAdjustment.adjustedTotalGross` / `adjustedTotalNet`
3. **In-Flight Preservation:** On `PR-2026-09`, `originalTotalGross = 54788660.03`, `originalTotalNet = 48089678.30`, and `originalEmployeesPaid = 444` are populated before `totalGross` and `totalNet` are aligned with the 441 verified payslips.

---

## 3. Proposed API Endpoints

Three dedicated RESTful endpoints provide secure, role-restricted, idempotent reconciliation capabilities:

```
+--------------------------------------------------------------------------------------------------+
|                                    PROPOSED API ROUTE MAP                                        |
+--------------------------------------------------------------------------------------------------+
| 1. GET  /api/v1/payroll/runs/[runId]/reconciliation-preview                                      |
|    - Purpose: Dry-run preview comparing stored header vs. itemized payslips before committing    |
|    - RBAC: HR and Admin only                                                                     |
+--------------------------------------------------------------------------------------------------+
| 2. POST /api/v1/payroll/runs/[runId]/reconcile-pre-approval                                      |
|    - Target: PR-2026-09 (Only runs where status !== 'PAID' and approvalStatus === 'Pending')     |
|    - Purpose: In-flight batch alignment of header to 441 verified payslips                       |
|    - RBAC: HR and Admin (Maker-Checker: Corrector cannot be final Approver)                     |
+--------------------------------------------------------------------------------------------------+
| 3. POST /api/v1/payroll/runs/[runId]/historical-adjustment                                       |
|    - Target: PR-2026-08 (Only runs where status === 'PAID')                                      |
|    - Purpose: Create formal reporting adjustment record without mutating paid header             |
|    - RBAC: Strictly Admin (or HR proposed + Admin authorized)                                    |
+--------------------------------------------------------------------------------------------------+
```

### 3.1 Endpoint 1: Reconciliation Preview (Dry-Run)
- **Method:** `GET /api/v1/payroll/runs/[runId]/reconciliation-preview`
- **Request Headers:** Cookie session token (`horizon_session`).
- **Response Payload (`200 OK`):**
  ```json
  {
    "runId": "PR-2026-09",
    "status": "POSTED - PAYMENT PENDING",
    "approvalStatus": "Pending",
    "canReconcilePreApproval": true,
    "canCreateHistoricalAdjustment": false,
    "itemCount": 441,
    "workforceActiveCount": 441,
    "storedHeader": {
      "employeesPaid": 444,
      "totalGross": 54788660.03,
      "totalNet": 48089678.30,
      "impliedDeductions": 6698981.73
    },
    "calculatedItems": {
      "employeesPaid": 441,
      "totalGross": 54430331.52,
      "totalNet": 47782326.60,
      "totalDeductions": 6648004.92
    },
    "variances": {
      "employees": -3,
      "grossRupees": -358328.51,
      "netRupees": -307351.70,
      "deductionsRupees": -50976.81,
      "grossPaise": "-35832851",
      "netPaise": "-30735170",
      "deductionsPaise": "-5097681"
    },
    "internalArithmeticBalanced": true
  }
  ```

### 3.2 Endpoint 2: Pre-Approval Header Alignment (`PR-2026-09`)
- **Method:** `POST /api/v1/payroll/runs/[runId]/reconcile-pre-approval`
- **Guards & Validations:**
  1. `401 Unauthorized` if no valid session.
  2. `403 Forbidden` if role is not `HR` or `Admin`.
  3. `409 Conflict` if `run.status.toUpperCase().includes("PAID")` (prohibits applying to paid runs).
  4. `409 Conflict` if `run.approvalStatus === "Approved"` (prohibits applying to approved runs).
  5. `409 Conflict` if `run.reconciledAt !== null` (idempotency guard: prevents duplicate execution).
  6. `422 Unprocessable Entity` if `payslips.length === 0`.
- **Request Body:**
  ```json
  {
    "justification": "Aligning preliminary staffing header (444 emps) to match 441 active employee payslips prior to approval."
  }
  ```
- **Execution Logic (Atomic Transaction):**
  1. Calculate exact bottom-up sums from the 441 payslips in integer paise.
  2. Archive existing values:
     `originalEmployeesPaid = run.employeesPaid`, `originalTotalGross = run.totalGross`, `originalTotalNet = run.totalNet`.
  3. Update header values:
     `employeesPaid = 441`, `totalGross = 54430331.52`, `totalNet = 47782326.60`.
  4. Record reconciliation metadata:
     `reconciledAt = now`, `reconciledById = user.id`, `reconciliationNotes = justification`.
  5. Insert `AuditLog` entry with action `PAYROLL_PRE_APPROVAL_CORRECTION`.
  6. Return updated run representation with `reconciliationStatus: "MATCHED"`.

### 3.3 Endpoint 3: Historical Adjustment (`PR-2026-08`)
- **Method:** `POST /api/v1/payroll/runs/[runId]/historical-adjustment`
- **Guards & Validations:**
  1. `401 Unauthorized` if no valid session.
  2. `403 Forbidden` if role is not `Admin`.
  3. `409 Conflict` if `!run.status.toUpperCase().includes("PAID")` (only permitted on paid historical runs).
  4. `409 Conflict` if an active `PayrollAdjustment` already exists for this run (idempotency guard).
  5. Validation: Requires non-empty `justification` string ($\ge 20$ characters).
- **Request Body:**
  ```json
  {
    "justification": "Authorizing audited historical reporting adjustment for August 2026. Aligns reporting ledger to 424 verified payslips. Original payment disbursement of ₹43,173,318.36 remains permanently archived and unmutated."
  }
  ```
- **Execution Logic (Atomic Transaction):**
  1. Verify all 424 payslips in `PR-2026-08` sum to ₹47,847,409.45 Gross and ₹42,467,961.37 Net.
  2. **Do NOT modify `PayrollRun.totalGross`, `totalNet`, or `employeesPaid`.**
  3. Create `PayrollAdjustment` record:
     - `payrollRunId = "PR-2026-08"`
     - `adjustmentType = "HISTORICAL_REPORTING_ADJUSTMENT"`
     - `originalEmployeesPaid = 429`, `originalTotalGross = 48685007.97`, `originalTotalNet = 43173318.36`, `originalTotalDeductions = 5511689.61`
     - `adjustedEmployeesPaid = 424`, `adjustedTotalGross = 47847409.45`, `adjustedTotalNet = 42467961.37`, `adjustedTotalDeductions = 5379448.08`
     - `varianceGrossPaise = -83759852n`, `varianceNetPaise = -70535699n`, `varianceDeductionsPaise = -13224153n`, `varianceEmployees = -5`
     - `proposedById = user.id`, `authorizedById = user.id`, `justification = justification`
  4. Insert `AuditLog` entry with action `PAYROLL_HISTORICAL_ADJUSTED`.
  5. Return created adjustment details.

---

## 4. UI Workflow & Human Experience Design

### 4.1 In-Flight Pre-Approval Workflow (`/payroll/PR-2026-09`)

```
+----------------------------------------------------------------------------------------------------+
|                                    PAGE: /payroll/PR-2026-09                                       |
|                                                                                                    |
|  Status: POSTED - PAYMENT PENDING | Approval: Pending | Reconciliation: MISMATCH (+3 Employees)    |
|                                                                                                    |
|  [Reconciliation Warning Banner]                                                                   |
|  "Approval is locked. Stored header (444 emps) differs from 441 active workforce payslips."        |
|                                                                                                    |
|  [Button: Reconcile Pre-Approval Header]  (Enabled for HR / Admin)                                  |
|  [Button: Approve Payroll]               (Disabled until reconciled)                               |
+----------------------------------------------------------------------------------------------------+
                                                  │
                                                  ▼ (User clicks 'Reconcile Pre-Approval Header')
+----------------------------------------------------------------------------------------------------+
|                               MODAL: Pre-Approval Header Alignment                                 |
|                                                                                                    |
|  Notice: "This action updates the unapproved header to match 441 verified payslips."               |
|                                                                                                    |
|  Metric               Stored Header           Audited Items           Variance                     |
|  Employees Paid       444                     441                     -3                           |
|  Gross Earnings       ₹54,788,660.03          ₹54,430,331.52          -₹358,328.51                 |
|  Deductions           ₹6,698,981.73           ₹6,648,004.92           -₹50,976.81                  |
|  Net Payable          ₹48,089,678.30          ₹47,782,326.60          -₹307,351.70                 |
|                                                                                                    |
|  Audit Justification (Required):                                                                   |
|  [ Textarea: "Aligning preliminary staffing projection to 441 active employee payslips..." ]       |
|                                                                                                    |
|  [Cancel]                                             [Confirm & Reconcile Header]                 |
+----------------------------------------------------------------------------------------------------+
                                                  │
                                                  ▼ (Confirmed via POST API)
+----------------------------------------------------------------------------------------------------+
|                                      UPDATED RUN VIEW                                              |
|                                                                                                    |
|  Status: POSTED - PAYMENT PENDING | Approval: Pending | Reconciliation: MATCHED (Tied Out)         |
|  Audit Badge: "Header reconciled on Nov 06, 2026 by usr_hr_002 (Original: ₹54,788,660.03)"        |
|                                                                                                    |
|  [Button: Approve Payroll]  (Now ENABLED for an independent Admin approver)                        |
+----------------------------------------------------------------------------------------------------+
```

### 4.2 Historical Adjustment Workflow (`/payroll/PR-2026-08`)

```
+----------------------------------------------------------------------------------------------------+
|                                    PAGE: /payroll/PR-2026-08                                       |
|                                                                                                    |
|  Status: PAID (Disbursed 2026-09-01) | Approval: Approved | Reconciliation: MISMATCH (+5 Emps)     |
|                                                                                                    |
|  [Archival Information Banner]                                                                     |
|  "This run has been finalized and paid. Historical bank payment amounts are legally immutable."    |
|                                                                                                    |
|  [Button: Record Historical Reporting Adjustment]  (Enabled for Admin only)                        |
+----------------------------------------------------------------------------------------------------+
                                                  │
                                                  ▼ (Admin clicks 'Record Historical Adjustment')
+----------------------------------------------------------------------------------------------------+
|                         MODAL: Record Historical Reporting Adjustment                              |
|                                                                                                    |
|  CRITICAL NOTICE:                                                                                  |
|  "Original bank disbursement figures of ₹43,173,318.36 (429 emps) will NOT be altered.            |
|   This records an audited reporting schedule against the 424 itemized employee payslips."          |
|                                                                                                    |
|  Financial Comparison:                                                                             |
|  - Original Disbursed Gross:  ₹48,685,007.97 (429 employees)                                       |
|  - Audited Payslip Gross:     ₹47,847,409.45 (424 employees)                                       |
|  - Historical Staffing Diff:  -₹837,598.52   (-5 employees)                                        |
|                                                                                                    |
|  Formal Accounting Justification (Required):                                                      |
|  [ Textarea: "Audited historical adjustment reflecting 424 active August payslips..." ]            |
|                                                                                                    |
|  [Cancel]                                             [Authorize Historical Adjustment]            |
+----------------------------------------------------------------------------------------------------+
                                                  │
                                                  ▼ (Confirmed via POST API)
+----------------------------------------------------------------------------------------------------+
|                                    UPDATED AUDIT VIEW                                              |
|                                                                                                    |
|  Status: PAID | Approval: Approved | Reconciliation: ADJUSTED (TIED-OUT)                           |
|                                                                                                    |
|  [Audit Schedule Card: Historical Reporting Adjustment #ADJ-08]                                    |
|  - Original Payout:  ₹48,685,007.97 Gross | ₹43,173,318.36 Net (429 emps) — Preserved             |
|  - Audited Ledger:   ₹47,847,409.45 Gross | ₹42,467,961.37 Net (424 emps) — Reconciled            |
|  - Authorized By:    usr_admin_001 on Nov 06, 2026                                                 |
+----------------------------------------------------------------------------------------------------+
```

---

## 4. Audit Event Design & Schema

All actions generate immutable, structured audit records in the database `AuditLog` table using `src/lib/audit/audit-logger.ts`.

### 4.1 Event: `PAYROLL_PRE_APPROVAL_CORRECTION` (`PR-2026-09`)
- **`action`:** `"PAYROLL_PRE_APPROVAL_CORRECTION"`
- **`actorId`:** `user.id` (e.g., `usr_hr_002`)
- **`actorEmail`:** `user.email` (`hr@growmar.com`)
- **`actorRole`:** `"HR"` or `"Admin"`
- **`fieldName`:** `"header_reconciliation"`
- **`oldValue`:** `"Gross: ₹54,788,660.03 | Net: ₹48,089,678.30 | Emps: 444"`
- **`newValue`:** `"Gross: ₹54,430,331.52 | Net: ₹47,782,326.60 | Emps: 441"`
- **`details` (JSON String):**
  ```json
  {
    "payrollRunId": "PR-2026-09",
    "correctionType": "PRE_APPROVAL_RECONCILIATION",
    "justification": "Aligning preliminary staffing header to 441 active employee payslips prior to approval.",
    "originalHeader": {
      "employeesPaid": 444,
      "totalGross": 54788660.03,
      "totalNet": 48089678.30,
      "impliedDeductions": 6698981.73
    },
    "reconciledHeader": {
      "employeesPaid": 441,
      "totalGross": 54430331.52,
      "totalNet": 47782326.60,
      "totalDeductions": 6648004.92
    },
    "variances": {
      "employees": -3,
      "grossPaise": "-35832851",
      "netPaise": "-30735170",
      "deductionsPaise": "-5097681"
    },
    "reconciledAt": "2026-11-06T14:30:00.000Z"
  }
  ```

### 4.2 Event: `PAYROLL_HISTORICAL_ADJUSTED` (`PR-2026-08`)
- **`action`:** `"PAYROLL_HISTORICAL_ADJUSTED"`
- **`actorId`:** `user.id` (e.g., `usr_admin_001`)
- **`actorEmail`:** `user.email` (`admin@growmar.com`)
- **`actorRole`:** `"Admin"`
- **`fieldName`:** `"historical_reporting_adjustment"`
- **`oldValue`:** `"Unadjusted Disbursed Header: Gross: ₹48,685,007.97 | Net: ₹43,173,318.36 | Emps: 429"`
- **`newValue`:** `"Audited Transaction Schedule: Gross: ₹47,847,409.45 | Net: ₹42,467,961.37 | Emps: 424"`
- **`details` (JSON String):**
  ```json
  {
    "payrollRunId": "PR-2026-08",
    "adjustmentType": "HISTORICAL_REPORTING_ADJUSTMENT",
    "adjustmentId": "adj_cuid_123456",
    "justification": "Authorizing audited historical reporting adjustment for August 2026. Aligns reporting ledger to 424 verified payslips. Original payment disbursement remains archived and unmutated.",
    "originalPaymentDisbursement": {
      "employeesPaid": 429,
      "totalGross": 48685007.97,
      "totalNet": 43173318.36,
      "impliedDeductions": 5511689.61,
      "payDate": "2026-09-01",
      "status": "PAID"
    },
    "auditedItemTotals": {
      "employeesPaid": 424,
      "totalGross": 47847409.45,
      "totalNet": 42467961.37,
      "totalDeductions": 5379448.08
    },
    "variances": {
      "employees": -5,
      "grossPaise": "-83759852",
      "netPaise": "-70535699",
      "deductionsPaise": "-13224153"
    },
    "statutoryComplianceNotice": "Original employee bank payments and tax remittances remain unaltered. Adjustment applies strictly to enterprise management reporting schedules.",
    "authorizedAt": "2026-11-06T14:35:00.000Z"
  }
  ```

---

## 5. Authorization & Maker-Checker Matrix

The system strictly enforces dual-control separation of duties:

| Role | View Dry-Run Preview | Execute Pre-Approval Correction (`PR-2026-09`) | Approve Reconciled Run (`PR-2026-09`) | Authorize Historical Adjustment (`PR-2026-08`) |
|---|:---:|:---:|:---:|:---:|
| **Unauthenticated Guest** | HTTP 401 | HTTP 401 | HTTP 401 | HTTP 401 |
| **Employee Role** | HTTP 403 | HTTP 403 | HTTP 403 | HTTP 403 |
| **Manager Role** | HTTP 403 | HTTP 403 | HTTP 403 | HTTP 403 |
| **HR Specialist (`usr_hr_002`)** | **Allowed** | **Allowed** | **Forbidden if Corrector/Preparer** | Can Propose (Not Authorize) |
| **Senior Administrator (`usr_admin_001`)** | **Allowed** | **Allowed** | **Allowed (Independent Reviewer)** | **Allowed (Full Authority)** |

### Maker-Checker Enforcement Rule
- If User A (`usr_hr_002`) performs the pre-approval correction on `PR-2026-09` (`reconciledById = usr_hr_002`), User A is **strictly prohibited from approving the run** in `POST /api/v1/payroll/runs/[runId]/approve`.
- The approval endpoint validates:
  ```typescript
  if (run.reconciledById && (user.id === run.reconciledById || user.employeeId === run.reconciledById)) {
    return NextResponse.json(
      { error: "Separation of duties violation: The user who performed the pre-approval reconciliation cannot approve this payroll run. An independent reviewer is required." },
      { status: 403 }
    );
  }
  ```

---

## 6. Transaction & Rollback Strategy

All mutations execute inside ACID-compliant `prisma.$transaction` blocks to ensure atomic integrity.

### 6.1 Optimistic Concurrency & Idempotency Safeguards
1. **Concurrency Lock:** Each update checks `updatedAt` to prevent race conditions during concurrent admin sessions.
2. **Idempotency Check:**
   - If `PR-2026-09` has already been reconciled (`reconciledAt !== null` and `totalGross === 54430331.52`), subsequent calls return `409 Conflict: "Run is already reconciled."`
   - If `PR-2026-08` already has an active `PayrollAdjustment`, subsequent calls return `409 Conflict: "Historical adjustment already exists."`
3. **Automatic Rollback:** If any step fails (e.g., audit log constraint violation, database timeout), the entire transaction aborts with zero mutations.

### 6.2 Administrative Reversion Strategy
If executive leadership requests reverting a pre-approval correction prior to disbursement:
- The system supports a rollback action:
  ```sql
  UPDATE "payroll_runs"
  SET "employees_paid" = "original_employees_paid",
      "total_gross"     = "original_total_gross",
      "total_net"       = "original_total_net",
      "reconciled_at"   = NULL,
      "reconciled_by_id"= NULL
  WHERE "id" = 'PR-2026-09' AND "approval_status" = 'Pending';
  ```
- Generates a `PAYROLL_PRE_APPROVAL_REVERTED` audit log entry.

---

## 7. Comprehensive Test Plan

A dedicated test suite `scripts/test-day11-payroll-correction-plan.ts` will verify all execution paths:

### 7.1 Test Cases Matrix
| Test Suite Section | Test Scenario | Expected Result |
|---|---|---|
| **1. RBAC Boundaries** | Unauthenticated request to correction endpoints | HTTP 401 Unauthorized |
| | Employee role request to correction endpoints | HTTP 403 Forbidden |
| | Manager role request to correction endpoints | HTTP 403 Forbidden |
| **2. Invariant Rejection Guards** | Pre-approval correction attempted on paid run (`PR-2026-08`) | HTTP 409 Conflict |
| | Pre-approval correction attempted on approved run | HTTP 409 Conflict |
| | Historical adjustment attempted on unpaid run (`PR-2026-09`) | HTTP 409 Conflict |
| | Correction attempted without justification | HTTP 400 Bad Request |
| **3. Exact Paise Arithmetic** | Dry-run preview calculates ₹54,430,331.52 for `PR-2026-09` | Exact paise match ($5,443,033,152$) |
| | Dry-run preview calculates ₹47,847,409.45 for `PR-2026-08` | Exact paise match ($4,784,740,945$) |
| | Internal item balance verified | $\text{Gross} - \text{Deductions} = \text{Net}$ ($0$ paise diff) |
| **4. Pre-Approval Execution (`PR-2026-09`)** | Authorized HR executes pre-approval reconciliation | HTTP 200 OK |
| | `originalTotalGross` preserved as 54,788,660.03 | Verified in DB |
| | `totalGross` updated to 54,430,331.52 | Verified in DB |
| | `reconciledById` matches HR user ID | Verified in DB |
| | `AuditLog` entry created with `PAYROLL_PRE_APPROVAL_CORRECTION` | Verified in DB |
| | Reconciliation status transitions to `MATCHED` | Verified via Service |
| **5. Maker-Checker Enforcement** | Corrector (`usr_hr_002`) attempts to approve `PR-2026-09` | HTTP 403 Forbidden |
| | Independent Admin (`usr_admin_001`) approves `PR-2026-09` | HTTP 200 OK |
| **6. Historical Adjustment (`PR-2026-08`)** | Authorized Admin records historical adjustment | HTTP 200 OK |
| | `PayrollRun.totalGross` on `PR-2026-08` unchanged at 48,685,007.97 | **Unmutated in DB** |
| | `PayrollRun.status` on `PR-2026-08` unchanged at `"PAID"` | **Unmutated in DB** |
| | `PayrollAdjustment` created with 424 emps and ₹47,847,409.45 | Verified in DB |
| | `AuditLog` entry created with `PAYROLL_HISTORICAL_ADJUSTED` | Verified in DB |
| **7. Regression Testing** | Existing `npm run test:payroll` suite | 53/53 PASS |
| | Updated `npm run test:reconciliation` suite | 77/77 PASS (expecting `MATCHED`) |
| | Production build `npm run build` | 62/62 routes clean build |

---

## 8. Risks and Approval Requirements

### 8.1 Identified Risks & Mitigations
1. **Test Expectation Synchronization:**
   - *Risk:* `scripts/test-day11-payroll-reconciliation.ts` currently expects `MISMATCH` for `PR-2026-09` and `PR-2026-08`.
   - *Mitigation:* The test assertions must be updated synchronously when the migration is applied to assert `rec09.reconciliationStatus === "MATCHED"` and `rec08.reconciliationStatus === "ADJUSTED_MATCHED"`.
2. **MoM Trend Reporting Divergence:**
   - *Risk:* Comparing net pay between August and September could be ambiguous if one is adjusted and the other is unadjusted.
   - *Mitigation:* The `calculateMonthOverMonth()` service will use the audited adjusted ledger for both months, reporting a consistent MoM growth of $+₹5,314,365.23$ ($+12.51\%$).

### 8.2 Executive Approval Checklist
Prior to implementing code changes or executing database migrations, the following formal authorizations are required:
- [ ] **Approval of Schema Migration:** Authorize creating `20261106_add_payroll_adjustments` migration in Prisma.
- [ ] **Approval of Pre-Approval Workflow:** Authorize adding `POST /api/v1/payroll/runs/[runId]/reconcile-pre-approval` for active pending runs.
- [ ] **Approval of Historical Adjustment Mechanism:** Authorize adding `POST /api/v1/payroll/runs/[runId]/historical-adjustment` for paid closed runs.
- [ ] **Approval of Test Expectation Updates:** Authorize updating `scripts/test-day11-payroll-reconciliation.ts` to expect `MATCHED` upon successful correction.

---

## 9. Conclusion & Execution Checkpoint

This implementation plan establishes a complete, robust, audit-compliant engineering architecture for reconciling `PR-2026-09` and `PR-2026-08`:
- **PR-2026-09** is reconciled in-flight prior to approval, enabling the maker-checker disbursement workflow.
- **PR-2026-08** is reconciled via a formal historical reporting schedule, preserving the immutability of paid financial records.
- Zero financial data is fabricated.
- All figures match authoritative payslips exactly to the paise.

### HALT AT CHECKPOINT
Per prompt instructions:
> **This is a planning-only task. Do not modify the database.**  
> **Stop after producing the plan. Do not implement or mutate financial data.**

I have produced the complete implementation plan in [`docs/DAY11-PAYROLL-CORRECTION-IMPLEMENTATION-PLAN.md`](file:///c:/Users/Madugu%20Shiva%20Kumar/OneDrive/图片/Desktop/horizon-portal/docs/DAY11-PAYROLL-CORRECTION-IMPLEMENTATION-PLAN.md) and have **halted without performing any database modifications or code mutations**. Awaiting your official review and authorization to proceed with implementation.

