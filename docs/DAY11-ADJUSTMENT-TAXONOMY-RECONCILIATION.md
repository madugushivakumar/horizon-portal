# DAY 11 — ADJUSTMENT TAXONOMY RECONCILIATION REPORT
## Multi-Dimensional Framework Distinguishing Accounting Nature & Adjustment Reason

**Project:** Aura Workforce by Growmar — Horizon Portal  
**Phase:** Phase 3 — Day 11: Admin Payroll Run Console  
**Date:** November 7, 2026  
**Auditor Roles:** Senior Enterprise Governance Architect, Financial Controls Analyst, Corporate Accounting Policy Analyst, Payroll Systems Architect  
**Repository:** `horizon-portal`  
**Current Branch:** `main`  
**Release Tag:** `phase-3` (Commit: `57ebcba5237d18eb053b1165a6e9795080ed907b`)  
**Scope:** Resolution of Inconsistency 2 — Reconciling the 2-Type Accounting Model and the 5-Type Reason Taxonomy  

---

## 1. Executive Summary & Problem Formulation

Earlier Day 11 governance documentation and database schema design defined two primary operational/accounting adjustment types:
1. `HISTORICAL_REPORTING_RECONCILIATION` (or in schema: `HISTORICAL_REPORTING_ADJUSTMENT`)
2. `FINANCIAL_ADJUSTMENT_CLAIM` (alongside `PRE_APPROVAL_CORRECTION`)

Subsequently, master governance deliverables introduced five specific adjustment categories:
1. `RETROACTIVE_ADDITION`
2. `JOINING_DATE_ALIGNMENT`
3. `TAX_WITHHOLDING_RECALIBRATION`
4. `COMPONENT_RECLASSIFICATION`
5. `ARREARS_PAYMENT`

An audit inconsistency was identified: mixing these two classification lists without an explicit dimensional definition created ambiguity regarding whether an adjustment alters financial liabilities or is merely a reporting disclosure footnote.

This report establishes a **Two-Dimensional Adjustment Taxonomy Model** that cleanly separates **Accounting & Financial Nature (Dimension A)** from **Specific Adjustment Reason / Trigger (Dimension B)**. In strict accordance with governance standards, this framework is treated as a **formal design proposal** pending stakeholder approval under Policies C and D.

---

## 2. The Two-Dimensional Adjustment Architecture

```
+---------------------------------------------------------------------------------------------------------+
|                                DIMENSION A: ACCOUNTING & FINANCIAL NATURE                               |
|                               (Stored in `adjustment_type` / Governed by Policy D)                      |
+---------------------------------------------------------------------------------------------------------+
|                                                                                                         |
|  1. HISTORICAL_REPORTING_RECONCILIATION                                                                 |
|     - Reporting-only reconciliation entry for disbursed historical runs (e.g., PR-2026-08).             |
|     - Exactly ZERO cash movement, ZERO general ledger liabilities, ZERO clawbacks.                      |
|     - Does NOT modify historical `payroll_runs` header row or disbursement date.                        |
|     - Preserves original figures while linking an immutable audit footnote.                            |
|                                                                                                         |
|  2. PRE_APPROVAL_HEADER_ALIGNMENT (or PRE_APPROVAL_CORRECTION)                                          |
|     - Operational batch adjustment on unapproved, in-flight runs (e.g., PR-2026-09).                    |
|     - Aligns preliminary batch header to verified itemized payslips BEFORE funds disbursement.          |
|     - Replaces unverified preliminary estimate; enforces Maker-Checker sign-off.                       |
|                                                                                                         |
|  3. FINANCIAL_ADJUSTMENT_CLAIM                                                                          |
|     - Genuine financial claim affecting employee compensation entitlement, balance sheet, or taxes.     |
|     - Generates real monetary payable/receivable and general ledger movement.                           |
|     - Requires full executive approval, bank UTR tracking, and statutory tax reconciliation.            |
+---------------------------------------------------------------------------------------------------------+
                                                     ^
                                                     |  (Parameterized by)
                                                     v
+---------------------------------------------------------------------------------------------------------+
|                                DIMENSION B: SPECIFIC ADJUSTMENT REASON / NATURE                         |
|                                   (Stored in `reason` / Governed by Policy C & D)                       |
+---------------------------------------------------------------------------------------------------------+
|  1. RETROACTIVE_ADDITION            - Onboarding or roster addition effective retrospectively.          |
|  2. JOINING_DATE_ALIGNMENT          - Correction or verification of employee employment commencement.   |
|  3. TAX_WITHHOLDING_RECALIBRATION   - Statutory TDS, PF, or professional tax calculation recalibration. |
|  4. COMPONENT_RECLASSIFICATION      - Reallocation across salary components (Basic, HRA, Allowance).    |
|  5. ARREARS_PAYMENT                 - Disbursement of previously unpaid compensation entitlements.      |
+---------------------------------------------------------------------------------------------------------+
```

