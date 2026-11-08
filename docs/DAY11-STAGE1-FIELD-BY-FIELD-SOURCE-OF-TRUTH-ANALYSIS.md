# DAY 11 — STAGE 1: FIELD-BY-FIELD SOURCE-OF-TRUTH ANALYSIS
## Definitive Investigation of Authoritative Evidence across the Six Core Payroll Dimensions
### (Revision 2.1 — Evidence Qualification & Authority Separation)

| Document Field | Value |
|---|---|
| **Project** | Aura Workforce by Growmar — Horizon Portal |
| **Phase** | Phase 3 — Teams and Insight |
| **Task** | Day 11 — Admin Payroll Run Console |
| **Stage** | Stage 1 of 6 — Establish the Source of Truth |
| **Document Identifier** | `docs/DAY11-STAGE1-FIELD-BY-FIELD-SOURCE-OF-TRUTH-ANALYSIS.md` |
| **Scope** | Complete empirical analysis of the 6 payroll data dimensions |
| **Policy Status** | **PROPOSED (REV 2.1) — PENDING FORMAL APPROVAL** |
| **Date** | November 7, 2026 |

---

## 1. Introduction & Methodology

A defensible source-of-truth framework cannot be established by architectural assumption or by declaring that "the database is always right." 

In strict compliance with Revision 2.1 standards, this analysis establishes three explicit evidence dimensions across all six payroll fields:
1. **Dimension A — Dataset Authority:**
   `DATASET AUTHORITY: ESTABLISHED FOR THE SUPPLIED SYNTHETIC BENCHMARK`  
   The supplied benchmark data pack (`03_Data_Pack/`) is the authoritative source for reproducing and analyzing records within this academic simulation.
2. **Dimension B — Mathematical Integrity:**
   `MATHEMATICAL INTEGRITY: VERIFIED WITHIN THE SUPPLIED DATASET`  
   The internal arithmetic relationships between line-item components and stored totals are verified down to exact integer paise ($1\text{ INR} = 100\text{ paise}$) with zero error.
3. **Dimension C — Legal and Accounting Authority:**
   `LEGAL/ACCOUNTING AUTHORITY: NOT ESTABLISHED FROM AVAILABLE EVIDENCE`  
   External documentary proof (employment compensation contracts, tax challans, general ledger journals, bank settlement statements) is unavailable in the codebase.

---

## 2. Field 1: Employee Population Source of Truth (Correction 1)

### 2.1 Definition & Objective
The population count of employees associated with a designated payroll period $[T_{\text{start}}, T_{\text{end}}]$.

### 2.2 Candidate Sources in the Repository
1. **Master Employee Roster (`employees.json` / `employees` table):** 441 individual employee master records with effective hire dates (`hire_date`).
2. **Itemized Payslip Population (`payslips.json` / `payslips` table):** Distinct `employee_id` counts grouped by `run_id`.
3. **Summary Payroll Run Header (`payroll_runs.json` / `payroll_runs` table):** Stored integer field `employees_paid`.

### 2.3 Empirical Evidence & Observed Dataset Populations

#### A. Master Employee Roster Observations
- All 441 employees have documented hire dates ranging from **January 31, 2012** (`EMP-0001`, CEO) to **September 28, 2026** (`EMP-0745`, Associate Software Engineer).
- **Absence of Lifecycle Tracking:** There are **zero termination dates**, resignation dates, or leave-of-absence records in `employees.json` or `prisma/dev.db`.
- Hire dates alone establish when an employee joined, but do not independently prove that the employee remained actively employed throughout subsequent periods.

#### B. Cross-Referencing Hire Dates Against Pay Periods

| Payroll Run | Period | Recorded Hire Date $\le \text{Period End}$ | Observed Payslip Population | Stored Run Header (`employees_paid`) | Difference ($\text{Observed} - \text{Header}$) |
|---|---|---:|---:|---:|---:|
| **PR-2026-04** | 2026-04-01 to 2026-04-30 | 388 | 388 | 413 | **-25** |
| **PR-2026-05** | 2026-05-01 to 2026-05-31 | 394 | 394 | 413 | **-19** |
| **PR-2026-06** | 2026-06-01 to 2026-06-30 | 406 | 406 | 421 | **-15** |
| **PR-2026-07** | 2026-07-01 to 2026-07-31 | 416 | 416 | 427 | **-11** |
| **PR-2026-08** | 2026-08-01 to 2026-08-31 | 424 | 424 | 429 | **-5** |
| **PR-2026-09** | 2026-09-01 to 2026-09-30 | 441 | 441 | 444 | **-3** |

