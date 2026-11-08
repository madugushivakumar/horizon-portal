# DAY 11 — STEP 2B ACCOUNTING POLICY & GOVERNANCE DECISION FRAMEWORK
## Authoritative Sources of Truth, Correction Policies & Financial Governance

**Project:** Aura Workforce by Growmar — Horizon Portal  
**Repository:** `horizon-portal`  
**Milestone:** Day 11 — Milestone 2: Step 2B Policy Review & Technical Design (Final Design Correction)  
**Status:** **PROPOSED & READY FOR GOVERNANCE APPROVAL (ALL POLICIES PENDING FORMAL SIGN-OFF)**  
**Date:** November 6, 2026 (Updated)  
**Security & Audit Level:** Critical — Financial Ledger & Statutory Compliance  

---

## 1. Executive Summary & Purpose

The purpose of this document is to establish the proposed accounting rules, source-of-truth hierarchy, correction lifecycle models, and role authorization policies required to govern payroll reconciliation across the Horizon Portal.

In strict adherence to the Master Execution Directive:
- **Technical capability is not financial authority.**
- **Accounting policy cannot be inferred from existing database records.**
- **No financial mutations may be executed without explicit, documented corporate policy approval.**
- **Itemized payslips cannot be asserted as the legally authoritative source of truth without external documentary evidence.**
- **All policy recommendations in this document remain proposals awaiting formal sign-off from the corporate finance and payroll owners.**

---

## 2. Accounting Source-of-Truth Investigation

An investigation was conducted across `03_Data_Pack/` seed files, the Prisma database schema, live SQLite records in `prisma/dev.db`, existing payroll calculation services, and statutory payroll conventions.

### Investigation Question 1: Authoritative Source for Payroll Totals
- **Evidence Available:** In `03_Data_Pack/payslips.json` and `prisma/dev.db`, all 2,469 payslips contain complete itemized breakdowns (basic, HRA, conveyance, medical, special allowance, PF, ESI, professional tax, TDS, net pay). In 100% of payslips, $Gross - Deductions \equiv NetPay$ with $0.00$ discrepancy. Conversely, `payroll_runs` headers contain high-level summary floats (`total_gross`, `total_net`, `employees_paid`).
- **Evidence Missing:** **No corporate accounting policy manual, statutory filing record, or signed finance memorandum exists in the repository to establish whether summary headers or itemized payslips take statutory precedence.** Describing itemized payslips as legally authoritative is an unsupported assertion until verified by corporate finance.
- **Possible Policy Options:**
  - *Option 1 (Proposed):* Itemized payslips are designated by policy as the authoritative source of truth for employee compensation entitlements; summary headers must reconcile to payslip sums.
  - *Option 2 (Alternative):* Stored payroll headers are designated as authoritative budget/disbursement ceilings; payslip discrepancies require off-system journal entries or investigation.
  - *Option 3 (Alternative):* Reconciliation differences require manual case-by-case arbitration without automatic precedence.
- **Financial & Operational Consequences:** Option 1 enables programmatic tie-out of in-flight batches. Option 2 requires investigating why headers diverge before altering any figures. Option 3 leaves in-flight batches blocked until case-by-case resolution.
- **Required Decision Maker:** Chief Financial Officer (CFO) / Corporate Controller / VP Statutory Compliance.
- **Recommendation:** **Option 1 (Proposed Recommendation Only)** — Recommend that the finance owner designate itemized payslips as the calculation source for final payroll summaries, subject to written policy sign-off.

---

### Investigation Question 2: Nature of Payroll Run Headers
- **Evidence Available:** Headers in `prisma/dev.db` for unapproved runs possess `approval_status = "Pending"`, `approved_by_id = null`, and `approved_at = null`. The existing approval route (`/api/v1/payroll/runs/[runId]/approve`) explicitly rejects runs with `reconciliationStatus === "MISMATCH"`.
- **Evidence Missing:** System documentation from the legacy import describing the exact formulas used to generate preliminary run headers.
- **Possible Policy Options:**
  - *Option 1:* Headers represent preliminary, unverified batch estimates generated at the start of a pay cycle.
  - *Option 2:* Headers represent independently authorized, inviolable budget allocations.
