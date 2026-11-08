# DAY 11 — STAGE 3: FIVE MANDATORY POLICY ISSUES CORRECTION REGISTER
## Aura Workforce by Growmar — Horizon Portal
### Phase 3 — Teams and Insight | Day 11: Admin Payroll Run Console
### Stage 3 of 6: Governance Package Correction & Amendment

---

## Document Metadata

| Attribute | Specification |
|---|---|
| **Document ID** | `DAY11-STAGE3-FIVE-ISSUE-CORRECTION-REGISTER` |
| **Document Title** | Stage 3 Five Mandatory Policy Issues Review, Correction & Acceptance Register |
| **Governing Baseline** | Stage 1 Revision 2.1 (`DAY11-POLICY-A-SOURCE-OF-TRUTH-DECISION.md`) & Stage 2 Forensic Report (`DAY11-STAGE2-ROOT-CAUSE-FORENSIC-REPORT.md`) |
| **Current Policy Status** | Policies A–E — `PROPOSED, APPROVAL PENDING` |
| **Governance Gate 1** | `LOCKED — FINANCIAL EXECUTION NOT AUTHORIZED` |
| **Stage 4 Status** | `NOT STARTED` |
| **Date of Execution** | November 7, 2026 |

---

## 1. Executive Summary & Review Purpose

During the independent technical and audit review of the initial Stage 3 deliverables, five policy-quality issues were identified across the proposed governance policies. While Stage 3 established an architectural baseline, specific policy assertions exceeded the available technical evidence or conflated proposed design specifications with verified facts.

This Correction Register documents the comprehensive, evidence-based remediation of all five issues:
1. **Issue 1 (Policy A):** Over-assertion of active employee roster authority without complete employment status/eligibility history.
2. **Issue 2 (Policy B):** Universal zero-tolerance application across heterogeneous internal and external reconciliation dimensions.
3. **Issue 3 (Policy C):** Unverified ₹5,00,000 two-tier approval threshold lacking stakeholder basis and authorization evidence.
4. **Issue 4 (Policy D):** Proposed 36-column adjustment table presented without detailed field justification or logical design review.
5. **Issue 5 (Policy E):** Synthetic GL accounts, 100% UTR matching, and statutory return mappings presented without corporate validation.

Every issue is resolved with explicit evidence boundaries, updated decision items, and complete documentation amendments. Gate 1 remains unconditionally **LOCKED**.

---

## 2. Issue 1 — Policy A: Employee Eligibility & Headcount Authority

### 2.1 Problem Identified
The initial Stage 3 Policy A documentation stated: *"Active employee rosters govern employee headcount entitlement."*  
However, the Stage 1 and Stage 2 forensic audits conclusively established that the supplied dataset (`employees.json` / `employees` table) contains only `hire_date` and lacks:
- Effective termination dates.
- Historical employment status transitions.
- Approved leave-of-absence records.
- Historical roster approval snapshots.
- Formal payroll eligibility determinations.

Consequently, an active flag or presence in `employees.json` at run time does not prove legal or contractual eligibility for that specific monthly payroll run.

### 2.2 Technical & Forensic Evidence Reviewed
- `03_Data_Pack/employees.json` (441 master records): Contains `id`, `name`, `department`, `designation`, `hire_date`, `status`, `base_salary`. Does not track point-in-time status changes prior to data ingestion.
- `03_Data_Pack/payslips.json` (2,469 vouchers): Records payouts for employees who were hired on or before the pay period end, but provides no independent proof of leave-without-pay, suspension, or mid-month exit.
- `docs/DAY11-POLICY-A-SOURCE-OF-TRUTH-DECISION.md` (Revision 2.1): Previously introduced the concept of `Observed Payroll Population` to prevent conflating payslip counts with verified workforce headcounts.

### 2.3 Documentation Changes Made
1. **Mandatory Corrected Principle Adopted:**
   > *"Employee eligibility and payroll headcount authority must be established using an approved employee-status source that includes relevant effective dates and employment-status evidence. The observed payroll population must not automatically be treated as the verified active workforce."*
