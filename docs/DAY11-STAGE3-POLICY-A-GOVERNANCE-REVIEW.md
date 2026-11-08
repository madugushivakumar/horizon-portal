# DAY 11 — STAGE 3: POLICY A GOVERNANCE REVIEW (AMENDED)
## Formal Architectural Review of Source-of-Truth Hierarchy Following Stage 2 Forensic Investigation
### Stage 3 of 6: Formal Payroll Governance Package

---

## Document Metadata

| Policy Review Metadata | Detail |
|---|---|
| **Project** | Aura Workforce by Growmar — Horizon Portal |
| **Phase / Task** | Phase 3 — Day 11: Admin Payroll Run Console |
| **Stage** | Stage 3 of 6 — Formal Payroll Governance Package |
| **Reviewed Document** | `docs/DAY11-POLICY-A-SOURCE-OF-TRUTH-DECISION.md` |
| **Governing Policy Version** | **Policy A — Revision 2.1 (Proposed Baseline) + Stage 3 Governance Amendment** |
| **Document Identifier** | `docs/DAY11-STAGE3-POLICY-A-GOVERNANCE-REVIEW.md` |
| **Review Date** | November 7, 2026 |
| **Reviewer Roles** | Senior Enterprise Payroll Governance Architect & Financial Control Specialist |
| **Policy Approval Status** | **PROPOSED — APPROVAL PENDING** |
| **Governance Gate 1 Status** | **LOCKED — NO FINANCIAL EXECUTION AUTHORIZED** |

---

## 1. Executive Summary & Purpose

This document provides a formal architectural and governance review of **Policy A (Source-of-Truth Hierarchy)** following the completion and formal acceptance of the Stage 2 Root-Cause Forensic Investigation, and incorporates the mandatory Stage 3 Policy Issue 1 corrections regarding employee eligibility and headcount authority.

### Key Governance Determinations
1. **Preservation of Revision 2.1 Baseline:** Policy A Revision 2.1 remains the governing technical baseline. Its four core qualifications (evidence-based population terminology, separation of mathematical integrity from statutory authority, classification of headers as unreconciled upstream records, and partition of net pay into four distinct concepts) are preserved intact.
2. **Mandatory Corrected Headcount Principle (Issue 1 Resolution):**
   > *"Employee eligibility and payroll headcount authority must be established using an approved employee-status source that includes relevant effective dates and employment-status evidence. The observed payroll population must not automatically be treated as the verified active workforce."*
3. **Six Distinct Population Definitions Established:** To resolve ambiguity between payslip counts and workforce entitlement, six distinct employee populations are defined.
4. **Approval Status Invariant:** Policy A remains **`PROPOSED — APPROVAL PENDING`**. It has not been approved, ratified, or adopted by corporate leadership. Governance Gate 1 remains **`LOCKED`**.

---

## 2. Six Distinct Employee Population Definitions

In strict compliance with forensic audit standards, technical systems must distinguish the following six employee populations:

```
+---------------------------------------------------------------------------------------------------+
|                                 SIX EMPLOYEE POPULATION CONCEPTS                                  |
+---------------------------------------------------------------------------------------------------+
|  1. EMPLOYEE MASTER POPULATION     All 441 corporate master records in employees.json              |
|  2. OBSERVED PAYROLL POPULATION    Unique employees receiving payslips in a specific run          |
|  3. VERIFIED ACTIVE POPULATION     Employees with verified active status & effective dates         |
|  4. PAYROLL-ELIGIBLE POPULATION    Active employees satisfying period compensation rules          |
|  5. ITEMIZED PAYSLIP POPULATION    Specific subset of employees with generated payslip vouchers   |
|  6. APPROVED PAYROLL HEADCOUNT     Formal headcount authorized by VP of HR in pre-payroll snapshot |
+---------------------------------------------------------------------------------------------------+
```

1. **Employee Master Population:** The complete set of 441 records in `employees.json` / `employees` table. This represents all individuals ever entered into the system across all time, regardless of employment status.
2. **Observed Payroll Population:** The exact count of unique employee IDs possessing an itemized payslip voucher in a specific payroll run (e.g., 424 employees in August 2026; 441 in September 2026).
3. **Verified Active Employee Population:** Individuals whose employment status is formally verified as active, un-terminated, and non-suspended through verified effective-dated HR documentation.
4. **Payroll-Eligible Population:** The subset of the verified active population entitled to receive compensation for that specific pay cycle (e.g., after accounting for unpaid sabbaticals, suspensions, or mid-month start dates).
5. **Itemized Payslip Population:** The actual vouchers generated and stored in the database. In the supplied dataset, this exactly equals the Observed Payroll Population, but in enterprise operations it may differ if un-issued draft vouchers exist.
6. **Approved Payroll Headcount:** The official headcount figure formally certified by the VP of Human Resources in an authorized pre-payroll roster snapshot before payroll execution begins.

---

## 3. Employee-Status Evidence Requirements & Identified Data Gaps

To establish legal and operational eligibility, an enterprise HRMS requires specific effective-dated evidentiary fields. The table below compares enterprise requirements against the current repository state:

