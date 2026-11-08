# DAY 11 — EXTERNAL EVIDENCE VERIFICATION RESULTS
## Aura Workforce by Growmar — Horizon Portal
### Phase 3 — Teams and Insight | Day 11: Admin Payroll Run Console
### Post Gate 1 Quality Control | Substantive Verification Audit & Technical Evaluation Results

---

## Document Metadata

| Attribute | Specification |
|---|---|
| **Document ID** | `DAY11-EXTERNAL-EVIDENCE-VERIFICATION-RESULTS` |
| **Document Title** | Technical Verification Results & Accounting Audit across 5 Evidence Pillars |
| **Project & Phase** | Aura Workforce by Growmar — Horizon Portal / Phase 3 — Day 11 |
| **Governing Baseline** | Verification Procedures (`DAY11-EXTERNAL-EVIDENCE-VERIFICATION-PROCEDURES.md`), Policy E (`DAY11-STAGE3-POLICY-E-*`) |
| **Execution Mode** | Evidentiary Verification & Accounting Audit (Strictly Read-Only Documentation) |
| **Scope of Verification** | **5 Core Pillars / 14 External Artifacts** (GL, Treasury, Statutory Tax, HRMS, Governance) |
| **Verification Rule** | Verify only actual supplied files; record expected vs actual results; never force reconciliation. |
| **Execution Finding** | **NO NEW STAKEHOLDER RESPONSES OR EXTERNAL EVIDENCE WERE PROVIDED FOR VERIFICATION DURING THIS EXECUTION.** |
| **Substantive Result** | **14 of 14 Verifications Pending External Intake (`NOT_PROVIDED`)** |
| **Gate 1 Status** | **`GATE 1: LOCKED — FINANCIAL EXECUTION NOT AUTHORIZED`** |
| **Stage 4B Status** | **`STAGE 4B: NOT AUTHORIZED`** |
| **Date of Execution** | November 8, 2026 |

---

## 1. Executive Summary & Verification Architecture

This document records the technical verification results for incoming external evidence required to unlock Gate 1 and validate the six historical discrepancy payroll runs (April 2025, May 2025, June 2025, July 2025, August 2026, September 2026).

Verification is structured across the five core evidentiary pillars established in Stage 3:
1. **Pillar 1:** General Ledger Accounting Review (`EVID-GL-01`, `02`, `03`).
2. **Pillar 2:** Treasury & Commercial Banking Review (`EVID-BNK-01`, `02`, `03`, `04`).
3. **Pillar 3:** Statutory & Tax Remittance Review (`EVID-TAX-01`, `02`, `03`).
4. **Pillar 4:** Human Resources & Headcount Directive Review (`EVID-HR-02`).
5. **Pillar 5:** Corporate Governance & Audit Committee Review (`EVID-GOV-01`, `02`, `05`).

---

## 2. Pillar 1: General Ledger Evidence Review (`EVID-GL-01`, `02`, `03`)

### Accounting Framework & Four-Way Segregation
Under Policy E, the audit strictly preserves the fundamental segregation between four distinct financial representations:
1. **Payroll Item Totals:** The bottom-up mathematical aggregation of all itemized payslips ($\sum \text{Gross} = ₹30,38,31,344.39$, $\sum \text{Net} = ₹26,70,69,563.37$ across 2,469 payslips).
2. **Payroll Run Header Totals:** The pre-calculated totals stored in `payroll_runs` across the six historical runs ($\sum \text{Gross} = ₹31,42,25,779.21$, $\sum \text{Net} = ₹27,60,84,281.24$ across 2,547 header employee records).
*(Scope note: Previously cited draft figures of ₹10.36 Cr, ₹10.47 Cr, and ₹13.75 Lakh were unestablished illustrative figures and have been formally reconciled in `docs/DAY11-PAYROLL-NET-FIGURE-SCOPE-RECONCILIATION.md` and `docs/DAY11-GL-VARIANCE-SCOPE-RECONCILIATION.md`).*
3. **General Ledger Balances:** The double-entry account balances posted in the enterprise ERP trial balance.
4. **Posted Accounting Journals:** The individual journal vouchers debited to wage expenses (`GL-6100`) and credited to payroll clearing/liabilities.

> [!WARNING]
> **Zero Forced Matching:** The reconciliation engine must **never** force General Ledger figures to match payroll figures. Unexplained variances must be recorded in the variance absorption ledger and submitted to the Corporate Controller.

