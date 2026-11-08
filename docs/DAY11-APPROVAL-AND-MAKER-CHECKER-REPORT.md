# DAY 11 — APPROVAL WORKFLOW & MAKER-CHECKER SECURITY REPORT
**Project:** Aura Workforce by Growmar — Horizon Portal  
**Phase:** Phase 3 — Teams and Insight (Day 11: Admin Payroll Run Console)  
**Audit Date:** November 7, 2026  
**Auditor:** Senior Full-Stack Engineer, Payroll Systems Architect & Forensic Auditor  
**Repository:** `horizon-portal`  
**Branch:** `main`  
**Release Tag:** `phase-3`

---

## 1. Executive Summary

This report documents the architectural design, implementation, and automated testing of the Maker-Checker Dual Control Approval Workflow in Aura Workforce Horizon Portal.

The approval engine enforces strict separation of duties, comprehensive gating constraints, optimistic concurrency protection, and atomic audit logging to satisfy corporate governance and financial compliance requirements.

---

## 2. Maker-Checker Dual Control Architecture

### 2.1 Governance Model
In enterprise payroll systems, dual control requires that the individual who creates or prepares a payroll run ("Maker") cannot also authorize or release the payment ("Checker").

### 2.2 Server-Side Enforcement (`src/app/api/v1/payroll/runs/[runId]/approve/route.ts`)
```typescript
// Enforce Maker-Checker Separation of Duties
if (run.createdBy && run.createdBy === user.id) {
  return NextResponse.json(
    { 
      error: 'Separation of duties violation: The preparer of a payroll run cannot approve it.',
      code: 'DUAL_CONTROL_VIOLATION' 
    },
    { status: 403 }
  );
}
```
- **Automated Test Verification:** When a preparer attempts to approve their own run, the API immediately halts execution and returns `HTTP 403 Forbidden` with the error `Separation of duties violation`.
- **Role Verification:** Only users authenticated with `Admin` or `HR` roles are eligible to perform checker functions. Standard `Employee` and `Manager` accounts receive `HTTP 403 Forbidden`.

---

## 3. Approval Gating Constraints & Concurrency Controls

The approval endpoint executes five sequential security and data integrity gates before authorizing state mutation:

### 3.1 Gate 1: Reconciliation Integrity Gate
- Before approval is permitted, the server runs a real-time BigInt integer-paise reconciliation of the target run.
- If the run status is `MISMATCH` or `NO_ITEMS`, approval is strictly blocked:
  ```typescript
  if (reconciliation.status === 'MISMATCH' || reconciliation.status === 'NO_ITEMS') {
    return NextResponse.json(
      { 
        error: `Cannot approve payroll run with status '${reconciliation.status}'. Run totals must reconcile with itemized payslips prior to approval.`,
        code: 'UNRECONCILED_RUN_APPROVAL_BLOCKED',
        reconciliation
      },
      { status: 422 }
    );
  }
  ```
- **Result:** Active production run `PR-2026-09` cannot be approved due to its negative variance, protecting the company from disbursing unverified funds.

### 3.2 Gate 2: Operational State Gate (Paid Runs)
- If a run has already achieved the operational status of `PAID` (e.g., historical run `PR-2026-08`), approval is blocked:
  ```typescript
  if (run.status === 'PAID') {
    return NextResponse.json(
      { error: 'Cannot approve a payroll run that has already been PAID.', code: 'RUN_ALREADY_PAID' },
      { status: 409 }
    );
  }
  ```
- **Status:** Verified via automated tests returning `HTTP 409 Conflict`.

### 3.3 Gate 3: Idempotency & Double-Approval Gate
- If a run has already been approved (`approvalStatus === 'Approved'`), repeated approval requests are rejected:
  ```typescript
  if (run.approvalStatus === 'Approved') {
    return NextResponse.json(
      { error: 'This payroll run has already been approved.', code: 'ALREADY_APPROVED' },
      { status: 409 }
    );
  }
  ```
- **Status:** Verified via automated tests returning `HTTP 409 Conflict`.

---

## 4. Concurrency & Transactional Atomicity

To eliminate race conditions, double-submissions, and partial-write failures during approval, the database update is wrapped in an atomic Prisma transaction (`prisma.$transaction`):

```typescript
const [updatedRun, auditEntry] = await prisma.$transaction([
  prisma.payrollRun.update({
    where: { 
      id: runId,
      // Concurrency check: Ensure status hasn't transitioned concurrently
      approvalStatus: { not: 'Approved' }
    },
    data: {
      approvalStatus: 'Approved',
      approvedById: user.id,
      approvedAt: new Date(),
      approvalNotes: notes || 'Approved via Admin Payroll Console'
    }
  }),
  prisma.auditLog.create({
    data: {
      action: 'PAYROLL_APPROVED',
      entity: 'PayrollRun',
      entityId: runId,
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      details: JSON.stringify({
        runId,
        period: run.payrollPeriod,
        approvedAt: new Date().toISOString(),
        notes: notes || 'Approved via Admin Payroll Console',
        previousApprovalStatus: run.approvalStatus,
        newApprovalStatus: 'Approved'
      })
    }
  })
]);
```

### Key Guarantees:
1. **Atomic Coupling:** The `PayrollRun` status update and the `AuditLog` creation succeed or fail together. An approved run without an audit log is mathematically impossible.
2. **Conditional Where Guard:** The update specifies `approvalStatus: { not: 'Approved' }`. If two concurrent requests arrive simultaneously, the first commits and the second fails with a Prisma concurrency error (`P2025: Record to update not found`).
3. **Operational State Preservation:** The operational status (`POSTED - PAYMENT PENDING`) is preserved intact during the approval phase; payment release is isolated to a downstream execution step.

---

## 5. Verification Test Summary

All approval and maker-checker invariants were tested using an isolated temporary database fixture in `scripts/test-day11-payroll.ts`:
- Unauthenticated access blocked (HTTP 401): **PASSED**
- Unauthorized roles blocked (HTTP 403): **PASSED**
- Preparer self-approval blocked (HTTP 403): **PASSED**
- Unreconciled run approval blocked (HTTP 422): **PASSED**
- Paid run approval blocked (HTTP 409): **PASSED**
- Independent Admin approval authorized (HTTP 200): **PASSED**
- Duplicate approval blocked (HTTP 409): **PASSED**
- Atomic `PAYROLL_APPROVED` audit log created: **PASSED**
- Fixture safely deleted without data residue: **PASSED**

