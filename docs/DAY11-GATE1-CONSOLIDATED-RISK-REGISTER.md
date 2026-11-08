# DAY 11 — GATE 1: CONSOLIDATED RISK REGISTER
## Aura Workforce by Growmar — Horizon Portal
### Phase 3 — Teams and Insight | Day 11: Admin Payroll Run Console
### Gate 1 Governance Approval and Readiness Phase

---

## Document Metadata

| Attribute | Specification |
|---|---|
| **Document ID** | `DAY11-GATE1-CONSOLIDATED-RISK-REGISTER` |
| **Document Title** | Consolidated Technical, Financial, Security & Governance Risk Register for Gate 1 |
| **Project & Phase** | Aura Workforce by Growmar — Horizon Portal / Phase 3 — Day 11 |
| **Governing Baseline** | Master Decision Register & Prerequisite Register (`docs/DAY11-GATE1-*`) |
| **Execution Mode** | Enterprise Risk Assessment (Strictly Read-Only) |
| **Total Risks Evaluated** | **14 Core Governance & Technical Risks** |
| **High / Critical Risks** | **8 Risks (Maker-Checker, Sign Conflict, External Evidence Gaps, Unapproved Models)**|
| **Gate 1 Status** | **`GATE 1: LOCKED — FINANCIAL EXECUTION NOT AUTHORIZED`** |
| **Stage 4B Status** | **`STAGE 4B: NOT AUTHORIZED`** |
| **Date of Execution** | November 7, 2026 |

---

## 1. Risk Assessment Methodology

To ensure objective evaluation without arbitrary scoring, this register utilizes a standard enterprise risk matrix based on **Qualitative Likelihood (Probability)** and **Operational Impact**:

```
+---------------------------------------------------------------------------------------------------+
|                                     RISK EVALUATION MATRIX                                        |
+---------------------------------------------------------------------------------------------------+
|  Probability Levels:    Low (Rare/Unlikely) | Medium (Possible) | High (Definite/Active Finding)  |
|  Impact Levels:         Low (Minor display) | Medium (Audit note)| High (Material/Statutory breach)|
|  Risk Classifications:  CRITICAL (High Prob + High Impact)                                        |
|                         HIGH (High Prob + Med Impact OR Med Prob + High Impact)                   |
|                         MEDIUM (Med Prob + Med Impact OR High Prob + Low Impact)                  |
|                         LOW (Low Prob + Low Impact)                                               |
+---------------------------------------------------------------------------------------------------+
```

---

## 2. Comprehensive 14-Point Risk Register

The table below evaluates each of the fourteen core risk areas across its technical, financial, and governance dimensions:

| Risk ID | Risk Description | Category | Existing Evidence in Codebase / Repo | Probability Assessment | Impact Assessment | Overall Risk Level | Existing Mitigation in Code | Proposed Post-Gate 1 Mitigation | Responsible Corporate Authority | Required Governance Decision | Objective Closure Evidence | Residual Risk |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **RSK-01** | **Historical Maker-Checker Bypass:** Null `preparerId` skips dual-control check in approval API. | Security / Segregation of Duties | `src/app/api/.../approve/route.ts#L90`; 18 of 18 runs in `dev.db` have `preparer_id = NULL`. | **HIGH** (Active code defect) | **HIGH** (Unilateral approval of payroll batches) | **CRITICAL** | Route checks caller holds `ADMIN` or `HR` role; blocks `PAID` (409) & `MISMATCH` (422). | Deploy fail-closed validation: reject approval if preparer missing; mandate distinct IDs; SQLite DB trigger. | Head of Internal Audit & VP HR | `DEC-C-01` | Automated security test passing with 0 null-bypass paths. | **LOW** |
| **RSK-02** | **Conflicting Sign Conventions:** Opposing delta formulas between parallel calculation services. | Calculation Integrity | `reconciliation-engine.ts` ($\text{Items} - \text{Header}$) vs `reconciliation-service.ts` ($\text{Header} - \text{Items}$). | **HIGH** (Active code discrepancy) | **HIGH** (Sign inversion across UI, APIs & reports) | **HIGH** | None; services run in parallel. Both preserved in Stage 4A. | Deprecate `reconciliation-service.ts`; unify platform on BigInt arbitrary-precision engine; 7-point regression suite. | Corporate Controller | `DEC-B-01` | Unit test suite passing all 7 variance sign scenarios. | **LOW** |
| **RSK-03** | **Missing External GL Evidence:** Zero General Ledger trial balances or journal postings in repository. | Financial Accounting | Static repo search: 0 ERP files, 0 GL tables. Mandatory wording applied. | **HIGH** (Evidence absent in repo) | **HIGH** (Inability to verify wage expense posting) | **HIGH** | Gate 1 is locked; financial execution blocked. | Deploy `PayrollGlEntry` model; ingest Controller-verified ERP trial balance vouchers. | Corporate Controller | `DEC-E-01`, `DEC-E-04` | Balanced double-entry journal tie-out with 0 paise residual. | **LOW** |
| **RSK-04** | **Missing Bank Settlement Evidence:** Zero corporate bank statement debits present in project files. | Treasury & Cash | Repository audit: 0 bank statements. Stored `'PAID'` flag is unverified. | **HIGH** (Evidence absent in repo) | **HIGH** (Disbursement unverified by third-party bank) | **HIGH** | Stored `'PAID'` flag is formally disqualified as proof of settlement. | Ingest corporate bank statement PDF/CSV; execute batch statement debit tie-out. | Corporate Treasurer | `DEC-E-01`, `DEC-E-05` | Verified bank statement debit matching payroll run total. | **LOW** |
| **RSK-05** | **Missing Beneficiary Credit UTRs:** Zero RBI UTR clearing records for employee bank accounts. | Treasury Settlement | Repository audit: 0 UTR numbers in database. | **HIGH** (Evidence absent in repo) | **HIGH** (Unverified employee receipt; wage theft risk) | **HIGH** | Gate 1 locked; zero settlement claims made. | Ingest payment gateway clearing manifests; match 100% of employees to UTRs or return logs. | Corporate Treasurer | `DEC-E-05` | 100% of employees matched to cleared UTR or documented bounce. | **LOW** |
| **RSK-06** | **Missing Statutory Remittance Receipts:** Zero government challan receipts (EPFO, ESIC, Form 24Q TDS). | Statutory Compliance | Static repo search: 0 challan PDFs or filing tokens. | **HIGH** (Evidence absent in repo) | **HIGH** (Statutory penalty & director liability) | **HIGH** | Gate 1 locked; no compliance claim asserted. | Ingest official receipts directly from government tax portals; verify TRRN/CPIN/CIN hashes. | Head of Tax Operations | `DEC-E-02` | Verified government challan receipts matching withholdings. | **LOW** |
| **RSK-07** | **Undecided Monetary Threshold Basis:** Absence of executive decision on ₹5,00,000 threshold basis. | Governance & Controls | Code search: 0 threshold checks. Matrix marks basis as `UNDECIDED`. | **HIGH** (Decision unvoted) | **MEDIUM** (High-value cycles bypass dual-tier review) | **HIGH** | Single-tier approval currently enforced on all runs. | Controller & CFO formally select measurement basis (Base 1–5) and ratify threshold amount. | Corporate Controller & CFO | `DEC-C-02` | Formally signed joint Controller/CFO decision record. | **LOW** |
| **RSK-08** | **Missing Employee-Status Authority:** Lack of effective-dated termination/status records in HR pack. | Data Integrity / HR | Headcount divergence (434 observed vs 441 master). Data pack lacks termination history. | **MEDIUM** (Data pack limitation) | **HIGH** (Phantom employees or missed eligible staff) | **HIGH** | Policy A Rev 2.1 establishes 6-population framework. | VP HR supplies official HRMS master extract with effective dates and termination logs. | VP of Human Resources | `DEC-A-02` | VP HR-certified employment status master roster. | **LOW** |
| **RSK-09** | **Unapproved Adjustment Ledger Runtime:** 36-column adjustment table exists with 0 rows; runtime unbuilt. | Architecture & Data | `dev.db` inspection: `payroll_adjustments` table exists with 0 rows. | **MEDIUM** (Schema exists; code unbuilt) | **MEDIUM** (Inability to process true-ups without SQL updates) | **MEDIUM** | Schema reviewed in Step 2A.1; zero financial adjustments executed. | Build `adjustment-service.ts`, CRUD APIs, and UI modal; enforce append-only immutability. | Lead Systems Architect | `DEC-D-01`, `DEC-D-04` | Automated integration test executing draft $\rightarrow$ approval lifecycle. | **LOW** |
| **RSK-10** | **Unverified GL Account Mapping:** Proposed account codes (`GL-6100` etc.) are unverified examples. | Financial Reporting | Technical documents classify codes as illustrative. | **MEDIUM** (Example codes unverified) | **MEDIUM** (Posting to fictitious accounts in ERP) | **MEDIUM** | Codes are explicitly labeled as examples; export service unbuilt. | Ingest Controller-signed Chart of Accounts extracted from active corporate ERP. | Corporate Controller | `DEC-E-04` | Controller-certified corporate Chart of Accounts mapping table. | **LOW** |
| **RSK-11** | **Unapproved Treasury Matching Model:** Bulk batch debit vs individual UTR model unratified by Treasurer. | Treasury Controls | Hybrid model documented in Stage 4A; Treasurer sign-off pending. | **MEDIUM** (Model unratified) | **MEDIUM** (Disagreement on clearinghouse tolerance) | **MEDIUM** | Gate 1 locked; zero banking integration code deployed. | Corporate Treasurer conducts formal technical review and signs off on matching rules. | Corporate Treasurer | `DEC-E-05` | Signed Treasury approval artifact ratifying matching rules. | **LOW** |
| **RSK-12** | **Historical Exception Authority Not Established:** Decision-maker for past variances unratified. | Legal / Governance | Authority marked as `AUTHORITY NOT YET APPROVED`. | **HIGH** (Authority unassigned) | **HIGH** (Unauthorized forgiving of historical variances) | **HIGH** | Standard approval API blocks all 18 historical runs (409/422). | Formal corporate governance resolution designating joint Controller/CFO authority. | Corporate Governance Comm. | `DEC-D-02`, POL-D/E | Corporate bylaw amendment or resolution designating authority. | **LOW** |
| **RSK-13** | **Audit Trail Immutability Gap:** Current `AuditLog` lacks Merkle hash chaining and entity FKs. | Compliance / Security | `dev.db` inspection: 87 rows; details stored as unstructured JSON; no hash chains. | **MEDIUM** (App-level read/append only) | **MEDIUM** (SQL-level tampering cannot be cryptographically proven) | **MEDIUM** | Application code lacks update/delete routes for `AuditLog`. | Execute additive Prisma migration adding `recordHash`, `parentHash`, and entity FK columns. | Lead Systems Architect | `DEC-E-03` | Automated tamper-detection test verifying hash chain validation. | **LOW** |
| **RSK-14** | **Gate 1 Multi-Stakeholder Dependencies:** 14 active blocking conditions require 4 corporate officers. | Governance Schedule | Gate 1 Register: 14 active blockers; 0 of 18 decisions approved. | **HIGH** (Multi-party coordination) | **HIGH** (Prolonged project deadlock at Gate 1) | **HIGH** | Gate 1 is locked; project safe and compliant. | Transmit Formal Stakeholder Approval Package; convene structured executive voting session. | Executive Leadership | ALL (POL A–E) | Verified Gate 1 Unlocking Warrant signed by all 4 officers. | **LOW** |

