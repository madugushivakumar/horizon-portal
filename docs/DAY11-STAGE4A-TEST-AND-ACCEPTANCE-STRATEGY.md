# DAY 11 — STAGE 4A: TEST AND ACCEPTANCE STRATEGY
## Aura Workforce by Growmar — Horizon Portal
### Phase 3 — Teams and Insight | Day 11: Admin Payroll Run Console
### Stage 4A: Read-Only Technical Assessment & Implementation Design

---

## Document Metadata

| Attribute | Specification |
|---|---|
| **Document ID** | `DAY11-STAGE4A-TEST-AND-ACCEPTANCE-STRATEGY` |
| **Document Title** | Comprehensive Verification, Quality Assurance & Security Test Strategy |
| **Governing Baseline** | Stage 3 Approved-for-Review Governance Package (`DAY11-STAGE3-*`) |
| **Stage & Mode** | Stage 4A — Read-Only Quality Strategy (Unimplemented) |
| **Governance Gate 1** | **LOCKED — FINANCIAL EXECUTION NOT AUTHORIZED** |
| **Date of Execution** | November 7, 2026 |

---

## 1. Executive Summary & Quality Assurance Framework

Stage 4A Workstream 7 designs the comprehensive testing and acceptance framework required to validate the post-Gate 1 implementation of Policies A through E.

The strategy encompasses six testing dimensions:
1. **Unit Testing:** Deterministic mathematical precision, BigInt bounds, 9D invariants, and classification logic.
2. **API Contract Testing:** Server-side route authorization, maker-checker rejection, concurrency handling, and error codes.
3. **Database Integrity Testing:** Foreign key cascading rules, uniqueness constraints, idempotency enforcement, and transaction rollbacks.
4. **Integration Testing:** End-to-end data flows from raw payslips to General Ledger vouchers, banking UTRs, and statutory receipts.
5. **Security & Vulnerability Testing:** IDOR protection, privilege escalation, role bypass attempts, and audit log tamper-resistance.
6. **Regression Testing:** Continuous verification of existing Horizon Portal functionality across Phase 1, 2, and 3.

> [!IMPORTANT]
> **AUDIT INTEGRITY NOTICE:**  
> Tests defined in this strategy are designed for post-Gate 1 implementation phases. No test claims may be asserted as passed unless the test script is executed in an authorized environment and its standard output is verified.

---

## 2. Unit Test Suite Specifications

| Test Suite ID | Test Focus | Description & Invariant Checked | Target Code Module | Expected Outcome |
|---|---|---|---|---|
| **UT-01** | Integer Paise Arithmetic | Verifies `parseToPaise()` converts floating numbers and string currency to BigInt without precision loss. | `reconciliation-engine.ts` | Pass on exact paise; half-up on sub-paise decimals. |
| **UT-02** | SQLite Int64 Boundary Checks | Asserts that `assertSqliteInt64()` throws `RangeError` if a value exceeds $[-2^{63}, 2^{63}-1]$. | `reconciliation-engine.ts` | Throws `RangeError` on boundary overflow/underflow. |
| **UT-03** | Line-Item Invariant (Dim A) | Verifies that $\text{Gross} - \text{Deductions} \equiv \text{Net}$ holds true with $0\text{ paise}$ tolerance. | `reconciliation-engine.ts` | Identifies any payslip line variance $> 0\text{ paise}$. |
| **UT-04** | Component Aggregation (Dim B) | Verifies $\sum \text{Earnings} = \text{Gross}$ and $\sum \text{Deductions} = \text{Total Deductions}$. | `reconciliation-engine.ts` | Identifies component omissions with $0\text{ paise}$ tolerance. |
| **UT-05** | Signed Variance Formula (Dim D) | Asserts $\text{Variance} = \text{Itemized} - \text{Header}$ produces negative deltas when header exceeds items. | `reconciliation-engine.ts` | April 2026 gross variance equals exact `-₹32,17,879.83`. |
| **UT-06** | Nine Variance Classifications | Validates that classification engine correctly maps conditions to `MATCH`, `MISMATCH`, `NO_ITEMS`, etc. | `reconciliation-engine.ts` | Correct enum classification assigned to all 18 runs. |
| **UT-07** | Idempotency Key Validation | Asserts `validateIdempotencyKey()` validates 8–128 char alphanumeric/symbol strings; rejects malformed keys. | `payroll-security.ts` | Returns `{ valid: true }` for valid keys; error on malformed. |
| **UT-08** | Revision Sequencing Logic | Verifies `validateAdjustmentRevision()` asserts revision sequence increments strictly by +1. | `payroll-security.ts` | Rejects duplicate revision or out-of-order sequences. |

