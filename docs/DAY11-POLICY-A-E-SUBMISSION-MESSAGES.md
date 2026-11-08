# DAY 11 — POLICY A–E STAKEHOLDER SUBMISSION MESSAGES
## Ready-to-Transmit Executive Briefing Packages & Formal Review Memoranda

**Project:** Aura Workforce by Growmar — Horizon Portal  
**Phase:** Phase 3 — Day 11: Admin Payroll Run Console  
**Date:** November 7, 2026  
**Auditor Roles:** Senior Enterprise Governance Architect, Internal Audit Lead, Financial Controls Lead  
**Repository:** `horizon-portal`  
**Current Branch:** `main`  
**Release Tag:** `phase-3` (Commit: `57ebcba5237d18eb053b1165a6e9795080ed907b`)  
**Operational Status:** **`PREPARED — HUMAN DISPATCH REQUIRED`**  

---

## 1. Transmission Protocol & Security Safeguards

> [!IMPORTANT]
> **SUBMISSION SAFEGUARD NOTICE:**  
> These formal submission messages have been prepared by the technical architecture team for human executive review and transmission. 
> 
> Because corporate communication channels (SMTP, Google Workspace, Slack) are not connected within this repository environment, **these messages have NOT been transmitted externally**. Automated transmission is blocked. Human Project Leadership must review each message and dispatch it through authorized corporate communication channels.
> 
> **CRITICAL INVARIANT:** Formal approval of any policy grants governance authorization only; it **does NOT authorize financial database execution** (Two-Key Authorization Principle).

---

## 2. Policy-by-Policy Executive Submission Messages

```
================================================================================
EXECUTIVE SUBMISSION MESSAGE 1: POLICY A
================================================================================
TO:         Chief Financial Officer (CFO) / Corporate Controller
CC:         VP Human Resources & Head of Global Payroll Operations
FROM:       Day 11 Payroll Systems Architecture & Governance Lead
DATE:       November 7, 2026
SUBJECT:    [ACTION REQUIRED: CORPORATE GOVERNANCE DECISION] Approval Request for Policy A: Source-of-Truth Hierarchy for Payroll Reconciliation
POLICY ID:  POLICY-A (Version 2.0)
STATUS:     PREPARED — HUMAN DISPATCH REQUIRED

Dear Chief Financial Officer and Corporate Controller,

1. PURPOSE OF DECISION:
Formal executive determination is requested to establish the corporate Source-of-Truth Hierarchy governing payroll reconciliation across the Horizon Portal.

2. SUMMARY OF THE CONTROL ISSUE & DISCREPANCY:
During the Day 11 audit, variances were identified between summary payroll run headers and verified itemized payslips:
- August 2026 (PR-2026-08): Stored header reports 429 employees (₹48,685,007.97 gross), while verified itemized payslips contain 424 employees (₹47,847,409.45 gross) — producing an unexplained variance of -5 employees and -₹837,598.52.
- September 2026 (PR-2026-09): Stored header reports 444 employees (₹54,788,660.03 gross), while verified itemized payslips contain 441 employees (₹54,430,331.52 gross) — producing an unexplained variance of -3 employees and -₹358,328.51.
Both variances are officially classified under Category 4 (Upstream Planning or Reporting Variance). Without an approved legal hierarchy, it is impossible to determine whether headers or payslips govern batch authorization.

3. EXACT DECISION REQUESTED:
Approve Rule A.1 designating the formal 4-tier Source-of-Truth Hierarchy:
  - Tier 1: External Banking Settlement (UTR Reference) — Statutory Ceiling
  - Tier 2: Digitally Signed Employee Payslips — Definite Entitlement
  - Tier 3: System Itemized Payslips (`payslips` table) — Operational Baseline
  - Tier 4: Summary Run Headers (`payroll_runs` table) — Operational Targets

4. SECONDARY CONCURRENCE REQUIRED:
Concurrence from the VP Human Resources and Head of Global Payroll Operations is required.

5. SUPPORTING DOCUMENT REFERENCES:
- Complete Approval Package: docs/DAY11-POLICY-A-APPROVAL-REQUEST.md
- Technical Proposal: docs/DAY11-POLICY-A-SOURCE-OF-TRUTH-DECISION.md
- Classification Standard: docs/DAY11-DISCREPANCY-CLASSIFICATION-STANDARD.md
- Discrepancy Reconciliation: docs/DAY11-DISCREPANCY-CLASSIFICATION-RECONCILIATION.md

6. REQUESTED RESPONSE FORMAT & VOTING OPTIONS:
Please return a formal written/signed response selecting one of the five explicit options:
[ ] OPTION 1: APPROVE AS PROPOSED
[ ] OPTION 2: REJECT
[ ] OPTION 3: APPROVE WITH AMENDMENTS
[ ] OPTION 4: REQUEST ADDITIONAL EVIDENCE
[ ] OPTION 5: DEFER DECISION

7. MANDATORY TWO-KEY GOVERNANCE NOTICE:
Approval of Policy A establishes the accounting hierarchy only. It DOES NOT authorize any programmatic financial mutations, run header updates, or bank transfers. Execution requires a separate, explicit operational authorization voucher (Key 2).

Sincerely,
Senior Enterprise Governance Architect & Financial Controls Lead
================================================================================
```

