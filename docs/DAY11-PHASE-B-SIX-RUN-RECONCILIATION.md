# DAY 11 — PHASE B: SIX-RUN INTEGER-PAISE RECONCILIATION & FORENSIC ANALYSIS
**Project:** Aura Workforce by Growmar — Horizon Portal  
**Phase:** Phase 3 — Teams and Insight (Day 11: Admin Payroll Run Console)  
**Audit Date:** November 7, 2026  
**Auditor:** Senior Payroll Data Auditor, Database Integrity Engineer & Full-Stack Technical Auditor  
**Repository:** `horizon-portal`  
**Branch:** `main`  
**Release Tag:** `phase-3`

---

## 1. Executive Summary

This report delivers the verified multi-run BigInt integer-paise financial reconciliation across all six payroll runs containing itemized payslip records in the immutable source data pack (`03_Data_Pack/payroll_runs.json` and `03_Data_Pack/payslips.json`).

All calculations are derived directly from the immutable JSON files and verified with BigInt integer paise ($1\text{ INR} = 100\text{ paise}$).

### Source File Checksums:
- `03_Data_Pack/payroll_runs.json`: 4,062 bytes | SHA-256: `d501c1c70b0515d77f39dc2af9597b01b729e76eb3feff8d730c697131e74e21`
- `03_Data_Pack/payslips.json`: 1,432,529 bytes | SHA-256: `9e6f7649e92f821fd680ad9963b730d087c7fafa6a59ebff8790a88c54a04196`

### Core Forensic Conclusions:
1. **Mathematical Integrity of Itemized Payslips:** All 2,469 payslips across all six runs satisfy $\text{Gross Pay} - \text{Deductions} = \text{Net Pay}$ to the exact paise ($0\text{ paise}$ residual error).
2. **Universal Negative Variance:** In every single itemized run, the stored run-header totals exceed the sum of the itemized payslips.
3. **Headcount Variance Progression:**
   - April 2026 (`PR-2026-04`): Stored 413, Items 388, Diff: -25 (-6.05%)
   - May 2026 (`PR-2026-05`): Stored 413, Items 394, Diff: -19 (-4.60%)
   - June 2026 (`PR-2026-06`): Stored 421, Items 406, Diff: -15 (-3.56%)
   - July 2026 (`PR-2026-07`): Stored 427, Items 416, Diff: -11 (-2.58%)
   - August 2026 (`PR-2026-08`): Stored 429, Items 424, Diff: -5 (-1.17%)
   - September 2026 (`PR-2026-09`): Stored 444, Items 441, Diff: -3 (-0.68%)
4. **August Eligibility Ground Truth:** All 17 employees absent from the August 2026 payroll (`EMP-0729` through `EMP-0745`) were hired between September 1, 2026 and September 28, 2026. They were legally ineligible for August payroll. All 424 active employees in August 2026 received a payslip (100% disbursement rate). The -5 headcount mismatch is solely due to the stored header recording 429 expected employees.

---

## 2. Multi-Run BigInt Integer-Paise Reconciliation Table

The following table reflects the exact figures stored in `03_Data_Pack/payroll_runs.json` and `03_Data_Pack/payslips.json`:

| Run ID | Period | Stored Headcount | Actual Payslips | Headcount Variance | Stored Gross (₹) | Payslips Gross (₹) | Gross Variance (₹) | Stored Deductions (₹) | Payslips Deductions (₹) | Deductions Variance (₹) | Stored Net (₹) | Payslips Net (₹) | Net Variance (₹) | Internal Item Balance | Reconciled Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `PR-2026-04` | 2026-04-01 to 2026-04-30 | 413 | 388 | -25 | 61,486,224.92 | 58,268,345.09 | -3,217,879.83 | 8,169,255.04 | 7,776,749.43 | -392,505.61 | 53,316,969.88 | 50,491,595.66 | -2,825,374.22 | 100% Balanced | **MISMATCH** |
| `PR-2026-05` | 2026-05-01 to 2026-05-31 | 413 | 394 | -19 | 47,013,633.45 | 44,782,349.84 | -2,231,283.61 | 5,341,181.75 | 5,084,152.04 | -257,029.71 | 41,672,451.70 | 39,698,197.80 | -1,974,253.90 | 100% Balanced | **MISMATCH** |
| `PR-2026-06` | 2026-06-01 to 2026-06-30 | 421 | 406 | -15 | 53,971,863.57 | 51,631,047.77 | -2,340,815.80 | 6,928,385.12 | 6,584,736.78 | -343,648.34 | 47,043,478.45 | 45,046,310.99 | -1,997,167.46 | 100% Balanced | **MISMATCH** |
| `PR-2026-07` | 2026-07-01 to 2026-07-31 | 427 | 416 | -11 | 48,280,389.27 | 46,871,860.72 | -1,408,528.55 | 5,492,004.72 | 5,288,689.77 | -203,314.95 | 42,788,384.55 | 41,583,170.95 | -1,205,213.60 | 100% Balanced | **MISMATCH** |
| `PR-2026-08` | 2026-08-01 to 2026-08-31 | 429 | 424 | -5 | 48,685,007.97 | 47,847,409.45 | -837,598.52 | 5,511,689.61 | 5,379,448.08 | -132,241.53 | 43,173,318.36 | 42,467,961.37 | -705,356.99 | 100% Balanced | **MISMATCH** |
| `PR-2026-09` | 2026-09-01 to 2026-09-30 | 444 | 441 | -3 | 54,788,660.03 | 54,430,331.52 | -358,328.51 | 6,698,981.73 | 6,648,004.92 | -50,976.81 | 48,089,678.30 | 47,782,326.60 | -307,351.70 | 100% Balanced | **MISMATCH** |
| **Total** | **6 Periods** | **2,547** | **2,469** | **-78** | **314,225,779.21** | **303,831,344.39** | **-10,394,434.82** | **38,141,497.97** | **36,761,781.02** | **-1,379,716.95** | **276,084,281.24** | **267,069,563.37** | **-9,014,717.87** | **100% Balanced** | **ALL MISMATCH** |