### Ten-Point GL Verification Protocol:
| # | Verification Check Item | Acceptance Standard | Expected Result | Actual Result During Execution | Evaluation Status |
|---|---|---|---|---|---|
| 1 | Corporate Source & Issuing Authority | Official export from certified ERP (SAP/Oracle) | Controller-signed system extract | *No artifact supplied* | `NOT_VERIFIABLE (PENDING INTAKE)` |
| 2 | Accounting Period | Continuous coverage (Scope pending stakeholder confirmation; see `DAY11-EVIDENCE-REPORTING-PERIOD-CLARIFICATION.md`) | 18 historical months proposed / 6 discrepancy months minimum | *No artifact supplied* | `NOT_VERIFIABLE (PENDING INTAKE)` |
| 3 | Account Identifiers | Active chart of accounts matching standard corporate COA | Gross (`6100`), Tax (`2120`), Net (`2110`) | *No artifact supplied* | `NOT_VERIFIABLE (PENDING INTAKE)` |
| 4 | Journal Voucher References | Sequential JV numbers with booking timestamps and approvers | Certified JV headers for each run | *No artifact supplied* | `NOT_VERIFIABLE (PENDING INTAKE)` |
| 5 | Debit and Credit Values | Arithmetic double-entry tie-out: $\sum \text{Debits} == \sum \text{Credits}$ | Variance = ₹0.00 exactly | *No artifact supplied* | `NOT_VERIFIABLE (PENDING INTAKE)` |
| 6 | Payroll Expense Account Mapping | Wage expense debits matching itemized gross pay | Tie-out to within approved tolerance | *No artifact supplied* | `NOT_VERIFIABLE (PENDING INTAKE)` |
| 7 | Payroll Liability Account Mapping | Clearing liability credits matching net pay and deductions | Complete balance zero-out on clearing | *No artifact supplied* | `NOT_VERIFIABLE (PENDING INTAKE)` |
| 8 | Relevant Payroll Run References | Traceable batch references linking JV to Horizon run IDs | Direct reference to 18 Run IDs | *No artifact supplied* | `NOT_VERIFIABLE (PENDING INTAKE)` |
| 9 | Reconciliation Completeness | Identification of header vs. payslip basis used by accounting | Clarification whether ERP used header or slips | *No artifact supplied* | `NOT_VERIFIABLE (PENDING INTAKE)` |
| 10 | Unexplained Differences | Complete identification of all variances exceeding ₹0.00 | Variance journal entries documented | *No artifact supplied* | `NOT_VERIFIABLE (PENDING INTAKE)` |

---

## 3. Pillar 2: Treasury & Banking Evidence Review (`EVID-BNK-01` through `04`)

### Six-Layer Banking Settlement Hierarchy
Treasury verification strictly maintains the distinction across six distinct transaction layers:
$$\text{Marked 'PAID' in App} \neq \text{Bank Debit} \neq \text{Batch Instruction} \neq \text{Beneficiary Credit} \neq \text{Confirmed Settlement} \neq \text{Return / Reversal}$$
*Never infer successful settlement from a database status or consolidated corporate bank debit alone.*

### Ten-Point Treasury & Banking Verification Protocol:
| # | Verification Check Item | Acceptance Standard | Expected Result | Actual Result During Execution | Evaluation Status |
|---|---|---|---|---|---|
| 1 | Bank-Issued Statement Source | Official commercial bank statements with bank digital signature | Direct bank statement export | *No artifact supplied* | `NOT_VERIFIABLE (PENDING INTAKE)` |
| 2 | Relevant Transaction Period | Bank statements covering relevant runs (Scope pending stakeholder confirmation; see `DAY11-EVIDENCE-REPORTING-PERIOD-CLARIFICATION.md`) | 18 historical months proposed / 6 discrepancy months minimum | *No artifact supplied* | `NOT_VERIFIABLE (PENDING INTAKE)` |
| 3 | Consolidated Payroll Debit | Bank debit entries matching total disbursement instructions | Debit amount reconciling to net pay | *No artifact supplied* | `NOT_VERIFIABLE (PENDING INTAKE)` |
| 4 | Batch Payout References | Corporate batch reference numbers matching bank debits | 1-to-1 batch ID alignment | *No artifact supplied* | `NOT_VERIFIABLE (PENDING INTAKE)` |
| 5 | Beneficiary UTR Identifiers | 100% Unique Transaction Reference (UTR) coverage for slips | 2,469 valid bank clearing UTRs | *No artifact supplied* | `NOT_VERIFIABLE (PENDING INTAKE)` |
| 6 | Returned / Bounced Payments | Log of rejected ACH/NEFT transactions with bank reason codes | Rejection log with return dates | *No artifact supplied* | `NOT_VERIFIABLE (PENDING INTAKE)` |
| 7 | Reversal Transactions | Credit reversals posted back to payroll clearing account | Verified bank credit adjustments | *No artifact supplied* | `NOT_VERIFIABLE (PENDING INTAKE)` |
| 8 | Unmatched Beneficiary Credits | Analysis of payslips without matching bank UTR records | Zero unmatched slips without waiver | *No artifact supplied* | `NOT_VERIFIABLE (PENDING INTAKE)` |
| 9 | Duplicate Transactions | Scan for duplicate bank debits or repeated UTR numbers | Zero duplicate beneficiary payments | *No artifact supplied* | `NOT_VERIFIABLE (PENDING INTAKE)` |
| 10 | Treasury Banking-Model Sign-Off | Formal sign-off on hybrid settlement model (Template 15.1) | Signed Treasurer determination | *No artifact supplied* | `NOT_VERIFIABLE (PENDING INTAKE)` |

