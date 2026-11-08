# DAY 11 — DISCREPANCY CLASSIFICATION STANDARD
## Canonical Framework for Payroll Variance Analysis & Governance

**Project:** Aura Workforce by Growmar — Horizon Portal  
**Phase:** Phase 3 — Day 11: Admin Payroll Run Console  
**Date:** November 7, 2026  
**Auditor:** Senior Payroll Systems Architect, Financial Data Auditor & QA Lead  
**Repository:** `horizon-portal`  
**Current Branch:** `main`  
**Release Tag:** `phase-3` (Commit: `57ebcba5237d18eb053b1165a6e9795080ed907b`)  

---

## 1. Purpose & Scope

This document establishes the **single, canonical six-category classification system** for evaluating, categorizing, and reporting all historical and operational payroll variances across the Horizon Portal.

Previous draft reports utilized competing or overlapping classification schemes (e.g., "Category E / Category 5", "Category 1–5 mixed numbering", "Category 4 vs. Category E"). This standard supersedes all prior ad-hoc labels and serves as the mandatory reference for all Day 11 documentation, automated tests, and stakeholder communication.

---

## 2. Canonical Six-Category Classification Framework

### Category 1 — Source Import or Data Integrity Error
- **Definition:** A source dataset, import pipeline, or aggregation process contains an incorrect, duplicated, missing, truncated, or corrupted record.
- **Required Evidence:**
  - Original source system extraction file with cryptographic hash.
  - Data ingestion or migration execution logs.
  - Record-level field comparison identifying the specific corrupted bytes or rows.
  - Deterministic and reproducible root-cause proof.
- **Resolution Path:** Requires technical pipeline remediation and authorized re-import under change management control.

### Category 2 — Missing or Invalid Payslip Evidence
- **Definition:** A payroll-eligible employee who performed work during the pay cycle is missing an expected payslip, or an invalid, orphaned, or duplicate payslip has been included in the run.
- **Required Evidence:**
  - HR employment status and active attendance logs for the period.
  - Documented compensation entitlement records (salary structure, contract).
  - Explicit payslip identifier tracing (`PI-xxxxxx`).
  - Authoritative verification that work was performed and went uncompensated.
- **Resolution Path:** Preparation of an individual payslip issuance voucher through an audited payroll adjustment workflow.

### Category 3 — Employee Eligibility or Period Classification Error
- **Definition:** An employee has been incorrectly included or excluded from a payroll period due to misapplied hire dates, termination dates, unpaid leave (LOP), or cross-period timing classification.
- **Required Evidence:**
  - Master employment contract and verified hire/onboarding date.
  - Official termination or sabbatical records.
  - Corporate payroll cutoff and eligibility policy documents.
  - Time and attendance period-boundary records.
- **Resolution Path:** Retrospective eligibility adjustment or pro-rated compensation correction voucher.

### Category 4 — Upstream Planning or Reporting Variance
- **Definition:** A stored run header differs from the itemized payroll records, where available evidence indicates that the header was derived from an upstream planning, budgeting, or batch-control target, but the exact accounting policy or executive authorization to align the header remains unresolved.
- **Required Evidence:**
  - Header data pack origin and immutable checksum.
  - Complete itemized payslip dataset with zero residual line-item math error.
  - Master employee roster comparison proving 100% active staff coverage.
  - Evidence showing that the difference does not alter realized employee bank deposits or legal compensation entitlements.
- **Resolution Path:** Formal corporate policy sign-off (Policy A, B, or C) authorizing the appropriate accounting treatment (reporting-only reconciliation or controlled header alignment).

### Category 5 — Authorized Financial Correction Required
- **Definition:** A verified, approved financial adjustment is required to alter an actual employee entitlement, payroll balance sheet liability, or statutory withholding amount.
- **Required Evidence:**
  - Formal, signed authorization from the CFO, Controller, and VP Compliance.
  - Audited `PayrollAdjustment` ledger proposal with exact BigInt integer-paise amounts.
  - Maker-checker separation of duties (`preparerId !== approverId`).
  - Comprehensive transactional audit trail and point-in-time snapshot preservation.
- **Resolution Path:** Atomic database posting within an isolated Prisma transaction.

### Category 6 — Unresolved / Insufficient Evidence
- **Definition:** The available source data, documentation, or stakeholder input is insufficient to defensibly classify the discrepancy or determine an appropriate correction strategy.
- **Required Evidence:**
  - Documentation of outstanding missing evidence.
  - Explicit identification of the responsible stakeholder.
  - Formally submitted approval request awaiting response.
- **Resolution Path:** Maintain strict `BLOCKED` status; halt execution at Gate 1 until verified documentary evidence is obtained.

