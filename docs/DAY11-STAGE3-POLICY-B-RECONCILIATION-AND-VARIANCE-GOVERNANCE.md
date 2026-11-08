# DAY 11 — STAGE 3: POLICY B — RECONCILIATION AND VARIANCE GOVERNANCE (AMENDED)
## Enterprise Framework for Multi-Dimensional Payroll Reconciliation, Discrepancy Classification & Escalation Controls
### Stage 3 of 6: Formal Payroll Governance Package

---

## Document Metadata

| Policy Governance Metadata | Specification |
|---|---|
| **Project** | Aura Workforce by Growmar — Horizon Portal |
| **Phase / Task** | Phase 3 — Day 11: Admin Payroll Run Console |
| **Governing Policy Code** | **POLICY-B (Reconciliation & Variance Management)** |
| **Document Identifier** | `docs/DAY11-STAGE3-POLICY-B-RECONCILIATION-AND-VARIANCE-GOVERNANCE.md` |
| **Document Version** | **Version 2.0 (Amended — Stage 3 Issue 2 Resolution)** |
| **Date of Preparation** | November 7, 2026 |
| **Designated Approval Authority** | **Corporate Controller & Head of Internal Audit** |
| **Policy Approval Status** | **PROPOSED — APPROVAL PENDING** |
| **Governance Gate 1 Status** | **LOCKED — NO FINANCIAL EXECUTION AUTHORIZED** |

---

## 1. Purpose and Scope

### 1.1 Purpose
This policy establishes mandatory operational standards, mathematical calculation rules, classification taxonomies, dimension-specific tolerance frameworks, and escalation protocols for reconciling payroll data across the Horizon Portal platform. It ensures that discrepancies are systematically detected, classified, and escalated before payroll runs can proceed through the approval lifecycle.

### 1.2 Scope
This policy governs:
- All 18 historical and operational monthly payroll runs (`PR-2025-04` through `PR-2026-09`).
- All automated reconciliation services (`src/lib/payroll/reconciliation-engine.ts`, `reconciliation-service.ts`).
- Server-side API reconciliation endpoints (`/api/v1/payroll/runs`, `/api/v1/payroll/runs/[runId]/reconciliation-preview`).
- The Admin Payroll Console UI badge and discrepancy display components.

---

## 2. Multi-Dimensional Reconciliation Framework (Dimensions A Through I)

Reconciliation is not a single scalar check. In strict compliance with financial control standards, Policy B separates reconciliation into **nine discrete dimensions**, distinguishing exact internal arithmetic from external accounting and third-party settlement:

```
+---------------------------------------------------------------------------------------------------+
|                                 NINE RECONCILIATION DIMENSIONS (A - I)                            |
+---------------------------------------------------------------------------------------------------+
|  [INTERNAL ARITHMETIC DIMENSIONS — EXACT 0-PAISE TOLERANCE]                                       |
|  Dimension A: Payslip Line-Item Arithmetic Equality (Gross - Deductions = Net)                    |
|  Dimension B: Component Aggregation Equality (Sum of Earnings = Gross; Sum of Deductions = Total) |
|  Dimension C: Itemized Payroll Aggregation (Population aggregation, duplicates, period boundary)  |
|                                                                                                   |
|  [RECONCILIATION & VARIANCE COMPARISONS — SIGNED VARIANCE & FORMAL INVESTIGATION]                 |
|  Dimension D: Header-to-Itemized Reconciliation (Variance = Itemized Aggregate - Stored Header)   |
|  Dimension E: Rounding Differences (Defined integer paise basis; no floating-point rounding)     |
|                                                                                                   |
|  [EXTERNAL & SETTLEMENT ASSURANCE — REQUIRES AUTHORITATIVE EXTERNAL EVIDENCE]                    |
|  Dimension F: External Accounting Reconciliation (Comparison against Corporate GL Trial Balance)  |
|  Dimension G: Bank Settlement Reconciliation (Disbursement instructions vs Bank debits/credits)   |
|  Dimension H: Statutory Remittance Reconciliation (Payroll withholdings vs Tax/PF challans)       |
|  Dimension I: Population & Employee Reconciliation (Observed payslips vs Approved HR roster)      |
+---------------------------------------------------------------------------------------------------+
```

