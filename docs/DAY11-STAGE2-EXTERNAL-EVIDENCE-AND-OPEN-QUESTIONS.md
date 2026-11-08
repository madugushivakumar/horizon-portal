# DAY 11 — STAGE 2: EXTERNAL EVIDENCE AND OPEN QUESTIONS
## Forensic Inventory of Missing External Documents, Upstream Data Gaps & Unresolved Questions

| Document Field | Formal Audit Value |
|---|---|
| **Project** | Aura Workforce by Growmar — Horizon Portal |
| **Phase / Task** | Phase 3 — Day 11: Admin Payroll Run Console |
| **Stage** | Stage 2 of 6 — Root-Cause Forensic Investigation |
| **Document Identifier** | `docs/DAY11-STAGE2-EXTERNAL-EVIDENCE-AND-OPEN-QUESTIONS.md` |
| **Date** | November 7, 2026 |
| **Status** | Open Evidence Audit & Stakeholder Requirements |

---

## 1. External Evidence Register

In strict accordance with Phase H of the Master Execution Directive, the following register documents all external records necessary to close investigation gaps and transition from an academic simulation to audited financial authority:

| Evidence Item | Audit Purpose | Available in Repository? | Required Source / System Owner | Current Status | Forensic Impact |
|---|---|---|---|---|---|
| **1. Upstream Data Generator Script / Model** | Establish the exact algorithm, headcount targets, and rules used to generate `03_Data_Pack/payroll_runs.json` and `payslips.json`. | **NO** | Curriculum Data Pack Architect / Upstream Vendor | `NOT SUPPLIED` | Prevents proving the exact reason why header headcounts exceeded available workforce. |
| **2. Original Enterprise Payroll Export** | Validate whether `payroll_runs.json` was an export from an external ERP (SAP, Workday, ADP) or synthetic mock data. | **NO** | Corporate Payroll System Owner | `NOT SUPPLIED` | Precludes establishing external commercial authority. |
| **3. Employee Lifecycle & Status History** | Document historical termination dates, resignations, unpaid leaves of absence, and sabbatical records. | **NO** | HR Master Data System (HRIS) | `NOT SUPPLIED` | Restricts workforce analysis to recorded hire dates; cannot prove active employment status. |
| **4. General Ledger Accounting Journals** | Verify whether payroll debits (Salaries Expense, PF Payable, TDS Withholding) were recognized in corporate general ledger. | **NO** | Corporate Finance / General Ledger ERP | `NOT SUPPLIED` | Precludes treating itemized payslip aggregates as general ledger balances. |
| **5. Bank Disbursement & Settlement Statements** | Verify that net salary amounts were actually debited from corporate bank accounts and credited to worker accounts. | **NO** | Corporate Treasury / Commercial Bank Portal | `NOT SUPPLIED` | Stored `'PAID'` strings remain unverified application text flags. |
| **6. Statutory Remittance Challans (EPFO / ESIC / TDS)** | Verify that employee and employer statutory deductions were remitted to government authorities (EPFO ECR, Form 24Q). | **NO** | Tax & Statutory Compliance Officer | `NOT SUPPLIED` | Line-item statutory withholdings remain uncorroborated externally. |
| **7. Signed Compensation Revision Letters** | Confirm contractual compensation agreements and bonus authorization. | **NO** | Personnel Records / Compensation Committee | `NOT SUPPLIED` | Gross salary amounts represent dataset entries without contractual backing. |
| **8. Formal Policy A–E Stakeholder Sign-Off** | Authorize source-of-truth hierarchy, adjustment taxonomy, and Gate 1 financial execution. | **NO** | Executive Committee (CFO, VP HR, Controller) | `PENDING DISPATCH (0/5)` | Gate 1 remains locked; no financial adjustments may be executed. |

---

## 2. Unresolved Forensic Questions

The investigation has established what exists in the repository with 100% precision. However, several root-cause questions cannot be resolved from the codebase alone:

### Question 1: Why did April and May 2026 headers both record 413 employees?
- *Observed Fact:* Both `PR-2026-04` and `PR-2026-05` headers state `employees_paid = 413`. Active hires in the dataset were 388 in April and 394 in May.
- *Open Question:* Did the upstream process use a fixed quarterly budget target (e.g. Q1 FY 2026-27 headcount ceiling of 413) that was stamped onto monthly batch headers prior to actual hiring?
- *Required Evidence:* Corporate staffing plan or quarterly headcount budget for FY 2026-27.

### Question 2: Why did September 2026 header record 444 employees when the entire dataset has only 441?
- *Observed Fact:* The entire corporate employee roster (`employees.json`) has 441 records. September 2026 header states `employees_paid = 444`.
- *Open Question:* Were 3 additional requisitions budgeted but unfulfilled at the time of batch creation, or was this a clerical calculation defect in upstream data preparation?
- *Required Evidence:* Upstream generator parameters or recruitment requisition logs.

### Question 3: Why do the prior 12 runs (April 2025 – March 2026) have zero itemized payslips?
- *Observed Fact:* `payslips.json` begins on 2026-04-01 (`PR-2026-04`). Runs `PR-2025-04` through `PR-2026-03` exist only as summary headers in `payroll_runs.json`.
- *Open Question:* Was FY 2025-26 intentionally supplied as a legacy summary dataset without line-item archiving, or were prior payslip files omitted from the curriculum pack?
- *Required Evidence:* Data pack release manifest.

---

## 3. Evidence Governance Status

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                    EXTERNAL EVIDENCE STATUS SUMMARY                          ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  • Dataset Benchmark Authority:        CONFIRMED (03_Data_Pack/)             ║
║  • Mathematical Balancing:             CONFIRMED (2,469 payslips, 0 error)   ║
║  • Upstream Generator Algorithm:       NOT SUPPLIED                          ║
║  • General Ledger Records:             NOT AVAILABLE                         ║
║  • Bank Settlement Proof:              NOT AVAILABLE                         ║
║  • Statutory Filing Receipts:          NOT AVAILABLE                         ║
║  • Formal Human Sign-Offs:             PENDING REVIEW (Gate 1 LOCKED)        ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

