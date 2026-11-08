# FORMAL POLICY APPROVAL REQUEST — POLICY C
## Accounting Treatment & Immutability Rules for Disbursed Historical Run (August 2026)

**Document Identifier:** `docs/DAY11-POLICY-C-APPROVAL-REQUEST.md`  
**Policy Identifier:** **POLICY-C**  
**Designated Approver Role:** **VP Statutory Compliance & Legal Counsel**  
**Required Secondary Concurrence:** **Corporate Controller & Chief Financial Officer (CFO)**  
**Submission Date:** November 7, 2026  
**Current Status:** **PREPARED — NOT SUBMITTED (PENDING STAKEHOLDER SUBMISSION)**  
**Governing Context:** Day 11 Financial Reconciliation — Horizon Portal  
**Target Scope:** August 2026 (`PR-2026-08`)  
**Governance State:** **GATE 1: LOCKED — NO FINANCIAL EXECUTION AUTHORIZED**  

---

## 1. Executive Summary

This formal approval request is submitted to establish the accounting and audit treatment for the historically disbursed August 2026 payroll run (`PR-2026-08`).

Because funds for August 2026 were fully disbursed on September 1, 2026 (`status: PAID`, `pay_date: 2026-09-01`), altering the historical run header retrospectively would violate statutory financial record retention and audit trail standards. This request seeks approval to designate the discrepancy as a non-destructive reporting reconciliation entry without modifying the disbursed header row.

---

## 2. Business & Technical Background

The August 2026 payroll run is in `PAID` operational status. A variance exists between the stored batch header and the verified itemized payslips:
- Stored Header: Headcount `429` | Gross `₹48,685,007.97` | Net `₹43,173,318.36` | Implied Deductions `₹5,511,689.61`
- Itemized Payslips: Headcount `424` | Gross `₹47,847,409.45` | Net `₹42,467,961.37` | Deductions `₹5,379,448.08`
- Discrepancy: Headcount **-5 employees**, Gross **-₹837,598.52**, Deductions **-₹132,241.53**, Net **-₹705,356.99**

---

## 3. Evidence Supporting the Decision

- All 424 active employees as of August 31, 2026 received a verified August payslip ($0\text{ paise}$ error).
- The remaining 17 employees (`EMP-0729` to `EMP-0745`) joined in September 2026 and were legally ineligible.
- **Audit Finding:**
  > The stored payroll header reports 429 employees, while the itemized payslip dataset contains 424 employees. This produces an unexplained header-to-roster headcount difference of five. The available evidence does not independently establish that these represent approved budgeted vacancies.  
  > `Budgeted-vacancy explanation: NOT VERIFIED`
