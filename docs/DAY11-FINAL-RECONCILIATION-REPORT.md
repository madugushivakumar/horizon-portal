# DAY 11 — FINAL RECONCILIATION REPORT: TWO-RUN TIE-OUT AUDIT
**Project:** Aura Workforce by Growmar — Horizon Portal  
**Phase:** Phase 3 — Teams and Insight (Day 11: Admin Payroll Run Console)  
**Audit Date:** November 7, 2026  
**Auditor:** Senior Payroll Data Auditor, Database Integrity Engineer & Full-Stack Technical Auditor  
**Repository:** `horizon-portal`  
**Branch:** `main`  
**Release Tag:** `phase-3`

---

## 1. Executive Summary

This report provides the formal audit assessment of the Day 11 requirement:
> *"Check that the totals shown for a run equal the sum of its items for 2 runs"*

Based on an immutable source-data reconciliation of all itemized runs in `03_Data_Pack` and loaded into `prisma/dev.db`, this requirement is evaluated as:
**NOT SATISFIED IN THE SUPPLIED HISTORICAL DATA**.

The software implementation correctly detects, calculates, and exposes the exact variance for every run using BigInt integer-paise arithmetic. However, because **zero** runs in the upstream historical dataset match their stored headers, claiming this requirement as satisfied would require either data fabrication or unauthorized mutation of financial records.

---

## 2. Source-Derived Multi-Run Reconciliation Table

Derived directly from `03_Data_Pack/payroll_runs.json` and `03_Data_Pack/payslips.json`:

| Run ID | Period | Stored Headcount | Actual Payslips | Headcount Variance | Stored Gross (₹) | Payslips Gross (₹) | Gross Variance (₹) | Stored Deductions (₹) | Payslips Deductions (₹) | Deductions Variance (₹) | Stored Net (₹) | Payslips Net (₹) | Net Variance (₹) | Reconciled Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `PR-2026-04` | 2026-04-01 to 2026-04-30 | 413 | 388 | -25 | 61,486,224.92 | 58,268,345.09 | -3,217,879.83 | 8,169,255.04 | 7,776,749.43 | -392,505.61 | 53,316,969.88 | 50,491,595.66 | -2,825,374.22 | **MISMATCH** |
| `PR-2026-05` | 2026-05-01 to 2026-05-31 | 413 | 394 | -19 | 47,013,633.45 | 44,782,349.84 | -2,231,283.61 | 5,341,181.75 | 5,084,152.04 | -257,029.71 | 41,672,451.70 | 39,698,197.80 | -1,974,253.90 | **MISMATCH** |
| `PR-2026-06` | 2026-06-01 to 2026-06-30 | 421 | 406 | -15 | 53,971,863.57 | 51,631,047.77 | -2,340,815.80 | 6,928,385.12 | 6,584,736.78 | -343,648.34 | 47,043,478.45 | 45,046,310.99 | -1,997,167.46 | **MISMATCH** |
| `PR-2026-07` | 2026-07-01 to 2026-07-31 | 427 | 416 | -11 | 48,280,389.27 | 46,871,860.72 | -1,408,528.55 | 5,492,004.72 | 5,288,689.77 | -203,314.95 | 42,788,384.55 | 41,583,170.95 | -1,205,213.60 | **MISMATCH** |
| `PR-2026-08` | 2026-08-01 to 2026-08-31 | 429 | 424 | -5 | 48,685,007.97 | 47,847,409.45 | -837,598.52 | 5,511,689.61 | 5,379,448.08 | -132,241.53 | 43,173,318.36 | 42,467,961.37 | -705,356.99 | **MISMATCH** |
| `PR-2026-09` | 2026-09-01 to 2026-09-30 | 444 | 441 | -3 | 54,788,660.03 | 54,430,331.52 | -358,328.51 | 6,698,981.73 | 6,648,004.92 | -50,976.81 | 48,089,678.30 | 47,782,326.60 | -307,351.70 | **MISMATCH** |
| **Total** | **6 Periods** | **2,547** | **2,469** | **-78** | **314,225,779.21** | **303,831,344.39** | **-10,394,434.82** | **38,141,497.97** | **36,761,781.02** | **-1,379,716.95** | **276,084,281.24** | **267,069,563.37** | **-9,014,717.87** | **ALL MISMATCH** |

