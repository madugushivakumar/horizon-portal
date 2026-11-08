# DAY 11 — GATE 1: FORMAL STAKEHOLDER APPROVAL PACKAGE
## Aura Workforce by Growmar — Horizon Portal
### Phase 3 — Teams and Insight | Day 11: Admin Payroll Run Console
### Gate 1 Governance Approval and Readiness Phase

---

## Document Metadata

| Attribute | Specification |
|---|---|
| **Document ID** | `DAY11-GATE1-FORMAL-STAKEHOLDER-APPROVAL-PACKAGE` |
| **Document Title** | Formal Executive Stakeholder Approval Submission Package for Governance Gate 1 |
| **Project & Phase** | Aura Workforce by Growmar — Horizon Portal / Phase 3 — Day 11 |
| **Governing Baseline** | Stage 1 (Rev 2.1), Stage 2 Forensic Audit, Stage 3 Amended Governance Policies A–E, Stage 4A Design |
| **Submission Mode** | Official Stakeholder Submission Package (Strictly Read-Only) |
| **Template Rule** | All templates strictly labeled `TEMPLATE — REQUIRES ACTUAL AUTHORIZED STAKEHOLDER COMPLETION` |
| **Signatures / Names** | Zero pre-populated names, dates, or signatures |
| **Gate 1 Status** | **`GATE 1: LOCKED — FINANCIAL EXECUTION NOT AUTHORIZED`** |
| **Stage 4B Status** | **`STAGE 4B: NOT AUTHORIZED`** |
| **Date of Transmission** | November 7, 2026 |

---

## 1. Executive Summary

This Formal Stakeholder Approval Package is officially submitted to the executive leadership of Growmar and Aura Workforce to facilitate the formal governance review, deliberation, and voting required to satisfy Governance Gate 1.

Technical teams have completed exhaustive forensic investigations (Stage 1 & 2), established corporate governance policies (Stage 3), audited application controls, reconciled parallel services, designed a 15-step historical exception workflow, and established an exhaustive test strategy (Stage 4A).

**However, engineering cannot approve financial policies or authorize Gate 1.**  
This package provides executive stakeholders with the neutral decision papers, evidentiary gap disclosures, and standardized approval voting templates required to execute formal corporate governance determinations.

---

## 2. Governance Background & Project Context

- **Subsystem Under Governance:** Day 11 Admin Payroll Run Console (`horizon-portal`).
- **Historical Scope:** Eighteen historical payroll runs spanning April 2025 through September 2026.
- **Core Challenge:** Six historical payroll runs (`PR-2026-04` through `PR-2026-09`) exhibit arithmetic variances between stored batch run headers and underlying itemized employee payslips, originating from upstream data pack truncation and timing artifacts prior to database seeding.
- **Governing Mandate:** In-place database overwrites and silent record modifications are strictly prohibited under statutory recordkeeping laws. All historical variances must be resolved via transparent, append-only adjustments and formal governance dispositions once Gate 1 is formally authorized.

---

## 3. Summary of Completed Stages 1 Through 4A

| Stage | Focus & Scope | Key Technical Deliverables Produced | Core Technical Determination |
|---|---|---|---|
| **Stage 1** | Source-of-Truth Investigation | `DAY11-POLICY-A-SOURCE-OF-TRUTH-DECISION.md` (Rev 2.1) | Established itemized payslips as the authoritative baseline for gross, deductions, and net pay. |
| **Stage 2** | Root-Cause Forensic Investigation | `DAY11-STAGE2-ROOT-CAUSE-FORENSIC-REPORT.md` | Forensically proved discrepancies originated in the upstream data pack prior to database ingestion; zero SQL corruption. |
| **Stage 3** | Governance Policy Framework | Policies A through E (Amended); Master Decision Register | Formulated 18 governance decisions and established 5-tier readiness framework. |
| **Stage 4A** | Read-Only Technical Assessment | 9 Technical Deliverables (Controls, Math, Exceptions, Gaps) | Audited 19 components; documented critical maker-checker bypass; designed 15-step disposition; verified baseline. |

