# POLICY A — SOURCE-OF-TRUTH HIERARCHY DECISION PROPOSAL
## Governance Framework for Historical Payroll Reconciliation & Record Authority

| Policy Metadata Field | Governance Specification |
|---|---|
| **Project** | Aura Workforce by Growmar — Horizon Portal |
| **Phase / Task** | Phase 3 — Day 11: Admin Payroll Run Console |
| **Governing Policy Code** | **POLICY-A (Source-of-Truth Hierarchy)** |
| **Document Identifier** | `docs/DAY11-POLICY-A-SOURCE-OF-TRUTH-DECISION.md` |
| **Document Revision** | **Revision 2.1 — Evidence Qualification and Authority Separation** |
| **Revision Date** | November 7, 2026 |
| **Designated Approval Authority** | **Chief Financial Officer (CFO) / Corporate Controller** |
| **Document Status** | **PROPOSED — PENDING FORMAL APPROVAL** |
| **Governance Gate 1 Status** | **LOCKED — NO FINANCIAL EXECUTION AUTHORIZED** |

---

## Revision History

| Rev | Date | Author / Role | Changes / Additions | Approval Status |
|---|---|---|---|---|
| **1.0** | 2026-11-07 | Senior Payroll Architect | Initial draft establishing 5 core policy proposals for August/September runs. | DRAFT — PENDING |
| **2.0** | 2026-11-07 | Financial Systems Auditor | Stage 1 expansion: added all 15 enterprise governance sections, empirical six-run data, integer paise audit results, and strict boundary controls. | PROPOSED — PENDING FORMAL APPROVAL |
| **2.1** | 2026-11-07 | Senior Payroll Systems Architect & Financial Data Auditor | Four Critical Source-of-Truth Corrections:<br>1. Replaced unsupported "active workforce" terminology with evidence-based "observed payroll population" and documented absence of termination/leave data.<br>2. Formally separated Dataset Authority, Mathematical Integrity, and Legal/Accounting Authority.<br>3. Reclassified payroll headers as `UNRECONCILED UPSTREAM PAYROLL HEADER — GENERATION METHODOLOGY UNVERIFIED` (avoiding pre-judgment of root cause).<br>4. Separated Employee-Level Recorded Net Pay, Itemized Payroll Aggregate, General Ledger Balance, and Bank Settlement into four distinct concepts. | **PROPOSED — PENDING FORMAL APPROVAL** |

---

## 1. Purpose and Scope

### 1.1 Purpose
This policy establishes a defensible, evidence-based source-of-truth framework across all payroll dimensions within the Horizon Portal platform. It defines the formal boundaries between dataset records, mathematical verification, accounting authority, and external banking evidence when evaluating differences between summary batch headers (`payroll_runs` table) and itemized employee vouchers (`payslips` table).

### 1.2 Scope
This policy applies to:
- All 18 historical and operational payroll runs (`PR-2025-04` through `PR-2026-09`).
- All 2,469 itemized payslip vouchers.
- All 441 corporate master employee records in `employees.json` and the `employees` table.
- All payroll calculation, reconciliation preview, reporting, and API services.
- The Admin Payroll Console UI, audit logging pipelines, and downstream financial interfaces.

---

## 2. Definitions and Evidence Dimensions

### 2.1 The Three Evidence Dimensions
In strict compliance with forensic audit standards, technical systems must distinguish mathematical balancing from legal and statutory authority:

1. **Dimension A — Dataset Authority:**
   `DATASET AUTHORITY: ESTABLISHED FOR THE SUPPLIED SYNTHETIC BENCHMARK`  
   The supplied benchmark data pack (`03_Data_Pack/`) is the authoritative source for reproducing and analyzing records within this engineering project. It does not constitute external commercial banking records, statutory tax returns, or employment contracts.
2. **Dimension B — Mathematical Integrity:**
   `MATHEMATICAL INTEGRITY: VERIFIED WITHIN THE SUPPLIED DATASET`  
   The arithmetic relationships between discrete payslip components and totals have been independently verified down to exact integer paise ($1\text{ INR} = 100\text{ paise}$) with zero residual error. Mathematical balance confirms internal consistency within the dataset, but does not prove statutory compliance or contractual salary entitlement.