2. **Six Distinct Population Definitions Established:**
   - **Employee Master Population:** The complete set of 441 corporate records in `employees.json`.
   - **Observed Payroll Population:** The exact count of unique employee vouchers present in a given payroll run's payslip set.
   - **Verified Active Employee Population:** Employees whose active, un-terminated employment status is confirmed by verified effective-dated HR documentation.
   - **Payroll-Eligible Population:** Active employees meeting period-specific eligibility criteria (e.g., minimum days worked, non-suspended, post-probation).
   - **Itemized Payslip Population:** The specific subset of employees for whom payslips were generated in that cycle.
   - **Approved Payroll Headcount:** The formal headcount authorized by the VP of HR in the pre-payroll roster snapshot.
3. **Decision Updated:** `DEC-A-02` renamed to *Employee Eligibility and Headcount Authority*, explicitly noting that approved status sources and eligibility rules require human stakeholder confirmation. Status: `PROPOSED — APPROVAL PENDING`.

### 2.4 Remaining Uncertainty & Approval Required
- *Uncertainty:* Point-in-time employment status history for August/September 2026 remains an unresolvable data pack gap.
- *Approval Required:* VP of Human Resources must formally designate the authoritative employee-status source and establish retro-eligibility rules.

---

## 3. Issue 2 — Policy B: Zero-Tolerance Reconciliation Framework

### 3.1 Problem Identified
The initial Policy B proposed a blanket "zero-tolerance ($0.00$ / $0\text{ paise}$)" standard applied indiscriminately across all nine reconciliation dimensions.  
While exact zero-paise equality is mathematically mandatory for internal payslip arithmetic ($\text{Gross} - \text{Deductions} = \text{Net}$), applying zero tolerance to header-to-itemized comparisons, external GL balancing, or bank clearing without defining measurement methods and evidence sources created contradictory and unworkable rules.

### 3.2 Technical & Forensic Evidence Reviewed
- Forensic audit of 2,469 payslips: All satisfy $\text{Gross} - \text{Deductions} = \text{Net}$ with 0 paise residual.
- Header vs. Payslip comparison across 18 runs: 12 runs have 0 variance; 6 runs have large historical variances (up to ₹8,12,056) originating from upstream data pack truncation.
- Technical precision terminology corrected: *BigInt-based arbitrary-precision integer arithmetic, with monetary values represented in paise* (avoiding inaccurate "inherently 64-bit" JS engine claims).

### 3.3 Documentation Changes Made
1. **Mandatory Separation of Nine Reconciliation Dimensions:**
   - **Dimension A (Payslip Arithmetic Equality):** Mandatory $0\text{ paise}$ residual ($\text{Gross} - \text{Deductions} = \text{Net}$).
   - **Dimension B (Component Aggregation Equality):** Mandatory $0\text{ paise}$ residual ($\sum \text{Earnings} = \text{Gross}$; $\sum \text{Deductions} = \text{Total Deductions}$).
   - **Dimension C (Itemized Payroll Aggregation):** BigInt summation across verified payslip population; duplicate payslip detection.
   - **Dimension D (Header-to-Itemized Reconciliation):** Signed variance formula ($\Delta = \text{Itemized} - \text{Header}$). Non-zero variances remain classified mismatches; zero in-place overwriting.
   - **Dimension E (Rounding Differences):** Explicit definition of integer paise basis; no floating-point rounding. Any fractional paise rules require stakeholder approval.
   - **Dimension F (External Accounting Reconciliation):** Comparison against corporate GL trial balance; requires independent GL evidence.
   - **Dimension G (Bank Settlement Reconciliation):** Comparison against corporate bank statements and clearing reports; $PAID$ flag rejected as proof.
   - **Dimension H (Statutory Remittance Reconciliation):** Comparison against EPFO/ESIC/ITNS 281 receipts.
   - **Dimension I (Population & Employee Reconciliation):** Comparison of observed payslip headcount against approved payroll roster.
