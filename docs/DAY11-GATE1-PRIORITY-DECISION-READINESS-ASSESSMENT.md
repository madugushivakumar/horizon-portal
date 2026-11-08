# DAY 11 — GATE 1: PRIORITY DECISION READINESS ASSESSMENT
## Aura Workforce by Growmar — Horizon Portal
### Phase 3 — Teams and Insight | Day 11: Admin Payroll Run Console
### Gate 1 Governance Approval and Readiness Phase

---

## Document Metadata

| Attribute | Specification |
|---|---|
| **Document ID** | `DAY11-GATE1-PRIORITY-DECISION-READINESS-ASSESSMENT` |
| **Document Title** | Detailed Decision-Readiness Evaluation for Core Payroll Governance Determinations |
| **Project & Phase** | Aura Workforce by Growmar — Horizon Portal / Phase 3 — Day 11 |
| **Governing Baseline** | Master Decision Register (`docs/DAY11-GATE1-MASTER-DECISION-REGISTER.md`) |
| **Execution Mode** | Objective Analytical Review (Strictly Read-Only) |
| **Decisions Evaluated** | **7 Priority Determinations + Statutory Compliance Framework** |
| **Approved Decisions** | **0 Decisions (All Priority Items Pending Stakeholder Voting)** |
| **Gate 1 Status** | **`GATE 1: LOCKED — FINANCIAL EXECUTION NOT AUTHORIZED`** |
| **Stage 4B Status** | **`STAGE 4B: NOT AUTHORIZED`** |
| **Date of Execution** | November 7, 2026 |

---

## 1. Executive Notice & Assessment Scope

This document provides exhaustive, evidence-backed decision papers for the seven priority determinations and statutory evidence mandates requiring human stakeholder resolution before Governance Gate 1 can be unlocked.

In accordance with enterprise audit standards:
- Technical options and trade-offs are presented neutrally.
- No decision is pre-empted, selected, or claimed as approved.
- All candidate threshold values (specifically ₹5,00,000) are treated as **strictly illustrative examples**.
- Absolute statements regarding external records are qualified with the mandatory standard formulation.

---

## 2. DEC-A-02: Employee Eligibility Authority & Headcount Invariant

### 2.1 Technical & Forensic Context
In Stage 1 and Stage 2 forensic audits, a critical source-of-truth divergence was discovered regarding employee population counts:
- In `payroll_runs`, the stored batch header for April 2026 reports an employee count of **434**.
- In `payslips`, the number of distinct employee vouchers for April 2026 is **434**.
- In `employees.json`, the master employee roster contains **441** records.

### 2.2 Inviolable Governance Invariant
$$\mathbf{Employees\ CANNOT\ be\ defined\ as\ eligible\ merely\ because\ they\ appear\ in\ payslips.}$$
Treating observed payslips as the de facto eligible workforce creates a self-fulfilling circular reference that would render ghost employees, unrecorded terminations, or erroneous voucher generation undetectable.

### 2.3 Required Six-Population Taxonomy
The VP of Human Resources must formally adopt and delineate six population concepts:
1. **Master Roster Population ($P_{\text{master}}$):** Total employee identities existing in the enterprise HRMS database.
2. **Effective Active Population ($P_{\text{active}}$):** Employees whose employment contract is active and un-terminated as of the cycle period end date.
3. **Eligible Payroll Population ($P_{\text{eligible}}$):** Active employees who satisfy specific compensation criteria (e.g., passed probation, not on unpaid sabbatical).
4. **Observed Voucher Population ($P_{\text{observed}}$):** Employees for whom an individual payslip was generated in the data pack.
5. **Stored Header Population ($P_{\text{header}}$):** The scalar integer stored in `payroll_runs.total_employees`.
6. **Paid Settlement Population ($P_{\text{paid}}$):** Employees for whom a verified bank clearing credit (UTR) exists.

### 2.4 Missing HR Source Data
The current repository data pack (`03_Data_Pack/employees.json`) provides basic hire dates and department allocations, but **completely lacks**:
- Historical termination dates for departed staff.
- Leave-of-absence (LOP) records.
- Effective status transition histories (e.g., active $\rightarrow$ suspended $\rightarrow$ resigned).