---

```
================================================================================
EXECUTIVE SUBMISSION MESSAGE 2: POLICY B
================================================================================
TO:         Head of Financial Planning & Analysis (FP&A)
CC:         Corporate Controller & Chief Financial Officer (CFO)
FROM:       Day 11 Payroll Systems Architecture & Governance Lead
DATE:       November 7, 2026
SUBJECT:    [ACTION REQUIRED: CORPORATE GOVERNANCE DECISION] Approval Request for Policy B: Pre-Approval In-Flight Payroll Run Correction Protocol (PR-2026-09)
POLICY ID:  POLICY-B (Version 2.0)
STATUS:     PREPARED — HUMAN DISPATCH REQUIRED

Dear Head of FP&A,

1. PURPOSE OF DECISION:
Formal executive authorization is requested to adopt the 3-stage Maker-Checker Pre-Approval Correction Protocol for unapproved in-flight payroll runs (specifically September 2026 / PR-2026-09).

2. SUMMARY OF THE CONTROL ISSUE & DISCREPANCY:
September 2026 (PR-2026-09) is in status `POSTED - PAYMENT PENDING` (unapproved and un-disbursed).
- The stored batch header reports 444 employees and ₹54,788,660.03 gross pay.
- Verified itemized payslips contain 441 employees and ₹54,430,331.52 gross pay.
- Forensic investigation confirmed that all 441 active employees in company history received payslips. Three future joiners (EMP00442–EMP00444) onboard in October 2026.
- The 444-person preliminary header reflects an unverified preliminary batch estimate (hypothesized under Level 2 as SYSTEM_BATCH_HEADER_CALCULATION_DEFECT).
- Releasing funds against the 444-person header would cause ₹307,351.70 in unallocated cash to be disbursed without recipient entitlement.

3. EXACT DECISION REQUESTED:
Approve Rule B.1 authorizing a 3-stage maker-checker alignment procedure under Dimension A `PRE_APPROVAL_HEADER_ALIGNMENT` with Dimension B reason `JOINING_DATE_ALIGNMENT`:
  - Stage 1 (Proposal): Submit a non-mutating alignment voucher in `PayrollAdjustment`.
  - Stage 2 (Review): Independent review and approval by an authorized finance manager.
  - Stage 3 (Execution): Following separate Key 2 authorization, atomically update `payroll_runs` header to 441 employees and ₹54,430,331.52 gross, transitioning status to `MATCHED`.

4. SECONDARY CONCURRENCE REQUIRED:
Concurrence from the Corporate Controller and CFO is required.

5. SUPPORTING DOCUMENT REFERENCES:
- Complete Approval Package: docs/DAY11-POLICY-B-APPROVAL-REQUEST.md
- Root Cause Investigation: docs/DAY11-SEPTEMBER-2026-ROOT-CAUSE.md
- Discrepancy Reconciliation: docs/DAY11-DISCREPANCY-CLASSIFICATION-RECONCILIATION.md
- Adjustment Taxonomy: docs/DAY11-ADJUSTMENT-TAXONOMY-RECONCILIATION.md

6. REQUESTED RESPONSE FORMAT & VOTING OPTIONS:
Please return a formal written/signed response selecting one of the five explicit options:
[ ] OPTION 1: APPROVE AS PROPOSED
[ ] OPTION 2: REJECT
[ ] OPTION 3: APPROVE WITH AMENDMENTS
[ ] OPTION 4: REQUEST ADDITIONAL EVIDENCE
[ ] OPTION 5: DEFER DECISION

7. MANDATORY TWO-KEY GOVERNANCE NOTICE:
Approval of Policy B adopts the procedure only. It DOES NOT authorize immediate database mutation. An independent finance manager must submit an itemized voucher, and a separate Key 2 administrative authorization must be granted before database updates execute.

Sincerely,
Senior Enterprise Governance Architect & Financial Controls Lead
================================================================================
```

