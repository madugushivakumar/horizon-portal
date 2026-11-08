# DAY 11 — STAGE 4A: EXISTING VS. PROPOSED CONTROLS MATRIX
## Aura Workforce by Growmar — Horizon Portal
### Phase 3 — Teams and Insight | Day 11: Admin Payroll Run Console
### Stage 4A: Read-Only Technical Assessment & Implementation Design

---

## Document Metadata

| Attribute | Specification |
|---|---|
| **Document ID** | `DAY11-STAGE4A-EXISTING-VS-PROPOSED-CONTROLS-MATRIX` |
| **Document Title** | Technical Assessment of Existing Application Controls vs. Stage 3 Governance Proposals |
| **Governing Baseline** | Stage 3 Approved-for-Review Governance Package (`DAY11-STAGE3-*`) |
| **Stage & Mode** | Stage 4A — Read-Only Technical Assessment |
| **Governance Gate 1** | **LOCKED — FINANCIAL EXECUTION NOT AUTHORIZED** |
| **Date of Execution** | November 7, 2026 |

---

## 1. Executive Summary & Verification Methodology

Stage 4A Workstream 2 conducts a rigorous, empirical code-level audit comparing the governance controls proposed in Stage 3 (Policies A through E) against the actual implementation in the Horizon Portal codebase.

### Assessment Rules:
1. **Zero Assumption:** Do not claim a control exists merely because a UI button is hidden or an API error message is defined.
2. **Distinguish Code vs. Database:** An API `if` statement is not a database-level integrity constraint.
3. **Evidence-Based Taxonomy:** Every evaluated control is assigned one of six standardized verification statuses:
   - `IMPLEMENTED_AND_VERIFIED`: Code exists, enforces the rule server-side, and is verified by active test suites.
   - `PARTIALLY_IMPLEMENTED`: Logic exists but contains structural bypasses, edge-case gaps, or incomplete role coverage.
   - `EXISTING_BUT_NOT_VERIFIED`: Code appears present in codebase but lacks dedicated automated test verification.
   - `DOCUMENTED_PROPOSAL_ONLY`: Control is defined in Stage 3 documentation but zero application code exists.
   - `NOT_IMPLEMENTED`: Required control does not exist in schema, APIs, or business logic.
   - `NOT_APPLICABLE`: Control is not relevant to the current technical layer.

---

## 2. Comprehensive Controls Comparison Matrix

The table below details the technical assessment across all core governance control areas:

