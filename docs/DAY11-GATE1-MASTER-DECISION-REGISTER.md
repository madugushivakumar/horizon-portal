# DAY 11 — GATE 1: MASTER DECISION REGISTER AUDIT
## Aura Workforce by Growmar — Horizon Portal
### Phase 3 — Teams and Insight | Day 11: Admin Payroll Run Console
### Gate 1 Governance Approval and Readiness Phase

---

## Document Metadata

| Attribute | Specification |
|---|---|
| **Document ID** | `DAY11-GATE1-MASTER-DECISION-REGISTER` |
| **Document Title** | Master Decision Register Audit, Status Verification & Decision Readiness Assessment |
| **Project & Phase** | Aura Workforce by Growmar — Horizon Portal / Phase 3 — Day 11 |
| **Governing Baseline** | Stage 3 Governance Approval Package (`docs/DAY11-STAGE3-GOVERNANCE-APPROVAL-PACKAGE.md`) |
| **Execution Mode** | Governance Review & Decision Audit (Strictly Read-Only) |
| **Total Master Decisions** | **18 Decisions** (`DEC-A-01` through `DEC-E-05`) |
| **Formally Approved Decisions** | **0 Decisions (0.0%)** |
| **Pending Decisions** | **18 Decisions (100.0%)** |
| **Gate 1 Status** | **`GATE 1: LOCKED — FINANCIAL EXECUTION NOT AUTHORIZED`** |
| **Stage 4B Status** | **`STAGE 4B: NOT AUTHORIZED`** |
| **Date of Audit** | November 7, 2026 |

---

## 1. Executive Summary & Governing Baseline

This document provides the formal Gate 1 audit of the Master Decision Register governing the Day 11 Admin Payroll Run Console subsystem.

In the approved-for-review Stage 3 Governance Framework, eighteen structured decisions (`DEC-A-01` through `DEC-E-05`) were formulated across Policies A, B, C, D, and E to establish authoritative source-of-truth rules, reconciliation tolerances, maker-checker controls, financial adjustment schemas, and third-party evidence mandates.

### Fundamental Governance Distinctions:
1. **Proposed $\ne$ Approved:** The presence of a thoroughly documented proposal or architectural design in Stages 1–4A does **NOT** constitute corporate approval.
2. **Technical Feasibility $\ne$ Governance Authorization:** Demonstrating that code can execute BigInt integer paise math or validate dual signatures does **NOT** authorize software deployment or financial ledger posting.
3. **Master Register Baseline Audit:**
   - Total Decisions Evaluated: **18 Decisions**
   - Formally Approved Decisions: **0 Decisions**
   - Decisions Awaiting Corporate Voting: **18 Decisions**
   - Gate 1 Determination: **`GATE 1 LOCKED — FINANCIAL EXECUTION NOT AUTHORIZED`**

---

## 2. Decision Register Classification Taxonomy

Every decision in the Master Decision Register is evaluated using the following strictly defined classification taxonomy:

| Status Code | Definition & Criteria | Permitted Downstream Action |
|---|---|---|
| `PROPOSED — APPROVAL PENDING` | Decision has been formulated and documented in technical proposals, but has not yet been reviewed or signed by the designated corporate authority. | Eligible for stakeholder review; financial implementation strictly blocked. |
| `READY_FOR_STAKEHOLDER_REVIEW` | All prerequisite technical assessments, forensic analyses, and neutral comparisons are complete. Ready for executive voting. | Routing to executive leadership review queue. |
| `EVIDENCE_PENDING` | Decision requires external documentary evidence (e.g., corporate chart of accounts, bank statements, HR roster) before it can be resolved. | Blocked pending external evidence ingestion. |
| `UNDER_STAKEHOLDER_REVIEW` | Corporate governance committee or individual authority is actively deliberating on the decision item. | File locked against concurrent modification. |
| `APPROVED_WITH_FORMAL_EVIDENCE` | Unanimous, signed corporate approval artifact delivered and verified. | Clears prerequisite; authorizes technical implementation post-Gate 1. |
| `REJECTED_WITH_FORMAL_EVIDENCE` | Stakeholder authority formally rejects proposal with documented rationale. | Returned to architecture team for redesign. |
| `DEFERRED_WITH_FORMAL_RECORD` | Decision formally postponed to a future release or fiscal period with justification. | Documented as out-of-scope for current phase. |