#### C. Forensic Investigation of Specific Cohorts
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
4. **Employees `EMP-0442`, `EMP-0443`, `EMP-0444`:**
   - `EMP-0442` (Hire date: 2023-09-07) and `EMP-0443` (Hire date: 2023-09-12) are long-standing employees with payslips in all 6 runs.
   - `EMP-0444` does not exist in `employees.json` (unallocated ID gap in synthetic sequence).
5. **Employees `EMP-0425` through `EMP-0429`:**
   - `EMP-0425`, `EMP-0426`, `EMP-0428`, `EMP-0429` have recorded hire dates in July 2023 and payslips in all 6 runs.
   - `EMP-0427` does not exist in `employees.json` (unallocated ID gap).

### 2.4 Explicit Data Limitations
- Historical termination dates are unavailable in the repository.
- Leave-of-absence records and timesheets are unavailable.
- Employment eligibility cannot be independently established solely from hire dates.
- Payslip presence establishes a recorded payroll entry, not independent proof of active employment throughout the period.
- The 424 and 441 counts represent observed dataset populations, not independently certified workforce headcounts.

### 2.5 Proposed Source-of-Truth Hierarchy for Employee Population
```
PRIMARY CANDIDATE: Observed Payroll Population (payslips table for PR-2026-04..09)
SECONDARY VALIDATION: Recorded Hire-Date Cohort (employees table)
HISTORICAL REFERENCE: Unreconciled Upstream Payroll Header (payroll_runs.employees_paid)
STATUS: PROPOSED (REV 2.1) — PENDING FORMAL APPROVAL
```

---

## 3. Field 2: Gross Salary Source of Truth (Correction 2 & 3)

### 3.1 Definition & Objective
Gross compensation recorded for employees prior to statutory withholdings and deductions.

### 3.2 Candidate Sources in the Repository
1. **Itemized Payslips (`payslips.gross_pay`):** Individual gross amounts per employee.
2. **Component Breakdown in Payslips:** Sum of earnings components (`basic + hra + conveyance + medical + special_allowance + overtime_pay + variable_pay`).
3. **Payroll Run Header (`payroll_runs.total_gross`):** Stored batch header figure.

### 3.3 Empirical Findings & Evidence Separation
- **Mathematical Integrity:** In 100% of the 2,469 payslips, the discrete earnings components sum exactly to `gross_pay` with zero paise residual:
  $$\sum \text{Earnings Components} \equiv \text{gross\_pay} \quad (\text{Residual} = 0\text{ paise for all 2,469 rows})$$
  `MATHEMATICAL INTEGRITY: VERIFIED WITHIN THE SUPPLIED DATASET`
- **Contractual Authority:**
  "Stored gross-pay components are internally consistent within the supplied dataset. Underlying contractual compensation authority is not established."
  Signed salary letters, promotion revisions, and timesheet approvals are unavailable.
- **Header Status:**
  `UNRECONCILED UPSTREAM PAYROLL HEADER — GENERATION METHODOLOGY UNVERIFIED`
  Stored payroll header totals differ from the aggregate values calculated from the available itemized payslip records. The origin, calculation methodology and intended accounting meaning of the header values have not yet been independently established.

### 3.4 Numerical Verification across All Six Runs

| Run ID | Stored Header Gross (INR) | Itemized Sum Gross (INR) | Gross Variance (INR) |
|---|---:|---:|---:|
| **PR-2026-04** | 61,486,224.92 | 58,268,345.09 | -3,217,879.83 |
| **PR-2026-05** | 47,013,633.45 | 44,782,349.84 | -2,231,283.61 |
| **PR-2026-06** | 53,971,863.57 | 51,631,047.77 | -2,340,815.80 |
| **PR-2026-07** | 48,280,389.27 | 46,871,860.72 | -1,408,528.55 |
| **PR-2026-08** | 48,685,007.97 | 47,847,409.45 | -837,598.52 |
| **PR-2026-09** | 54,788,660.03 | 54,430,331.52 | -358,328.51 |

### 3.5 Proposed Source-of-Truth Hierarchy for Gross Salary
```
PRIMARY CANDIDATE (Employee Level): Stored payslips.gross_pay (dataset value)
PRIMARY CANDIDATE (Run Aggregate PR-2026-04..09): SUM(payslips.gross_pay) (itemized aggregate)
HISTORICAL REFERENCE (PR-2025-04..2026-03): Unreconciled Upstream Header payroll_runs.total_gross
STATUS: PROPOSED (REV 2.1) — PENDING FORMAL APPROVAL
```

---

## 4. Field 3: Deductions Source of Truth (Correction 2)

### 4.1 Definition & Objective
All statutory withholdings (PF, ESI, Professional Tax, TDS) and other deductions recorded on employee payslips.

### 4.2 Candidate Sources in the Repository
1. **Itemized Payslip Deductions (`payslips.total_deductions`):** Stored total deductions per payslip.
2. **Component Breakdown in Payslips:** Line items (`pf_employee + esi_employee + professional_tax + tds + other_deductions`).
3. **Implied Run Header Deductions:** Calculated difference: `payroll_runs.total_gross - payroll_runs.total_net`.