3. **Dimension C — Legal and Accounting Authority:**
   `LEGAL/ACCOUNTING AUTHORITY: NOT ESTABLISHED FROM AVAILABLE EVIDENCE`  
   Whether compensation amounts, tax withholdings, or payments have been legally authorized and disbursed. External substantiating evidence (e.g. signed compensation letters, EPFO/ESIC challans, Form 24Q filings, bank disbursement statements) is unavailable in the repository.

### 2.2 Terminology
- **Unreconciled Upstream Payroll Header:** Upstream batch control record (`payroll_runs`) where stored totals differ from calculated itemized payslip totals and whose generation methodology remains unverified.
- **Observed Payroll Population:** The count of unique employees with recorded payslip vouchers in a specific payroll run.
- **Hire-Date-Based Population Count:** The count of employees in `employees.json` whose documented `hire_date` falls on or before a period cut-off date.
- **Integer Paise Arithmetic:** Exact non-floating-point financial calculation using 64-bit BigInt ($1\text{ INR} = 100\text{ paise}$).
- **Run Variance:** The difference between itemized sum and stored header:
  $$\text{Variance} = \text{Itemized Sum} - \text{Stored Header}$$
- **Gate 1 Control:** Strict governance lock preventing database mutations until Policies A through E receive formal human stakeholder sign-off.

---

## 3. Employee Population Authority (Correction 1)

### 3.1 Proposed Policy Decision
For payroll runs with itemized vouchers (`PR-2026-04` through `PR-2026-09`), the **observed payroll population** (distinct `employee_id` count in `payslips`) shall serve as the itemized baseline. The master employee roster (`employees` table) serves as a secondary validation source based on recorded hire dates. For historical runs (`PR-2025-04` through `PR-2026-03`), the **unreconciled upstream payroll header** `employees_paid` serves as a historical reference.

### 3.2 Observed Evidence and Numerical Verification
1. **August 2026 (`PR-2026-08`):**
   - 424 employees have recorded hire dates on or before August 31, 2026, and 424 corresponding August payslip records are present in the supplied dataset.
   - Classification: `OBSERVED PAYROLL POPULATION — 424 RECORDS`
   - Coverage: 100% observed payslip coverage against the recorded hire-date cohort.
   - Stored header: 429 (`employees_paid`). Difference: 5 records.
2. **September 2026 (`PR-2026-09`):**
   - 441 employees have recorded hire dates on or before September 30, 2026, and 441 corresponding September payslip records are present in the supplied dataset.
   - Classification: `OBSERVED PAYROLL POPULATION — 441 RECORDS`
   - Coverage: 100% observed payslip coverage against the recorded hire-date cohort.
   - Stored header: 444 (`employees_paid`). Difference: 3 records.
3. **September Cohort (`EMP-0729` through `EMP-0745`):**
   - All 17 employees have recorded hire dates between September 1, 2026 and September 28, 2026, and corresponding September payslip records exist in the dataset. None have recorded hire dates in August 2026.

### 3.3 Explicit Data Limitations
- Historical termination dates are unavailable in `employees.json` and `prisma/dev.db`.
- Leave-of-absence records and timesheets are unavailable.
- Employment eligibility cannot be independently established solely from hire dates.
- Payslip presence establishes a recorded payroll entry, not independent proof of active employment throughout the period.
- The 424 and 441 counts represent observed dataset populations, not independently certified workforce headcounts.

### 3.4 Approving Role & Status
- **Required Approver:** VP Human Resources & Corporate Controller
- **Status:** **PROPOSED — PENDING FORMAL APPROVAL**

---

## 4. Gross Salary Authority (Correction 2)

### 4.1 Proposed Policy Decision
- **Employee-Level Gross Pay:** Stored gross-pay components in `payslips.gross_pay` are internally consistent within the supplied dataset. Underlying contractual compensation authority is not established.
- **Run-Level Itemized Aggregate:** For runs `PR-2026-04` through `PR-2026-09`, `SUM(payslips.gross_pay)` provides the arithmetic itemized aggregate.
- **Legacy Runs:** For runs `PR-2025-04` through `PR-2026-03`, `payroll_runs.total_gross` remains an unreconciled historical reference.

### 4.2 Observed Evidence
1. In 100% of the 2,469 payslips, the discrete earnings components (`basic + hra + conveyance + medical + special_allowance + overtime_pay + variable_pay`) sum exactly to `gross_pay` with zero paise residual.
2. The mathematical consistency is verified:
   `MATHEMATICAL INTEGRITY: VERIFIED WITHIN THE SUPPLIED DATASET`