### 2.1 Detailed Dimension Specifications

#### Dimension A — Payslip Arithmetic Equality
- **Invariant:** For every payslip voucher $i$:
  $$\text{gross\_pay}_i - \text{total\_deductions}_i \equiv \text{net\_pay}_i$$
- **Tolerance:** **Zero paise ($0\text{ paise}$)**.
- **Evaluation:** Verified across all 2,469 payslips in the repository with zero residual error.

#### Dimension B — Component Aggregation Equality
- **Invariants:**
  $$\sum \text{Earning Components}_i \equiv \text{gross\_pay}_i \quad (0\text{ paise})$$
  $$\sum \text{Deduction Components}_i \equiv \text{total\_deductions}_i \quad (0\text{ paise})$$
- **Tolerance:** **Zero paise ($0\text{ paise}$)**.
- **Evaluation:** Verified across all 2,469 payslips with zero residual error.

#### Dimension C — Itemized Payroll Aggregation
- **Methodology:** Summation across all valid, non-duplicate itemized payslips belonging to the run's defined period boundary.
- **Rules:** Automated detection of duplicate `employee_id` vouchers within the same cycle; validation of period start/end dates.
- **Tolerance:** **Zero paise ($0\text{ paise}$)** internal summation precision.

#### Dimension D — Header-to-Itemized Reconciliation
- **Formula:**
  $$\text{Variance}_{\text{Gross}} = \sum \text{payslips.gross\_pay} - \text{payroll\_runs.total\_gross}$$
  $$\text{Variance}_{\text{Ded}} = \sum \text{payslips.total\_deductions} - (\text{payroll\_runs.total\_gross} - \text{payroll\_runs.total\_net})$$
  $$\text{Variance}_{\text{Net}} = \sum \text{payslips.net\_pay} - \text{payroll\_runs.total\_net}$$
- **Governing Rule:** Differences remain classified as mismatches until investigated and formally resolved via Policy D adjustments. Historical data must never be overwritten in-place to force a zero variance.

#### Dimension E — Rounding Differences
- **Specification:** The Horizon Portal utilizes **BigInt-based arbitrary-precision integer arithmetic, with monetary values represented in paise**.
- **Rules:** No floating-point division is permitted during intermediate calculations. If future tax apportionments generate fractional paise, the rounding method (e.g., half-up at component level vs. aggregate level) and allowable rounding tolerance (e.g., $\pm ₹1.00$) must be formally approved by the Corporate Controller. No tolerance value may be arbitrarily invented.

#### Dimension F — External Accounting Reconciliation
- **Specification:** Compares itemized payroll aggregates against the corporate General Ledger (GL) journal entries (`GL-6100` Payroll Expense Dr, `GL-2100` Net Salaries Cr).
- **Rule:** Can only be evaluated when authoritative external accounting records are provided. An internal payslip calculation cannot independently establish a GL balance.

#### Dimension G — Bank Settlement Reconciliation
- **Specification:** Compares approved payment instruction files against corporate bank statement debits and clearing manifests.
- **Rule:** A stored `'PAID'` flag in the database is strictly rejected as proof of settlement. External bank statements and settlement clearing reports are mandatory.

#### Dimension H — Statutory Remittance Reconciliation
- **Specification:** Compares withheld deduction components against statutory deposit receipts (EPFO ECR/TRRN, ESIC Challans, Income Tax ITNS 281 receipts).
- **Rule:** Run cannot be certified as statutory-compliant without government portal payment receipts.

#### Dimension I — Population & Employee Reconciliation
- **Specification:** Compares the Observed Payroll Population (count of payslips) against the Approved Payroll Headcount from the authorized HR roster snapshot:
  $$\Delta_{\text{Headcount}} = \text{Observed Payslips} - \text{Approved Headcount}$$
