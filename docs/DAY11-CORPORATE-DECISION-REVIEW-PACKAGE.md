# DAY 11 — CORPORATE DECISION REVIEW PACKAGE
## Aura Workforce by Growmar — Horizon Portal
### Phase 3 — Teams and Insight | Day 11: Admin Payroll Run Console
### Post Gate 1 Quality Control | Master Decision Review & Deliberation Package

---

## Document Metadata

| Attribute | Specification |
|---|---|
| **Document ID** | `DAY11-CORPORATE-DECISION-REVIEW-PACKAGE` |
| **Document Title** | Corporate Stakeholder Decision Review Package (All 18 Master Decisions) |
| **Project & Phase** | Aura Workforce by Growmar — Horizon Portal / Phase 3 — Day 11 |
| **Governing Baseline** | Master Decision Register (`DAY11-GATE1-MASTER-DECISION-REGISTER.md`), Priority Assessment |
| **Execution Mode** | Governance Review Preparation (Strictly Read-Only Documentation) |
| **Decisions Tracked** | **18 Master Decisions** across Policies A through E |
| **Decision Status** | **18 of 18 in `PROPOSED — APPROVAL PENDING`** (0 Approved, 0 Rejected) |
| **Illustrative Threshold** | `DEC-C-02`: ₹5,00,000 is strictly illustrative; basis and amount remain undecided |
| **Quorum Classification**| `PROPOSED QUORUM REQUIREMENT — FORMAL CORPORATE AUTHORITY NOT YET VERIFIED` |
| **Gate 1 Status** | **`GATE 1: LOCKED — FINANCIAL EXECUTION NOT AUTHORIZED`** |
| **Stage 4B Status** | **`STAGE 4B: NOT AUTHORIZED`** |
| **Date of Execution** | November 7, 2026 |

---

## 1. Executive Summary & Review Invariants

This document compiles the **Master Decision Review Package** for the executive leadership of Growmar and Aura Workforce.

All eighteen master decisions formulated during Stages 1 through 4A remain in status **`PROPOSED — APPROVAL PENDING`**. No decision has been approved, ratified, or rejected by technical engineering teams.

### Strict Governance Rules for Stakeholder Deliberation:
1. **Decision Authority Rests Solely with Human Officers:** Technical teams provide neutral analysis, comparative architectural models, and forensic evidence; only authorized human officers may execute determinations.
2. **Monetary Threshold Undecided (`DEC-C-02`):** The ₹5,00,000 threshold cited in earlier discussions is strictly illustrative. Corporate Controller and CFO must select the measurement basis and determine the binding numeric threshold.
3. **Quorum Rule is Proposed:** The multi-party voting threshold is classified as:  
   $$\mathbf{PROPOSED\ QUORUM\ REQUIREMENT\ —\ FORMAL\ CORPORATE\ AUTHORITY\ NOT\ YET\ VERIFIED}$$  
   Corporate leadership must confirm the applicable voting threshold under corporate bylaws or financial delegation policies.

---

## 2. Eighteen-Decision Master Stakeholder Review Table

```
========================================================================================================================
                                     EIGHTEEN MASTER DECISIONS REVIEW TABLE
========================================================================================================================
```

