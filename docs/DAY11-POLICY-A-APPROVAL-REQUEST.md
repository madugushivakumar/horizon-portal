# FORMAL POLICY APPROVAL REQUEST — POLICY A
## Authoritative Financial Source of Truth for Payroll Calculation & Summaries

**Document Identifier:** `docs/DAY11-POLICY-A-APPROVAL-REQUEST.md`  
**Governing Decision Proposal:** [`docs/DAY11-POLICY-A-SOURCE-OF-TRUTH-DECISION.md`](file:///c:/Users/Madugu%20Shiva%20Kumar/OneDrive/图片/Desktop/horizon-portal/docs/DAY11-POLICY-A-SOURCE-OF-TRUTH-DECISION.md)  
**Policy Identifier:** **POLICY-A**  
**Designated Approver Role:** **Chief Financial Officer (CFO) / Corporate Controller**  
**Required Secondary Concurrence:** **VP Human Resources & Head of Payroll Operations**  
**Submission Date:** November 7, 2026  
**Current Status:** **PREPARED — NOT SUBMITTED (PENDING STAKEHOLDER SUBMISSION)**  
**Governing Context:** Day 11 Financial Reconciliation — Horizon Portal  
**Governance State:** **GATE 1: LOCKED — NO FINANCIAL EXECUTION AUTHORIZED**  

---

## 1. Executive Summary

This formal approval request is submitted to establish the official corporate accounting source-of-truth hierarchy between summary payroll run headers and itemized employee payslips.

Under existing system records, summary run headers in `payroll_runs` diverge from the mathematical aggregation of itemized payslips across all six monthly runs (April 2026 to September 2026). In 100% of the 2,469 payslips, individual line-item math balances exactly ($\text{Gross} - \text{Deductions} \equiv \text{Net}$). All 441 corporate employees are accounted for.

Corporate executive sign-off is required to establish whether itemized payslips govern downstream financial reconciliation or whether stored headers represent inviolable disbursement ceilings.

---

## 2. Business & Technical Background

The Horizon Portal payroll system maintains two distinct tiers of payroll records:
1. **Summary Run Headers (`payroll_runs` table):** Contains high-level aggregate figures (`employees_paid`, `total_gross`, `total_net`) for monthly pay cycles.
2. **Itemized Payslips (`payslips` table):** Contains individual employee-level records detailing discrete earnings (basic, HRA, allowances, overtime, variable pay) and statutory deductions (PF, ESI, professional tax, TDS).

A variance exists between the stored summary headers and the aggregation of itemized payslips in both September 2026 (`PR-2026-09`) and August 2026 (`PR-2026-08`). Corporate executive sign-off is required to establish the official source-of-truth hierarchy.

---

## 3. Evidence Supporting the Decision

All figures are calculated directly from `03_Data_Pack/` source files using exact 64-bit integer paise ($1\text{ INR} = 100\text{ paise}$):

### 3.1 August 2026 (`PR-2026-08`) — Disbursed Historical Run
- **Stored Header:** Headcount: `429` | Gross: `₹48,685,007.97` | Net: `₹43,173,318.36` | Implied Deductions: `₹5,511,689.61` | Status: `PAID`
- **Itemized Payslips (424 items):** Headcount: `424` | Gross: `₹47,847,409.45` | Net: `₹42,467,961.37` | Deductions: `₹5,379,448.08`
- **Reconciliation Variance ($\text{Itemized} - \text{Stored}$):**
  - Headcount: **-5 employees** ($-1.17\%$)
  - Gross Variance: **-₹837,598.52** ($-83,759,852\text{ paise}$, $-1.72\%$)
  - Deductions Variance: **-₹132,241.53** ($-13,224,153\text{ paise}$, $-2.40\%$)
  - Net Variance: **-₹705,356.99** ($-70,535,699\text{ paise}$, $-1.63\%$)
- **Empirical Audit Finding:**
  > The stored payroll header reports 429 employees, while the itemized payslip dataset contains 424 employees. This produces an unexplained header-to-roster headcount difference of five. The available evidence does not independently establish that these represent approved budgeted vacancies.  
  > `Budgeted-vacancy explanation: NOT VERIFIED`

### 3.2 September 2026 (`PR-2026-09`) — In-Flight Unapproved Run
- **Stored Header:** Headcount: `444` | Gross: `₹54,788,660.03` | Net: `₹48,089,678.30` | Implied Deductions: `₹6,698,981.73` | Status: `POSTED - PAYMENT PENDING`
- **Itemized Payslips (441 items):** Headcount: `441` | Gross: `₹54,430,331.52` | Net: `₹47,782,326.60` | Deductions: `₹6,648,004.92`
- **Reconciliation Variance ($\text{Itemized} - \text{Stored}$):**
  - Headcount: **-3 employees** ($-0.68\%$)
  - Gross Variance: **-₹358,328.51** ($-35,832,851\text{ paise}$, $-0.65\%$)
  - Deductions Variance: **-₹50,976.81** ($-5,097,681\text{ paise}$, $-0.76\%$)
  - Net Variance: **-₹307,351.70** ($-30,735,170\text{ paise}$, $-0.64\%$)
- **Empirical Audit Finding:**
  > The stored payroll header reports 444 employees, while the itemized payslip dataset contains 441 employees. This produces an unexplained header-to-roster headcount difference of three. The available evidence does not independently establish that these represent approved budgeted vacancies.  
  > `Budgeted-vacancy explanation: NOT VERIFIED`

### 3.3 Legal Characterization Safeguard:
> **"Payslips are individual employee compensation records in the supplied dataset. Their formal legal and accounting authority for historical reconciliation has not been independently established by the available project evidence."**

---

## 4. Exact Policy Decision Requested & Proposed Policy Wording

The Chief Financial Officer / Corporate Controller is requested to approve the following formal policy statement:

> **Proposed Policy A Wording (Rule A.1):**  
> *"Itemized employee payslips (`payslips` table) are hereby designated as the primary calculation source of truth for individual employee compensation entitlements, statutory deductions, and net disbursements. Where summary payroll run headers (`payroll_runs` table) diverge from the mathematical sum of underlying payslips, summary headers for in-flight runs shall be reconciled to payslip sums prior to payment approval under Policy B. For historically disbursed runs (`PAID`), headers remain immutable and discrepancies shall be handled via non-destructive reporting footnotes under Policy C."*

---

## 5. Risks & Implications

1. **If Approved as Proposed:**
   - Eliminates phantom headcount liabilities; ties in-flight disbursements strictly to verified payees.
   - Requires formal disclosure of why upstream batch headers exceeded payslip totals.
2. **If Rejected:**
   - Headers remain authoritative; in-flight runs cannot be approved because they contain unallocated cash allocations.
   - Requires manual journal arbitration for every cycle.

---

## 6. Required Approval Authority & Secondary Concurrence

- **Primary Approver:** Chief Financial Officer (CFO) / Corporate Controller
- **Required Secondary Concurrence:** VP Human Resources & Head of Payroll Operations

---

## 7. Supporting Evidence References

- Data Packs: `03_Data_Pack/payroll_runs.json`, `03_Data_Pack/payslips.json`, `03_Data_Pack/employees.json`
- Decision Proposal: [`docs/DAY11-POLICY-A-SOURCE-OF-TRUTH-DECISION.md`](file:///c:/Users/Madugu%20Shiva%20Kumar/OneDrive/图片/Desktop/horizon-portal/docs/DAY11-POLICY-A-SOURCE-OF-TRUTH-DECISION.md)
- Classification Standard: [`docs/DAY11-DISCREPANCY-CLASSIFICATION-STANDARD.md`](file:///c:/Users/Madugu%20Shiva%20Kumar/OneDrive/图片/Desktop/horizon-portal/docs/DAY11-DISCREPANCY-CLASSIFICATION-STANDARD.md)
- Classification Reconciliation: [`docs/DAY11-DISCREPANCY-CLASSIFICATION-RECONCILIATION.md`](file:///c:/Users/Madugu%20Shiva%20Kumar/OneDrive/图片/Desktop/horizon-portal/docs/DAY11-DISCREPANCY-CLASSIFICATION-RECONCILIATION.md)
- Adjustment Taxonomy Reconciliation: [`docs/DAY11-ADJUSTMENT-TAXONOMY-RECONCILIATION.md`](file:///c:/Users/Madugu%20Shiva%20Kumar/OneDrive/图片/Desktop/horizon-portal/docs/DAY11-ADJUSTMENT-TAXONOMY-RECONCILIATION.md)
- Evidence Register: [`docs/DAY11-STAKEHOLDER-APPROVAL-EVIDENCE-REGISTER.md`](file:///c:/Users/Madugu%20Shiva%20Kumar/OneDrive/图片/Desktop/horizon-portal/docs/DAY11-STAKEHOLDER-APPROVAL-EVIDENCE-REGISTER.md)

---

## 8. Conditions and Limitations

1. **Gate 1 Preservation:** Approval of Policy A establishes the accounting rule but **does NOT authorize financial execution or database mutation**.
2. **Zero Synthetic Records:** No fictitious payslips may be generated to balance run headers.
3. **Traceability:** Any future reconciliation action must generate an immutable `AuditLog` entry.

---

## 9. Stakeholder Review, Decision Options & Signature Block

```text
================================================================================
STAKEHOLDER DECISION & SIGN-OFF SECTION
================================================================================
Policy Identifier:   POLICY-A (Source-of-Truth Hierarchy for Payroll Reconciliation)
Primary Authority:   Chief Financial Officer (CFO) / Corporate Controller
Secondary Authority: VP Human Resources & Head of Payroll Operations

DECISION OPTIONS (Select exactly one):
[   ] 1. APPROVE AS PROPOSED (Adopt Rule A.1 wording as official corporate policy)
[   ] 2. REJECT (Maintain summary headers as sole governing disbursement ceilings)
[   ] 3. APPROVE WITH AMENDMENTS (Specify exact approved wording/terms below)
[   ] 4. REQUEST ADDITIONAL EVIDENCE (Specify required documents/analyses below)
[   ] 5. DEFER DECISION (Specify deferral reason and target review date below)

Stakeholder Amendments / Specific Directives / Evidence Requests:
________________________________________________________________________________
________________________________________________________________________________
________________________________________________________________________________

Primary Approver Name:      [NOT PROVIDED — Pending Corporate Designation]
Primary Approver Role:      [CFO / Corporate Controller]
Evidence Reference / UTR:   [PENDING — Awaiting Signed Executive Document]
Signature / Auth:           ____________________________________________________
Date of Decision:           ____ / ____ / 2026

Secondary Concurrence Name: [NOT PROVIDED — Pending Corporate Designation]
Secondary Concurrence Role: [VP Human Resources / Head of Payroll]
Concurrence Signature:      ____________________________________________________
Date of Concurrence:        ____ / ____ / 2026
================================================================================
```
