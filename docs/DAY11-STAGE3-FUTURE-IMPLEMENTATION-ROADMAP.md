# DAY 11 — STAGE 3: FUTURE IMPLEMENTATION ROADMAP (AMENDED)
## Aura Workforce by Growmar — Horizon Portal
### Phase 3 — Teams and Insight | Day 11: Admin Payroll Run Console
### Stage 3 of 6: Formal Payroll Governance Package

---

## Document Metadata

| Attribute | Specification |
|---|---|
| **Document ID** | `DAY11-STAGE3-FUTURE-IMPLEMENTATION-ROADMAP` |
| **Document Title** | Post-Gate 1 Technical Implementation Roadmap & Operational Execution Plan (Stages 4–6) |
| **Governing Baseline** | Stage 1 Revision 2.1 (`DAY11-POLICY-A-SOURCE-OF-TRUTH-DECISION.md`) & Stage 2 Forensic Report (`DAY11-STAGE2-ROOT-CAUSE-FORENSIC-REPORT.md`) |
| **Supporting Artifacts** | [`docs/DAY11-STAGE3-FIVE-ISSUE-CORRECTION-REGISTER.md`](file:///c:/Users/Madugu%20Shiva%20Kumar/OneDrive/图片/Desktop/horizon-portal/docs/DAY11-STAGE3-FIVE-ISSUE-CORRECTION-REGISTER.md)<br>[`docs/DAY11-STAGE3-CROSS-POLICY-CONTRADICTION-AND-CONSISTENCY-AUDIT.md`](file:///c:/Users/Madugu%20Shiva%20Kumar/OneDrive/图片/Desktop/horizon-portal/docs/DAY11-STAGE3-CROSS-POLICY-CONTRADICTION-AND-CONSISTENCY-AUDIT.md) |
| **Status** | `PROPOSED — DOCUMENTATION ONLY` |
| **Governance Gate** | Gate 1 Locked (`GATE 1: LOCKED — FINANCIAL EXECUTION NOT AUTHORIZED`) |
| **Execution Prerequisite** | Unanimous Gate 1 Ratification by CFO, Controller, VP HR, and Audit |

---

## 1. Executive Notice & Scope Restriction

> [!WARNING]
> **DOCUMENTATION ONLY — EXECUTION STRICTLY PROHIBITED:**  
> This roadmap documents the planned technical workstreams, schema enhancements, and operational procedures for subsequent phases (Stages 4, 5, and 6). **No work described in this roadmap may commence while Gate 1 is LOCKED.** This document is prepared strictly for technical readiness review by corporate stakeholders.

---

## 2. Stage 4: Technical Implementation Plan (Post-Gate 1)

Upon formal unlocking of Governance Gate 1, engineering execution will commence across five coordinated workstreams corresponding to Policies A through E:

```
+---------------------------------------------------------------------------------------------------+
|                               STAGE 4 TECHNICAL IMPLEMENTATION WORKSTREAMS                        |
+---------------------------------------------------------------------------------------------------+
|  [Workstream A] Source-of-Truth Hierarchy Service & 6-Population Ingestion Engine                 |
|  [Workstream B] Automated 9-Dimensional Reconciliation Engine & Dimension-Specific Tolerances     |
|  [Workstream C] Dual-Tier Maker-Checker Approval Workflow & Qualified Threshold Escalation        |
|  [Workstream D] Append-Only Double-Entry Adjustment Ledger & 36-Column Schema Activation         |
|  [Workstream E] Cryptographic Audit Log Chaining & Tripartite Financial Evidence Services         |
+---------------------------------------------------------------------------------------------------+
```

### 2.1 Workstream A: Policy A Implementation (Source of Truth Service)
- **Objective:** Deploy the authoritative data loader and calculation resolution service.
- **Key Deliverables:**
  1. `src/lib/payroll/source-of-truth.ts`: Implement `resolveAuthoritativePayroll(runId)` prioritizing itemized payslips for financial amounts and active employee rosters with verified effective dates for headcounts.
  2. Implement programmatic separation of the six employee populations (Master, Observed, Active, Eligible, Itemized, Approved Headcount).
  3. Ensure legacy run headers (`PR-2025-04`..`2026-03`) are isolated into read-only snapshot structs (`LegacyHeaderSnapshot`).

### 2.2 Workstream B: Policy B Implementation (Reconciliation & Variance Engine)
- **Objective:** Deploy the automated 9-dimensional reconciliation calculation engine.
- **Key Deliverables:**
  1. Extend `src/lib/payroll/reconciliation-engine.ts`:
     - Implement BigInt arbitrary-precision integer paise arithmetic across Dimensions A through I.
     - Deploy the standardized 9 variance classifiers (`MATCH`, `MISMATCH`, `ROUNDING_VARIANCE`, `TIMING_VARIANCE`, `MISSING_SOURCE`, `DUPLICATE_RECORD`, `NO_ITEMS`, `UNRESOLVED`, `EXTERNAL_EVIDENCE_REQUIRED`).
     - Enforce zero-tolerance rule ($0\text{ paise}$) strictly for exact internal arithmetic (Dims A/B/C); apply formal variance tracking to D through I.
  2. Implement programmatic approval blocker: If `reconciliation.status !== 'MATCH'`, the API must reject approval requests with HTTP 409 Conflict.

### 2.3 Workstream C: Policy C Implementation (Maker-Checker & UI Workflow)
- **Objective:** Upgrade the Admin Payroll Console UI and API endpoints to enforce dual-tier governance.
- **Key Deliverables:**
  1. Refactor `src/app/api/v1/payroll/runs/[runId]/approve/route.ts`:
     - Enforce strict maker-checker segregation ($\text{preparer\_id} \ne \text{approved\_by\_id}$).
     - Deploy the stakeholder-approved monetary threshold basis (per Decision `DEC-C-02`) to trigger secondary `FINANCE_CONTROLLER` or `CFO` sign-off.
  2. UI Console Updates (`src/components/payroll/AdminPayrollConsole.tsx`):
     - Display maker identity, preparation timestamp, and reconciliation certificate status.
     - Disable the "Approve Payroll" button for users with `PAYROLL_PREPARER` role or when the viewer is the preparer.
     - Add secondary approval modal for executive roles.

### 2.4 Workstream D: Policy D Implementation (Append-Only Adjustment Ledger)
- **Objective:** Activate the 36-column `payroll_adjustments` table and supporting services.
- **Key Deliverables:**
  1. Create `src/lib/payroll/adjustment-service.ts`:
     - Programmatic creation of append-only adjustment records linked to `payroll_runs(id)`.
     - Automatic computation of BigInt paise variance deltas (`variance_gross_paise`, etc.) and float display helpers.
     - Generation of SHA-256 idempotency keys (`SHA256(run_id + revision + timestamp)`).
  2. Multi-Actor State Machine: Implement `DRAFT` $\rightarrow$ `SUBMITTED` $\rightarrow$ `REVIEWED` $\rightarrow$ `APPROVED` $\rightarrow$ `POSTED` lifecycle with strict actor segregation.
  3. Reversal Protocol: Implement `createAdjustmentReversal(adjustmentId)` creating compensating inverse adjustment rows.

### 2.5 Workstream E: Policy E Implementation (Audit & Settlement Evidence)
- **Objective:** Enhance audit logging, GL journal exports, and banking settlement tie-outs.
- **Key Deliverables:**
  1. Non-breaking Prisma Migration for `audit_logs`:
     - Add `payroll_run_id`, `adjustment_id`, `record_hash`, and `previous_hash` to support tamper-evident cryptographic chaining.
  2. Deploy General Ledger Export Generator:
     - Integration with Controller-verified corporate chart of accounts (Decision `DEC-E-04`).
  3. Deploy Banking Settlement Ingester:
     - Hybrid reconciliation module: Batch statement debit matching + itemized beneficiary UTR verification.

---

## 3. Stage 5: Execution & Operational Reconciliation Plan

Once Stage 4 technical services are deployed and verified, Stage 5 will execute the operational reconciliation across all 18 payroll runs:
- **12 Matching Runs (`PR-2025-04`..`PR-2026-03`):** Reconcile against legacy baselines; issue digital reconciliation certificates.
- **6 Historical Mismatching Runs (`PR-2026-04`..`PR-2026-09`):** Book append-only adjustments in `payroll_adjustments` using exact BigInt paise deltas; execute dual-actor maker-checker sign-off; achieve 100% mathematical closure.

---

## 4. Stage 6: Final Verification & Governance Closeout Plan

Stage 6 executes final delivery sign-off:
- Automated regression suite execution (`npm test` + Step 2a/2a1 tests).
- Audit trail cryptographic verification.
- Tripartite evidence compilation.
- Formal Day 11 closeout report.

---

## 5. Enterprise Risk Register & Mitigation Strategy

| Risk ID | Category | Risk Description | Severity | Mitigation Strategy |
|---|---|---|---|---|
| **RSK-01** | Technical | Database schema migration disrupts existing data in `dev.db`. | HIGH | Strictly non-breaking schema additions only; pre-migration SQLite backup; execute inside Prisma transaction. |
| **RSK-02** | Data Integrity | Inadvertent modification of original `03_Data_Pack` files. | CRITICAL | Read-only filesystem permissions; pre- and post-execution SHA256 integrity checks in CI/CD pipeline. |
| **RSK-03** | Governance | Stakeholders reject proposed threshold basis or GL accounts. | HIGH | Decisions DEC-C-02 and DEC-E-04 remain explicit open items; Gate 1 remains locked until resolved. |
| **RSK-04** | Compliance | External auditors reject reconciliation due to missing GL/tax records. | HIGH | Fully disclose external evidence gaps (Policy E); distinguish mathematical tie-out from GL finality. |
| **RSK-05** | Security | Administrative user bypasses maker-checker via direct API call. | HIGH | Enforce maker-checker segregation in API route middleware, database constraints, and audit logging. |

---

*End of Day 11 Stage 3 Future Implementation Roadmap (Amended).*
