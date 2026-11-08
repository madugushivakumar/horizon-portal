# DAY 11 — STAGE 2: ROOT-CAUSE FORENSIC INVESTIGATION REPORT
## In-Depth Forensic Investigation of Historical Payroll Header vs. Payslip Mismatches

| Audit Metadata Field | Formal Investigation Value |
|---|---|
| **Project** | Aura Workforce by Growmar — Horizon Portal |
| **Phase / Task** | Phase 3 — Day 11: Admin Payroll Run Console |
| **Stage** | Stage 2 of 6 — Root-Cause Forensic Investigation |
| **Governing Baseline** | **Stage 1 Revision 2.1** (`docs/DAY11-POLICY-A-SOURCE-OF-TRUTH-DECISION.md`) |
| **Document Identifier** | `docs/DAY11-STAGE2-ROOT-CAUSE-FORENSIC-REPORT.md` |
| **Date** | November 7, 2026 |
| **Auditor Roles** | Senior Payroll Systems Auditor, Forensic Data Analyst, Database Engineer |
| **Stage 2 Determination** | **STAGE 2 COMPLETE — PARTIAL ROOT CAUSES ESTABLISHED; EVIDENCE GAPS REMAIN** |
| **Safety Invariant** | **READ-ONLY INVESTIGATION — ZERO FINANCIAL MUTATIONS** |

---

## 1. Executive Summary

This forensic report delivers the comprehensive root-cause investigation for the six historical payroll runs identified as mismatches during Stage 1 (`PR-2026-04` through `PR-2026-09`).

### Key Proven Findings
1. **Pre-Existing Source-Data Discrepancy:** The discrepancies between summary payroll run headers and itemized payslips exist directly within the supplied benchmark source files (`03_Data_Pack/payroll_runs.json` and `03_Data_Pack/payslips.json`).
2. **Import / Seed Transformation Ruled Out:** Seeding logic (`prisma/seed.ts`, lines 348–460) performs 1-to-1 copies into SQLite (`prisma/dev.db`) without filtering, transformation, or recalculation. The database exactly mirrors the source JSON files.
3. **Application Aggregation Defect Ruled Out:** The Horizon Portal reconciliation engine (`src/lib/payroll/reconciliation-engine.ts`) calculates exact BigInt integer paise sums of payslips with zero mathematical error. Direct database queries reproduce the application outputs with 100% fidelity.
4. **Itemized Payslip Population Generation Law Proven:**
   $$\text{Payslip Population for Run } R \equiv \{ e \in \text{employees.json} \mid e.\text{hire\_date} \le R.\text{period\_end} \}$$
   In 100% of the six runs, every single employee in `employees.json` hired on or before `period_end` received exactly one payslip, and no employee hired after `period_end` received a payslip.
5. **Monetary Variance Proportionality:** The average gross and net pay per employee on the header closely matches the average gross and net pay per employee on the payslips (within 0.02% in September 2026). The monetary variance is primarily driven by the headcount discrepancy multiplied by average compensation.
6. **Upstream Generator Source Code Unavailable:** The external scripts or models that originally generated `03_Data_Pack/payroll_runs.json` are not present in the repository (`UPSTREAM SOURCE EVIDENCE NOT AVAILABLE`).

---

## 2. Investigation Objective and Scope

### 2.1 Scope of Investigation
The investigation was strictly bounded to the six pay cycles containing itemized payslips:
1. **April 2026 (`PR-2026-04`):** Header HC 413 vs. Payslips 388 (Difference: -25)
2. **May 2026 (`PR-2026-05`):** Header HC 413 vs. Payslips 394 (Difference: -19)
3. **June 2026 (`PR-2026-06`):** Header HC 421 vs. Payslips 406 (Difference: -15)
4. **July 2026 (`PR-2026-07`):** Header HC 427 vs. Payslips 416 (Difference: -11)
5. **August 2026 (`PR-2026-08`):** Header HC 429 vs. Payslips 424 (Difference: -5)
6. **September 2026 (`PR-2026-09`):** Header HC 444 vs. Payslips 441 (Difference: -3)

