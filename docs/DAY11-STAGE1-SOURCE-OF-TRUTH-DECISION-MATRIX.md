# DAY 11 — STAGE 1: SOURCE-OF-TRUTH DECISION MATRIX
## Enterprise Evaluation Matrix for Historical and Operational Payroll Reconciliation
### (Revision 2.1 — Evidence Qualification & Authority Separation)

| Document Field | Value |
|---|---|
| **Project** | Aura Workforce by Growmar — Horizon Portal |
| **Phase** | Phase 3 — Teams and Insight |
| **Task** | Day 11 — Admin Payroll Run Console |
| **Stage** | Stage 1 of 6 — Establish the Source of Truth |
| **Document Identifier** | `docs/DAY11-STAGE1-SOURCE-OF-TRUTH-DECISION-MATRIX.md` |
| **Governance State** | **GATE 1: LOCKED — NO FINANCIAL EXECUTION AUTHORIZED** |
| **Matrix Status** | **PROPOSED (REV 2.1) — PENDING FORMAL APPROVAL** |
| **Date** | November 7, 2026 |

---

## 1. Classification Taxonomy & Evidence Dimensions

In strict accordance with Revision 2.1 guidelines, every source candidate is evaluated across three distinct dimensions:
1. **Dataset Authority:** Benchmark reference authority within the supplied synthetic project dataset.
2. **Mathematical Verification:** Exact integer paise arithmetic consistency ($1\text{ INR} = 100\text{ paise}$).
3. **Legal / Accounting Authority:** External statutory, contractual, and banking substantiation.

### Source Classification Taxonomy
- **PRIMARY CANDIDATE:** The highest-fidelity data source recommended within the dataset.
- **SECONDARY VALIDATION SOURCE:** An independent data source used to cross-check records.
- **DERIVED SOURCE:** A calculated value computed from component fields or identities.
- **HISTORICAL REFERENCE:** An unitemized aggregate record preserved where underlying vouchers do not exist.
- **UNRECONCILED UPSTREAM HEADER:** A batch record whose totals differ from itemized sums and whose generation methodology is unverified.
- **UNVERIFIED SYSTEM STATUS:** A text string present in application tables lacking external corroboration.
- **NOT AVAILABLE:** An essential accounting record type (e.g. bank settlement statement) that does not exist in the repository.

---

## 2. Definitive Source-of-Truth Decision Matrix (Revision 2.1)