| Control Area | Proposed Governance Standard (Stage 3) | Actual Codebase Implementation | Verification Status | Exact Code Location | Supporting Test Coverage | Architectural Limitation & Identified Gap |
|---|---|---|---|---|---|---|
| **1. Maker-Checker Separation** | The user who prepared or calculated a payroll run or adjustment cannot approve it ($\text{preparer\_id} \ne \text{approved\_by\_id}$). | Checked conditionally in `approve/route.ts`: if `run.preparerId` matches `user.id` or `user.employeeId`, HTTP 403 is returned. `validateMakerChecker()` utility exists in `payroll-security.ts`. | `PARTIALLY_IMPLEMENTED` | `src/app/api/v1/payroll/runs/[runId]/approve/route.ts#L90-L104`<br>`src/lib/payroll/payroll-security.ts#L142-L173` | `scripts/test-day11-step2a1-remediation.ts` (Test Group 6) | `CRITICAL CONTROL GAP — HISTORICAL MAKER-CHECKER BYPASS POSSIBLE WHEN preparerId IS NULL`. All 18 historical runs have `preparer_id = NULL`; check is bypassed. Existing role checks do not establish maker-checker separation. |
| **2. API-Level Enforcement** | All state-mutating payroll endpoints must enforce authentication and strict RBAC server-side. | Validates session token via `getAuthenticatedUserFromToken()`. Restricts access strictly to `ADMIN` and `HR` roles; returns HTTP 401/403. | `IMPLEMENTED_AND_VERIFIED` | `src/app/api/v1/payroll/runs/[runId]/approve/route.ts#L44-L63`<br>`src/app/api/v1/payroll/runs/[runId]/reconciliation-preview/route.ts#L51-L76` | `scripts/test-day11-step2a1-remediation.ts` (Test Group 4) | Enforces HR/Admin only. Does not recognize distinct Finance, CFO, or Auditor roles. |
| **3. Database-Level Enforcement** | Durable database constraints preventing self-approval or illegal state jumps. | Schema has foreign keys and unique indexes, but **zero SQLite CHECK constraints** enforcing `preparer_id != approved_by_id`. | `NOT_IMPLEMENTED` | `prisma/schema.prisma` (`model PayrollRun`, `model PayrollAdjustment`) | None | Relying entirely on application-layer logic. Direct SQL mutations can write identical preparer and approver IDs without constraint violations. |
| **4. Role-Based Authorization (RBAC)** | Strict segregation across 8 enterprise roles (Preparer, Reviewer, Approver, Controller, CFO, Treasury, Admin, Auditor). | User model only defines `role` string. In `dev.db`, only `Admin`, `HR`, `Manager`, and `Employee` exist. Finance, CFO, Controller, and Auditor roles do not exist. | `PARTIALLY_IMPLEMENTED` | `prisma/schema.prisma#L1-L25`<br>`src/lib/auth/user.ts` | `scripts/test-day11-step2a-foundation.ts` | **Major Governance Gap:** Finance Controller, CFO, and Internal Audit roles are not implemented in the application authentication system. |
| **5. Approval Monetary Threshold** | Two-tier approval escalation (e.g., secondary Controller/CFO sign-off) for runs or adjustments exceeding threshold. | Codebase inspection confirms **zero threshold logic** in `approve/route.ts` or console UI. Single HR/Admin approval executes full transition. | `DOCUMENTED_PROPOSAL_ONLY` | None (Zero matches in `src/`) | None | `DEC-C-02 — MONETARY THRESHOLD BASIS UNDECIDED — FORMAL CONTROLLER/CFO DECISION REQUIRED.` The ₹5,00,000 value remains illustrative unless formally approved. |
| **6. Approval Audit Trail** | Actor identity, timestamp, decision, notes, and before/after financial summary recorded immutably. | Atomic transaction in `approve/route.ts` calls `logPayrollApproval()`, capturing actor snapshot, status, reconciliation status, and financial payload into `audit_logs`. | `IMPLEMENTED_AND_VERIFIED` | `src/app/api/v1/payroll/runs/[runId]/approve/route.ts#L200-L218`<br>`src/lib/audit/audit-logger.ts` | `scripts/test-day11-step2a1-remediation.ts` (Test Group 5) | Verified in atomic transaction. However, `audit_logs` table lacks dedicated `payroll_run_id` column (stored inside JSON `details`). |
| **7. Self-Approval Prevention** | UI and API prevent an administrator from approving their own initiated batches. | UI modal checks `isPreparerSelf` and disables button. API returns HTTP 403. | `PARTIALLY_IMPLEMENTED` | `src/components/payroll/ApprovalConfirmationModal.tsx#L46`<br>`src/components/payroll/PayrollRunDetails.tsx#L215-L219` | `scripts/test-day11-step2a1-remediation.ts` (Test Group 6) | Gated on `preparerId`. Since historical runs have `preparerId = NULL`, UI would show button enabled if not blocked by other flags. |
| **8. Historical Run Disposition** | Distinct governance workflow and status (`HISTORICAL_DISPOSITION_APPROVED`) for historical data pack mismatches. | `approve/route.ts` hard-blocks any run with `run.status.includes("PAID")` (HTTP 409) or `reconciliationStatus === "MISMATCH"` (HTTP 422). | `NOT_IMPLEMENTED` | `src/app/api/v1/payroll/runs/[runId]/approve/route.ts#L108-L171` | None | All candidate statuses are `PROPOSED — PENDING FORMAL GOVERNANCE APPROVAL`. Authority is `AUTHORITY NOT YET APPROVED — GOVERNANCE DECISION REQUIRED`. Historical disposition does not establish financial approval, settlement, or GL posting. |
| **9. Reconciliation Prerequisite Guard** | Approval strictly requires passing automated reconciliation checks prior to submission. | `approve/route.ts` executes `reconcilePayrollRun(runId)`. If status is `NO_ITEMS` or `MISMATCH`, returns HTTP 422 Unprocessable Entity. | `IMPLEMENTED_AND_VERIFIED` | `src/app/api/v1/payroll/runs/[runId]/approve/route.ts#L134-L171` | `scripts/test-day11-step2a1-remediation.ts` (Test Group 4) | Prevents operational approval of mismatched runs. However, prevents resolution of historical runs without an adjustment ledger. |
| **10. Audit Record Immutability** | Audit log records cannot be updated or deleted post-creation; tamper-evident hash chaining. | Prisma client lacks update/delete endpoints for `AuditLog`. However, no SQLite triggers or Merkle hash chaining (`record_hash`) exist. | `PARTIALLY_IMPLEMENTED` | `prisma/schema.prisma#L300-L325` | `scripts/test-day11-step2a1-remediation.ts` (Test Group 8) | App-level read/append only, but vulnerable to direct SQL manipulation outside Next.js. |
| **11. BigInt Integer Arithmetic** | All financial calculations executed in arbitrary-precision integer paise without IEEE-754 drift. | Implemented in `reconciliation-engine.ts` using `BigInt` and `parseToPaise()`. Checked against SQLite Int64 limits. | `IMPLEMENTED_AND_VERIFIED` | `src/lib/payroll/reconciliation-engine.ts#L18-L38`<br>`src/lib/payroll/reconciliation-engine.ts#L209-L283` | `scripts/test-day11-step2a1-remediation.ts` (Test Groups 1, 2, 3) | Authoritative calculation uses BigInt paise. However, `reconciliation-service.ts` uses floating-point `Math.round(amount * 100)` numbers. |
| **12. Append-Only Adjustment Table** | `payroll_adjustments` stores double-entry deltas without mutating original historical records. | Table exists in `prisma/schema.prisma` with 36 columns and index constraints. In `prisma/dev.db`, table exists with **0 rows**. | `EXISTING_BUT_NOT_VERIFIED` | `prisma/schema.prisma#L60-L125` | `scripts/test-day11-step2a1-remediation.ts` (Test Group 7) | Schema and migration exist, but no API routes or frontend components interact with `payroll_adjustments`. Runtime logic is unbuilt. |