3. Stored header gross amounts differ from itemized sums across all six runs:
   - August 2026: Header ₹48,685,007.97 vs. Itemized ₹47,847,409.45 (Variance: -₹837,598.52).
   - September 2026: Header ₹54,788,660.03 vs. Itemized ₹54,430,331.52 (Variance: -₹358,328.51).

### 4.3 Explicit Data Limitations
- Signed employment contracts, salary revision letters, and bonus approval documents are absent from the repository. Contractual compensation authority is not established.

### 4.4 Approving Role & Status
- **Required Approver:** Head of FP&A & Chief Financial Officer (CFO)
- **Status:** **PROPOSED — PENDING FORMAL APPROVAL**

---

## 5. Deduction Authority (Correction 2)

### 5.1 Proposed Policy Decision
- Stored deduction components are internally reconciled within the supplied dataset. Independent statutory filing and remittance authority have not been established.
- For runs with itemized vouchers, `payslips.total_deductions` and its line-item breakdown (`pf_employee`, `esi_employee`, `professional_tax`, `tds`, `other_deductions`) constitute the itemized deduction record.
- For legacy runs (`PR-2025-04`..`2026-03`), implied header deductions (`total_gross - total_net`) remain an unitemized historical reference.

### 5.2 Observed Evidence
1. In 100% of the 2,469 payslips, line-item deduction components sum to `total_deductions` with zero residual.
2. Implied header deductions differ from itemized deductions across all six runs:
   - August 2026: Header ₹5,511,689.61 vs. Itemized ₹5,379,448.08 (Variance: -₹132,241.53).
   - September 2026: Header ₹6,698,981.73 vs. Itemized ₹6,648,004.92 (Variance: -₹50,976.81).

### 5.3 Explicit Data Limitations
- Statutory remittance challans (EPFO ECR receipts, ESIC payments, Form 24Q quarterly returns) are unavailable. External statutory authority is not established.

### 5.4 Approving Role & Status
- **Required Approver:** Head of Tax & Statutory Compliance
- **Status:** **PROPOSED — PENDING FORMAL APPROVAL**

---

## 6. Net Salary Authority (Correction 2 & Correction 4)

### 6.1 Four Separate Concepts of Net Pay and Accounting Authority
To prevent conflating employee vouchers with general ledger balances and bank disbursements, four distinct concepts are established:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. EMPLOYEE-LEVEL RECORDED NET PAY (payslips.net_pay)                       │
│    • Status: DATASET VALUE — MATHEMATICALLY VERIFIED                        │
│    • Legal Entitlement Status: NOT INDEPENDENTLY ESTABLISHED                │
│    • Actual Payment Status: NOT ESTABLISHED                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│ 2. ITEMIZED PAYROLL AGGREGATE (SUM(payslips.net_pay))                       │
│    • Status: DERIVED FROM ITEMIZED DATA (Itemized comparison basis)         │
│    • General Ledger Status: NOT GENERAL LEDGER BALANCE                      │
├─────────────────────────────────────────────────────────────────────────────┤
│ 3. GENERAL LEDGER BALANCE                                                   │
│    • Status: NOT INDEPENDENTLY VERIFIED — GL EVIDENCE UNAVAILABLE           │
│    • Itemized payslip sums must NOT be represented as GL authority          │
├─────────────────────────────────────────────────────────────────────────────┤
│ 4. ACTUAL BANK SETTLEMENT                                                   │
│    • Status: NOT ESTABLISHED FROM AVAILABLE EVIDENCE                        │
│    • Zero banking transaction records, payment batches, or UTRs exist       │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Proposed Policy Decision
1. **Employee-Level Net Pay:** `payslips.net_pay` is the recorded employee-level net amount in the supplied synthetic dataset. Its arithmetic consistency is verified, but independent legal entitlement and actual disbursement are not established.
2. **Itemized Payroll Aggregate:** `SUM(payslips.net_pay)` is the arithmetic total of the supplied employee-level payslip records. It may be used as the itemized payroll comparison basis, but it must not be represented as a verified general ledger balance or proof of bank settlement without corresponding external evidence.
3. **General Ledger Balance:** Remains unverified due to absence of general ledger journal records.
4. **Actual Bank Settlement:** Remains unestablished due to absence of bank settlement statements.