- **Financial & Operational Consequences:** Option 1 allows pre-approval correction of headers before funds disbursement. Option 2 requires formal budget variance justifications.
- **Required Decision Maker:** Head of Financial Planning & Analysis (FP&A) / Head of Payroll Operations.
- **Recommendation:** **Option 1 (Proposed Recommendation)** — Recommend treating pre-approval headers as operational estimates that must be tied out to itemized records prior to approval.

---

### Investigation Question 3: Status of Itemized Payslips
- **Evidence Available:** Payslips are issued directly to employees as records of earnings and tax withholdings. They contain employee IDs, tax IDs, and statutory social security deductions.
- **Evidence Missing:** Bank disbursement confirmation files (UTR transaction files) for historical periods.
- **Possible Policy Options:**
  - *Option 1:* Payslips represent definitive individual compensation records that cannot be synthetically generated or altered without audit justification.
  - *Option 2:* Payslips are draft statements subject to revision until year-end tax finalization.
- **Required Decision Maker:** General Counsel & VP Human Resources.
- **Recommendation:** **Option 1 (Proposed Recommendation)** — Preserve payslip records as definitive compensation statements.

---

### Investigation Question 4: Discrepant Employees in In-Flight Payroll (September 2026 / PR-2026-09)
- **Evidence Available:** PR-2026-09 stores headcount `444`, but contains exactly `441` payslips. Forensic inspection of `employees` table revealed that employees `EMP00442`, `EMP00443`, and `EMP00444` have joining dates of `2026-10-01`, `2026-10-02`, and `2026-10-05` (October 2026). They performed zero work in September 2026 and have zero earnings.
- **Evidence Missing:** HR onboarding audit log explaining why future joiners were included in the September preliminary headcount.
- **Possible Policy Options:**
  - *Option 1:* Confirm future joiners were erroneously included in preliminary headcount; execute a 3-stage correction workflow to align the header to 441 employees.
  - *Option 2:* Generate zero-dollar payslips for the 3 future joiners.
- **Required Decision Maker:** Head of HR Operations / Lead Payroll Auditor.
- **Recommendation:** **Option 1 (Proposed Recommendation)** — Adopt a 3-stage pre-approval correction workflow (Proposal $\to$ Approval $\to$ Execution).

---

### Investigation Question 5: Discrepant Employees in Historical Payroll (August 2026 / PR-2026-08)
- **Evidence Available:** PR-2026-08 stores headcount `429`, but contains `424` payslips. Employees `EMP00425` through `EMP00429` have joining dates in September 2026. The run status is `PAID` with payment date `2026-09-01`.
- **Evidence Missing:** Bank statement or UTR file confirming the exact total cash amount disbursed on September 1, 2026 (whether ₹48,685,007.97 or ₹47,847,409.45).
- **Possible Policy Options:**
  - *Option 1 (Reporting-Only Reconciliation Entry):* Record an audit tie-out entry in `PayrollAdjustment` documenting the reporting variance; leave the original `PAID` run header, payment date, and historical payslips **100% immutable**.
  - *Option 2 (Genuine Financial Adjustment):* Treat the discrepancy as a cash overpayment requiring employee recovery or balance-sheet receivable tracking.
  - *Option 3 (Direct Overwrite — Prohibited):* Directly mutate the `PAID` run header to 424 employees.
- **Financial & Operational Consequences:** Option 1 provides complete transparency for audit without asserting unverified cash claims. Option 2 initiates formal debt recovery. Option 3 destroys historical payment auditability and is strictly prohibited.
- **Required Decision Maker:** Corporate Controller & External Financial Auditor.
- **Recommendation:** **Option 1 (Proposed Recommendation)** — Record as a Reporting-Only Reconciliation Entry; strictly preserve the original `PAID` run header.

---

### Investigation Question 6: Impact of Terminations, Deactivations & Retroactive Pay
- **Evidence Available:** All 441 employees in `employees` table have `isActive = true`. Zero termination dates or retroactive adjustment entries exist in the database.
- **Evidence Missing:** Formal HR exit or leaves-of-absence records.
- **Recommendation:** Document onboarding dates as the sole confirmed root cause for observed variances.

---

