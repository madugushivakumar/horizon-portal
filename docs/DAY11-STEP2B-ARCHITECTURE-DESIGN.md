# DAY 11 — STEP 2B TECHNICAL ARCHITECTURE & WORKFLOW DESIGN
## Production-Grade Financial Reconciliation, Historical Adjustments & 3-Stage Dual-Control Workflows

**Project:** Aura Workforce by Growmar — Horizon Portal  
**Document Reference:** `docs/DAY11-STEP2B-ARCHITECTURE-DESIGN.md`  
**Milestone:** Day 11 — Milestone 2: Step 2B Policy Review & Technical Design (Final Design Correction)  
**Date:** November 6, 2026 (Updated)  
**Status:** **TECHNICAL DESIGN COMPLETE — GATED FOR IMPLEMENTATION**  

---

## 1. Architectural Overview & System Dependency Map

The Step 2B technical architecture is designed to integrate seamlessly into Horizon Portal's existing Next.js 16 / React 19 / Prisma / SQLite stack. It reuses 100% of the accepted Step 2A/2A.1 foundation without introducing third-party architectural dependencies.

```
                    ┌────────────────────────────────────────────────────────┐
                    │               Client Layer (Next.js 16)                │
                    │  AdminPayrollConsole  |  PayrollRunDetails (React 19)  │
                    └───────────────────────────┬────────────────────────────┘
                                                │ Session Cookie (JWT)
                                                ▼
┌────────────────────────────────────────────────────────────────────────────────────────────┐
│                                 API Gateway / App Router                                   │
│  Stage 1: Proposal  │  Stage 2: Independent Approval  │  Stage 3: Execution  │  Run Approval│
└───────────────┬───────────────────────────────┬───────────────────────────┬────────────────┘
                │                               │                           │
                ▼                               ▼                           ▼
┌──────────────────────────────┐ ┌──────────────────────────────┐ ┌──────────────────────────┐
│   Authentication & RBAC      │ │  Reconciliation Engine       │ │  Security & Dual-Control │
│  - getAuthenticatedUser      │ │  - calculatePayrollRecon     │ │  - validatePayrollActor  │
│  - Active Account Check      │ │  - assertSqliteInt64         │ │  - validateMakerChecker  │
│  - HR / Admin Verification   │ │  - parseToPaise (BigInt)     │ │  - validateIdempotency   │
└───────────────┬──────────────┘ └──────────────┬───────────────┘ └─────────────┬────────────┘
                │                               │                               │
                └───────────────────────┬───────┴───────────────────────────────┘
                                        │
                                        ▼
┌────────────────────────────────────────────────────────────────────────────────────────────┐
│                              Transactional Commit Boundary                                 │
│                                prisma.$transaction(async (tx) => ...)                      │
│                                                                                            │
│   STAGE 1: Insert PayrollAdjustment (status: PROPOSED). ZERO HEADER MUTATION.              │
│   STAGE 2: Update PayrollAdjustment (status: APPROVED). ZERO HEADER MUTATION.              │
│   STAGE 3: (Separately Authorized): Update Header + Update Adjustment (status: EXECUTED)   │
│            + Insert AuditLog (Structured before/after snapshot).                           │
└───────────────────────────────────────┬────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌────────────────────────────────────────────────────────────────────────────────────────────┐
│                             Database Layer (SQLite / Prisma)                               │
│  payroll_runs (18)  |  payslips (2,469)  |  payroll_adjustments  |  audit_logs (87+)       │
└────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Dependency Map of Core Files

| File Path | Role in Architecture | Modifications Required in Step 2B |
|---|---|:---:|
| `prisma/schema.prisma` | Core schema (migration already applied with `ON DELETE RESTRICT`) | None (Schema ready) |
| `src/lib/payroll/reconciliation-engine.ts` | Calculation engine (exact integer paise, bounds check, invariants) | None (Accepted & locked) |
| `src/lib/payroll/payroll-security.ts` | Server-side actor, Maker-Checker, idempotency, revision checks | None (Accepted & locked) |
| `src/lib/payroll/payroll-audit.ts` | Structured audit payload builder & `persistPayrollAuditLog(tx, entry)` | None (Accepted & locked) |
| `src/app/api/v1/payroll/runs/[runId]/reconciliation-preview/route.ts` | Read-only preview endpoint | None (Accepted & locked) |
| `src/app/api/v1/payroll/runs/[runId]/reconcile-pre-approval/route.ts` | **Stage 1:** Pre-approval proposal creation (ZERO header mutation) | **New Endpoint in Step 2B** |
| `src/app/api/v1/payroll/adjustments/[adjustmentId]/approve/route.ts` | **Stage 2:** Independent Maker-Checker review & approval | **New Endpoint in Step 2B** |
| `src/app/api/v1/payroll/adjustments/[adjustmentId]/execute/route.ts` | **Stage 3:** Separately authorized atomic execution & header update | **New Endpoint in Step 2B** |
| `src/app/api/v1/payroll/runs/[runId]/historical-adjustment/route.ts` | Historical adjustment proposal endpoint for paid runs (PR-2026-08) | **New Endpoint in Step 2B** |
| `src/app/api/v1/payroll/adjustments/[adjustmentId]/route.ts` | Adjustment detail endpoint | **New Endpoint in Step 2B** |
| `src/app/api/v1/payroll/adjustments/[adjustmentId]/history/route.ts` | Adjustment audit history endpoint | **New Endpoint in Step 2B** |
| `src/app/api/v1/payroll/runs/[runId]/approve/route.ts` | Existing payroll run approval endpoint | **Refactor in Step 2B** to use `reconciliation-engine.ts` |
| `src/components/payroll/PayrollRunDetails.tsx` | Run inspection UI | Add reconciliation & adjustment triggers |

---

## 3. Detailed Workflow Specifications

### Workflow A: September Pre-Approval Correction Lifecycle (Three Distinct Stages)

Target: `PR-2026-09` (Unpaid in-flight batch: `status = "POSTED - PAYMENT PENDING"`, `payDate = null`, `approvalStatus = "Pending"`).

#### Stage 1: Proposal Creation
- **Endpoint:** `POST /api/v1/payroll/runs/[runId]/reconcile-pre-approval`
- **Purpose:** An authorized preparer creates an auditable adjustment proposal.
- **Request Body:**
  ```json
  {
    "idempotencyKey": "idem_pr202609_recon_001",
    "reason": "Pre-approval batch alignment to 441 verified payslips; excludes 3 future joiners (EMP00442-444).",
    "sourceDatasetReference": "03_Data_Pack/payslips.json"
  }
  ```
- **Execution Rules (Inside `prisma.$transaction`):**
  1. Authenticate user from session; verify active `Admin` or `HR` role.
  2. Load `PayrollRun` where `id = runId`. Confirm `!run.status.toUpperCase().includes("PAID")` and `run.approvalStatus !== "Approved"`.
  3. Run `calculatePayrollReconciliation(runId, { tx })`. Confirm `eligibleForPreApprovalReconciliation === true`.
  4. **CRITICAL RESTRICTION — NO HEADER UPDATE:**
     - The `PayrollRun` header values (`employeesPaid: 444`, `totalGross: 54788660.03`, `totalNet: 48089678.30`) are **NOT MODIFIED**.
     - The snapshot columns (`originalEmployeesPaid`, etc.) remain `null` until execution.
  5. **Insert `PayrollAdjustment` Record:**
     - `adjustmentType = "PRE_APPROVAL_CORRECTION"`
     - `status = "PROPOSED"`
     - `revision = 1`
     - Exact original BigInt paise (`5478866003`, `4808967830`) and proposed BigInt paise (`5443033152`, `4778232660`).
     - Variances: `varianceEmployees = -3`, `varianceGrossPaise = -35832851`, `varianceNetPaise = -30735170`.
     - `reconciledById = user.id`, `reconciledAt = now()`.
     - `approvedById = null`, `approvedAt = null`.
  6. **Persist Audit Log:** Call `persistPayrollAuditLog(tx, auditPayload)` with action `"PAYROLL_ADJUSTMENT_PROPOSED"`.
  7. Return HTTP 201 Created with adjustment ID and `status: "PROPOSED"`.

---

#### Stage 2: Independent Review & Approval
- **Endpoint:** `POST /api/v1/payroll/adjustments/[adjustmentId]/approve`
- **Purpose:** An independent authorized reviewer verifies and approves the proposal.
- **Request Body:**
  ```json
  {
    "expectedRevision": 1,
    "approvalNotes": "Verified onboarding dates of EMP00442-444. Approved reconciliation proposal."
  }
  ```
- **Execution Rules (Inside `prisma.$transaction`):**
  1. Authenticate reviewer from session; must hold active `Admin` role (or designated finance role).
  2. Load `PayrollAdjustment` where `id = adjustmentId`. Confirm `status === "PROPOSED"`.
  3. **Maker-Checker Dual Control Enforcement:**
     ```typescript
     const mcCheck = validateMakerChecker(adjustment.reconciledById, user.id);
     if (!mcCheck.valid) {
       return NextResponse.json({ error: mcCheck.error }, { status: 403 });
     }
     ```
  4. Optimistic concurrency check: `adjustment.revision === expectedRevision`.
  5. **Update Adjustment Record:**
     - `status = "APPROVED"`
     - `approvedById = user.id`
     - `approvedAt = now()`
  6. **CRITICAL RESTRICTION — NO HEADER UPDATE:**
     - The `PayrollRun` header values remain **UNTOUCHED**.
     - Approval certifies the adjustment but does not execute the ledger mutation.
  7. **Persist Audit Log:** Call `persistPayrollAuditLog(tx, auditPayload)` with action `"PAYROLL_ADJUSTMENT_APPROVED"`.
  8. Return HTTP 200 OK with `status: "APPROVED"`.

---

#### Stage 3: Execution Transaction
- **Endpoint:** `POST /api/v1/payroll/adjustments/[adjustmentId]/execute`
- **Purpose:** Separately authorized atomic operation that applies the approved adjustment to the operational header.
- **Request Body:**
  ```json
  {
    "expectedRevision": 1,
    "executionNotes": "Executing approved pre-approval alignment before payroll run authorization."
  }
  ```
- **Execution Rules (Inside `prisma.$transaction`):**
  1. Authenticate executing actor; verify explicit execution permission.
  2. Load `PayrollAdjustment` where `id = adjustmentId`. Confirm `status === "APPROVED"`.
  3. Load `PayrollRun` where `id = adjustment.payrollRunId`. Confirm `!run.status.toUpperCase().includes("PAID")` and `run.approvalStatus !== "Approved"`.
  4. **Atomic Header Mutation:**
     - Save current header into snapshot fields:
       - `originalEmployeesPaid = run.employeesPaid` (444)
       - `originalTotalGross = run.totalGross` (54788660.03)
       - `originalTotalNet = run.totalNet` (48089678.30)
       - `originalTotalDeductions = run.totalGross - run.totalNet` (6698981.73)
     - Overwrite operational header values with itemized totals:
       - `employeesPaid = adjustment.adjustedEmployeesPaid` (441)
       - `totalGross = adjustment.adjustedTotalGross` (54430331.52)
       - `totalNet = adjustment.adjustedTotalNet` (47782326.60)
     - Record reconciliation attribution:
       - `reconciledAt = now()`
       - `reconciledById = adjustment.reconciledById`
       - `reconciliationNotes = adjustment.reason`
  5. **Update Adjustment Status:**
     - `status = "EXECUTED"`
  6. **Persist Audit Log:** Call `persistPayrollAuditLog(tx, auditPayload)` with action `"PAYROLL_PRE_APPROVAL_CORRECTION_EXECUTED"`.
  7. Return HTTP 200 OK with updated run and executed adjustment.

---

### Workflow B: August Historical Adjustment Lifecycle

Target: `PR-2026-08` (Disbursed run: `status = "PAID"`, pay date `2026-09-01`).

#### Non-Negotiable Invariant
**The operational record in `payroll_runs` for `PR-2026-08` shall NEVER be modified, overwritten, or deleted.**
- Operational status remains `PAID`.
- Payment date remains `2026-09-01`.
- Headcount remains `429`, gross remains `₹48,685,007.97`, net remains `₹43,173,318.36`.
- All 424 historical payslips remain 100% untouched.

#### Semantic Classification: Reporting-Only vs. Financial Adjustment
- **Category 1: Reporting-Only Reconciliation Entry (`HISTORICAL_REPORTING_RECONCILIATION`)**
  - Documents the audit tie-out variance between historical disbursement and itemized payslips for annual reporting and tax transparency.
  - **Zero financial movement**: No receivable, no payable, no cash clawback, no arrears disbursement.
- **Category 2: Genuine Financial Adjustment (`FINANCIAL_ADJUSTMENT_CLAIM`)**
  - Represents a formal balance-sheet claim or liability resulting from cash overpayment. Requires corporate finance sign-off, journal vouchers, and banking batches.
- **Proposal Endpoint:** `POST /api/v1/payroll/runs/[runId]/historical-adjustment`
  - Body specifies `adjustmentCategory: "HISTORICAL_REPORTING_RECONCILIATION"`.
  - Creates `PayrollAdjustment` with `status = "PROPOSED"`.
  - Independent review via `POST /api/v1/payroll/adjustments/[adjustmentId]/approve` sets `status = "APPROVED"`.
  - **Zero mutations to `payroll_runs` in either proposal or approval stage.**

---

### Workflow C: Reconciled Payroll Run Final Approval
- **Target:** `PR-2026-09` (Following successful Stage 3 execution).
- **Endpoint:** `POST /api/v1/payroll/runs/[runId]/approve`
- **Execution Rules:**
  1. Recalculates reconciliation via `calculatePayrollReconciliation`.
  2. Verifies `reconciliationStatus === "MATCHED"`.
  3. Enforces Maker-Checker: Approver cannot be the reconciler (`user.id !== run.reconciledById`).
  4. Atomically updates `approvalStatus = "Approved"`, `approvedById = user.id`, `approvedAt = now()`.
  5. Writes audit log `"PAYROLL_RUN_APPROVED"`.

---

## 4. Concurrency, Atomicity & Error Handling

```
Client Request (Stage 1, 2, or 3)
      │
      ▼