---

## 4. Pillar 3: Statutory & Tax Evidence Review (`EVID-TAX-01`, `02`, `03`)

Statutory compliance cannot be established solely from internally generated payroll records; external statutory portal records are required.

### Statutory Verification Criteria:
1. **EPFO (Provident Fund) — `EVID-TAX-01`:**
   - Electronic Challan cum Return (ECR) for all 18 wage months.
   - 13-digit Temporary Return Reference Number (TRRN) verified on the EPFO unified employer portal.
   - Bank payment confirmation receipts with transaction dates on or before the 15th of the following month.
   - Tie-out: Employee PF deductions ($12\%$) plus Employer contributions ($12\%$ EPF/EPS) matching challan sums.
   - *Current Status:* `NOT_VERIFIABLE (PENDING INTAKE)` — No TRRN receipts supplied.
2. **ESIC (State Insurance) — `EVID-TAX-02`:**
   - Monthly contribution challans with 17-digit Challan Payment Identification Number (CPIN).
   - Validation of eligible employee population (gross wage $\le ₹21,000$).
   - Tie-out: Employee contribution ($0.75\%$) plus Employer contribution ($3.25\%$) matching paid challans.
   - *Current Status:* `NOT_VERIFIABLE (PENDING INTAKE)` — No CPIN receipts supplied.
3. **Income Tax TDS (Section 192) — `EVID-TAX-03`:**
   - Quarterly Form 24Q filing acknowledgments (Provisional Receipts) for Q1–Q4 FY25–26 and Q1–Q2 FY26–27.
   - ITNS 281 challans with verified 7-digit BSR code, deposit date, and 5-digit Challan Serial Number (CIN).
   - Section 192 TDS deductions from all 2,469 payslips mapped to quarterly Annexures.
   - *Current Status:* `NOT_VERIFIABLE (PENDING INTAKE)` — No Form 24Q acknowledgments supplied.

---

## 5. Pillar 4: HR & Headcount Evidence Review (`EVID-HR-02`)

### Employee Status Directive Criteria:
- **Authoritative Master Roster:** Written designation by VP HR establishing whether the primary HRMS (Workday/Darwinbox) or the Horizon database serves as the legal source of truth.
- **Six-Population Classification:** Ratification of the employee status taxonomy:
  1. Active standard employees.
  2. New joiners during pay period.
  3. Voluntary resignations during pay period.
  4. Involuntary terminations during pay period.
  5. Unpaid leave / sabbatical / loss of pay.
  6. External contractors / non-payroll staff.
- **Point-in-Time Status Verification:**
  - August 2026: Resolution of the 20-employee discrepancy between header headcount ($160$) and payslips ($140$).
  - September 2026: Resolution of the 13-employee discrepancy between header headcount ($160$) and payslips ($147$).
- *Current Status:* `NOT_VERIFIABLE (PENDING INTAKE)` — No written directive supplied.

---

## 6. Pillar 5: Corporate Governance & Audit Review (`EVID-GOV-01`, `02`, `05`)

### Governance & Quorum Review:
- **Policy Ratification (`EVID-GOV-01`):** Requires signed voting determination records (Template 1) for Policies A through E.
- **Monetary Approval Threshold (`EVID-GOV-02`):** Requires joint determination paper signed by Controller and CFO establishing the basis (Gross, Net, Variance, Headcount, or Hybrid) and ceiling. The ₹5,00,000 threshold remains strictly illustrative until this document is executed.
- **Independent Audit Concurrence (`EVID-GOV-05`):** Requires formal sign-off letter (`COND-16` / `PRQ-20`) on corporate letterhead from the Audit Committee Chair.
- **Quorum Requirement Status:**
  > `PROPOSED QUORUM REQUIREMENT — FORMAL CORPORATE AUTHORITY NOT YET VERIFIED.`
  Any claim of a four-officer unanimous quorum remains a proposed recommendation until formal corporate authority is provided.

---

## 7. Master Verification Results Summary (14 Artifacts)

```
========================================================================================================================
                               MASTER EXTERNAL EVIDENCE VERIFICATION RESULTS
========================================================================================================================
```