---

## 4. Outstanding Governance Decisions (18 Decisions)

Corporate leadership must deliberate and vote on eighteen structured decisions across Policies A through E:
- **Policy A (Source of Truth):** Decisions `DEC-A-01` (Payslip Authority), `DEC-A-02` (HR Eligibility Source), `DEC-A-03` (Header Snapshot Classification), `DEC-A-04` (Append-Only Resolution).
- **Policy B (Reconciliation & Variance):** Decisions `DEC-B-01` (Dimension-Specific Tolerances), `DEC-B-02` (Mandatory Approval Block on Mismatch).
- **Policy C (Approval & Maker-Checker):** Decisions `DEC-C-01` (Segregation of Duties), `DEC-C-02` (Monetary Approval Threshold Basis), `DEC-C-03` (Pre-Approval Lifecycle Progression).
- **Policy D (Historical Preservation):** Decisions `DEC-D-01` (Append-Only Adjustment Model), `DEC-D-02` (Pre-Gate 1 Read-Only Display), `DEC-D-03` (Compensating Reversal Protocol), `DEC-D-04` (Technical Ratification of 36-Column Schema).
- **Policy E (Audit Evidence & Settlement):** Decisions `DEC-E-01` (Tripartite Evidence Mandate), `DEC-E-02` (Public Disclosure of Historical Gaps), `DEC-E-03` (Merkle Hash Chaining on Audit Logs), `DEC-E-04` (Corporate Chart of Accounts Verification), `DEC-E-05` (Treasury Hybrid Matching Model).

---

## 5. Critical Maker-Checker Security Finding

$$\mathbf{CRITICAL\ CONTROL\ GAP\ —\ HISTORICAL\ MAKER-CHECKER\ BYPASS\ POSSIBLE\ WHEN\ preparerId\ IS\ NULL}$$

- **Vulnerability Description:** In `src/app/api/v1/payroll/runs/[runId]/approve/route.ts#L90-L104`, the validation `if (run.preparerId)` skips maker-checker enforcement whenever `preparerId` is null.
- **Affected Population:** All 18 historical payroll runs in `prisma/dev.db` have `preparer_id = NULL`.
- **Governance Finding:** Holding an `ADMIN` or `HR` role does **NOT** establish maker-checker separation. The existing approval API must **NOT** be considered safe for historical run approval based solely on role checks and reconciliation checks.
- **Proposed Remediation:** Post-Gate 1 implementation of a fail-closed validation strategy requiring non-null preparer attribution, enforcing distinct actor identities, and adding database-level triggers.

---

## 6. Reconciliation Sign-Convention Defect

$$\mathbf{RECONCILIATION\ CONSISTENCY\ DEFECT\ —\ OPPOSITE\ VARIANCE\ SIGN\ CONVENTIONS}$$

- **Finding:** The application maintains two parallel calculation services with conflicting sign conventions:
  - `reconciliation-engine.ts`: $\text{Variance} = \text{Itemized Total} - \text{Stored Header}$ (Negative delta when header exceeds vouchers).
  - `reconciliation-service.ts`: $\text{grossDiffPaise} = \text{Stored Header} - \text{Itemized Total}$ (Positive delta when header exceeds vouchers).
- **Impact:** Discrepancy causes sign inversion across APIs, UI badges, and summary reports.
- **Governance Action Required:** Corporate Controller must formally adopt `reconciliation-engine.ts` (BigInt integer paise) as the unified calculation authority for post-Gate 1 consolidation.

---

## 7. External Evidence Limitations & Repository Status

$$\mathbf{EXTERNAL\ EVIDENCE\ NOT\ AVAILABLE\ IN\ THE\ INSPECTED\ PROJECT\ REPOSITORY\ —\ INDEPENDENT\ EXTERNAL\ VALIDATION\ PENDING.}$$

