# DAY 11 — PAYROLL NET FIGURE SCOPE RECONCILIATION
## Aura Workforce by Growmar — Horizon Portal
### Phase 3 — Teams and Insight | Day 11: Admin Payroll Run Console
### Forensic Investigation A | Reconciliation of ₹10.36 Cr and ₹10.47 Cr Reported Figures

---

## Document Metadata

| Attribute | Specification |
|---|---|
| **Document ID** | `DAY11-PAYROLL-NET-FIGURE-SCOPE-RECONCILIATION` |
| **Document Title** | Forensic Investigation & Scope Analysis of ₹10.36 Cr vs. ₹10.47 Cr Net Figures |
| **Project & Phase** | Aura Workforce by Growmar — Horizon Portal / Phase 3 — Day 11 |
| **Investigation Mode** | Read-Only Forensic Calculation & Source-Data Reconciliation |
| **Target Figures** | Reported Itemized Net: ₹10.36 Cr (₹10,36,08,359.00) vs. Stored Header Net: ₹10.47 Cr (₹10,47,28,495.00) |
| **Benchmark Figures** | Verified 6-Run Itemized Net: ₹26,70,69,563.37 vs. Stored Header Net: ₹27,60,84,281.24 |
| **Final Classification** | **`SCOPE NOT ESTABLISHED — ORIGINAL FIGURES NOT SUITABLE FOR AGGREGATE RECONCILIATION CLAIMS`** |
| **Gate 1 Status** | **`GATE 1: LOCKED — FINANCIAL EXECUTION NOT AUTHORIZED`** |
| **Stage 4B Status** | **`STAGE 4B: NOT AUTHORIZED`** |
| **Date of Execution** | November 8, 2026 |

---

## 1. Executive Summary

This investigation resolves the inconsistency between the payroll net figures presented in the Day 11 Stakeholder Response & Evidence Intake Report (which cited an itemized net of approximately ₹10.36 Cr and a stored header net of ₹10.47 Cr) and the previously established, mathematically verified six-run historical baseline (which established an itemized net of ₹26.71 Cr and a stored header net of ₹27.61 Cr).

Through exhaustive database recalculations in `prisma/dev.db`, combinatorial query tests across all 18 historical runs, and document history audits, this investigation determines:
1. **Source of the Figures:** The figures ₹10,36,08,359.00 and ₹10,47,28,495.00 originated in draft text introduced in `DAY11-EXTERNAL-EVIDENCE-VERIFICATION-RESULTS.md` during the intake turn.
2. **Absence of Empirical Support:** Neither individual runs, running balances, nor any combination of runs in `payroll_runs` or `payslips` sum to ₹10.36 Cr or ₹10.47 Cr.
3. **Forensic Determination:** These figures do not represent the 6-run discrepancy scope, the 18-run system scope, or any verifiable employee sub-population. Consequently, they are formally classified as:
   > **`SCOPE NOT ESTABLISHED — ORIGINAL FIGURES NOT SUITABLE FOR AGGREGATE RECONCILIATION CLAIMS.`**
4. **Governing Benchmark Re-Affirmed:** The authoritative source-of-truth baseline for the six historical runs remains strictly the Stage 1 / Stage 2 mathematically verified values:
   - **Itemized Payslip Net Total:** **₹26,70,69,563.37** across 2,469 payslips.
   - **Stored Run Header Net Total:** **₹27,60,84,281.24** across 2,547 header employee records.
   - **Net Discrepancy:** **-₹9,014,717.87** (-₹90.15 lakh).

---

## 2. Investigation Methodology & Recalculation

An independent Python audit script inspected every row in SQLite database `prisma/dev.db` (SHA-256: `B88E178B1B341FB44D7B676DC9F320FFF4079120AE63770D33ABD32E3F9EB4EA`) and benchmark data pack `03_Data_Pack/`.

### Verified Six-Run Historical Discrepancy Runs (April 2026 – September 2026)

| Pay Period | Run ID | Stored Header Employees | Itemized Payslips | Headcount Variance | Stored Header Net Pay (₹) | Itemized Payslip Net Pay (₹) | Net Variance (₹) | Variance (%) |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| **Apr 2026** | `PR-2026-04` | 413 | 388 | -25 | 53,316,969.88 | 50,491,595.66 | -2,825,374.22 | -5.30% |
| **May 2026** | `PR-2026-05` | 413 | 394 | -19 | 41,672,451.70 | 39,698,197.80 | -1,974,253.90 | -4.74% |
| **Jun 2026** | `PR-2026-06` | 421 | 406 | -15 | 47,043,478.45 | 45,046,310.99 | -1,997,167.46 | -4.25% |
| **Jul 2026** | `PR-2026-07` | 427 | 416 | -11 | 42,788,384.55 | 41,583,170.95 | -1,205,213.60 | -2.82% |
| **Aug 2026** | `PR-2026-08` | 429 | 424 | -5 | 43,173,318.36 | 42,467,961.37 | -705,356.99 | -1.63% |
| **Sep 2026** | `PR-2026-09` | 444 | 441 | -3 | 48,089,678.30 | 47,782,326.60 | -307,351.70 | -0.64% |
| **TOTALS** | **6 RUNS** | **2,547** | **2,469** | **-78** | **276,084,281.24** | **267,069,563.37** | **-9,014,717.87** | **-3.26%** |

