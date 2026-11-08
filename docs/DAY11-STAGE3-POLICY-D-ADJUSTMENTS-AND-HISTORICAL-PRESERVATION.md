# POLICY D — HISTORICAL DATA PRESERVATION AND ADJUSTMENT GOVERNANCE (AMENDED)
## Aura Workforce by Growmar — Horizon Portal
### Phase 3 — Teams and Insight | Day 11: Admin Payroll Run Console
### Stage 3 of 6: Formal Payroll Governance Package

---

## Document Metadata

| Attribute | Specification |
|---|---|
| **Document ID** | `DAY11-STAGE3-POLICY-D` |
| **Document Title** | Historical Data Preservation and Adjustment Governance Policy |
| **Governing Baseline** | Stage 1 Revision 2.1 (`DAY11-POLICY-A-SOURCE-OF-TRUTH-DECISION.md`) & Stage 2 Forensic Report (`DAY11-STAGE2-ROOT-CAUSE-FORENSIC-REPORT.md`) |
| **Supporting Artifact** | [`docs/DAY11-STAGE3-POLICY-D-ADJUSTMENT-SCHEMA-REVIEW.md`](file:///c:/Users/Madugu%20Shiva%20Kumar/OneDrive/图片/Desktop/horizon-portal/docs/DAY11-STAGE3-POLICY-D-ADJUSTMENT-SCHEMA-REVIEW.md) |
| **Status** | `PROPOSED — APPROVAL PENDING` |
| **Governance Gate** | Gate 1 Locked (`GATE 1: LOCKED — FINANCIAL EXECUTION NOT AUTHORIZED`) |
| **Effective Date** | Pending Corporate Controller & CFO Ratification |
| **Target Audience** | Enterprise Architecture, Payroll Operations, Internal Audit, Compliance, Database Engineering |

---

## 1. Executive Summary & Policy Objective

Policy D establishes the mandatory, binding governance framework for **historical data preservation**, **financial record immutability**, and **post-hoc adjustment accounting** across all payroll runs within the Aura Workforce Horizon Portal.

The Stage 1 and Stage 2 forensic investigations conclusively demonstrated that the historical payroll discrepancies in the six affected runs (`PR-2026-04` through `PR-2026-09`) originated upstream in the supplied data pack files (`payroll_runs.json` vs. `payslips.json`) prior to database ingestion. 

To maintain statutory compliance, forensic auditability, and accounting integrity:
1. **Historical Records are Immutable:** Raw ingested records (`payroll_runs` headers and `payslips` itemized items) must never be subjected to destructive in-place SQL updates (`UPDATE` / `DELETE`).
2. **Corrections are Append-Only:** Any correction, true-up, or variance adjustment must be recorded as an append-only, double-entry adjustment record referencing the original transaction.
3. **Auditability is Continuous:** All adjustment records must possess cryptographic idempotency keys, dual-authorization signatures (maker-checker), distinct transaction versus effective dates, and bidirectional links to immutable audit log events.

> [!IMPORTANT]
> **GATE 1 NOTICE:** This policy is currently `PROPOSED — APPROVAL PENDING`. No financial adjustments, database mutations, or schema alterations are authorized until Gate 1 is formally unlocked by designated corporate stakeholders.

---

## 2. Core Principles of Historical Data Preservation

Policy D defines four inviolable architectural principles governing all historical and future payroll data:

```
+-----------------------------------------------------------------------------------------+
|                               PRINCIPLES OF DATA PRESERVATION                           |
+-----------------------------------------------------------------------------------------+
|  1. ZERO IN-PLACE OVERWRITES       Never execute UPDATE/DELETE on closed payroll runs.  |
|  2. PHYSICAL SEPARATION           Original source data preserved apart from adjustments |
|  3. APPEND-ONLY ADJUSTMENTS       All corrections recorded as delta records (dr/cr).    |
|  4. COMPLETE AUDIT PROVENANCE     Cryptographic hash, user ID, timestamp, and rationale |
+-----------------------------------------------------------------------------------------+
```

### 2.1 Principle 1: Zero In-Place Overwrites
- Under no circumstances shall an existing record in `payroll_runs` or `payslips` with status `'PAID'`, `'COMPLETED'`, or `'CLOSED'` be updated in place or deleted.
- Original data pack files (`03_Data_Pack/*.json`), seed scripts, and initial database states represent historical evidentiary artifacts. Altering these artifacts destroys the audit trail and violates statutory recordkeeping standards (Companies Act, 2013, Sec. 128; Income Tax Act, 1961, Sec. 44AA).

### 2.2 Principle 2: Physical & Logical Separation
- Historical baselines must remain logically and physically distinct from subsequent operational adjustments.
- Reporting layers must present the **Original Stored Baseline**, the **Cumulative Approved Adjustments**, and the **Current Adjusted Position** side by side, preventing any confusion between historical facts and subsequent corrections.

### 2.3 Principle 3: Append-Only Double-Entry Accounting
- Every financial correction must follow double-entry ledger mechanics:
  - If a historical gross pay figure is corrected downward, an explicit credit/debit adjustment must capture the delta.
  - Headcount adjustments must record positive or negative delta integer counts.
  - No retroactive balance adjustment may exist without an explicit compensating adjustment transaction.

### 2.4 Principle 4: End-to-End Cryptographic & Operational Provenance
- Every adjustment record must record:
  - The identity of the preparer (`reconciled_by_id`) and timestamp (`reconciled_at`).
  - The identity of the independent approver (`approved_by_id`) and timestamp (`approved_at`).
  - The operational reason code and narrative justification (minimum 20 characters).
  - An idempotency key guaranteeing that no network retry or automated script can duplicate an adjustment.
  - An immutable link to the system `audit_logs` table (`audit_log_id`, `audit_event_id`).

---

## 3. Evaluation of Five Correction Mechanisms

A comparative evaluation of historical correction mechanisms was conducted to establish the optimal technical model:

| Mechanism | Description | Architectural Impact | Audit & Compliance Impact | Recommendation |
|---|---|---|---|---|
| **Mechanism 1: Append-Only Adjustment Records (`payroll_adjustments`)** | Dedicated adjustment rows linked to the original run via foreign key. Headers and payslips remain untouched. Adjustments contain original, adjusted, and delta amounts in BigInt integer paise. | **Low Risk.** Clean schema separation; preserves all foreign keys; supports multi-version revisions via sequence numbers. | **Optimal.** Meets ISO 27001, SOC 1 Type II, and statutory accounting standards. Full audit trail preserved. | **RECOMMENDED POST-GATE 1 (Stage 4+)** |
| **Mechanism 2: Reversal and Replacement Runs** | Complete negative reversal of the historical run (Run R-REV) and issuance of a new corrected run (Run R-NEW). | **High Risk.** Floods database with duplicate rows; distorts tax reporting (Form 16/24Q); confusing to employees. | **Acceptable but disruptive.** Standard in core ERP GLs (SAP/Oracle), but overly heavy for monthly console. | **REJECTED for standard runs** |
| **Mechanism 3: Versioned Payroll Records (SCD Type 2)** | Bi-temporal tables where every row has validity windows (`valid_from` / `valid_to`). | **High Complexity.** Requires total rewrite of Prisma schema, API routes, foreign keys, and frontend UI. | **Good audit trail**, but disproportionate engineering overhead and operational complexity. | **REJECTED** |
| **Mechanism 4: Separate Linked Adjustment Documents** | Store adjustments off-chain in unstructured JSON/document blobs linked by external URL or file path. | **Medium Risk.** Lacks relational integrity; cannot be queried or validated via standard SQL aggregations. | **Poor.** High risk of orphaned records; breaks database transactional integrity. | **REJECTED** |
| **Mechanism 5: Explanatory Reconciliation Annotations** | Read-only explanatory flags and notes displayed in the UI without modifying financial numbers or posting adjustment ledgers. | **Zero Risk.** Immediate visibility of known data-pack anomalies without touching database tables. | **Transitional Value.** Essential for displaying pre-Gate 1 forensic status, but does not settle underlying accounting discrepancies. | **RECOMMENDED PRE-GATE 1 (Current Stage 3)** |

---

## 4. Proposed Adjustment Logical Architecture & Schema Review

The complete field-by-field review of the 36 proposed columns is documented in [`docs/DAY11-STAGE3-POLICY-D-ADJUSTMENT-SCHEMA-REVIEW.md`](file:///c:/Users/Madugu%20Shiva%20Kumar/OneDrive/图片/Desktop/horizon-portal/docs/DAY11-STAGE3-POLICY-D-ADJUSTMENT-SCHEMA-REVIEW.md).

### 4.1 Seven Logical Functional Modules
1. **Identity & Linkage:** `id`, `payroll_run_id`, `revision`, `idempotency_key`.
2. **Baseline Snapshots:** `original_employees_paid`, `original_gross_paise`, `original_deductions_paise`, `original_net_paise`, `original_total_gross`, `original_total_deductions`, `original_total_net`.
3. **Adjustment Deltas:** `adjusted_employees_paid`, `adjusted_gross_paise`, `adjusted_deductions_paise`, `adjusted_net_paise`, `adjusted_total_gross`, `adjusted_total_deductions`, `adjusted_total_net`, `variance_gross_paise`, `variance_deductions_paise`, `variance_net_paise`, `variance_employees`.
4. **Business Justification:** `adjustment_type`, `reason`, `reconciliation_source`, `source_dataset_reference`.
5. **Maker-Checker Control:** `reconciled_by_id`, `reconciled_at`, `approved_by_id`, `approved_at`.
6. **Lifecycle & Effective:** `status`, `effective_date`.
7. **Audit & Metadata:** `audit_log_id`, `audit_event_id`, `created_at`, `updated_at`.

### 4.2 BigInt Paise Authority vs. Float Display Mirrors
- The columns ending in `_paise` (BigInt arbitrary-precision integer paise) are the **sole authoritative calculation basis**.
- The columns starting with `*_total_*` (Real / Float) are pre-calculated read denormalizations used strictly to avoid floating-point errors during SQL view queries. Float fields are strictly read-only display mirrors.

### 4.3 Multi-Actor Lifecycle State Machine
```
  [ DRAFT ]  (Maker creates adjustment; can cancel)
      |
      v
  [ SUBMITTED ]  (Maker submits; minimum 20-char justification)
      |
      v
  [ REVIEWED ]   (Technical auditor verifies math; can return for correction)
      |
      v
  [ APPROVED ]   (Checker approves; strict maker != checker enforcement)
      |
      v
  [ POSTED ]     (Posted to GL; reversals require new compensating inverse row)
```

---

## 5. Prohibited Operational Actions

Policy D establishes zero-tolerance prohibitions against unauthorized modification practices:
1. **No In-Place Overwrites:** Direct SQL `UPDATE payroll_runs SET ...` is prohibited.
2. **No Retroactive Payslip Modification:** An approved payslip voucher cannot have its line items modified post-disbursement.
3. **No Discrepancy Concealment:** Net-zero adjustments (+₹5,000 gross, +₹5,000 deductions) cannot bypass independent approval.
4. **No Unilateral Posting:** No adjustment may post to the General Ledger without independent checker sign-off.
5. **No Direct Physical Deletion:** Cancelled or rejected adjustment records must remain preserved with their terminal status flag.

---

## 6. Master Decision Register Updates (Policy D)

| Decision ID | Decision Title | Scope of Decision | Current Recommendation | Approving Authority | Current Status |
|---|---|---|---|---|---|
| **DEC-D-01** | Adjustment Architectural Model | Governance approval of the append-only adjustment principle post-Gate 1. | Adopt Mechanism 1 (`payroll_adjustments`) as sole financial adjustment model. | Corporate Controller & CFO | `PROPOSED — APPROVAL PENDING` |
| **DEC-D-02** | Pre-Gate 1 Discrepancy Presentation | Treatment of historical anomalies while Gate 1 is locked. | Retain raw historical data untouched; present variances via Mechanism 5 (Annotations). | Chief Financial Officer | `PROPOSED — APPROVAL PENDING` |
| **DEC-D-03** | Reversal & Revocation Protocol | Standard for cancelling or reversing posted adjustments. | Revoke via compensating reversal rows with inverse signs; zero SQL deletions. | Head of Internal Audit | `PROPOSED — APPROVAL PENDING` |
| **DEC-D-04** *(New)* | Technical Approval of 36-Field Schema | Technical ratification of the 36-column Prisma schema design. | Retain 36-column design; enforce BigInt paise as calculation authority; treat Float as read-only. | Lead Systems Architect | `PROPOSED — APPROVAL PENDING` |

---

*End of Day 11 Stage 3 Policy D Historical Data Preservation and Adjustment Governance (Amended).*
