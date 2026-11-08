# DAY 11 — FINAL FOUR-POINT DISCREPANCY RESOLUTION REPORT
## Aura Workforce by Growmar — Horizon Portal
### Phase 3 — Teams and Insight | Day 11: Admin Payroll Run Console
### Post Evidence Intake | Forensic Reconciliation of Reporting Inconsistencies & Deliverable Scope

---

## Document Metadata

| Attribute | Specification |
|---|---|
| **Document ID** | `DAY11-FINAL-FOUR-POINT-DISCREPANCY-RESOLUTION-REPORT` |
| **Document Title** | Final Forensic Four-Point Discrepancy Resolution & Repository Scope Master Report |
| **Project & Phase** | Aura Workforce by Growmar — Horizon Portal / Phase 3 — Day 11 |
| **Governing Baseline** | Stage 1 (Rev 2.1), Stage 2 Forensic, Stage 3 Policies A–E, Stage 4A Assessment, Gate 1 QC & Intake Registers |
| **Execution Mode** | Read-Only Forensic Calculation, Source Audit & Documentation Reconciliation |
| **Issues Investigated** | 1. ₹10.36 Cr vs. ₹10.47 Cr figures; 2. ₹13.75 Lakh vs. ₹90.15 Lakh variance; 3. 18-month evidence requirement; 4. 7 vs. 8 deliverables |
| **Database Integrity** | `prisma/dev.db` SHA-256: `B88E178B1B341FB44D7B676DC9F320FFF4079120AE63770D33ABD32E3F9EB4EA` (100% Unaltered) |
| **Gate 1 Status** | **`GATE 1: LOCKED — FINANCIAL EXECUTION NOT AUTHORIZED`** |
| **Stage 4B Status** | **`STAGE 4B: NOT AUTHORIZED`** |
| **Date of Execution** | November 8, 2026 |

---

## 1. Executive Summary

This master report provides the definitive forensic investigation and technical resolution for four critical reporting inconsistencies identified following the publication of the Corporate Stakeholder Response & Evidence Intake package:

1. **₹10.36 Cr vs. ₹10.47 Cr Net Figures:** Formally resolved. These figures originated from illustrative, unestablished draft text and do not correspond to any run or combination of runs in the database. The true, mathematically verified historical baseline for the six discrepancy runs is **₹26,70,69,563.37** (Itemized Payslip Net) vs. **₹27,60,84,281.24** (Stored Run Header Net).
2. **₹13.75 Lakh vs. ₹90.15 Lakh Variance:** Formally resolved. The ₹13.75 Lakh figure was derived from an unestablished gross arithmetic difference ($12.85\text{ Cr} - 12.71\text{ Cr}$) in draft documentation and was erroneously labeled as a "General Ledger net variance". The true verified historical net variance between headers and itemized payslips is **-₹90,14,717.87** (-₹90.15 Lakh). Furthermore, because zero external ERP General Ledger evidence has been supplied to the repository, any true General Ledger variance remains strictly **`UNRESOLVED — EXTERNAL GL EVIDENCE REQUIRED`**.
3. **18-Month Evidence Requirement:** Formally resolved. A rigorous technical segregation has been established between internal database history (18 payroll run headers from April 2025 to September 2026, where the first 12 runs contain zero payslips) and external evidence requirements. No corporate policy mandates an 18-month evidence retention scope; the required external reporting period remains **`PROPOSED / UNRESOLVED — REQUIRING AUTHORIZED STAKEHOLDER CONFIRMATION`**.
4. **Seven vs. Eight Deliverables:** Formally resolved. The preparation stage produced 8 deliverables (7 packages A–G + 1 report), and the intake stage produced 7 new deliverables (6 intake registers/assessments + 1 report). All 15 documents physically exist on disk, verified at 100% parity.

---

## 2. Investigation Methodology

The investigation was executed in strictly read-only mode using reproducible programmatic inspection tools:
1. **Database Forensic Verification:** Direct SQLite inspection of `prisma/dev.db` across all 18 rows in `payroll_runs` and all 2,469 rows in `payslips`.
2. **Combinatorial Search:** Evaluated all $2^{18}$ combinations of historical runs to determine whether any subset of runs produced sums matching ₹10.36 Cr, ₹10.47 Cr, or ₹13.75 Lakh (result: zero matches).
3. **Cross-Document Textual Audit:** Full-text regex search across all 90+ markdown documents under `docs/` and raw source datasets under `03_Data_Pack/`.
4. **Physical File-System Audit:** Verified paths, byte sizes, and timestamps of all 15 governance deliverables across the Preparation and Intake stages.

