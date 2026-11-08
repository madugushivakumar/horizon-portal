# DAY 11 — STAGE 3: POLICY C — PAYROLL APPROVAL AND MAKER-CHECKER (AMENDED)
## Enterprise Governance Policy for Role-Based Access Control, Dual-Authorization Workflows & Separation of Duties
### Stage 3 of 6: Formal Payroll Governance Package

---

## Document Metadata

| Policy Governance Metadata | Specification |
|---|---|
| **Project** | Aura Workforce by Growmar — Horizon Portal |
| **Phase / Task** | Phase 3 — Day 11: Admin Payroll Run Console |
| **Governing Policy Code** | **POLICY-C (Approval & Maker-Checker Controls)** |
| **Document Identifier** | `docs/DAY11-STAGE3-POLICY-C-PAYROLL-APPROVAL-AND-MAKER-CHECKER.md` |
| **Document Version** | **Version 2.0 (Amended — Stage 3 Issue 3 Resolution)** |
| **Date of Preparation** | November 7, 2026 |
| **Designated Approval Authority** | **VP Human Resources, Corporate Controller & Chief Financial Officer** |
| **Policy Approval Status** | **PROPOSED — APPROVAL PENDING** |
| **Governance Gate 1 Status** | **LOCKED — NO FINANCIAL EXECUTION AUTHORIZED** |

---

## 1. Purpose and Scope

### 1.1 Purpose
This policy establishes mandatory operational governance, segregation-of-duties standards, maker-checker approval controls, and authorization tiering for the payroll processing lifecycle. It ensures that no single individual possesses unilateral authority to prepare, adjust, approve, and execute financial payroll disbursements, enforcing strict multi-layered internal controls.

### 1.2 Scope
This policy applies to:
- All payroll processing, review, and approval operations in Horizon Portal.
- Server-side approval endpoints (`src/app/api/v1/payroll/runs/[runId]/approve/route.ts`).
- Approval confirmation modals and security enforcement guards (`src/lib/payroll/payroll-security.ts`).
- Audit logging pipelines recording actor identity, roles, and state transitions.

---

## 2. Governance Roles and Responsibilities

In an enterprise operating model, payroll responsibilities are partitioned across eight distinct functional roles:

| Role Title | Operational Scope | Authorized Actions | Prohibited Actions | Proposed Organizational Assignment |
|---|---|---|---|---|
| **Payroll Preparer** | Batch initiation & calculation | Ingest attendance, generate draft payslips, compile batch headers | Cannot approve, unlock, or disburse runs | Senior Payroll Specialist / HR Operations |
| **Payroll Reviewer** | Technical & data validation | Verify line-item arithmetic, review hire-date cohorts, cross-check variances | Cannot approve runs or modify source vouchers | Payroll Lead / HR Operations Manager |
| **Payroll Approver** | Governance sign-off | Formally approve reconciled payroll runs; authorize release | Cannot prepare batches or modify individual payslips | HR Director / VP Human Resources |
| **Finance Controller** | Financial authorization | Verify budget availability, authorize general ledger liabilities | Cannot edit employee records or bypass reconciliation | Corporate Controller / Head of FP&A |
| **Corporate Treasurer** | Disbursement execution | Authorize banking release files, verify UTR settlement manifests | Cannot approve payroll batches or alter amounts | Corporate Treasurer / Cash Management |
| **System Administrator** | Technical infrastructure | Manage user provisioning, maintain system uptime, deploy releases | **Zero financial approval authority.** Cannot approve runs | Cloud Systems Engineer / DevOps |
| **Internal Auditor** | Independent control monitoring | Review audit logs, inspect reconciliation archives, test controls | Strictly read-only access. Cannot execute or approve | Director of Internal Audit / Compliance Officer |
| **Governance Owner** | Policy & exception governance | Convene Gate 1 reviews, authorize emergency exception workflows | Cannot execute standard payroll transactions | Chief Financial Officer (CFO) |

---

## 3. The Maker-Checker Dual-Control Principle

### 3.1 Core Rule: Segregation of Duties
$$\text{Preparer Identity } (\text{preparer\_id}) \ne \text{Approver Identity } (\text{approved\_by\_id})$$

1. **Self-Approval Prohibition:** Under no circumstances may the user who prepared or initiated a payroll run approve that same run.
2. **Dual-Role Prohibition:** Even if an individual holds multiple system roles (e.g., an Admin who is also an HR preparer), they cannot act as both Maker and Checker on the same payroll batch.
3. **Application Enforcement:** `src/app/api/v1/payroll/runs/[runId]/approve/route.ts` programmatically rejects approval if `run.preparerId === user.id` with HTTP 403 Forbidden.

---

## 4. Controlled Approval State Model

To eliminate confusion between administrative preparation, financial commitment, and banking settlement, the payroll lifecycle is partitioned into six sequential phases:

```text
  [ DRAFT ]
      |
      v
  [ RECONCILING ]  (Reconciliation Engine executed across Dimensions A - I)
      |
      v
  [ RECONCILED ]   (All internal arithmetic verified; variances resolved)
      |
      v
  [ PENDING_APPROVAL ]  (Maker submits for formal Checker approval)
      |
      +---> [ REJECTED / RETURNED_FOR_CORRECTION ]  (Returned to Preparer)
      |
      v
  [ APPROVED ]     (Dual-authorization executed; locked for disbursement)
      |
      v
  [ SETTLED ]      (Bank debit confirmed & statutory challans archived)
```

---

## 5. Monetary Thresholds & Two-Tier Approval Evaluation (Issue 3 Resolution)