---

## 3. Two-Run Minimum Tie-Out Detailed Assessment

The two most recent itemized payroll runs (`PR-2026-09` and `PR-2026-08`) were evaluated as candidate tie-out runs:

### 3.1 Run 1: September 2026 (`PR-2026-09`)
- **Period:** September 1, 2026 – September 30, 2026
- **Operational Status:** `POSTED - PAYMENT PENDING`
- **Stored Header Figures:** Headcount: `444` | Gross: `₹54,788,660.03` | Deductions: `₹6,698,981.73` | Net: `₹48,089,678.30`
- **Reconciled Payslip Sums (441 items):** Headcount: `441` | Gross: `₹54,430,331.52` | Deductions: `₹6,648,004.92` | Net: `₹47,782,326.60`
- **Variances ($\text{Items} - \text{Stored}$):**
  - Headcount Variance: `-3 employees`
  - Gross Variance: `-₹358,328.51` ($-35,832,851\text{ paise}$)
  - Deductions Variance: `-₹50,976.81` ($-5,097,681\text{ paise}$)
  - Net Variance: `-₹307,351.70` ($-30,735,170\text{ paise}$)
- **Arithmetic Proof:**
  $$\text{₹54,430,331.52} - \text{₹6,648,004.92} = \text{₹47,782,326.60}\quad (\Delta = 0\text{ paise})$$
- **Verdict:** **MISMATCH** (Totals do NOT equal sum of items).

### 3.2 Run 2: August 2026 (`PR-2026-08`)
- **Period:** August 1, 2026 – August 31, 2026
- **Operational Status:** `PAID`
- **Stored Header Figures:** Headcount: `429` | Gross: `₹48,685,007.97` | Deductions: `₹5,511,689.61` | Net: `₹43,173,318.36`
- **Reconciled Payslip Sums (424 items):** Headcount: `424` | Gross: `₹47,847,409.45` | Deductions: `₹5,379,448.08` | Net: `₹42,467,961.37`
- **Variances ($\text{Items} - \text{Stored}$):**
  - Headcount Variance: `-5 employees`
  - Gross Variance: `-₹837,598.52` ($-83,759,852\text{ paise}$)
  - Deductions Variance: `-₹132,241.53` ($-13,224,153\text{ paise}$)
  - Net Variance: `-₹705,356.99` ($-70,535,699\text{ paise}$)
- **Arithmetic Proof:**
  $$\text{₹47,847,409.45} - \text{₹5,379,448.08} = \text{₹42,467,961.37}\quad (\Delta = 0\text{ paise})$$
- **Verdict:** **MISMATCH** (Totals do NOT equal sum of items).

---

## 4. Arithmetic Identity Verification

For all 6 runs, BigInt arithmetic proves:
1. $\text{Itemized Gross} - \text{Itemized Deductions} = \text{Itemized Net}$ holds across every run with 0 paise residual.
2. $\text{Variance} = \text{Itemized Total} - \text{Stored Header Total}$ holds across every run with 0 paise residual.
3. Total Row equals the exact algebraic sum of all 6 individual run rows.

---

## 5. Professional & Ethical Audit Stance

In financial software engineering, an auditor or developer faced with upstream data discrepancies must report the ground truth:
- Accurately calculate itemized sums using BigInt integer arithmetic.
- Compute and display the exact discrepancy down to the paise.
- Restrict financial operations (such as approving runs) when data integrity fails.
- Mark the tie-out requirement as **NOT SATISFIED IN THE SUPPLIED HISTORICAL DATA**.
