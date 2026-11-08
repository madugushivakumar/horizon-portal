# STAKEHOLDER COMMUNICATION BRIEF — POLICY D
## Technical & Accounting Email Draft for Lead Financial Auditor

**Project:** Aura Workforce by Growmar — Horizon Portal  
**Document Reference:** `docs/DAY11-EMAIL-POLICY-D-APPROVAL.md`  
**Target Policy:** Policy D — Payroll Adjustment Accounting Controls & Semantic Invariants  
**Formal Request File:** [`docs/DAY11-POLICY-D-APPROVAL-REQUEST.md`](file:///c:/Users/Madugu%20Shiva%20Kumar/OneDrive/图片/Desktop/horizon-portal/docs/DAY11-POLICY-D-APPROVAL-REQUEST.md)  
**Date:** November 7, 2026  
**Status:** DRAFT — PREPARED FOR TRANSMISSION (NOT AUTOMATICALLY SENT)  

---

### EMAIL TRANSMISSION DETAILS

**TO:** [Lead Financial Auditor Name] <[lead-auditor@growmar.com]>  
**FROM:** Principal Backend & Financial Systems Lead <[lead-engineer@growmar.com]>  
**DATE:** November 7, 2026  
**SUBJECT:** Review and Approval Required — Payroll Adjustment Accounting Controls  
**IMPORTANCE:** High (Statutory Assurance, Precision Controls & Transaction Safety)  
**ATTACHMENT / LINK:** [`docs/DAY11-POLICY-D-APPROVAL-REQUEST.md`](file:///c:/Users/Madugu%20Shiva%20Kumar/OneDrive/图片/Desktop/horizon-portal/docs/DAY11-POLICY-D-APPROVAL-REQUEST.md)  

---

### EMAIL BODY

Dear [Lead Financial Auditor Name],

I am writing to request your formal review and statutory accounting approval for the technical controls, precision invariants, and audit mechanisms designed for the new `PayrollAdjustment` ledger within Horizon Portal.

### 1. Architectural Foundation & Control Invariants
As part of Day 11 Milestone 1 (Step 2A.1), we engineered and verified a strict financial accounting layer that eliminates floating-point rounding errors and guarantees relational integrity across SQLite transactions. We request your ratification of the following control frameworks:

1. **Exact Integer-Paise BigInt Arithmetic:**
   - All internal calculations operate in exact integer paise ($1\text{ INR} = 100\text{ paise}$) using JavaScript native `BigInt`.
   - Floating-point representations are strictly prohibited from performing financial calculations.
   - String monetary inputs are deterministically parsed with canonical half-up rounding ($0.005 \to 0.01$).

2. **SQLite Signed 64-Bit Boundary Enforcement:**
   - Every monetary value written to the database is verified via `assertSqliteInt64()`, ensuring amounts lie strictly between `SQLITE_INT64_MIN` ($-2^{63} = -9,223,372,036,854,775,808$) and `SQLITE_INT64_MAX` ($2^{63} - 1 = 9,223,372,036,854,775,807$).
   - Overflows, underflows, and type mismatches throw immediate, non-recoverable errors before SQL execution.

3. **Fundamental Accounting Equation Invariants:**
   Every adjustment row must mathematically satisfy three simultaneous invariants:
   $$\text{Original Gross} - \text{Original Deductions} \equiv \text{Original Net}$$
   $$\text{Adjusted Gross} - \text{Adjusted Deductions} \equiv \text{Adjusted Net}$$
   $$\text{Variance Gross} - \text{Variance Deductions} \equiv \text{Variance Net}$$

4. **Adjustment Semantic Classification:**
   The ledger strictly partitions adjustments into distinct semantic types:
   - `HISTORICAL_REPORTING_RECONCILIATION`: Zero cash impact, zero balance-sheet receivables/payables (used for `PR-2026-08`).
   - `FINANCIAL_ADJUSTMENT_CLAIM`: Genuine actionable claim requiring explicit bank clearance evidence and separate treasury authorization.

5. **Monotonic Revision Sequencing & Client Idempotency:**
   - Revisions for a given run ID advance strictly sequentially ($0 \to 1 \to 2$) guarded by composite constraint `@@unique([payrollRunId, revision])`.
   - Client requests must provide an `idempotencyKey` guarded by a database unique constraint, preventing double-submission under concurrent retries.

6. **Multi-Statement Transaction Atomicity & Immutable Audit:**
   - Adjustment creation, status transitions, run header alignment, and structured `AuditLog` creation are bound into a single `prisma.$transaction`. Any intermediate error triggers an immediate `ROLLBACK TRANSACTION`.
   - Ephemeral testing proved 100% rollback atomicity (zero orphaned audit logs or partial records).

7. **Rejection & Non-Destructive Reversal Rules:**
   - Proposed adjustments may be rejected with mandatory reviewer explanation.
   - Historical executed adjustment rows are **permanent and immutable**; deletion is physically blocked. Reversals must be executed as subsequent monotonic revisions (e.g. Revision 2 reversing Revision 1).

### 2. Specific Control Confirmations Requested
We specifically request your confirmation on the following baseline choices:
- Sub-paise rounding: Standard canonical half-up rounding ($0.005 \to 0.01$).
- Reversal protocol: Append-only monotonic sequential revision (zero row deletion).
- Variance convention: Signed variance where $\text{Variance} = \text{Itemized} - \text{Stored Header}$.

### 3. Proposed Policy Statement Under Review (Rule D.1)
> *"All financial adjustments shall be recorded in the `payroll_adjustments` ledger using exact integer-paise BigInt arithmetic guarded by SQLite signed 64-bit boundaries. Every adjustment record must satisfy the three mathematical invariants ($\text{Gross} - \text{Deductions} \equiv \text{Net}$ for original, adjusted, and variance amounts). Adjustments must enforce client idempotency keys and monotonic revision sequencing. All state transitions and accompanying structured audit logs must commit within a single atomic transaction. Historical adjustment records shall be immutable and shall never be deleted."*

### 4. Important Financial Safety Restrictions
- This phase is strictly read-only. **Zero database mutations have occurred**, and **no mutation endpoints have been created**.
- The database (`prisma/dev.db`) remains 100% read-only with verified SHA-256 integrity (`74d656f992717b8ee6e4e8f6bd902f2dd5a50b09e7b680435abb660ed16bc311`).
- Implementation is fully blocked at Gate 1 awaiting your formal written sign-off.

---

### FORMAL DECISION REQUEST

Please review the complete technical control specifications in [`docs/DAY11-POLICY-D-APPROVAL-REQUEST.md`](file:///c:/Users/Madugu%20Shiva%20Kumar/OneDrive/图片/Desktop/horizon-portal/docs/DAY11-POLICY-D-APPROVAL-REQUEST.md) and reply with your formal decision in the following format:

```text
DECISION: [ APPROVED | APPROVED WITH CONDITIONS | REJECTED | NEEDS REVISION ]
POLICY: POLICY D — Payroll Adjustment Accounting Controls (Proposed Rule D.1)
APPROVER NAME: [Your Full Name]
OFFICIAL TITLE: [Lead Financial Auditor / Statutory Compliance Auditor]
APPROVAL DATE: [YYYY-MM-DD]
CONDITIONS / DIRECTIVES: [Enter any specific auditing requirements, rounding directives, or 'None']
DOCUMENT REFERENCE / AUDIT REF: [Enter internal audit working paper or review memo reference]
```

Thank you for your rigorous financial oversight and collaboration.

Sincerely,

**Principal Backend & Financial Systems Lead**  
Horizon Portal — Aura Workforce by Growmar  
[lead-engineer@growmar.com]  

