# DAY 11 — FINAL ACCEPTANCE CLOSURE REPORT
**Project:** Aura Workforce by Growmar — Horizon Portal  
**Phase:** Phase 3 — Teams and Insight (Day 11: Admin Payroll Run Console)  
**Date:** November 7, 2026  
**Auditor:** Senior Payroll Systems Architect, Financial Data Auditor, Full-Stack Engineer and QA Lead  
**Repository:** `horizon-portal`  
**Current Branch:** `main`  
**Release Tag:** `phase-3` (Commit: `57ebcba5237d18eb053b1165a6e9795080ed907b`)  

---

## 1. Executive Summary & Final Verdict

This document represents the formal, evidence-backed closure report for **Day 11: Admin Payroll Run Console** in Phase 3 of the Aura Workforce by Growmar — Horizon Portal project.

Following comprehensive code review, multi-role security testing, BigInt integer-paise recalculation directly from immutable JSON files, database diffing, and forensic investigations into historical report discrepancies, the official program determination is:

### **FINAL DECISION LABEL:**
# **IMPLEMENTATION COMPLETE — HISTORICAL RECONCILIATION BLOCKED**

### Key Determinations:
1. **Software Implementation:** 100% complete, fully verified, secure, and production-ready across all frontend components, backend APIs, RBAC guards, Maker-Checker controls, and audit trails.
2. **Automated Testing:** 130 / 130 assertions passing with 0 failures across the two dedicated Day 11 test suites.
3. **Database Financial Integrity:** 100% preserved. Zero financial records modified, zero synthetic records in `payroll_adjustments`, and zero referential integrity violations.
4. **Historical Reconciliation Status:** All six itemized runs (`PR-2026-04` through `PR-2026-09`) in the supplied data pack exhibit negative variances where stored header figures exceed itemized payslip sums. The two-run tie-out requirement cannot be satisfied honestly without fabricating data or unauthorized mutations; it is honestly evaluated as **NOT SATISFIED IN THE SUPPLIED HISTORICAL DATA**.

---

## 2. Immutable Source File Verification

The authoritative source files governing payroll calculations were independently audited:

| File Path | Description | File Size | SHA-256 Checksum | Authoritative Count |
|---|---|---|---|---|
| `03_Data_Pack/payroll_runs.json` | Upstream static payroll run headers | 4,062 bytes | `d501c1c70b0515d77f39dc2af9597b01b729e76eb3feff8d730c697131e74e21` | 18 runs (`PR-2025-04` to `PR-2026-09`) |
| `03_Data_Pack/payslips.json` | Upstream static itemized payslips | 1,432,529 bytes | `9e6f7649e92f821fd680ad9963b730d087c7fafa6a59ebff8790a88c54a04196` | 2,469 payslips across 6 runs |
| `03_Data_Pack/employees.json` | Upstream static master employee roster | 138,418 bytes | `ab0d227444095287aec9dbb21f0f31b98550336cd0a8bcfb74619b9947d26a90` | 441 employees (`EMP-0002` to `EMP-0745`) |

### Forensic Verification of Record Integrity:
- Duplicate `payroll_item_id`s in `payslips.json`: **0**
- Duplicate `employee_id`s within any individual payroll run: **0**
- Missing master employee references (`employee_id` not in `employees.json`): **0**
- Invalid, negative, or NaN monetary values: **0**
- Individual payslip arithmetic errors ($\text{Gross} - \text{Deductions} \ne \text{Net}$): **0** ($100\%$ balanced across all 2,469 slips).

---

## 3. Independent Six-Run BigInt Integer-Paise Calculations

Every figure below was derived directly from `03_Data_Pack/payroll_runs.json` and `03_Data_Pack/payslips.json` using BigInt integer paise ($1\text{ INR} = 100\text{ paise}$), where $\text{Variance} = \text{Itemized Total} - \text{Stored Header Total}$:

