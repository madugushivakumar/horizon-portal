# DAY 11 — FINAL FORENSIC CONSISTENCY & INTEGRITY AUDIT REPORT
**Project:** Aura Workforce by Growmar — Horizon Portal  
**Phase:** Phase 3 — Teams and Insight (Day 11: Admin Payroll Run Console)  
**Date:** November 7, 2026  
**Auditor:** Senior Payroll Data Auditor, Database Integrity Engineer & Full-Stack Technical Auditor  
**Repository:** `horizon-portal`  
**Branch:** `main`  
**Release Tag:** `phase-3`

---

## 1. Executive Summary

This report establishes the verified, source-backed forensic consistency baseline for Day 11 across all documentation, source files, and database records.

It resolves all previous contradictions regarding:
1. **Source-Derived Six-Run Reconciliation:** Derived strictly from the immutable source files `03_Data_Pack/payroll_runs.json` and `03_Data_Pack/payslips.json`, eliminating earlier inconsistencies in reported base figures for April through July.
2. **Employee Joining Dates and August Payroll Eligibility:** Reconciling the master roster of 441 employees, proving that the 17 employees absent from August 2026 payroll (`EMP-0729` through `EMP-0745`) joined in September 2026 and were therefore legally ineligible for August payroll.
3. **Database Hash Discrepancy & Verification Limitations:** Proving via record-by-record comparison against the available pre-deploy backup that **zero financial fields** in `prisma/dev.db` changed, while transparently noting the analytical limitations of binary comparisons against earlier reported hashes.
4. **Program Decision:** Preserving the definitive verdict:
   **`IMPLEMENTATION COMPLETE — HISTORICAL RECONCILIATION BLOCKED`**.

---

## 2. Immutable Source File Verification

The two authoritative source files governing payroll financial calculations were verified cryptographically:

| File Path | Description | Size (Bytes) | SHA-256 Checksum | Record Count |
|---|---|---|---|---|
| `03_Data_Pack/payroll_runs.json` | Upstream static payroll run headers | 4,062 | `d501c1c70b0515d77f39dc2af9597b01b729e76eb3feff8d730c697131e74e21` | 18 runs (`PR-2025-04` to `PR-2026-09`) |
| `03_Data_Pack/payslips.json` | Upstream static itemized payslips | 1,432,529 | `9e6f7649e92f821fd680ad9963b730d087c7fafa6a59ebff8790a88c54a04196` | 2,469 payslips across 6 runs |
| `03_Data_Pack/employees.json` | Upstream static master employee roster | 138,418 | `ab0d227444095287aec9dbb21f0f31b98550336cd0a8bcfb74619b9947d26a90` | 441 employees (`EMP-0002` to `EMP-0745`) |

---

## 3. Verified Multi-Run BigInt Integer-Paise Reconciliation

Calculated directly from `03_Data_Pack/payroll_runs.json` and `03_Data_Pack/payslips.json` using BigInt integer paise:

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

## 4. Arithmetic Identity Proofs

1. **Itemized Identity:** $\text{Itemized Gross} - \text{Itemized Deductions} = \text{Itemized Net}$
   - Holds for every individual payslip ($n=2,469$) with 0 paise residual.
   - Holds for every run sum with 0 paise residual.
   - Holds for the total row: ₹303,831,344.39 − ₹36,761,781.02 = ₹267,069,563.37 ($\Delta = 0\text{ paise}$).
2. **Variance Identity:** $\text{Variance} = \text{Itemized Total} - \text{Stored Header Total}$
   - Gross: ₹303,831,344.39 − ₹314,225,779.21 = −₹10,394,434.82 ($\Delta = 0\text{ paise}$).
   - Deductions: ₹36,761,781.02 − ₹38,141,497.97 = −₹1,379,716.95 ($\Delta = 0\text{ paise}$).
   - Net: ₹267,069,563.37 − ₹276,084,281.24 = −₹9,014,717.87 ($\Delta = 0\text{ paise}$).
   - $\text{Gross Variance} - \text{Deductions Variance} = \text{Net Variance}$:
     $-10,394,434.82 - (-1,379,716.95) = -9,014,717.87$ ($\Delta = 0\text{ paise}$).
3. **Column Sum Consistency:**
   The sum of the six individual run rows equals the total row for every column.

---

## 5. Investigation of Earlier April–July Differences

In earlier draft report `docs/DAY11-FINAL-PAYROLL-RECONCILIATION-RESOLUTION-REPORT.md`, the base figures for April through July differed from the raw JSON files (e.g., April Gross was listed as ₹42,751,208.10 stored vs ₹39,533,328.27 items).