- **Repository Audit Finding:** Physical inspection of the repository confirms zero General Ledger trial balances, corporate bank statement debits, beneficiary credit UTR clearing manifests, or statutory tax challans exist in the project files.
- **Governing Rule:** Repository absence does not prove non-existence in external enterprise ERP, commercial banking portals, or government databases; however, no third-party validation has been demonstrated by project materials.
- **Stored `'PAID'` Flag:** Storing the text string `'PAID'` in `payroll_runs` does **NOT** establish bank settlement.
- **Blocking Status:** Missing external evidence remains an active blocking dependency for final settlement certification.

---

## 8. Historical Payroll Exception & Disposition Proposal

- **Workflow Status:** Fully specified 15-step workflow designed; implementation strictly blocked pending Gate 1.
- **Candidate Statuses:** All 9 candidate statuses are strictly **`PROPOSED — PENDING FORMAL GOVERNANCE APPROVAL`**.
- **Approving Authority:** Formally designated as **`AUTHORITY NOT YET APPROVED — GOVERNANCE DECISION REQUIRED`**.
- **Inviolable Governance Safeguards:** A historical disposition is a qualified governance classification; it does **NOT** constitute financial approval, cash disbursement, GL posting, or settlement certification, and can **NEVER** convert an original `MISMATCH` into a `MATCH`.
  - *`HISTORICAL_PAID_RECONCILED`:* Must NOT imply verified bank settlement, verified GL posting, or statutory compliance.
  - *`HISTORICAL_PAID_UNRESOLVED_DISCREPANCY`:* Original mismatch and unresolved variance must remain visible and preserved.

---

## 9. Monetary Threshold Decision Paper (`DEC-C-02`)

$$\mathbf{DEC-C-02\ —\ MONETARY\ THRESHOLD\ BASIS\ UNDECIDED\ —\ FORMAL\ CONTROLLER/CFO\ DECISION\ REQUIRED.}$$
$$\mathbf{The\ ₹5,00,000\ threshold\ value\ remains\ STRICTLY\ ILLUSTRATIVE\ unless\ formally\ approved.}$$

Stakeholders must evaluate and select from the following candidate measurement bases:
1. **Candidate Base 1 (Gross Total):** Evaluates total wage liability; escalates 100% of historical runs.
2. **Candidate Base 2 (Net Disbursement):** Evaluates actual liquid cash outflow; escalates 100% of historical runs.
3. **Candidate Base 3 (Absolute Variance $|\Delta|$):** Evaluates arithmetic defect magnitude; escalates only anomalous cycles ($\ge ₹5\text{L}$ delta).
4. **Candidate Base 4 (Adjustment Ledger Net Delta):** Evaluates post-hoc correction impact.
5. **Candidate Base 5 (Multi-Factor Composite):** Combines gross run total with variance delta limits.

---

## 10. Official Chart of Accounts Request Specification (`DEC-E-04`)

To support General Ledger journal export post-Gate 1, the Corporate Controller must supply:
1. Certified ERP Chart of Accounts extract (SAP/Oracle/NetSuite).
2. Official account codes for:
   - Gross Payroll Wage Expense (Debit)
   - Net Salaries Payable Clearing Account (Credit)
   - Statutory Provident Fund Liability (Credit)
   - Employee State Insurance Liability (Credit)
   - Tax Deducted at Source (TDS) Withholding Liability (Credit)
   - Payroll Adjustment Suspense Account (Debit/Credit)

---

## 11. Treasury Settlement Methodology Review Request (`DEC-E-05`)

The Corporate Treasurer must review and ratify:
1. **Hybrid Settlement Architecture:** Statement batch debit tie-out matching individual beneficiary credit UTRs.
2. **Bank Statement Feed:** Provision of official bank statement PDF/CSV files showing consolidated debits.
3. **Clearing Manifests:** Ingestion of RBI UTR clearing manifests confirming credit to employee bank accounts.