---

## 3. Summary Risk Profile & Gate 1 Guard

```
+---------------------------------------------------------------------------------------------------+
|                                 GATE 1 RISK PROFILE BREAKDOWN                                     |
+---------------------------------------------------------------------------------------------------+
|  Total Risks Evaluated:                         14 Risks                                          |
|  Critical Risks:                                 1 Risk  (  7.1% ) — Maker-Checker Null Bypass    |
|  High Risks:                                     7 Risks ( 50.0% ) — Signs, GL, Bank, Tax, Thresh |
|  Medium Risks:                                   6 Risks ( 42.9% ) — Schema, Hash, Multi-Party    |
|  Low Risks:                                      0 Risks (  0.0% )                                |
|                                                                                                   |
|  Gate 1 Lock Protection:                         FINANCIAL EXECUTION RISKS MITIGATED              |
|  * The locked status of Gate 1 mitigates financial execution risks during read-only review;      |
|    UNDERLYING CONTROL AND EVIDENCE GAPS REMAIN OPEN.                                              |
+---------------------------------------------------------------------------------------------------+
```

- **Risk Determination:** FINANCIAL EXECUTION RISKS MITIGATED BY THE GATE 1 LOCK; UNDERLYING CONTROL AND EVIDENCE GAPS REMAIN OPEN. Because Gate 1 remains strictly locked, unauthorized financial execution and schema mutations are prevented during read-only evaluation. However, the underlying control deficiencies (e.g., historical maker-checker bypass when `preparerId IS NULL`, reconciliation sign divergence), missing external evidence (GL trial balances, bank statements, UTR manifests, tax challans), and pending stakeholder approvals remain unresolved and cannot be eliminated through documentation alone.
- **Gate 1 Status:** `GATE 1 LOCKED — FINANCIAL EXECUTION NOT AUTHORIZED.`

---

*End of Day 11 Gate 1 Consolidated Risk Register.*