| Payroll Field | Candidate Sources | Observed Evidence in Repository | Proposed Source | Evidence Classification | Mathematical Verification | Legal / Accounting Authority | What It Establishes vs. What It Does Not Establish | Known Limitations | Approval Status |
|---|---|---|---|---|---|---|---|---|---|
| **1. Employee Population (Headcount)** | 1. Master Roster (`employees`)<br>2. Itemized Payslips (`payslips`)<br>3. Summary Run Header (`payroll_runs.employees_paid`) | • 441 employees cataloged with hire dates (2012 to 2026).<br>• Exactly 424 employees with hire dates $\le$ Aug 31, 2026; exactly 424 August payslips present.<br>• Exactly 17 employees (`EMP-0729`..`0745`) with hire dates in Sep 2026; exactly 17 corresponding Sep payslips present.<br>• 0 termination dates in DB.<br>• Stored headers: 429 (Aug) and 444 (Sep). | **Observed Payroll Population** (`payslips` table) for PR-2026-04..09;<br>**Master Roster** for validation;<br>**Stored Header** for PR-2025-04..2026-03 | **PRIMARY CANDIDATE** (PR-2026-04..09)<br><br>**SECONDARY VALIDATION** (`employees` roster)<br><br>**HISTORICAL REFERENCE** (PR-2025-04..2026-03) | **N/A** (Count of records verified: 424 Aug, 441 Sep) | **NOT ESTABLISHED** (Independent proof of ongoing employment unavailable) | **Establishes:** Recorded hire dates and payslip presence in the dataset.<br><br>**Does NOT establish:** Verified active employment or statutory eligibility throughout the period. | Termination and leave-of-absence records are unavailable. Runs PR-2025-04..2026-03 lack itemized vouchers. | **PROPOSED — PENDING FORMAL APPROVAL** |
| **2. Gross Salary** | 1. Itemized Payslip Gross (`payslips.gross_pay`)<br>2. Sum of Earnings Components<br>3. Summary Run Header (`payroll_runs.total_gross`) | • 2,469 payslips inspected in BigInt paise.<br>• $\sum \text{Earnings Components} \equiv \text{gross\_pay}$ in 100% of rows (0 residual).<br>• Header gross exceeds itemized sum across all 6 runs.<br>• No retroactive adjustments table. | **Itemized Payslip Gross** (`payslips.gross_pay`) at employee level;<br>**SUM(`gross_pay`)** at run aggregate | **PRIMARY CANDIDATE** (Employee & Run Aggregate)<br><br>**DERIVED SOURCE** (Component sum validation)<br><br>**HISTORICAL REFERENCE** (Legacy Headers) | **VERIFIED** down to 0 paise residual across all 2,469 rows | **NOT ESTABLISHED** (Underlying contractual compensation authority unavailable) | **Establishes:** Internal arithmetic consistency of earnings within the dataset.<br><br>**Does NOT establish:** Contractual salary authority, signed compensation letters, or approved timesheets. | Signed compensation letters and timesheet approvals are absent from repository. | **PROPOSED — PENDING FORMAL APPROVAL** |
| **3. Deductions** | 1. Itemized Deductions (`payslips.total_deductions`)<br>2. Component breakdown (`pf`, `esi`, `pt`, `tds`)<br>3. Implied Header Deductions (`total_gross - total_net`) | • Deduction components sum exactly to `total_deductions` in 100% of 2,469 payslips.<br>• No explicit deductions column exists in legacy `payroll_runs` header schema.<br>• No tax challans or EPFO ECR files present. | **Itemized Deductions** (`payslips.total_deductions`) backed by component breakdown;<br>**Derived Header** (`gross - net`) for legacy runs | **PRIMARY CANDIDATE** (PR-2026-04..09 Itemized)<br><br>**DERIVED SOURCE** (Component validation)<br><br>**DERIVED HISTORICAL REFERENCE** (Legacy Header difference) | **VERIFIED** down to 0 paise residual across all 2,469 rows | **NOT ESTABLISHED** (Statutory filing and remittance receipts unavailable) | **Establishes:** Internal component reconciliation within the supplied dataset.<br><br>**Does NOT establish:** Statutory filing authority, tax remittance, or EPFO/ESIC deposits. | Statutory remittance receipts (challans) and tax filing acknowledgments (Form 24Q) are absent. | **PROPOSED — PENDING FORMAL APPROVAL** |
| **4. Net Salary** | 1. Itemized Net Pay (`payslips.net_pay`)<br>2. Derived Net Pay (`gross_pay - total_deductions`)<br>3. Itemized Net Sum (`SUM(payslips.net_pay)`)<br>4. General Ledger Balance<br>5. Summary Run Header (`payroll_runs.total_net`) | • 2,469 payslips verified in integer paise.<br>• $\text{Gross} - \text{Deductions} \equiv \text{Net}$ in 100% of rows (0 residual).<br>• Variance balances: $\Delta_{\text{Gross}} - \Delta_{\text{Ded}} = \Delta_{\text{Net}}$ across all 6 runs.<br>• Header net exceeds itemized sum. | **Itemized Net Pay** (`payslips.net_pay`) at employee level;<br>**SUM(`net_pay`)** for itemized comparison basis;<br>**Stored Header** for legacy runs | **PRIMARY CANDIDATE** (Employee Recorded Pay & Itemized Aggregate)<br><br>**DERIVED SOURCE** (Mathematical verification)<br><br>**HISTORICAL REFERENCE** (PR-2025-04..2026-03 Headers)<br><br>**NOT AVAILABLE** (GL Balance) | **VERIFIED** down to 0 paise residual across all 2,469 rows | **NOT ESTABLISHED** (Legal employee entitlement, GL balance, and actual payment unavailable) | **Establishes:** Recorded employee-level net amount and aggregate itemized sum.<br><br>**Does NOT establish:** Legal entitlement, general ledger authority, or actual bank settlement. | General ledger journal entries and bank disbursement accounts are absent. | **PROPOSED — PENDING FORMAL APPROVAL** |
| **5. Operational Status** | 1. `payroll_runs.status`<br>2. `payroll_runs.approval_status`<br>3. `audit_logs` table (87 entries) | • All 18 runs currently maintain `approval_status = 'Pending'`.<br>• `approved_at` and `approved_by_id` are NULL in all 18 runs.<br>• Maker-checker route enforces dual-control role-based security.<br>• 87 audit entries log historical actions. | **`payroll_runs.approval_status`** corroborated by immutable `audit_logs` entries | **PRIMARY CANDIDATE** (Governance Approval State)<br><br>**SECONDARY VALIDATION** (`audit_logs`)<br><br>**HISTORICAL REFERENCE** (`payroll_runs.status` legacy string) | **N/A** (Workflow state matching) | **ESTABLISHED FOR WORKFLOW** (Internal application lifecycle state) | **Establishes:** Application workflow state where corroborated by audit logs.<br><br>**Does NOT establish:** Bank disbursement or external treasury authorization. | Legacy client UI code may still reference `status` for display chips. | **PROPOSED — PENDING FORMAL APPROVAL** |
| **6. Payment Status** | 1. Stored string `'PAID'` in `payroll_runs.status`<br>2. Stored `pay_date` timestamp<br>3. External bank settlement evidence | • Stored `status = 'PAID'` exists for runs 1–17.<br>• `pay_date` is populated for runs 1–17, NULL for run 18.<br>• Zero banking tables exist in DB.<br>• Zero UTR or transaction numbers exist in data pack. | **NOT AVAILABLE** (Statutory Bank Settlement);<br>**Surrogate Status:** Stored `payroll_runs.status` | **NOT AVAILABLE** (Legal Settlement Authority)<br><br>**UNVERIFIED SOURCE** (Stored `'PAID'` text string) | **N/A** (No banking data to calculate) | **NOT ESTABLISHED FROM AVAILABLE EVIDENCE** | **Establishes:** Presence of a text flag `'PAID'` in the sample dataset.<br><br>**Does NOT establish:** Actual bank settlement, funds debit, or worker receipt of pay. | External banking integration, clearinghouse records, and disbursement manifests are absent. | **PROPOSED — PENDING FORMAL APPROVAL** |