### 2.5 Consequences of Missing Termination Records
Without effective-dated termination history, automated reconciliation cannot definitively establish whether the 7-employee delta in April 2026 ($441 - 434$) represents:
- Seven employees hired after the April cutoff.
- Seven employees terminated prior to April who correctly received no pay.
- Seven eligible employees who were erroneously omitted from the payroll run.

### 2.6 Decision Readiness & Required Stakeholder Action
- **Required Authority:** Vice President of Human Resources (`HR-VPHR`).
- **Required Evidence:** Authoritative HRMS employment-status export with effective start and end dates.
- **Decision Status:** `PROPOSED — APPROVAL PENDING` (Blocked on HR source evidence).

---

## 3. DEC-B-01: Dimension-Specific Reconciliation Tolerances

### 3.1 Review of the Nine Reconciliation Dimensions (Policy B)
Stage 4A evaluated nine discrete dimensions of reconciliation:

```
+---------------------------------------------------------------------------------------------------+
|                                 NINE-DIMENSIONAL RECONCILIATION TAXONOMY                          |
+---------------------------------------------------------------------------------------------------+
|  Dimension A: Line-Item Math       Gross - Deductions == Net (per payslip)                        |
|  Dimension B: Component Sum        Sum(Earnings) == Gross; Sum(Deductions) == Total Deductions    |
|  Dimension C: Itemized Aggregate   Sum(Net_i) == Total Net; Sum(Gross_i) == Total Gross          |
|  Dimension D: Header vs. Items     Delta = Realized Payslips - Stored Run Header                  |
|  Dimension E: Integer Rounding     Strict half-up integer paise; zero floating-point drift        |
|  Dimension F: GL Accounting        Sum(Payslips) == GL-2100 Net Salaries Payable                 |
|  Dimension G: Bank Settlement      Batch Statement Debit == Sum(UTR Credits) + Returned Salaries  |
|  Dimension H: Statutory Remittance Tax Withheld == Challan Deposited (PF, ESI, TDS)               |
|  Dimension I: Population Roster    Observed Payslip Headcount == Approved HR Eligible Roster      |
+---------------------------------------------------------------------------------------------------+
```

### 3.2 Dimensions Requiring Exact Mathematical Equality ($0\text{ paise}$)
- **Dimensions A, B, C, and E:** Internal accounting logic requires **absolute zero tolerance ($0\text{ paise}$)**. A payslip where gross minus deductions differs from net by even $1\text{ paisa}$ is an illegal voucher.
- **Audit Finding:** All 2,469 payslips in `prisma/dev.db` satisfy Dimension A with 0 paise residual.

### 3.3 Dimensions Requiring Signed Variance Disposition
- **Dimension D (Header-to-Itemized Reconciliation):** In historical runs, stored headers diverge from payslips. This dimension cannot enforce zero tolerance on legacy data; it requires **signed variance calculation and append-only adjustment disposition**.

### 3.4 Dimensions Requiring External Evidence
- **Dimensions F, G, and H:** Cannot be satisfied by database vouchers alone. They require third-party substantiation:
  $$\mathbf{EXTERNAL\ EVIDENCE\ NOT\ AVAILABLE\ IN\ THE\ INSPECTED\ PROJECT\ REPOSITORY\ —\ INDEPENDENT\ EXTERNAL\ VALIDATION\ PENDING.}$$

### 3.5 Reconciliation Defect: Opposing Sign Conventions
- **Defect Classification:** `RECONCILIATION CONSISTENCY DEFECT — OPPOSITE VARIANCE SIGN CONVENTIONS`
- **Finding:**
  - `reconciliation-engine.ts#L462` defines: $\text{Variance} = \text{Itemized Total} - \text{Stored Header}$ (Negative delta for April 2026: `-₹32,17,879.83`).
  - `reconciliation-service.ts#L190` defines: $\text{grossDiffPaise} = \text{Stored Header} - \text{Itemized Total}$ (Positive delta for April 2026: `+₹32,17,879.83`).
- **Proposed Unification:** Corporate Controller must formally adopt `reconciliation-engine.ts` as the sole calculation authority. Both services currently operate untouched in Stage 4A.