| Run ID | Period | Stored Headcount | Itemized Headcount | Unique Employees | Stored Gross (₹) | Itemized Gross (₹) | Gross Variance (₹) | Stored Deductions (₹) | Itemized Deductions (₹) | Deductions Variance (₹) | Stored Net (₹) | Itemized Net (₹) | Net Variance (₹) | Reconciled Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `PR-2026-04` | 2026-04-01 to 2026-04-30 | 413 | 388 | 388 | 61,486,224.92 | 58,268,345.09 | -3,217,879.83 | 8,169,255.04 | 7,776,749.43 | -392,505.61 | 53,316,969.88 | 50,491,595.66 | -2,825,374.22 | **MISMATCH** |
| `PR-2026-05` | 2026-05-01 to 2026-05-31 | 413 | 394 | 394 | 47,013,633.45 | 44,782,349.84 | -2,231,283.61 | 5,341,181.75 | 5,084,152.04 | -257,029.71 | 41,672,451.70 | 39,698,197.80 | -1,974,253.90 | **MISMATCH** |
| `PR-2026-06` | 2026-06-01 to 2026-06-30 | 421 | 406 | 406 | 53,971,863.57 | 51,631,047.77 | -2,340,815.80 | 6,928,385.12 | 6,584,736.78 | -343,648.34 | 47,043,478.45 | 45,046,310.99 | -1,997,167.46 | **MISMATCH** |
| `PR-2026-07` | 2026-07-01 to 2026-07-31 | 427 | 416 | 416 | 48,280,389.27 | 46,871,860.72 | -1,408,528.55 | 5,492,004.72 | 5,288,689.77 | -203,314.95 | 42,788,384.55 | 41,583,170.95 | -1,205,213.60 | **MISMATCH** |
| `PR-2026-08` | 2026-08-01 to 2026-08-31 | 429 | 424 | 424 | 48,685,007.97 | 47,847,409.45 | -837,598.52 | 5,511,689.61 | 5,379,448.08 | -132,241.53 | 43,173,318.36 | 42,467,961.37 | -705,356.99 | **MISMATCH** |
| `PR-2026-09` | 2026-09-01 to 2026-09-30 | 444 | 441 | 441 | 54,788,660.03 | 54,430,331.52 | -358,328.51 | 6,698,981.73 | 6,648,004.92 | -50,976.81 | 48,089,678.30 | 47,782,326.60 | -307,351.70 | **MISMATCH** |
| **Total** | **6 Periods** | **2,547** | **2,469** | **2,469** | **314,225,779.21** | **303,831,344.39** | **-10,394,434.82** | **38,141,497.97** | **36,761,781.02** | **-1,379,716.95** | **276,084,281.24** | **267,069,563.37** | **-9,014,717.87** | **ALL MISMATCH** |

---

## 4. Arithmetic Identity Verification

1. **Itemized Accounting Balance ($\text{Gross} - \text{Deductions} = \text{Net}$):**
   - `PR-2026-04`: ₹58,268,345.09 − ₹7,776,749.43 = ₹50,491,595.66 ($\Delta = 0\text{ paise}$)
   - `PR-2026-05`: ₹44,782,349.84 − ₹5,084,152.04 = ₹39,698,197.80 ($\Delta = 0\text{ paise}$)
   - `PR-2026-06`: ₹51,631,047.77 − ₹6,584,736.78 = ₹45,046,310.99 ($\Delta = 0\text{ paise}$)
   - `PR-2026-07`: ₹46,871,860.72 − ₹5,288,689.77 = ₹41,583,170.95 ($\Delta = 0\text{ paise}$)
   - `PR-2026-08`: ₹47,847,409.45 − ₹5,379,448.08 = ₹42,467,961.37 ($\Delta = 0\text{ paise}$)
   - `PR-2026-09`: ₹54,430,331.52 − ₹6,648,004.92 = ₹47,782,326.60 ($\Delta = 0\text{ paise}$)
   - **Total Row:** ₹303,831,344.39 − ₹36,761,781.02 = ₹267,069,563.37 ($\Delta = 0\text{ paise}$)
2. **Variance Calculation Verification ($\text{Variance} = \text{Itemized Total} - \text{Stored Header Total}$):**
   - Gross Variance: ₹303,831,344.39 − ₹314,225,779.21 = −₹10,394,434.82 ($\Delta = 0\text{ paise}$)
   - Deductions Variance: ₹36,761,781.02 − ₹38,141,497.97 = −₹1,379,716.95 ($\Delta = 0\text{ paise}$)
   - Net Variance: ₹267,069,563.37 − ₹276,084,281.24 = −₹9,014,717.87 ($\Delta = 0\text{ paise}$)
   - Cross-check: $\text{Gross Variance} - \text{Deductions Variance} = \text{Net Variance}$:
     $$-10,394,434.82 - (-1,379,716.95) = -9,014,717.87\quad (\Delta = 0\text{ paise})$$
3. **Total Row Equivalence:**
   The Total row equals the exact sum of the six individual run rows for every metric.

---

## 5. Investigation of Earlier April–July Numerical Discrepancies

In earlier draft report `docs/DAY11-FINAL-PAYROLL-RECONCILIATION-RESOLUTION-REPORT.md`, stored and itemized gross figures for April through July differed from the raw JSON files (e.g., April Gross was listed as ₹42,751,208.10 stored vs ₹39,533,328.27 items):