---

## 12. Statutory Remittance Evidence Request Specification

The Head of Tax Operations must review and supply:
1. **EPFO Verification:** Monthly ECR receipts with Temporary Return Reference Numbers (TRRN).
2. **ESIC Verification:** Monthly contribution receipts with Challan Reference Numbers (CPIN).
3. **TDS Verification:** Quarterly Form 24Q filing tokens and monthly ITNS 281 challans with BSR code and CIN.

---

## 13. Policy Approval Matrix (Policies A Through E)

> [!NOTE]
> **QUORUM CLASSIFICATION:**  
> The quorum rules tabulated below represent a **`PROPOSED QUORUM REQUIREMENT — FORMAL CORPORATE AUTHORITY NOT YET VERIFIED`**. Authorized corporate stakeholders must formally confirm or adopt the applicable voting thresholds through a valid governance instrument.

| Policy ID | Policy Title | Designated Approving Roles | Quorum Rule | Current Status |
|---|---|---|---|---|
| **POL-A** | Source-of-Truth Hierarchy Policy (Rev 2.1) | CFO, Controller, VP HR, Head of Audit | Proposed Unanimous (4 of 4) | `PENDING_REVIEW` |
| **POL-B** | Reconciliation & Variance Governance Policy | Controller, CFO, Head of Tax | Proposed Unanimous (3 of 3) | `PENDING_REVIEW` |
| **POL-C** | Payroll Approval & Maker-Checker Policy | VP HR, Controller, CFO, Head of Audit | Proposed Unanimous (4 of 4) | `PENDING_REVIEW` |
| **POL-D** | Historical Data Preservation Policy | Controller, CFO, Head of Audit, Lead Arch | Proposed Unanimous (4 of 4) | `PENDING_REVIEW` |
| **POL-E** | Audit Evidence & Settlement Policy | CFO, Controller, Audit, Tax, Treasury | Proposed Unanimous (5 of 5) | `PENDING_REVIEW` |

---

## 14. Gate 1 Prerequisite Summary & Active Blockers

- **Total Prerequisites:** 20 Conditions
- **Satisfied Prerequisites:** 5 Conditions (25.0%) — Technical designs and schema reviews complete.
- **Partially Satisfied:** 1 Condition (5.0%) — Stakeholder roles identified; named individuals pending.
- **Active Blockers:** **14 Conditions (70.0%)** — All 14 represent corporate governance actions.

---

## 15. Decision & Approval Record Templates

> [!IMPORTANT]
> **TEMPLATE NOTICE:**  
> The following templates are provided for human stakeholder completion during formal governance sessions. They are **NOT** pre-populated with approvals, names, or dates.

### Template 15.1: Master Decision Determination Record
```
===========================================================================================
                     FORMAL MASTER DECISION DETERMINATION RECORD
===========================================================================================
TEMPLATE — REQUIRES ACTUAL AUTHORIZED STAKEHOLDER COMPLETION

Decision Identifier:       [ e.g., DEC-C-02 ]
Governing Policy:          [ e.g., Policy C — Payroll Approval & Maker-Checker ]
Decision Subject Title:    [ e.g., Monetary Approval Threshold Basis & Amount ]

Designated Authority:      [ Title of Required Corporate Authority ]
Acting Corporate Officer:  [ Printed Full Legal Name ]
Officer Corporate Title:   [ Official Corporate Designation ]
Department / Function:     [ Finance / HR / Internal Audit / Treasury / Tax ]

Determination:             [  ] APPROVED
                           [  ] APPROVED WITH CONDITIONS
                           [  ] REJECTED
                           [  ] DEFERRED PENDING ADDITIONAL EVIDENCE

Mandatory Details / Basis: [ Document exact decision, selected basis, and threshold value ]

Conditions / Directives:   [ Document any operational or technical conditions imposed ]

Formal Signature:          __________________________________________________
Date of Execution:         YYYY-MM-DD
Tamper-Evident Token Ref:  [ Formal Verification Token / Document ID ]
===========================================================================================
```