---

## 3. Investigation A: ₹10.36 Cr / ₹10.47 Cr Calculation & Scope Findings

### Findings Summary:
- **Origin:** Introduced in `docs/DAY11-EXTERNAL-EVIDENCE-VERIFICATION-RESULTS.md#L44-45` as illustrative draft text and propagated to `DAY11-GATE1-EXCEPTION-AND-DISCREPANCY-REGISTER.md` and `DAY11-STAKEHOLDER-RESPONSE-AND-EVIDENCE-INTAKE-REPORT.md`.
- **Database Scope:** Combinatorial query across all 18 runs proved that no run or subset of runs sums to ₹10,36,08,359.00 or ₹10,47,28,495.00.
- **Formal Classification:**
  > **`SCOPE NOT ESTABLISHED — ORIGINAL FIGURES NOT SUITABLE FOR AGGREGATE RECONCILIATION CLAIMS`**
- **Authoritative Verified Baseline Re-Affirmed:**
  - **Six Historical Discrepancy Runs (`PR-2026-04` through `PR-2026-09`):**
    - Itemized Payslip Net Sum: **₹26,70,69,563.37** (across 2,469 payslips).
    - Stored Header Net Sum: **₹27,60,84,281.24** (across 2,547 header employee records).
    - Net Variance: **-₹9,014,717.87** (-₹90.15 Lakh).
  - **Full 18 Historical Runs (`PR-2025-04` through `PR-2026-09`):**
    - Itemized Payslip Net Sum: **₹26,70,69,563.37** (12 older runs have 0 payslips).
    - Stored Header Net Sum: **₹75,10,18,306.69** (₹75.10 Cr).