---

## 3. Mandatory Adjustment Taxonomy Matrix

The following matrix formally defines the permitted intersections between Dimension A (Accounting Nature) and Dimension B (Adjustment Reason), establishing the required evidence and approval authorities:

| Specific Adjustment Reason (Dimension B) | Reporting-Only Possible? (Dimension A: `HISTORICAL_REPORTING_RECONCILIATION`) | Financial Claim Possible? (Dimension A: `FINANCIAL_ADJUSTMENT_CLAIM`) | Pre-Approval Alignment Possible? (Dimension A: `PRE_APPROVAL_CORRECTION`) | Mandatory Evidence Required | Required Approval Authority |
|---|:---:|:---:|:---:|---|---|
| **`RETROACTIVE_ADDITION`** | **YES**<br>*(e.g., Explaining historical roster omission where employee was already paid off-system)* | **YES**<br>*(e.g., Retroactively adding an unpaid employee and issuing back pay)* | **YES**<br>*(e.g., Adding an omitted active employee to an unapproved in-flight batch)* | Signed employment contract, approved offer letter, active attendance logs, verified PAN/tax records. | Primary: Corporate Controller<br>Secondary: VP Human Resources |
| **`JOINING_DATE_ALIGNMENT`** | **YES**<br>*(e.g., Explaining why header counted 5 non-starters in August without altering pay)* | **YES**<br>*(e.g., Changing hire date from 15th to 1st, generating 15 days of pro-rated back pay)* | **YES**<br>*(e.g., Excluding October future joiners EMP442-444 from September batch header)* | HR Master onboarding record, signed joining report, manager attendance confirmation. | Primary: VP Human Resources<br>Secondary: Corporate Controller |
| **`TAX_WITHHOLDING_RECALIBRATION`** | **YES**<br>*(e.g., Reclassifying statutory reporting disclosure categories without cash transfer)* | **YES**<br>*(e.g., Correcting under-withheld TDS, requiring adjusted tax remittance to IT Department)* | **YES**<br>*(e.g., Recalculating provisional tax withholdings before final batch approval)* | Detailed tax computation sheet, investment proof verification, Form 16 reconciliation, statutory rule. | Primary: VP Statutory Compliance<br>Secondary: Corporate Controller |
| **`COMPONENT_RECLASSIFICATION`** | **YES**<br>*(e.g., Reallocating ₹10,000 from Special Allowance to HRA with ₹0 net change)* | **YES**<br>*(e.g., Reclassifying non-taxable allowance to taxable, creating retrospective tax liability)* | **YES**<br>*(e.g., Updating salary structure components on in-flight run prior to posting)* | Compensation committee salary structure annexure, employee grade band mapping, tax impact analysis. | Primary: Head of Global Payroll<br>Secondary: Corporate Controller |
| **`ARREARS_PAYMENT`** | ❌ **NO (PROHIBITED)**<br>*(Arrears inherently represent monetary payment; cannot be non-cash reporting-only)* | **YES**<br>*(Disbursing accrued, unpaid compensation owed from prior periods)* | ❌ **NO (PROHIBITED)**<br>*(Cannot be pre-approval header alignment without itemized payslip issuance)* | Formal compensation revision letter, performance bonus sign-off, board resolution, attendance proof. | Primary: Chief Financial Officer (CFO)<br>Secondary: Corporate Controller |

---

## 4. Evaluation of Current Target Runs Under the Proposed Model

### 4.1 August 2026 (`PR-2026-08`): Disbursed Historical Run
- **Proposed Dimension A (Accounting Nature):** `HISTORICAL_REPORTING_RECONCILIATION`
  - Zero cash movement.
  - Zero payable or receivable.
  - Original `payroll_runs` row (`status: PAID`, `pay_date: 2026-09-01`) remains **100% immutable**.