| Evidence ID | Required Artifact | Pillar | Responsible Stakeholder | Receipt Date | Authenticity Status | Completeness Status | Mathematical Tie-Out | Current Verification Result |
|---|---|---|---|---|---|---|---|---|
| **EVID-GL-01** | ERP Chart of Accounts | General Ledger | Corporate Controller | *Not Received* | `NOT_VERIFIABLE` | `NOT_VERIFIABLE` | `NOT_VERIFIABLE` | `PENDING_INTAKE` |
| **EVID-GL-02** | Historical ERP GL Trial Balances | General Ledger | Corporate Controller | *Not Received* | `NOT_VERIFIABLE` | `NOT_VERIFIABLE` | `NOT_VERIFIABLE` | `PENDING_INTAKE` |
| **EVID-GL-03** | `GL-6100` Wage Expense Postings | General Ledger | Corporate Controller | *Not Received* | `NOT_VERIFIABLE` | `NOT_VERIFIABLE` | `NOT_VERIFIABLE` | `PENDING_INTAKE` |
| **EVID-BNK-01** | Bank Statements (Debits) | Treasury/Banking | Corporate Treasurer | *Not Received* | `NOT_VERIFIABLE` | `NOT_VERIFIABLE` | `NOT_VERIFIABLE` | `PENDING_INTAKE` |
| **EVID-BNK-02** | Beneficiary UTR Numbers | Treasury/Banking | Corporate Treasurer | *Not Received* | `NOT_VERIFIABLE` | `NOT_VERIFIABLE` | `NOT_VERIFIABLE` | `PENDING_INTAKE` |
| **EVID-BNK-03** | Bounced Payment Exception Logs | Treasury/Banking | Corporate Treasurer | *Not Received* | `NOT_VERIFIABLE` | `NOT_VERIFIABLE` | `NOT_VERIFIABLE` | `PENDING_INTAKE` |
| **EVID-BNK-04** | Treasurer Banking Model Sign-Off | Treasury/Banking | Corporate Treasurer | *Not Received* | `NOT_VERIFIABLE` | `NOT_VERIFIABLE` | `NOT_VERIFIABLE` | `PENDING_INTAKE` |
| **EVID-TAX-01** | EPFO ECR & TRRN Receipts | Statutory Tax | Head of Tax Operations | *Not Received* | `NOT_VERIFIABLE` | `NOT_VERIFIABLE` | `NOT_VERIFIABLE` | `PENDING_INTAKE` |
| **EVID-TAX-02** | ESIC Challans & CPIN | Statutory Tax | Head of Tax Operations | *Not Received* | `NOT_VERIFIABLE` | `NOT_VERIFIABLE` | `NOT_VERIFIABLE` | `PENDING_INTAKE` |
| **EVID-TAX-03** | TDS Form 24Q & ITNS 281 | Statutory Tax | Head of Tax Operations | *Not Received* | `NOT_VERIFIABLE` | `NOT_VERIFIABLE` | `NOT_VERIFIABLE` | `PENDING_INTAKE` |
| **EVID-HR-02** | VP HR Status Source Directive | HR / Headcount | VP of Human Resources | *Not Received* | `NOT_VERIFIABLE` | `NOT_VERIFIABLE` | `NOT_VERIFIABLE` | `PENDING_INTAKE` |
| **EVID-GOV-01** | Policy Voting Records (A–E) | Governance | Governance Committee / CFO | *Not Received* | `NOT_VERIFIABLE` | `NOT_VERIFIABLE` | `NOT_VERIFIABLE` | `PENDING_INTAKE` |
| **EVID-GOV-02** | Signed DEC-C-02 Threshold Paper | Governance | Controller & CFO | *Not Received* | `NOT_VERIFIABLE` | `NOT_VERIFIABLE` | `NOT_VERIFIABLE` | `PENDING_INTAKE` |
| **EVID-GOV-05** | Audit Committee Concurrence Letter | Governance | Audit Committee Chair | *Not Received* | `NOT_VERIFIABLE` | `NOT_VERIFIABLE` | `NOT_VERIFIABLE` | `PENDING_INTAKE` |

---

## 8. Execution Verification Finding & Stop Condition

```
===========================================================================================
NO NEW STAKEHOLDER RESPONSES OR EXTERNAL EVIDENCE WERE PROVIDED FOR VERIFICATION
DURING THIS EXECUTION.
===========================================================================================
```

Zero external files were supplied or deposited during this execution. Consequently, all 14 substantive technical reviews remain in the `PENDING_INTAKE` status. No evidence has been verified, approved, or promoted.

- **Gate 1 Status:** **`LOCKED — FINANCIAL EXECUTION NOT AUTHORIZED`**.
- **Stage 4B Status:** **`NOT AUTHORIZED`**.