---

## 3. Key Technical Vulnerabilities & Gaps Identified

### Gap 1: CRITICAL CONTROL GAP — HISTORICAL MAKER-CHECKER BYPASS POSSIBLE WHEN preparerId IS NULL

In `src/app/api/v1/payroll/runs/[runId]/approve/route.ts`:
```typescript
if (run.preparerId) {
  const isPreparer = user.id === run.preparerId || (user.employeeId && user.employeeId === run.preparerId);
  if (isPreparer) {
    return NextResponse.json({ error: "Separation of duties violation..." }, { status: 403 });
  }
}
```

#### Detailed Findings & Technical Assessment:
1. **Critical Security & Segregation-of-Duties Gap:** The conditional evaluation (`if (run.preparerId)`) causes the maker-checker check to be completely skipped whenever `preparerId` is `null` or unassigned.
2. **Historical Baseline Impact:** In `prisma/dev.db`, all 18 historical payroll runs (`PR-2025-04` through `PR-2026-09`) have `preparer_id = NULL`. As a consequence, maker-checker validation is bypassed for every historical run in the database.
3. **Role Checks Do Not Establish Maker-Checker:** Existing role-based authorization (`validatePayrollActor` ensuring caller is `ADMIN` or `HR`) only establishes that the actor has high-level permissions; it does NOT independently establish maker-checker separation or dual-control integrity.
4. **API Safety Determination:** The existing approval API must **NOT** be considered safe for historical approval based solely on role checks and reconciliation checks.
5. **Strict Architectural Distinctions:**
   - *Existing Role-Based Authorization:* Gated to `ADMIN` and `HR` roles via JWT cookies.
   - *Existing Conditional Maker-Checker Validation:* Skips validation if `preparerId` is `null`.
   - *Missing or Ineffective Historical Maker-Checker Enforcement:* Complete absence of dual-control for historical runs where `preparer_id = NULL`.
   - *Proposed Future Remediation:* Explicit fail-closed validation strategy (detailed below).
6. **No Universal Claim:** Maker-checker enforcement is **NOT** universally implemented and verified across the platform.

#### Future Remediation Requirements (Design Only — Not Implemented):
Future implementation must deploy an explicit, fail-closed validation strategy for records without a valid preparer, including:
- Rejecting approval outright when the preparer identity is missing or null on operational runs.
- Requiring independently verified preparation attribution before any approval action can proceed.
- Enforcing strictly distinct preparer and approver identities across all lifecycle stages ($\text{preparer\_id} \ne \text{approved\_by\_id}$).
- Applying equivalent validation server-side across all state-mutating endpoints.
- Defining durable database-level protections (e.g., SQLite triggers or check constraints) where technically appropriate.
- Comprehensive test coverage asserting rejection on null, missing, invalid, and identical actor identities.
*(These represent proposed future remediation requirements, not implemented controls. Zero controls have been modified in Stage 4A.)*