---

## 3. Discrepancy Classification Mapping (Revision 2.1)

Per `docs/DAY11-DISCREPANCY-CLASSIFICATION-STANDARD.md`:

```
DISCREPANCY CLASSIFICATION: Category 4 — Upstream Planning or Reporting Variance
HEADER CLASSIFICATION: UNRECONCILED UPSTREAM PAYROLL HEADER — GENERATION METHODOLOGY UNVERIFIED
HYPOTHESIS 1: TIMING_AND_ROSTER_LAG (UNVERIFIED HYPOTHESIS — ROOT CAUSE NOT ESTABLISHED)
HYPOTHESIS 2: SYSTEM_BATCH_HEADER_CALCULATION_DEFECT (UNVERIFIED HYPOTHESIS — ROOT CAUSE NOT ESTABLISHED)
```

Stored payroll header totals differ from the aggregate values calculated from the available itemized payslip records. The origin, calculation methodology and intended accounting meaning of the header values have not yet been independently established. Neither hypothesis may be declared a confirmed root cause until Stage 2 investigation provides evidence.

---

## 4. Governance Sign-Off Requirements

| Decision Field | Required Corporate Approver | Role Code | Current Status |
|---|---|---|---|
| Employee Population Authority | VP Human Resources | HR-VP-01 | **PENDING** |
| Gross Salary Authority | Head of Financial Planning & Analysis (FP&A) | FPA-HEAD-01 | **PENDING** |
| Deductions Authority | Head of Tax & Statutory Compliance | TAX-HEAD-01 | **PENDING** |
| Net Salary Authority | Chief Financial Officer (CFO) | CFO-EXEC-01 | **PENDING** |
| Operational Status Authority | Director of Internal Audit | AUDIT-DIR-01 | **PENDING** |
| Payment Status Authority | Corporate Treasurer | TREAS-01 | **PENDING** |

---

## 5. Stage 3 Governance Review Addendum (Employee Eligibility & Headcount Authority)

Following the Stage 3 independent governance review:
1. **Mandatory Corrected Headcount Principle:**
   > *"Employee eligibility and payroll headcount authority must be established using an approved employee-status source that includes relevant effective dates and employment-status evidence. The observed payroll population must not automatically be treated as the verified active workforce."*
2. **Six Distinct Population Definitions Established:**
   - Employee Master Population (441 records in `employees.json`).
   - Observed Payroll Population (unique employee payslips present in the run).
   - Verified Active Employee Population (active, un-terminated status supported by verified HR documentation).
   - Payroll-Eligible Population (active employees meeting period compensation criteria).
   - Itemized Payslip Population (actual generated payslips for the run).
   - Approved Payroll Headcount (formal headcount certified by VP of HR in pre-payroll snapshot).
3. **Decision DEC-A-02 Formal Alignment:**
   `DEC-A-02 — Employee Eligibility and Headcount Authority` requires VP HR formal confirmation of the authoritative status source. Status: `PROPOSED — APPROVAL PENDING`.
4. **Governance Invariant:**
   Matrix remains **PROPOSED (REV 2.1) — PENDING FORMAL APPROVAL**. Governance Gate 1 remains **LOCKED**.

---

*This decision matrix is proposed for review only. No financial values, headers, or records have been altered.*
