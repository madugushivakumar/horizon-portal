# DAY 11 — EXECUTIVE POLICY APPROVAL SUBMISSION COVER LETTER
## Master Transmittal Memo for Corporate Accounting & Governance Authorities

**Project:** Aura Workforce by Growmar — Horizon Portal  
**Document Reference:** `docs/DAY11-EXECUTIVE-POLICY-APPROVAL-COVER-LETTER.md`  
**Governing Context:** Day 11 Financial Reconciliation — Step 2B Governance Gate  
**Date:** November 7, 2026  
**Security Level:** Highly Confidential — Financial Governance, Payroll Accounting & Internal Controls  

---

### MEMORANDUM

**TO:**  
- **Corporate Controller / Chief Financial Officer (CFO)** — Corporate Finance & Treasury  
- **Head of Payroll / Vice President of Human Resources** — HR Operations & Payroll Governance  
- **Audit Committee Chair / Chief Financial Officer (CFO)** — Corporate Governance & Statutory Audit  
- **Lead Financial Auditor** — Financial Assurance & Internal Controls  
- **Chief Information Security Officer (CISO) / Security Lead** — Application Security & Access Governance  

**FROM:**  
Principal Backend & Financial Systems Engineering Team, Horizon Portal  

**SUBJECT:**  
**Transmittal of Formal Accounting Policy Approval Package — Policies A through E (Day 11 Payroll Reconciliation)**

---

### 1. Executive Summary & Purpose

During recent automated auditing and forensic reconciliation of the Horizon Portal payroll subsystem, mathematical discrepancies were identified between stored summary payroll run headers (`payroll_runs` table) and itemized employee payslip records (`payslips` table) for both **September 2026 (`PR-2026-09`)** and **August 2026 (`PR-2026-08`)**.

To ensure absolute adherence to GAAP/IFRS principles, Sarbanes-Oxley (SOX) Section 404 internal controls, and corporate statutory compliance, the engineering team has established a strict governance boundary:
> **Technical readiness is not accounting authority. Automated test passes do not constitute corporate policy approval. No financial record in the production database (`prisma/dev.db`) will be mutated, and no backend correction endpoint will be deployed, until formal written approval is obtained from designated executive stakeholders across five defined policy areas.**

This transmittal memo accompanies the standalone policy approval packages and personalized communication briefs prepared for your review.

---

### 2. Summary of Identified Discrepancies

| Payroll Run ID | Operational Status | Stored Header Headcount | Verified Itemized Headcount | Headcount Variance | Stored Header Net | Verified Itemized Net | Net Variance ($\text{Itemized} - \text{Stored}$) | Root Cause Established |
|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|---|
| **`PR-2026-09`** (September 2026) | `POSTED - PAYMENT PENDING`<br>(Unpaid In-Flight Run) | 444 | 441 | **-3** | ₹48,089,678.30 | ₹47,782,326.60 | **-₹307,351.70**<br>(-30,735,170 paise) | 3 employees (`EMP00442`–`EMP00444`) with October 2026 joining dates erroneously included in preliminary draft estimate. |
| **`PR-2026-08`** (August 2026) | `PAID`<br>(Historical Disbursed Run,<br>Paid 2026-09-01) | 429 | 424 | **-5** | ₹43,173,318.36 | ₹42,467,961.37 | **-₹705,356.99**<br>(-70,535,699 paise) | 5 employees (`EMP00425`–`EMP00429`) with September 2026 joining dates had preliminary draft payslips with 0 work days. |

---

### 3. Core Architectural Safety Invariants Established

The technical foundation (Milestone 1 / Step 2A.1) has been completed, independently verified, and accepted with **96/96 passing automated tests**, implementing the following non-negotiable safety guardrails:

1. **Exact 64-Bit Integer-Paise Arithmetic:** Floating-point monetary calculation is permanently prohibited. All operations use BigInt paise ($1 \text{ Rupee} = 100 \text{ paise}$) strictly bounded within SQLite signed 64-bit integer limits (`-9,223,372,036,854,775,808` to `+9,223,372,036,854,775,807`), preventing any rounding drift.
2. **Three-Stage Decoupled September Lifecycle:** Correction proposal creation (`Stage 1`) causes **ZERO header mutations** to `PR-2026-09`. Approval (`Stage 2`) certifies the proposal but **does NOT execute a correction**. Mutation occurs exclusively during a dedicated, separately authorized execution transaction (`Stage 3`).
3. **Absolute Immutability of August Historical Records:** The disbursed August run (`PR-2026-08`) is protected against alteration. Its `PAID` status, payment timestamp (`2026-09-01`), header amounts, and historical payslips will **never be overwritten or deleted**. Any reconciliation is captured purely as a non-destructive reporting entry with **zero cash impact**.
4. **Enforced Dual Control (Maker-Checker):** The backend strictly enforces `approverId !== preparerId`. Self-approval is rejected at the protocol level. Actor identity is resolved exclusively from authenticated server-side sessions.
5. **Multi-Statement Transaction Atomicity:** Every state transition and its accompanying structured `AuditLog` commit within an atomic `prisma.$transaction`. Any runtime failure triggers an immediate, full rollback.