---

## 3. Comprehensive 18-Decision Audit Table

The table below audits all eighteen master decisions individually across Policies A through E:

| Decision ID | Policy | Decision Title | Decision Description (Approved-for-Review Standard) | Current Status | Required Authority | Evidence Required | Evidence Available in Repo | Evidence Validation Status | Dependencies | Outstanding Question | Formal Approval Record | Approval Date | Decision Readiness |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **DEC-A-01** | POL-A | Realized Compensation Authority | Shall itemized payslips (`payslips` table) be designated as the authoritative source for gross, deductions, and net compensation? | `PROPOSED — APPROVAL PENDING` | Corporate Controller & CFO | Mathematical proof of line-item equality across all payslips | Forensic verification of 2,469 payslips in `dev.db` | `VERIFIED` (Internal Math Verified) | None | Formal adoption of itemized slips over stored header totals | `NONE` | *Pending* | `READY_FOR_STAKEHOLDER_REVIEW` |
| **DEC-A-02** | POL-A | Employee Eligibility & Headcount Authority | Shall headcount and employee eligibility authority be derived from an authorized HR status source with effective dates rather than payslips? | `PROPOSED — APPROVAL PENDING` | VP of Human Resources | Effective-dated HR employment master roster with termination dates | Roster snapshot (`employees.json`), but lacks termination history | `PROVIDED_UNVERIFIED` (Historical Gaps Remain) | HR Roster Definition | Missing termination dates and leave history in data pack | `NONE` | *Pending* | `EVIDENCE_PENDING` |
| **DEC-A-03** | POL-A | Classification of Stored Run Headers | Shall stored batch run headers (`payroll_runs` table) be classified as historical informational snapshots reflecting pre-reconciliation state? | `PROPOSED — APPROVAL PENDING` | Corporate Controller | Forensic traceability proving header figures reflect pre-reconciliation data | Stage 1 & 2 forensic reports documenting upstream data pack divergence | `VERIFIED` (Forensically Proven) | DEC-A-01 | Reclassifying stored operational totals as informational snapshots | `NONE` | *Pending* | `READY_FOR_STAKEHOLDER_REVIEW` |
| **DEC-A-04** | POL-A | Resolution of Historical Discrepancies | Shall historical payroll run variances be resolved strictly via append-only ledger entries rather than in-place database overwrites? | `PROPOSED — APPROVAL PENDING` | Head of Internal Audit & CFO | Statutory and accounting standards mandating audit trail preservation | Section 65B compliance standards and Policy D design | `VERIFIED` (Audit Standard Established) | DEC-A-03, POL-D | Formal corporate ratification of append-only correction policy | `NONE` | *Pending* | `READY_FOR_STAKEHOLDER_REVIEW` |
| **DEC-B-01** | POL-B | Dimension-Specific Tolerance Framework | Shall a zero-tolerance ($0\text{ paise}$) standard be enforced on internal arithmetic while external dimensions follow formal investigation? | `PROPOSED — APPROVAL PENDING` | Corporate Controller | Architectural assessment of 9 reconciliation dimensions (A through I) | 9D evaluation in `DAY11-STAGE4A-RECONCILIATION-ARCHITECTURE-ASSESSMENT.md` | `VERIFIED` (Technical Model Documented) | DEC-A-01 | Controller adoption of 0-paise internal tolerance and 9D rules | `NONE` | *Pending* | `READY_FOR_STAKEHOLDER_REVIEW` |
| **DEC-B-02** | POL-B | Mandatory Approval-Blocking Rule | Shall unresolved material variances and reconciliation statuses $\ne$ `'MATCH'` hard-block progression to approval? | `PROPOSED — APPROVAL PENDING` | Head of Internal Audit | Code verification of approval gating logic and HTTP error codes | Verification of HTTP 422 in `approve/route.ts#L134-L171` | `VERIFIED` (Code Control Verified) | DEC-B-01 | Maintaining hard block on operational runs vs historical exception path | `NONE` | *Pending* | `READY_FOR_STAKEHOLDER_REVIEW` |
| **DEC-C-01** | POL-C | Segregation of Duties (Maker-Checker) | Shall the system strictly enforce $\text{preparer\_id} \ne \text{approved\_by\_id}$ at API and database layers, rejecting self-approval? | `PROPOSED — APPROVAL PENDING` | Head of Internal Audit & VP HR | Code audit of maker-checker validation and nullability bypass | `CRITICAL CONTROL GAP` documented in `dev.db` (18 of 18 null) | `VERIFIED` (Vulnerability Proven) | None | Remediating null `preparerId` bypass via fail-closed strategy | `NONE` | *Pending* | `READY_FOR_STAKEHOLDER_REVIEW` |
| **DEC-C-02** | POL-C | Monetary Approval Threshold Basis | What monetary threshold and measurement basis shall govern two-tier executive sign-off? | `PROPOSED — APPROVAL PENDING` | Corporate Controller & Chief Financial Officer | Neutral comparison of candidate bases (Gross, Net, Delta, Variance) | Neutral decision assessment in Section 5 of this register | `VERIFIED` (Comparison Documented) | DEC-C-01 | **UNDECIDED.** Controller/CFO decision required; ₹5,00,000 illustrative | `NONE` | *Pending* | `READY_FOR_STAKEHOLDER_REVIEW` |
| **DEC-C-03** | POL-C | Pre-Approval Lifecycle Sequence | Shall the system enforce strict linear state progression (`DRAFT` $\rightarrow$ `RECONCILING` $\rightarrow$ `RECONCILED` $\rightarrow$ `PENDING_APPROVAL`)? | `PROPOSED — APPROVAL PENDING` | Corporate Controller | Application lifecycle analysis and state-machine design | State progression specifications in Stage 3 & 4A | `VERIFIED` (Workflow Designed) | DEC-B-02 | Gating mechanism preventing approval prior to completed reconciliation | `NONE` | *Pending* | `READY_FOR_STAKEHOLDER_REVIEW` |
| **DEC-D-01** | POL-D | Financial Adjustment Model | Shall Mechanism 1 (Append-Only `payroll_adjustments`) be adopted as the sole financial adjustment model post-Gate 1? | `PROPOSED — APPROVAL PENDING` | Corporate Controller & CFO | Comparative evaluation of 5 correction mechanisms | Evaluation in `DAY11-STAGE3-POLICY-D-ADJUSTMENT-SCHEMA-REVIEW.md` | `VERIFIED` (Technical Spec Complete) | DEC-A-04 | Ratification of Mechanism 1 as exclusive corporate adjustment vehicle | `NONE` | *Pending* | `READY_FOR_STAKEHOLDER_REVIEW` |
| **DEC-D-02** | POL-D | Pre-Gate 1 Anomaly Presentation | How shall historical variances be presented while Gate 1 is locked and adjustment posting is unauthorized? | `PROPOSED — APPROVAL PENDING` | Chief Financial Officer | Read-only preservation requirements and UI annotation designs | Mechanism 5 (Dynamic Annotations) deployed in UI console | `VERIFIED` (Read-Only Display Active) | None | Preserving read-only display without mutating underlying rows | `NONE` | *Pending* | `READY_FOR_STAKEHOLDER_REVIEW` |
| **DEC-D-03** | POL-D | Reversal & Revocation Protocol | How shall approved adjustments be cancelled or revoked post-Gate 1? | `PROPOSED — APPROVAL PENDING` | Head of Internal Audit | Accounting standards for compensating journal reversals | Technical specification for compensating inverse revision rows | `VERIFIED` (Specification Complete) | DEC-D-01 | Reversal via inverse signed adjustments vs. prohibited SQL deletion | `NONE` | *Pending* | `READY_FOR_STAKEHOLDER_REVIEW` |
| **DEC-D-04** | POL-D | Technical Approval of 36-Field Schema | Shall the 36-column `payroll_adjustments` schema design be ratified for implementation post-Gate 1? | `PROPOSED — APPROVAL PENDING` | Lead Systems Architect & Controller | Field-by-field schema review and BigInt paise precision analysis | 36-column table present in `schema.prisma` and `dev.db` (0 rows) | `VERIFIED` (Schema Reviewed) | DEC-D-01 | Authorizing runtime service integration post-Gate 1 | `NONE` | *Pending* | `READY_FOR_STAKEHOLDER_REVIEW` |
| **DEC-E-01** | POL-E | Tripartite Evidence Mandate | Shall internal calculation math alone be deemed insufficient to declare a run reconciled without GL and Bank tie-out? | `PROPOSED — APPROVAL PENDING` | Chief Financial Officer | Independent verification requirements across accounting and banking | Tripartite Evidence Architecture in `DAY11-STAGE4A-EXTERNAL-EVIDENCE-ARCHITECTURE.md` | `VERIFIED` (Hierarchy Designed) | DEC-A-01 | Prohibiting internal-only certification of settlement | `NONE` | *Pending* | `READY_FOR_STAKEHOLDER_REVIEW` |
| **DEC-E-02** | POL-E | Classification of Pre-Gate 1 Historical Evidence | How shall missing external bank and tax records for historical runs be formally classified? | `PROPOSED — APPROVAL PENDING` | Head of Internal Audit | Physical repository audit of external financial documents | Mandatory wording: `EXTERNAL EVIDENCE NOT AVAILABLE IN THE INSPECTED PROJECT REPOSITORY...` | `VERIFIED` (Absence Disclosed) | None | Formally declaring evidence gaps in public reporting | `NONE` | *Pending* | `READY_FOR_STAKEHOLDER_REVIEW` |
| **DEC-E-03** | POL-E | Audit Log Schema Expansion | Shall the `audit_logs` schema be expanded post-Gate 1 to include entity keys and Merkle hash chaining? | `PROPOSED — APPROVAL PENDING` | Lead Architect & Head of Audit | Inspection of current 12-column `AuditLog` model (87 rows, 0 payroll) | Non-breaking migration specification in Stage 4A Target Blueprint | `VERIFIED` (Migration Plan Complete) | POL-C, POL-D | Implementing tamper-evident SHA-256 hash chaining | `NONE` | *Pending* | `READY_FOR_STAKEHOLDER_REVIEW` |
| **DEC-E-04** | POL-E | Chart of Accounts Verification | How shall corporate General Ledger accounts be authorized for payroll export? | `PROPOSED — APPROVAL PENDING` | Corporate Controller | Corporate Chart of Accounts signed by Controller | `EXTERNAL EVIDENCE NOT AVAILABLE IN THE INSPECTED PROJECT REPOSITORY — INDEPENDENT EXTERNAL VALIDATION PENDING.` | `NOT_PROVIDED` (External Evidence Pending) | None | Provision of authorized corporate ERP account codes | `NONE` | *Pending* | `EVIDENCE_PENDING` |
| **DEC-E-05** | POL-E | Banking Settlement Matching Model | What model shall govern corporate treasury disbursement verification? | `PROPOSED — APPROVAL PENDING` | Corporate Treasurer | Corporate banking statement debit matching specifications | `EXTERNAL EVIDENCE NOT AVAILABLE IN THE INSPECTED PROJECT REPOSITORY — INDEPENDENT EXTERNAL VALIDATION PENDING.` | `NOT_PROVIDED` (External Evidence Pending) | DEC-E-01 | Ratification of hybrid model (Batch Debit statement tie-out + UTR) | `NONE` | *Pending* | `EVIDENCE_PENDING` |