### Forensic Investigation Findings:
1. **Identical Mathematical Variances:** In that earlier document, the reported gross variance (−₹3,217,879.83), net variance (−₹2,825,374.22), and headcount variance (−25) were **identical to the paise** to the true source variances.
2. **Investigation Across Repository & Git History:**
   - Exhaustive searches across Git history (`git log -S`) and workspace files confirmed zero previous commits containing ₹42,751,208.10 or ₹39,533,328.27.
   - None of the 2,469 payslips in `03_Data_Pack/payslips.json` or runs in `03_Data_Pack/payroll_runs.json` sum to those base figures, regardless of field selection, bonus exclusion, or LOP filtering.
3. **Formal Audit Classification:**
   **`PREVIOUS REPORT CONTAINED UNSUPPORTED BASE FIGURES — EXACT ORIGIN NOT ESTABLISHED`**
   The earlier report preserved the correct variances but incorporated unsupported base totals. All active reports have been synchronized to the authoritative immutable source files.

---

## 6. Two-Run Header-to-Item Tie-Out Decision

The official Day 11 requirement states:
> *"Check that the totals shown for a run equal the sum of its items for 2 runs."*

### Audit Assessment:
- Across all six itemized runs, **every single run has negative variances** where stored headers exceed payslip sums.
- In September (`PR-2026-09`), all 441 employees in the company received a payslip; the header stated 444 (-3 headcount, -₹358,328.51 gross, -₹307,351.70 net).
- In August (`PR-2026-08`), all 424 active employees received a payslip (the other 17 joined in September); the header stated 429 (-5 headcount, -₹837,598.52 gross, -₹705,356.99 net).
- Zero runs in the supplied dataset tie out with 0 variance.
- Modifying stored headers or fabricating payslips to force a match is strictly prohibited under financial engineering ethics.
- **Decision:** **BLOCKED — NOT SATISFIED IN THE SUPPLIED HISTORICAL DATA**.
- **Closure Requirements:** To close this requirement legitimately, either:
  1. Executive leadership must execute sign-off on Policies A through E to authorize audited adjustment vouchers in `payroll_adjustments`, or
  2. The academic program must provide updated upstream source files with reconciled headers.

---

## 7. Software-Level Acceptance Audit

| Subsystem / Feature | Acceptance Criteria | Verified Result | Evidence |
|---|---|---|---|
| **Payroll Listing** | All 18 runs visible on console | **PASS** | `AdminPayrollConsole.tsx` default `pageSize: 20` loads all 18 runs without truncation. |
| | Newest-first reverse chronological sort | **PASS** | Row 1 is `PR-2026-09`, Row 18 is `PR-2025-04`. |
| | Accurate status badging | **PASS** | Operational (`POSTED - PAYMENT PENDING`, `PAID`) and badges (`MISMATCH`, `NO_ITEMS`) verified. |
| | Live search and filtering | **PASS** | Instant filtering across period, run ID, and status verified. |
| **Payroll Detail** | Itemized payslip table | **PASS** | Paginated table (25 rows/page) rendering employee details and verified net pay. |
| | Employee search | **PASS** | Search by Employee ID or Name returns matches instantly. |
| | Sensitive field exclusion | **PASS** | API projections strictly exclude `password`, `passwordHash`, `token`, `bankAccount`. |
| | Older-run friendly message | **PASS** | Older runs (`PR-2025-04` to `PR-2026-03`) display explicit archival disclaimer; no synthetic records. |
| **Reconciliation Engine** | Four-metric comparison | **PASS** | Server calculates Gross, Deductions, Net, and Headcount with BigInt paise precision. |
| | Honest variance exposure | **PASS** | Displays exact rupee and headcount variance; blocks false `MATCH` designations. |
| **Approval Workflow** | Dual control / Separation of duties | **PASS** | Preparer self-approval strictly blocked (HTTP 403 Forbidden). |
| | Role-based authorization | **PASS** | HR and Admin authorized (HTTP 200); Employee and Manager forbidden (HTTP 403). |
| | Gating constraints | **PASS** | Paid runs blocked (HTTP 409); Unreconciled runs blocked (HTTP 422); Duplicates blocked (HTTP 409). |
| | Atomic audit logging | **PASS** | Status update and `PAYROLL_APPROVED` log occur in single `prisma.$transaction`. |
| | Concurrency safety | **PASS** | Optimistic guard `approvalStatus: { not: 'Approved' }` prevents race conditions. |
| **MoM Trend Analysis** | Consecutive period matching | **PASS** | Pairs September 2026 with August 2026; calculates +₹4,916,359.94 (+11.39%). |
| | Edge case handling | **PASS** | April 2025 gracefully returns `isAvailable: false` with friendly message. |

---

## 8. Database Preservation & Integrity Audit