- **Proposed Dimension B (Adjustment Reason):** `JOINING_DATE_ALIGNMENT`
  - Reconciles the -5 headcount variance by documenting that 17 employees onboarded in September, and the preliminary header erroneously included non-active headcount.
- **Governing Approval:** Formal sign-off required from **VP Statutory Compliance** and **Corporate Controller** under Policy C.

### 4.2 September 2026 (`PR-2026-09`): In-Flight Unapproved Run
- **Proposed Dimension A (Accounting Nature):** `PRE_APPROVAL_HEADER_ALIGNMENT`
  - Operational correction to batch header prior to approval.
  - Aligns batch header (`444` $\to$ `441` headcount; ₹54,788,660.03 $\to$ ₹54,430,331.52 gross pay) to match the exact itemized payslip total.
  - Generates zero change to employee net pay entitlements (all 441 employees receive 100% of their calculated pay).
- **Proposed Dimension B (Adjustment Reason):** `JOINING_DATE_ALIGNMENT` (accompanied by `SYSTEM_BATCH_HEADER_CALCULATION_DEFECT` technical note)
  - Documents that `EMP00442`, `EMP00443`, and `EMP00444` join in October 2026 and should not be counted in September.
- **Governing Approval:** Formal sign-off required from **Head of FP&A** and **Corporate Controller** under Policy B.

---

## 5. Answers to Mandatory Governance Questions

### 5.1 What kind of accounting treatment is being performed?
Dimension A explicitly categorizes the accounting treatment into:
- Reporting-Only Reconciliation (footnote disclosure, zero ledger impact).
- Pre-Approval Operational Alignment (in-flight batch synchronization).
- Financial Claim (monetary payable/receivable altering balance sheet).

### 5.2 Why is the adjustment being requested?
Dimension B explicitly documents the business reason (Retroactive Addition, Joining-Date Alignment, Tax Recalibration, Component Reclassification, Arrears Payment).

### 5.3 What financial fields may be affected?
- For `HISTORICAL_REPORTING_RECONCILIATION`: **Zero database financial fields in `payroll_runs` or `payslips` are altered.** The adjustment record stores snapshots of original vs. itemized figures in `payroll_adjustments` for audit reporting.
- For `PRE_APPROVAL_HEADER_ALIGNMENT`: Only the unapproved batch header fields (`total_gross`, `total_net`, `employees_paid`) in `payroll_runs` are aligned. No payslips are altered.
- For `FINANCIAL_ADJUSTMENT_CLAIM`: Detailed ledger entries are generated affecting compensation expense and liabilities.

### 5.4 Does employee entitlement change?
- For August (`PR-2026-08`): **NO.** All 424 employees keep their disbursed pay.
- For September (`PR-2026-09`): **NO.** All 441 employees receive their exact itemized payslip amounts.

### 5.5 Does actual cash movement occur?
- For August (`PR-2026-08`): **NO CASH MOVEMENT.**
- For September (`PR-2026-09`): **NO CASH IMPACT BEYOND VERIFIED PAYSLIPS.** (Disbursement matches verified itemized net pay: ₹48,443,478.43).

### 5.6 Who can approve it?
Primary and secondary authorities are established in Section 3's matrix (CFO, Corporate Controller, VP Statutory Compliance, Head of FP&A, VP HR).

### 5.7 Who can execute it?
Only an authenticated finance manager distinct from the preparer (`preparerId !== approverId`), executing within an isolated serializable transaction under an explicit Key 2 authorization voucher.

---

## 6. Schema and Technical Alignment

In the existing Prisma schema ([`prisma/schema.prisma`](file:///c:/Users/Madugu%20Shiva%20Kumar/OneDrive/图片/Desktop/horizon-portal/prisma/schema.prisma)):
- Field `adjustmentType` stores **Dimension A** (`HISTORICAL_REPORTING_ADJUSTMENT` | `PRE_APPROVAL_CORRECTION` | `FINANCIAL_ADJUSTMENT_CLAIM`).
- Field `reason` stores **Dimension B** (e.g., `JOINING_DATE_ALIGNMENT: Preliminary header counted 5 future joiners`).

**Database Invariant:** No schema changes or row insertions are made during this governance stage. The model is 100% compatible with the existing schema.