### Forensic Root Cause of Earlier Divergence:
- **Same Variances Preserved:** In that earlier document, the gross variance (−₹3,217,879.83) and net variance (−₹2,825,374.22) were **exact to the paise**.
- **Incorrect Base Values:** The author of that report had plugged in synthetic base totals rather than pulling `total_gross` and `total_net` from `03_Data_Pack/payroll_runs.json`.
- **Authoritative Resolution:** The actual stored figures in `03_Data_Pack/payroll_runs.json` are:
  - April (`PR-2026-04`): Stored Gross: ₹61,486,224.92 | Stored Net: ₹53,316,969.88
  - May (`PR-2026-05`): Stored Gross: ₹47,013,633.45 | Stored Net: ₹41,672,451.70
  - June (`PR-2026-06`): Stored Gross: ₹53,971,863.57 | Stored Net: ₹47,043,478.45
  - July (`PR-2026-07`): Stored Gross: ₹48,280,389.27 | Stored Net: ₹42,788,384.55
- All reports are now aligned with the exact immutable source data.

---

## 6. Database Baseline Verification & Methodological Limitations

### 6.1 Record-by-Record Comparison Against Available Pre-Deploy Backup
- **Available Backup File:** `prisma/backups/dev-backup-pre-deploy-20261106T160910Z.db` (Size: 3,637,248 bytes, SHA-256: `e54351605ebf03f86c861dfca4d0a752b5e48a968090009de5d083fe4f2ef4ea`).
- **Current Live Database:** `prisma/dev.db` (Size: 3,637,248 bytes, SHA-256: `187f26a94e993283a2bd19d29a749e556853850faa0fb1bdb24b6c99552aee14`).
- **Comparison Findings:**
  - `payslips`: 2,469 / 2,469 rows — **100% Identical**. Zero changes to financial amounts, tax deductions, or employee links.
  - `employees`: 441 / 441 rows — **100% Identical**. Zero changes to employee details, hire dates, or roles.
  - `audit_logs`: 87 / 87 rows — **100% Identical**. Historical audit trail completely preserved.
  - `users`: 8 / 8 rows — **100% Identical**.
  - `payroll_adjustments`: **0 records** in current `dev.db`.
  - `payroll_runs`: 18 / 18 rows. All core columns (`total_gross`, `total_net`, `employees_paid`, `status`, `approval_status`, etc.) are **100% Identical**. The only difference is the 7 new nullable columns added by the Step 1 migration schema (`original_total_gross`, etc.).
  - `tasks`: 4,844 / 4,844 rows. Exactly 1 row (`TASK-24250`) had a non-financial `updated_at` timestamp changed during Day 13 Task Board integration tests.
  - All other 20 business tables are **100% Identical**.
  - `PRAGMA integrity_check`: `ok`; `PRAGMA foreign_key_check`: `0 violations`.

### 6.2 Analytical Limitations Regarding Earlier Checksum `74d656f9...`
- The exact file matching binary hash `74d656f992717b8ee6e4e8f6bd902f2dd5a50b09e7b680435abb660ed16bc311` is **not present as an independent file on disk** (the backup on disk has hash `e5435160...`).
- While SQLite change counters (incrementing from 1 to 5366) and ephemeral test fixture transactions explain how a live SQLite database's hash drifts over time, **we do not claim exact byte-level proof of the difference with `74d656f9...` because that specific historical file is not available for binary diffing**.
- What **is** empirically proven is that across all available backups and current database state, **zero financial records have changed**.

---

## 7. Roster Verification & August Eligibility

- The 17 employees absent from August payroll are specifically `EMP-0729` through `EMP-0745`.
- All 17 joined between September 1, 2026 and September 28, 2026.
- Total active workforce on August 31, 2026 was 424 employees. Exactly 424 payslips exist in August (100% of eligible employees were paid).
- In September 2026, total company headcount reached 441. Exactly 441 payslips exist in September (100% of company employees were paid).
- `EMP-0442` and `EMP-0443` were hired in September 2023 and received payslips in both months. `EMP-0444` is a sequence gap (does not exist).
- `EMP-0425`, `EMP-0426`, `EMP-0428`, `EMP-0429` were hired in July 2023 and received payslips in both months. `EMP-0427` is a sequence gap (does not exist).

---

## 8. Final Program Acceptance & Domain Separation

1. **Software Implementation:** **COMPLETE & OPERATIONAL**.
2. **Automated Test Results:** **130 / 130 ASSERTIONS PASSED (100%)**.
3. **Historical Payroll Reconciliation:** **BLOCKED BY UPSTREAM DATA**.
4. **Accounting Root-Cause Evidence:** Roster eligibility is proven by hire dates; upstream header overstatement remains an unresolved historical artifact.
5. **Database Preservation:** **VERIFIED 100% FINANCIAL PRESERVATION** against pre-deploy backup.
6. **Stakeholder Authorization:** **PENDING**. Policies A through E remain pending executive sign-off.

### **FINAL PROGRAM DECISION:**
# **IMPLEMENTATION COMPLETE — HISTORICAL RECONCILIATION BLOCKED**