BEGIN DEFERRED TRANSACTION
      │
      ├─► 1. Check idempotencyKey in payroll_adjustments
      │      └─► If exists: Return cached record (Idempotent 200)
      │
      ├─► 2. Re-read target record with findUnique
      │      └─► If status/revision changed: ROLLBACK & Return 409 Conflict
      │
      ├─► 3. Perform calculation & invariant assertion
      │      └─► If invariant fails: ROLLBACK & Return 422 Unprocessable
      │
      ├─► 4. Apply DB Mutation (Stage 1/2: Adjustment only; Stage 3: Header + Adjustment)
      │      └─► If constraint fails: ROLLBACK & Return 409 Conflict
      │
      ├─► 5. Persist Structured AuditLog (tx.auditLog.create)
      │      └─► If fails: ROLLBACK & Return 500 Internal Error
      │
COMMIT TRANSACTION
      │
      ▼
Return Sanitized JSON Response (200 / 201)
```

---

## 5. UI Architecture & Integration Plan

1. **`PayrollReconciliation.tsx`:**
   - Pre-Approval Banner: Shows current status ("No Proposal", "Proposal Pending Review", "Proposal Approved — Ready for Execution", "Reconciled").
   - Disables execution until independent approval is certified.
2. **`ReconciliationProposalModal.tsx` (New):**
   - Renders Stage 1 proposal creation interface.
   - Clarifies that proposal creation does not modify header figures.
3. **`ReconciliationApprovalModal.tsx` (New):**
   - Renders Stage 2 independent review interface.
   - Enforces Maker-Checker visual guidance (disables approval for the preparer).
4. **`ReconciliationExecutionModal.tsx` (New):**
   - Renders Stage 3 execution interface with prominent warning before applying header updates.
5. **`HistoricalAdjustmentModal.tsx` (New):**
   - Shows original disbursement figures (permanently immutable).
   - Shows proposed reporting figures and variances.

---

## 6. Implementation Readiness & Gating

This architecture is fully specified and ready for implementation. However:
- **No implementation code or endpoints have been created.**
- **No database records have been modified.**
- **Implementation is strictly gated until formal approval is granted on Policy Decisions A through E.**