---

```
================================================================================
EXECUTIVE SUBMISSION MESSAGE 3: POLICY C
================================================================================
TO:         VP Statutory Compliance & Corporate Legal Counsel
CC:         Corporate Controller & Chief Financial Officer (CFO)
FROM:       Day 11 Payroll Systems Architecture & Governance Lead
DATE:       November 7, 2026
SUBJECT:    [ACTION REQUIRED: CORPORATE GOVERNANCE DECISION] Approval Request for Policy C: Accounting Treatment & Immutability Rules for Disbursed Run (PR-2026-08)
POLICY ID:  POLICY-C (Version 2.0)
STATUS:     PREPARED — HUMAN DISPATCH REQUIRED

Dear VP Statutory Compliance and Legal Counsel,

1. PURPOSE OF DECISION:
Formal legal and compliance determination is requested regarding the accounting treatment and immutability rules for historically disbursed payroll runs (specifically August 2026 / PR-2026-08).

2. SUMMARY OF THE CONTROL ISSUE & DISCREPANCY:
August 2026 (PR-2026-08) is in status `PAID`, having been fully disbursed on September 1, 2026.
- The stored header reports 429 employees and ₹48,685,007.97 gross pay.
- Verified itemized payslips contain 424 employees and ₹47,847,409.45 gross pay.
- All 424 active August staff received their exact payslips ($0\text{ paise}$ error). The remaining 17 employees joined in September.
- The -5 headcount variance (-₹837,598.52) is classified under Category 4 (Upstream Planning or Reporting Variance), with causal hypothesis TIMING_AND_ROSTER_LAG.
- Retrospectively modifying a disbursed payment record violates statutory tax withholding reporting and corporate audit trail standards.

3. EXACT DECISION REQUESTED:
Approve Rule C.1 declaring that:
  - Disbursed runs in `PAID` status are permanently immutable. The header row in `payroll_runs`, payment date, and historical payslips shall NOT be altered.
  - A non-destructive reporting reconciliation entry of Dimension A `HISTORICAL_REPORTING_RECONCILIATION` with Dimension B reason `JOINING_DATE_ALIGNMENT` may be posted to `payroll_adjustments` to document the variance.
  - This entry generates ZERO cash movement, ZERO general ledger liabilities, ZERO clawbacks, and ZERO tax base modifications.

4. SECONDARY CONCURRENCE REQUIRED:
Concurrence from the Corporate Controller and CFO is required.

5. SUPPORTING DOCUMENT REFERENCES:
- Complete Approval Package: docs/DAY11-POLICY-C-APPROVAL-REQUEST.md
- Root Cause Investigation: docs/DAY11-AUGUST-2026-ROOT-CAUSE.md
- Discrepancy Reconciliation: docs/DAY11-DISCREPANCY-CLASSIFICATION-RECONCILIATION.md
- Adjustment Taxonomy: docs/DAY11-ADJUSTMENT-TAXONOMY-RECONCILIATION.md

6. REQUESTED RESPONSE FORMAT & VOTING OPTIONS:
Please return a formal written/signed response selecting one of the five explicit options:
[ ] OPTION 1: APPROVE AS PROPOSED
[ ] OPTION 2: REJECT
[ ] OPTION 3: APPROVE WITH AMENDMENTS
[ ] OPTION 4: REQUEST ADDITIONAL EVIDENCE
[ ] OPTION 5: DEFER DECISION

7. MANDATORY TWO-KEY GOVERNANCE NOTICE:
Approval of Policy C establishes the legal compliance standard only. It DOES NOT authorize creating adjustment ledger rows until Gate 1 is formally reviewed and released.

Sincerely,
Senior Enterprise Governance Architect & Financial Controls Lead
================================================================================
```