---

## 3. Arithmetic Proofs

1. **Individual Payslip Balance:**
   Every payslip satisfies $\text{Gross} - \text{Total Deductions} = \text{Net Pay}$ to the exact paise.
2. **Itemized Sum Balance for Every Run:**
   - `PR-2026-04`: ₹58,268,345.09 − ₹7,776,749.43 = ₹50,491,595.66 ($\Delta = 0\text{ paise}$)
   - `PR-2026-05`: ₹44,782,349.84 − ₹5,084,152.04 = ₹39,698,197.80 ($\Delta = 0\text{ paise}$)
   - `PR-2026-06`: ₹51,631,047.77 − ₹6,584,736.78 = ₹45,046,310.99 ($\Delta = 0\text{ paise}$)
   - `PR-2026-07`: ₹46,871,860.72 − ₹5,288,689.77 = ₹41,583,170.95 ($\Delta = 0\text{ paise}$)
   - `PR-2026-08`: ₹47,847,409.45 − ₹5,379,448.08 = ₹42,467,961.37 ($\Delta = 0\text{ paise}$)
   - `PR-2026-09`: ₹54,430,331.52 − ₹6,648,004.92 = ₹47,782,326.60 ($\Delta = 0\text{ paise}$)
   - **Total Row:** ₹303,831,344.39 − ₹36,761,781.02 = ₹267,069,563.37 ($\Delta = 0\text{ paise}$)
3. **Variance Identity:**
   $\text{Variance} = \text{Itemized Total} − \text{Stored Header Total}$
   - Gross Variance: ₹303,831,344.39 − ₹314,225,779.21 = −₹10,394,434.82
   - Deductions Variance: ₹36,761,781.02 − ₹38,141,497.97 = −₹1,379,716.95
   - Net Variance: ₹267,069,563.37 − ₹276,084,281.24 = −₹9,014,717.87
   - $\text{Gross Variance} − \text{Deductions Variance} = \text{Net Variance}$:
     $-10,394,434.82 - (-1,379,716.95) = -9,014,717.87$ ($\Delta = 0\text{ paise}$)
4. **Column Sum Consistency:**
   The sum of each individual run variance exactly equals the total row variance.

---

## 4. Explanation of Earlier Numerical Differences

In earlier draft reports (e.g. `DAY11-FINAL-PAYROLL-RECONCILIATION-RESOLUTION-REPORT.md`), the stored and itemized gross and net totals for `PR-2026-04` through `PR-2026-07` were reported using different baseline figures (e.g., April gross of ₹42,751,208.10 stored vs ₹39,533,328.27 items).

A forensic comparison against the raw files reveals the exact reason:
- The earlier report preserved the **exact mathematical variances** (e.g., April Gross diff of −₹3,217,879.83 and Net diff of −₹2,825,374.22) and exact headcount differences.
- However, the author of that earlier document had plugged in artificial base figures rather than pulling the raw `total_gross` and `total_net` fields from `03_Data_Pack/payroll_runs.json`.
- In `03_Data_Pack/payroll_runs.json`, the stored figures are: April ₹61,486,224.92; May ₹47,013,633.45; June ₹53,971,863.57; July ₹48,280,389.27.
- In `03_Data_Pack/payslips.json`, the actual item sums are: April ₹58,268,345.09; May ₹44,782,349.84; June ₹51,631,047.77; July ₹46,871,860.72.
- The variances remain identical to the paise across both versions. The current report uses the exact, immutable source-derived numbers.

---

## 5. Employee Joining Dates & Eligibility Ground Truth

- The 17 employees absent from August payroll are specifically `EMP-0729` through `EMP-0745`.
- All 17 joined between September 1, 2026 and September 28, 2026.
- Total active workforce on August 31, 2026 was 424 employees. Exactly 424 payslips exist in August (100% of eligible employees were paid).
- In September 2026, total company headcount reached 441. Exactly 441 payslips exist in September (100% of company employees were paid).
- `EMP-0442` and `EMP-0443` were hired in September 2023 and received payslips in both months. `EMP-0444` is a sequence gap (does not exist).
- `EMP-0425`, `EMP-0426`, `EMP-0428`, `EMP-0429` were hired in July 2023 and received payslips in both months. `EMP-0427` is a sequence gap (does not exist).

---

## 6. Audit Conclusion

Because every single itemized run in the official dataset exhibits negative variances where headers exceed payslip sums, **zero runs in the provided data tie out with 0 variance**. The requirement is evaluated as **NOT SATISFIED IN THE SUPPLIED HISTORICAL DATA**.