2. **Standardized Classification Model (9 Core Classifications):**
   `MATCH`, `MISMATCH`, `ROUNDING_VARIANCE`, `TIMING_VARIANCE`, `MISSING_SOURCE`, `DUPLICATE_RECORD`, `NO_ITEMS`, `UNRESOLVED`, `EXTERNAL_EVIDENCE_REQUIRED`.
3. **Decisions Updated:**
   - `DEC-B-01`: Dimension-Specific Reconciliation Standards (zero paise for Dimensions A/B/C; formal variance management for D through I).
   - `DEC-B-02`: Approval Blocking Rule (unresolved material differences or missing mandatory evidence hard-block approval). Both `PROPOSED — APPROVAL PENDING`.

---

## 4. Issue 3 — Policy C: ₹5,00,000 Two-Tier Approval Threshold

### 4.1 Problem Identified
The initial Policy C proposed a two-tier approval requirement (Payroll Manager + Controller/CFO) for any run exceeding ₹5,00,000.  
A codebase and repository inspection revealed **zero evidentiary basis** for ₹5,00,000:
- `src/` contains zero references to a 500,000 threshold or financial tier.
- The only match for `500000` in the entire workspace was an invoice subtotal in `invoices.json`.
- The threshold was an unverified illustrative number that risked being misconstrued as corporate policy.

### 4.2 Technical & Forensic Evidence Reviewed
- `src/app/api/v1/payroll/runs/[runId]/approve/route.ts`: Contains single-tier maker-checker check (`preparerId !== user.id`). Contains no monetary threshold check.
- Historical payroll totals: Monthly runs range from ₹1.2 Cr to ₹2.5 Cr. An uncalibrated ₹5,00,000 run threshold would cause 100% of runs to trigger tier 2, rendering tier 1 redundant if intended for small exceptions.

### 4.3 Documentation Changes Made
1. **Evaluation of Six Candidate Monetary Bases:**
   - Total Gross Payroll Amount.
   - Total Net Payroll Amount.
   - Total Statutory Deductions.
   - Individual Employee Net Payment.
   - Individual Financial Adjustment Amount.
   - Cumulative Adjustments for One Payroll Cycle.
2. **Clear Designation as Illustrative Proposal:**
   The ₹5,00,000 figure is explicitly classified as an **Unverified Illustrative Example**.
3. **Decision Updated:**
   `DEC-C-02 — Monetary Threshold and Two-Tier Approval Basis`:
   - Proposed Threshold: ₹5,00,000 (Illustrative).
   - Threshold Basis: **UNDECIDED**.
   - Rationale: **PENDING STAKEHOLDER REVIEW**.
   - Approving Authority: Corporate Controller & CFO.
   - Status: `PROPOSED — APPROVAL PENDING`.

---

## 5. Issue 4 — Policy D: 36-Column Adjustment Specification

### 5.1 Problem Identified
The initial Policy D presented a 36-column append-only schema matching `payroll_adjustments` as an established standard without providing an individual field justification, redundancy assessment, or privacy/access risk review.

### 5.2 Technical & Forensic Evidence Reviewed
- `prisma/schema.prisma` & `prisma/dev.db`: Migration `20261106154652_add_payroll_correction_ledger` defines `payroll_adjustments` with 36 columns. Current row count: **0 rows**.
- Live inspection revealed field redundancies (e.g., both BigInt `paise` and Float `total` fields stored simultaneously: `original_gross_paise` and `original_total_gross`).