### 5.1 Investigation of the Proposed ₹5,00,000 Threshold
An exhaustive forensic search across the codebase and data packs was conducted:
- `src/`: Zero references to `500000`, `5,00,000`, or monetary threshold limits exist.
- `03_Data_Pack/`: The only match for `500000` was an invoice subtotal in `invoices.json`, completely unrelated to payroll.
- Historical payroll run sizes: Monthly runs in Horizon Portal range from ₹1.2 Cr to ₹2.5 Cr. An uncalibrated ₹5,00,000 threshold applied to total run net pay would trigger tier-2 executive sign-off on 100% of historical runs.
- **Finding:** The ₹5,00,000 threshold was an unverified illustrative number introduced in early draft proposals. It has **no established authority** and is **NOT** an approved corporate policy.

### 5.2 Comparative Evaluation of Six Candidate Monetary Bases
To provide corporate leadership with a sound foundation for decision-making, six potential threshold measurement bases were analyzed:

| Candidate Measurement Base | Definition | Advantages | Limitations & Operational Risks | Governance Recommendation |
|---|---|---|---|---|
| **Base 1: Total Gross Payroll** | Total gross compensation liability before deductions | Captures complete gross expenditure exposure of the firm. | In a 441-employee firm, gross monthly payroll is $\sim ₹2.0\text{ Cr}$, meaning any fixed ₹5L threshold triggers on 100% of normal monthly cycles. | Suitable only as an annual or quarterly budget cap, not a monthly tier trigger. |
| **Base 2: Total Net Payroll** | Total cash disbursement required from treasury | Directly measures cash liquidity required for disbursement. | Same limitation as Base 1: regular monthly runs naturally exceed ₹1.5 Cr. | Valid for treasury cash-outflow limits, but requires a realistic enterprise scale (e.g., ₹2.5 Cr). |
| **Base 3: Total Deductions** | Sum of PF, ESI, PT, and TDS statutory withholdings | Focuses on legal statutory compliance exposure. | Deductions are fixed statutory formulas, not discretionary expenses. Secondary sign-off adds administrative friction without control benefit. | Not recommended as primary approval trigger. |
| **Base 4: Individual Employee Net Payment** | Maximum salary paid to any single individual | Catches executive compensation anomalies, excessive bonuses, or calculation errors for specific high earners. | Does not govern batch-level fiscal exposure. High-volume normal salaries pass uninspected. | **RECOMMENDED as a supplementary control** (e.g., individual payout $> ₹10,00,000$). |
| **Base 5: Individual Financial Adjustment Amount** | Single adjustment delta booked in `payroll_adjustments` | Targets discretionary corrections where financial risk and fraud exposure are highest. | Does not govern the baseline normal run. | **HIGHLY RECOMMENDED** as primary candidate for secondary Finance Controller/CFO approval. |
| **Base 6: Cumulative Cycle Adjustments** | Sum of all adjustment deltas for a single cycle | Protects against multiple "salami-sliced" small adjustments exceeding a material risk limit. | Requires cumulative calculation logic across multiple revisions. | **HIGHLY RECOMMENDED** as companion control to Base 5. |

### 5.3 Proposed Multi-Tier Approval Structure (Illustrative Recommendation)
Based on enterprise governance best practices, Policy C recommends a tiered structure where routine baseline runs follow standard maker-checker, while discretionary adjustments or abnormal runs trigger executive review:

```
+---------------------------------------------------------------------------------------------------+
|                                 PROPOSED APPROVAL TIERING MODEL                                   |
+---------------------------------------------------------------------------------------------------+
|  TIER 1 (Standard Operations):                                                                    |
|  * Routine monthly runs with 0 variance: Prepared by Payroll Preparer; Approved by VP of HR.      |
|                                                                                                   |
|  TIER 2 (Executive Financial Escalation):                                                         |
|  * Trigger A: Individual or cumulative adjustments exceeding threshold [PENDING STAKEHOLDER].    |
|  * Trigger B: Abnormal headcount variance or budget overrun.                                      |
|  * Dual Sign-Off: VP of Human Resources + Corporate Controller / Chief Financial Officer.        |
+---------------------------------------------------------------------------------------------------+
```

---

## 6. Master Decision Register Updates (Policy C)

| Decision ID | Decision Title | Scope of Decision | Current Position | Approving Authority | Current Status |
|---|---|---|---|---|---|
| **DEC-C-01** | Segregation of Duties | Mandatory rule: $\text{preparer\_id} \ne \text{approved\_by\_id}$ enforced via API and database constraints. | Enforce strict maker-checker segregation; reject self-approval. | VP HR & Head of Internal Audit | `PROPOSED — APPROVAL PENDING` |
| **DEC-C-02** | Monetary Approval Threshold Basis | **Monetary Threshold and Two-Tier Approval Basis:** Establish the monetary basis (Run Net vs. Adjustment Delta) and threshold amount. | Proposed Threshold: ₹5,00,000 (Illustrative).<br>Threshold Basis: **UNDECIDED**.<br>Rationale: **PENDING STAKEHOLDER REVIEW**. | Corporate Controller & CFO | `PROPOSED — APPROVAL PENDING` |
| **DEC-C-03** | Lifecycle State Progression | Enforcing linear progression: `DRAFT` $\rightarrow$ `RECONCILING` $\rightarrow$ `RECONCILED` $\rightarrow$ `PENDING_APPROVAL`. | Mandate programmatic lifecycle gating. | Corporate Controller | `PROPOSED — APPROVAL PENDING` |

---

*End of Day 11 Stage 3 Policy C Payroll Approval and Maker-Checker (Amended).*
