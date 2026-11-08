# DAY 11 — STAGE 2: RUN-BY-RUN ROOT-CAUSE MATRIX
## Granular Run-by-Run Forensic Decomposition across the Six Discrepant Pay Cycles

| Document Field | Formal Audit Value |
|---|---|
| **Project** | Aura Workforce by Growmar — Horizon Portal |
| **Phase / Task** | Phase 3 — Day 11: Admin Payroll Run Console |
| **Stage** | Stage 2 of 6 — Root-Cause Forensic Investigation |
| **Governing Baseline** | **Stage 1 Revision 2.1** (`docs/DAY11-POLICY-A-SOURCE-OF-TRUTH-DECISION.md`) |
| **Document Identifier** | `docs/DAY11-STAGE2-RUN-BY-RUN-ROOT-CAUSE-MATRIX.md` |
| **Date** | November 7, 2026 |
| **Investigation Mode** | Strictly Read-Only Forensic Analysis |

---

## 1. Classification Taxonomy

- **`SOURCE_DATA_MISMATCH`:** The discrepancy is proven to exist directly within the original supplied source files (`03_Data_Pack/payroll_runs.json` vs. `03_Data_Pack/payslips.json`).
- **`GENERATION_LOGIC_MISMATCH`:** Statistical and relational evidence indicates headers and payslips were produced using different population cutoffs or calculation logic.
- **`IMPORT_TRANSFORMATION_MISMATCH`:** Discrepancy introduced during database seeding (Tested & Refuted).
- **`APPLICATION_AGGREGATION_DEFECT`:** Application calculation or query bug (Tested & Refuted).
- **`DATABASE_DRIFT`:** Post-seed data mutation (Tested & Refuted).

---

## 2. Granular Run-by-Run Forensic Evaluations

---

### RUN 1: April 2026 (`PR-2026-04`)

#### 1. Identification & Financial Summary
- **Period:** 2026-04-01 to 2026-04-30 | **Payment Date:** 2026-05-01 | **Status:** `PAID` (Legacy text flag)
- **Header Figures:** Headcount: 413 | Gross: ₹61,486,224.92 | Implied Deductions: ₹8,169,255.04 | Net: ₹53,316,969.88
- **Itemized Figures:** Headcount: 388 | Gross: ₹58,268,345.09 | Deductions: ₹7,776,749.43 | Net: ₹50,491,595.66
- **Variances ($\text{Itemized} - \text{Header}$):**
  - Headcount Variance: **-25 employees**
  - Gross Variance: **-₹3,217,879.83** (-321,787,983 paise)
  - Deductions Variance: **-₹392,505.61** (-39,250,561 paise)
  - Net Variance: **-₹2,825,374.22** (-282,537,422 paise)
  - Variance Identity: $\Delta_{\text{Gross}} - \Delta_{\text{Ded}} \equiv \Delta_{\text{Net}}$ (0 paise residual)

#### 2. Root-Cause Decomposition
- **Primary Classification:** `SOURCE_DATA_MISMATCH`
- **Secondary Classification:** `GENERATION_LOGIC_MISMATCH`
- **Confidence Level:** **HIGH**
- **Proven Facts:**
  1. The discrepancy exists directly in `03_Data_Pack/payroll_runs.json` (line 98) and `03_Data_Pack/payslips.json`.
  2. Exactly 388 employees in `03_Data_Pack/employees.json` have `hire_date <= 2026-04-30`.
  3. Exactly 388 payslips exist in `payslips.json` for `PR-2026-04`, matching 100% of employees hired on or before April 30, 2026.
  4. The header headcount of 413 exceeds the total workforce existing on April 30, 2026 by 25 employees.
  5. `prisma/seed.ts` (lines 348–460) copies both records 1-to-1 into SQLite without transformation.
- **Unresolved Questions:** Why the upstream generator assigned a headcount of 413 to April 2026 when only 388 employees had been hired.

---

### RUN 2: May 2026 (`PR-2026-05`)

#### 1. Identification & Financial Summary
- **Period:** 2026-05-01 to 2026-05-31 | **Payment Date:** 2026-06-01 | **Status:** `PAID` (Legacy text flag)
- **Header Figures:** Headcount: 413 | Gross: ₹47,013,633.45 | Implied Deductions: ₹5,341,181.75 | Net: ₹41,672,451.70
- **Itemized Figures:** Headcount: 394 | Gross: ₹44,782,349.84 | Deductions: ₹5,084,152.04 | Net: ₹39,698,197.80
- **Variances ($\text{Itemized} - \text{Header}$):**
  - Headcount Variance: **-19 employees**
  - Gross Variance: **-₹2,231,283.61** (-223,128,361 paise)
  - Deductions Variance: **-₹257,029.71** (-25,702,971 paise)
  - Net Variance: **-₹1,974,253.90** (-197,425,390 paise)
  - Variance Identity: $\Delta_{\text{Gross}} - \Delta_{\text{Ded}} \equiv \Delta_{\text{Net}}$ (0 paise residual)

