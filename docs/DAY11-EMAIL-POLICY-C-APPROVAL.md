# STAKEHOLDER COMMUNICATION BRIEF — POLICY C
## Executive Email Draft for Audit Committee Chair / Chief Financial Officer

**Project:** Aura Workforce by Growmar — Horizon Portal  
**Document Reference:** `docs/DAY11-EMAIL-POLICY-C-APPROVAL.md`  
**Target Policy:** Policy C — August 2026 Historical Payroll Reporting Treatment  
**Formal Request File:** [`docs/DAY11-POLICY-C-APPROVAL-REQUEST.md`](file:///c:/Users/Madugu%20Shiva%20Kumar/OneDrive/图片/Desktop/horizon-portal/docs/DAY11-POLICY-C-APPROVAL-REQUEST.md)  
**Date:** November 7, 2026  
**Status:** DRAFT — PREPARED FOR TRANSMISSION (NOT AUTOMATICALLY SENT)  

---

### EMAIL TRANSMISSION DETAILS

**TO:** [Audit Committee Chair / CFO Name] <[audit-chair-cfo@growmar.com]>  
**FROM:** Principal Backend & Financial Systems Lead <[lead-engineer@growmar.com]>  
**DATE:** November 7, 2026  
**SUBJECT:** Approval Required — August 2026 Historical Payroll Reporting Treatment  
**IMPORTANCE:** Critical (Statutory Audit, Historical Non-Repudiation & SOX Controls)  
**ATTACHMENT / LINK:** [`docs/DAY11-POLICY-C-APPROVAL-REQUEST.md`](file:///c:/Users/Madugu%20Shiva%20Kumar/OneDrive/图片/Desktop/horizon-portal/docs/DAY11-POLICY-C-APPROVAL-REQUEST.md)  

---

### EMAIL BODY

Dear [Audit Committee Chair / CFO Name],

I am writing to formally submit for your review and approval the proposed accounting and reporting treatment for historical payroll run **`PR-2026-08` (August 2026)** as part of the Day 11 Payroll Financial Reconciliation program.

### 1. Audit Context and Historical Discrepancy
Payroll run `PR-2026-08` represents a disbursed historical period:
- **Operational Status:** `status = PAID`, `approval_status = Pending`, `pay_date = 2026-09-01` (1788220800000).
- **Disbursement Header:** 429 employees | Gross: ₹48,685,007.97 | Net: ₹43,173,318.36
- **Verified Itemized Payslips:** 424 employees | Gross: ₹47,847,409.45 | Net: ₹42,467,961.37
- **Variance ($\text{Itemized} - \text{Header}$):** Headcount: **-5** | Gross: **-₹837,598.52** | Net: **-₹705,356.99**
- **Forensic Finding:** Five employees (`EMP00425` through `EMP00429`) possessed official joining dates in September 2026 and performed 0 work days in August, but had draft payslips generated in the preliminary staging batch.

### 2. Core Governance Invariant: Immutability of Disbursed Records
In strict accordance with corporate audit standards and SOX Section 404 guidelines, historical disbursed records cannot be overwritten:
- **Original Paid Record Remains 100% Immutable:** The `payroll_runs` row for `PR-2026-08`, its `PAID` operational status, its September 1, 2026 pay date, its stored header figures, and all 424 verified payslips will **never be modified, overwritten, or deleted**.
- Attempting to overwrite past headers would falsify historical disbursement archives and break reconciliation against historical bank clearance statements.

### 3. Clear Distinction: Reporting Reconciliation vs Genuine Financial Claim
We propose adopting **Proposed Rule C.1**, which establishes a strict architectural and accounting distinction:

1. **Reporting-Only Reconciliation Entry (`HISTORICAL_REPORTING_RECONCILIATION`) — Proposed Rule C.1:**
   - Captured strictly as an informative, audited adjustment row in the new `payroll_adjustments` ledger.
   - **Zero Cash Movement:** Does not trigger funds disbursement, bank transfer, clawback, or employee communication.
   - **Zero Balance Sheet Mutation:** Purely reconciles the internal reporting variance between historical header records and verified payslips for audit transparency.

2. **Genuine Financial Claim (`FINANCIAL_ADJUSTMENT_CLAIM`):**
   - Represents an actionable legal or financial balance sheet payable/receivable (e.g. employee recovery or retroactive arrears).
   - **Mandatory Prerequisites:** Must **NOT** be executed as an automated software adjustment. Requires documented proof of cleared banking records, HR deduction agreements, and separate Corporate Finance / Treasury sign-off.

### 4. Proposed Policy Statement Under Review (Rule C.1)
> *"Payroll run `PR-2026-08` represents a disbursed historical period and shall remain permanently immutable. Under no circumstances shall its operational status (`PAID`), payment date (`2026-09-01`), header figures (429 headcount, ₹48,685,007.97 gross, ₹43,173,318.36 net), or historical payslips be modified, overwritten, or deleted. The reconciliation variance between the disbursement header and the 424 verified payslips (-5 headcount, -₹837,598.52 gross, -₹705,356.99 net) shall be recorded exclusively as a non-destructive Reporting-Only Reconciliation Entry (`HISTORICAL_REPORTING_RECONCILIATION`) in the `payroll_adjustments` table. This entry shall generate zero cash movement, zero receivables, zero payables, and no alteration to employee entitlements."*

### 5. Important Financial Safety Restrictions
- In adherence to strict read-only governance, **zero database records have been altered**, and **zero mutation endpoints have been created**.
- The database (`prisma/dev.db`) remains 100% read-only with verified SHA-256 integrity (`74d656f992717b8ee6e4e8f6bd902f2dd5a50b09e7b680435abb660ed16bc311`).
- Implementation is fully blocked at Gate 1 awaiting your formal written determination.

---

### FORMAL DECISION REQUEST

Please review the complete documentation in [`docs/DAY11-POLICY-C-APPROVAL-REQUEST.md`](file:///c:/Users/Madugu%20Shiva%20Kumar/OneDrive/图片/Desktop/horizon-portal/docs/DAY11-POLICY-C-APPROVAL-REQUEST.md) and reply with your formal decision in the following format:

```text
DECISION: [ APPROVED | APPROVED WITH CONDITIONS | REJECTED | NEEDS REVISION ]
POLICY: POLICY C — August 2026 Historical Payroll Reporting Treatment (Proposed Rule C.1)
APPROVER NAME: [Your Full Name]
OFFICIAL TITLE: [Audit Committee Chair / Chief Financial Officer]
APPROVAL DATE: [YYYY-MM-DD]
CONDITIONS / DIRECTIVES: [Enter any specific audit directives, financial reporting disclosures, or 'None']
DOCUMENT REFERENCE / RESOLUTION ID: [Enter Audit Committee resolution ID or formal memo reference]
```

Thank you for your thorough review and leadership in preserving corporate financial integrity.

Sincerely,

**Principal Backend & Financial Systems Lead**  
Horizon Portal — Aura Workforce by Growmar  
[lead-engineer@growmar.com]  

