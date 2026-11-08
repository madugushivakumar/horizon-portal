# DAY 11 — TWO-RUN ROOT-CAUSE INVESTIGATION: AUGUST & SEPTEMBER 2026
**Project:** Aura Workforce by Growmar — Horizon Portal  
**Phase:** Phase 3 — Day 11: Admin Payroll Run Console  
**Date:** November 7, 2026 (Updated)  
**Auditor:** Senior Payroll Systems Architect, Financial Data Auditor & QA Lead  
**Repository:** `horizon-portal`  
**Branch:** `main`  
**Release Tag:** `phase-3`  
**Canonical Classification:** **Category 4 — Upstream Planning or Reporting Variance**  

---

## 1. Executive Summary

This report delivers the comprehensive root-cause investigation for the two required payroll runs:
1. **August 2026 (`PR-2026-08`)** — Stored status: `PAID`.
2. **September 2026 (`PR-2026-09`)** — Stored status: `POSTED - PAYMENT PENDING`.

All investigations were performed using BigInt integer paise derived directly from the immutable source files (`03_Data_Pack/payroll_runs.json`, `03_Data_Pack/payslips.json`, and `03_Data_Pack/employees.json`).

### Key Findings:
1. **Individual Payslip Accuracy:** Every single payslip in both August (424 items) and September (441 items) satisfies $\text{Gross} - \text{Deductions} = \text{Net}$ to the exact paisa ($0\text{ paise}$ residual error).
2. **Source Discrepancy Nature:** The discrepancy is strictly between the stored run header totals and the sum of the constituent payslips.
3. **Headcount Reality:**
   - **September (`PR-2026-09`):** The stored payroll header reports 444 employees, while the itemized payslip dataset contains 441 employees. This produces an unexplained header-to-roster headcount difference of three. The available evidence does not independently establish that these represent approved budgeted vacancies. (`Budgeted-vacancy explanation: NOT VERIFIED`). All 441 employees in the company roster received a payslip.
   - **August (`PR-2026-08`):** The stored payroll header reports 429 employees, while the itemized payslip dataset contains 424 employees. This produces an unexplained header-to-roster headcount difference of five. The available evidence does not independently establish that these represent approved budgeted vacancies. (`Budgeted-vacancy explanation: NOT VERIFIED`). All 424 active employees received a payslip (the remaining 17 joined in September).
4. **Legal Characterization Safeguard:**
   > **"Payslips are individual employee compensation records in the supplied dataset. Their formal legal and accounting authority for historical reconciliation has not been independently established by the available project evidence."**

---

## 2. Independent BigInt Paise Recalculation

Recalculated directly from source files using the standard accounting formula:
$$\text{Variance} = \text{Itemized Total} - \text{Stored Header Total}$$

### 2.1 August 2026 (`PR-2026-08`)
- **Period:** August 1, 2026 – August 31, 2026
- **Operational Status:** `PAID` (`pay_date: 2026-09-01`)
- **Stored Header Figures:**
  - Headcount: `429`
  - Gross Pay: `₹48,685,007.97` ($4,868,500,797\text{ paise}$)
  - Deductions: `₹5,511,689.61` ($551,168,961\text{ paise}$)
  - Net Pay: `₹43,173,318.36` ($4,317,331,836\text{ paise}$)
- **Itemized Payslip Sums (424 items):**
  - Headcount: `424` (424 unique employees)
  - Gross Pay: `₹47,847,409.45` ($4,784,740,945\text{ paise}$)
  - Deductions: `₹5,379,448.08` ($537,944,808\text{ paise}$)
  - Net Pay: `₹42,467,961.37` ($4,246,796,137\text{ paise}$)
- **Variances ($\text{Items} - \text{Stored}$):**
  - Headcount Variance: `-5 employees` ($-1.17\%$)
  - Gross Variance: `-₹837,598.52` ($-83,759,852\text{ paise}$, $-1.72\%$)
  - Deductions Variance: `-₹132,241.53` ($-13,224,153\text{ paise}$, $-2.40\%$)
  - Net Variance: `-₹705,356.99` ($-70,535,699\text{ paise}$, $-1.63\%$)
- **Arithmetic Check:**
  $$\text{₹47,847,409.45} - \text{₹5,379,448.08} = \text{₹42,467,961.37}\quad (\Delta = 0\text{ paise})$$
  $$\text{Gross Variance} - \text{Deductions Variance} = \text{Net Variance}\quad (-837,598.52 - (-132,241.53) = -705,356.99)$$

### 2.2 September 2026 (`PR-2026-09`)
- **Period:** September 1, 2026 – September 30, 2026
- **Operational Status:** `POSTED - PAYMENT PENDING` (`pay_date: null`)
- **Stored Header Figures:**
  - Headcount: `444`
  - Gross Pay: `₹54,788,660.03` ($5,478,866,003\text{ paise}$)
  - Deductions: `₹6,698,981.73` ($669,898,173\text{ paise}$)
  - Net Pay: `₹48,089,678.30` ($4,808,967,830\text{ paise}$)
- **Itemized Payslip Sums (441 items):**
  - Headcount: `441` (441 unique employees)
  - Gross Pay: `₹54,430,331.52` ($5,443,033,152\text{ paise}$)
  - Deductions: `₹6,648,004.92` ($664,800,492\text{ paise}$)
  - Net Pay: `₹47,782,326.60` ($4,778,232,660\text{ paise}$)
- **Variances ($\text{Items} - \text{Stored}$):**
  - Headcount Variance: `-3 employees` ($-0.68\%$)
  - Gross Variance: `-₹358,328.51` ($-35,832,851\text{ paise}$, $-0.65\%$)
  - Deductions Variance: `-₹50,976.81` ($-5,097,681\text{ paise}$, $-0.76\%$)
  - Net Variance: `-₹307,351.70` ($-30,735,170\text{ paise}$, $-0.64\%$)
- **Arithmetic Check:**
  $$\text{₹54,430,331.52} - \text{₹6,648,004.92} = \text{₹47,782,326.60}\quad (\Delta = 0\text{ paise})$$
  $$\text{Gross Variance} - \text{Deductions Variance} = \text{Net Variance}\quad (-358,328.51 - (-50,976.81) = -307,351.70)$$

---

## 3. Forensic Root-Cause Analysis

### 3.1 Hypothesis Testing
1. **Duplicate Payslips:** Rejected. `duplicateEmpCount = 0` in both runs.
2. **Missing Payslips for Active Staff:** Rejected. In September, 441/441 employees have payslips. In August, 424/424 active employees have payslips.
3. **Floating-Point Rounding Error:** Rejected. Integer-paise calculations verify that individual payslips balance with zero remainder.
4. **Upstream Planning / Batch Control Variance (Category 4):** **Provisional Cause Established**.
   - The stored headers originated from an independently imported batch control dataset.
   - The available evidence does not independently establish that the difference represents approved budgeted vacancies (`Budgeted-vacancy explanation: NOT VERIFIED`).
   - The financial differences correspond to the difference between the aggregate batch targets and the sum of realized payslips.

---

## 4. Conclusion

Neither August (`PR-2026-08`) nor September (`PR-2026-09`) satisfies stored header-to-item equality. The software reconciliation correctly identifies the variance and displays `MISMATCH`. Gate 1 remains locked.