### 3.6 Decision Readiness & Required Stakeholder Action
- **Required Authority:** Corporate Controller (`FIN-CTRL`).
- **Outstanding Decision:** Formally adopt dimension-specific tolerances (0-paise internal; signed disposition for Dim D; external tie-out for F/G/H).
- **Decision Status:** `READY_FOR_STAKEHOLDER_REVIEW`.

---

## 4. DEC-C-01: Segregation of Duties & Maker-Checker Vulnerability

### 4.1 Empirical Vulnerability Finding
Stage 4A code inspection of the state-mutating approval route identified:
`src/app/api/v1/payroll/runs/[runId]/approve/route.ts#L90-L104`:
```typescript
if (run.preparerId) {
  const isPreparer = user.id === run.preparerId || (user.employeeId && user.employeeId === run.preparerId);
  if (isPreparer) {
    return NextResponse.json({ error: "Separation of duties violation..." }, { status: 403 });
  }
}
```

### 4.2 Standardized Finding Classification
$$\mathbf{CRITICAL\ CONTROL\ GAP\ —\ HISTORICAL\ MAKER-CHECKER\ BYPASS\ POSSIBLE\ WHEN\ preparerId\ IS\ NULL}$$

### 4.3 Detailed Audit Analysis:
1. **Conditional Bypass:** Because the validation is wrapped in `if (run.preparerId)`, the check evaluates to `false` and skips validation whenever `preparerId` is `null` or empty.
2. **Universal Historical Impact:** Database inspection of `prisma/dev.db` proves that **18 of 18 historical payroll runs have `preparer_id = NULL`**.
3. **Role Checks Do Not Establish Dual Control:** The route validates that the caller holds the `ADMIN` or `HR` role. However, holding an administrative role confirms user permissions, **NOT** maker-checker segregation. A single administrator could prepare and approve unassigned runs without dual control.
4. **Safety Determination:** The existing approval API must **NOT** be considered safe for historical approval based solely on role and reconciliation checks.
5. **Other Invariants Still Enforced:** The API correctly blocks runs with status `'PAID'` (HTTP 409) and runs with status `'MISMATCH'` (HTTP 422). Thus, not every validation is bypassed, but the maker-checker control is ineffective for historical records.

### 4.4 Proposed Fail-Closed Remediation Requirements (Design Only):
Post-Gate 1 implementation must enforce:
- Rejecting approval outright when the preparer identity is missing or unverified.
- Requiring independently verified preparation attribution before routing to approval.
- Enforcing strictly distinct preparer and approver identities ($\text{preparer\_id} \ne \text{approved\_by\_id}$).
- Deploying durable SQLite triggers or database CHECK constraints.
- Automated security testing on null, missing, invalid, and identical actor identities.
*(These represent proposed future remediation requirements, not implemented controls. Zero code changes were made in Stage 4A.)*

### 4.5 Decision Readiness & Required Stakeholder Action
- **Required Authority:** Head of Internal Audit (`AUD-HEAD`) and VP of Human Resources (`HR-VPHR`).
- **Outstanding Decision:** Ratify fail-closed maker-checker standard and approve Stage 4B remediation plan.
- **Decision Status:** `READY_FOR_STAKEHOLDER_REVIEW`.

---

## 5. DEC-C-02: Monetary Approval Threshold Basis (Neutral Comparison)

### 5.1 Mandatory Policy Baseline
$$\mathbf{DEC-C-02\ —\ MONETARY\ THRESHOLD\ BASIS\ UNDECIDED\ —\ FORMAL\ CONTROLLER/CFO\ DECISION\ REQUIRED.}$$
$$\mathbf{The\ ₹5,00,000\ value\ remains\ STRICTLY\ ILLUSTRATIVE\ unless\ formally\ approved.}$$

Engineering leads, technical auditors, and automated agents do **NOT** have the authority to select a monetary threshold basis or amount. Below is a neutral comparison of the five candidate bases to assist the Corporate Controller and CFO in their formal deliberation:

### 5.2 Comparative Evaluation of Candidate Measurement Bases