---

```
================================================================================
EXECUTIVE SUBMISSION MESSAGE 4: POLICY D
================================================================================
TO:         Corporate Controller & Lead Financial Systems Architect
CC:         Lead Financial Auditor & Statutory Compliance Lead
FROM:       Day 11 Payroll Systems Architecture & Governance Lead
DATE:       November 7, 2026
SUBJECT:    [ACTION REQUIRED: CORPORATE GOVERNANCE DECISION] Approval Request for Policy D: Adjustment Semantics, Accounting Taxonomy & BigInt Invariants
POLICY ID:  POLICY-D (Version 2.0)
STATUS:     PREPARED — HUMAN DISPATCH REQUIRED

Dear Corporate Controller,

1. PURPOSE OF DECISION:
Formal accounting and technical sign-off is requested to adopt the Two-Dimensional Adjustment Taxonomy and BigInt integer-paise mathematical invariants for the Horizon Portal reconciliation engine.

2. SUMMARY OF THE CONTROL ISSUE & DISCREPANCY:
To prevent IEEE-754 floating-point drift and eliminate confusion between non-cash reporting disclosures and monetary balance-sheet claims, strict architectural invariants must be established:
- Previous drafts mixed accounting treatments with business reasons.
- Float calculations in payroll engines introduce penny-rounding errors over large employee batches.

3. EXACT DECISION REQUESTED:
Approve Rule D.1 formally adopting:
  - Two-Dimensional Adjustment Taxonomy: Dimension A (Accounting Nature: HISTORICAL_REPORTING_RECONCILIATION, PRE_APPROVAL_HEADER_ALIGNMENT, FINANCIAL_ADJUSTMENT_CLAIM) and Dimension B (Reason: RETROACTIVE_ADDITION, JOINING_DATE_ALIGNMENT, TAX_WITHHOLDING_RECALIBRATION, COMPONENT_RECLASSIFICATION, ARREARS_PAYMENT [financial claim only]).
  - Exact BigInt integer paise math ($1\text{ INR} = 100\text{ paise}$) with zero floating-point math in financial comparison routines.
  - SQLite signed 64-bit bounds assertions (`assertSqliteInt64`).
  - Canonical variance formula: $\text{Variance} = \text{Itemized Total} - \text{Stored Header Total}$.
  - Monotonic revision sequencing and before/after snapshot archiving.

4. SECONDARY CONCURRENCE REQUIRED:
Concurrence from the Lead Financial Auditor and Statutory Compliance Lead is required.

5. SUPPORTING DOCUMENT REFERENCES:
- Complete Approval Package: docs/DAY11-POLICY-D-APPROVAL-REQUEST.md
- Adjustment Taxonomy: docs/DAY11-ADJUSTMENT-TAXONOMY-RECONCILIATION.md
- Engine Implementation: src/lib/payroll/reconciliation-engine.ts
- Verification Test Suite: scripts/test-day11-payroll-reconciliation.ts (77 assertions PASS)

6. REQUESTED RESPONSE FORMAT & VOTING OPTIONS:
Please return a formal written/signed response selecting one of the five explicit options:
[ ] OPTION 1: APPROVE AS PROPOSED
[ ] OPTION 2: REJECT
[ ] OPTION 3: APPROVE WITH AMENDMENTS
[ ] OPTION 4: REQUEST ADDITIONAL EVIDENCE
[ ] OPTION 5: DEFER DECISION

7. MANDATORY TWO-KEY GOVERNANCE NOTICE:
Approval of Policy D standardizes calculation rules only. It DOES NOT authorize writing records to `payroll_adjustments` or mutating `prisma/dev.db`.

Sincerely,
Senior Enterprise Governance Architect & Financial Controls Lead
================================================================================
```