### 2.2 Stage 1 Baseline Preserved
- All 18 payroll runs, 2,469 payslips, and 441 employees verified.
- The 12 historical runs (`PR-2025-04` through `PR-2026-03`) contain zero itemized payslips in the dataset.
- Revision 2.1 governance rules strictly observed:
  - Policy A Revision 2.1 is proposed, pending formal human approval.
  - Governance Gate 1 is locked.
  - Mathematical integrity does not establish statutory or legal authority.
  - Terminology preserved: `OBSERVED PAYROLL POPULATION`, `UNRECONCILED UPSTREAM PAYROLL HEADER — GENERATION METHODOLOGY UNVERIFIED`, `ITEMIZED PAYSLIP AGGREGATE`.

---

## 3. Repository & Data-Flow Traceability (Phase A)

The end-to-end data flow was traced through the codebase:

```
[03_Data_Pack/payroll_runs.json]       [03_Data_Pack/payslips.json]       [03_Data_Pack/employees.json]
             |                                      |                                  |
             +------------------+-------------------+----------------------------------+
                                |
                                v
                       prisma/seed.ts (Lines 348-460)
                       • Direct 1-to-1 JSON-to-Prisma upsert/createMany
                       • Zero data transformation / Zero recalculation
                                |
                                v
                       prisma/dev.db (SQLite)
                       • Table: payroll_runs (18 rows)
                       • Table: payslips (2,469 rows)
                       • Table: employees (441 rows)
                                |
                                v
                       src/lib/payroll/reconciliation-engine.ts
                       • Queries: prisma.payslip.findMany({ where: { payrollRunId } })
                       • BigInt integer paise conversion (1 INR = 100 paise)
                       • Formula: Variance = Itemized Sum - Stored Header
                                |
                                v
                       src/app/api/v1/payroll/runs/route.ts
                       src/app/api/v1/payroll/runs/[runId]/route.ts
                       • Surfaces stored header, calculated sum, and discrepancy status
                                |
                                v
                       src/components/payroll/AdminPayrollConsole.tsx
                       src/components/payroll/PayrollRunDetails.tsx
                       • Displays Dual Presentation: Header vs. Itemized Sum
```

### Traceability Summary Table

| Data Layer | File & Function | Input | Transformation | Output | Verification Status |
|---|---|---|---|---|---|
| **Raw Storage** | `03_Data_Pack/*.json` | Raw JSON text | None | Parsed JSON objects | Verified SHA-256 |
| **Database Ingestion** | `prisma/seed.ts` (`seedDataPack`) | Parsed JSON | Direct copy | `dev.db` SQLite rows | 100% relational parity |
| **Relational Store** | `prisma/dev.db` | SQLite tables | Indexing & FK constraints | Stored rows | `PRAGMA quick_check: ok` |
| **Calculation Engine** | `reconciliation-engine.ts` | Payslip rows | Integer paise BigInt sum | Reconciliation results | 0.000000% precision drift |
| **API Endpoints** | `runs/route.ts`, `[runId]/route.ts` | NextRequest | RBAC guard & JSON serialization | Next.js API Response | Verified HTTP 200/403 |
| **User Interface** | `AdminPayrollConsole.tsx` | API JSON payload | Dual-presentation rendering | User display | Non-mutating display |

---

## 4. Independent Reconciliation Calculations (Phase B)

Independent recalculation was conducted using exact 64-bit integer paise ($1\text{ INR} = 100\text{ paise}$) directly from raw database and JSON records:

$$\text{Variance} = \text{Itemized Payslip Aggregate} - \text{Stored Payroll Header}$$

### Six-Run Comprehensive Reconciliation Table

