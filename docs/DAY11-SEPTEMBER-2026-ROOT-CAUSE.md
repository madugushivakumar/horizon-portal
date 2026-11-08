# DAY 11 — SEPTEMBER 2026 (`PR-2026-09`) FORENSIC ROOT-CAUSE REPORT
**Project:** Aura Workforce by Growmar — Horizon Portal  
**Phase:** Phase 3 — Day 11: Admin Payroll Run Console  
**Run Identifier:** `PR-2026-09`  
**Pay Period:** September 1, 2026 – September 30, 2026  
**Pay Date:** `null` (Pending disbursement)  
**Operational Status:** `POSTED - PAYMENT PENDING` | **Approval Status:** `Pending`  
**Date of Audit:** November 7, 2026 (Updated)  
**Auditor:** Senior Payroll Systems Architect, Financial Data Auditor & QA Lead  
**Canonical Classification:** **Category 4 — Upstream Planning or Reporting Variance**  

---

## 1. Executive Summary & Verification Context

This report provides the forensic root-cause analysis for September 2026 (`PR-2026-09`), the active in-flight payroll batch in the Horizon Portal.

Unlike August, September 2026 has **not** been paid (`pay_date: null`) and has **not** been approved (`approval_status: Pending`). It represents an in-flight batch posted to the system.

The official two-run tie-out requires establishing whether `PR-2026-09` can satisfy:
$$\text{Header Headcount} = \text{Itemized Headcount}$$
$$\text{Header Gross} = \text{Itemized Gross}$$
$$\text{Header Deductions} = \text{Itemized Deductions}$$
$$\text{Header Net} = \text{Itemized Net}$$

This audit establishes why `PR-2026-09` exhibits an un-reconciled variance, the verified roster facts behind the 3-person headcount discrepancy, and why the run is correctly evaluated by the software reconciliation engine as **`BLOCKED (MISMATCH)`**.

---

## 2. Independent BigInt Paise Calculations

Calculated directly from `03_Data_Pack/payroll_runs.json` and `03_Data_Pack/payslips.json` using exact 64-bit integer paise ($1\text{ INR} = 100\text{ paise}$):

$$\text{Variance} = \text{Itemized Total} - \text{Stored Header Total}$$

### 2.1 Stored Run Header Figures (`PR-2026-09`)
- **Headcount (`employees_paid`):** `444`
- **Gross Pay (`total_gross`):** `₹54,788,660.03` ($5,478,866,003\text{ paise}$)
- **Net Pay (`total_net`):** `₹48,089,678.30` ($4,808,967,830\text{ paise}$)
- **Implied Header Deductions ($\text{Gross} - \text{Net}$):** `₹6,698,981.73` ($669,898,173\text{ paise}$)
- **Operational Status:** `POSTED - PAYMENT PENDING`
- **Disbursement Pay Date:** `null`

### 2.2 Itemized Payslip Totals (441 Payslips)
- **Headcount:** `441` (441 unique employees, 0 duplicates)
- **Gross Pay:** `₹54,430,331.52` ($5,443,033,152\text{ paise}$)
- **Deductions:** `₹6,648,004.92` ($664,800,492\text{ paise}$)
- **Net Pay:** `₹47,782,326.60` ($4,778,232,660\text{ paise}$)

### 2.3 Calculated Discrepancies & Variances
| Financial Dimension | Stored Header | Itemized Payslips | Variance (Paise) | Variance (Rupees) | Variance % |
|---|---:|---:|---:|---:|---:|
| **Headcount** | 444 | 441 | -3 | -3 employees | -0.68% |
| **Gross Pay** | ₹54,788,660.03 | ₹54,430,331.52 | -35,832,851 | -₹358,328.51 | -0.65% |
| **Deductions** | ₹6,698,981.73 | ₹6,648,004.92 | -5,097,681 | -₹50,976.81 | -0.76% |
| **Net Pay** | ₹48,089,678.30 | ₹47,782,326.60 | -30,735,170 | -₹307,351.70 | -0.64% |

### 2.4 Mathematical Proof & Zero-Residual Balance
1. **Payslip Line-Item Invariance:**
   $$\sum \text{Gross} - \sum \text{Deductions} = 5,443,033,152\text{ paise} - 664,800,492\text{ paise} = 4,778,232,660\text{ paise} = \sum \text{Net}$$
   *Residual Error across all 441 payslips:* **$0\text{ paise}$ ($₹0.000000$)**. Every single payslip balances to the exact paisa.
2. **Variance Consistency Invariance:**
   $$\text{Gross Variance} - \text{Deductions Variance} = -35,832,851\text{ paise} - (-5,097,681\text{ paise}) = -30,735,170\text{ paise} = \text{Net Variance}$$

---

## 3. Forensic Investigation of the Ten Specific Audit Questions

### 1. Identify all 441 reported payslips
All 441 payslips are present in `03_Data_Pack/payslips.json` under `run_id = 'PR-2026-09'` (spanning item IDs `PI-006912` through `PI-007352`).

### 2. Validate unique employee IDs
Querying all employee IDs in `PR-2026-09` yields exactly 441 distinct values.

### 3. Verify gross, deductions, and net for every payslip
Every payslip was individually evaluated using integer paise. In 100.00% of cases (441 / 441), $\text{gross} - \text{total\_deductions} = \text{net}$ with $0\text{ paise}$ error.

### 4. Identify the difference between 444 header employees and 441 payslip employees
> **The stored payroll header reports 444 employees, while the itemized payslip dataset contains 441 employees. This produces an unexplained header-to-roster headcount difference of three. The available evidence does not independently establish that these represent approved budgeted vacancies.**
> 
> `Budgeted-vacancy explanation: NOT VERIFIED`