---

```
================================================================================
EXECUTIVE SUBMISSION MESSAGE 5: POLICY E
================================================================================
TO:         Internal Audit Lead / Chief Information Security Officer (CISO)
CC:         Chief Information Security Officer & Corporate Legal Counsel
FROM:       Day 11 Payroll Systems Architecture & Governance Lead
DATE:       November 7, 2026
SUBJECT:    [ACTION REQUIRED: CORPORATE GOVERNANCE DECISION] Approval Request for Policy E: Maker-Checker Matrix, Segregation of Duties & Audit Logging
POLICY ID:  POLICY-E (Version 2.0)
STATUS:     PREPARED — HUMAN DISPATCH REQUIRED

Dear Internal Audit Lead,

1. PURPOSE OF DECISION:
Formal internal audit and security authorization is requested to adopt the Maker-Checker Dual-Control Authorization Matrix and mandatory audit logging framework for the payroll administration console.

2. SUMMARY OF THE CONTROL ISSUE & DISCREPANCY:
To comply with SOX Section 404, ISO 27001, and corporate internal controls, technical systems must prevent single-operator manipulation of payroll ledgers:
- Administrative staff must be barred from proposing and approving their own payroll adjustments (`preparerId !== approverId`).
- Every state change must produce an immutable, serialized transaction audit record.

3. EXACT DECISION REQUESTED:
Approve Rule E.1 formally establishing:
  - Dual-Control Role Separation: Prohibiting self-approval at the database and API route level (HTTP 403 Forbidden).
  - RBAC Matrix: Restricting maker privileges to `HR_ADMIN` / `PAYROLL_SPECIALIST` and checker privileges to `FINANCE_CONTROLLER` / `HR_DIRECTOR`.
  - Transactional Audit Logging: Mandating that all adjustment approvals and execution actions write to `AuditLog` within an atomic Prisma transaction.
  - Concurrency & Monotonic Revision: Enforcing optimistic locking on adjustment records.

4. SECONDARY CONCURRENCE REQUIRED:
Concurrence from the Chief Information Security Officer (CISO) and Corporate Legal Counsel is required.

5. SUPPORTING DOCUMENT REFERENCES:
- Complete Approval Package: docs/DAY11-POLICY-E-APPROVAL-REQUEST.md
- RBAC Test Suite: scripts/test-day11-payroll.ts (53 assertions PASS)
- Gate 1 Control Specification: docs/DAY11-GOVERNANCE-GATE1-CONTROL.md

6. REQUESTED RESPONSE FORMAT & VOTING OPTIONS:
Please return a formal written/signed response selecting one of the five explicit options:
[ ] OPTION 1: APPROVE AS PROPOSED
[ ] OPTION 2: REJECT
[ ] OPTION 3: APPROVE WITH AMENDMENTS
[ ] OPTION 4: REQUEST ADDITIONAL EVIDENCE
[ ] OPTION 5: DEFER DECISION

7. MANDATORY TWO-KEY GOVERNANCE NOTICE:
Approval of Policy E codifies security and audit rules only. It DOES NOT authorize administrative users or automated tools to bypass Gate 1 or execute financial postings.

Sincerely,
Senior Enterprise Governance Architect & Financial Controls Lead
================================================================================
```