| Pay Period | Run ID | Header HC | Item HC | HC Var | Header Gross (₹) | Itemized Gross (₹) | Gross Var (₹) | Implied Header Ded (₹) | Itemized Ded (₹) | Ded Var (₹) | Header Net (₹) | Itemized Net (₹) | Net Var (₹) | Result |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| **Apr 2026** | `PR-2026-04` | 413 | 388 | -25 | 61,486,224.92 | 58,268,345.09 | -3,217,879.83 | 8,169,255.04 | 7,776,749.43 | -392,505.61 | 53,316,969.88 | 50,491,595.66 | -2,825,374.22 | **MISMATCH** |
| **May 2026** | `PR-2026-05` | 413 | 394 | -19 | 47,013,633.45 | 44,782,349.84 | -2,231,283.61 | 5,341,181.75 | 5,084,152.04 | -257,029.71 | 41,672,451.70 | 39,698,197.80 | -1,974,253.90 | **MISMATCH** |
| **Jun 2026** | `PR-2026-06` | 421 | 406 | -15 | 53,971,863.57 | 51,631,047.77 | -2,340,815.80 | 6,928,385.12 | 6,584,736.78 | -343,648.34 | 47,043,478.45 | 45,046,310.99 | -1,997,167.46 | **MISMATCH** |
| **Jul 2026** | `PR-2026-07` | 427 | 416 | -11 | 48,280,389.27 | 46,871,860.72 | -1,408,528.55 | 5,492,004.72 | 5,288,689.77 | -203,314.95 | 42,788,384.55 | 41,583,170.95 | -1,205,213.60 | **MISMATCH** |
| **Aug 2026** | `PR-2026-08` | 429 | 424 | -5 | 48,685,007.97 | 47,847,409.45 | -837,598.52 | 5,511,689.61 | 5,379,448.08 | -132,241.53 | 43,173,318.36 | 42,467,961.37 | -705,356.99 | **MISMATCH** |
| **Sep 2026** | `PR-2026-09` | 444 | 441 | -3 | 54,788,660.03 | 54,430,331.52 | -358,328.51 | 6,698,981.73 | 6,648,004.92 | -50,976.81 | 48,089,678.30 | 47,782,326.60 | -307,351.70 | **MISMATCH** |
| **TOTALS** | **6 RUNS** | **2,547** | **2,469** | **-78** | **314,225,779.21** | **303,831,344.39** | **-10,394,434.82** | **38,141,497.97** | **36,761,781.02** | **-1,379,716.95** | **276,084,281.24** | **267,069,563.37** | **-9,014,717.87** | **MISMATCH** |

### Mathematical Verification Results
1. **Payslip Line-Item Arithmetic:** For all 2,469 payslips, $\text{Gross Pay} - \text{Total Deductions} \equiv \text{Net Pay}$ ($0\text{ paise}$ error).
2. **Component Sums:** For all 2,469 payslips, discrete earnings sum to `gross_pay` and discrete deductions sum to `total_deductions` ($0\text{ paise}$ error).
3. **Variance Identity:** Across all six runs:
   $$\text{Gross Variance} - \text{Deduction Variance} \equiv \text{Net Variance} \quad (0\text{ paise error in 100\% of runs})$$

---

## 5. Headcount Root-Cause Investigation (Phase C)

### 5.1 Discovery: Exact Generation Filter for Payslips
By cross-referencing all 441 employee master records against pay period end dates, an exact mathematical rule was discovered:

| Run ID | Period End Date | Employees in Master with $\text{hire\_date} \le \text{Period End}$ | Actual Payslips in Dataset | Omitted Employees ($\text{hire} \le \text{end}$) | Future Employees with Payslips ($\text{hire} > \text{end}$) |
|---|---|---:|---:|---:|---:|
| `PR-2026-04` | 2026-04-30 | 388 | 388 | **0** | **0** |
| `PR-2026-05` | 2026-05-31 | 394 | 394 | **0** | **0** |
| `PR-2026-06` | 2026-06-30 | 406 | 406 | **0** | **0** |
| `PR-2026-07` | 2026-07-31 | 416 | 416 | **0** | **0** |
| `PR-2026-08` | 2026-08-31 | 424 | 424 | **0** | **0** |
| `PR-2026-09` | 2026-09-30 | 441 | 441 | **0** | **0** |

**Forensic Conclusion on Payslips:**
Itemized payslips were generated with **100% precision** against the master employee table based on effective hire date. There are **zero missing employees** and **zero duplicate payslips**.

### 5.2 Header Headcount Mismatch Analysis
The stored header headcount (`employees_paid`) exceeds the total number of employees existing in company history on those dates:
- In April and May 2026, the header records 413 employees. The company did not reach 413 employees until July 24, 2026 (`EMP-0717`).
- In June 2026, the header records 421 employees. The company did not reach 421 employees until August 12, 2026 (`EMP-0725`).
- In July 2026, the header records 427 employees. The company did not reach 427 employees until September 3, 2026 (`EMP-0731`).
- In August 2026, the header records 429 employees. The company did not reach 429 employees until September 7, 2026 (`EMP-0733`).
- In September 2026, the header records 444 employees. The master roster only contains 441 employees in total!

