# DAY 11 — STAGE 4A: RECONCILIATION ARCHITECTURE ASSESSMENT
## Aura Workforce by Growmar — Horizon Portal
### Phase 3 — Teams and Insight | Day 11: Admin Payroll Run Console
### Stage 4A: Read-Only Technical Assessment & Implementation Design

---

## Document Metadata

| Attribute | Specification |
|---|---|
| **Document ID** | `DAY11-STAGE4A-RECONCILIATION-ARCHITECTURE-ASSESSMENT` |
| **Document Title** | Technical Assessment of Reconciliation Engines, Nine-Dimensional Coverage & Precision Standards |
| **Governing Baseline** | Policy B (Amended) (`docs/DAY11-STAGE3-POLICY-B-RECONCILIATION-AND-VARIANCE-GOVERNANCE.md`) |
| **Stage & Mode** | Stage 4A — Read-Only Technical Assessment |
| **Governance Gate 1** | **LOCKED — FINANCIAL EXECUTION NOT AUTHORIZED** |
| **Date of Execution** | November 7, 2026 |

---

## 1. Executive Summary & Assessment Scope

Stage 4A Workstream 3 conducts an in-depth architectural and mathematical evaluation of the reconciliation capabilities implemented within the Horizon Portal platform.

The investigation examined:
1. The mathematical precision and data types utilized in calculations (`BigInt` paise vs. `number` floats).
2. The architectural differences between the two existing calculation services: `reconciliation-service.ts` vs. `reconciliation-engine.ts`.
3. The degree of implementation across the nine reconciliation dimensions (Dimensions A through I) defined in Policy B.
4. The boundary separating internally verifiable arithmetic from external accounting and treasury settlement.

### Core Architectural Principle:
$$\mathbf{Internal\ Mathematical\ Correctness\ \ne\ External\ Accounting\ or\ Settlement\ Correctness}$$
Passing an automated arithmetic check (e.g., zero residual on payslips) confirms that internal database vouchers are mathematically balanced, but does **not** prove legal entitlement, General Ledger liability recognition, or commercial bank disbursement.

---

## 2. Evaluation of Nine Reconciliation Dimensions (Policy B)

The table below evaluates the actual technical status of each of the nine reconciliation dimensions defined in Stage 3 Policy B:

| Dimension Code & Title | Mathematical / Evidentiary Invariant | Technical Implementation Location | Currently Calculated? | Currently Displayed in UI? | Persisted in Database? | Requires External Evidence? | Mathematical Verifiability Status | Assessment Classification & Implementation Status |
|---|---|---|---|---|---|---|---|---|
| **Dimension A:** Line-Item Arithmetic Equality | $\text{Gross}_i - \text{Deductions}_i \equiv \text{Net}_i$ ($0\text{ paise}$) | `reconciliation-engine.ts#L425-L435`<br>`reconciliation-service.ts#L184-L188` | **YES** (Every payslip evaluated) | **YES** (Badged in Run Details) | **NO** (Computed dynamically) | No | 100% Mathematically Verifiable from DB | `IMPLEMENTED_AND_VERIFIED` |
| **Dimension B:** Component Aggregation Equality | $\sum \text{Earnings} = \text{Gross}$<br>$\sum \text{Deductions} = \text{Total}$ | Verified in forensic audits; partially in `PayslipDocument.tsx` | **PARTIALLY** (Evaluated per slip, but not batch aggregated) | **YES** (In payslip modal breakdown) | **NO** (Component fields stored in `payslips`) | No | 100% Mathematically Verifiable from DB | `PARTIALLY_IMPLEMENTED` |
| **Dimension C:** Itemized Payroll Aggregation | $\sum_{i=1}^N \text{Net}_i = \text{Total Net}$ ($0\text{ paise}$) | `reconciliation-engine.ts#L391-L443`<br>`reconciliation-service.ts#L173-L182` | **YES** (Summed across all run payslips) | **YES** (Console & Run Details cards) | **NO** (Computed dynamically) | No | 100% Mathematically Verifiable from DB | `IMPLEMENTED_AND_VERIFIED` |
| **Dimension D:** Header-to-Itemized Reconciliation | $\Delta = \text{Itemized} - \text{Stored Header}$ | `reconciliation-engine.ts#L460-L476`<br>`reconciliation-service.ts#L189-L199` | **YES** (Exact deltas computed) | **YES** (Discrepancy cards & badges) | **NO** (Schema supports `payroll_adjustments`, 0 rows) | No | Mathematically Verifiable (Identifies Variances) | `IMPLEMENTED_AND_VERIFIED` (Requires Adjustment Ledger) |
| **Dimension E:** Rounding Differences | Defined half-up integer paise basis; no floating drift | `reconciliation-engine.ts#L259-L283` (`parseToPaise`) | **YES** (Sub-paise detected & flagged) | **YES** (Warnings logged in preview API) | **NO** (Parsed on read) | No | 100% Mathematically Verifiable | `IMPLEMENTED_AND_VERIFIED` |
| **Dimension F:** External Accounting Reconciliation | $\sum \text{Payslips} \equiv \text{GL-2100 Balances}$ | None (Zero GL integration code in repo) | **NO** | **NO** | **NO** | **YES** (ERP trial balance required) | Requires External Evidence | `NOT_IMPLEMENTED`. `EXTERNAL EVIDENCE NOT AVAILABLE IN THE INSPECTED PROJECT REPOSITORY — INDEPENDENT EXTERNAL VALIDATION PENDING.` |
| **Dimension G:** Bank Settlement Reconciliation | Batch Debit $\equiv \sum \text{Credits} + \text{Returns}$ | None (Zero banking integration code in repo) | **NO** | **NO** | **NO** | **YES** (Bank statement debits required) | Requires External Evidence | `NOT_IMPLEMENTED`. `EXTERNAL EVIDENCE NOT AVAILABLE IN THE INSPECTED PROJECT REPOSITORY — INDEPENDENT EXTERNAL VALIDATION PENDING.` Stored `PAID` flag does not establish bank settlement. |
| **Dimension H:** Statutory Remittance Reconciliation | Withholdings $\equiv$ Challan Payments | None (Zero tax/PF integration code in repo) | **NO** | **NO** | **NO** | **YES** (EPFO/ESIC/ITNS challans required) | Requires External Evidence | `NOT_IMPLEMENTED`. `EXTERNAL EVIDENCE NOT AVAILABLE IN THE INSPECTED PROJECT REPOSITORY — INDEPENDENT EXTERNAL VALIDATION PENDING.` |
| **Dimension I:** Population & Employee Reconciliation | $\Delta_{\text{HC}} = \text{Observed} - \text{Approved Roster}$ | `reconciliation-engine.ts#L461` (Compares count to header) | **PARTIALLY** (Compares payslips to header count; not to HR roster) | **YES** (Discrepancy badge in console) | **NO** | **YES** (Signed HR roster snapshot required) | Requires Formal Investigation | `PARTIALLY_IMPLEMENTED` |