---

## 3. API Contract & Workflow Test Suite Specifications

| Test Suite ID | Target API Endpoint | HTTP Method | Scenario Tested | Required Role / Input | Expected HTTP Response |
|---|---|---|---|---|---|
| **API-01** | `/api/v1/payroll/runs` | `GET` | Unauthenticated access attempt. | No cookie / invalid JWT | `401 Unauthorized` |
| **API-02** | `/api/v1/payroll/runs` | `GET` | Unauthorized role access attempt. | `EMPLOYEE` / `MANAGER` cookie | `403 Forbidden` |
| **API-03** | `/api/v1/payroll/runs/[id]/preview`| `GET` | Read-only reconciliation preview. | `HR` / `ADMIN` cookie | `200 OK` (Serialized BigInt strings) |
| **API-04** | `/api/v1/payroll/runs/[id]/approve`| `POST` | Self-approval violation. | `user.id === run.preparerId` | `403 Forbidden` (Separation of duties error) |
| **API-05** | `/api/v1/payroll/runs/[id]/approve`| `POST` | Approval of run with `MISMATCH`. | Run `PR-2026-09` | `422 Unprocessable Entity` |
| **API-06** | `/api/v1/payroll/runs/[id]/approve`| `POST` | Approval of run with `status: 'PAID'`. | Run `PR-2026-08` | `409 Conflict` (Already paid/finalized) |
| **API-07** | `/api/v1/payroll/runs/[id]/approve`| `POST` | Concurrent double-approval race. | Two simultaneous requests | First returns `200 OK`; second returns `409 Conflict`. |
| **API-08** | `/api/v1/payroll/adjustments` | `POST` | Creation of draft adjustment. | Valid maker payload | `201 Created` (Returns cuid and revision 1) |
| **API-09** | `/api/v1/payroll/adjustments/[id]/approve`| `POST` | Self-approval of adjustment. | `reconciledById === user.id` | `403 Forbidden` (Reconciler cannot approve) |
| **API-10** | `/api/v1/payroll/runs/[id]/disposition`| `POST` | Historical disposition sign-off. | Valid payload; authority is `AUTHORITY NOT YET APPROVED — GOVERNANCE DECISION REQUIRED`. | `200 OK`. Candidate status is `PROPOSED — PENDING FORMAL GOVERNANCE APPROVAL`. Does NOT establish financial approval, settlement, or GL posting. |

---

## 4. Database Integrity & Transactional Test Suite Specifications

| Test Suite ID | Database Target | Transactional Context | Test Description & Invariant | Expected Database Behavior |
|---|---|---|---|---|
| **DB-01** | `payroll_adjustments` | Prisma Transaction | Duplicate `idempotency_key` insertion. | Unique constraint violation; transaction rollbacks atomically. |
| **DB-02** | `payroll_adjustments` | Prisma Transaction | Duplicate `[payroll_run_id, revision]` insertion. | Compound unique index rejection; prevents concurrent revision overwriting. |
| **DB-03** | `payroll_runs` $\leftrightarrow$ `payslips` | SQLite Foreign Keys | Attempt to delete a `payroll_runs` row with existing payslips. | Enforces `onDelete: SetNull` or `Restrict`; prevents orphaned items. |
| **DB-04** | `audit_logs` | Standalone Table | Execution of SQL `UPDATE audit_logs SET ...` | Rejection via trigger or application-layer immutability assertion. |
| **DB-05** | Atomic Rollback | `prisma.$transaction` | Simulated error during audit logging after run status update. | Entire transaction aborts; run status reverts to original value in SQLite. |
| **DB-06** | Zero-Mutation Assertion | `prisma/dev.db` | Checksum comparison before and after read-only test suite runs. | Exact SHA-256 hash match on `prisma/dev.db`. |

---

## 5. Security & Threat Modeling Test Suite Specifications

