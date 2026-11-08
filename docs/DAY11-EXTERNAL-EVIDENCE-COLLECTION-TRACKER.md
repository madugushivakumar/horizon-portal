# DAY 11 — EXTERNAL EVIDENCE COLLECTION TRACKER
## Aura Workforce by Growmar — Horizon Portal
### Phase 3 — Teams and Insight | Day 11: Admin Payroll Run Console
### Post Gate 1 Quality Control | External Evidence Collection & Intake Tracker

---

## Document Metadata

| Attribute | Specification |
|---|---|
| **Document ID** | `DAY11-EXTERNAL-EVIDENCE-COLLECTION-TRACKER` |
| **Document Title** | External Evidence Collection, Intake & Lifecycle Status Tracker (14 Artifacts) |
| **Project & Phase** | Aura Workforce by Growmar — Horizon Portal / Phase 3 — Day 11 |
| **Governing Baseline** | Policy E (`DAY11-STAGE3-POLICY-E-*`), Evidence QC Register (`DAY11-GATE1-EXTERNAL-EVIDENCE-QC.md`) |
| **Execution Mode** | Evidentiary Tracking & Lifecycle Auditing (Strictly Read-Only Documentation) |
| **Tracked Artifacts** | **14 Missing External Evidence Artifacts** (Active Gate 1 Blockers) |
| **Mandatory Status Rule**| Do not mark `REQUESTED` unless sent; do not mark `RECEIVED` unless in repo; do not mark `VERIFIED` unless audited. |
| **Active Evidence State**| **14 of 14 Artifacts: `NOT_PROVIDED` / `REQUEST_PREPARATION_PENDING`** |
| **Gate 1 Status** | **`GATE 1: LOCKED — FINANCIAL EXECUTION NOT AUTHORIZED`** |
| **Stage 4B Status** | **`STAGE 4B: NOT AUTHORIZED`** |
| **Date of Execution** | November 7, 2026 |

---

## 1. Executive Summary & Evidence Lifecycle States

This document establishes the operational **External Evidence Collection Tracker** for the fourteen missing external artifacts required by Policy E and the Gate 1 Unlocking Protocol.

### Authorized Lifecycle State Definitions:
- `NOT_PROVIDED`: Artifact has not been supplied to the repository. Baseline status for all 14 external items.
- `REQUEST_PREPARATION_PENDING`: Technical specifications and request dossiers are formulated; awaiting human authorization to dispatch requests.
- `REQUESTED`: Formal request dossier has been physically or digitally transmitted to the responsible stakeholder, with recorded dispatch date.
- `RECEIVED — VERIFICATION PENDING`: Physical artifact has been deposited into the designated intake directory; awaiting technical verification.
- `VERIFIED`: Artifact has been independently audited against source systems, cryptographic checksums, or government portals, with signed verification records.
- `REJECTED`: Submitted artifact failed schema validation, date matching, mathematical tie-out, or authenticity verification.
- `NOT_APPLICABLE — FORMAL JUSTIFICATION REQUIRED`: Requirement formally waived by designated authority with written legal/audit justification.