---

## 3. Discrepancy Analysis: RECONCILIATION CONSISTENCY DEFECT — OPPOSITE VARIANCE SIGN CONVENTIONS

A critical architectural finding of Stage 4A is the existence of two divergent reconciliation implementations in `src/lib/payroll/`:

```
+---------------------------------------------------------------------------------------------------+
|                           COMPARISON OF PARALLEL RECONCILIATION SERVICES                          |
+---------------------------------------------------------------------------------------------------+
|  Attribute                  | reconciliation-service.ts          | reconciliation-engine.ts       |
+-----------------------------+------------------------------------+--------------------------------+
|  Primary Purpose            | Operational list & details API     | Step 2A engine & preview API   |
|  Numeric Data Type          | JavaScript `number` (float)        | Arbitrary-precision `BigInt`   |
|  Arithmetic Precision       | `toPaise()` (Math.round)           | `parseToPaise()` & integer math|
|  Sign Convention Formula    | Stored Header - Itemized Sum       | Itemized Sum - Stored Header   |
|  Variance Sign for Apr 2026 | +₹32,17,879.83 (Header > Items)    | -₹32,17,879.83 (Items < Header)|
|  Status Output Enums        | MATCHED, MISMATCH, NO_ITEMS        | MATCHED, MISMATCH, NO_ITEMS,   |
|                             |                                    | INVALID_DATA                   |
|  Database Mutation Scope    | Read-only                          | Read-only                      |
|  Prisma Transaction Scope   | Loose single queries               | Explicit point-in-time $tx     |
+---------------------------------------------------------------------------------------------------+
```

### 3.1 Defect Classification & Impact Analysis
- **Defect Classification:** `RECONCILIATION CONSISTENCY DEFECT — OPPOSITE VARIANCE SIGN CONVENTIONS`
- **Inverted Formulas:**
  - In `reconciliation-service.ts#L190-L192`:
    $$\text{grossDiffPaise} = \text{storedGrossPaise} - \text{sumGrossPaise}$$
    Yields a **positive** difference when the header exceeds itemized sums.
  - In `reconciliation-engine.ts#L462`:
    $$\text{grossVariancePaise} = \text{sumGrossPaise} - \text{storedGrossPaise}$$
    Yields a **negative** difference when the header exceeds itemized sums, complying with Policy B:
    $$\mathbf{Variance} = \mathbf{Itemized\ (Realized)\ —\ Stored\ Header\ (Baseline)}$$