- **Canonical Classification:**
  - **Level 1 (Broad Governance):** **Category 4 — Upstream Planning or Reporting Variance** (Governing standard per [`docs/DAY11-DISCREPANCY-CLASSIFICATION-STANDARD.md`](file:///c:/Users/Madugu%20Shiva%20Kumar/OneDrive/图片/Desktop/horizon-portal/docs/DAY11-DISCREPANCY-CLASSIFICATION-STANDARD.md)).
  - **Level 2 (Specific Causal Hypothesis):** `TIMING_AND_ROSTER_LAG` — Retained strictly as an unverified engineering hypothesis per [`docs/DAY11-DISCREPANCY-CLASSIFICATION-RECONCILIATION.md`](file:///c:/Users/Madugu%20Shiva%20Kumar/OneDrive/图片/Desktop/horizon-portal/docs/DAY11-DISCREPANCY-CLASSIFICATION-RECONCILIATION.md).

---

## 4. Exact Policy Decision Requested & Proposed Policy Wording

The VP Statutory Compliance is requested to authorize the following formal policy statement:

> **Proposed Policy C Wording (Rule C.1):**  
> *"Historically disbursed payroll runs in `PAID` status (`PR-2026-08`) are strictly immutable. The original row in `payroll_runs`, its `PAID` status, its payment date, and its stored header figures shall not be modified or overwritten. A non-destructive reporting entry of Dimension A type `HISTORICAL_REPORTING_RECONCILIATION` with Dimension B reason `JOINING_DATE_ALIGNMENT` may be recorded in `payroll_adjustments` to document the -₹837,598.52 variance as an unadjusted Category 4 upstream planning variance. This entry shall generate zero cash movement, zero general ledger liability, zero employee clawback, and zero tax base modification."*

---

## 5. Risks & Implications

1. **If Approved as Proposed:**
   - Preserves legal and statutory audit trail without altering historical tax withholdings.
   - Transparently accounts for the variance in management footnotes.
2. **If Rejected:**
   - Run permanently remains flagged as `MISMATCH` with no formal accounting resolution footnote.

---

## 6. Required Approval Authority & Secondary Concurrence

- **Primary Approver:** VP Statutory Compliance & Legal Counsel
- **Required Secondary Concurrence:** Corporate Controller & Chief Financial Officer (CFO)

---

## 7. Supporting Evidence References

- Historical Payslip Audit: `03_Data_Pack/payslips.json` (Items `PI-006488` to `PI-006911`)
- August Root Cause: [`docs/DAY11-AUGUST-2026-ROOT-CAUSE.md`](file:///c:/Users/Madugu%20Shiva%20Kumar/OneDrive/图片/Desktop/horizon-portal/docs/DAY11-AUGUST-2026-ROOT-CAUSE.md)
- Evidence Register: [`docs/DAY11-STAKEHOLDER-APPROVAL-EVIDENCE-REGISTER.md`](file:///c:/Users/Madugu%20Shiva%20Kumar/OneDrive/图片/Desktop/horizon-portal/docs/DAY11-STAKEHOLDER-APPROVAL-EVIDENCE-REGISTER.md)

---

## 8. Conditions and Limitations

1. **Strict Immutability:** Under no circumstances may `payroll_runs.total_gross`, `total_net`, or `status` be overwritten for `PR-2026-08`.
2. **Zero Cash Impact:** Reporting adjustment has exactly ₹0.00 cash or balance-sheet liability impact.
3. **Audit Isolation:** Transaction logging required for any ledger entry.

---

## 9. Stakeholder Review, Decision Options & Signature Block

```text
================================================================================
STAKEHOLDER DECISION & SIGN-OFF SECTION
================================================================================
Policy Identifier:   POLICY-C (August Historical Disbursed Run Accounting Treatment)
Primary Authority:   VP Statutory Compliance & Legal Counsel
Secondary Authority: Corporate Controller & Chief Financial Officer (CFO)

DECISION OPTIONS (Select exactly one):
[   ] 1. APPROVE AS PROPOSED (Adopt Rule C.1 wording as official corporate policy)
[   ] 2. REJECT (Mandate total database immutability without adjustment entries)
[   ] 3. APPROVE WITH AMENDMENTS (Specify exact approved wording/terms below)
[   ] 4. REQUEST ADDITIONAL EVIDENCE (Specify required documents/analyses below)
[   ] 5. DEFER DECISION (Specify deferral reason and target review date below)

Stakeholder Amendments / Specific Directives / Evidence Requests:
________________________________________________________________________________
________________________________________________________________________________
________________________________________________________________________________

Primary Approver Name:      [NOT PROVIDED — Pending Corporate Designation]
Primary Approver Role:      [VP Statutory Compliance & Legal Counsel]
Evidence Reference:         [PENDING — Awaiting Signed Executive Document]
Signature / Auth:           ____________________________________________________
Date of Decision:           ____ / ____ / 2026

Secondary Concurrence Name: [NOT PROVIDED — Pending Corporate Designation]
Secondary Concurrence Role: [Corporate Controller / CFO]
Concurrence Signature:      ____________________________________________________
Date of Concurrence:        ____ / ____ / 2026
================================================================================
```