### Template 15.2: Policy Ratification Record
```
===========================================================================================
                        FORMAL POLICY RATIFICATION RECORD
===========================================================================================
TEMPLATE — REQUIRES ACTUAL AUTHORIZED STAKEHOLDER COMPLETION

Policy Identifier:         [ POL-A / POL-B / POL-C / POL-D / POL-E ]
Policy Revision Baseline:  [ e.g., Revision 2.1 — Amended ]
Effective Fiscal Period:   [ e.g., FY2026-Q3 onward ]

Approving Stakeholder Signatures (PROPOSED QUORUM REQUIREMENT — FORMAL CORPORATE AUTHORITY NOT YET VERIFIED):

1. Chief Financial Officer:
   Name: __________________________ Signature: __________________________ Date: _________

2. Corporate Controller:
   Name: __________________________ Signature: __________________________ Date: _________

3. VP of Human Resources:
   Name: __________________________ Signature: __________________________ Date: _________

4. Head of Internal Audit:
   Name: __________________________ Signature: __________________________ Date: _________

5. Corporate Treasurer / Head of Tax (if applicable):
   Name: __________________________ Signature: __________________________ Date: _________
===========================================================================================
```

---

## 16. Template 16: Executive Governance Gate 1 Unlocking Authorization (Unpopulated)

> [!IMPORTANT]
> **TEMPLATE NOTICE & GOVERNANCE RESTRICTION:**  
> A completed template is **NOT** equivalent to authorization. Only a valid decision by appropriately authorized corporate officers, supported by required external evidence and satisfaction of all unlocking conditions, can authorize Gate 1 progression. This template must remain unpopulated until formal convening of executive leadership. Zero stakeholder names, signatures, or approval tokens have been fabricated.