### Investigation Question 7: Rounding Standards & Sub-Paise Precision
- **Evidence Available:** The accepted reconciliation engine implements canonical half-up rounding to integer paise ($1\text{ INR} = 100\text{ paise}$).
- **Recommendation:** Maintain exact integer paise half-up rounding with sub-paise warnings.

---

### Investigation Question 8: Historical Correction Protocol
- **Evidence Available:** Prisma migration `20261106154652_add_payroll_correction_ledger` introduced the `PayrollAdjustment` model with `adjustmentType`, `revision`, `idempotencyKey`, and Maker-Checker fields.
- **Recommendation:** Adopt the dual-control `PayrollAdjustment` ledger protocol.

---

### Investigation Question 9: Immutability of Disbursed (`PAID`) Runs
- **Evidence Available:** GAAP, IFRS, and SOX frameworks prohibit altering historical disbursement records once funds have cleared.
- **Recommendation:** Paid payroll runs are permanently immutable. Adjustments are posted to a separate adjustment ledger.

---

### Investigation Question 10: Mandatory Evidence Accompanying Financial Corrections
- **Evidence Available:** Reconciliation engine produces complete mathematical tie-out diffs down to the paise.
- **Recommendation:** Mandatory structured audit payload with before/after financial snapshots, variance breakdown, actor identity, correlation ID, and justification reason.

---

## 3. Required Policy Decisions

### Policy A — Authoritative Financial Source of Truth
*Proposed Policy (Awaiting Corporate Finance Determination):*
1. **Status:** **PROPOSED — PENDING WRITTEN APPROVAL**
2. **Proposed Rule A.1:** Subject to CFO/Controller sign-off, itemized payslips are designated as the calculation source for final payroll disbursements and statutory withholdings.
3. **Caveat:** Until documented approval is provided, itemized payslips shall not be described as legally authoritative, and no automatic precedence shall be executed.

---

### Policy B — September 2026 Pre-Approval Correction Workflow (PR-2026-09)
*Proposed Policy (Awaiting Head of Payroll Determination):*
1. **Status:** **PROPOSED — PENDING WRITTEN APPROVAL**
2. **Three-Stage Decoupled Workflow:**
   - **Stage 1 — Proposal Creation (`POST /api/v1/payroll/runs/[runId]/reconcile-pre-approval`):**
     - Prepared by an authorized HR or Admin user.
     - Validates current in-flight state (`POSTED - PAYMENT PENDING`, `payDate = null`, `approvalStatus = Pending`).
     - Computes proposed figures (441 employees, ₹54,430,331.52 gross, ₹47,782,326.60 net) and snapshot of current header (444 employees, ₹54,788,660.03 gross, ₹48,089,678.30 net).
     - Inserts a `PayrollAdjustment` record with `adjustmentType = "PRE_APPROVAL_CORRECTION"` and `status = "PROPOSED"`.
     - **CRITICAL RESTRICTION:** Proposal creation **DOES NOT modify `PayrollRun` header values**. The header remains 444 employees.
   - **Stage 2 — Independent Review & Approval (`POST /api/v1/payroll/adjustments/[adjustmentId]/approve`):**
     - Reviewed by an independent Admin/HR reviewer (`approverId !== preparerId`).
     - Certifies that the proposed reconciliation is mathematically balanced and justified.
     - Updates adjustment `status = "APPROVED"`, `approvedById = reviewer.id`, `approvedAt = now()`.
     - **CRITICAL RESTRICTION:** Approval **DOES NOT execute header updates**. It only authorizes the adjustment.
   - **Stage 3 — Execution Transaction (`POST /api/v1/payroll/adjustments/[adjustmentId]/execute`):**
     - Triggered only during a separately authorized execution transaction.
     - Operates within a single `prisma.$transaction`:
       1. Re-verifies run is still in-flight (`!PAID`, `!Approved`).
       2. Captures original header snapshot into `originalEmployeesPaid`, `originalTotalGross`, `originalTotalNet`, `originalTotalDeductions`.
       3. Updates operational header to itemized sums: `employeesPaid = 441`, `totalGross = 54430331.52`, `totalNet = 47782326.60`.
       4. Sets `reconciledAt = now()`, `reconciledById = actor.id`.
       5. Updates adjustment `status = "EXECUTED"`.
       6. Writes immutable `AuditLog` entry.
