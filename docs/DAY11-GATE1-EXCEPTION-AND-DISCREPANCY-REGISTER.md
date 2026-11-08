# DAY 11 — GATE 1 EXCEPTION AND DISCREPANCY REGISTER
## Aura Workforce by Growmar — Horizon Portal
### Phase 3 — Teams and Insight | Day 11: Admin Payroll Run Console
### Post Gate 1 Quality Control | Active Governance, Financial, Evidentiary & Technical Exception Register

---

## Document Metadata

| Attribute | Specification |
|---|---|
| **Document ID** | `DAY11-GATE1-EXCEPTION-AND-DISCREPANCY-REGISTER` |
| **Document Title** | Traceable Master Exception, Discrepancy & Deficiency Log |
| **Project & Phase** | Aura Workforce by Growmar — Horizon Portal / Phase 3 — Day 11 |
| **Governing Baseline** | Risk Register (`DAY11-GATE1-CONSOLIDATED-RISK-REGISTER.md`), Prerequisite Plan (`DAY11-GATE1-PREREQUISITE-TRACKING-PLAN.md`) |
| **Execution Mode** | Exception Auditing & Governance Tracking (Strictly Read-Only Documentation) |
| **Exception Scope** | Missing Evidence, GL Variances, Banking Gaps, Statutory Gaps, Quorum Gaps, Maker-Checker Vulnerability |
| **Closure Rule** | Never close an exception without documented, verifiable corporate evidence or implemented code fixes. |
| **Active Exceptions** | **12 Master Governance & Technical Exceptions (All 12 OPEN)** |
| **Gate 1 Status** | **`GATE 1: LOCKED — FINANCIAL EXECUTION NOT AUTHORIZED`** |
| **Stage 4B Status** | **`STAGE 4B: NOT AUTHORIZED`** |
| **Date of Execution** | November 8, 2026 |

---

## 1. Exception Management Framework & Severity Classifications

Every outstanding discrepancy, evidentiary gap, and governance deficiency is cataloged as a formal exception.

> [!IMPORTANT]
> **Executive Governance Principle:**
> `ALL 12 MASTER EXCEPTIONS REMAIN OPEN. THEIR GATE 1 BLOCKING CLASSIFICATION IS ASSESSED SEPARATELY AGAINST DOCUMENTED PREREQUISITE ACCEPTANCE CRITERIA. OPEN TECHNICAL RISK DOES NOT AUTOMATICALLY CONSTITUTE AN INDEPENDENT GATE 1 BLOCKER.`

### Gate 1 Impact Classifications:
- **`OPEN — DIRECT GATE 1 BLOCKER`**: A fundamental barrier or explicit condition precedent without which Gate 1 cannot legally or architecturally unlock (e.g., missing evidence intake, missing Audit Committee concurrence).
- **`OPEN — ASSOCIATED WITH A BLOCKING PREREQUISITE`**: Tied directly to an active blocking Gate 1 prerequisite requiring stakeholder determination, statutory filing, or security remediation.
- **`OPEN — TECHNICAL RISK; INDEPENDENT GATE 1 BLOCKING STATUS NOT ESTABLISHED`**: Outstanding technical debt, refactoring task, or proposed architecture enhancement that represents an open risk, but is not documented as an independent blocker in approved Gate 1 prerequisite criteria.
- **`OPEN — BLOCKING CLASSIFICATION REQUIRES GOVERNANCE DETERMINATION`**: Ambiguous requirement requiring formal committee ruling on whether it blocks Gate 1.

---

## 2. Active Master Exception Register (12 Master Exceptions)

```
========================================================================================================================
                                 MASTER GOVERNANCE & TECHNICAL EXCEPTION REGISTER
========================================================================================================================
```

