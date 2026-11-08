# DAY 11 — AUGUST 2026 (`PR-2026-08`) FORENSIC ROOT-CAUSE REPORT
**Project:** Aura Workforce by Growmar — Horizon Portal  
**Phase:** Phase 3 — Day 11: Admin Payroll Run Console  
**Run Identifier:** `PR-2026-08`  
**Pay Period:** August 1, 2026 – August 31, 2026  
**Pay Date:** September 1, 2026 (`2026-09-01`)  
**Operational Status:** `PAID` | **Approval Status:** `Approved` (Historical)  
**Date of Audit:** November 7, 2026 (Updated)  
**Auditor:** Senior Payroll Systems Architect, Financial Data Auditor & QA Lead  
**Canonical Classification:** **Category 4 — Upstream Planning or Reporting Variance**  

---

## 1. Executive Summary & Verification Context

This report delivers the comprehensive forensic investigation into the historical payroll run for August 2026 (`PR-2026-08`).

Under official requirements, a historical tie-out demands exact equality between the stored run header totals and the sum of the constituent payslips:
$$\text{Header Headcount} = \text{Itemized Headcount}$$
$$\text{Header Gross} = \text{Itemized Gross}$$
$$\text{Header Deductions} = \text{Itemized Deductions}$$
$$\text{Header Net} = \text{Itemized Net}$$

This audit establishes why `PR-2026-08` cannot satisfy these equations in the source dataset, why no missing payslips exist for active personnel, and why the run is correctly evaluated by the software reconciliation engine as **`BLOCKED (MISMATCH)`**.

---

## 2. Independent BigInt Paise Calculations

Calculated directly from `03_Data_Pack/payroll_runs.json` and `03_Data_Pack/payslips.json` using exact 64-bit integer paise ($1\text{ INR} = 100\text{ paise}$):

$$\text{Variance} = \text{Itemized Total} - \text{Stored Header Total}$$

### 2.1 Stored Run Header Figures (`PR-2026-08`)
- **Headcount (`employees_paid`):** `429`
- **Gross Pay (`total_gross`):** `₹48,685,007.97` ($4,868,500,797\text{ paise}$)
- **Net Pay (`total_net`):** `₹43,173,318.36` ($4,317,331,836\text{ paise}$)
- **Implied Header Deductions ($\text{Gross} - \text{Net}$):** `₹5,511,689.61` ($551,168,961\text{ paise}$)
- **Operational Status:** `PAID`
- **Disbursement Pay Date:** `2026-09-01`

### 2.2 Itemized Payslip Totals (424 Payslips)
- **Headcount:** `424` (424 unique employees, 0 duplicates)
- **Gross Pay:** `₹47,847,409.45` ($4,784,740,945\text{ paise}$)
- **Deductions:** `₹5,379,448.08` ($537,944,808\text{ paise}$)
- **Net Pay:** `₹42,467,961.37` ($4,246,796,137\text{ paise}$)

### 2.3 Calculated Discrepancies & Variances
| Financial Dimension | Stored Header | Itemized Payslips | Variance (Paise) | Variance (Rupees) | Variance % |
|---|---:|---:|---:|---:|---:|
| **Headcount** | 429 | 424 | -5 | -5 employees | -1.17% |
| **Gross Pay** | ₹48,685,007.97 | ₹47,847,409.45 | -83,759,852 | -₹837,598.52 | -1.72% |
| **Deductions** | ₹5,511,689.61 | ₹5,379,448.08 | -13,224,153 | -₹132,241.53 | -2.40% |
| **Net Pay** | ₹43,173,318.36 | ₹42,467,961.37 | -70,535,699 | -₹705,356.99 | -1.63% |

### 2.4 Mathematical Proof & Zero-Residual Balance
1. **Payslip Line-Item Invariance:**
   $$\sum \text{Gross} - \sum \text{Deductions} = 4,784,740,945\text{ paise} - 537,944,808\text{ paise} = 4,246,796,137\text{ paise} = \sum \text{Net}$$
   *Residual Error across all 424 payslips:* **$0\text{ paise}$ ($₹0.000000$)**. Every single payslip balances to the exact paisa.
2. **Variance Consistency Invariance:**
   $$\text{Gross Variance} - \text{Deductions Variance} = -83,759,852\text{ paise} - (-13,224,153\text{ paise}) = -70,535,699\text{ paise} = \text{Net Variance}$$