| Decision ID | Decision Title | Current Status | Required Stakeholder | Supporting Evidence | Questions Requiring Resolution | Expected Decision Record | Dependencies | Consequences if Unresolved |
|---|---|---|---|---|---|---|---|---|
| **DEC-A-01** | Realized Compensation Authority | `PROPOSED — APPROVAL PENDING` | Corporate Controller & CFO | Mathematical proof of line-item equality across 2,469 payslips (`EVID-REC-01`) | Shall itemized payslips (`payslips` table) be designated as the sole authoritative source of truth for gross, deductions, and net pay over batch headers? | Signed Template 15.1 Decision Record | None | Inability to resolve historical variances; conflicting financial reporting between payslips and summary headers. |
| **DEC-A-02** | Authoritative Employee-Status Source | `PROPOSED — APPROVAL PENDING` | VP of Human Resources (`HR-VPHR`) | Historical headcount divergence analysis; missing termination dates in `employees.json` | What enterprise HRMS system constitutes the single source of truth for employment status, effective hire/termination dates, and active eligibility? | Signed Template 15.1 Decision Record & Written HR Directive | None | Risk of phantom employee payments; inability to validate whether observed payslips represent the genuine eligible workforce. |
| **DEC-A-03** | Classification of Stored Run Headers | `PROPOSED — APPROVAL PENDING` | Corporate Controller (`FIN-CTRL`) | Stage 1 & 2 forensic reports proving upstream data pack divergence (`EVID-REC-02`) | Shall stored batch headers (`payroll_runs` table) be formally classified as historical informational snapshots reflecting pre-reconciliation state? | Signed Template 15.1 Decision Record | `DEC-A-01` | Confusion regarding data integrity; risk of treating outdated header figures as binding accounting truth. |
| **DEC-A-04** | Resolution of Historical Discrepancies | `PROPOSED — APPROVAL PENDING` | Head of Internal Audit & CFO | Statutory and accounting standards mandating audit trail preservation (IT Act Sec 65B) | Shall historical variances be resolved strictly via append-only ledger entries rather than in-place database SQL `UPDATE` overwrites? | Signed Template 15.1 Decision Record | `DEC-A-03`, `POL-D` | Loss of audit trail if in-place overwrites are attempted; violation of SOC 1 Type II compliance. |
| **DEC-B-01** | Payroll Reconciliation Policy & Paise Engine | `PROPOSED — APPROVAL PENDING` | Corporate Controller (`FIN-CTRL`) | 9-dimensional architectural assessment (`EVID-REC-03`); sign-convention conflict audit (`EVID-REC-04`) | Shall the 9-dimensional reconciliation framework and arbitrary-precision BigInt paise engine (`reconciliation-engine.ts`) be adopted as the sole calculation authority? | Signed Template 15.1 Decision Record | `DEC-A-01` | Ongoing sign-convention conflict between parallel services; calculation discrepancies across currency boundaries. |
| **DEC-B-02** | Mandatory Approval-Blocking Rule | `PROPOSED — APPROVAL PENDING` | Head of Internal Audit (`AUD-HEAD`) | Code verification of approval gating logic and HTTP 422 error codes (`approve/route.ts`) | Shall unresolved material variances and reconciliation statuses $\ne$ `'MATCH'` hard-block progression to approval for operational runs? | Signed Template 15.1 Decision Record | `DEC-B-01` | Unchecked approval of corrupted or mismatched payroll batches; financial disbursement errors. |
| **DEC-C-01** | Segregation of Duties (Maker-Checker) | `PROPOSED — APPROVAL PENDING` | Head of Internal Audit & VP HR | Empirical code audit proving null `preparerId` bypass across 18 of 18 historical runs (`EVID-GOV-03`) | Shall the system strictly enforce $\text{preparer\_id} \ne \text{approved\_by\_id}$ at API and SQLite DB layers, rejecting null preparers via fail-closed triggers? | Signed Template 15.1 Decision Record | None | Critical Control Gap remains open; unilateral approval of historical or unassigned payroll batches. |
| **DEC-C-02** | Monetary Approval Threshold Basis & Amount | `PROPOSED — APPROVAL PENDING` | Corporate Controller & CFO | Comparative evaluation of 5 candidate threshold measurement bases (Gross, Net, Variance, Headcount, Hybrid) | What measurement basis and monetary ceiling shall govern mandatory secondary executive review? (₹5,00,000 remains strictly illustrative). | Signed Template 15.1 Decision Record (Joint Resolution) | `DEC-C-01` | Operational bottlenecks if threshold is too low; unreviewed large disbursements if threshold is undefined. |
| **DEC-C-03** | Pre-Approval Lifecycle Sequence | `PROPOSED — APPROVAL PENDING` | Corporate Controller (`FIN-CTRL`) | State progression specifications in Stage 3 & 4A target architecture blueprints | Shall the system enforce strict linear lifecycle progression (`DRAFT` $\rightarrow$ `RECONCILING` $\rightarrow$ `RECONCILED` $\rightarrow$ `PENDING_APPROVAL`)? | Signed Template 15.1 Decision Record | `DEC-B-02` | Payroll runs approved prior to reconciliation completion; bypassing financial controls. |
| **DEC-D-01** | Financial Adjustment Model | `PROPOSED — APPROVAL PENDING` | Corporate Controller & CFO | Comparative evaluation of 5 correction mechanisms in Stage 3 review (`EVID-ADJ-01`) | Shall Mechanism 1 (Append-Only `payroll_adjustments` ledger) be ratified as the sole financial adjustment vehicle post-Gate 1? | Signed Template 15.1 Decision Record | `DEC-A-04` | Uncontrolled direct SQL mutations on historical tables; loss of financial auditability. |
| **DEC-D-02** | Pre-Gate 1 Anomaly Presentation | `PROPOSED — APPROVAL PENDING` | Chief Financial Officer (`EXEC-CFO`) | Read-only UI annotation implementation in Admin Payroll Console (`EVID-ADJ-02`) | Shall historical variances continue to be presented via Mechanism 5 (Dynamic Annotations) while Gate 1 is locked? | Signed Template 15.1 Decision Record | None | Confusion among operators viewing historical runs; premature attempt to post adjustments. |
| **DEC-D-03** | Reversal & Revocation Protocol | `PROPOSED — APPROVAL PENDING` | Head of Internal Audit (`AUD-HEAD`) | Accounting standards for compensating double-entry journal reversals (`EVID-ADJ-03`) | Shall approved adjustments be revoked exclusively via compensating inverse signed adjustment rows rather than database row deletion? | Signed Template 15.1 Decision Record | `DEC-D-01` | Deleted transaction history; inability to prove prior states during internal or external audits. |
| **DEC-D-04** | Adjustment Model & Schema Governance | `PROPOSED — APPROVAL PENDING` | Lead Systems Architect & Controller | Field-by-field audit of 36-column table present in `schema.prisma` and `dev.db` (0 rows) | Shall the 36-column append-only adjustment schema and its authority assignment be ratified for runtime development post-Gate 1? | Signed Template 15.1 Decision Record | `DEC-D-01` | Blocked Stage 4B-2 development; lack of standardized schema for variance true-ups. |
| **DEC-E-01** | Tripartite Evidence Mandate | `PROPOSED — APPROVAL PENDING` | Chief Financial Officer (`EXEC-CFO`) | Tripartite Evidence Architecture Blueprint (`DAY11-STAGE4A-EXTERNAL-EVIDENCE-ARCHITECTURE.md`) | Shall internal calculation math alone be deemed insufficient to declare a run reconciled without General Ledger and Bank tie-out? | Signed Template 15.1 Decision Record | `DEC-A-01` | False claims of financial settlement; unverified bank disbursements and statutory non-compliance. |
| **DEC-E-02** | Statutory Evidence Standards | `PROPOSED — APPROVAL PENDING` | Head of Tax Operations & Audit | Mandate for EPFO TRRN, ESIC CPIN, and Income Tax Form 24Q CIN receipts (`EVID-TAX-01`..`03`) | How shall missing external government challans be classified, and what standards must be met to substantiate statutory compliance? | Signed Template 15.1 Decision Record | None | Severe regulatory penalties under EPF & MP Act 1952, ESI Act 1948, and IT Act 1961 if remittances are unproven. |
| **DEC-E-03** | Audit Log Schema Expansion | `PROPOSED — APPROVAL PENDING` | Lead Architect & Head of Audit | Inspection of current 12-column `AuditLog` model (87 rows, 0 payroll entries) | Shall the `audit_logs` schema be expanded post-Gate 1 to include entity foreign keys and SHA-256 Merkle hash chaining? | Signed Template 15.1 Decision Record | `POL-C`, `POL-D` | Vulnerability to undetected database log tampering; failing SOC 1 Type II compliance. |
| **DEC-E-04** | External Evidence: ERP Chart of Accounts | `PROPOSED — APPROVAL PENDING` | Corporate Controller (`FIN-CTRL`) | Relational model for `PayrollGlEntry`; absence of official ERP account strings in repo | How shall corporate General Ledger accounts be authorized, and will the Controller provide the official ERP COA extract? | Signed Template 15.1 Decision Record & Certified ERP Extract | None | Inability to map salary expenses to corporate general ledger; blocked Stage 4B-4 development. |
| **DEC-E-05** | Banking & Settlement Evidence Model | `PROPOSED — APPROVAL PENDING` | Corporate Treasurer (`TREAS-MGR`) | Relational model for `PayrollBankingSettlement`; absence of bank statements and UTRs in repo | What model shall govern treasury disbursement verification (Batch Bank Debits vs. Individual UTRs vs. Hybrid Model)? | Signed Template 15.1 Decision Record & Bank Clearing Files | `DEC-E-01` | Inability to prove employees actually received net salary; employee wage theft risk remains unmitigated. |