Across all 18 runs (April 2025 to September 2026), the header headcount is systematically higher than the cumulative hire count, with the variance shrinking steadily over time.

---

## 6. Monetary Root-Cause Investigation (Phase D)

### 6.1 Evaluation of the Six Hypotheses

| Hypothesis | Description | Test Result | Forensic Finding |
|---|---|---|---|
| **Hypothesis 1** | Different population used for header totals | **SUPPORTED** | Header headcounts exceed available employees, producing proportionally higher gross/net totals. |
| **Hypothesis 2** | Data-generation methodology difference | **SUPPORTED** | Headers and payslips in `03_Data_Pack` were produced with different cutoffs/target parameters. |
| **Hypothesis 3** | Import or seed transformation defect | **REFUTED** | `prisma/seed.ts` performs 1-to-1 copies without altering values or dropping records. |
| **Hypothesis 4** | Application aggregation defect | **REFUTED** | Application BigInt engine reproduces raw database sums with zero error. |
| **Hypothesis 5** | Upstream payroll source mismatch | **EVIDENCE UNAVAILABLE** | Upstream generator scripts/models are not stored in the repository. |
| **Hypothesis 6** | Database drift post-import | **REFUTED** | Backups and live database are identical to original JSON data pack. |

### 6.2 Per-Employee Average Compensation Analysis

| Run ID | Header Headcount | Payslip Count | Header Avg Gross (₹) | Itemized Avg Gross (₹) | Delta Avg Gross (₹) | Header Avg Net (₹) | Itemized Avg Net (₹) | Delta Avg Net (₹) |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| `PR-2026-04` | 413 | 388 | 148,877.06 | 150,176.15 | -1,299.09 (-0.86%) | 129,096.78 | 130,132.98 | -1,036.20 (-0.80%) |
| `PR-2026-05` | 413 | 394 | 113,834.46 | 113,660.79 | +173.67 (+0.15%) | 100,901.82 | 100,756.85 | +144.97 (+0.14%) |
| `PR-2026-06` | 421 | 406 | 128,199.20 | 127,170.07 | +1,029.13 (+0.81%) | 111,742.23 | 110,951.50 | +790.73 (+0.71%) |
| `PR-2026-07` | 427 | 416 | 113,068.83 | 112,672.74 | +396.09 (+0.35%) | 100,206.99 | 99,959.55 | +247.44 (+0.25%) |
| `PR-2026-08` | 429 | 424 | 113,484.87 | 112,847.66 | +637.21 (+0.56%) | 100,637.11 | 100,160.29 | +476.82 (+0.47%) |
| `PR-2026-09` | 444 | 441 | 123,397.88 | 123,424.79 | **-26.91 (-0.02%)** | 108,310.09 | 108,349.95 | **-39.86 (-0.04%)** |

**Forensic Finding:**
In September 2026, the header average gross (₹123,397.88) matches the itemized average gross (₹123,424.79) to within **0.02%**! The monetary variance of $-₹358,328.51$ is almost entirely accounted for by the 3 unbacked header headcount slots:
$$3 \times \text{₹}123,424.79 = \text{₹}370,274.37 \approx \text{₹}358,328.51$$

---

## 7. Run-by-Run Root-Cause Classifications (Phase E)

### Classification Summary Table

| Run ID | Pay Period | Primary Classification | Secondary Classification | Confidence | Proven Facts |
|---|---|---|---|---|---|
| `PR-2026-04` | April 2026 | `SOURCE_DATA_MISMATCH` | `GENERATION_LOGIC_MISMATCH` | **HIGH** | Discrepancy present in raw JSON; 388 payslips match all employees hired $\le$ 2026-04-30. |
| `PR-2026-05` | May 2026 | `SOURCE_DATA_MISMATCH` | `GENERATION_LOGIC_MISMATCH` | **HIGH** | Discrepancy present in raw JSON; 394 payslips match all employees hired $\le$ 2026-05-31. |
| `PR-2026-06` | June 2026 | `SOURCE_DATA_MISMATCH` | `GENERATION_LOGIC_MISMATCH` | **HIGH** | Discrepancy present in raw JSON; 406 payslips match all employees hired $\le$ 2026-06-30. |
| `PR-2026-07` | July 2026 | `SOURCE_DATA_MISMATCH` | `GENERATION_LOGIC_MISMATCH` | **HIGH** | Discrepancy present in raw JSON; 416 payslips match all employees hired $\le$ 2026-07-31. |
| `PR-2026-08` | August 2026 | `SOURCE_DATA_MISMATCH` | `GENERATION_LOGIC_MISMATCH` | **HIGH** | Discrepancy present in raw JSON; 424 payslips match all employees hired $\le$ 2026-08-31. |
| `PR-2026-09` | September 2026 | `SOURCE_DATA_MISMATCH` | `GENERATION_LOGIC_MISMATCH` | **HIGH** | Discrepancy present in raw JSON; 441 payslips match all employees hired $\le$ 2026-09-30. |

