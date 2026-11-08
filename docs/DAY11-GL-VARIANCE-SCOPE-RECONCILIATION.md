# DAY 11 — GL VARIANCE SCOPE RECONCILIATION
## Aura Workforce by Growmar — Horizon Portal
### Phase 3 — Teams and Insight | Day 11: Admin Payroll Run Console
### Forensic Investigation B | Analysis of ₹13.75 Lakh Reported Variance vs. ₹90.15 Lakh Historical Net Variance

---

## Document Metadata

| Attribute | Specification |
|---|---|
| **Document ID** | `DAY11-GL-VARIANCE-SCOPE-RECONCILIATION` |
| **Document Title** | Forensic Investigation & Accounting Scope Analysis of ₹13.75 Lakh vs. ₹90.15 Lakh Net Variance |
| **Project & Phase** | Aura Workforce by Growmar — Horizon Portal / Phase 3 — Day 11 |
| **Investigation Mode** | Read-Only Forensic Calculation & General Ledger Audit Scope Review |
| **Target Variance** | Reported "GL Net Variance" of ₹13.75 Lakh (`EXC-GL-01`) |
| **Benchmark Variance**| Verified 6-Run Header-vs-Payslip Net Variance: **₹90,14,717.87** (approx. ₹90.15 Lakh) |
| **Final Classification** | **`UNSUPPORTED FIGURE — SOURCE NOT LOCATED`** & **`UNRESOLVED — EXTERNAL GL EVIDENCE REQUIRED`** |
| **Gate 1 Status** | **`GATE 1: LOCKED — FINANCIAL EXECUTION NOT AUTHORIZED`** |
| **Stage 4B Status** | **`STAGE 4B: NOT AUTHORIZED`** |
| **Date of Execution** | November 8, 2026 |

---

## 1. Executive Summary

This investigation resolves the inconsistency between the "Historical General Ledger ₹13.75 Lakh net variance" cited in `EXC-GL-01` of the recent intake documentation and the verified historical net discrepancy of **₹90,14,717.87** (approx. ₹90.15 Lakh) across the six historical payroll runs (`PR-2026-04` through `PR-2026-09`).

Through a line-by-line origin audit and double-entry accounting reconciliation, this investigation establishes:
1. **Origin of the ₹13.75 Lakh Figure:** In `DAY11-EXTERNAL-EVIDENCE-VERIFICATION-RESULTS.md`, draft text stated:
   $$\sum \text{Gross Header} = ₹12,85,61,647.00 \quad \text{vs.} \quad \sum \text{Gross Itemized} = ₹12,71,86,134.00$$
   The arithmetic difference between these synthetic gross numbers is:
   $$₹12,85,61,647.00 - ₹12,71,86,134.00 = ₹13,75,513.00 \quad (\approx ₹13.75\text{ Lakh})$$
   This was subsequently mislabeled as a "net variance" and attributed to the "General Ledger" in `DAY11-GATE1-EXCEPTION-AND-DISCREPANCY-REGISTER.md` and `DAY11-STAKEHOLDER-RESPONSE-AND-EVIDENCE-INTAKE-REPORT.md`.
2. **Critical Accounting Distinction:** Stored payroll headers vs. itemized payslips is an **internal database/application discrepancy**, not a General Ledger variance. A General Ledger variance can only be established by comparing payroll totals against actual double-entry trial balances and journal vouchers (`EVID-GL-02` / `EVID-GL-03`).
3. **Absence of External GL Evidence:** No General Ledger exports, SAP/Oracle trial balances, or journal voucher records currently exist in the repository (all 14 external artifacts remain `NOT_PROVIDED`).
4. **Final Forensic Classification:**
   - For the ₹13.75 Lakh figure: **`UNSUPPORTED FIGURE — SOURCE NOT LOCATED`**.
   - For the actual General Ledger variance status: **`UNRESOLVED — EXTERNAL GL EVIDENCE REQUIRED`**.

---

## 2. Investigation Findings & Cross-Comparison

```
========================================================================================================================
                          PAYROLL HEADER-TO-PAYSLIP VARIANCE VS. GENERAL LEDGER VARIANCE
========================================================================================================================
```