---

## 4. In-Depth Analysis of the Seven Priority Decisions

### 4.1 DEC-A-02: Employee Eligibility Authority & Headcount Invariant
- **Decision Question:** Shall employee eligibility and headcount authority be derived from an authorized HR employment-status source with effective dates?
- **Technical Context:** In Stage 2, forensic analysis revealed that the 18 historical runs exhibit headcount divergence against master rosters. Specifically, observed payslip vouchers in April 2026 reflect 434 employees, whereas master roster cohorts reflect 441 employees.
- **Identified Evidence Deficit:** The inspected data pack (`03_Data_Pack/employees.json`) provides basic hire dates but lacks historical termination dates, leave-of-absence records, and effective status transition logs.
- **Governance Requirement:** VP of Human Resources must formally designate the authoritative employee-status source and approve the 6-population taxonomy.
- **Risk of Premature Approval:** Treating observed payslips as the de facto eligible workforce without effective-dated HR substantiation masks phantom employees or unrecorded terminations.
- **Readiness Classification:** `EVIDENCE_PENDING` (Blocked pending VP HR data source confirmation).

### 4.2 DEC-B-01: Dimension-Specific Reconciliation Tolerances
- **Decision Question:** Shall a zero-tolerance ($0\text{ paise}$) standard be enforced on internal arithmetic (Dimensions A, B, C) while external dimensions follow formal investigation?
- **Technical Context:** Stage 4A audited the nine reconciliation dimensions. Internal voucher math ($\text{Gross} - \text{Deductions} \equiv \text{Net}$) is 100% mathematically balanced to 0 paise across all 2,469 payslips.
- **Reconciliation Defect Identified:** `RECONCILIATION CONSISTENCY DEFECT — OPPOSITE VARIANCE SIGN CONVENTIONS`. `reconciliation-engine.ts` ($\text{Items} - \text{Header}$, negative) conflicts with `reconciliation-service.ts` ($\text{Header} - \text{Items}$, positive).
- **Governance Requirement:** Corporate Controller must formally adopt the 0-paise tolerance policy for internal dimensions and ratify `reconciliation-engine.ts` as the sole calculation authority.
- **Readiness Classification:** `READY_FOR_STAKEHOLDER_REVIEW` (Technical model complete; Controller review pending).