| Evidentiary Field | Purpose in Payroll Eligibility | Repository Status in `employees.json` | Compliance Impact |
|---|---|---|---|
| **Effective Hire Date** | Establishes start of compensation entitlement | **PRESENT** (`hire_date`) | Verified: All payslips satisfy $\text{hire\_date} \le \text{period\_end}$. |
| **Effective Termination Date** | Establishes end of compensation entitlement | **MISSING** (No exit date column) | **DATA GAP:** Cannot verify if any employee resigned mid-month. |
| **Employment Status** | Current state (`ACTIVE`, `TERMINATED`, `ON_LEAVE`) | **STATIC STRING** (`status: 'ACTIVE'`) | **DATA GAP:** Static snapshot; lacks historical status audit trail. |
| **Approved Leave-of-Absence** | Identifies Loss of Pay (LOP) / unpaid leave | **MISSING** for payroll link | **EVIDENCE GAP:** `leaves` table exists but is unlinked to payslip calculation. |
| **Payroll Eligibility Date** | Contractual eligibility cutoff date | **MISSING** | **DATA GAP:** Assumed equal to `hire_date` without verification. |
| **Employment-Status History** | Time-series log of promotions, transfers, exits | **MISSING** | **DATA GAP:** No SCD Type 2 or historical status log in database. |
| **Approved Roster Snapshot** | VP HR signed pre-payroll eligibility roster | **MISSING** | **GOVERNANCE GAP:** No pre-run authorization artifact exists. |

---

## 4. Synthesis of Stage 1 & Stage 2 Baselines

### 4.1 Stage 1 Revision 2.1 Foundational Principles
- **Three Evidence Dimensions:**
  - `DATASET AUTHORITY: ESTABLISHED FOR THE SUPPLIED SYNTHETIC BENCHMARK`
  - `MATHEMATICAL INTEGRITY: VERIFIED WITHIN THE SUPPLIED DATASET` (0 paise residual across 2,469 payslips)
  - `LEGAL/ACCOUNTING AUTHORITY: NOT ESTABLISHED FROM AVAILABLE EVIDENCE`
- **Arithmetic Precision Standard:** BigInt-based arbitrary-precision integer arithmetic, with monetary values represented in paise.
- **Header Classification:** `UNRECONCILED UPSTREAM PAYROLL HEADER — GENERATION METHODOLOGY UNVERIFIED`.
- **Four Net Pay Concepts:** Employee-level recorded net pay, itemized payroll aggregate, general ledger balance, and actual bank settlement are strictly separate.

### 4.2 Stage 2 Forensic Corroboration
1. **Source-Data Origin:** Discrepancies exist in the original `03_Data_Pack/payroll_runs.json` and `03_Data_Pack/payslips.json` files.
2. **Zero Seed Artifacts:** `prisma/seed.ts` (lines 348–460) copies records directly into SQLite with 100% relational fidelity.
3. **Zero Application Defects:** `src/lib/payroll/reconciliation-engine.ts` calculates exact BigInt arbitrary-precision integer paise sums with zero error.
4. **Payslip Generation Law Proven:** In 100% of the six runs, every employee with `hire_date <= period_end` received exactly one payslip; zero duplicate payslips exist.

---

## 5. Stakeholder Decision Register for Policy A (Amended)

| Decision ID | Policy Area | Decision Title & Scope | Supporting Evidence | Proposed Authority | Status |
|---|---|---|---|---|---|
| **DEC-A-01** | Realized Compensation | Adopt itemized payslips as authoritative for gross, deductions, and net amounts. | Stage 2 zero-residual math proof | Corporate Controller & CFO | `PROPOSED — APPROVAL PENDING` |
| **DEC-A-02** | Headcount Authority | **Employee Eligibility and Headcount Authority:** Adopt approved employee-status source with effective dates as headcount authority; observed payroll population cannot be treated as verified active workforce. | Analysis of 6 population concepts & data gaps | VP of Human Resources | `PROPOSED — APPROVAL PENDING` |
| **DEC-A-03** | Upstream Headers | Classify stored run headers as historical informational snapshots reflecting pre-reconciliation state. | Stage 1 & 2 forensic traceability | Corporate Controller | `PROPOSED — APPROVAL PENDING` |
| **DEC-A-04** | Discrepancy Resolution | Resolve historical variances via append-only double-entry adjustments (Policy D); zero in-place overwriting. | Historical data preservation mandate | Head of Internal Audit & CFO | `PROPOSED — APPROVAL PENDING` |

---

## 6. Review Conclusion & Governance Status

```
╔══════════════════════════════════════════════════════════════════════════════╗
║               POLICY A GOVERNANCE REVIEW DETERMINATION                       ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  Governing Version:              Policy A Rev 2.1 + Stage 3 Amendment (PROP) ║
║  Current Approval State:         PENDING FORMAL HUMAN REVIEW                 ║
║  Issue 1 Resolution:             100% Implemented (6 Populations, Gaps Noted)║
║  Governance Gate 1:              LOCKED — FINANCIAL EXECUTION NOT AUTHORIZED ║
║  Action Taken:                   Policy Clarified; Zero Financial Mutations  ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

*End of Day 11 Stage 3 Policy A Governance Review (Amended).*
