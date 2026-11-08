# DAY 11 — TWO-RUN EMPLOYEE-LEVEL RECONCILIATION REPORT
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

This report delivers the employee-level population reconciliation across August 2026 (`PR-2026-08`) and September 2026 (`PR-2026-09`).

Every employee in the master roster (`441` total) was audited against payslip presence, employment eligibility, hire dates, and compensation records to determine whether missing or extra payslips account for the headcount discrepancies.

### Legal Characterization Safeguard:
> **"Payslips are individual employee compensation records in the supplied dataset. Their formal legal and accounting authority for historical reconciliation has not been independently established by the available project evidence."**

---

## 2. Employee-Level Exception Table

The following table documents all employee records that exhibit population variations between August and September 2026:

| Employee ID | August Status | September Status | Hire Date | Payslip Evidence | Exception Type | Technical & Operational Explanation |
|---|---|---|---|---|---|---|
| `EMP-0729` | Absent | **Paid** | `2026-09-01` | September Payslip: ₹62,959.00 | **Valid Ineligibility** | Joined on 1st day of September 2026. Ineligible for August payroll. |
| `EMP-0730` | Absent | **Paid** | `2026-09-03` | September Payslip: ₹49,682.13 | **Valid Ineligibility** | Joined September 3, 2026. Ineligible for August payroll. |
| `EMP-0731` | Absent | **Paid** | `2026-09-03` | September Payslip: ₹29,194.23 | **Valid Ineligibility** | Joined September 3, 2026. Ineligible for August payroll. |
| `EMP-0732` | Absent | **Paid** | `2026-09-03` | September Payslip: ₹308,453.60 | **Valid Ineligibility** | Joined September 3, 2026. Ineligible for August payroll. |
| `EMP-0733` | Absent | **Paid** | `2026-09-07` | September Payslip: ₹156,716.25 | **Valid Ineligibility** | Joined September 7, 2026. Ineligible for August payroll. |
| `EMP-0734` | Absent | **Paid** | `2026-09-15` | September Payslip: ₹77,076.27 | **Valid Ineligibility** | Joined September 15, 2026. Ineligible for August payroll. |
| `EMP-0735` | Absent | **Paid** | `2026-09-15` | September Payslip: ₹39,584.50 | **Valid Ineligibility** | Joined September 15, 2026. Ineligible for August payroll. |
| `EMP-0736` | Absent | **Paid** | `2026-09-16` | September Payslip: ₹70,541.00 | **Valid Ineligibility** | Joined September 16, 2026. Ineligible for August payroll. |
| `EMP-0737` | Absent | **Paid** | `2026-09-18` | September Payslip: ₹21,114.60 | **Valid Ineligibility** | Joined September 18, 2026. Ineligible for August payroll. |
| `EMP-0738` | Absent | **Paid** | `2026-09-21` | September Payslip: ₹13,987.33 | **Valid Ineligibility** | Joined September 21, 2026. Ineligible for August payroll. |
| `EMP-0739` | Absent | **Paid** | `2026-09-22` | September Payslip: ₹21,924.00 | **Valid Ineligibility** | Joined September 22, 2026. Ineligible for August payroll. |
| `EMP-0740` | Absent | **Paid** | `2026-09-23` | September Payslip: ₹34,833.86 | **Valid Ineligibility** | Joined September 23, 2026. Ineligible for August payroll. |
| `EMP-0741` | Absent | **Paid** | `2026-09-24` | September Payslip: ₹28,452.67 | **Valid Ineligibility** | Joined September 24, 2026. Ineligible for August payroll. |
| `EMP-0742` | Absent | **Paid** | `2026-09-25` | September Payslip: ₹24,137.40 | **Valid Ineligibility** | Joined September 25, 2026. Ineligible for August payroll. |
| `EMP-0743` | Absent | **Paid** | `2026-09-25` | September Payslip: ₹7,880.55 | **Valid Ineligibility** | Joined September 25, 2026. Ineligible for August payroll. |
| `EMP-0744` | Absent | **Paid** | `2026-09-25` | September Payslip: ₹13,713.20 | **Valid Ineligibility** | Joined September 25, 2026. Ineligible for August payroll. |
| `EMP-0745` | Absent | **Paid** | `2026-09-28` | September Payslip: ₹2,121.70 | **Valid Ineligibility** | Joined September 28, 2026. Ineligible for August payroll. |

---

## 3. Detailed Audit of Specific Inquired ID Sequences

### 3.1 ID Sequence `EMP-0442` through `EMP-0444`
- `EMP-0442`: Hired `2023-09-07`. Active and paid in both August 2026 and September 2026.
- `EMP-0443`: Hired `2023-09-12`. Active and paid in both August 2026 and September 2026.
- `EMP-0444`: **Sequence Gap**. Non-contiguous ID counter gap; does not exist in `employees.json` or `prisma/dev.db`.

### 3.2 ID Sequence `EMP-0425` through `EMP-0429`
- `EMP-0425`: Hired `2023-07-11`. Active and paid in both August 2026 and September 2026.
- `EMP-0426`: Hired `2023-07-11`. Active and paid in both August 2026 and September 2026.
- `EMP-0427`: **Sequence Gap**. Non-contiguous ID counter gap; does not exist in `employees.json` or `prisma/dev.db`.
- `EMP-0428`: Hired `2023-07-18`. Active and paid in both August 2026 and September 2026.
- `EMP-0429`: Hired `2023-07-19`. Active and paid in both August 2026 and September 2026.

---

## 4. Population Audit Synthesis

1. **August Workforce Discrepancy (-5):**
   > **The stored payroll header reports 429 employees, while the itemized payslip dataset contains 424 employees. This produces an unexplained header-to-roster headcount difference of five. The available evidence does not independently establish that these represent approved budgeted vacancies.**  
   > `Budgeted-vacancy explanation: NOT VERIFIED`
   - Active workforce on August 31, 2026 was exactly 424 employees.
   - All 424 employees received a payslip (100% coverage).
   - Zero eligible employees were omitted.
2. **September Workforce Discrepancy (-3):**
   > **The stored payroll header reports 444 employees, while the itemized payslip dataset contains 441 employees. This produces an unexplained header-to-roster headcount difference of three. The available evidence does not independently establish that these represent approved budgeted vacancies.**  
   > `Budgeted-vacancy explanation: NOT VERIFIED`
   - Total company workforce expanded to 441 employees.
   - All 441 employees received a payslip (100% coverage).
   - Zero eligible employees were omitted.

**Audit Determination:** The source dataset does not contain missing employee payslips for any actual worker. The discrepancies reflect unadjusted upstream batch control figures.
