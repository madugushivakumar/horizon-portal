# DAY 11 — STAGE 2: FINDINGS AND REMEDIATION OPTIONS
## Technical Analysis of Potential Future Remediation Strategies for Payroll Discrepancies
### (Non-Mutating Evaluation — No Changes Implemented)

| Document Field | Formal Audit Value |
|---|---|
| **Project** | Aura Workforce by Growmar — Horizon Portal |
| **Phase / Task** | Phase 3 — Day 11: Admin Payroll Run Console |
| **Stage** | Stage 2 of 6 — Root-Cause Forensic Investigation |
| **Document Identifier** | `docs/DAY11-STAGE2-FINDINGS-AND-REMEDIATION-OPTIONS.md` |
| **Date** | November 7, 2026 |
| **Status** | Strategic Evaluation Only — Zero Implementation |

---

## 1. Executive Summary & Purpose

This document provides a rigorous architectural evaluation of potential remediation options for the historical payroll mismatches identified in Stage 1 and Stage 2.

In strict accordance with the Master Execution Directive:
- **No changes are implemented in this stage.**
- **Overwriting historical records is rejected as a default solution.**
- **All future remediation must be governed by authorized double-entry accounting principles under Gate 1.**

---

## 2. Findings Summary to Address

1. **Finding F-01 (Pre-Existing Upstream Discrepancy):** All six pay cycles (`PR-2026-04` through `PR-2026-09`) maintain stored headers in `payroll_runs` that exceed itemized payslip totals in `payslips`.
2. **Finding F-02 (Headcount Over-Estimation in Headers):** Header headcounts (`employees_paid`) were established using targets higher than the actual employee population hired as of the period end dates.
3. **Finding F-03 (Dual Lifecycle Distinction):**
   - Runs `PR-2026-04` through `PR-2026-08` have status `'PAID'` (historical disbursed runs).
   - Run `PR-2026-09` has status `'POSTED - PAYMENT PENDING'` (in-flight operational run).
4. **Finding F-04 (Zero Double-Entry Adjustment Records):** Table `payroll_adjustments` exists in `prisma/dev.db` but currently contains 0 rows.

---

## 3. Evaluation of Remediation Options

---

### OPTION A: Preserved Dual-Presentation with Transparent Audit Adjustments (RECOMMENDED)

#### 1. Description & Architecture
- **Preserve Historical Headers:** Retain all original `payroll_runs` header values (`total_gross`, `total_net`, `employees_paid`) unmodified to preserve historical data provenance.
- **Record Double-Entry Adjustments:** For each of the six runs, insert a non-operating reporting adjustment record into `payroll_adjustments` after formal Policy A–E sign-off:
  - `adjustment_type`: `'HISTORICAL_REPORTING_ADJUSTMENT'` (Category 4)
  - `original_*_paise`: Stored header values
  - `adjusted_*_paise`: Sum of itemized payslips
  - `variance_*_paise`: Exact computed delta (negative)
  - `reconciliation_source`: `'ITEMIZED_PAYSLIPS'`
- **Application Display:** The UI continues to render the Dual Presentation, showing the Original Header, the Non-Operating Variance, and the Net Realized Compensation.

#### 2. Risk & Impact Analysis
- **Financial Risk:** **Zero.** No financial amounts are fabricated or erased.
- **Operational Risk:** **Low.** Fully backward-compatible; does not break existing database relations.
- **Audit Defensibility:** **Highest.** Conforms to enterprise accounting standards (GAAP/IFRS) where historical records are adjusted via ledger entries rather than in-place overwrites.
- **Approval Required:** CFO and Corporate Controller sign-off on Policies A, B, and C.
- **Test Requirements:** Full regression of `test-day11-payroll-reconciliation.ts` verifying adjustment idempotency and BigInt paise precision.
- **Rollback Consideration:** Trivial rollback by deleting rows from `payroll_adjustments` without modifying core tables.

---

### OPTION B: In-Flight Alignment for Run 18 (`PR-2026-09`) Only; Historical Adjustments for Runs 1–5

#### 1. Description & Architecture
- **Distinguish Disbursed vs. In-Flight:**
  - For runs `PR-2026-04` through `PR-2026-08` (Status `'PAID'`), apply Option A (audit adjustments only).
  - For run `PR-2026-09` (Status `'POSTED - PAYMENT PENDING'`), execute an authorized pre-approval batch alignment: update `payroll_runs.employees_paid = 441`, `total_gross = 54430331.52`, `total_net = 47782326.60` prior to maker-checker approval.
- **Record Pre-Approval Audit Trail:** Record the alignment in `payroll_adjustments` with type `'PRE_APPROVAL_BATCH_ALIGNMENT'` and log the action in `audit_logs`.

#### 2. Risk & Impact Analysis
- **Financial Risk:** **Low-to-Medium.** Modifies header on an unapproved, un-disbursed run prior to lock.
- **Operational Risk:** **Low.** Aligns September header with itemized payslips so that September achieves `MATCHED` status upon formal approval.
- **Audit Defensibility:** **High.** Standard corporate practice to align draft batch totals prior to final approval.
- **Approval Required:** HR and Admin dual authorization under Policy B and Policy E.
- **Test Requirements:** Verify maker-checker workflow, idempotency guards, and Month-over-Month calculation integrity.
- **Rollback Consideration:** Rollback via `original_*` columns stored in `payroll_runs` and `payroll_adjustments`.

---

### OPTION C: In-Place Overwriting of Historical Headers Across All Six Runs (REJECTED)

#### 1. Description & Architecture
Directly execute SQL `UPDATE payroll_runs SET total_gross = ..., total_net = ..., employees_paid = ...` across all six runs to force tie-out equality to `MATCHED`.

#### 2. Why This Option Is Explicitly REJECTED
- **Violates Audit Integrity:** Overwriting historical records destroys forensic evidence of upstream discrepancies.
- **Violates Accounting Standards:** Once a payroll run is marked `'PAID'`, historical batch totals must never be mutated in place.
- **Creates Unaudited Historical Changes:** Destroys data pack reproducibility against `03_Data_Pack/payroll_runs.json`.
- **Recommendation:** **STRICTLY PROHIBITED.**

---

### OPTION D: Upstream Source Data Regeneration (EXTERNAL DEPENDENCY)

#### 1. Description & Architecture
Request the curriculum vendor or upstream data generator to re-issue `03_Data_Pack/payroll_runs.json` with reconciled headers matching `payslips.json`.

#### 2. Risk & Impact Analysis
- **Feasibility:** Outside the control of the development team.
- **Impact:** Solves the root cause upstream, but prevents demonstrating enterprise audit and adjustment capabilities.

---

## 4. Recommended Strategic Path Forward

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                    RECOMMENDED FUTURE REMEDIATION PATH                       ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║   1. Formal Stakeholder Review of Policies A through E (Stage 3).            ║
║   2. Unlock Gate 1 upon human authorization.                                 ║
║   3. Implement OPTION A (Double-Entry Reporting Adjustments in               ║
║      payroll_adjustments) for historical runs PR-2026-04 through 08.         ║
║   4. Implement OPTION B (Pre-Approval Batch Alignment) for in-flight         ║
║      run PR-2026-09.                                                         ║
║   5. Preserve 100% of historical header data with zero in-place overwrites.  ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

*This evaluation is strategic only. No remediation actions may be executed until explicit authorization is granted.*

