# FORMAL POLICY APPROVAL REQUEST — POLICY B
## Pre-Approval Reconciliation Lifecycle & Controlled Header Alignment for September 2026

**Document Identifier:** `docs/DAY11-POLICY-B-APPROVAL-REQUEST.md`  
**Policy Identifier:** **POLICY-B**  
**Designated Approver Role:** **Head of Financial Planning & Analysis (FP&A) / Head of Payroll**  
**Required Secondary Concurrence:** **Corporate Controller & Chief Financial Officer (CFO)**  
**Submission Date:** November 7, 2026  
**Current Status:** **PREPARED — NOT SUBMITTED (PENDING STAKEHOLDER SUBMISSION)**  
**Governing Context:** Day 11 Financial Reconciliation — Horizon Portal  
**Target Scope:** September 2026 (`PR-2026-09`)  
**Governance State:** **GATE 1: LOCKED — NO FINANCIAL EXECUTION AUTHORIZED**  

---

## 1. Executive Summary

This formal approval request is submitted to establish the pre-approval reconciliation and alignment protocol for the in-flight September 2026 payroll run (`PR-2026-09`).

Because funds for September 2026 have not been disbursed (`pay_date: null`, `approval_status: Pending`), a controlled three-stage lifecycle (Proposal $\to$ Independent Review $\to$ Atomic Posting) is proposed to align the batch header to realized employee compensation before disbursement occurs.

---

## 2. Business & Technical Background

The September 2026 payroll run is currently in `POSTED - PAYMENT PENDING` status. A variance exists between the preliminary batch header and the verified itemized payslips:
- Stored Header: Headcount `444` | Gross `₹54,788,660.03` | Net `₹48,089,678.30` | Implied Deductions `₹6,698,981.73`
- Itemized Payslips: Headcount `441` | Gross `₹54,430,331.52` | Net `₹47,782,326.60` | Deductions `₹6,648,004.92`
- Discrepancy: Headcount **-3 employees**, Gross **-₹358,328.51**, Deductions **-₹50,976.81**, Net **-₹307,351.70**

---

## 3. Evidence Supporting the Decision

- All 441 employees in Growmar's company history received a verified September payslip ($0\text{ paise}$ error).
- 17 new hires (`EMP-0729` to `EMP-0745`) joined in September with verified pro-rated pay.
- Prior draft hypotheses regarding `EMP-0442` to `EMP-0444` being October joiners were refuted: `EMP-0442` and `EMP-0443` were hired in 2023 and paid in September; `EMP-0444` is a sequence gap.
- **Audit Finding:**
  > The stored payroll header reports 444 employees, while the itemized payslip dataset contains 441 employees. This produces an unexplained header-to-roster headcount difference of three. The available evidence does not independently establish that these represent approved budgeted vacancies.  
  > `Budgeted-vacancy explanation: NOT VERIFIED`