### 4.3 Empirical Findings & Evidence Separation
- **Mathematical Integrity:** In 100% of the 2,469 payslips, the deduction components sum to `total_deductions` with zero paise residual.
- **Statutory Authority:**
  "Stored deduction components are internally reconciled within the supplied dataset. Independent statutory filing and remittance authority have not been established."
  EPFO Electronic Challan cum Returns (ECR), ESIC receipts, and Form 24Q quarterly tax filings are unavailable in the repository.

### 4.4 Header vs. Itemized Deductions (Six Runs)

| Run ID | Implied Header Deductions (INR) | Itemized Sum Deductions (INR) | Deductions Variance (INR) |
|---|---:|---:|---:|
| **PR-2026-04** | 8,169,255.04 | 7,776,749.43 | -392,505.61 |
| **PR-2026-05** | 5,341,181.75 | 5,084,152.04 | -257,029.71 |
| **PR-2026-06** | 6,928,385.12 | 6,584,736.78 | -343,648.34 |
| **PR-2026-07** | 5,492,004.72 | 5,288,689.77 | -203,314.95 |
| **PR-2026-08** | 5,511,689.61 | 5,379,448.08 | -132,241.53 |
| **PR-2026-09** | 6,698,981.73 | 6,648,004.92 | -50,976.81 |

### 4.5 Proposed Source-of-Truth Hierarchy for Deductions
```
PRIMARY CANDIDATE (Employee Level): Stored payslips.total_deductions (dataset value)
PRIMARY CANDIDATE (Run Aggregate PR-2026-04..09): SUM(payslips.total_deductions)
HISTORICAL REFERENCE (PR-2025-04..2026-03): Derived Header Difference (total_gross - total_net)
STATUS: PROPOSED (REV 2.1) — PENDING FORMAL APPROVAL
```

---

## 5. Field 4: Net Salary Source of Truth (Correction 2 & 4)

### 5.1 The Four Separate Concepts of Net Pay and Accounting Authority
In strict accordance with Correction 4, technical documentation must never equate an itemized payslip aggregation with a certified general ledger balance or bank disbursement:

1. **A. Employee-Level Recorded Net Pay:**
   - Source: `payslips.net_pay`
   - Meaning: The net pay amount recorded for an individual employee in the supplied synthetic dataset.
   - Evidence Status: `DATASET VALUE — MATHEMATICALLY VERIFIED`
   - Legal Entitlement Status: `NOT INDEPENDENTLY ESTABLISHED`
   - Actual Payment Status: `NOT ESTABLISHED`
   - Required Statement: "`payslips.net_pay` is the recorded employee-level net amount in the supplied synthetic dataset. Its arithmetic consistency is verified, but independent legal entitlement and actual disbursement are not established."
2. **B. Itemized Payroll Aggregate:**
   - Source: `SUM(payslips.net_pay)`
   - Meaning: The calculated aggregate of employee-level net amounts for a specific payroll run.
   - Evidence Status: `DERIVED FROM ITEMIZED DATA`
   - Required Statement: "Itemized net-pay aggregation is the arithmetic total of the supplied employee-level payslip records. It may be used as the itemized payroll comparison basis, but it must not be represented as a verified general ledger balance or proof of bank settlement without corresponding external evidence."
3. **C. General Ledger Balance:**
   - Source: Formal general ledger accounts and journal vouchers.
   - Current Status: `NOT INDEPENDENTLY VERIFIED — GENERAL LEDGER EVIDENCE UNAVAILABLE`
   - No general ledger accounts, journals, or trial balances exist in the codebase.
4. **D. Actual Bank Settlement:**
   - Source: Verified commercial bank statements, payment batch files, or clearinghouse UTR records.
   - Current Status: `NOT ESTABLISHED FROM AVAILABLE EVIDENCE`
   - No banking transactions exist in the repository.

### 5.2 Mathematical Verification & Variance Balancing
- All 2,469 payslips balance perfectly down to $0\text{ paise}$ error:
  $$\text{gross\_pay} - \text{total\_deductions} \equiv \text{net\_pay} \quad (\text{Residual} = 0\text{ paise})$$
- In every run, the variance balances across dimensions:
  $$\Delta_{\text{Gross}} - \Delta_{\text{Deductions}} \equiv \Delta_{\text{Net}}$$

### 5.3 Net Salary Numerical Comparison Across All Six Runs

