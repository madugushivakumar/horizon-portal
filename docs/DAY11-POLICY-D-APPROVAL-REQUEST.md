# FORMAL POLICY APPROVAL REQUEST — POLICY D
## Adjustment Semantic Definitions, Accounting Treatment & BigInt Mathematical Invariants

**Document Identifier:** `docs/DAY11-POLICY-D-APPROVAL-REQUEST.md`  
**Policy Identifier:** **POLICY-D**  
**Designated Approver Role:** **Corporate Controller & Lead Architect**  
**Required Secondary Concurrence:** **Lead Financial Auditor & Statutory Compliance Lead**  
**Submission Date:** November 7, 2026  
**Current Status:** **PREPARED — NOT SUBMITTED (PENDING STAKEHOLDER SUBMISSION)**  
**Governing Context:** Day 11 Financial Reconciliation — Horizon Portal  
**Governance State:** **GATE 1: LOCKED — NO FINANCIAL EXECUTION AUTHORIZED**  

---

## 1. Executive Summary

This formal approval request is submitted to establish the accounting model, semantic adjustment classifications, and technical integer-paise mathematical invariants governing the Horizon Portal payroll reconciliation ledger.

To prevent confusion between non-cash reporting reconciliations and actual balance-sheet financial liabilities, strict semantic types and BigInt precision rules are defined.

---

## 2. Business & Technical Background

The reconciliation engine uses 64-bit JavaScript `BigInt` representing integer paise ($1\text{ INR} = 100\text{ paise}$) to eliminate IEEE-754 floating-point drift. Corporate accounting sign-off is required to formalize the three distinct adjustment semantic types and database limit assertions.

---

## 3. Evidence Supporting the Decision

- Verified that all 2,469 payslips balance to the exact paisa ($0\text{ paise}$ error).
- Proven that SQLite signed 64-bit integers ($-2^{63}$ to $2^{63}-1$) safely represent all multi-crore amounts without overflow.
- **Classification Standard Reference:** [`docs/DAY11-DISCREPANCY-CLASSIFICATION-STANDARD.md`](file:///c:/Users/Madugu%20Shiva%20Kumar/OneDrive/图片/Desktop/horizon-portal/docs/DAY11-DISCREPANCY-CLASSIFICATION-STANDARD.md) and [`docs/DAY11-ADJUSTMENT-TAXONOMY-RECONCILIATION.md`](file:///c:/Users/Madugu%20Shiva%20Kumar/OneDrive/图片/Desktop/horizon-portal/docs/DAY11-ADJUSTMENT-TAXONOMY-RECONCILIATION.md).

---

## 4. Exact Policy Decision Requested & Proposed Policy Wording

The Corporate Controller & Lead Architect are requested to authorize the following formal policy statement:

> **Proposed Policy D Wording (Rule D.1):**  
> *"The Horizon Portal payroll reconciliation engine and adjustment ledger shall enforce: (1) A Two-Dimensional Adjustment Taxonomy: Dimension A (Accounting Nature: `HISTORICAL_REPORTING_RECONCILIATION` [0 cash/liability impact], `PRE_APPROVAL_HEADER_ALIGNMENT` [operational batch target alignment prior to payment], and `FINANCIAL_ADJUSTMENT_CLAIM` [monetary balance sheet claim]) and Dimension B (Adjustment Reason: `RETROACTIVE_ADDITION`, `JOINING_DATE_ALIGNMENT`, `TAX_WITHHOLDING_RECALIBRATION`, `COMPONENT_RECLASSIFICATION`, `ARREARS_PAYMENT` [financial claim only]); (2) Exact BigInt integer paise arithmetic ($1\text{ INR} = 100\text{ paise}$) for all financial comparisons; (3) SQLite signed 64-bit boundary validation (`assertSqliteInt64`); (4) The immutable formula: $\text{Variance} = \text{Itemized Total} - \text{Stored Header Total}$; and (5) Monotonic revision sequencing and snapshot preservation."*

---

## 5. Risks & Implications

1. **If Approved as Proposed:**
   - Eliminates rounding drift and guarantees 100% mathematical auditability.
   - Prevents conflation of reporting footnotes with cash disbursement claims.
2. **If Rejected:**
   - Ad-hoc float calculations risk penny-rounding errors and statutory non-compliance.

---

## 6. Required Approval Authority & Secondary Concurrence

- **Primary Approver:** Corporate Controller & Lead Architect
- **Required Secondary Concurrence:** Lead Financial Auditor & Statutory Compliance Lead

---

## 7. Supporting Evidence References

- Calculation Engine: [`src/lib/payroll/reconciliation-engine.ts`](file:///c:/Users/Madugu%20Shiva%20Kumar/OneDrive/图片/Desktop/horizon-portal/src/lib/payroll/reconciliation-engine.ts)
- Test Suite: [`scripts/test-day11-payroll-reconciliation.ts`](file:///c:/Users/Madugu%20Shiva%20Kumar/OneDrive/图片/Desktop/horizon-portal/scripts/test-day11-payroll-reconciliation.ts)
- Evidence Register: [`docs/DAY11-STAKEHOLDER-APPROVAL-EVIDENCE-REGISTER.md`](file:///c:/Users/Madugu%20Shiva%20Kumar/OneDrive/图片/Desktop/horizon-portal/docs/DAY11-STAKEHOLDER-APPROVAL-EVIDENCE-REGISTER.md)

---

## 8. Conditions and Limitations

1. **Read-Only Scope:** Policy approval does not authorize creating adjustment rows in `payroll_adjustments` until Gate 1 is released.
2. **Invariant Rule:** Every transaction must enforce $\text{Gross} - \text{Deductions} \equiv \text{Net}$.

---

## 9. Stakeholder Review, Decision Options & Signature Block

```text
================================================================================
STAKEHOLDER DECISION & SIGN-OFF SECTION
================================================================================
Policy Identifier:   POLICY-D (Adjustment Semantics & BigInt Invariants)
Primary Authority:   Corporate Controller & Lead Architect
Secondary Authority: Lead Financial Auditor & Statutory Compliance Lead

DECISION OPTIONS (Select exactly one):
[   ] 1. APPROVE AS PROPOSED (Adopt Rule D.1 standards as official corporate policy)
[   ] 2. REJECT (Require alternative financial calculation/ledger framework)
[   ] 3. APPROVE WITH AMENDMENTS (Specify exact approved wording/terms below)
[   ] 4. REQUEST ADDITIONAL EVIDENCE (Specify required documents/analyses below)
[   ] 5. DEFER DECISION (Specify deferral reason and target review date below)

Stakeholder Amendments / Specific Directives / Evidence Requests:
________________________________________________________________________________
________________________________________________________________________________
________________________________________________________________________________

Primary Approver Name:      [NOT PROVIDED — Pending Corporate Designation]
Primary Approver Role:      [Corporate Controller & Lead Architect]
Evidence Reference:         [PENDING — Awaiting Signed Executive Document]
Signature / Auth:           ____________________________________________________
Date of Decision:           ____ / ____ / 2026

Secondary Concurrence Name: [NOT PROVIDED — Pending Corporate Designation]
Secondary Concurrence Role: [Lead Financial Auditor / Compliance Lead]
Concurrence Signature:      ____________________________________________________
Date of Concurrence:        ____ / ____ / 2026
================================================================================
```