---

## 3. In-Depth Decision Papers for Priority Decisions

### 3.1. DEC-A-02: Authoritative Employee-Status Source & Population Criteria
- **Decision Question:** What enterprise HRMS system constitutes the single authoritative source of truth for employee eligibility, hire dates, termination dates, and status transitions?
- **Forensic Context:** The benchmark data pack contains a static roster (`03_Data_Pack/employees.json`) reflecting 441 employees. However, historical payroll runs reflect lower voucher counts (e.g., 434 in April 2026, 436 in May 2026).
- **Core Defect:** The repository lacks termination dates, effective status changes, and leave logs. It cannot be mathematically determined whether the 7 missing individuals in April 2026 were terminated, on unpaid sabbatical, or omitted in error.
- **Decision Required from VP HR:**
  1. Formally designate the primary HRMS (e.g., Workday, Darwinbox, SuccessFactors).
  2. Ratify the 6-population taxonomy: Master Population, Observed Population, Eligible Population, Paid Population, Unpaid Population, and Terminated Population.
  3. Supply effective-dated termination files for FY2025–26.

---

### 3.2. DEC-B-01: Payroll Reconciliation Policy & Paise Engine
- **Decision Question:** Shall the 9-dimensional reconciliation framework and arbitrary-precision BigInt paise engine (`reconciliation-engine.ts`) be adopted as the sole calculation authority?
- **Technical Context:** Code audit revealed an active contradiction:
  - `src/lib/payroll/reconciliation-engine.ts#L462`: $\text{Variance} = \text{Itemized Total} - \text{Stored Header}$ (negative delta when header exceeds items).
  - `src/lib/payroll/reconciliation-service.ts#L190`: $\text{grossDiffPaise} = \text{Stored Header} - \text{Itemized Total}$ (positive delta when header exceeds items).