> [!NOTE]
> **Evidence Reporting Scope Notice:** While historical payroll run headers span 18 calendar months (Apr 2025 – Sep 2026), 18-month evidence coverage has not been established as an approved requirement. Reporting periods (whether the 6 discrepancy months with itemized payslips or all 18 historical run headers) require authorized stakeholder confirmation per [`docs/DAY11-EVIDENCE-REPORTING-PERIOD-CLARIFICATION.md`](file:///c:/Users/Madugu%20Shiva%20Kumar/OneDrive/图片/Desktop/horizon-portal/docs/DAY11-EVIDENCE-REPORTING-PERIOD-CLARIFICATION.md).

---

## 2. Fourteen-Artifact Evidence Collection Tracker

```
========================================================================================================================
                                 FOURTEEN EXTERNAL EVIDENCE ARTIFACTS INTAKE TRACKER
========================================================================================================================
```

| Evidence ID | Artifact Description | Responsible Stakeholder | Issuing Authority | Related Period / Decision | Requested Date | Date Received | Expected Source Location | Target File / Document Reference | Verification Method | Explicit Acceptance Criteria | Reviewer / Verifier | Verification Date | Current Status | Outstanding Questions / Action Items |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **EVID-GL-01** | Official Corporate ERP Chart of Accounts (COA) | Corporate Controller (`FIN-CTRL`) | Enterprise Financial Systems (SAP/Oracle) | Active Fiscal Year / `DEC-E-04` | *Pending Preparation* | *Not Received* | Corporate ERP Master Export | `04_Evidence_Intake/GL/erp_chart_of_accounts.json` | Automated schema validation & code lookup | Formal list of active account codes for gross pay, tax liabilities, PF/ESIC payables, and net pay matching corporate COA. | Lead Systems Architect | *Pending* | `REQUEST_PREPARATION_PENDING` | Request dossier formulated in Transmission Pack; awaiting Controller extract. |
| **EVID-GL-02** | Historical ERP General Ledger Trial Balances & Journal Vouchers | Corporate Controller (`FIN-CTRL`) | Corporate General Accounting | Apr 2025 – Sep 2026 / `DEC-E-01` | *Pending Preparation* | *Not Received* | Corporate Accounting Ledgers | `04_Evidence_Intake/GL/historical_trial_balances_FY25_26.pdf` | Double-entry arithmetic tie-out: $\sum \text{Debits} == \sum \text{Credits}$ | Certified monthly journal voucher numbers showing posted wage expenses and liabilities reconciling to within 0 paise of payslips. | Financial Controls Analyst | *Pending* | `REQUEST_PREPARATION_PENDING` | Verify whether ERP posted salary expenses using header totals or itemized payslips. |
| **EVID-GL-03** | Wage Expense Postings (`GL-6100` Payroll Expense Journals) | Corporate Controller (`FIN-CTRL`) | Corporate General Accounting | Apr 2025 – Sep 2026 / `DEC-E-01` | *Pending Preparation* | *Not Received* | ERP General Ledger Transaction Extract | `04_Evidence_Intake/GL/wage_expense_postings_gl6100.xlsx` | Transaction-by-transaction tie-out against monthly gross sums | Certified journal entries evidencing corporate P&L recognition matching each of the 18 historical runs. | Corporate Controller | *Pending* | `REQUEST_PREPARATION_PENDING` | Check whether P&L expense recognized historical variances as period adjustments. |
| **EVID-BNK-01** | Commercial Bank Account Statements (Consolidated Debits) | Corporate Treasurer (`TREAS-MGR`) | Commercial Clearing Bank (HDFC/ICICI/SBI) | Apr 2025 – Sep 2026 / `DEC-E-05` | *Pending Preparation* | *Not Received* | Corporate Treasury Banking Portal | `04_Evidence_Intake/Banking/bank_statements_consolidated_debits.pdf` | 1-to-1 matching of statement debit sums against net pay | Official bank statements (PDF/MT940) showing consolidated debit date, reference, and amount matching net payroll. | Corporate Treasurer | *Pending* | `REQUEST_PREPARATION_PENDING` | Confirm cash exited corporate accounts for each historical batch. |
| **EVID-BNK-02** | Beneficiary Credit UTR Clearing Numbers | Corporate Treasurer (`TREAS-MGR`) | RBI NEFT/RTGS/NACH Clearing Network | 2,469 Itemized Payslips / `DEC-E-05` | *Pending Preparation* | *Not Received* | Clearing Bank Electronic Response Manifests | `04_Evidence_Intake/Banking/beneficiary_utr_manifests.csv` | Regex validation (16-22 char alphanumeric) & 100% payslip tie-out | Valid UTR clearing record for every itemized payslip or documented returned/bounced entry. | Treasury Operations Lead | *Pending* | `REQUEST_PREPARATION_PENDING` | Zero UTR records exist in repo. Confirm whether bank clearing files can be retrieved. |
| **EVID-BNK-03** | Treasury Returned / Bounced Payment Exception Logs | Corporate Treasurer (`TREAS-MGR`) | Corporate Treasury Operations | Apr 2025 – Sep 2026 / `DEC-E-05` | *Pending Preparation* | *Not Received* | Bank Rejection / Return Data Files | `04_Evidence_Intake/Banking/treasury_returned_payments.csv` | Reconciliation against undisbursed salary escrow liabilities | Official log of all rejected transfers or formal confirmation of 100% success rate. | Treasury Operations Lead | *Pending* | `REQUEST_PREPARATION_PENDING` | Verify whether undisbursed employee wage liabilities exist for historical cycles. |
| **EVID-BNK-04** | Corporate Treasurer Banking Model Formal Sign-Off | Corporate Treasurer (`TREAS-MGR`) | Corporate Treasurer | All Fiscal Periods / `DEC-E-05` | *Pending Preparation* | *Not Received* | Corporate Treasury Office | `04_Evidence_Intake/Banking/treasury_model_signoff_memo.pdf` | Executive signature authentication & policy review | Formally signed memo or Template 15.1 adopting the hybrid settlement verification model. | Chief Financial Officer | *Pending* | `REQUEST_PREPARATION_PENDING` | Authorize ingestion of banking statements and UTRs into production database. |
| **EVID-TAX-01** | EPFO Electronic Challan cum Return (ECR) & TRRN Receipts | Head of Tax Operations (`TAX-HEAD`) | Employees' Provident Fund Organisation (EPFO) | Apr 2025 – Sep 2026 / `DEC-E-02` | *Pending Preparation* | *Not Received* | EPFO Unified Employer Portal | `04_Evidence_Intake/Tax/epfo_ecr_trrn_receipts.pdf` | TRRN verification on EPFO portal & contribution tie-out | Government payment receipts showing 13-digit TRRN matching provident fund deductions within statutory due dates. | Head of Tax Operations | *Pending* | `REQUEST_PREPARATION_PENDING` | Verify whether PF remittances matched header or payslip deduction sums. |
| **EVID-TAX-02** | ESIC Monthly Contribution Challans & CPIN | Head of Tax Operations (`TAX-HEAD`) | Employees' State Insurance Corporation (ESIC) | Apr 2025 – Sep 2026 / `DEC-E-02` | *Pending Preparation* | *Not Received* | ESIC Unified Portal | `04_Evidence_Intake/Tax/esic_monthly_challans_cpin.pdf` | CPIN verification on ESIC portal & contribution tie-out | Certified monthly receipts showing 17-digit CPIN matching eligible employee insurance contributions. | Head of Tax Operations | *Pending* | `REQUEST_PREPARATION_PENDING` | Verify whether ESIC remittances matched header or payslip deduction sums. |
| **EVID-TAX-03** | Income Tax TDS Form 24Q Quarterly Returns & ITNS 281 Challans | Head of Tax Operations (`TAX-HEAD`) | Income Tax Dept / Protean (NSDL) / TRACES | FY2025–26 & FY2026–27 / `DEC-E-02` | *Pending Preparation* | *Not Received* | NSDL / Income Tax Traces Portal | `04_Evidence_Intake/Tax/tds_form24q_itns281_challans.pdf` | Challan Status Enquiry (CIN/BSR) & TDS tie-out | Form 24Q provisional receipts and ITNS 281 payment challans with BSR/CIN matching quarterly tax deductions. | Head of Tax Operations | *Pending* | `REQUEST_PREPARATION_PENDING` | Verify quarterly tax return filings under Section 200(3) of IT Act 1961. |
| **EVID-HR-02** | Formal VP HR Designation of Authoritative Status Source | VP of Human Resources (`HR-VPHR`) | VP of Human Resources | All Periods / `DEC-A-02` | *Pending Preparation* | *Not Received* | Corporate HR Leadership Office | `04_Evidence_Intake/HR/hr_authoritative_status_source_directive.pdf` | Policy governance review & HRMS interface check | Formal written directive designating primary HRMS and ratifying the 6-population employee taxonomy. | Head of Internal Audit | *Pending* | `REQUEST_PREPARATION_PENDING` | Awaiting VP HR designation of primary master roster and effective-dated termination logs. |
| **EVID-GOV-01** | Corporate Policy Voting Artifacts (Policies A through E) | Corporate Governance Committee Lead / CFO | Corporate Governance Committee | Revision 2.1 Baseline / `DEC-A-01`..`E-05` | *Pending Preparation* | *Not Received* | Corporate Executive Committee Minutes | `04_Evidence_Intake/Governance/corporate_policy_ratification_records.pdf` | Signature authentication & quorum rule validation | Signed Template 15.2 ratification records for Policies A through E with valid quorum. | Head of Internal Audit | *Pending* | `REQUEST_PREPARATION_PENDING` | Awaiting scheduling of executive review and deliberation sessions. |
| **EVID-GOV-02** | Signed Joint Monetary Threshold Determination Paper (`DEC-C-02`) | Controller & CFO (`FIN-CTRL` / `EXEC-CFO`) | Controller & CFO | All Operational Runs / `DEC-C-02` | *Pending Preparation* | *Not Received* | Office of Corporate Controller | `04_Evidence_Intake/Governance/dec_c02_monetary_threshold_determination.pdf` | Joint executive signature verification | Signed Template 15.1 specifying selected threshold basis and binding numeric threshold figure. | Head of Internal Audit | *Pending* | `REQUEST_PREPARATION_PENDING` | Threshold remains undecided; ₹5,00,000 illustrative. Awaiting joint determination. |
| **EVID-GOV-05** | Independent Audit Committee Concurrence Letter (`COND-16`) | Audit Committee Chair (`AUD-COMM-CHAIR`) | Independent Audit Committee | Stages 1–4A / `COND-16` | *Pending Preparation* | *Not Received* | Board of Directors Audit Committee | `04_Evidence_Intake/Governance/audit_committee_concurrence_letter.pdf` | Document authenticity & committee quorum verification | Formal signed letter on corporate letterhead expressing concurrence with Stage 1–4A findings. | Head of Internal Audit | *Pending* | `REQUEST_PREPARATION_PENDING` | Committee has not yet convened to review the Gate 1 governance pack. |

---

## 3. Strict Prohibitions Against Premature Promotion

1. **No Artifact Marked REQUESTED:** No request dossiers have been dispatched to external individuals; all items are strictly held in `REQUEST_PREPARATION_PENDING` awaiting authorized human transmission.
2. **No Artifact Marked RECEIVED:** Zero external documents have been delivered; zero files exist in `04_Evidence_Intake/`.
3. **No Artifact Marked VERIFIED:** Verification cannot occur in the absence of genuine source files. Internal project documentation, mock schemas, and database tables are **not** substitutes for authoritative third-party evidence.

---

## 4. Summary & Gate 1 Guard

- **Tracker Status:** All 14 artifacts mapped with explicit intake locations, verification methods, acceptance criteria, and review responsibilities.
- **Gate 1 Status:** `GATE 1 LOCKED — FINANCIAL EXECUTION NOT AUTHORIZED.`
- **Stage 4B Status:** `STAGE 4B NOT AUTHORIZED.`

---

*End of Day 11 External Evidence Collection Tracker.*