---

## 3. Authoritative Classification of Current Target Runs

| Payroll Run | Period | Stored Status | Headcount Diff | Gross Variance | Canonical Classification | Current Governance Status |
|---|---|:---:|:---:|:---:|---|:---:|
| **August 2026 (`PR-2026-08`)** | Aug 1–31, 2026 | `PAID` | -5 employees | -₹837,598.52 | **Category 4 — Upstream Planning or Reporting Variance** | **BLOCKED** |
| **September 2026 (`PR-2026-09`)** | Sep 1–30, 2026 | `POSTED - PAYMENT PENDING` | -3 employees | -₹358,328.51 | **Category 4 — Upstream Planning or Reporting Variance** | **BLOCKED** |

### Detailed Forensic Justification:
1. **August 2026 (`PR-2026-08`):**
   - The stored header reports 429 employees and ₹48,685,007.97 gross pay.
   - The itemized payslips contain exactly 424 employees and ₹47,847,409.45 gross pay.
   - All 424 employees active as of August 31 received payslips ($0\text{ paise}$ error).
   - The 17 absent employees joined in September 2026.
   - The available evidence does not independently establish that the 5-person difference represents approved budgeted vacancies.
   - Classified as **Category 4** because it represents an upstream batch control discrepancy on a historical disbursed run whose formal accounting treatment (Policy C) is pending executive sign-off.
2. **September 2026 (`PR-2026-09`):**
   - The stored header reports 444 employees and ₹54,788,660.03 gross pay.
   - The itemized payslips contain exactly 441 employees and ₹54,430,331.52 gross pay.
   - All 441 employees in Growmar's total company history received payslips ($0\text{ paise}$ error).
   - The available evidence does not independently establish that the 3-person difference represents approved budgeted vacancies.
   - Classified as **Category 4** because it represents an upstream batch control discrepancy on an in-flight run whose formal pre-approval correction policy (Policy B) is pending executive sign-off.

---

## 4. Multi-Tiered Classification Hierarchy (Level 1 vs. Level 2)

As formalized in [`docs/DAY11-DISCREPANCY-CLASSIFICATION-RECONCILIATION.md`](file:///c:/Users/Madugu%20Shiva%20Kumar/OneDrive/图片/Desktop/horizon-portal/docs/DAY11-DISCREPANCY-CLASSIFICATION-RECONCILIATION.md), the classification framework operates across two distinct structural levels:

### Level 1: Broad Governance Classification (Governing Corporate Policy & Gate 1)
- **Standard:** The six canonical categories defined in Section 2 (`Category 1` through `Category 6`).
- **Application:** Governs legal accounting treatment, audit footnote disclosures, and Gate 1 lock conditions.
- **Current Target Runs:** Both August 2026 (`PR-2026-08`) and September 2026 (`PR-2026-09`) are officially classified under **`Category 4 — Upstream Planning or Reporting Variance`**.

### Level 2: Specific Causal Hypotheses & Technical Observations (Engineering Level)
- **Standard:** Descriptive labels representing investigated technical hypotheses regarding why the upstream variance arose.
- **Application:** Used exclusively in technical investigation notes; strictly prohibited from being asserted as verified accounting facts until external corporate documentation is supplied.
- **Current Hypotheses:**
  - **August 2026 (`PR-2026-08`):** `TIMING_AND_ROSTER_LAG` — Causal hypothesis that the header reflected preliminary roster additions prior to attendance confirmation. *Status: Unverified hypothesis requiring VP HR / Controller confirmation.*
  - **September 2026 (`PR-2026-09`):** `SYSTEM_BATCH_HEADER_CALCULATION_DEFECT` — Causal hypothesis that preliminary batch generation logic erroneously counted future October joiners (`EMP00442`–`EMP00444`). *Status: Unverified hypothesis requiring Head of FP&A confirmation.*

---

## 5. Mapping of Obsolete Legacy Designations

| Obsolete Label in Prior Reports | Correct Canonical Category | Rationale for Deprecation |
|---|---|---|
| *"Category E"* | **Category 4** | Letter-based categories conflicted with numeric ledger classifications. |
| *"Category 5 (Unresolved Discrepancy)"* | **Category 4** | In prior drafts, Category 5 was conflated with unapproved reporting variances. Category 5 is now reserved exclusively for authorized financial adjustments. |
| *"Category 4 vs. Category E"* | **Category 4** | Unified into a single standardized definition with explicit evidence requirements. |

---

## 5. Mandatory Application Across All Day 11 Material

All audit reports, test descriptions, code docstrings, and stakeholder requests must use the exact names and definitions defined in Section 2. No arbitrary or mixed categories are permitted.