| Run ID | Stored Header Net (INR) | Itemized Sum Net (INR) | Net Variance (INR) |
|---|---:|---:|---:|
| **PR-2026-04** | 53,316,969.88 | 50,491,595.66 | -2,825,374.22 |
| **PR-2026-05** | 41,672,451.70 | 39,698,197.80 | -1,974,253.90 |
| **PR-2026-06** | 47,043,478.45 | 45,046,310.99 | -1,997,167.46 |
| **PR-2026-07** | 42,788,384.55 | 41,583,170.95 | -1,205,213.60 |
| **PR-2026-08** | 43,173,318.36 | 42,467,961.37 | -705,356.99 |
| **PR-2026-09** | 48,089,678.30 | 47,782,326.60 | -307,351.70 |

### 5.4 Proposed Source-of-Truth Hierarchy for Net Salary
```
PRIMARY CANDIDATE (Employee Level): Stored payslips.net_pay (dataset value, verified arithmetic)
PRIMARY CANDIDATE (Itemized Aggregate): SUM(payslips.net_pay) (itemized comparison basis)
GENERAL LEDGER BALANCE: NOT AVAILABLE (external evidence missing)
HISTORICAL REFERENCE (PR-2025-04..2026-03): Unreconciled Upstream Header payroll_runs.total_net
STATUS: PROPOSED (REV 2.1) — PENDING FORMAL APPROVAL
```

---

## 6. Field 5: Operational Payroll Status Source of Truth

### 6.1 Definition & Objective
The administrative lifecycle phase of a payroll run within the application's governance workflow.

### 6.2 Candidate Sources in the Repository
1. **`payroll_runs.status`:** Legacy status text (`"PAID"` for runs 1–17, `"POSTED - PAYMENT PENDING"` for run 18).
2. **`payroll_runs.approval_status`:** Audited workflow status (`"Pending"`, `"Approved"`, `"Rejected"`).
3. **`audit_logs` Table:** 87 historical entries logging administrative actions.

### 6.3 Empirical Findings & Proposed Hierarchy
- All 18 runs currently maintain `approval_status = 'Pending'`.
- `approved_at` and `approved_by_id` are NULL in all 18 runs.
- The maker-checker dual-control workflow is implemented in code (`approve/route.ts`).
```
PRIMARY CANDIDATE (Governance Approval): payroll_runs.approval_status corroborated by audit_logs
SECONDARY REFERENCE (Operational Status): payroll_runs.status (legacy system flag)
STATUS: PROPOSED (REV 2.1) — PENDING FORMAL APPROVAL
```

---

## 7. Field 6: Payment Status & Settlement Source of Truth (Correction 4)

### 7.1 Definition & Objective
Legal confirmation that net compensation funds have debited corporate disbursement accounts and settled into employee bank accounts.

### 7.2 Empirical Finding on Bank Authority
```
BANK SETTLEMENT AUTHORITY: NOT ESTABLISHED FROM AVAILABLE EVIDENCE
```
- **Zero Banking Records:** No table or column exists in `prisma/dev.db` for bank transactions, settlement batches, or disbursement reconciliations.
- **Zero Payment References:** Neither `payroll_runs` nor `payslips` contains a UTR number or transaction reference.
- **Prohibition on Inferring Settlement:** Settlement must **not** be inferred from:
  - A stored `"PAID"` string.
  - A payroll approval status.
  - A POSTED operational state.
  - A populated `pay_date` timestamp.
  - An itemized net-pay amount.

### 7.3 Proposed Source-of-Truth Hierarchy for Payment Status
```
PRIMARY CANDIDATE (Statutory Bank Settlement): NOT AVAILABLE FROM AVAILABLE EVIDENCE
SURROGATE / SYSTEM STATUS: Stored payroll_runs.status (unverified system text flag)
CLASSIFICATION: UNVERIFIED SYSTEM STATUS (Non-statutory)
STATUS: PROPOSED (REV 2.1) — PENDING FORMAL APPROVAL
```

---

## 8. Summary of Proposed Classifications (Revision 2.1)

| Dimension | Primary Proposed Source | Secondary / Historical Source | Authority Status |
|---|---|---|---|
| **1. Employee Population** | Observed Payroll Population (`payslips` count) | Hire-Date Cohort (`employees`) / Header | PROPOSED |
| **2. Gross Salary** | Itemized Gross (`payslips.gross_pay`) | Unreconciled Upstream Header (`total_gross`) | PROPOSED |
| **3. Deductions** | Itemized Deductions (`payslips.total_deductions`) | Derived Header Difference (`gross - net`) | PROPOSED |
| **4. Net Salary** | Itemized Net Pay (`payslips.net_pay`) | Unreconciled Upstream Header (`total_net`) | PROPOSED |
| **5. Operational Status** | `payroll_runs.approval_status` | `payroll_runs.status` / `audit_logs` | PROPOSED |
| **6. Payment Status** | External Bank Settlement (**UNAVAILABLE**) | Stored `status = 'PAID'` (Surrogate flag) | PROPOSED |