```
===========================================================================================
               TEMPLATE 16: EXECUTIVE GOVERNANCE GATE 1 UNLOCKING AUTHORIZATION
===========================================================================================
TEMPLATE — REQUIRES ACTUAL AUTHORIZED STAKEHOLDER COMPLETION

1. AUTHORIZATION METADATA:
   Warrant Identifier:         [ e.g., WAR-G1-2026-01 ]
   Execution Date & Time:      YYYY-MM-DD HH:MM:SS [Timezone: IST / UTC]
   Governance Phase:           Post Stage 4A -> Gate 1 Unlocking Transition
   Target Phase Authorized:    Stage 4B Technical Implementation (Conditional)

2. GOVERNANCE DECISION RATIFICATION:
   Master Decisions Covered:   DEC-A-01 through DEC-E-05 (All 18 Decisions)
   Policy Baseline Ratified:   Policies A, B, C, D, and E (Stage 3 Rev 2.1 Amended)
   Specific Decision Overrides:[ Document any conditional decision approvals ]
   Outcome Code:               [  ] UNCONDITIONALLY APPROVED
                               [  ] APPROVED WITH CONDITIONS (Document below)
                               [  ] REJECTED (Gate 1 Remains Locked)
                               [  ] DEFERRED PENDING EXTERNAL EVIDENCE

3. SUPPORTING EVIDENCE REFERENCES & TOKEN HASHES:
   General Ledger Evidence:    [ ERP COA Ref: _________ | Trial Balance SHA256: _________ ]
   Bank Settlement Evidence:   [ Bank Statement Ref: ____ | Clearing UTR Count: _________ ]
   Statutory Tax Evidence:     [ EPFO TRRN Ref: ________ | ESIC CPIN Ref: ______________ ]
   Audit Committee Sign-Off:   [ Concurrence Letter Ref: COND-16 / Dated: ______________ ]

4. ACTIVE PREREQUISITE CLEARANCE VERIFICATION:
   Condition 8 (20 Prerequisites): [  ] All 14 Blocking Conditions Verified Cleared
   Condition 9 (Zero DB Drift):   [  ] dev.db SHA-256 Verified: B88E178B1B...
   Outstanding Conditions (if any):[ Document any residual non-blocking covenants ]

5. EXPLICIT SCOPE OF AUTHORIZATION:
   Stage 4B Development:       [  ] AUTHORIZED (Subject to Conditions Below)
   Authorized Phases:          [  ] Phase 4B-1: Core Calculation Engine & Audit Chaining
                               [  ] Phase 4B-2: Adjustment Ledger & Maker-Checker Hardening
                               [  ] Phase 4B-3: Multi-Tier Approval & Historical Exception
                               [  ] Phase 4B-4: External Evidence Ingestion
                               [  ] Phase 4B-5: UI Console Upgrades & Compliance Export
   Financial Execution:        [  ] STRICTLY PROHIBITED until Phase 4B-5 acceptance
   Live Cash Disbursement:     [  ] STRICTLY PROHIBITED (Horizon Portal is non-disbursing)

6. OPERATIONAL RESTRICTIONS & EMERGENCY RE-LOCK TRIGGERS:
   Mandatory Restrictions:     - Destructive DB commands (migrate reset, push --force-reset) PROHIBITED.
                               - Maker-checker fail-closed trigger MUST be verified in SQLite.
                               - Merkle hash chaining on audit_logs MUST be maintained.
   Emergency Re-lock Triggers:  Any breach of Section 5 of the Unlocking Protocol immediately
                               revokes this warrant and re-locks Gate 1.

7. AUTHORIZED STAKEHOLDER SIGN-OFF (PROPOSED QUORUM REQUIREMENT — FORMAL CORPORATE AUTHORITY NOT YET VERIFIED):

   Chief Financial Officer (EXEC-CFO):
   Legal Authority Basis: Corporate Financial Delegation of Authority, Section 2.1
   Printed Name: _________________________________
   Signature:    _________________________________ Date: ____________ Time: ________
   Digital Verification Token Ref: [ SHA-256 Hash of Signed Master Decision Package ]

   Corporate Controller (FIN-CTRL):
   Legal Authority Basis: Financial Reporting & Accounting Policy Governance, Section 4.3
   Printed Name: _________________________________
   Signature:    _________________________________ Date: ____________ Time: ________
   Digital Verification Token Ref: [ SHA-256 Hash of Approved Chart of Accounts ]

   Vice President of Human Resources (HR-VPHR):
   Legal Authority Basis: Human Resources Delegation & Workforce Governance, Section 3.1
   Printed Name: _________________________________
   Signature:    _________________________________ Date: ____________ Time: ________
   Digital Verification Token Ref: [ SHA-256 Hash of HR Master Roster Authorization ]

   Head of Internal Audit & Compliance (AUD-HEAD):
   Legal Authority Basis: Audit Charter & Internal Financial Controls Oversight, Section 1.4
   Printed Name: _________________________________
   Signature:    _________________________________ Date: ____________ Time: ________
   Digital Verification Token Ref: [ SHA-256 Hash of Audit Committee Sign-Off Letter ]
===========================================================================================
```

---

## 17. Formal Gate 1 Unlocking Criteria & Guard

- **Gate 1 Unlocking Standard:** Gate 1 can only transition from `LOCKED` to `UNLOCKED` upon receipt of verified, tamper-evident approval tokens satisfying all 14 active blocking conditions and signed by all four designated executive officers.
- **Current Status:** `GATE 1 LOCKED — FINANCIAL EXECUTION NOT AUTHORIZED.`

---

*End of Day 11 Gate 1 Formal Stakeholder Approval Package.*