| Exception ID | Description | Severity | Current Status | Gate 1 Classification | Related Prerequisite | Basis | Closure Condition | Authority Required |
|---|---|---|---|---|---|---|---|---|
| **EXC-SEC-01** | **Maker-Checker Vulnerability (`RSK-01`):** In `approve/route.ts#L90-104`, dual-control validation is bypassed if `run.preparerId` is null. 18 of 18 historical runs have `preparer_id = NULL`, allowing single-user approval. | `CRITICAL` | `OPEN` | `OPEN — ASSOCIATED WITH A BLOCKING PREREQUISITE` | `PRQ-06` | Documented in Stage 3 Policy C and Stage 4A Security Assessment | Deploy fail-closed server-side check and database trigger in Stage 4B rejecting approval if `preparer_id` is null or equals approver. | CFO & Internal Audit |
| **EXC-EVID-01** | **Fourteen Missing External Artifacts:** Zero external financial, banking, statutory, HR, or governance records have been supplied to repository. | `HIGH` | `OPEN` | `OPEN — DIRECT GATE 1 BLOCKER` | `PRQ-15`..`PRQ-18` | Mandated by Policy E and Gate 1 Unlocking Protocol | RECEIVE, AUTHENTICATE, REGISTER, AND COMPLETE THE REQUIRED SUBSTANTIVE VERIFICATION OF ALL APPLICABLE EXTERNAL EVIDENCE ARTIFACTS; DOCUMENT ACCEPTANCE AGAINST THE RELEVANT PREREQUISITES. | All Stakeholder Groups |
| **EXC-GL-01** | **General Ledger Variance Unverified:** External ERP trial balance and journal voucher evidence required. (Reconciled from previous unsupported ₹13.75 Lakh reference; true 6-run internal net variance between headers and itemized payslips is ₹90,14,717.87 per `DAY11-GL-VARIANCE-SCOPE-RECONCILIATION.md`). | `HIGH` | `OPEN` | `OPEN — ASSOCIATED WITH A BLOCKING PREREQUISITE` | `PRQ-15` | Policy E Pillar 1 accounting verification criteria | Ingest official ERP trial balances and journal vouchers; establish whether ERP posted header or payslip sums. | Corporate Controller |
| **EXC-BNK-01** | **Unverified Banking Settlement:** ₹26,70,69,563.37 (approx. ₹26.71 Cr) in historical net salary disbursements across 2,469 payslips lack commercial bank statements and beneficiary clearing UTRs (reconciled from draft ₹10.36 Cr per `DAY11-PAYROLL-NET-FIGURE-SCOPE-RECONCILIATION.md`). | `HIGH` | `OPEN` | `OPEN — ASSOCIATED WITH A BLOCKING PREREQUISITE` | `PRQ-18` | Policy E Pillar 2 banking verification criteria | Supply bank debit statements, 2,469 beneficiary clearing UTRs, and bounced payment logs. | Corporate Treasurer |
| **EXC-TAX-01** | **Unverified Tax & PF Remittances:** Deductions for EPFO, ESIC, and Section 192 TDS across 2,469 payslips lack government challans and TRRN receipts. | `HIGH` | `OPEN` | `OPEN — ASSOCIATED WITH A BLOCKING PREREQUISITE` | `PRQ-16` | Policy E Pillar 3 statutory tax verification criteria | Supply official EPFO ECR/TRRN receipts, ESIC CPIN challans, and Form 24Q provisional receipts with ITNS 281 challans. | Head of Tax Operations |
| **EXC-HR-01** | **Point-in-Time Status Discrepancies:** Aug 2026 (20 missing slips) and Sep 2026 (13 missing slips) lack authoritative HRMS termination logs and cutoff rules. | `HIGH` | `OPEN` | `OPEN — ASSOCIATED WITH A BLOCKING PREREQUISITE` | `PRQ-10` | Policy A employee-status source mandate | Issue formal HR status directive confirming employee offboarding dates and primary master roster. | VP of Human Resources |
| **EXC-GOV-01** | **Unverified Quorum Authority:** Inspected repository lacks corporate charter or board resolution establishing a 4-officer unanimous quorum rule. | `HIGH` | `OPEN` | `OPEN — ASSOCIATED WITH A BLOCKING PREREQUISITE` | `PRQ-19` | Corporate Governance legal authority requirement | Execute Template 3 declaring the legally binding corporate quorum and voting threshold. | Corporate Governance Committee |
| **EXC-GOV-02** | **Undecided Monetary Approval Threshold:** Basis and numeric threshold for `DEC-C-02` remain undecided. ₹5,00,000 figure is strictly illustrative. | `HIGH` | `OPEN` | `OPEN — ASSOCIATED WITH A BLOCKING PREREQUISITE` | `PRQ-12` | Policy C multi-tier threshold governance | Execute joint determination paper (Template 1) establishing threshold base metric and binding ceiling. | Controller & CFO |
| **EXC-GOV-03** | **Unratified Governance Policies:** Policies A, B, C, D, and E remain unapproved proposed recommendations. | `HIGH` | `OPEN` | `OPEN — ASSOCIATED WITH A BLOCKING PREREQUISITE` | `PRQ-09`, `11`, `13`, `14`, `17` | Governance baseline ratification requirement | Convene executive deliberation session and execute Template 1 determination records for all policies. | Governance Committee & CFO |
| **EXC-AUD-01** | **Unissued Audit Committee Concurrence:** Independent Audit Committee has not reviewed Stage 1–4A findings or issued formal sign-off letter `COND-16`. | `HIGH` | `OPEN` | `OPEN — DIRECT GATE 1 BLOCKER` | `PRQ-20` | Mandatory Condition 16 of Gate 1 Unlocking Protocol | Convene Audit Committee review and issue formal concurrence letter on corporate letterhead. | Audit Committee Chair |
| **EXC-TECH-01** | **Dual Reconciliation Engine Implementation:** Workspace maintains both legacy `reconciliation-service.ts` and Stage 2 `reconciliation-engine.ts`. | `MEDIUM` | `OPEN` | `OPEN — TECHNICAL RISK; INDEPENDENT GATE 1 BLOCKING STATUS NOT ESTABLISHED` | `None` | Codebase architecture audit finding; no approved Gate 1 prerequisite explicitly mandates its remediation as a gate blocker. | PROPOSED REMEDIATION: Review and, if approved, deprecate the legacy reconciliation service and consolidate on the formally selected authoritative engine during a separately authorized implementation phase. No code change is authorized by this documentation review. | Systems Architect |
| **EXC-TECH-02** | **Merkle Hash Chaining Pending:** `audit_logs` table currently lacks `previous_hash` and `current_hash` columns for tamper-evident chaining. | `MEDIUM` | `OPEN` | `OPEN — TECHNICAL RISK; INDEPENDENT GATE 1 BLOCKING STATUS NOT ESTABLISHED` | `None` | Proposed architectural enhancement in Policy D / Stage 4A; standard logging present under `PRQ-04`; no approved Gate 1 prerequisite mandates Merkle chaining as a gate blocker. | PROPOSED REMEDIATION: Evaluate additive Merkle hash chaining as a future audit-integrity enhancement. Implementation may proceed only after a separate formal authorization, approved technical design, security review, acceptance criteria, and implementation approval. No Merkle hash chaining implementation is authorized by this review. Stage 4B remains NOT AUTHORIZED. | Database Engineer |