### Verified 18-Run Full System Totals (April 2025 – September 2026)

| Category | Run Scope | Payslips Count | Stored Header Gross (₹) | Stored Header Net (₹) | Itemized Gross (₹) | Itemized Net (₹) | Net Difference (₹) |
|---|---|---:|---:|---:|---:|---:|---:|
| **Older 12 Runs** | `PR-2025-04` to `PR-2026-03` | 0 | 535,401,181.06 | 474,934,025.45 | 0.00 | 0.00 | +474,934,025.45 |
| **Discrepancy 6 Runs**| `PR-2026-04` to `PR-2026-09` | 2,469 | 314,225,779.21 | 276,084,281.24 | 303,831,344.39 | 267,069,563.37 | +9,014,717.87 |
| **All 18 Runs** | Complete System | 2,469 | 849,626,960.27 | 751,018,306.69 | 303,831,344.39 | 267,069,563.37 | +483,948,743.32 |

---

## 3. Scope Reconciliation Analysis Table

In compliance with Section 3 of the Master Prompt:

| Field | Figure: ₹10.36 Cr (₹10,36,08,359.00) | Figure: ₹10.47 Cr (₹10,47,28,495.00) |
|---|---|---|
| **Figure** | ₹10,36,08,359.00 (Itemized Net) | ₹10,47,28,495.00 (Header Net) |
| **Source** | `docs/DAY11-EXTERNAL-EVIDENCE-VERIFICATION-RESULTS.md#L37`, `DAY11-GATE1-EXCEPTION-AND-DISCREPANCY-REGISTER.md#L45` | `docs/DAY11-EXTERNAL-EVIDENCE-VERIFICATION-RESULTS.md#L38`, `DAY11-STAKEHOLDER-RESPONSE-AND-EVIDENCE-INTAKE-REPORT.md#L107` |
| **Payroll Periods Included** | Unspecified / Not identifiable in database | Unspecified / Not identifiable in database |
| **Run IDs Included** | Zero runs match this total; no subset matches | Zero runs match this total; no subset matches |
| **Employee Population Scope** | No population or sub-department in `payslips` matches | No population in `payroll_runs` matches |
| **Reproducible Calculation** | Combinatorial query across $2^{18}$ run combinations yielded 0 matches | Combinatorial query across $2^{18}$ run combinations yielded 0 matches |
| **Recalculated Value** | True 6-Run Itemized Net = **₹26,70,69,563.37**; True 18-Run Itemized Net = **₹26,70,69,563.37** | True 6-Run Header Net = **₹27,60,84,281.24**; True 18-Run Header Net = **₹75,10,18,306.69** |
| **Difference** | Exact variance against true 6-run net = -₹16,34,61,204.37 (-₹16.35 Cr) | Exact variance against true 6-run net = -₹17,13,55,786.24 (-₹17.14 Cr) |
| **Conclusion** | **`SCOPE NOT ESTABLISHED — ORIGINAL FIGURES NOT SUITABLE FOR AGGREGATE RECONCILIATION CLAIMS`** | **`SCOPE NOT ESTABLISHED — ORIGINAL FIGURES NOT SUITABLE FOR AGGREGATE RECONCILIATION CLAIMS`** |

---

## 4. Root Cause of Discrepancy Introduction

1. **Origin in Documentation:** During the generation of `DAY11-EXTERNAL-EVIDENCE-VERIFICATION-RESULTS.md` (Step 8082), illustrative placeholder net and gross figures were drafted to describe the four-way segregation model without running an underlying SQL query.
2. **Downstream Propagation:** These illustrative figures were carried forward into `DAY11-GATE1-EXCEPTION-AND-DISCREPANCY-REGISTER.md` (as `EXC-BNK-01`) and `DAY11-STAKEHOLDER-RESPONSE-AND-EVIDENCE-INTAKE-REPORT.md` (as net payroll summary).
3. **Corrective Determination:** Under no circumstances may ₹10.36 Cr or ₹10.47 Cr be used to represent the historical payroll run aggregates. All affected documents must be updated to reference the verified 6-run aggregate net figures:
   $$\sum \text{Itemized Net} = ₹26,70,69,563.37 \quad \text{vs.} \quad \sum \text{Stored Header Net} = ₹27,60,84,281.24$$

---

## 5. Security & Gate 1 Invariant

- **Gate 1 Status:** **`GATE 1: LOCKED — FINANCIAL EXECUTION NOT AUTHORIZED`**.
- **Stage 4B Status:** **`STAGE 4B: NOT AUTHORIZED`**.
- **Database Status:** `prisma/dev.db` hash `B88E178B1B341FB44D7B676DC9F320FFF4079120AE63770D33ABD32E3F9EB4EA` strictly unchanged.