### 5.3 Documentation Changes Made
1. **Dedicated 36-Field Review Artifact Created:**
   Published [`DAY11-STAGE3-POLICY-D-ADJUSTMENT-SCHEMA-REVIEW.md`](file:///c:/Users/Madugu%20Shiva%20Kumar/OneDrive/图片/Desktop/horizon-portal/docs/DAY11-STAGE3-POLICY-D-ADJUSTMENT-SCHEMA-REVIEW.md) detailing every field's Name, Data Type, Purpose, Mandatory/Optional, Data Source, Sensitivity, Access, Audit Requirement, Redundancy, and Architectural Decision.
2. **Identified Float/BigInt Duplication:**
   Documented that storing both `original_gross_paise` (BigInt) and `original_total_gross` (Real/Float) represents intentional read denormalization for SQL view performance, but the BigInt paise columns are the sole authoritative calculation baseline.
3. **Minimum Viable Logical Model Grouped into 7 Functional Categories:**
   Identity & Linkage, Baseline Snapshots, Adjustment Deltas, Business Justification, Authorization & Maker-Checker, Traceability & Audit Metadata, Lifecycle State.
4. **Proposed Lifecycle Established:**
   `DRAFT` $\rightarrow$ `SUBMITTED` $\rightarrow$ `REVIEWED` $\rightarrow$ `APPROVED` $\rightarrow$ `POSTED` (with explicit paths for `REJECTED`, `CANCELLED`, `REVERSED`, and `SUPERSEDED`).
5. **Decisions Maintained as Proposed:**
   `DEC-D-01` (Model), `DEC-D-02` (Pre-Gate 1 Annotations), `DEC-D-03` (Compensating Reversals). All `PROPOSED — APPROVAL PENDING`.

---

## 6. Issue 5 — Policy E: GL, Banking & Statutory Evidence Mappings

### 6.1 Problem Identified
The initial Policy E introduced specific General Ledger codes (`GL-6100`, `GL-2110..2140`, `GL-2100`, `GL-1010`), mandated 100% individual UTR matching, and asserted statutory filings (EPFO ECR, ESIC Challan, ITNS 281) as though they were verified corporate configurations.  
In reality, the repository contains no corporate chart of accounts, banking integration files, or tax returns.

### 6.2 Technical & Forensic Evidence Reviewed
- Workspace audit: Zero ERP chart of accounts files exist. Zero corporate bank statements or payment gateway batch receipts exist. Zero Indian tax forms exist.
- Stage 2 forensic audit: Previously established these as external evidence gaps.

### 6.3 Documentation Changes Made
1. **Dedicated External Mapping Validation Artifact Created:**
   Published [`DAY11-STAGE3-POLICY-E-EXTERNAL-MAPPING-VALIDATION.md`](file:///c:/Users/Madugu%20Shiva%20Kumar/OneDrive/图片/Desktop/horizon-portal/docs/DAY11-STAGE3-POLICY-E-EXTERNAL-MAPPING-VALIDATION.md).
2. **Explicit Classification of Proposed GL Codes:**
   All proposed codes (`GL-6100`, `GL-2110`, etc.) are formally classified as:
   $$\mathbf{PROPOSED\_EXAMPLE\_ONLY\ —\ UNVERIFIED\ —\ EXTERNAL\_EVIDENCE\_REQUIRED}$$
3. **Banking Settlement Qualified:**
   - Addressed payment batching realities: Corporate salary disbursements typically process via bulk NEFT/NACH files with a single batch debit reference, accompanied by individual beneficiary UTR credits.
   - Missing bank evidence formally designated: `BANK_SETTLEMENT_EVIDENCE_NOT_PROVIDED`.
4. **Statutory Compliance Evidence Qualified:**
   - References to EPFO TRRN, ESIC Challans, and ITNS 281 CIN are classified as **Regulatory Standards Requiring External Verification**, not verified achievements.
5. **Tripartite Evidence Hierarchy Formalized:**
   Strict separation between:
   - Category 1: Mathematical Calculation Evidence (Internal).
   - Category 2: General Ledger Accounting Evidence (ERP).
   - Category 3: Bank & Statutory Settlement Evidence (External Financial/Government Network).

---

## 7. Summary of Changes Across Stage 3 Deliverables

| Deliverable ID | File Path | Amendment Summary | Acceptance Status |
|---|---|---|---|
| **DEL-01** | `DAY11-STAGE3-POLICY-A-GOVERNANCE-REVIEW.md` | Replaced unverified active roster text; added 6 population distinctions; updated DEC-A-02. | `AMENDED & VERIFIED` |
| **DEL-02** | `DAY11-STAGE3-POLICY-B-RECONCILIATION-AND-VARIANCE-GOVERNANCE.md` | Separated 9 dimensions; defined dimension-specific tolerances; standardized 9 classifications; arbitrary-precision BigInt wording. | `AMENDED & VERIFIED` |
| **DEL-03** | `DAY11-STAGE3-POLICY-C-PAYROLL-APPROVAL-AND-MAKER-CHECKER.md` | Evaluated 6 threshold bases; classified ₹5,00,000 as illustrative; updated DEC-C-02. | `AMENDED & VERIFIED` |
| **DEL-04** | `DAY11-STAGE3-POLICY-D-ADJUSTMENTS-AND-HISTORICAL-PRESERVATION.md` | Linked to 36-field review; evaluated 5 correction models; documented denormalization logic. | `AMENDED & VERIFIED` |
| **DEL-05** | `DAY11-STAGE3-POLICY-E-AUDIT-ACCOUNTING-AND-SETTLEMENT-EVIDENCE.md` | Classified GL codes as proposed examples; qualified UTR matching; established 3 evidence tiers. | `AMENDED & VERIFIED` |
| **DEL-06** | `DAY11-STAGE3-GOVERNANCE-CONTROL-MATRIX.md` | Synchronized all 11 control areas with corrected policy principles and definitions. | `AMENDED & VERIFIED` |
| **DEL-07** | `DAY11-STAGE3-GOVERNANCE-APPROVAL-PACKAGE.md` | Updated DEC-A-02, DEC-B-01/02, DEC-C-02, DEC-E-01/02/03 with qualified scopes and pending states. | `AMENDED & VERIFIED` |
| **DEL-08** | `DAY11-STAGE3-GATE-1-READINESS-AND-LOCK-REGISTER.md` | Added 10 explicit readiness checks for the 5 issues; maintained LOCKED determination. | `AMENDED & VERIFIED` |
| **DEL-09** | `DAY11-STAGE3-FUTURE-IMPLEMENTATION-ROADMAP.md` | Qualified Stage 4 workstreams; clarified dependencies on human policy ratifications. | `AMENDED & VERIFIED` |
| **DEL-10** | `DAY11-STAGE3-FINAL-ACCEPTANCE-REPORT.md` | Preserved as initial acceptance record; superseded by revised final acceptance report. | `PRESERVED BASELINE` |
| **NEW-01** | `DAY11-STAGE3-FIVE-ISSUE-CORRECTION-REGISTER.md` | Current document — detailed record of all 5 corrections. | `DELIVERED` |
| **NEW-02** | `DAY11-STAGE3-POLICY-D-ADJUSTMENT-SCHEMA-REVIEW.md` | Field-by-field review of all 36 proposed adjustment columns and logical design. | `DELIVERED` |
| **NEW-03** | `DAY11-STAGE3-POLICY-E-EXTERNAL-MAPPING-VALIDATION.md` | Comprehensive classification of GL codes, UTR matching, and statutory return evidence. | `DELIVERED` |
| **NEW-04** | `DAY11-STAGE3-CROSS-POLICY-CONTRADICTION-AND-CONSISTENCY-AUDIT.md` | Rigorous cross-policy coherence audit and contradiction register. | `DELIVERED` |
| **NEW-05** | `DAY11-STAGE3-FINAL-REVISED-ACCEPTANCE-REPORT.md` | Revised formal acceptance report concluding Stage 3 with updated determination. | `DELIVERED` |

---

*End of Day 11 Stage 3 Five-Issue Correction Register.*