---

### 4. Overview of the Five Required Policy Decisions

To proceed with implementing the backend workflows, we require formal sign-off on the following five policy documents:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                 THE FIVE GOVERNANCE POLICIES                                │
├──────────┬──────────────────────────────┬─────────────────────────────┬─────────────────────┤
│ Policy   │ Focus Area                   │ Designated Approver         │ Reference Request   │
├──────────┼──────────────────────────────┼─────────────────────────────┼─────────────────────┤
│ POLICY A │ Authoritative Financial      │ Corporate Controller / CFO  │ DAY11-POLICY-A-     │
│          │ Source of Truth              │                             │ APPROVAL-REQUEST.md │
├──────────┼──────────────────────────────┼─────────────────────────────┼─────────────────────┤
│ POLICY B │ September 2026 Pre-Approval  │ Head of Payroll / VP HR     │ DAY11-POLICY-B-     │
│          │ Correction Lifecycle         │                             │ APPROVAL-REQUEST.md │
├──────────┼──────────────────────────────┼─────────────────────────────┼─────────────────────┤
│ POLICY C │ August 2026 Historical       │ Audit Committee / CFO       │ DAY11-POLICY-C-     │
│          │ Reporting Treatment          │                             │ APPROVAL-REQUEST.md │
├──────────┼──────────────────────────────┼─────────────────────────────┼─────────────────────┤
│ POLICY D │ Adjustment Accounting        │ Lead Financial Auditor      │ DAY11-POLICY-D-     │
│          │ Controls & Semantics         │                             │ APPROVAL-REQUEST.md │
├──────────┼──────────────────────────────┼─────────────────────────────┼─────────────────────┤
│ POLICY E │ Security & Dual-Control      │ CISO / Security Lead        │ DAY11-POLICY-E-     │
│          │ Authorization Matrix         │                             │ APPROVAL-REQUEST.md │
└──────────┴──────────────────────────────┴─────────────────────────────┴─────────────────────┘
```

1. **Policy A ([Request Document](file:///c:/Users/Madugu%20Shiva%20Kumar/OneDrive/图片/Desktop/horizon-portal/docs/DAY11-POLICY-A-APPROVAL-REQUEST.md)):**  
   Designates itemized payslips as the authoritative calculation source for downstream summaries without claiming legal primacy without external evidence. Eliminates a potential ₹307,351.70 phantom liability in September.
2. **Policy B ([Request Document](file:///c:/Users/Madugu%20Shiva%20Kumar/OneDrive/图片/Desktop/horizon-portal/docs/DAY11-POLICY-B-APPROVAL-REQUEST.md)):**  
   Formalizes the 3-stage decoupled lifecycle for `PR-2026-09`, ensuring proposals create zero header mutations until authorized execution.
3. **Policy C ([Request Document](file:///c:/Users/Madugu%20Shiva%20Kumar/OneDrive/图片/Desktop/horizon-portal/docs/DAY11-POLICY-C-APPROVAL-REQUEST.md)):**  
   Clarifies that the August entry is a non-destructive Reporting-Only Reconciliation Entry with 0 cash impact, distinguishing it from an actionable balance-sheet financial claim.
4. **Policy D ([Request Document](file:///c:/Users/Madugu%20Shiva%20Kumar/OneDrive/图片/Desktop/horizon-portal/docs/DAY11-POLICY-D-APPROVAL-REQUEST.md)):**  
   Ratifies exact BigInt integer-paise math, SQLite bounds, monotonic revision sequencing, client idempotency keys, and multi-statement atomicity.
5. **Policy E ([Request Document](file:///c:/Users/Madugu%20Shiva%20Kumar/OneDrive/图片/Desktop/horizon-portal/docs/DAY11-POLICY-E-APPROVAL-REQUEST.md)):**  
   Ratifies Maker-Checker dual control, session-bound identity, and independent execution permissions.

---

### 5. Submission and Review Instructions for Approvers

1. **Access Document:** Please review your assigned policy approval request document linked above or via the email brief prepared for you.
2. **Review Options & Evidence:** Verify the root cause analysis, mathematical invariants, and architectural options.
3. **Provide Formal Decision:** Complete the sign-off block in the document or reply in writing with your formal decision:
   - `APPROVED`
   - `APPROVED WITH CONDITIONS` (with explicit directives)
   - `REJECTED`
   - `NEEDS REVISION`
4. **Include Verification Metadata:** Your submission must include your full name, official title, approval date, and an internal memo or reference identifier.
5. **Return Evidence:** Deliver the signed document or formal approval directive to the engineering governance lead.

---

### 6. Governance Status Confirmation

- **Current Database Status:** `prisma/dev.db` is 100% untouched. SHA-256 hash invariant verified (`74d656f992717b8ee6e4e8f6bd902f2dd5a50b09e7b680435abb660ed16bc311`).
- **Implementation Status:** Milestone 3 (Backend Implementation) and Milestone 4 (Financial Execution) remain **strictly blocked** awaiting your completed sign-offs.