- **Current Live Database:** `prisma/dev.db` (3,637,248 bytes, SHA-256: `187f26a94e993283a2bd19d29a749e556853850faa0fb1bdb24b6c99552aee14`).
- **Available Pre-Deploy Backup:** `prisma/backups/dev-backup-pre-deploy-20261106T160910Z.db` (3,637,248 bytes, SHA-256: `e54351605ebf03f86c861dfca4d0a752b5e48a968090009de5d083fe4f2ef4ea`).
- **Record-by-Record Comparison Results:**
  - `payslips` (2,469 records): **100% Identical**. Zero changes to salary amounts or deductions.
  - `employees` (441 records): **100% Identical**. Zero changes to profiles or hire dates.
  - `audit_logs` (87 records): **100% Identical**.
  - `users` (8 records): **100% Identical**.
  - `payroll_adjustments`: **0 records** (Governance Gate 1 preserved).
  - `payroll_runs` (18 records): All common columns **100% Identical**.
  - `tasks` (4,844 records): 4,843 / 4,844 identical; 1 non-financial timestamp `TASK-24250.updated_at` updated during Day 13 testing.
  - All other 20 business tables: **100% Identical**.
  - `PRAGMA integrity_check`: **`ok`**; `PRAGMA foreign_key_check`: **`0 violations`**.
- **Methodological Limitation Regarding Hash `74d656f9...`:**
  The file with that hash is not available on disk for binary byte-level diffing; therefore, while SQLite change counters (incrementing from 1 to 5366) and ephemeral test fixture executions provide a proven mechanism for SQLite binary hash drift, binary byte-level diffing against `74d656f9...` cannot be directly executed without that specific file.

---

## 9. Automated Testing Execution Results

Executed against the live workspace on November 7, 2026:
1. `scripts/test-day11-payroll.ts`: **53 / 53 passed (0 failed)**
2. `scripts/test-day11-payroll-reconciliation.ts`: **77 / 77 passed (0 failed)**
3. Total Day 11 Automated Assertions: **130 / 130 passed (100% pass rate)**
4. Total Project Test Health: **930 / 930 passed (0 failed)**
5. TypeScript Compilation: `npx tsc --noEmit` exited with code 0 (zero errors).
6. Prisma Schema Validation: `npx prisma validate` exited with code 0 (valid schema).

---

## 10. Official Day 11 Final Acceptance Matrix

| Official Day 11 requirement | Result | Evidence & Verification |
|---|---|---|
| **Display all 18 payroll runs** | **PASS** | `AdminPayrollConsole.tsx` renders all 18 runs on a single page (`pageSize: 20`). |
| **Newest-first ordering** | **PASS** | Descending sort by period start (`PR-2026-09` to `PR-2025-04`). |
| **Run detail and search** | **PASS** | `PayrollRunDetails.tsx` displays full breakdown and live employee search. |
| **Accurate financial totals** | **PASS** | Scaled BigInt paise utilities guarantee exact 2-decimal rupee precision. |
| **Older-run friendly message** | **PASS** | Explicit archival notice rendered for all 12 older runs (`PR-2025-04` to `PR-2026-03`). |
| **Two-run totals equal item sums** | **BLOCKED** | Stored headers exceed payslip sums across all 6 itemized runs. Software accurately detects and displays `MISMATCH`. |
| **Approval confirmation** | **PASS** | Dedicated modal requires explicit confirmation before initiating approval. |
| **Audit logging** | **PASS** | Atomic `PAYROLL_APPROVED` entry created in Prisma `$transaction`. |
| **HR/Admin access restriction** | **PASS** | RBAC server component and API route guards reject Employee/Manager with HTTP 403. |
| **Maker-checker separation** | **PASS** | Preparer self-approval strictly rejected with HTTP 403 Forbidden. |
| **Previous-month comparison** | **PASS** | Accurate consecutive MoM calculation (+₹4,916,359.94 / +11.39% for Sep 2026). |
| **Database financial integrity** | **PASS** | Zero financial mutations; 0 rows in `payroll_adjustments`; PRAGMA checks ok. |

---

## 11. Final Acceptance Determination

### **FINAL DECISION LABEL:**
# **IMPLEMENTATION COMPLETE — HISTORICAL RECONCILIATION BLOCKED**

### Decision Rationale:
1. **Software Complete:** All 11 technical, architectural, and security requirements are fully implemented, verified, and passing 130/130 automated tests.
2. **Data-Bound Blocker:** The 12th requirement (two-run tie-out) cannot be satisfied in the supplied upstream data because every itemized run contains negative variances where headers exceed item sums.
3. **Audit Integrity Upheld:** Refusing to fabricate fake employee records or silently overwrite historical run headers preserves strict professional financial compliance and accounting auditability.