---

## 8. Cross-Run Pattern Analysis (Phase F)

1. **Systematic Monotonic Convergence:**
   The headcount difference shrinks steadily each month: $-25 \rightarrow -19 \rightarrow -15 \rightarrow -11 \rightarrow -5 \rightarrow -3$.
2. **Gross Variance Monotonic Convergence:**
   The gross pay variance shrinks proportionally: $-₹3.22\text{M} \rightarrow -₹2.23\text{M} \rightarrow -₹2.34\text{M} \rightarrow -₹1.41\text{M} \rightarrow -₹0.84\text{M} \rightarrow -₹0.36\text{M}$.
3. **Common Proven Root Cause:**
   All six runs share the **identical proven cause**: `payroll_runs.json` headers were populated with upstream batch figures that exceeded actual hiring dates, while `payslips.json` was generated strictly for employees with `hire_date <= period_end`.
4. **Distinction Between Proven Fact and Hypothesis:**
   - **Proven:** Discrepancy exists in original source JSON; seed script is faithful; application aggregation is mathematically exact.
   - **Unverified Hypothesis:** Why the upstream batch headers were created with higher headcounts (e.g. budgeted vacancies vs. future roster lag) cannot be proven because the upstream generator source code is unavailable.

---

## 9. Application and Control Impact (Phase G)

- **Presentation Accuracy:** The UI (`AdminPayrollConsole.tsx`, `PayrollRunDetails.tsx`) correctly displays both the Unreconciled Upstream Payroll Header and the Itemized Payslip Aggregate side-by-side with discrepancy chips.
- **Integrity Enforcement:** The application does **not** falsely mark runs as reconciled. Runs with variances correctly show `MISMATCH`.
- **Zero Mutations:** The application does not overwrite historical headers or fabricate adjustments.
- **RBAC Enforcement:** Server-side role checks (`HR` / `ADMIN`) prevent unauthorized viewing or execution.

---

## 10. External Evidence Register (Phase H)

The following external evidence would be required to fully close all open questions:
1. **Upstream Data Generator Source Code:** The script or algorithm used by the academic programme/vendor to create `03_Data_Pack/payroll_runs.json`.
2. **Staffing Budget / Requisition Manifest:** Documentation indicating whether the higher header headcounts represented approved hiring targets.
3. **Bank Disbursement Accounts & Statements:** Real bank settlement records (currently unavailable in this simulation).
4. **Statutory Tax & EPFO Challans:** External statutory returns (currently unavailable in this simulation).

---

## 11. Final Acceptance Conclusion

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                    STAGE 2 FINAL ACCEPTANCE DETERMINATION                    ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║   STAGE 2 COMPLETE — PARTIAL ROOT CAUSES ESTABLISHED; EVIDENCE GAPS REMAIN   ║
║                                                                              ║
║   • Source Traceability:             100% PROVEN (Data Pack -> DB -> UI)     ║
║   • Import Transformation:           REFUTED (1-to-1 exact seed)             ║
║   • Application Defect:              REFUTED (BigInt math exact, 0 residual) ║
║   • Primary Cause:                   SOURCE_DATA_MISMATCH (Proven)           ║
║   • Secondary Cause:                 GENERATION_LOGIC_MISMATCH (Probable)    ║
║   • Upstream Generator Code:         EVIDENCE UNAVAILABLE                    ║
║   • Database State:                  100% INVARIANT (0 MUTATIONS)            ║
║   • Governance Gate 1:               LOCKED                                  ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

*This report concludes Stage 2 forensic analysis. Stage 3 has NOT been started. No financial mutations or code changes were executed.*