- **Systemic Impact:**
  - *APIs:* Consumers calling `GET /api/v1/payroll/runs/[id]` receive positive differences, while `/reconciliation-preview` returns negative variances for the same run.
  - *UI Labels:* Inconsistent badges and tooltips (e.g., "Overstated" vs "Understated").
  - *Variance Interpretation:* Creates confusion regarding whether positive values represent surplus or deficit.
  - *Financial Reports:* Inconsistent summation across executive audit exports.
  - *Future Integrations:* Endangers double-entry journal balance mapping if inverted signs are posted to General Ledger debit/credit sides.

### 3.2 Preservation of Current Behavior & Proposed Future Authority
- **Current Behavior Strictly Preserved:** Stage 4A makes zero code changes. Neither service has been altered, historical variance values have not been rewritten, and existing UI labels remain untouched.
- **Proposed Future Calculation Authority:** The `BigInt` arbitrary-precision engine (`reconciliation-engine.ts`) is documented as the **proposed future calculation authority**, subject to formal governance approval.
- **Proposed Consolidation:** Once Gate 1 is unlocked and Policy B is formally approved, all consumers (APIs, UI components, export scripts) will be consolidated onto `reconciliation-engine.ts`. Consolidation has **NOT** yet occurred.

### 3.3 Required Regression Test Coverage
Post-Gate 1 implementation must enforce an exhaustive regression test suite covering:
1. **Header Greater Than Itemized Total:** Verifies consistent negative variance in engine and aligned display.
2. **Header Less Than Itemized Total:** Verifies positive variance.
3. **Equal Header and Itemized Total:** Verifies 0 paise delta and `MATCH` status.
4. **Positive and Negative Variance:** Verifies exact signed string formatting (`+₹...` / `-₹...`).
5. **Zero Variance Invariant:** Verifies no false-positive discrepancy alerts.
6. **Paise Precision Standard:** Asserts zero decimal floating drift.
7. **API and UI Consistency:** Asserts identical variance signs across all endpoints and UI views.

---

## 4. Float Display Mirrors vs. BigInt Calculation Authorities

The audit verified how floating-point numbers and BigInts interact across the application:
1. **Calculation Authority:**
   In `reconciliation-engine.ts`, all intermediate accumulations, invariant checks, and variance subtractions execute strictly on `BigInt` values (`sumGrossPaise += gParsed.paise;`). No floating-point operations occur during reconciliation evaluation.
2. **Display Mirrors:**
   The `rupees` numbers (`number` type) and formatted INR strings (`"₹54,43,033.15"`) returned in API responses are derived strictly by dividing the BigInt by 100 at the boundary formatting layer:
   ```typescript
   export function formatPaiseToRupeeString(paise: bigint): string {
     const whole = absPaise / BigInt(100);
     const cents = absPaise % BigInt(100);
     return `${sign}${whole.toString()}.${cents.toString().padStart(2, "0")}`;
   }
   ```
   **Finding:** The actual implementation supports the governance principle that float fields are read-only display mirrors, with BigInt paise representing the calculation authority.

---

## 5. Workstream 3 Conclusion & Recommendations

1. **Internal Dimensions (A, C, D, E) are Sound:** The internal BigInt paise reconciliation engine is mathematically robust, zero-residual verified, and bounds-checked against SQLite signed 64-bit limits.
2. **Defect Classified:** `RECONCILIATION CONSISTENCY DEFECT — OPPOSITE VARIANCE SIGN CONVENTIONS` formally documented between `reconciliation-engine.ts` and `reconciliation-service.ts`.
3. **External Evidence Availability:**  
   `EXTERNAL EVIDENCE NOT AVAILABLE IN THE INSPECTED PROJECT REPOSITORY — INDEPENDENT EXTERNAL VALIDATION PENDING.`  
   Repository inspection confirms zero GL journals, bank statements, or statutory receipts exist in the repository; however, this does not determine their existence in external enterprise banking or tax systems. A stored `PAID` flag does not establish bank settlement.
4. **Historical Disposition is Not Financial Approval:** Candidate statuses remain `PROPOSED — PENDING FORMAL GOVERNANCE APPROVAL`. Historical dispositions cannot convert mismatches into matches or certify cash disbursement. Approving authority is `AUTHORITY NOT YET APPROVED — GOVERNANCE DECISION REQUIRED`.
5. **Consolidation Proposed (Post-Gate 1):** The BigInt arbitrary-precision engine (`reconciliation-engine.ts`) is proposed as the unified calculation authority once Gate 1 is unlocked.
6. **Gate 1 Status:** `GATE 1 LOCKED — FINANCIAL EXECUTION NOT AUTHORIZED.`

---

*End of Day 11 Stage 4A Reconciliation Architecture Assessment.*