3. **Subsequent Approval:** Following execution, final approval of the run (`POST /api/v1/payroll/runs/[runId]/approve`) is evaluated against the reconciled state.

---

### Policy C — August 2026 Historical Adjustment (PR-2026-08)
*Proposed Policy (Awaiting Corporate Controller / Audit Committee Determination):*
1. **Status:** **PROPOSED — PENDING WRITTEN APPROVAL**
2. **Absolute Immutability Rule:**
   - The operational record for `PR-2026-08` in `payroll_runs` shall **NEVER be modified, overwritten, or deleted**.
   - Operational status remains `PAID`.
   - Payment date remains `2026-09-01`.
   - Header headcount remains `429`, gross remains `₹48,685,007.97`, net remains `₹43,173,318.36`.
   - Historical itemized payslips remain 100% untouched.
3. **Adjustment Distinction (Reporting-Only vs. Financial Adjustment):**
   - *Reporting-Only Reconciliation Entry (Proposed):* Creates a `PayrollAdjustment` of type `HISTORICAL_REPORTING_RECONCILIATION` documenting the tie-out variance (-5 employees, -₹837,598.52 gross, -₹705,356.99 net) for statutory and audit reporting. **Generates zero cash movement and zero receivable/payable claims.**
   - *Financial Adjustment (Alternative):* Requires corporate finance determination that an actual cash overpayment occurred and requires employee clawback or balance-sheet receivable tracking.
4. **Governance:** Requires independent Maker-Checker dual control (HR proposes, Admin approves).

---

### Policy D — Financial Adjustment Ledger Semantic Definitions
*Proposed Policy (Awaiting Lead Financial Auditor Determination):*
1. **Status:** **PROPOSED — PENDING WRITTEN APPROVAL**
2. **Distinct Semantic Definitions:**

| Adjustment Category | Code Identifier | Header Mutation | Financial / Cash Consequence | Accounting Purpose |
|---|---|:---:|---|---|
| **Pre-Approval In-Flight Correction** | `PRE_APPROVAL_CORRECTION` | Yes (Executed at Stage 3) | Adjusts disbursement ceiling prior to payment; 0 cash overpayment | In-flight batch alignment |
| **Historical Reporting Reconciliation** | `HISTORICAL_REPORTING_RECONCILIATION` | **NO (Strictly 0 Mutations)** | **Zero cash movement; no receivable or payable created** | Audit tie-out & tax disclosure |
| **Genuine Financial Adjustment** | `FINANCIAL_ADJUSTMENT_CLAIM` | **NO (Strictly 0 Mutations)** | Creates formal balance-sheet receivable/payable; requires treasury batch | Overpayment recovery or arrears |

3. **Invariants:** All categories enforce $\text{GrossPaise} - \text{DeductionsPaise} \equiv \text{NetPaise}$ and $\Delta\text{Gross} - \Delta\text{Deductions} \equiv \Delta\text{Net}$.

---

### Policy E — Authorization Matrix & Separation of Duties
*Proposed Policy (Awaiting CISO / Compliance Lead Determination):*
1. **Status:** **PROPOSED — PENDING WRITTEN APPROVAL**
2. **Role Restrictions:**

| Operation / Endpoint | Allowed Roles | Maker-Checker Constraint | Validation Rule |
|---|---|---|---|
| **Preview Reconciliation** | `HR`, `Admin` | None (Read-only) | Active user verified |
| **Stage 1: Create Proposal** | `HR`, `Admin` | Preparer recorded | Active account verified |
| **Stage 2: Approve Proposal** | `Admin` | `approverId !== preparerId` | Strictly distinct reviewer |
| **Stage 2: Reject Proposal** | `Admin`, `HR` | `reviewerId !== preparerId` | Strictly distinct reviewer |
| **Stage 3: Execute Correction** | `Admin` | Distinct execution permission | Separate authorization required |
| **Final Run Approval** | `Admin`, `HR` | `approverId !== preparerId` | Run must be `MATCHED` |

---

## 4. Summary & Mandatory Stop

All five policies (Policies A through E) are formally documented as **proposals** in status **`PENDING APPROVAL`**.

**No implementation or database modifications will occur until documented approval is provided.**