### 6.3 Observed Evidence & Variance Balancing
- All 2,469 payslips satisfy $\text{Gross} - \text{Deductions} \equiv \text{Net}$ ($0\text{ paise}$ residual).
- Mathematical balance holds across run variances:
  $$\Delta_{\text{Gross}} - \Delta_{\text{Deductions}} \equiv \Delta_{\text{Net}}$$
  - August 2026: $-₹837,598.52 - (-₹132,241.53) = -₹705,356.99$ (Header ₹43,173,318.36 vs. Itemized ₹42,467,961.37)
  - September 2026: $-₹358,328.51 - (-₹50,976.81) = -₹307,351.70$ (Header ₹48,089,678.30 vs. Itemized ₹47,782,326.60)

### 6.4 Approving Role & Status
- **Required Approver:** Chief Financial Officer (CFO)
- **Status:** **PROPOSED — PENDING FORMAL APPROVAL**

---

## 7. Operational Status Authority

### 7.1 Proposed Policy Decision
A payroll run's operational lifecycle state shall be determined by **`payroll_runs.approval_status`** corroborated by immutable `audit_logs` records.

### 7.2 Observed Evidence
- All 18 runs currently maintain `approval_status = 'Pending'`. The maker-checker dual-control workflow properly guards state transitions.

### 7.3 Approving Role & Status
- **Required Approver:** Director of Internal Audit & Head of HR Operations
- **Status:** **PROPOSED — PENDING FORMAL APPROVAL**

---

## 8. Payment Status Authority (Correction 4)

### 8.1 Proposed Policy Decision
Payment settlement authority shall be classified as:
```
BANK SETTLEMENT AUTHORITY: NOT ESTABLISHED FROM AVAILABLE EVIDENCE
```
The presence of a stored string `"PAID"` or a populated `pay_date` in `payroll_runs` constitutes an unverified application-level status flag, not statutory proof of bank settlement.

### 8.2 Observed Evidence
- Zero banking tables exist in `prisma/dev.db`.
- Zero bank disbursement manifests, payment gateway logs, or NEFT/RTGS UTR numbers exist.
- Payment settlement cannot be inferred from stored `"PAID"` text, payroll approval, POSTED status, non-null `pay_date`, or itemized net-pay amounts.

### 8.3 Approving Role & Status
- **Required Approver:** Corporate Treasurer & Chief Financial Officer (CFO)
- **Status:** **PROPOSED — PENDING FORMAL APPROVAL**

---

## 9. Historical Reporting Rules (Correction 3)

1. **Classification of Payroll Headers:**
   Stored payroll header totals differ from the aggregate values calculated from the available itemized payslip records. The origin, calculation methodology and intended accounting meaning of the header values have not yet been independently established.
   Headers are formally classified as:
   `UNRECONCILED UPSTREAM PAYROLL HEADER — GENERATION METHODOLOGY UNVERIFIED`
2. **Dual-Presentation Mandate:** In all reports, UI views, and financial exports, both the **Unreconciled Upstream Payroll Header** and the **Itemized Sum** must be displayed alongside the computed variance.
3. **Zero In-Place Overwrites:** Historical header values in `payroll_runs` must **never be overwritten in place**.
4. **Double-Entry Adjustments:** Any alignment between headers and itemized records must be executed exclusively through the `payroll_adjustments` audit table after Gate 1 approval.

---

## 10. Conflict-Resolution Rules (Correction 3)

When summary header totals conflict with itemized payslip totals:
1. **Reporting Default:** The itemized payslip total represents realized compensation vouchers in the dataset; the header represents an unreconciled upstream record.
2. **Discrepancy Tagging:** The discrepancy must be tagged as **Category 4 (Upstream Planning or Reporting Variance)** per `docs/DAY11-DISCREPANCY-CLASSIFICATION-STANDARD.md`.
3. **Hypothesis Boundary:** Specific explanations such as:
   - `TIMING_AND_ROSTER_LAG`
   - `SYSTEM_BATCH_HEADER_CALCULATION_DEFECT`
   must remain strictly classified as:
   `UNVERIFIED HYPOTHESIS — ROOT CAUSE NOT ESTABLISHED`
   Neither hypothesis may be treated as a confirmed root cause until Stage 2 investigation provides evidence.
4. **Immutability Barrier:** No script or engineer may mutate records to force tie-out equality without formal Policy A–E approval.