- The entire corporate master roster of Growmar (`03_Data_Pack/employees.json`) contains only **441 employees in total** (`EMP-0002` through `EMP-0745`).
- In September 2026, **every single employee in the company received a payslip** ($441 / 441 = 100.00\%$).
- The header headcount of `444` exceeds the total number of human employees in existence at the company by 3.

### 5. Inspect September new hires (`EMP-0729` through `EMP-0745`)
Forensic audit of `03_Data_Pack/employees.json` confirms all 17 new hires joined in September 2026:
| Employee ID | Name | Hire Date | Department | September Net Pay |
|---|---|---|---|---:|
| `EMP-0729` | Gayathri Narayanan | `2026-09-01` | D01 | ₹62,959.00 |
| `EMP-0730` | Radhika Pandey | `2026-09-03` | D07 | ₹49,682.13 |
| `EMP-0731` | Shruti Dutta | `2026-09-03` | D08 | ₹29,194.23 |
| `EMP-0732` | Sneha Muthusamy | `2026-09-03` | D01 | ₹308,453.60 |
| `EMP-0733` | Balaji Mishra | `2026-09-07` | D01 | ₹156,716.25 |
| `EMP-0734` | Manoj Mishra | `2026-09-15` | D03 | ₹77,076.27 |
| `EMP-0735` | Varsha Anand | `2026-09-15` | D01 | ₹39,584.50 |
| `EMP-0736` | Faisal Varghese | `2026-09-16` | D01 | ₹70,541.00 |
| `EMP-0737` | Dhanya Pawar | `2026-09-18` | D06 | ₹21,114.60 |
| `EMP-0738` | Anil Roy | `2026-09-21` | D01 | ₹13,987.33 |
| `EMP-0739` | Priya Jadhav | `2026-09-22` | D01 | ₹21,924.00 |
| `EMP-0740` | Sachin Kale | `2026-09-23` | D03 | ₹34,833.86 |
| `EMP-0741` | Aditya Annamalai | `2026-09-24` | D01 | ₹28,452.67 |
| `EMP-0742` | Hari Acharya | `2026-09-25` | D04 | ₹24,137.40 |
| `EMP-0743` | Raghav Menon | `2026-09-25` | D09 | ₹7,880.55 |
| `EMP-0744` | Trisha Mukherjee | `2026-09-25` | D01 | ₹13,713.20 |
| `EMP-0745` | Kavya Sen | `2026-09-28` | D06 | ₹2,121.70 |

Every single one of these 17 new hires received an itemized payslip with pro-rated earnings based on payable days.

### 6. Refutation of Earlier Erroneous Hypotheses
Earlier draft reports suggested that employees `EMP-0442` through `EMP-0444` were October joiners. This was factually incorrect:
- `EMP-0442`: Hired `2023-09-07`. Paid ₹39,903.00 net in September.
- `EMP-0443`: Hired `2023-09-12`. Paid ₹76,969.00 net in September.
- `EMP-0444`: Non-contiguous counter sequence gap (does not exist in `employees.json`).

### 7. Check whether any header totals include employees without payslips
There are zero employees in the roster without a payslip. The 3 additional positions recorded in the header (`444 - 441 = 3`) reflect an upstream batch target that exceeded actual employee headcount by 3.

### 8. Inspect the `POSTED - PAYMENT PENDING` lifecycle
In accordance with company payroll policy, runs in `POSTED - PAYMENT PENDING` must be reconciled before final approval and disbursement. The approval endpoint (`/api/v1/payroll/runs/[runId]/approve`) enforces this invariant by returning HTTP 422 if reconciliation status is `MISMATCH`.

### 9. Verify whether September payroll has final approval evidence
There is zero approval evidence. `approved_by_id` is `null`, `approved_at` is `null`, and `approval_status` is `Pending`.

### 10. Establish whether the header is a projection or finalized payroll obligation
The header originated from an independently imported batch control dataset. The itemized payslips represent actual individual compensation records.

---

## 4. Source-of-Truth & Legal Characterization Safeguard

- **Source Origin:** Identified (Headers originated from upstream planning/batch import; payslips originated from employee payroll generation).
- **Record Integrity:** Verified to the extent of available evidence ($0\text{ paise}$ error on all 441 payslips).
- **Authoritative Reconciliation Hierarchy:** **PENDING FORMAL APPROVAL**. The organization has not supplied the required approved policy establishing which records govern historical reconciliation.
- **Legal Characterization:**
  > **Payslips are individual employee compensation records in the supplied dataset. Their formal legal and accounting authority for historical reconciliation has not been independently established by the available project evidence.**

---

## 5. Canonical Root-Cause Classification

Under [`docs/DAY11-DISCREPANCY-CLASSIFICATION-STANDARD.md`](file:///c:/Users/Madugu%20Shiva%20Kumar/OneDrive/图片/Desktop/horizon-portal/docs/DAY11-DISCREPANCY-CLASSIFICATION-STANDARD.md):
- **Classification:** **Category 4 — Upstream Planning or Reporting Variance**
- **Justification:** The stored header differs from the itemized payroll records, reflecting an upstream planning or batch control variance. The formal accounting policy governing in-flight pre-approval alignment (Policy B) remains pending executive sign-off.

---

## 6. Audit Conclusion & Tie-Out Status

1. **Software Verification:** The Horizon Portal Admin Payroll Console correctly identifies the ₹358,328.51 variance and flags `PR-2026-09` as **`MISMATCH`**.
2. **Pre-Approval Gate:** Because Policies A through E remain in `PENDING APPROVAL` status, no programmatic header alignment or adjustment execution is authorized.
3. **Official Tie-Out Determination:**
   $$\mathbf{PR-2026-09\ HISTORICAL\ TIE-OUT:\ BLOCKED}$$