### 4.3 DEC-C-01: Segregation of Duties & Maker-Checker Vulnerability
- **Decision Question:** Shall the system strictly enforce $\text{preparer\_id} \ne \text{approved\_by\_id}$ at API and database layers, rejecting self-approval?
- **Critical Code Finding:**
  `CRITICAL CONTROL GAP — HISTORICAL MAKER-CHECKER BYPASS POSSIBLE WHEN preparerId IS NULL`
  In `approve/route.ts#L90-L104`, the check `if (run.preparerId)` causes validation to be skipped when `preparerId` is null. Database inspection proves **100% of historical payroll runs (18 of 18) in `dev.db` have `preparer_id = NULL`**.
- **Governance Limitation:** Existing role checks (`ADMIN`/`HR`) do **NOT** establish maker-checker separation. The approval API is **NOT** safe for historical approval based solely on role and reconciliation checks.
- **Remediation Specification (Proposed Only — Not Implemented):** Deploy a fail-closed validation strategy requiring non-null preparer attribution, enforcing distinct actor identities, and adding database-level triggers.
- **Readiness Classification:** `READY_FOR_STAKEHOLDER_REVIEW` (Vulnerability documented; remediation design complete).

### 4.4 DEC-C-02: Monetary Approval Threshold Basis (UNDECIDED)
- **Decision Question:** What monetary threshold and measurement basis shall govern two-tier executive sign-off?
- **Mandatory Policy Baseline:**
  $$\mathbf{DEC-C-02\ —\ MONETARY\ THRESHOLD\ BASIS\ UNDECIDED\ —\ FORMAL\ CONTROLLER/CFO\ DECISION\ REQUIRED.}$$
  The ₹5,00,000 threshold value remains **strictly illustrative** unless formally approved.