- **Canonical Classification:**
  - **Level 1 (Broad Governance):** **Category 4 — Upstream Planning or Reporting Variance** (Governing standard per [`docs/DAY11-DISCREPANCY-CLASSIFICATION-STANDARD.md`](file:///c:/Users/Madugu%20Shiva%20Kumar/OneDrive/图片/Desktop/horizon-portal/docs/DAY11-DISCREPANCY-CLASSIFICATION-STANDARD.md)).
  - **Level 2 (Specific Causal Hypothesis):** `SYSTEM_BATCH_HEADER_CALCULATION_DEFECT` — Retained strictly as an unverified engineering hypothesis per [`docs/DAY11-DISCREPANCY-CLASSIFICATION-RECONCILIATION.md`](file:///c:/Users/Madugu%20Shiva%20Kumar/OneDrive/图片/Desktop/horizon-portal/docs/DAY11-DISCREPANCY-CLASSIFICATION-RECONCILIATION.md).

---

## 4. Exact Policy Decision Requested & Proposed Policy Wording

The Head of FP&A is requested to authorize the following formal policy statement:

> **Proposed Policy B Wording (Rule B.1):**  
> *"For unapproved in-flight payroll runs in `POSTED - PAYMENT PENDING` status where Policy A applies, the corporate reconciliation engine is authorized to execute a three-stage maker-checker alignment under Dimension A `PRE_APPROVAL_HEADER_ALIGNMENT` with Dimension B reason `JOINING_DATE_ALIGNMENT`: (1) Proposal: A non-mutating alignment voucher is submitted in `PayrollAdjustment`; (2) Review: An independent finance manager reviews and approves the voucher; (3) Execution: Following separate explicit operational execution sign-off (Key 2), the run header totals in `payroll_runs` shall be atomically updated within a Prisma transaction to match verified payslip sums (Headcount 441, Gross ₹54,430,331.52, Net ₹47,782,326.60), transitioning the badge to `MATCHED` and enabling final payment approval."*

---

## 5. Risks & Implications

1. **If Approved as Proposed:**
   - Prevents disbursement of ₹307,351.70 in unallocated cash to non-existent payees.
   - Enforces maker-checker separation and transactional audit logging.
2. **If Rejected:**
   - September payroll cannot be approved in the console (HTTP 422 Unprocessable Entity).
   - Staff compensation payments remain blocked.

---

## 6. Required Approval Authority & Secondary Concurrence

- **Primary Approver:** Head of Financial Planning & Analysis (FP&A) / Head of Payroll
- **Required Secondary Concurrence:** Corporate Controller & Chief Financial Officer (CFO)

---

## 7. Supporting Evidence References

- In-Flight Payslip Audit: `03_Data_Pack/payslips.json` (Items `PI-006912` to `PI-007352`)
- September Root Cause: [`docs/DAY11-SEPTEMBER-2026-ROOT-CAUSE.md`](file:///c:/Users/Madugu%20Shiva%20Kumar/OneDrive/图片/Desktop/horizon-portal/docs/DAY11-SEPTEMBER-2026-ROOT-CAUSE.md)
- Evidence Register: [`docs/DAY11-STAKEHOLDER-APPROVAL-EVIDENCE-REGISTER.md`](file:///c:/Users/Madugu%20Shiva%20Kumar/OneDrive/图片/Desktop/horizon-portal/docs/DAY11-STAKEHOLDER-APPROVAL-EVIDENCE-REGISTER.md)

---

## 8. Conditions and Limitations

1. **Two-Key Authorization:** Policy B approval establishes the lifecycle rule but **does NOT automatically execute the database update**. Execution requires a separate, authenticated execution authorization.
2. **Maker-Checker Invariant:** `preparerId !== approverId` is strictly enforced.
3. **Idempotency:** Protected against duplicate posting via monotonic revision numbering.

---

## 9. Stakeholder Review, Decision Options & Signature Block

```text
================================================================================
STAKEHOLDER DECISION & SIGN-OFF SECTION
================================================================================
Policy Identifier:   POLICY-B (September In-Flight Pre-Approval Correction Protocol)
Primary Authority:   Head of Financial Planning & Analysis (FP&A) / Head of Payroll
Secondary Authority: Corporate Controller & Chief Financial Officer (CFO)

DECISION OPTIONS (Select exactly one):
[   ] 1. APPROVE AS PROPOSED (Adopt Rule B.1 wording as official corporate policy)
[   ] 2. REJECT (Block header alignment; maintain MISMATCH status)
[   ] 3. APPROVE WITH AMENDMENTS (Specify exact approved wording/terms below)
[   ] 4. REQUEST ADDITIONAL EVIDENCE (Specify required documents/analyses below)
[   ] 5. DEFER DECISION (Specify deferral reason and target review date below)

Stakeholder Amendments / Specific Directives / Evidence Requests:
________________________________________________________________________________
________________________________________________________________________________
________________________________________________________________________________

Primary Approver Name:      [NOT PROVIDED — Pending Corporate Designation]
Primary Approver Role:      [Head of FP&A / Head of Payroll]
Evidence Reference:         [PENDING — Awaiting Signed Executive Document]
Signature / Auth:           ____________________________________________________
Date of Decision:           ____ / ____ / 2026

Secondary Concurrence Name: [NOT PROVIDED — Pending Corporate Designation]
Secondary Concurrence Role: [Corporate Controller / CFO]
Concurrence Signature:      ____________________________________________________
Date of Concurrence:        ____ / ____ / 2026
================================================================================
```