| Dimension | Historical Payroll Discrepancy (Verified Baseline) | Reported "GL Variance" (Investigated Item) |
|---|---|---|
| **Numerical Amount** | **₹90,14,717.87** (Net) / **₹10,394,434.82** (Gross) | **₹13.75 Lakh** (₹13,75,513.00) |
| **Underlying Data Source** | `prisma/dev.db` tables: `payroll_runs` and `payslips` | Draft text in `DAY11-EXTERNAL-EVIDENCE-VERIFICATION-RESULTS.md` |
| **Runs Encompassed** | 6 Runs: `PR-2026-04` through `PR-2026-09` (April 2026 – September 2026) | Stated as "6 historical runs", but math does not match |
| **Mathematical Nature** | Header Net (₹27,60,84,281.24) minus Itemized Net (₹26,70,69,563.37) | Synthetic Gross Header (₹12.85 Cr) minus Synthetic Gross Slips (₹12.71 Cr) |
| **Accounting Entity** | Internal Horizon Portal database fields | Erroneously labeled as "General Ledger" |
| **GL Account Identifiers** | None (internal application tables) | Stated as `GL-6100` without any underlying journal records |
| **External Evidence Availability** | N/A (Internal database verified) | **Zero external GL evidence exists in repository** |
| **Independent Verification** | `PASS` (Re-verified in Stage 1, Stage 2, Stage 4A, and Gate 1 QC) | `FAIL` (Cannot be verified against any repository source) |

---

## 3. Detailed Forensic Breakdown

### 1. Mathematical Derivation of ₹13.75 Lakh
In `docs/DAY11-EXTERNAL-EVIDENCE-VERIFICATION-RESULTS.md#L37-38`, the text read:
- "1. Payroll Item Totals: $\sum \text{Gross} = ₹12,71,86,134.00$, $\sum \text{Net} = ₹10,36,08,359.00$"
- "2. Payroll Run Header Totals: $\sum \text{Gross} = ₹12,85,61,647.00$, $\sum \text{Net} = ₹10,47,28,495.00$"

Subtracting Itemized Gross from Header Gross:
$$₹12,85,61,647.00 - ₹12,71,86,134.00 = ₹1,375,513.00 \quad (₹13.75513\text{ Lakh})$$
Subtracting Itemized Net from Header Net:
$$₹10,47,28,495.00 - ₹10,36,08,359.00 = ₹1,120,136.00 \quad (₹11.20136\text{ Lakh})$$

When `EXC-GL-01` was drafted in `DAY11-GATE1-EXCEPTION-AND-DISCREPANCY-REGISTER.md`, the gross difference of ₹13.75 Lakh was mistakenly copied and mislabeled as a "₹13.75 Lakh net variance", and further misattributed to the General Ledger.

### 2. Relationship to the True Deductions Variance
Curiously, in the true 6-run verified baseline:
- Total Implied Header Deductions: ₹38,141,497.97
- Total Itemized Payslip Deductions: ₹36,761,781.02
- Deductions Variance: **-₹1,379,716.95** (₹13.797 Lakh, approx **₹13.80 Lakh**).
While it is possible that an earlier author loosely rounded the ₹13.80 Lakh deduction variance to ₹13.75 Lakh, there is no documented record or calculation substantiating this.

### 3. The General Ledger Misconception
A critical governance principle established in Stage 3 (Policy E) is:
> **The difference between stored payroll run headers and itemized payslips is NOT a General Ledger variance.**
> A General Ledger variance requires official corporate ERP double-entry journal vouchers showing what accounting actually debited to Wage Expenses (`GL-6100`) and credited to Payroll Clearing (`GL-2110`).

Because the Corporate Controller has not yet provided `EVID-GL-01`, `EVID-GL-02`, or `EVID-GL-03`, the repository team has **zero empirical knowledge** of what figures the enterprise ERP actually booked. ERP accounting could have booked:
- The stored run header totals;
- The itemized payslip totals;
- Bank payout debits; or
- An entirely separate estimated monthly accrual.

Therefore, asserting any specific rupee figure (whether ₹13.75 Lakh or ₹90.15 Lakh) as an established "General Ledger variance" is an unverified assertion.

---

## 4. Formal Classifications

In strict adherence to Section 4 of the Master Prompt:

1. **Classification of the ₹13.75 Lakh Figure:**
   > **`UNSUPPORTED FIGURE — SOURCE NOT LOCATED`**
   The ₹13.75 Lakh figure arose from an unverified gross difference between two synthetic numbers and must be purged from all exception logs and reports.

2. **Classification of General Ledger Variance Status:**
   > **`UNRESOLVED — EXTERNAL GL EVIDENCE REQUIRED`**
   The true variance between payroll records and the General Ledger cannot be determined until Corporate Controller supplies the official ERP trial balances and journal vouchers (`EVID-GL-02` / `EVID-GL-03`).

---

## 5. Security & Gate 1 Invariant

- **Gate 1 Status:** **`GATE 1: LOCKED — FINANCIAL EXECUTION NOT AUTHORIZED`**.
- **Stage 4B Status:** **`STAGE 4B: NOT AUTHORIZED`**.
- **Database Status:** `prisma/dev.db` hash verified identical. Zero tables or records modified.