| Threat ID | Security Threat Vector | Attack Scenario | Prevention Mechanism in Target Architecture | Verification Test Method |
|---|---|---|---|---|
| **SEC-01** | IDOR (Insecure Direct Object Reference) | Malicious user attempts to approve Run B while authorized only for Run A. | Scoped tenant and entity query in route handler; role validation against session. | Automated API test requesting unauthorized run IDs with low-privilege tokens. |
| **SEC-02** | Privilege Escalation via Cookie | Attacker modifies JWT payload role from `EMPLOYEE` to `ADMIN`. | HMAC SHA-256 signature verification in `getAuthenticatedUserFromToken()`. | Test with forged JWT signature; asserts immediate `401 Unauthorized`. |
| **SEC-03** | Maker-Checker Bypass via Null Preparer | `CRITICAL CONTROL GAP — HISTORICAL MAKER-CHECKER BYPASS POSSIBLE WHEN preparerId IS NULL`. In `dev.db`, all 18 historical runs have `preparer_id = NULL`. Conditional check `if (run.preparerId)` is bypassed. Existing role checks do not establish maker-checker separation. | Implement fail-closed validation strategy: require non-null `preparerId` on operational runs; reject approval when preparer missing; mandate distinct preparer/approver; deploy SQLite trigger. | Automated test asserting rejection when `preparerId` is null, missing, or identical to caller. |
| **SEC-04** | Audit Trail Tampering | Attacker with DB access attempts to truncate or edit audit records. | Merkle hash chaining (`record_hash = SHA256(parent_hash + payload)`). | Test modifying `old_value` column in SQLite; asserts hash chain validation failure. |
| **SEC-05** | Direct API Parameter Injection | Attacker sends arbitrary negative monetary values or float decimals to API. | Zod schema validation + `parseToPaise()` bounds checking. | Fuzz testing with NaN, Infinity, negative floats, and SQL injection strings. |

---

## 6. Regression Testing Baseline

To guarantee that post-Gate 1 implementations do not degrade existing platform features, continuous automated regression testing will assert:
1. **Historical Data Preservation:** Exactly 18 payroll runs, 2,469 payslips, and 441 employees remain present with exact baseline hashes.
2. **Phase 1 & 2 Core Systems:** Attendance, leave approval workflows, employee profile management, and dashboard capacity charts remain 100% operational.
3. **Task Board & Admin Consoles:** Task filtering, assignment, and status transitions function without regression.

### 6.1 Regression Suite: RECONCILIATION CONSISTENCY DEFECT — OPPOSITE VARIANCE SIGN CONVENTIONS
Post-Gate 1 unification onto the proposed BigInt calculation authority must pass regression tests covering all seven scenarios:
1. **Header Greater Than Itemized Total:** Verifies consistent negative variance in engine and aligned display.
2. **Header Less Than Itemized Total:** Verifies positive variance.
3. **Equal Header and Itemized Total:** Verifies 0 paise delta and `MATCH` status.
4. **Positive and Negative Variance:** Verifies exact signed string formatting (`+₹...` / `-₹...`).
5. **Zero Variance Invariant:** Verifies no false-positive discrepancy alerts.
6. **Paise Precision Standard:** Asserts zero decimal floating drift.
7. **API and UI Consistency:** Asserts identical variance signs across all endpoints and UI views.

### 6.2 External Evidence & Monetary Threshold Test Constraints
- **External Evidence Availability:**  
  `EXTERNAL EVIDENCE NOT AVAILABLE IN THE INSPECTED PROJECT REPOSITORY — INDEPENDENT EXTERNAL VALIDATION PENDING.`  
  No test may assert that GL journals, bank statements, or statutory receipts are verified until independently ingested and validated. Stored `PAID` flag does NOT establish bank settlement.
- **Monetary Threshold Basis:**  
  `DEC-C-02 — MONETARY THRESHOLD BASIS UNDECIDED — FORMAL CONTROLLER/CFO DECISION REQUIRED.` The ₹5,00,000 value remains illustrative unless formally approved.

---

## 7. Measurable Acceptance Criteria & Gate 1 Guard

Stage 4B/5 implementation shall be deemed acceptable only when:
- **Test Pass Rate:** 100% of Unit, API, Database, Security, and Regression tests pass without errors.
- **Precision Invariant:** Zero decimal floating-point drift across all financial calculations down to the exact integer paise.
- **Audit Completeness:** 100% of state-mutating transactions generate corresponding immutable entries in `audit_logs`.
- **Database Safety:** Zero unintended database mutations; zero data pack file modifications.
- **Gate 1 Status:** `GATE 1 LOCKED — FINANCIAL EXECUTION NOT AUTHORIZED.`

---

*End of Day 11 Stage 4A Test and Acceptance Strategy.*