---

## 11. Evidence Requirements

Before any reconciliation adjustment can be executed under this policy:
1. Complete cryptographic checksum verification of source files.
2. 100% BigInt paise verification confirming zero internal arithmetic residuals.
3. Master employee roster reconciliation confirming observed payslip coverage against recorded hire dates.
4. Formal written approval from designated stakeholders recorded in `docs/DAY11-POLICY-A-E-MASTER-APPROVAL-REGISTER.md`.

---

## 12. Audit Requirements

1. Every reconciliation preview and execution must be logged in `audit_logs` with actor ID, timestamp, run ID, and exact paise values.
2. All adjustment entries must generate a corresponding `payroll_adjustments` row with unique `idempotency_key` and cryptographic signature.
3. System must support full backward replay of historical payroll states.

---

## 13. Approval Responsibilities

| Role | Name / Title | Scope of Responsibility | Sign-Off Status |
|---|---|---|---|
| **Executive Finance** | Chief Financial Officer (CFO) | Overall financial authority, net pay, GL alignment | **PENDING** |
| **Financial Accounting** | Corporate Controller / Head FP&A | Gross salary, batch variances, ledger reporting | **PENDING** |
| **Human Resources** | VP Human Resources | Employee headcount, hire date eligibility | **PENDING** |
| **Tax & Compliance** | Head of Tax & Statutory Compliance | Statutory deduction authority (PF/ESI/PT/TDS) | **PENDING** |
| **Treasury** | Corporate Treasurer | Bank settlement & disbursement authority | **PENDING** |
| **Internal Audit** | Director of Internal Audit | Control validation, maker-checker compliance | **PENDING** |

---

## 14. Known Limitations

1. **Synthetic Operating Context:** As an enterprise simulation within an academic curriculum, live commercial banking records and statutory tax portals do not exist.
2. **Lack of Prior Payslips:** Runs `PR-2025-04` through `PR-2026-03` contain no itemized payslips; their authority remains tied to summary headers.
3. **Pending Corporate Sign-Off:** Until designated stakeholders review and approve this document, Gate 1 remains locked.

---

## 15. Effective Date and Governance State

- **Effective Date:** Pending formal stakeholder sign-off (Proposed effective date: FY 2026-Q3).
- **Current Governance Determination:**
```
POLICY A STATUS: PROPOSED — PENDING FORMAL APPROVAL (REVISION 2.1)
GOVERNANCE GATE 1: LOCKED — NO FINANCIAL EXECUTION AUTHORIZED
DATABASE INTEGRITY: UNCHANGED (ZERO MUTATIONS)
```

---

## 16. Stage 3 Governance Review Addendum (Mandatory Issue 1 Resolution)

Following the Stage 3 independent governance review, Policy A Revision 2.1 is clarified and reinforced by the following enterprise principles:

1. **Mandatory Corrected Headcount Principle:**
   > *"Employee eligibility and payroll headcount authority must be established using an approved employee-status source that includes relevant effective dates and employment-status evidence. The observed payroll population must not automatically be treated as the verified active workforce."*

2. **Establishment of Six Population Concepts:**
   To eliminate ambiguity between database counts and legal workforce entitlement, systems must distinguish:
   - **Employee Master Population:** All 441 records in `employees.json`.
   - **Observed Payroll Population:** Count of unique employee vouchers in a run's payslip set.
   - **Verified Active Employee Population:** Individuals with verified active status and effective-dated HR documentation.
   - **Payroll-Eligible Population:** Active employees meeting period-specific compensation criteria.
   - **Itemized Payslip Population:** Actual payslip vouchers generated for the run.
   - **Approved Payroll Headcount:** Official headcount certified by the VP of HR in the pre-payroll roster snapshot.

3. **Explicit Documentation of Dataset Gaps:**
   The repository dataset lacks effective termination dates, historical status transitions, and approved roster snapshots. These are formally classified as **Data Gaps**.

4. **Decision Register Alignment:**
   Decision `DEC-A-02` is formally titled **Employee Eligibility and Headcount Authority**, requiring stakeholder confirmation. Status: `PROPOSED — APPROVAL PENDING`.

5. **Governance State Invariant:**
   This addendum forms part of the Stage 3 Governance Package. Policy A remains **PROPOSED — PENDING FORMAL APPROVAL**. Governance Gate 1 remains **LOCKED**.

