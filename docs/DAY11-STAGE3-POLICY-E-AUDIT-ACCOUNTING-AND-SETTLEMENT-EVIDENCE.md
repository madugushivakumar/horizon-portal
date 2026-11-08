# POLICY E — AUDIT EVIDENCE, ACCOUNTING AND SETTLEMENT GOVERNANCE (AMENDED)
## Aura Workforce by Growmar — Horizon Portal
### Phase 3 — Teams and Insight | Day 11: Admin Payroll Run Console
### Stage 3 of 6: Formal Payroll Governance Package

---

## Document Metadata

| Attribute | Specification |
|---|---|
| **Document ID** | `DAY11-STAGE3-POLICY-E` |
| **Document Title** | Audit Evidence, Accounting Verification and Settlement Governance Policy |
| **Governing Baseline** | Stage 1 Revision 2.1 (`DAY11-POLICY-A-SOURCE-OF-TRUTH-DECISION.md`) & Stage 2 Forensic Report (`DAY11-STAGE2-ROOT-CAUSE-FORENSIC-REPORT.md`) |
| **Supporting Artifact** | [`docs/DAY11-STAGE3-POLICY-E-EXTERNAL-MAPPING-VALIDATION.md`](file:///c:/Users/Madugu%20Shiva%20Kumar/OneDrive/图片/Desktop/horizon-portal/docs/DAY11-STAGE3-POLICY-E-EXTERNAL-MAPPING-VALIDATION.md) |
| **Status** | `PROPOSED — APPROVAL PENDING` |
| **Governance Gate** | Gate 1 Locked (`GATE 1: LOCKED — FINANCIAL EXECUTION NOT AUTHORIZED`) |
| **Effective Date** | Pending Chief Financial Officer, Corporate Controller & Internal Audit Ratification |
| **Target Audience** | Enterprise Internal Audit, Statutory Accounting, Treasury, Tax Operations, Payroll Engineering |

---

## 1. Executive Summary & Policy Objective

Policy E defines the enterprise standards for **evidentiary sufficiency**, **General Ledger (GL) balance tie-out**, **bank settlement confirmation**, and **statutory remittance verification** across the entire payroll lifecycle in Aura Workforce Horizon Portal.

The Stage 1 and Stage 2 forensic investigations revealed a fundamental governance vulnerability:
- The presence of itemized payslips summing to a mathematical figure does not, by itself, prove legal entitlement or actual disbursement.
- The presence of a stored database flag `'PAID'` does not, by itself, prove that bank debits or statutory remittances were executed.

To prevent unverified accounting conclusions, Policy E institutes the **Tripartite Evidence Principle**:
$$\text{Reconciliation Authority} = \text{Internal Calculation Math} \cap \text{General Ledger Postings} \cap \text{External Bank/Tax Settlement}$$

Under Policy E, a payroll run cannot be deemed legally, operationally, or accounting-reconciled unless all three evidentiary pillars are validated.

> [!IMPORTANT]
> **GATE 1 NOTICE:** This policy is currently `PROPOSED — APPROVAL PENDING`. No external GL journal adjustments, bank tie-outs, or statutory declarations are authorized until Gate 1 is formally unlocked.

---

## 2. Audit Evidence Requirements Across the Payroll Lifecycle

Policy E establishes mandatory evidentiary artifacts across each of the six lifecycle states defined in Policy C:

```
+---------------------------------------------------------------------------------------------------+
|                               PAYROLL LIFECYCLE EVIDENTIARY ARTIFACTS                             |
+---------------------------------------------------------------------------------------------------+
|  1. CALCULATION        Approved timecards, salary roster hash, calculation engine version         |
|  2. RECONCILIATION     Variance analysis report, Stage 1/2 variance classifications, maker check  |
|  3. APPROVAL           Dual cryptographic approval signatures, MFA token verification, role auth  |
|  4. DISBURSEMENT       Corporate payment file (NACH/NEFT), gateway batch transmission token       |
|  5. SETTLEMENT         Bank statement debit confirmation, individual UTR numbers, zero uncashed   |
|  6. STATUTORY          EPFO ECR + TRRN, ESIC Challan, Income Tax ITNS 281 (BSR/CIN), Form 24Q     |
+---------------------------------------------------------------------------------------------------+
```

---

## 3. Evaluation of Existing Application Audit Logging (`audit_logs`)

### 3.1 Live Database Inspection
A forensic query of the live database (`prisma/dev.db`) reveals:
- Total audit log records: **87 rows**.
- Table schema: 12 columns (`id`, `event_id`, `actor_id`, `actor_email`, `actor_role`, `action`, `employee_id`, `field_name`, `old_value`, `new_value`, `details`, `created_at`).
- Existing distinct actions: `EMPLOYEE_CREATED`, `EMPLOYEE_EXPORTED`, `EMPLOYEE_UPDATED`, `LEAVE_APPROVED`, `LEAVE_DELEGATED`, `LEAVE_REJECTED`.

### 3.2 Audit Gap Analysis for Payroll Operations
1. **Zero Payroll Audit Records in Database:** Despite 18 payroll runs and 2,469 payslips, there are **zero rows** in `audit_logs` tracking payroll lifecycle actions (`PAYROLL_CALCULATED`, `PAYROLL_APPROVED`, `PAYROLL_DISBURSED`, `PAYROLL_ADJUSTED`).
2. **Missing Entity Foreign Key:** The `audit_logs` table contains `employee_id`, but lacks dedicated `payroll_run_id` or `adjustment_id` columns.
3. **No Cryptographic Hash Chaining:** Audit log entries lack a `record_hash` or `parent_hash`, making them vulnerable to undetected row deletions or alterations if direct database access occurs.

---

## 4. General Ledger (GL) Evidence Standards & Account Classification (Issue 5 Resolution)

The comprehensive GL account classification is documented in [`docs/DAY11-STAGE3-POLICY-E-EXTERNAL-MAPPING-VALIDATION.md`](file:///c:/Users/Madugu%20Shiva%20Kumar/OneDrive/图片/Desktop/horizon-portal/docs/DAY11-STAGE3-POLICY-E-EXTERNAL-MAPPING-VALIDATION.md).

### 4.1 Formal Classification of Proposed GL Accounts
The repository contains **no corporate chart of accounts file** and **no general ledger journal vouchers**. Therefore, all proposed GL codes are classified as:
$$\mathbf{PROPOSED\_EXAMPLE\_ONLY\ —\ UNVERIFIED\ —\ EXTERNAL\_EVIDENCE\_REQUIRED}$$

| Proposed Account Code | Proposed Account Description | Normal Balance | Accounting Function | Repository Status | Governance Classification |
|---|---|---|---|---|---|
| `GL-6100` | Payroll Expense (Salaries & Wages) | Debit | Gross pay liability of the company | Unverified in repo | `PROPOSED_EXAMPLE_ONLY` |
| `GL-2110` | Statutory Deductions Payable — PF | Credit | Employer + Employee PF payable to EPFO | Unverified in repo | `PROPOSED_EXAMPLE_ONLY` |
| `GL-2120` | Statutory Deductions Payable — ESIC | Credit | Employer + Employee ESIC payable to ESIC | Unverified in repo | `PROPOSED_EXAMPLE_ONLY` |
| `GL-2130` | Statutory Deductions Payable — TDS | Credit | Withheld income tax payable to Central Govt | Unverified in repo | `PROPOSED_EXAMPLE_ONLY` |
| `GL-2140` | Statutory Deductions Payable — PT | Credit | Professional tax payable to State Govt | Unverified in repo | `PROPOSED_EXAMPLE_ONLY` |
| `GL-2100` | Net Salaries Payable (Clearing Account) | Credit | Net salaries owed to employees | Unverified in repo | `PROPOSED_EXAMPLE_ONLY` |
| `GL-1010` | Corporate Payroll Bank Account | Credit | Treasury cash disbursement account | Unverified in repo | `PROPOSED_EXAMPLE_ONLY` |

### 4.2 Aggregates vs. Ledger Balances
The internal mathematical sum of 2,469 payslips is an **internal payroll aggregate**, not a verified General Ledger balance. The Corporate Controller must supply the official chart of accounts before Stage 4 integration.

---

## 5. Banking and Payment Settlement Evidence Standards (Issue 5 Resolution)

### 5.1 Payment Instruction vs. Settlement Reality
Policy E draws a strict distinction between:
- **Payment Instruction (Initiation):** An administrative action indicating an authorized payment batch file was generated or dispatched.
- **Payment Settlement (Finality):** Irrevocable debit from the corporate bank account verified by bank statements and bank-issued settlement clearing records.

### 5.2 Payment Batching & UTR Matching Mechanics
In enterprise payroll operations:
1. **Batch Debit Statement:** Corporate bank accounts typically reflect a **single consolidated debit entry** for the bulk transfer file (e.g., via NACH / bulk NEFT).
2. **Individual Beneficiary Credits:** The clearinghouse (RBI / clearing bank) assigns individual Unique Transaction Reference (UTR) numbers to each employee credit transaction.
3. **Hybrid Settlement Verification:** Settlement requires proving:
   $$\text{Corporate Bank Statement Batch Debit} \equiv \sum \text{Employee Net Credits} + \text{Returned/Bounced Payments}$$

### 5.3 Repository Banking Status
No bank statements or UTR numbers exist in the repository.  
- **Formal Status Classification:** $\mathbf{BANK\_SETTLEMENT\_EVIDENCE\_NOT\_PROVIDED}$.
- **Stored `'PAID'` Flag:** Stored status flags represent internal workflow marks and do **not** constitute proof of bank settlement.

---

## 6. Statutory Remittance Evidence Standards (Issue 5 Resolution)

References to Indian statutory compliance represent **regulatory standards requiring external verification**, not verified facts:
- **EPFO (Employees' Provident Fund):** Requires Electronic Challan cum Return (ECR) + Temporary Return Reference Number (TRRN) payment receipt. Status: `NOT_PROVIDED`.
- **ESIC (Employees' State Insurance):** Requires monthly return + 17-digit Challan payment receipt. Status: `NOT_PROVIDED`.
- **Income Tax TDS (Section 192):** Requires monthly Challan ITNS 281 (BSR code, CIN) + quarterly Form 24Q filing. Status: `NOT_PROVIDED`.
- **Professional Tax:** Requires monthly/annual state return + challan. Status: `NOT_PROVIDED`.

All historical runs (`PR-2026-04` through `PR-2026-09`) are formally designated as having **Statutory Remittance Evidence Gaps**.

---

## 7. The Tripartite Evidence Hierarchy

```
+---------------------------------------------------------------------------------------------------+
|                                  TRIPARTITE EVIDENCE HIERARCHY                                    |
+---------------------------------------------------------------------------------------------------+
|  CATEGORY 1: Mathematical Calculation Evidence (Internal payslips, integer paise math)           |
|              --> Proves: Arithmetic consistency within the dataset.                               |
|              --> Does NOT prove: Legal entitlement, GL balance, or bank disbursement.             |
|                                                                                                   |
|  CATEGORY 2: General Ledger Accounting Evidence (Approved ERP chart of accounts, journals)        |
|              --> Proves: Corporate financial statement liability recognition.                     |
|              --> Does NOT prove: Third-party banking settlement.                                  |
|                                                                                                   |
|  CATEGORY 3: Bank & Statutory Settlement Evidence (Bank statement debits, UTRs, challans)         |
|              --> Proves: Actual cash flow discharge and legal statutory compliance.               |
+---------------------------------------------------------------------------------------------------+
```

---

## 8. Master Decision Register Updates (Policy E)

| Decision ID | Decision Title | Scope of Decision | Recommendation | Approving Authority | Current Status |
|---|---|---|---|---|---|
| **DEC-E-01** | Tripartite Evidence Mandate | Mandatory requirement for mathematical, GL, and banking evidence. | Adopt Tripartite Evidence Hierarchy; internal math alone cannot authorize `'RECONCILED'`. | Chief Financial Officer | `PROPOSED — APPROVAL PENDING` |
| **DEC-E-02** | Classification of Historical Evidence Gaps | Formal declaration regarding missing external bank and tax records. | Formally classify historical runs as `BANK_SETTLEMENT_EVIDENCE_NOT_PROVIDED` and `STATUTORY_EVIDENCE_NOT_PROVIDED`. | Head of Internal Audit | `PROPOSED — APPROVAL PENDING` |
| **DEC-E-03** | Audit Log Schema Expansion | Technical expansion of `audit_logs` table in Stage 4+. | Approve non-breaking migration adding `payroll_run_id`, `adjustment_id`, and hash chaining. | Lead Systems Architect | `PROPOSED — APPROVAL PENDING` |
| **DEC-E-04** *(New)* | Chart of Accounts Verification | Authorizing the official corporate GL mapping. | Require Corporate Controller to supply verified chart of accounts before Stage 4 GL export. | Corporate Controller | `PROPOSED — APPROVAL PENDING` |
| **DEC-E-05** *(New)* | Banking Settlement Matching Model | Defining the banking settlement reconciliation model. | Adopt hybrid settlement model (Batch Debit tie-out + Itemized UTR matching). | Corporate Treasurer | `PROPOSED — APPROVAL PENDING` |

---

*End of Day 11 Stage 3 Policy E Audit Evidence, Accounting and Settlement Governance (Amended).*