- **Neutral Comparison of Candidate Bases:**
  1. *Candidate Base 1: Gross Payroll Run Total:* High volume escalation; captures gross liability but does not scale well across growing organizations.
  2. *Candidate Base 2: Net Payroll Disbursement Total:* Directly monitors cash outflow; leaves tax withholdings un-escalated.
  3. *Candidate Base 3: Absolute Discrepancy / Variance Amount ($|\Delta|$):* Efficiently targets high-risk anomalous runs while allowing routine matching cycles to proceed without CFO bottleneck.
  4. *Candidate Base 4: Net Adjustment Ledger Amount:* Evaluates post-hoc correction impact; requires adjustment ledger runtime.
- **Governance Requirement:** Joint resolution by Corporate Controller and Chief Financial Officer. Engineering has not chosen or recommended a basis.
- **Readiness Classification:** `READY_FOR_STAKEHOLDER_REVIEW` (Neutral decision paper prepared; executive voting pending).

### 4.5 DEC-D-04: Technical Approval of 36-Column Adjustment Schema
- **Decision Question:** Shall the 36-column `payroll_adjustments` schema design be ratified for implementation post-Gate 1?
- **Technical Context:** The table exists in `prisma/schema.prisma` and SQLite `prisma/dev.db` with **0 rows**.
- **Architectural Rules:** BigInt arbitrary-precision integer paise (`BigInt` columns) represent the authoritative calculation standard; float columns are strictly read-only display mirrors.
- **Deferred Child Model:** The current schema captures run-level adjustments; itemized employee-level adjustments (`PayrollAdjustmentItem`) remain a deferred architectural requirement.
- **Governance Requirement:** Ratification by Lead Systems Architect and Corporate Controller before writing runtime adjustment services.
- **Readiness Classification:** `READY_FOR_STAKEHOLDER_REVIEW` (Technical schema review complete).