---

## 3. Exception Resolution Protocol

Under financial compliance rules, no exception may be closed without documented, verifiable corporate evidence:
1. **Security Exceptions (`EXC-SEC-01`):** Requires merged code changes in `src/`, automated penetration test verification, and test suite green pass.
2. **Evidentiary Exceptions (`EXC-EVID-01` to `EXC-HR-01`):** For `EXC-EVID-01`, closure requires the complete 8-step protocol: (1) Evidence received, (2) Evidence registered, (3) Chain of custody established, (4) Authenticity assessed, (5) Evidence completeness assessed, (6) Substantive verification completed, (7) Relevant prerequisite acceptance criteria assessed, and (8) Authorized reviewer determination recorded. Merely depositing files into `04_Evidence_Intake/` does not satisfy closure.
3. **Governance Exceptions (`EXC-GOV-01` to `EXC-GOV-03`, `EXC-AUD-01`):** Requires signed corporate records (Templates 1, 3, 5) with verified legal authority.
4. **Technical Exceptions (`EXC-TECH-01`, `EXC-TECH-02`):** Remediation is strictly proposed and requires separate formal authorization, approved technical design, and validation in an authorized implementation phase. No code change or Merkle hash chaining is authorized by this documentation review. Stage 4B remains strictly NOT AUTHORIZED.

---

## 4. Current Execution Finding

```
===========================================================================================
NO NEW STAKEHOLDER RESPONSES OR EXTERNAL EVIDENCE WERE PROVIDED FOR VERIFICATION
DURING THIS EXECUTION.
===========================================================================================
```

> [!IMPORTANT]
> **Exception Classification Finding:**
> `10 EXCEPTIONS ARE DIRECT GATE 1 BLOCKERS OR ARE ASSOCIATED WITH DOCUMENTED BLOCKING PREREQUISITES.`
> `2 EXCEPTIONS REMAIN OPEN TECHNICAL RISKS WHOSE INDEPENDENT GATE 1 BLOCKING STATUS IS NOT ESTABLISHED.`
> 
> **Prerequisite Independence Principle:**
> `Reclassification of an exception does not automatically change the Gate 1 prerequisite register.`
> `All 14 existing blocking prerequisites remain blocking. No prerequisite has been promoted, downgraded, or closed during this clarification.`

- **Total Open Exceptions:** 12.
- **Closed Exceptions:** 0.
- **Exceptions Associated with Blocking Prerequisites / Direct Blockers:** 10 (Critical / High: `EXC-SEC-01` to `EXC-AUD-01`).
- **Open Technical Risks (Independent Gate 1 Blocking Status Not Established):** 2 (Medium: `EXC-TECH-01`, `EXC-TECH-02`).
- **Gate 1 Status:** **`GATE 1: LOCKED — FINANCIAL EXECUTION NOT AUTHORIZED`**.
- **Stage 4B Status:** **`STAGE 4B: NOT AUTHORIZED`**.