| Candidate Base | Operational Mechanism | Key Governance Advantages | Potential Operational Risks | Impact on Historical Runs |
|---|---|---|---|---|
| **Base 1: Gross Payroll Run Total** | Two-tier escalation triggered if total gross compensation of the run $\ge \text{Threshold}$. | Captures total corporate wage liability before statutory withholdings. Clear alignment with financial statement wage expense. | In an organization with 400+ employees, virtually 100% of monthly payroll cycles exceed ₹5,00,000, creating a permanent CFO bottleneck on routine cycles. | 100% of historical runs (₹1.83Cr to ₹2.22Cr) would require Tier-2 CFO sign-off. |
| **Base 2: Net Payroll Disbursement Total** | Two-tier escalation triggered if net cash disbursement to employee accounts $\ge \text{Threshold}$. | Directly monitors and controls actual corporate liquid cash outflow from commercial treasury accounts. | Ignores statutory deductions (PF, ESI, TDS). If net pay is below threshold but deductions are high, large liabilities could bypass Tier-2 review. | 100% of historical runs (₹1.59Cr to ₹1.94Cr) would require Tier-2 CFO sign-off. |
| **Base 3: Absolute Variance Amount ($|\Delta|$)** | Two-tier escalation triggered only if the absolute arithmetic discrepancy between header and items $\ge \text{Threshold}$. | Highly targeted risk control. Routine matching cycles proceed without executive bottleneck; only materially defective or disputed cycles escalate. | Does not provide executive oversight over very large routine payroll cycles that happen to be mathematically balanced. | April, May, June, July, August 2026 exceed ₹5L delta and escalate; September 2026 (₹1,500 delta) would not. |
| **Base 4: Net Adjustment Ledger Amount** | Two-tier escalation triggered if the net financial true-up in `payroll_adjustments` $\ge \text{Threshold}$. | Focuses executive governance strictly on post-hoc accounting adjustments and true-ups rather than original operational runs. | Leaves original operational runs ungoverned by threshold; requires adjustment ledger runtime to be deployed first. | Only applies when adjusting historical runs post-Gate 1. |
| **Base 5: Multi-Factor Composite Basis** | Two-tier escalation triggered if (Gross Total $\ge \text{Threshold}_1$) OR ($|\text{Variance}| \ge \text{Threshold}_2$). | Provides comprehensive coverage: monitors overall enterprise exposure while guaranteeing escalation for material anomalies. | Slightly higher complexity in API routing and UI threshold configuration. | All historical runs escalate under Factor 1; anomalous runs also escalate under Factor 2. |

### 5.3 Decision Readiness & Required Stakeholder Action
- **Required Authority:** Corporate Controller (`FIN-CTRL`) and Chief Financial Officer (`EXEC-CFO`).
- **Outstanding Action:** Controller and CFO must convene, formally select a measurement basis, and establish the authorized monetary threshold amount.
- **Decision Status:** `READY_FOR_STAKEHOLDER_REVIEW` (Neutral paper complete; executive vote pending).

---

## 6. DEC-D-04: Technical Approval of 36-Column Adjustment Schema

### 6.1 Schema Specification & Database State
The `payroll_adjustments` table was designed in Step 2A and exists in `prisma/schema.prisma#L60-L125` and SQLite `prisma/dev.db`.
- Total Columns: **36 Columns**.
- Current Row Count: **0 Rows** (Zero financial adjustments created).
- Unique Constraints: `[payrollRunId, revision]`, `idempotencyKey`.

### 6.2 Architectural Standards Evaluated:
1. **Calculation Authority:** Arbitrary-precision `BigInt` paise fields (`deltaGrossPaise`, `deltaNetPaise`, etc.) represent the authoritative calculation standard.
2. **Display Mirrors:** Floating-point fields (`deltaGross`, `deltaNet`) are strictly read-only display mirrors derived from integer paise.
3. **Append-Only Immutability:** No SQL `UPDATE` or `DELETE` operations permitted; revisions increment monotonically (+1).
4. **Deferred Child Item Table:** The current table stores run-level aggregate adjustments. The employee-level line-item adjustment table (`PayrollAdjustmentItem`) remains a deferred future enhancement.

### 6.3 Decision Readiness & Required Stakeholder Action
- **Required Authority:** Lead Systems Architect (`ARCH-LEAD`) and Corporate Controller (`FIN-CTRL`).
- **Outstanding Action:** Joint sign-off ratifying the 36-column schema for runtime service implementation post-Gate 1.
- **Decision Status:** `READY_FOR_STAKEHOLDER_REVIEW`.

---

## 7. DEC-E-04: Official Chart of Accounts Verification

