# DAY 11 — STAGE 3: GOVERNANCE APPROVAL PACKAGE (AMENDED)
## Aura Workforce by Growmar — Horizon Portal
### Phase 3 — Teams and Insight | Day 11: Admin Payroll Run Console
### Stage 3 of 6: Formal Payroll Governance Package

---

## Document Metadata

| Attribute | Specification |
|---|---|
| **Document ID** | `DAY11-STAGE3-GOVERNANCE-APPROVAL-PACKAGE` |
| **Document Title** | Executive Payroll Governance Review & Stakeholder Decision Package |
| **Governing Baseline** | Stage 1 Revision 2.1 (`DAY11-POLICY-A-SOURCE-OF-TRUTH-DECISION.md`) & Stage 2 Forensic Report (`DAY11-STAGE2-ROOT-CAUSE-FORENSIC-REPORT.md`) |
| **Supporting Artifacts** | [`docs/DAY11-STAGE3-FIVE-ISSUE-CORRECTION-REGISTER.md`](file:///c:/Users/Madugu%20Shiva%20Kumar/OneDrive/图片/Desktop/horizon-portal/docs/DAY11-STAGE3-FIVE-ISSUE-CORRECTION-REGISTER.md)<br>[`docs/DAY11-STAGE3-CROSS-POLICY-CONTRADICTION-AND-CONSISTENCY-AUDIT.md`](file:///c:/Users/Madugu%20Shiva%20Kumar/OneDrive/图片/Desktop/horizon-portal/docs/DAY11-STAGE3-CROSS-POLICY-CONTRADICTION-AND-CONSISTENCY-AUDIT.md) |
| **Status** | `PROPOSED — APPROVAL PENDING` |
| **Governance Gate** | Gate 1 Locked (`GATE 1: LOCKED — FINANCIAL EXECUTION NOT AUTHORIZED`) |
| **Target Approvers** | Chief Financial Officer, Corporate Controller, VP of Human Resources, Head of Internal Audit, Corporate Treasurer, Head of Tax Operations |
| **Submission Date** | November 7, 2026 |

---

## 1. Executive Submission Memo

**MEMORANDUM**

**TO:** Executive Leadership & Corporate Governance Committee  
- Chief Financial Officer (CFO)  
- Corporate Controller  
- Vice President of Human Resources  
- Head of Internal Audit & Compliance  
- Corporate Treasurer  
- Head of Tax Operations  

**FROM:** Senior Payroll Systems Architecture, Data Audit & Technical Governance Team  
**DATE:** November 7, 2026  
**SUBJECT:** Formal Presentation of Day 11 Stage 3 Payroll Governance Package & Master Decision Register (Amended)

### 1.1 Executive Context & Historical Background
During the Stage 1 Source-of-Truth Investigation and Stage 2 Root-Cause Forensic Audit of the Aura Workforce Horizon Portal, a comprehensive examination of all 18 payroll runs and 2,469 payslips identified discrepancies in six historical monthly payroll runs (`PR-2026-04` through `PR-2026-09`). 

The technical origin of these discrepancies was conclusively traced upstream to the original data pack files (`payroll_runs.json` vs. `payslips.json`). In these runs, stored run headers diverge from the mathematical sum of their underlying itemized payslips by varying amounts (ranging from -₹8,12,056 to +₹1,00,000 net pay) and headcount deltas (ranging from -13 to +1 employee).

Crucially, the Stage 2 investigation confirmed that:
1. The underlying itemized payslips are mathematically balanced with zero internal residual ($\text{Gross} - \text{Deductions} = \text{Net}$ holds true across all 2,469 payslips).
2. The discrepancies were inherited at seed ingestion and do not represent database corruption or application calculation runtime faults.
3. Live database tables (`dev.db`) have been maintained under strict read-only preservation with zero mutations.
4. **Governance Gate 1 remains firmly LOCKED.** No financial adjustments, balance updates, or ledger true-ups have been executed or authorized.

### 1.2 Purpose of this Stage 3 Submission (Amended)
Following independent review, five mandatory policy-quality issues were identified and resolved:
- **Policy A:** Established 6 population definitions and mandated approved employee-status sources with effective dates for headcount authority.
- **Policy B:** Established 9 distinct reconciliation dimensions (A..I) with dimension-specific tolerances and 9 standardized classifications.
- **Policy C:** Evaluated 6 candidate threshold measurement bases; qualified ₹5,00,000 as an illustrative proposal with basis undecided.
- **Policy D:** Performed field-by-field review of the 36-column adjustment schema; documented BigInt paise calculation authority vs float view helper.
- **Policy E:** Formally classified proposed GL codes as `PROPOSED_EXAMPLE_ONLY`; qualified 100% UTR matching against bulk batch processing reality.

### 1.3 Consequences of Stakeholder Action
- **If Approved:** Formal stakeholder ratification unlocks the subsequent Gate 1 readiness review, enabling Stage 4 technical implementation.
- **If Not Approved / Pending:** Gate 1 remains unconditionally LOCKED. All historical records remain frozen in their original data pack state, and zero financial modifications will occur.

---

## 2. Proposed Stakeholder Approval Roles & Responsibilities

| Governance Role Code | Functional Role Title | Governance Responsibilities & Authority Scope |
|---|---|---|
| **EXEC-CFO** | Chief Financial Officer | Ultimate authority over financial statement accuracy, statutory liability declarations, and authorization of Gate 1 unlocking. Approves Policy A, C, D, and E. |
| **FIN-CTRL** | Corporate Controller | Primary authority over General Ledger accounting standards, double-entry adjustment approval, and reconciliation tolerances. Approves Policy A, B, D, and E. |
| **HR-VPHR** | VP of Human Resources | Primary authority over employee population rosters, compensation contracts, leave approvals, and role definitions. Approves Policy A and C. |
| **AUD-HEAD** | Head of Internal Audit | Independent verification of controls, maker-checker segregation, audit log completeness, and compliance review. Approves Policy C, D, and E. |
| **TAX-HEAD** | Head of Tax Operations | Authority over statutory withholdings, EPFO ECR, ESIC challans, and Income Tax Form 24Q reporting. Approves Policy B and E. |
| **TREAS-MGR** | Corporate Treasurer | Authority over corporate bank clearing, payment gateway batching, settlement debits, and UTR validation. Approves Policy E. |
| **TECH-ARCH** | Lead Systems Architect | Technical verification of software constraints, Prisma schema integrity, and database immutability. Author of Technical Specifications. |

---

## 3. Master Decision Register (Decisions DEC-A-01 through DEC-E-05)

The table below presents the master decision register across all five policies. Every decision item contains its decision question, supporting evidence, recommendation, owner role, approval authority, status, dependencies, and Gate 1 impact:

| Decision ID | Policy | Decision Title & Question | Supporting Evidence | Governance Recommendation | Decision Owner | Approval Authority | Current Status | Dependencies | Gate 1 Impact |
|---|---|---|---|---|---|---|---|---|---|
| **DEC-A-01** | Policy A | **Realized Compensation Authority:** Shall itemized payslips be authoritative for gross, deductions, and net amounts? | Stage 2 zero-residual math proof (2,469 payslips) | Adopt itemized payslips as authoritative calculation baseline. | Lead Systems Architect | Controller & CFO | `PROPOSED — PENDING` | None | Mandatory prerequisite for Gate 1 unlocking. |
| **DEC-A-02** | Policy A | **Employee Eligibility & Headcount Authority:** Shall headcount authority be based on approved employee-status source with effective dates? | Analysis of 6 population concepts & data pack limitations | Adopt approved employee-status source; observed payslips cannot be treated as verified active workforce. | Lead Systems Architect | VP of Human Resources | `PROPOSED — PENDING` | HR Roster Definition | Mandatory prerequisite for Gate 1 unlocking. |
| **DEC-A-03** | Policy A | **Classification of Stored Run Headers:** Shall stored run headers be classified as historical informational snapshots? | Stage 1 & 2 forensic traceability of upstream data pack origin | Classify headers as legacy snapshots reflecting pre-reconciliation state. | Data Audit Specialist | Corporate Controller | `PROPOSED — PENDING` | DEC-A-01 | Unlocks append-only reconciliation modeling. |
| **DEC-A-04** | Policy A | **Resolution of Historical Discrepancies:** Shall historical variances be cured via append-only ledger entries rather than in-place overwrites? | Historical preservation principles & statutory recordkeeping laws | Resolve via append-only double-entry adjustments (Policy D). | Lead Systems Architect | Internal Audit & CFO | `PROPOSED — PENDING` | DEC-A-03, Policy D | Guarantees auditability of historical corrections. |
| **DEC-B-01** | Policy B | **Dimension-Specific Tolerance Framework:** Shall zero tolerance be restricted to exact internal arithmetic (Dims A/B/C) while external dimensions follow formal investigation? | Mathematical analysis of 9 dimensions & fractional paise rounding | Approve dimension-specific tolerance structure; no arbitrary rounding tolerances permitted. | Financial Controls Specialist | Corporate Controller | `PROPOSED — PENDING` | DEC-A-01 | Establishes reconciliation rules for Stage 4 engine. |
| **DEC-B-02** | Policy B | **Mandatory Approval-Blocking Rule:** Shall unresolved material variances hard-block progression to approval? | Internal audit risk analysis of unapproved variances | Mandate API and UI hard blocks on approval when reconciliation status $\ne$ `'MATCH'`. | Internal Audit Lead | Head of Internal Audit | `PROPOSED — PENDING` | DEC-B-01 | Enforces preventive automated controls. |
| **DEC-C-01** | Policy C | **Segregation of Duties:** Shall the system strictly enforce $\text{preparer\_id} \ne \text{approved\_by\_id}$ at API and DB layers? | Analysis of `src/app/api/.../approve/route.ts` & audit logs | Enforce strict maker-checker segregation; reject self-approval. | Enterprise Architect | Head of Audit & VP HR | `PROPOSED — PENDING` | None | Mandatory operational control for all payroll runs. |
| **DEC-C-02** | Policy C | **Monetary Threshold & Two-Tier Approval Basis:** What monetary threshold and measurement basis shall govern two-tier executive sign-off? | Codebase search (0 matches) & evaluation of 6 candidate bases | Proposed: ₹5,00,000 (Illustrative); Basis: **UNDECIDED**; Rationale: **PENDING STAKEHOLDER REVIEW**. | Financial Controls Specialist | Corporate Controller & CFO | `PROPOSED — PENDING` | DEC-C-01 | Required to configure Stage 4 approval escalation. |
| **DEC-C-03** | Policy C | **Pre-Approval Lifecycle Sequence:** Shall the system enforce linear state progression (`DRAFT` $\rightarrow$ `RECONCILING` $\rightarrow$ `RECONCILED` $\rightarrow$ `PENDING_APPROVAL`)? | State transition audit log analysis | Enforce strict linear lifecycle gating. | Lead Systems Architect | Corporate Controller | `PROPOSED — PENDING` | DEC-B-02 | Gating mechanism preventing premature approval. |
| **DEC-D-01** | Policy D | **Financial Adjustment Model:** Shall Mechanism 1 (Append-Only `payroll_adjustments`) be adopted as the sole financial adjustment model post-Gate 1? | Evaluation of 5 correction mechanisms in Schema Review | Adopt Mechanism 1 post-Gate 1; zero in-place SQL updates. | Lead Systems Architect | Corporate Controller & CFO | `PROPOSED — PENDING` | DEC-A-04 | Prerequisite for resolving the 6 historical runs. |
| **DEC-D-02** | Policy D | **Pre-Gate 1 Anomaly Presentation:** How shall historical variances be presented while Gate 1 is locked? | Read-only preservation requirements | Retain raw historical data untouched; present variances via Mechanism 5 (Annotations). | Data Audit Specialist | Chief Financial Officer | `PROPOSED — PENDING` | None | Governs current UI display in Stage 3. |
| **DEC-D-03** | Policy D | **Reversal & Revocation Protocol:** How shall approved adjustments be cancelled or revoked? | Double-entry accounting principles & auditability | Revoke via compensating reversal rows with inverse signs; zero SQL deletions. | Internal Audit Lead | Head of Internal Audit | `PROPOSED — PENDING` | DEC-D-01 | Governs post-posting error correction. |
| **DEC-D-04** | Policy D | **Technical Approval of 36-Field Schema:** Shall the 36-column `payroll_adjustments` schema design be ratified for implementation? | Field-by-field review of 36 columns & denormalization logic | Ratify 36-column schema; enforce BigInt paise as calculation authority; float as read-only. | Lead Systems Architect | Enterprise Architecture | `PROPOSED — PENDING` | DEC-D-01 | Authorizes Stage 4 database integration. |
| **DEC-E-01** | Policy E | **Tripartite Evidence Mandate:** Shall internal calculation math alone be deemed insufficient to declare a run reconciled without GL and Bank tie-out? | Forensic review of stored `'PAID'` flag vs. bank clearing | Adopt Tripartite Evidence Hierarchy; internal math alone cannot authorize `'RECONCILED'`. | Financial Controls Specialist | Chief Financial Officer | `PROPOSED — PENDING` | DEC-A-01 | Prevents premature certification of settlement. |
| **DEC-E-02** | Policy E | **Classification of Pre-Gate 1 Historical Evidence:** How shall missing external bank and tax records for historical runs be classified? | Inventory of repository (zero bank/tax files found) | Formally declare `BANK_SETTLEMENT_EVIDENCE_NOT_PROVIDED` and `STATUTORY_EVIDENCE_NOT_PROVIDED`. | Data Audit Specialist | Head of Internal Audit | `PROPOSED — PENDING` | None | Fully discloses historical compliance gaps. |
| **DEC-E-03** | Policy E | **Audit Log Schema Expansion:** Shall the `audit_logs` schema be expanded in Stage 4 to include entity keys and cryptographic hash chaining? | Forensic query of `audit_logs` (87 rows, 0 payroll rows) | Approve non-breaking migration adding `payroll_run_id`, `adjustment_id`, and hash chaining. | Lead Systems Architect | Lead Architect & Audit | `PROPOSED — PENDING` | Policy C, D | Enhances tamper-evidence under SOC 1 Type II. |
| **DEC-E-04** | Policy E | **Chart of Accounts Verification:** How shall corporate General Ledger accounts be authorized for payroll export? | Audit of proposed codes (`GL-6100` etc.) as unverified examples | Require Corporate Controller to supply verified corporate chart of accounts before Stage 4 GL export. | Financial Controls Specialist | Corporate Controller | `PROPOSED — PENDING` | None | Eliminates fictitious accounting codes. |
| **DEC-E-05** | Policy E | **Banking Settlement Matching Model:** What model shall govern corporate treasury disbursement verification? | Analysis of corporate bulk batch debits vs individual UTRs | Adopt hybrid settlement model (Batch Debit statement tie-out + Itemized beneficiary UTR verification). | Treasury Specialist | Corporate Treasurer | `PROPOSED — PENDING` | DEC-E-01 | Aligns verification with bulk payment reality. |

---

## 4. Master Policy Approval Register (Pending Sign-Off)

| Policy ID | Policy Document Title | Designated Approving Roles | Required Decision IDs | Approval State | Formal Approval Date | Cryptographic Verification Hash |
|---|---|---|---|---|---|---|
| **POL-A** | Source-of-Truth Hierarchy Policy (Rev 2.1 + Stage 3 Amd) | CFO, Controller, VP HR, Audit | DEC-A-01, DEC-A-02, DEC-A-03, DEC-A-04 | `PENDING_REVIEW` | *Pending* | *Pending* |
| **POL-B** | Reconciliation & Variance Governance Policy | Controller, CFO, Head of Tax | DEC-B-01, DEC-B-02 | `PENDING_REVIEW` | *Pending* | *Pending* |
| **POL-C** | Payroll Approval & Maker-Checker Policy | VP HR, Controller, CFO, Audit | DEC-C-01, DEC-C-02, DEC-C-03 | `PENDING_REVIEW` | *Pending* | *Pending* |
| **POL-D** | Historical Data Preservation Policy | Controller, CFO, Audit, Tech Arch | DEC-D-01, DEC-D-02, DEC-D-03, DEC-D-04 | `PENDING_REVIEW` | *Pending* | *Pending* |
| **POL-E** | Audit Evidence & Settlement Policy | CFO, Controller, Audit, Tax, Treasury | DEC-E-01, DEC-E-02, DEC-E-03, DEC-E-04, DEC-E-05 | `PENDING_REVIEW` | *Pending* | *Pending* |

---

## 5. Review Instructions & Voting Protocol for Stakeholders

Stakeholders must evaluate the amended governance package using the following standard determinations:
1. `APPROVE`: Unconditional approval of the policy and associated decisions as presented.
2. `APPROVE WITH CONDITIONS`: Approval granted subject to documented technical or operational prerequisites.
3. `REQUEST CLARIFICATION`: Review held open pending technical clarification from the Engineering Lead.
4. `REJECT`: Policy returned for architectural revision with documented objections.

---

*End of Day 11 Stage 3 Governance Approval Package (Amended).*
