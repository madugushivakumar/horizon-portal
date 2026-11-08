# STAKEHOLDER COMMUNICATION BRIEF — POLICY B
## Executive Email Draft for Head of Payroll / VP Human Resources

**Project:** Aura Workforce by Growmar — Horizon Portal  
**Document Reference:** `docs/DAY11-EMAIL-POLICY-B-APPROVAL.md`  
**Target Policy:** Policy B — September 2026 Pre-Approval Correction Lifecycle  
**Formal Request File:** [`docs/DAY11-POLICY-B-APPROVAL-REQUEST.md`](file:///c:/Users/Madugu%20Shiva%20Kumar/OneDrive/图片/Desktop/horizon-portal/docs/DAY11-POLICY-B-APPROVAL-REQUEST.md)  
**Date:** November 7, 2026  
**Status:** DRAFT — PREPARED FOR TRANSMISSION (NOT AUTOMATICALLY SENT)  

---

### EMAIL TRANSMISSION DETAILS

**TO:** [Head of Payroll / VP HR Name] <[head-payroll-hr@growmar.com]>  
**FROM:** Principal Backend & Financial Systems Lead <[lead-engineer@growmar.com]>  
**DATE:** November 7, 2026  
**SUBJECT:** Approval Required — September 2026 Payroll Correction Workflow  
**IMPORTANCE:** High / Urgent (Operational Payroll & Pre-Disbursement Controls)  
**ATTACHMENT / LINK:** [`docs/DAY11-POLICY-B-APPROVAL-REQUEST.md`](file:///c:/Users/Madugu%20Shiva%20Kumar/OneDrive/图片/Desktop/horizon-portal/docs/DAY11-POLICY-B-APPROVAL-REQUEST.md)  

---

### EMAIL BODY

Dear [Head of Payroll / VP HR Name],

I am writing to request your formal authorization for the pre-approval reconciliation workflow designed for the in-flight **September 2026 payroll run (`PR-2026-09`)** under Day 11 of the Horizon Portal payroll initiative.

### 1. Operational Background & Issue Identification
The September 2026 payroll run is currently in `POSTED - PAYMENT PENDING` status (`pay_date = null`, `approval_status = Pending`). An automated pre-approval integrity check detected a discrepancy between preliminary summary figures and verified itemized records:

- **Preliminary Header:** 444 employees | Gross: ₹54,788,660.03 | Net: ₹48,089,678.30
- **Verified Itemized Payslips:** 441 employees | Gross: ₹54,430,331.52 | Net: ₹47,782,326.60
- **Discrepancy:** The preliminary header includes 3 employees (`EMP00442`, `EMP00443`, `EMP00444`) whose official joining dates are in October 2026. They completed zero work hours in September and have ₹0 in compensable earnings.
- **Operational Impact:** If the header is approved as-is, the portal would authorize a payout of ₹48,089,678.30, resulting in a ₹307,351.70 phantom overpayment liability. The portal currently blocks run approval with HTTP 422 Unprocessable Entity until this variance is formally resolved.

### 2. Proposed Three-Stage Decoupled Workflow Lifecycle (Rule B.1)
To ensure complete transparency, prevent unilateral modifications, and enforce internal control segregation, we have architected a **mandatory three-stage decoupled lifecycle**:

```
[ STAGE 1: PROPOSAL ]           [ STAGE 2: INDEPENDENT APPROVAL ]       [ STAGE 3: EXECUTION ]
POST /reconcile-pre-approval    POST /adjustments/[id]/approve          POST /adjustments/[id]/execute
      │                                       │                                       │
      ▼                                       ▼                                       ▼
Creates Adjustment Record               Independent Admin Reviews &             Separately Authorized Actor
(Status: "PROPOSED")                    Certifies (Status: "APPROVED")          Applies Header Mutation
      │                                       │                         (Status: "EXECUTED")
      ▼                                       ▼                                       ▼
ZERO HEADER MUTATION                    ZERO HEADER MUTATION                    Header Updated to 441
(Header remains 444)                    (Header remains 444)                    Snapshot Captured (444)
```

### 3. Strict Safety Invariants
1. **Proposal Creation DOES NOT modify payroll headers:** Submitting a correction proposal in Stage 1 calculates the variance and writes an adjustment proposal to the audit ledger. The `PayrollRun` header retains its 444 employee count and initial totals.
2. **Approval DOES NOT execute a correction:** In Stage 2, an independent reviewer certifies the mathematical accuracy of the proposal (`approverId !== preparerId`). The header remains completely unmutated.
3. **Execution REQUIRES separate authorization:** Stage 3 modifies the `PayrollRun` header values (to 441 employees, ₹54,430,331.52 gross, ₹47,782,326.60 net) only within a dedicated atomic transaction under explicit execution authorization.
4. **Permanent Baseline Preservation:** Preliminary draft values are permanently preserved in historical snapshot columns (`originalEmployeesPaid`, `originalTotalGross`, `originalTotalNet`).
5. **Zero Automatic Payment:** Pre-approval alignment adjusts header math to enable honest review. It does **not** disburse funds, set payment dates, or mark the run as `PAID`.

### 4. Important Financial Safety Restrictions
- In strict adherence to our safety rules, **zero database records have been altered**, and **no mutation endpoints have been implemented**.
- The database (`prisma/dev.db`) remains 100% read-only with verified SHA-256 integrity (`74d656f992717b8ee6e4e8f6bd902f2dd5a50b09e7b680435abb660ed16bc311`).
- Implementation is completely blocked at Gate 1 until your formal written decision is provided.

---

### FORMAL DECISION REQUEST

Please review the complete workflow specifications in [`docs/DAY11-POLICY-B-APPROVAL-REQUEST.md`](file:///c:/Users/Madugu%20Shiva%20Kumar/OneDrive/图片/Desktop/horizon-portal/docs/DAY11-POLICY-B-APPROVAL-REQUEST.md) and reply with your formal decision in the following format:

```text
DECISION: [ APPROVED | APPROVED WITH CONDITIONS | REJECTED | NEEDS REVISION ]
POLICY: POLICY B — September 2026 Pre-Approval Correction Lifecycle (Proposed Rule B.1)
APPROVER NAME: [Your Full Name]
OFFICIAL TITLE: [Head of Payroll / Vice President of Human Resources]
APPROVAL DATE: [YYYY-MM-DD]
CONDITIONS / DIRECTIVES: [Enter any specific operational directives, scheduling windows, or 'None']
DOCUMENT REFERENCE / DIRECTIVE ID: [Enter HR directive ID or executive memo reference]
```

Thank you for your leadership and governance on this critical payroll milestone.

Sincerely,

**Principal Backend & Financial Systems Lead**  
Horizon Portal — Aura Workforce by Growmar  
[lead-engineer@growmar.com]  