#### 2. Root-Cause Decomposition
- **Primary Classification:** `SOURCE_DATA_MISMATCH`
- **Secondary Classification:** `GENERATION_LOGIC_MISMATCH`
- **Confidence Level:** **HIGH**
- **Proven Facts:**
  1. The discrepancy exists directly in the raw data pack.
  2. Exactly 394 employees in `employees.json` have `hire_date <= 2026-05-31` (6 new hires joined in May 2026).
  3. Exactly 394 payslips exist in `payslips.json` for `PR-2026-05`.
  4. Header headcount (413) is identical to April 2026, suggesting an unadjusted quarterly or bi-monthly staffing target.
  5. Header average gross (₹113,834.46) matches itemized average gross (₹113,660.79) to within **0.15%**.

---

### RUN 3: June 2026 (`PR-2026-06`)

#### 1. Identification & Financial Summary
- **Period:** 2026-06-01 to 2026-06-30 | **Payment Date:** 2026-07-01 | **Status:** `PAID` (Legacy text flag)
- **Header Figures:** Headcount: 421 | Gross: ₹53,971,863.57 | Implied Deductions: ₹6,928,385.12 | Net: ₹47,043,478.45
- **Itemized Figures:** Headcount: 406 | Gross: ₹51,631,047.77 | Deductions: ₹6,584,736.78 | Net: ₹45,046,310.99
- **Variances ($\text{Itemized} - \text{Header}$):**
  - Headcount Variance: **-15 employees**
  - Gross Variance: **-₹2,340,815.80** (-234,081,580 paise)
  - Deductions Variance: **-₹343,648.34** (-34,364,834 paise)
  - Net Variance: **-₹1,997,167.46** (-199,716,746 paise)
  - Variance Identity: $\Delta_{\text{Gross}} - \Delta_{\text{Ded}} \equiv \Delta_{\text{Net}}$ (0 paise residual)

#### 2. Root-Cause Decomposition
- **Primary Classification:** `SOURCE_DATA_MISMATCH`
- **Secondary Classification:** `GENERATION_LOGIC_MISMATCH`
- **Confidence Level:** **HIGH**
- **Proven Facts:**
  1. Exactly 406 employees have `hire_date <= 2026-06-30` (12 new hires joined in June 2026).
  2. Exactly 406 payslips exist for `PR-2026-06`.
  3. Header headcount of 421 was not reached in company history until August 12, 2026 (`EMP-0725`).
  4. Header average gross (₹128,199.20) matches itemized average gross (₹127,170.07) to within **0.81%**.

---

### RUN 4: July 2026 (`PR-2026-07`)

#### 1. Identification & Financial Summary
- **Period:** 2026-07-01 to 2026-07-31 | **Payment Date:** 2026-08-03 | **Status:** `PAID` (Legacy text flag)
- **Header Figures:** Headcount: 427 | Gross: ₹48,280,389.27 | Implied Deductions: ₹5,492,004.72 | Net: ₹42,788,384.55
- **Itemized Figures:** Headcount: 416 | Gross: ₹46,871,860.72 | Deductions: ₹5,288,689.77 | Net: ₹41,583,170.95
- **Variances ($\text{Itemized} - \text{Header}$):**
  - Headcount Variance: **-11 employees**
  - Gross Variance: **-₹1,408,528.55** (-140,852,855 paise)
  - Deductions Variance: **-₹203,314.95** (-20,331,495 paise)
  - Net Variance: **-₹1,205,213.60** (-120,521,360 paise)
  - Variance Identity: $\Delta_{\text{Gross}} - \Delta_{\text{Ded}} \equiv \Delta_{\text{Net}}$ (0 paise residual)

#### 2. Root-Cause Decomposition
- **Primary Classification:** `SOURCE_DATA_MISMATCH`
- **Secondary Classification:** `GENERATION_LOGIC_MISMATCH`
- **Confidence Level:** **HIGH**
- **Proven Facts:**
  1. Exactly 416 employees have `hire_date <= 2026-07-31` (10 new hires joined in July 2026).
  2. Exactly 416 payslips exist for `PR-2026-07`.
  3. Header headcount of 427 was not reached until September 3, 2026 (`EMP-0731`).
  4. Header average gross (₹113,068.83) matches itemized average gross (₹112,672.74) to within **0.35%**.

---

### RUN 5: August 2026 (`PR-2026-08`)