### 7.1 Mandatory Evidentiary Finding
$$\mathbf{EXTERNAL\ EVIDENCE\ NOT\ AVAILABLE\ IN\ THE\ INSPECTED\ PROJECT\ REPOSITORY\ —\ INDEPENDENT\ EXTERNAL\ VALIDATION\ PENDING.}$$

### 7.2 Deficit Analysis & Risk
The proposed General Ledger account mappings utilized in Stage 3 documentation (`GL-6100` Payroll Expense, `GL-2100` Net Salaries Payable, `GL-2105` Tax Withholdings Payable) are **unverified technical illustrative examples**.
- Implementing software that posts to fictitious or unverified account codes creates material financial reporting errors in downstream ERP integrations.

### 7.3 Required Evidence & Stakeholder Action
- **Required Authority:** Corporate Controller (`FIN-CTRL`).
- **Required Evidence:** Controller-signed extract of the corporate Chart of Accounts from SAP/Oracle/NetSuite.
- **Decision Status:** `EVIDENCE_PENDING` (Blocked pending Controller provision of authorized corporate COA).

---

## 8. DEC-E-05: Treasury Settlement Matching Methodology

### 8.1 Mandatory Evidentiary Finding
$$\mathbf{EXTERNAL\ EVIDENCE\ NOT\ AVAILABLE\ IN\ THE\ INSPECTED\ PROJECT\ REPOSITORY\ —\ INDEPENDENT\ EXTERNAL\ VALIDATION\ PENDING.}$$
$$\mathbf{A\ stored\ 'PAID'\ flag\ does\ NOT\ establish\ bank\ settlement.}$$

### 8.2 Proposed Hybrid Settlement Model
Corporate payroll disbursements do not occur via individual credit card swipes; they are processed via consolidated host-to-host or NACH banking batches.
The proposed model enforces a two-tier tie-out:
$$\mathbf{Bank\ Statement\ Batch\ Debit\ \equiv\ \sum Beneficiary\ Credit\ UTRs\ +\ Returned\ Payouts}$$

### 8.3 Required Evidence & Stakeholder Action
- **Required Authority:** Corporate Treasurer (`TREAS-MGR`).
- **Required Evidence:** Corporate bank statements showing consolidated batch debits and payment clearing manifests with individual RBI UTR numbers.
- **Decision Status:** `EVIDENCE_PENDING` (Blocked pending Treasury model sign-off and statement provision).

---

## 9. Statutory Remittance Evidence & Head of Tax Validation

### 9.1 Regulatory Remittance Matrix (India)
Under Indian statutory mandates, payroll withholdings represent fiduciary liabilities:
- **Employees' Provident Fund (EPFO):** Requires Electronic Challan cum Return (ECR) receipt with valid TRRN.
- **Employees' State Insurance (ESIC):** Requires Monthly Contribution Challan with 17-digit CPIN.
- **Income Tax Withholding (TDS):** Requires Quarterly Form 24Q filing token and monthly ITNS 281 challans with BSR code and CIN.
- **Professional Tax (PT):** Requires State-specific PT remittance challans.

### 9.2 Mandatory Evidentiary Finding
$$\mathbf{EXTERNAL\ EVIDENCE\ NOT\ AVAILABLE\ IN\ THE\ INSPECTED\ PROJECT\ REPOSITORY\ —\ INDEPENDENT\ EXTERNAL\ VALIDATION\ PENDING.}$$
Zero statutory tax receipts exist within the project repository files.

### 9.3 Required Evidence & Stakeholder Action
- **Required Authority:** Head of Tax Operations (`TAX-HEAD`).
- **Required Evidence:** Verified government challan receipts downloaded directly from statutory portals.
- **Decision Status:** `EVIDENCE_PENDING` (Blocked pending provision of official statutory receipts).

---

## 10. Summary & Gate 1 Guard

- **Priority Decisions Summary:** Technical foundations, neutral comparison papers, and gap analyses are 100% complete. Formal stakeholder decisions and external source evidence remain **OUTSTANDING**.
- **Gate 1 Status:** `GATE 1 LOCKED — FINANCIAL EXECUTION NOT AUTHORIZED.`

---

*End of Day 11 Gate 1 Priority Decision Readiness Assessment.*