### 4.6 DEC-E-04: Official Chart of Accounts Verification
- **Decision Question:** How shall corporate General Ledger accounts be authorized for payroll export?
- **Mandatory Evidentiary Finding:**
  $$\mathbf{EXTERNAL\ EVIDENCE\ NOT\ AVAILABLE\ IN\ THE\ INSPECTED\ PROJECT\ REPOSITORY\ —\ INDEPENDENT\ EXTERNAL\ VALIDATION\ PENDING.}$$
- **Current Deficit:** Proposed account codes (`GL-6100` Payroll Expense, `GL-2100` Net Salaries Payable, `GL-2105` Tax Withholdings Payable) are unverified technical examples.
- **Governance Requirement:** Corporate Controller must provide the official, authorized corporate Chart of Accounts extracted from the active ERP system.
- **Readiness Classification:** `EVIDENCE_PENDING` (Blocked pending provision of official corporate COA).

### 4.7 DEC-E-05: Treasury Settlement Matching Model
- **Decision Question:** What model shall govern corporate treasury disbursement verification?
- **Mandatory Evidentiary Finding:**
  $$\mathbf{EXTERNAL\ EVIDENCE\ NOT\ AVAILABLE\ IN\ THE\ INSPECTED\ PROJECT\ REPOSITORY\ —\ INDEPENDENT\ EXTERNAL\ VALIDATION\ PENDING.}$$
- **Architectural Standard:** Stored `'PAID'` flag in `payroll_runs` does **NOT** establish bank settlement.
- **Proposed Target Model:** Hybrid settlement model matching consolidated statement batch debits against individual beneficiary credit UTRs.
- **Governance Requirement:** Formal review and sign-off by Corporate Treasurer.
- **Readiness Classification:** `EVIDENCE_PENDING` (Blocked pending Treasury model sign-off and statement provision).

---

## 5. Master Decision Register Summary Dashboard

```
+---------------------------------------------------------------------------------------------------+
|                                 MASTER DECISION REGISTER STATUS DASHBOARD                         |
+---------------------------------------------------------------------------------------------------+
|  Total Master Decisions Evaluated:              18 Decisions                                      |
|  Formally Approved Decisions:                    0 Decisions (  0.0% )                            |
|  Pending Stakeholder Review / Voting:           18 Decisions ( 100.0% )                           |
|                                                                                                   |
|  Decisions Ready for Immediate Stakeholder Vote: 14 Decisions ( 77.8% )                           |
|  Decisions Blocked Pending External Evidence:     4 Decisions ( 22.2% )                           |
|    - DEC-A-02 (HR Status Master Source)                                                           |
|    - DEC-E-04 (Corporate Chart of Accounts)                                                      |
|    - DEC-E-05 (Treasury Settlement Model & Bank Statements)                                       |
|    - DEC-E-02 (Statutory Remittance Evidence Receipts)                                           |
+---------------------------------------------------------------------------------------------------+
```

---

## 6. Audit Conclusion & Gate 1 Guard

- **Audit Determination:** All 18 master decisions are completely documented, structured, and cross-referenced. However, **zero decisions have received formal human stakeholder approval**.
- **Prerequisite Impact:** Gate 1 cannot unlock while decisions `DEC-A-01` through `DEC-E-05` remain unratified.
- **Gate 1 Status:** `GATE 1 LOCKED — FINANCIAL EXECUTION NOT AUTHORIZED.`

---

*End of Day 11 Gate 1 Master Decision Register Audit.*