---

### Gap 2: Inability to Approve or Reconcile Historical Runs
The existing approval route enforces two strict preconditions:
1. `run.status.toUpperCase().includes("PAID")` $\rightarrow$ returns **HTTP 409 Conflict**.
2. `reconciliation.reconciliationStatus === "MISMATCH"` $\rightarrow$ returns **HTTP 422 Unprocessable Entity**.

Because runs `PR-2025-04` through `PR-2026-08` have status `'PAID'`, and run `PR-2026-09` has status `'MISMATCH'`, **100% of the 18 historical runs in the database are programmatically locked out from approval**. There is no dedicated API route or parameter for applying an authorized historical disposition or true-up adjustment.

---

### Gap 3: RECONCILIATION CONSISTENCY DEFECT — OPPOSITE VARIANCE SIGN CONVENTIONS

The codebase contains two parallel reconciliation services with differing math and opposing sign conventions:
1. `src/lib/payroll/reconciliation-engine.ts`:
   $$\mathbf{Variance} = \mathbf{Itemized\ Total\ —\ Stored\ Header}$$
   Uses arbitrary-precision `BigInt` paise arithmetic. Produces a **negative** delta when the stored header exceeds itemized sums (e.g., Run `PR-2026-04` Gross Variance: `-₹32,17,879.83`).
2. `src/lib/payroll/reconciliation-service.ts`:
   $$\mathbf{Variance} = \mathbf{Stored\ Header\ —\ Itemized\ Total}$$
   Uses floating-point JavaScript numbers rounded via `toPaise()`. Produces a **positive** delta when the stored header exceeds itemized sums (e.g., Run `PR-2026-04` Gross Difference: `+₹32,17,879.83`).

#### Defect Analysis & Architectural Impact:
- **Reconciliation Consistency Defect:** The exact same underlying data pack discrepancy appears positive in one service and negative in another, causing sign inversion across consumers.
- **Impact on Platform:** Discrepancies affect API responses, UI delta badges, variance interpretation (shortfall vs. excess), financial summary reports, and potential downstream ERP/GL export mappings.
- **Current Behavior Preserved:** The exact current behavior of both services is preserved in Stage 4A. Neither service has been altered, no historical variance values have been rewritten, and no historical UI labels have been modified.
- **Proposed Future Authority:** The `BigInt` paise reconciliation engine (`reconciliation-engine.ts`) is identified as the **proposed future calculation authority**, subject to formal governance approval.
- **Proposed Consumer Consolidation:** Consolidation of all API routes, UI components, and exports onto the approved calculation authority is documented for post-Gate 1 Phase 4B-1. Consolidation has **NOT** occurred.
- **Required Regression Test Matrix:** Post-Gate 1 implementation must enforce regression tests covering:
  1. Header greater than itemized total.
  2. Header less than itemized total.
  3. Equal header and itemized total.
  4. Positive and negative variance.
  5. Zero variance.
  6. Integer paise precision.
  7. API and UI label consistency.

---

## 4. Workstream 2 Conclusion

The technical assessment confirms:
- **Core Security Foundations Exist:** Server-side RBAC checks, atomic audit logging, BigInt paise parsing, and conditional maker-checker checks are verified in code.
- **Critical Security Control Gap Documented:** `preparerId` nullability enables complete maker-checker bypass on historical records.
- **Reconciliation Defect Documented:** Inverted sign conventions exist between `reconciliation-engine.ts` and `reconciliation-service.ts`.
- **External Evidence Availability:**  
  `EXTERNAL EVIDENCE NOT AVAILABLE IN THE INSPECTED PROJECT REPOSITORY — INDEPENDENT EXTERNAL VALIDATION PENDING.`
- **Enterprise Controls are Gapped:** Dual-tier monetary thresholds (`DEC-C-02` undecided; ₹5,00,000 illustrative), Finance/CFO role recognition, historical exception handling (candidate statuses pending approval; authority not yet approved), and database-level constraint enforcement exist **only as Stage 3 governance proposals**, not active software functionality.
- **Gate 1 Status:** `GATE 1 LOCKED — FINANCIAL EXECUTION NOT AUTHORIZED.`

---

*End of Day 11 Stage 4A Existing vs. Proposed Controls Matrix.*