- **Decision Required from Corporate Controller:**
  1. Formally adopt `reconciliation-engine.ts` as the sole calculation engine.
  2. Deprecate `reconciliation-service.ts` post-Gate 1.
  3. Enforce a strict 0-paise internal tolerance across Dimensions A, B, and C.

---

### 3.3. DEC-C-01: Maker-Checker Role Separation (Null Preparer Remediation)
- **Decision Question:** Shall the system strictly enforce $\text{preparer\_id} \ne \text{approved\_by\_id}$ at API and database layers, rejecting null preparers via fail-closed controls?
- **Forensic Context:** Inspection of `src/app/api/v1/payroll/runs/[runId]/approve/route.ts#L90-L104` revealed that if `run.preparerId` is `null`, dual-control validation is skipped entirely. In `prisma/dev.db`, exactly 18 of 18 historical runs have `preparer_id = NULL`.
- **Decision Required from Head of Internal Audit & VP HR:**
  1. Approve the fail-closed remediation plan requiring `preparerId IS NOT NULL` before any run can be approved.
  2. Authorize an additive SQLite database trigger preventing approval transitions when `preparer_id` is null.
  3. Mandate regression security tests verifying 0 bypass paths.

---

### 3.4. DEC-C-02: Monetary Approval Threshold Basis & Amount
- **Decision Question:** What measurement basis and numeric monetary ceiling shall govern mandatory secondary executive review?
- **Status Notice:** **`DEC-C-02 — MONETARY THRESHOLD BASIS UNDECIDED — FORMAL CONTROLLER/CFO DECISION REQUIRED.`** The ₹5,00,000 threshold figure remains strictly illustrative.
- **Comparison of Candidate Bases:**

| Candidate Basis | Operational Definition | Primary Strength | Primary Vulnerability | Controller/CFO Evaluation |
|---|---|---|---|---|
| **Basis 1: Total Gross Pay** | Aggregate gross earnings before deductions. | Reflects total corporate wage obligation. | Overstates net cash disbursement requirements. | Standard enterprise financial control base. |
| **Basis 2: Total Net Pay** | Actual net pay disbursed to employees. | Matches exact cash leaving bank account. | Ignores employer tax/PF withholding liabilities. | Direct alignment with treasury funding limits. |
| **Basis 3: Absolute Variance** | Absolute delta: $\|\text{Itemized} - \text{Header}\|$. | Triggers executive escalation only on errors. | Clean runs with massive budgets escape secondary review. | Ideal as exception trigger, poor as primary ceiling. |
| **Basis 4: Total Headcount** | Total number of employees in payroll run. | Unaffected by salary rates or inflation. | Ignores monetary disbursement magnitude. | Better suited as operational capacity control. |
| **Basis 5: Hybrid Model** | Either Net Pay $>$ ₹X OR Absolute Variance $>$ ₹Y. | Comprehensive control over both scale and risk. | Slightly higher configuration complexity. | **Recommended for Controller & CFO adoption.** |

- **Decision Required from Controller & CFO:** Select approved basis (1–5) and determine binding monetary threshold amount.

---

### 3.5. DEC-D-04: Adjustment Model & 36-Column Schema Governance
- **Decision Question:** Shall the 36-column append-only adjustment schema and its authority assignment be ratified for implementation post-Gate 1?
- **Technical Context:** A 36-column table definition exists in `prisma/schema.prisma#L60-L125` and `prisma/dev.db` with exactly 0 rows. Runtime CRUD services do not exist.
- **Decision Required from Lead Architect & Controller:**
  1. Ratify 36-column schema preserving double-entry accounting attributes.
  2. Mandate that historical dispositions be executed solely through this append-only ledger.
  3. Formally designate who holds legal authority to authorize historical true-ups (`AUTHORITY NOT YET APPROVED — GOVERNANCE DECISION REQUIRED`).