#### 1. Identification & Financial Summary
- **Period:** 2026-08-01 to 2026-08-31 | **Payment Date:** 2026-09-01 | **Status:** `PAID` (Legacy text flag)
- **Header Figures:** Headcount: 429 | Gross: ₹48,685,007.97 | Implied Deductions: ₹5,511,689.61 | Net: ₹43,173,318.36
- **Itemized Figures:** Headcount: 424 | Gross: ₹47,847,409.45 | Deductions: ₹5,379,448.08 | Net: ₹42,467,961.37
- **Variances ($\text{Itemized} - \text{Header}$):**
  - Headcount Variance: **-5 employees**
  - Gross Variance: **-₹837,598.52** (-83,759,852 paise)
  - Deductions Variance: **-₹132,241.53** (-13,224,153 paise)
  - Net Variance: **-₹705,356.99** (-70,535,699 paise)
  - Variance Identity: $\Delta_{\text{Gross}} - \Delta_{\text{Ded}} \equiv \Delta_{\text{Net}}$ (0 paise residual)

#### 2. Root-Cause Decomposition
- **Primary Classification:** `SOURCE_DATA_MISMATCH`
- **Secondary Classification:** `GENERATION_LOGIC_MISMATCH`
- **Confidence Level:** **HIGH**
- **Proven Facts:**
  1. Exactly 424 employees have `hire_date <= 2026-08-31` (8 new hires joined in August 2026).
  2. Exactly 424 payslips exist for `PR-2026-08`.
  3. The 17 employees (`EMP-0729`..`EMP-0745`) joined in September 2026 and could not receive August pay.
  4. Header headcount of 429 was not reached until September 7, 2026 (`EMP-0733`).
  5. Header average gross (₹113,484.87) matches itemized average gross (₹112,847.66) to within **0.56%**.

---

### RUN 6: September 2026 (`PR-2026-09`)

#### 1. Identification & Financial Summary
- **Period:** 2026-09-01 to 2026-09-30 | **Payment Date:** `null` | **Status:** `POSTED - PAYMENT PENDING`
- **Header Figures:** Headcount: 444 | Gross: ₹54,788,660.03 | Implied Deductions: ₹6,698,981.73 | Net: ₹48,089,678.30
- **Itemized Figures:** Headcount: 441 | Gross: ₹54,430,331.52 | Deductions: ₹6,648,004.92 | Net: ₹47,782,326.60
- **Variances ($\text{Itemized} - \text{Header}$):**
  - Headcount Variance: **-3 employees**
  - Gross Variance: **-₹358,328.51** (-35,832,851 paise)
  - Deductions Variance: **-₹50,976.81** (-5,097,681 paise)
  - Net Variance: **-₹307,351.70** (-30,735,170 paise)
  - Variance Identity: $\Delta_{\text{Gross}} - \Delta_{\text{Ded}} \equiv \Delta_{\text{Net}}$ (0 paise residual)

#### 2. Root-Cause Decomposition
- **Primary Classification:** `SOURCE_DATA_MISMATCH`
- **Secondary Classification:** `GENERATION_LOGIC_MISMATCH`
- **Confidence Level:** **HIGH**
- **Proven Facts:**
  1. Exactly 441 employees exist in `employees.json`. All 441 have `hire_date <= 2026-09-30`.
  2. Exactly 441 payslips exist for `PR-2026-09`.
  3. The header headcount of 444 exceeds the total number of employees in the entire corporate master roster by 3.
  4. Header average gross (₹123,397.88) matches itemized average gross (₹123,424.79) to within **0.02%**!
  5. The monetary variance ($-₹358,328.51$) is almost exactly accounted for by the 3 phantom header headcount slots ($3 \times \text{₹}123,424.79 = \text{₹}370,274.37$).

---

## 3. Comparative Summary Across All Six Discrepant Runs

```
┌────────────┬─────────────┬─────────────┬──────────────┬──────────────────┬─────────────────┐
│ Run ID     │ Header HC   │ Item HC     │ HC Variance  │ Gross Variance   │ Primary Cause   │
├────────────┼─────────────┼─────────────┼──────────────┼──────────────────┼─────────────────┤
│ PR-2026-04 │ 413         │ 388         │ -25 (-6.05%) │ -₹3,217,879.83   │ SOURCE DATA MIS │
│ PR-2026-05 │ 413         │ 394         │ -19 (-4.60%) │ -₹2,231,283.61   │ SOURCE DATA MIS │
│ PR-2026-06 │ 421         │ 406         │ -15 (-3.56%) │ -₹2,340,815.80   │ SOURCE DATA MIS │
│ PR-2026-07 │ 427         │ 416         │ -11 (-2.58%) │ -₹1,408,528.55   │ SOURCE DATA MIS │
│ PR-2026-08 │ 429         │ 424         │  -5 (-1.17%) │   -₹837,598.52   │ SOURCE DATA MIS │
│ PR-2026-09 │ 444         │ 441         │  -3 (-0.68%) │   -₹358,328.51   │ SOURCE DATA MIS │
└────────────┴─────────────┴─────────────┴──────────────┴──────────────────┴─────────────────┘
```

*The discrepancy is structural, pre-existing in the raw benchmark data, and perfectly correlated with workforce hiring dates.*