- **Rule:** Discrepancies (e.g., +13 in August 2026) must be investigated for un-rostered workers or excluded employees.

---

## 3. Standardized Discrepancy Classification Taxonomy (9 Classifications)

To eliminate ad-hoc interpretations, all reconciliation findings must be mapped to one of nine standardized classifications:

| Classification Code | Description & Trigger Criteria | Action Required |
|---|---|---|
| `MATCH` | Perfect arithmetic alignment across evaluated dimensions ($0\text{ paise}$ variance; headcount match). | Eligible for progression to Maker-Checker review. |
| `MISMATCH` | Material arithmetic difference between header and itemized vouchers ($|\Delta| > 0$). | Hard block on approval; requires forensic root-cause analysis. |
| `ROUNDING_VARIANCE` | Variance within formally approved statutory fractional-paise rounding threshold. | Logged in audit trail; requires Controller sign-off. |
| `TIMING_VARIANCE` | Variance substantiated by verified effective hire/termination dates straddling cutoff. | Requires documented HR effective-date proof before classification. |
| `MISSING_SOURCE` | Critical input file or database table missing (e.g., missing payslip table for run). | Immediate operational halt; technical data pipeline investigation. |
| `DUPLICATE_RECORD` | Multiple payslips or adjustments detected for the same employee in a single cycle. | Immediate operational block; deduplication workflow. |
| `NO_ITEMS` | Run header exists but contains zero itemized vouchers (Legacy runs `PR-2025-04`..`2026-03`). | Classified as unitemized historical reference; cannot generate itemized payments. |
| `UNRESOLVED` | Variance detected where root cause cannot be established from available evidence. | Retained in audit queue; escalates to Internal Audit Lead. |
| `EXTERNAL_EVIDENCE_REQUIRED` | Internal arithmetic verified, but external GL, bank, or tax evidence is absent. | Classified as Evidence Gap; prevents declaration of external settlement. |

---

## 4. Dimension-Specific Tolerance & Approval Blocking Rules

### 4.1 Separation of Tolerances
1. **Internal Arithmetic (Dimensions A, B, C):** Strictly **Zero Tolerance ($0\text{ paise}$)**. Any non-zero residual indicates a software calculation bug or data corruption and halts processing.
2. **External & Operational Comparisons (Dimensions D through I):** Tolerances are **not zero by default**, but require formal stakeholder policy decisions. Until an authorized threshold is established, any difference $> 0$ triggers investigation.

### 4.2 Mandatory Approval Blocking Rule
Under Policy B, a payroll run is strictly blocked from progressing from `RECONCILING` to `PENDING_APPROVAL` if:
- Any internal arithmetic check fails (residual $> 0\text{ paise}$).
- A header-to-itemized variance is classified as `MISMATCH` or `UNRESOLVED` without an approved Policy D adjustment.
- Duplicate records or missing mandatory source inputs are detected.

---

## 5. Master Decision Register Updates (Policy B)

| Decision ID | Decision Title | Scope of Decision | Recommendation | Approving Authority | Current Status |
|---|---|---|---|---|---|
| **DEC-B-01** | Dimension-Specific Tolerance Framework | Adopting zero-paise tolerance for exact internal arithmetic (Dims A/B/C) and formal investigation for external dimensions (Dims D..I). | Approve dimension-specific tolerance structure; no arbitrary rounding tolerances permitted without Controller sign-off. | Corporate Controller | `PROPOSED — APPROVAL PENDING` |
| **DEC-B-02** | Mandatory Approval-Blocking Standard | Enforcing programmatic block on maker-checker progression for unresolved material variances. | Mandate API and UI hard blocks on approval when reconciliation status $\ne$ `'MATCH'`. | Head of Internal Audit | `PROPOSED — APPROVAL PENDING` |

---

*End of Day 11 Stage 3 Policy B Reconciliation and Variance Governance (Amended).*