---

### 3.6. DEC-E-04: External Evidence — ERP Chart of Accounts
- **Decision Question:** How shall corporate General Ledger accounts be authorized, and will the Controller provide the official ERP COA extract?
- **Status Notice:** `EXTERNAL EVIDENCE NOT AVAILABLE IN THE INSPECTED PROJECT REPOSITORY — INDEPENDENT EXTERNAL VALIDATION PENDING.`
- **Context:** The repository currently uses placeholder strings (`GL-6100`, `GL-2120`). Real-world ERP account codes have not been provided.
- **Decision Required from Controller:** Supply certified ERP Chart of Accounts extract matching SAP/Oracle production financial ledgers.

---

### 3.7. DEC-E-05: Banking & Settlement Evidence Model
- **Decision Question:** What model shall govern corporate treasury disbursement verification (Batch Bank Debits vs. Individual UTRs vs. Hybrid Model)?
- **Status Notice:** `EXTERNAL EVIDENCE NOT AVAILABLE IN THE INSPECTED PROJECT REPOSITORY — INDEPENDENT EXTERNAL VALIDATION PENDING.`
- **Context:** The repository contains zero commercial bank statements and zero RBI UTR numbers. The `'PAID'` flag in SQLite does not prove cash disbursement.
- **Decision Required from Treasurer:**
  1. Authorize the hybrid settlement matching model.
  2. Deliver monthly commercial bank statements showing consolidated payroll debits.
  3. Deliver electronic clearing manifests containing 2,469 beneficiary UTR numbers.

---

### 3.8. DEC-E-02: Statutory & Tax Remittance Compliance Standards
- **Decision Question:** How shall missing external government challans be classified, and what standards must be met to substantiate statutory compliance?
- **Status Notice:** Zero government receipts exist in the repository for EPFO, ESIC, or Income Tax TDS.
- **Decision Required from Head of Tax Operations:**
  1. Provide validated EPFO TRRN challan receipts.
  2. Provide validated ESIC CPIN contribution challans.
  3. Provide Form 24Q quarterly filing provisional receipts and ITNS 281 challans with CIN.

---

## 4. Proposed Quorum Rule Clarification

```
===========================================================================================
               GOVERNANCE QUORUM DETERMINATION & AUTHORITY NOTICE
===========================================================================================
PROPOSED QUORUM REQUIREMENT — FORMAL CORPORATE AUTHORITY NOT YET VERIFIED
===========================================================================================
```

The multi-stakeholder voting thresholds defined in technical documentation (such as the four-officer unanimous sign-off of CFO, Controller, VP HR, and Audit Head) represent **proposed technical standards**.

Corporate leadership must:
1. Identify the authoritative corporate governance instrument (e.g., Corporate Governance Charter, Board Delegation of Authority Policy, or Audit Committee By-Laws).
2. Formally confirm whether software gating decisions require:
   - Unanimous Executive Quorum (100% agreement)
   - Supermajority Quorum (e.g., 75% agreement)
   - Simple Majority Quorum (e.g., $>50\%$ agreement)
   - Role-Specific Individual Delegation

---

## 5. Review & Voting Instructions for Corporate Stakeholders

1. **Review Context:** Stakeholders must inspect the neutral decision assessments and supporting evidence references in this package.
2. **Execute Decision Records:** For each assigned decision, the designated officer must execute a standardized **Template 15.1 Decision Determination Record** selecting one of five permitted outcomes:
   - `APPROVED`
   - `APPROVED_WITH_CONDITIONS`
   - `REJECTED`
   - `DEFERRED`
   - `RETURNED_FOR_MORE_EVIDENCE`
3. **No Automatic Authorization:** Completing individual decision records resolves technical blockers; it does not automatically unlock Gate 1. Gate 1 remains locked until all 12 Unlocking Conditions are satisfied.

---

## 6. Summary & Gate 1 Guard

- **Decision Package Ready:** All 18 decisions are documented with explicit stakeholders, evidence links, open questions, dependencies, and risk assessments.
- **Gate 1 Status:** `GATE 1 LOCKED — FINANCIAL EXECUTION NOT AUTHORIZED.`
- **Stage 4B Status:** `STAGE 4B NOT AUTHORIZED.`

---

*End of Day 11 Corporate Decision Review Package.*