---

## 3. Forensic Investigation of the Ten Specific Audit Questions

### 1. Identify all 424 reported payslips
All 424 payslips are present in `03_Data_Pack/payslips.json` under `run_id = 'PR-2026-08'` (spanning item IDs `PI-006488` through `PI-006911`).

### 2. Verify unique employee IDs
Querying all employee IDs in `PR-2026-08` yields exactly 424 distinct values.

### 3. Identify duplicates
Duplicate count is exactly **0** (`duplicates = 0`). No employee appears more than once.

### 4. Verify gross, deductions, and net for every payslip
Every payslip was individually evaluated using integer paise. In 100.00% of cases (424 / 424), $\text{basic} + \text{hra} + \text{allowances} + \dots = \text{gross}$, statutory deductions sum to $\text{total\_deductions}$, and $\text{gross} - \text{total\_deductions} = \text{net}$.

### 5. Compare employee IDs against the authoritative August payroll population
The company master roster (`03_Data_Pack/employees.json`) contains exactly 441 employees across all time.
- As of August 31, 2026, exactly 424 employees were employed by Growmar.
- Exactly 424 employees received a payslip in August 2026.
- **Coverage of active workforce:** **100.00%** (424 / 424).

### 6. Identify the five-person headcount difference
> **The stored payroll header reports 429 employees, while the itemized payslip dataset contains 424 employees. This produces an unexplained header-to-roster headcount difference of five. The available evidence does not independently establish that these represent approved budgeted vacancies.**
> 
> `Budgeted-vacancy explanation: NOT VERIFIED`

- The remaining 17 employees in the master roster (`EMP-0729` through `EMP-0745`) joined between `2026-09-01` and `2026-09-28`. None were employed in August.

### 7. Investigate whether missing employee records explain the difference
**Rejected.** Every single person employed by Growmar during August 2026 has a payslip. No candidate employee exists in `employees.json` who was hired on or before August 31, 2026 without an August payslip.

### 8. Check whether header totals contain records outside the payslip dataset
The header totals originated from an independently imported enterprise planning-system batch control dataset. They were not computed by aggregating the 424 individual payslips.

### 9. Inspect payroll approval and payment evidence
The header records `status: PAID` with `pay_date: 2026-09-01`. However, within the repository, no external banking UTR settlement logs or bank statement reconciliation files exist.

### 10. Establish whether August is a completed payment record or an incorrectly represented historical run
August is a completed historical disbursement record. Under corporate payroll governance and legal standards, altering historical `PAID` payroll records without formal executive and audit committee authorization is strictly prohibited.

---

## 4. Source-of-Truth & Legal Characterization Safeguard

- **Source Origin:** Identified (Headers originated from upstream planning/batch import; payslips originated from employee payroll generation).
- **Record Integrity:** Verified to the extent of available evidence ($0\text{ paise}$ error on all 424 payslips).
- **Authoritative Reconciliation Hierarchy:** **PENDING FORMAL APPROVAL**. The organization has not supplied the required approved policy establishing which records govern historical reconciliation.
- **Legal Characterization:**
  > **Payslips are individual employee compensation records in the supplied dataset. Their formal legal and accounting authority for historical reconciliation has not been independently established by the available project evidence.**

---

## 5. Canonical Root-Cause Classification

Under [`docs/DAY11-DISCREPANCY-CLASSIFICATION-STANDARD.md`](file:///c:/Users/Madugu%20Shiva%20Kumar/OneDrive/图片/Desktop/horizon-portal/docs/DAY11-DISCREPANCY-CLASSIFICATION-STANDARD.md):
- **Classification:** **Category 4 — Upstream Planning or Reporting Variance**
- **Justification:** The stored header differs from the itemized payroll records, reflecting an upstream planning or batch control variance. The formal accounting policy governing historical disbursed runs (Policy C) remains pending executive sign-off.

---

## 6. Audit Conclusion & Tie-Out Status

1. **Software Verification:** The Horizon Portal Admin Payroll Console correctly computes the variance and flags `PR-2026-08` as **`MISMATCH`**.
2. **Immutability of PAID Status:** Disbursed historical payroll cannot be artificially edited or forced to match without authorized policy approval.
3. **Official Tie-Out Determination:**
   $$\mathbf{PR-2026-08\ HISTORICAL\ TIE-OUT:\ BLOCKED}$$
