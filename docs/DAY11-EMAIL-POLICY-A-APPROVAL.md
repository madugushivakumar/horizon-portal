# STAKEHOLDER COMMUNICATION BRIEF — POLICY A
## Executive Email Draft for Corporate Controller / Chief Financial Officer

**Project:** Aura Workforce by Growmar — Horizon Portal  
**Document Reference:** `docs/DAY11-EMAIL-POLICY-A-APPROVAL.md`  
**Target Policy:** Policy A — Authoritative Financial Source of Truth  
**Formal Request File:** [`docs/DAY11-POLICY-A-APPROVAL-REQUEST.md`](file:///c:/Users/Madugu%20Shiva%20Kumar/OneDrive/图片/Desktop/horizon-portal/docs/DAY11-POLICY-A-APPROVAL-REQUEST.md)  
**Date:** November 7, 2026  
**Status:** DRAFT — PREPARED FOR TRANSMISSION (NOT AUTOMATICALLY SENT)  

---

### EMAIL TRANSMISSION DETAILS

**TO:** [Corporate Controller / CFO Name] <[controller-cfo-email@growmar.com]>  
**FROM:** Principal Backend & Financial Systems Lead <[lead-engineer@growmar.com]>  
**DATE:** November 7, 2026  
**SUBJECT:** Approval Required — Day 11 Payroll Reconciliation Source-of-Truth Policy  
**IMPORTANCE:** High / Urgent (Financial Controls & Statutory Governance)  
**ATTACHMENT / LINK:** [`docs/DAY11-POLICY-A-APPROVAL-REQUEST.md`](file:///c:/Users/Madugu%20Shiva%20Kumar/OneDrive/图片/Desktop/horizon-portal/docs/DAY11-POLICY-A-APPROVAL-REQUEST.md)  

---

### EMAIL BODY

Dear [Corporate Controller / CFO Name],

I am writing to request your formal policy determination regarding the authoritative financial source of truth for the Horizon Portal payroll subsystem as part of the Day 11 Payroll Reconciliation initiative.

### 1. Context and Problem Statement
During forensic validation of our database records, mathematical discrepancies were identified between stored summary payroll run headers (`payroll_runs` table) and itemized employee payslip records (`payslips` table):

- **September 2026 (`PR-2026-09`, In-Flight / Unpaid):**
  - Stored Header: 444 employees | Gross: ₹54,788,660.03 | Net: ₹48,089,678.30
  - Itemized Payslips Sum: 441 employees | Gross: ₹54,430,331.52 | Net: ₹47,782,326.60
  - Discrepancy: Header overstates headcount by +3 employees, Gross by +₹358,328.51, and Net by +₹307,351.70.
  - Root Cause: Three future hires (`EMP00442`, `EMP00443`, `EMP00444`) with joining dates in October 2026 were erroneously included in the preliminary headcount estimate.

- **August 2026 (`PR-2026-08`, Disbursed / Paid on 2026-09-01):**
  - Stored Header: 429 employees | Gross: ₹48,685,007.97 | Net: ₹43,173,318.36
  - Itemized Payslips Sum: 424 employees | Gross: ₹47,847,409.45 | Net: ₹42,467,961.37
  - Discrepancy: Stored header reflects +5 headcount and +₹705,356.99 net compared to itemized sum.
  - Root Cause: Five employees (`EMP00425`–`EMP00429`) with September 2026 joining dates had draft records with 0 work days.

### 2. Proposed Accounting Policy Rule (Rule A.1)
We propose establishing **Proposed Rule A.1**, designating itemized payslips as the authoritative calculation source for downstream payroll summaries:
> *"Itemized payslips (`payslips` table) are hereby designated as the authoritative calculation source for final payroll compensation and statutory withholdings. Summary payroll run headers (`payroll_runs` table) are operational roll-up records that must mathematically reconcile to the sum of itemized payslips prior to payroll authorization. For already disbursed runs, the original header records the historical disbursement amount, while the `PayrollAdjustment` ledger records the audited reporting tie-out."*

### 3. Key Legal & Accounting Considerations
- **Absence of Existing Written Precedence:** The repository and codebase currently contain no documented corporate policy declaring that itemized payslips supersede summary headers as a legal matter of record.
- **Financial Protection:** Approving Rule A.1 eliminates a ₹307,351.70 phantom cash disbursement liability in September, ensuring disbursement matches verified employees.
- **Statutory Alignment:** Individual PF, ESI, and TDS statutory filings require 1:1 matching with individual employee payslips.

### 4. Available Decision Options
1. **Option A.1 (Recommended): Itemized Payslip Primacy** — Itemized payslips govern calculations. September headers will be aligned to payslip totals upon authorized execution.
2. **Option A.2: Summary Header Primacy** — Headers govern as approved budget ceilings; individual payslips must be adjusted via credit memos.
3. **Option A.3: Case-by-Case Arbitration** — Discrepancies are arbitrated individually with separate board/treasury approvals.

### 5. Important Financial Safety Restrictions
- In accordance with our governance charter, **no database records have been modified**, and **no financial mutation endpoints have been created**.
- The production database (`prisma/dev.db`) remains 100% read-only with verified SHA-256 integrity (`74d656f992717b8ee6e4e8f6bd902f2dd5a50b09e7b680435abb660ed16bc311`).
- Implementation is strictly blocked until your formal written decision is recorded.

---

### FORMAL DECISION REQUEST

Please review the complete documentation in [`docs/DAY11-POLICY-A-APPROVAL-REQUEST.md`](file:///c:/Users/Madugu%20Shiva%20Kumar/OneDrive/图片/Desktop/horizon-portal/docs/DAY11-POLICY-A-APPROVAL-REQUEST.md) and reply with your formal decision in the following format:

```text
DECISION: [ APPROVED | APPROVED WITH CONDITIONS | REJECTED | NEEDS REVISION ]
POLICY: POLICY A — Authoritative Financial Source of Truth (Proposed Rule A.1)
APPROVER NAME: [Your Full Name]
OFFICIAL TITLE: [Corporate Controller / Chief Financial Officer]
APPROVAL DATE: [YYYY-MM-DD]
CONDITIONS / DIRECTIVES: [Enter any specific restrictions, accounting treatments, or 'None']
DOCUMENT REFERENCE / MEMO ID: [Enter internal finance memo or resolution ID]
```

Thank you for your timely governance review of this critical financial matter.

Sincerely,

**Principal Backend & Financial Systems Lead**  
Horizon Portal — Aura Workforce by Growmar  
[lead-engineer@growmar.com]  