- **Deliverable Reference:** Detailed in [`docs/DAY11-PAYROLL-NET-FIGURE-SCOPE-RECONCILIATION.md`](file:///c:/Users/Madugu%20Shiva%20Kumar/OneDrive/图片/Desktop/horizon-portal/docs/DAY11-PAYROLL-NET-FIGURE-SCOPE-RECONCILIATION.md).

---

## 4. Investigation B: ₹13.75 Lakh / ₹90.15 Lakh Variance Findings

### Findings Summary:
- **Origin:** The arithmetic difference between two synthetic gross numbers ($₹12,85,61,647.00 - ₹12,71,86,134.00 = ₹13,75,513.00 \approx ₹13.75\text{ Lakh}$) drafted in `DAY11-EXTERNAL-EVIDENCE-VERIFICATION-RESULTS.md` was mislabeled as a "net variance" and misattributed to the General Ledger in `EXC-GL-01`.
- **True Baseline Variance:** The verified net variance between stored headers and itemized payslips across the six historical runs is **₹90,14,717.87** (approx. **₹90.15 Lakh**).
- **Core Governance Distinction:** Stored headers vs. itemized payslips is an **internal database discrepancy**, not a General Ledger variance. A General Ledger variance requires external ERP trial balances and journal vouchers (`EVID-GL-02` / `EVID-GL-03`), which remain `NOT_PROVIDED`.
- **Formal Classifications:**
  - For the ₹13.75 Lakh figure: **`UNSUPPORTED FIGURE — SOURCE NOT LOCATED`**.
  - For General Ledger variance: **`UNRESOLVED — EXTERNAL GL EVIDENCE REQUIRED`**.
- **Deliverable Reference:** Detailed in [`docs/DAY11-GL-VARIANCE-SCOPE-RECONCILIATION.md`](file:///c:/Users/Madugu%20Shiva%20Kumar/OneDrive/图片/Desktop/horizon-portal/docs/DAY11-GL-VARIANCE-SCOPE-RECONCILIATION.md).

---

## 5. Investigation C: Payroll Period & Evidence Coverage Clarification

### Findings Summary:
- **Internal Database Scope:**
  - Number of payroll runs: **18 runs**.
  - Number of payslips: **2,469 payslips**.
  - Date boundaries: First period **2025-04-01 to 2025-04-30** (`PR-2025-04`); Last period **2026-09-01 to 2026-09-30** (`PR-2026-09`).
  - Distinct calendar months: **18 consecutive calendar months**.
  - Two Epochs: Epoch 1 (Apr 2025 – Mar 2026: 12 header-only runs, 0 payslips); Epoch 2 (Apr 2026 – Sep 2026: 6 operational runs, 2,469 payslips, 100% of discrepancies).
- **External Evidence Coverage:**
  - The repository contains **zero approved policy** requiring 18 months of external evidence.
  - Mandatory formulation:
    > **`18-MONTH EVIDENCE COVERAGE — NOT ESTABLISHED AS AN APPROVED REQUIREMENT. REPORTING PERIOD REQUIRES AUTHORIZED STAKEHOLDER CONFIRMATION.`**
- **Deliverable Reference:** Detailed in [`docs/DAY11-EVIDENCE-REPORTING-PERIOD-CLARIFICATION.md`](file:///c:/Users/Madugu%20Shiva%20Kumar/OneDrive/图片/Desktop/horizon-portal/docs/DAY11-EVIDENCE-REPORTING-PERIOD-CLARIFICATION.md).

---

## 6. Investigation D: Deliverable Inventory Reconciliation (7 vs. 8)

### Findings Summary:
- **Preparation Stage Deliverables (8 Files):** All 8 files authored during the Stakeholder Review & Evidence Collection stage exist on disk and are preserved. Specifically, both questioned files (`DAY11-EXTERNAL-EVIDENCE-VERIFICATION-PROCEDURES.md` and `DAY11-CORPORATE-STAKEHOLDER-TRANSMISSION-PACKAGE.md`) are present and intact.
- **Intake Stage Deliverables (7 Files):** All 7 files authored during the Response & Evidence Intake stage exist on disk and are operational.
- **Total Consolidated Inventory:** Exactly **15 distinct, verified documents** exist in `docs/`.
- **Origin of Confusion:** The preparation report metadata table previously stated "7 Comprehensive Governance Packages" (referring to Packages A–G), but listed 8 documents (Packages A–G + Master Report). The metadata has been corrected to "8 Comprehensive Governance Deliverables".
- **Deliverable Reference:** Detailed in [`docs/DAY11-GOVERNANCE-DELIVERABLE-INVENTORY-RECONCILIATION.md`](file:///c:/Users/Madugu%20Shiva%20Kumar/OneDrive/图片/Desktop/horizon-portal/docs/DAY11-GOVERNANCE-DELIVERABLE-INVENTORY-RECONCILIATION.md).

---

## 7. Exact Files Inspected, Created, and Modified

### Inspected Files:
- `prisma/dev.db` (SHA-256: `B88E178B1B341FB44D7B676DC9F320FFF4079120AE63770D33ABD32E3F9EB4EA`)
- `03_Data_Pack/payroll_runs.json`, `03_Data_Pack/payslips.json`
- `docs/DAY11-STAGE2-ROOT-CAUSE-FORENSIC-REPORT.md`
- `docs/DAY11-PHASE-B-SIX-RUN-RECONCILIATION.md`
- `docs/DAY11-FINAL-RECONCILIATION-REPORT.md`
- `docs/DAY11-GATE1-MASTER-DECISION-REGISTER.md`
- `docs/DAY11-GATE1-PREREQUISITE-TRACKING-PLAN.md`

### Newly Created Files (5 Documents):
1. [`docs/DAY11-PAYROLL-NET-FIGURE-SCOPE-RECONCILIATION.md`](file:///c:/Users/Madugu%20Shiva%20Kumar/OneDrive/图片/Desktop/horizon-portal/docs/DAY11-PAYROLL-NET-FIGURE-SCOPE-RECONCILIATION.md)
2. [`docs/DAY11-GL-VARIANCE-SCOPE-RECONCILIATION.md`](file:///c:/Users/Madugu%20Shiva%20Kumar/OneDrive/图片/Desktop/horizon-portal/docs/DAY11-GL-VARIANCE-SCOPE-RECONCILIATION.md)
3. [`docs/DAY11-EVIDENCE-REPORTING-PERIOD-CLARIFICATION.md`](file:///c:/Users/Madugu%20Shiva%20Kumar/OneDrive/图片/Desktop/horizon-portal/docs/DAY11-EVIDENCE-REPORTING-PERIOD-CLARIFICATION.md)
4. [`docs/DAY11-GOVERNANCE-DELIVERABLE-INVENTORY-RECONCILIATION.md`](file:///c:/Users/Madugu%20Shiva%20Kumar/OneDrive/图片/Desktop/horizon-portal/docs/DAY11-GOVERNANCE-DELIVERABLE-INVENTORY-RECONCILIATION.md)
5. [`docs/DAY11-FINAL-FOUR-POINT-DISCREPANCY-RESOLUTION-REPORT.md`](file:///c:/Users/Madugu%20Shiva%20Kumar/OneDrive/图片/Desktop/horizon-portal/docs/DAY11-FINAL-FOUR-POINT-DISCREPANCY-RESOLUTION-REPORT.md) *(this report)*

### Modified Files (6 Documents Harmonized):
1. [`docs/DAY11-EXTERNAL-EVIDENCE-VERIFICATION-RESULTS.md`](file:///c:/Users/Madugu%20Shiva%20Kumar/OneDrive/图片/Desktop/horizon-portal/docs/DAY11-EXTERNAL-EVIDENCE-VERIFICATION-RESULTS.md) (reconciled net figures and qualified 18-month period)
2. [`docs/DAY11-GATE1-EXCEPTION-AND-DISCREPANCY-REGISTER.md`](file:///c:/Users/Madugu%20Shiva%20Kumar/OneDrive/图片/Desktop/horizon-portal/docs/DAY11-GATE1-EXCEPTION-AND-DISCREPANCY-REGISTER.md) (reconciled `EXC-GL-01` and `EXC-BNK-01`)
3. [`docs/DAY11-STAKEHOLDER-RESPONSE-AND-EVIDENCE-INTAKE-REPORT.md`](file:///c:/Users/Madugu%20Shiva%20Kumar/OneDrive/图片/Desktop/horizon-portal/docs/DAY11-STAKEHOLDER-RESPONSE-AND-EVIDENCE-INTAKE-REPORT.md) (reconciled net figures, GL variance, and inventory count)
4. [`docs/DAY11-EXTERNAL-EVIDENCE-COLLECTION-TRACKER.md`](file:///c:/Users/Madugu%20Shiva%20Kumar/OneDrive/图片/Desktop/horizon-portal/docs/DAY11-EXTERNAL-EVIDENCE-COLLECTION-TRACKER.md) (added reporting period scope notice)
5. [`docs/DAY11-EXTERNAL-EVIDENCE-VERIFICATION-PROCEDURES.md`](file:///c:/Users/Madugu%20Shiva%20Kumar/OneDrive/图片/Desktop/horizon-portal/docs/DAY11-EXTERNAL-EVIDENCE-VERIFICATION-PROCEDURES.md) (qualified GL accounting period requirement)
6. [`docs/DAY11-CORPORATE-STAKEHOLDER-REVIEW-AND-EVIDENCE-COLLECTION-REPORT.md`](file:///c:/Users/Madugu%20Shiva%20Kumar/OneDrive/图片/Desktop/horizon-portal/docs/DAY11-CORPORATE-STAKEHOLDER-REVIEW-AND-EVIDENCE-COLLECTION-REPORT.md) (corrected metadata deliverable count to 8)

---

## 8. Unresolved Matters & Source Limitations

1. **True General Ledger Variance:** Awaiting Corporate Controller export of `EVID-GL-01`, `02`, and `03`. No assertion of GL variance can be verified until official ERP journal vouchers are ingested.
2. **Approved Evidence Reporting Period:** Awaiting corporate stakeholder confirmation on whether evidence must span 6 discrepancy months or all 18 historical months.
3. **DEC-C-02 Monetary Threshold:** ₹5,00,000 remains strictly illustrative. Joint determination by Controller and CFO is pending.
4. **Corporate Quorum Authority:** Remains `PROPOSED QUORUM REQUIREMENT — FORMAL CORPORATE AUTHORITY NOT YET VERIFIED` until Governance Committee executes Template 3.

---

## 9. Final Acceptance Matrix

```
========================================================================================================================
                               FINAL ACCEPTANCE MATRIX — FOUR INVESTIGATED MATTERS
========================================================================================================================
```

| # | Investigated Matter | Final Issue Classification | Forensic Evaluation & Action Taken |
|---|---|---|---|
| **1** | ₹10.36 Cr vs. ₹10.47 Cr Net Figures | `UNSUPPORTED CLAIM — CORRECTION REQUIRED` | Reconciled across all affected documents to verified 6-run figures: ₹26.71 Cr (Itemized) vs. ₹27.61 Cr (Header). |
| **2** | ₹13.75 Lakh GL Variance Reference | `UNSUPPORTED FIGURE — SOURCE NOT LOCATED` | Purged from exception registers. GL variance marked `UNRESOLVED — EXTERNAL GL EVIDENCE REQUIRED`. Verified internal net variance remains ₹90.15 Lakh. |
| **3** | 18-Month Evidence Requirement | `UNRESOLVED — EXTERNAL EVIDENCE REQUIRED` | Formally classified as `18-MONTH EVIDENCE COVERAGE — NOT ESTABLISHED AS AN APPROVED REQUIREMENT. REPORTING PERIOD REQUIRES AUTHORIZED STAKEHOLDER CONFIRMATION.` |
| **4** | Seven vs. Eight Deliverables | `RESOLVED — SOURCE SUPPORTED` | Verified all 15 deliverables physically present (8 preparation + 7 intake = 15 total). Zero missing files. |

---

## 10. Final Acceptance Conditions Matrix

```
========================================================================================================================
                               FINAL ACCEPTANCE CONDITIONS EVALUATION
========================================================================================================================
```

| Acceptance Condition Item | Required Standard | Evaluation | Evidence Reference |
|---|---|---|---|
| **₹10.36 Cr / ₹10.47 Cr** | Exact scope and calculation established or figures explicitly qualified | `PASS` | Detailed in [`DAY11-PAYROLL-NET-FIGURE-SCOPE-RECONCILIATION.md`](file:///c:/Users/Madugu%20Shiva%20Kumar/OneDrive/图片/Desktop/horizon-portal/docs/DAY11-PAYROLL-NET-FIGURE-SCOPE-RECONCILIATION.md). |
| **₹13.75 Lakh Variance** | Source and relationship to historical variance established or marked unresolved | `PASS` | Detailed in [`DAY11-GL-VARIANCE-SCOPE-RECONCILIATION.md`](file:///c:/Users/Madugu%20Shiva%20Kumar/OneDrive/图片/Desktop/horizon-portal/docs/DAY11-GL-VARIANCE-SCOPE-RECONCILIATION.md). |
| **18-Month Requirement** | Actual payroll coverage and approved evidence period distinguished | `PASS` | Detailed in [`DAY11-EVIDENCE-REPORTING-PERIOD-CLARIFICATION.md`](file:///c:/Users/Madugu%20Shiva%20Kumar/OneDrive/图片/Desktop/horizon-portal/docs/DAY11-EVIDENCE-REPORTING-PERIOD-CLARIFICATION.md). |
| **Deliverable Inventory** | All expected documents physically checked | `PASS` | Detailed in [`DAY11-GOVERNANCE-DELIVERABLE-INVENTORY-RECONCILIATION.md`](file:///c:/Users/Madugu%20Shiva%20Kumar/OneDrive/图片/Desktop/horizon-portal/docs/DAY11-GOVERNANCE-DELIVERABLE-INVENTORY-RECONCILIATION.md). |
| **Financial Records** | Unchanged | `PASS` | Zero rows modified across `payroll_runs`, `payslips`, `payroll_adjustments`. |
| **Database** | Unchanged | `PASS` | `prisma/dev.db` hash verified identical (`B88E178B1B341FB44D7B676DC9F320FFF4079120AE63770D33ABD32E3F9EB4EA`). |
| **Application Code** | Unchanged | `PASS` | Zero code changes in `src/`. |
| **Gate 1** | LOCKED | `PASS` | `GATE 1: LOCKED — FINANCIAL EXECUTION NOT AUTHORIZED`. |
| **Stage 4B** | NOT AUTHORIZED | `PASS` | `STAGE 4B: NOT AUTHORIZED`. |

---

## 11. Mandatory Final Stop Condition

In strict accordance with Section 10 of the Master Prompt:

```
===========================================================================================
FOUR-POINT DISCREPANCY INVESTIGATION COMPLETE — UNRESOLVED ITEMS REMAIN SUBJECT
TO AUTHORIZED STAKEHOLDER REVIEW AND EXTERNAL EVIDENCE.
===========================================================================================
                    GATE 1 REMAINS LOCKED — FINANCIAL EXECUTION NOT AUTHORIZED.
===========================================================================================
                    STAGE 4B IMPLEMENTATION REMAINS NOT AUTHORIZED.
===========================================================================================
```

---

*End of Day 11 Final Four-Point Discrepancy Resolution Report.*

