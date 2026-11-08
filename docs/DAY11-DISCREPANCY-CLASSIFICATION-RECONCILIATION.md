# DAY 11 — DISCREPANCY CLASSIFICATION RECONCILIATION REPORT
## Multi-Tiered Framework Harmonizing Broad Governance Categories & Specific Causal Hypotheses

**Project:** Aura Workforce by Growmar — Horizon Portal  
**Phase:** Phase 3 — Day 11: Admin Payroll Run Console  
**Date:** November 7, 2026  
**Auditor Roles:** Senior Enterprise Governance Architect, Payroll Systems Architect, Financial Controls Analyst, Corporate Accounting Policy Analyst  
**Repository:** `horizon-portal`  
**Current Branch:** `main`  
**Release Tag:** `phase-3` (Commit: `57ebcba5237d18eb053b1165a6e9795080ed907b`)  
**Scope:** Resolution of Inconsistency 1 — Relationship between Category 4 and Specific Discrepancy Labels  

---

## 1. Executive Summary & Purpose of Reconciliation

Earlier Day 11 governance documentation established a canonical six-category governance classification system in [`docs/DAY11-DISCREPANCY-CLASSIFICATION-STANDARD.md`](file:///c:/Users/Madugu%20Shiva%20Kumar/OneDrive/图片/Desktop/horizon-portal/docs/DAY11-DISCREPANCY-CLASSIFICATION-STANDARD.md), categorizing both August 2026 (`PR-2026-08`) and September 2026 (`PR-2026-09`) under:

> **Category 4 — Upstream Planning or Reporting Variance**

Subsequent technical investigation reports introduced more descriptive labels:
- August 2026: `TIMING_AND_ROSTER_LAG`
- September 2026: `SYSTEM_BATCH_HEADER_CALCULATION_DEFECT`

An audit inconsistency arose because these specific labels were occasionally described in working drafts as "established root causes" without formal reconciliation against the six-category standard. 

This document formally establishes a **two-level hierarchical taxonomy** that reconciles these classifications, defines the exact evidentiary threshold of each term, and prevents unsubstantiated root-cause assertions from contaminating corporate accounting policy.

---

## 2. The Two-Level Discrepancy Classification Architecture

To resolve the tension between broad governance requirements and specific engineering observations, the Horizon Portal formally adopts a two-level hierarchy:

```
+---------------------------------------------------------------------------------------------------+
|                        LEVEL 1: BROAD GOVERNANCE CLASSIFICATION                                   |
|                        (Governs Accounting Treatment, Gate 1 & Audit Footnotes)                   |
|                                                                                                   |
|                       CATEGORY 4: UPSTREAM PLANNING OR REPORTING VARIANCE                         |
|   - Applies to runs where stored batch header differs from verified itemized payslip totals.      |
|   - Realized employee net pay entitlements are mathematically sound ($0.00 payslip variance).     |
|   - External banking settlement (UTR) or upstream planning memos remain pending verification.     |
+---------------------------------------------------------------------------------------------------+
                                                  |
                                                  v
+---------------------------------------------------------------------------------------------------+
|                        LEVEL 2: SPECIFIC CAUSAL HYPOTHESIS & TECHNICAL OBSERVATION                |
|                        (Governs Engineering Investigation & Root-Cause Hypotheses)                |
|                                                                                                   |
|           [ AUGUST 2026: PR-2026-08 ]                       [ SEPTEMBER 2026: PR-2026-09 ]        |
|               TIMING_AND_ROSTER_LAG                    SYSTEM_BATCH_HEADER_CALCULATION_DEFECT     |
|                                                                                                   |
|   Status: CAUSAL HYPOTHESIS / UNVERIFIED             Status: CAUSAL HYPOTHESIS / SUSPECTED        |
|   - 424 active employees received pay.               - 441 employees active in Sept received pay. |
|   - 17 joiners onboarded in September.               - 3 employees (EMP442-444) joined in Oct.    |
|   - Difference of 5 employees is UNPROVEN.           - Batch header of 444 is SUSPECTED defect.   |
|   - Requires HR/Budgeting confirmation.              - Requires legacy import formula proof.      |
+---------------------------------------------------------------------------------------------------+
```

---

## 3. Rigorous Evaluation of Level 2 Labels

Section 3.3 mandates establishing what the specific labels actually represent. Each label is evaluated against five rigorous forensic criteria:

### 3.1 August 2026: `TIMING_AND_ROSTER_LAG`
1. **Is it a Verified Root Cause?** **NO.** Forensic data confirms that exactly 424 employees performed work in August and all 424 received payslips ($0\text{ paise}$ error). The stored header reports 429 employees. The difference of five employees has been hypothesized as late roster additions or budgeted headcount placeholders, but **no external HR onboarding log or approved budget authorization exists in the repository to substantiate this hypothesis**.
2. **Is it a Suspected Root Cause?** **YES.** It is the primary technical hypothesis based on the presence of 17 new hires joining in early September.
3. **Is it an Observed Symptom?** **NO.** The observed symptom is: *Headcount difference of -5 employees and gross pay variance of -₹837,598.52 between header and payslips*.
4. **Is it a Proposed Technical Classification?** **YES.** It was proposed by engineering to describe the likely business mechanism.
5. **Does it Require Stakeholder Confirmation?** **YES.** The VP Human Resources and Corporate Controller must confirm whether the August run header included 5 budgeted vacancies or unfulfilled requisitions before this hypothesis can be treated as fact.

### 3.2 September 2026: `SYSTEM_BATCH_HEADER_CALCULATION_DEFECT`
1. **Is it a Verified Root Cause?** **NO.** Forensic data proves that all 441 employees in Growmar's workforce history received payslips totaling ₹54,430,331.52. The header reports 444 employees and ₹54,788,660.03. Employees `EMP00442`, `EMP00443`, and `EMP00444` have confirmed joining dates in October 2026. While it is technically plausible that the preliminary batch script erroneously aggregated October hires, the source code and run logs of the legacy import script that created the header are unavailable.
2. **Is it a Suspected Root Cause?** **YES.** It is a highly credible technical hypothesis.
3. **Is it an Observed Symptom?** **NO.** The observed symptom is: *Headcount difference of -3 employees and gross pay variance of -₹358,328.51 on an unapproved, in-flight batch*.
4. **Is it a Proposed Technical Classification?** **YES.** It categorizes the failure of the preliminary batch generator.
5. **Does it Require Stakeholder Confirmation?** **YES.** The Head of FP&A and Head of Payroll Operations must confirm whether the 444-person header was an unverified operational estimate intended to be superseded by itemized payslips.

---

## 4. Mandatory Discrepancy Classification Reconciliation Matrix

The following matrix provides the definitive, evidence-backed reconciliation between the two classification tiers:

| Dimension / Field | August 2026 (`PR-2026-08`) | September 2026 (`PR-2026-09`) |
|---|---|---|
| **Period & Run Type** | August 1–31, 2026 (Historical Disbursed Run) | September 1–30, 2026 (In-Flight Unapproved Run) |
| **Existing Broad Classification (Level 1)** | **Category 4 — Upstream Planning or Reporting Variance** | **Category 4 — Upstream Planning or Reporting Variance** |
| **Specific Causal Hypothesis (Level 2)** | `TIMING_AND_ROSTER_LAG` | `SYSTEM_BATCH_HEADER_CALCULATION_DEFECT` |
| **Observed Discrepancy (Verified Facts)** | Stored Header: 429 HC, ₹48,685,007.97 Gross<br>Itemized Payslips: 424 HC, ₹47,847,409.45 Gross<br>**Variance: -5 HC, -₹837,598.52 Gross** | Stored Header: 444 HC, ₹54,788,660.03 Gross<br>Itemized Payslips: 441 HC, ₹54,430,331.52 Gross<br>**Variance: -3 HC, -₹358,328.51 Gross** |
| **Forensic Root Cause Status** | **UNVERIFIED (Causal Hypothesis Only)** | **UNVERIFIED (Causal Hypothesis Only)** |
| **Supporting Source Evidence** | 424 active employees verified in `03_Data_Pack/employees.json`; 17 joiners verified in Sept (`EMP-0729` to `EMP-0745`). Zero evidence for 5 phantom headcount. | 441 employees verified in `03_Data_Pack/employees.json`; 3 future joiners verified in Oct (`EMP00442` to `EMP00444`). Zero legacy batch script code. |
| **Evidentiary Confidence Level** | **Medium-Low** (Variance is certain; root cause is unproven) | **Medium-High** (Future joiner correlation is strong; script bug unproven) |
| **Officially Applicable Classification** | **Level 1: Category 4** (Governing Accounting Standard)<br>*(Level 2 is retained strictly as an engineering hypothesis)* | **Level 1: Category 4** (Governing Accounting Standard)<br>*(Level 2 is retained strictly as an engineering hypothesis)* |
| **Approval Authority for Classification Change** | VP Statutory Compliance & Corporate Controller (Policy C) | Head of FP&A & Corporate Controller (Policy B) |
| **Impact on Accounting Treatment** | **Reporting-Only Footnote (Zero Cash Impact).** Does not alter the historical `PAID` header row or bank disbursements. | **Pre-Approval Header Alignment (Operational Adjustment).** Aligns pending batch header to 441 itemized payslips prior to fund transfer. |

---

## 5. Answers to Mandatory Governance Questions

### 5.1 Why was Category 4 used?
Category 4 was defined in [`docs/DAY11-DISCREPANCY-CLASSIFICATION-STANDARD.md`](file:///c:/Users/Madugu%20Shiva%20Kumar/OneDrive/图片/Desktop/horizon-portal/docs/DAY11-DISCREPANCY-CLASSIFICATION-STANDARD.md) specifically for scenarios where:
1. Itemized employee payslips are mathematically flawless ($Gross - Deductions \equiv Net$).
2. The summary run header diverges from the sum of itemized payslips.
3. External banking settlement files (UTR logs) or approved planning documents are absent from the repository.
4. The variance does not alter employee realized compensation or legal entitlement.
Thus, Category 4 accurately describes the governance state: an upstream planning or reporting variance awaiting executive policy determination.

### 5.2 What do the two specific labels mean?
- **`TIMING_AND_ROSTER_LAG`:** Hypothesizes that the August run header was compiled from an earlier HR roster cutoff that included 5 anticipated additions who did not actually begin work in August.
- **`SYSTEM_BATCH_HEADER_CALCULATION_DEFECT`:** Hypothesizes that the automated script creating the preliminary September batch header aggregated future October joiners (`EMP00442`–`EMP00444`) into the preliminary headcount.

### 5.3 Are they observations, hypotheses, or verified causes?
They are **causal hypotheses supported by circumstantial correlation, NOT verified root causes**. They must remain classified as engineering hypotheses until corporate HR and IT systems owners formally confirm the upstream data pipelines.

### 5.4 Which classification is officially applicable?
For corporate governance, accounting reporting, and Gate 1 evaluation, **Category 4 is the sole authoritative classification**. Level 2 labels serve as technical sub-annotations in forensic footnotes.

### 5.5 Who must approve any change?
- August classification changes require formal sign-off from the **VP Statutory Compliance** and **Corporate Controller** under Policy C.
- September classification changes require formal sign-off from the **Head of FP&A** and **Corporate Controller** under Policy B.

### 5.6 Does the classification affect accounting treatment?
**YES.**
- If August's variance were classified as Category 1 (Data Corruption), it would require technical database restoration. Because it is Category 4 on a disbursed run, Policy C dictates a **non-destructive reporting-only reconciliation entry** in `payroll_adjustments` with **zero cash movement and zero modification to the historical `PAID` header**.
- If September's variance were classified as Category 2 (Missing Payslips), it would require issuing payslips to the 3 October joiners. Because it is Category 4 on an unapproved in-flight run, Policy B dictates a **pre-approval header alignment** aligning the batch target to 441 employees before payment release.

---

## 6. Document Harmonization Directives

1. [`docs/DAY11-DISCREPANCY-CLASSIFICATION-STANDARD.md`](file:///c:/Users/Madugu%20Shiva%20Kumar/OneDrive/图片/Desktop/horizon-portal/docs/DAY11-DISCREPANCY-CLASSIFICATION-STANDARD.md) is updated to incorporate Section 2's two-level hierarchy.
2. [`docs/DAY11-POLICY-A-APPROVAL-REQUEST.md`](file:///c:/Users/Madugu%20Shiva%20Kumar/OneDrive/图片/Desktop/horizon-portal/docs/DAY11-POLICY-A-APPROVAL-REQUEST.md) through [`docs/DAY11-POLICY-E-APPROVAL-REQUEST.md`](file:///c:/Users/Madugu%20Shiva%20Kumar/OneDrive/图片/Desktop/horizon-portal/docs/DAY11-POLICY-E-APPROVAL-REQUEST.md) must reference Category 4 as the primary governance category and Level 2 terms strictly as causal hypotheses.
3. All working audit reports must maintain this strict distinction to ensure compliance with financial accounting and internal audit standards.

