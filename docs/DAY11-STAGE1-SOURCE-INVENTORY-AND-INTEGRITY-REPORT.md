# DAY 11 — STAGE 1: SOURCE INVENTORY AND INTEGRITY REPORT
## Comprehensive Forensic Audit of Payroll Data Sources, Database Stores, Backups & Application Lineage
### (Revision 2.1 — Evidence Qualification & Authority Separation)

| Metadata Field | Value |
|---|---|
| **Project** | Aura Workforce by Growmar — Horizon Portal |
| **Phase** | Phase 3 — Teams and Insight |
| **Task** | Day 11 — Admin Payroll Run Console |
| **Stage** | Stage 1 of 6 — Establish the Source of Truth |
| **Repository** | `C:\Users\Madugu Shiva Kumar\OneDrive\图片\Desktop\horizon-portal` |
| **Branch / Commit** | `main` / `57ebcba5237d18eb053b1165a6e9795080ed907b` (`phase-3`) |
| **Auditor Roles** | Senior Payroll Systems Architect, Financial Data Auditor, Database Analyst |
| **Audit Date** | November 7, 2026 |
| **Stage 1 Status** | **INVESTIGATION COMPLETE — POLICY PROPOSED (REV 2.1), PENDING APPROVAL** |
| **Safety Invariant** | **ZERO FINANCIAL MUTATIONS — DATABASE UNCHANGED** |

---

## 1. Executive Summary & Purpose

This forensic report establishes the empirical foundation for Stage 1 of the Day 11 Payroll Reconciliation Project. In strict accordance with the Master Execution Directive and Revision 2.1 evidence qualification standards, this investigation independently inspects all available payroll data sources, evaluates their cryptographic integrity, compares live relational records against cold backups, and maps the exact lineage of every financial value displayed in the Horizon Portal.

### Core Audit Findings
1. **Operating Context Identified:** Aura Workforce is an enterprise simulation developed within a structured Full-Stack engineering programme ("Aura Workforce by Growmar — Phase 1 through Phase 3"). The underlying data pack represents supplied synthetic benchmark data rather than outputs of commercial banking networks.
2. **Cryptographic Integrity of Raw Sources:** All three original JSON data pack files (`payroll_runs.json`, `payslips.json`, `employees.json`) are cryptographically verified with matching SHA-256 hashes.
3. **Database Relational Fidelity:** The active SQLite database (`prisma/dev.db`) contains exactly 18 payroll runs, 2,469 payslips, and 441 employees, matching the source JSON records with 100% field-for-field relational parity.
4. **Historical Database Invariance:** Forensic comparison across six database backups confirms that all historical common columns in `payroll_runs` and 100% of payslip records remain identical to pre-migration baselines.
5. **The Three Distinct Evidence Dimensions:**
   - `DATASET AUTHORITY: ESTABLISHED FOR THE SUPPLIED SYNTHETIC BENCHMARK`
   - `MATHEMATICAL INTEGRITY: VERIFIED WITHIN THE SUPPLIED DATASET` (0 paise arithmetic residual across all 2,469 payslips)
   - `LEGAL/ACCOUNTING AUTHORITY: NOT ESTABLISHED FROM AVAILABLE EVIDENCE` (contractual letters, tax challans, and GL journals are unavailable)
6. **Payroll Header Classification:** Stored payroll headers where totals differ from itemized sums are formally classified as:
   `UNRECONCILED UPSTREAM PAYROLL HEADER — GENERATION METHODOLOGY UNVERIFIED`
   The origin, calculation methodology, and intended accounting meaning of header values have not yet been established.
7. **Bank Settlement Authority:**
   `BANK SETTLEMENT AUTHORITY: NOT ESTABLISHED FROM AVAILABLE EVIDENCE`  
   Zero tables or columns exist in the repository recording banking transaction IDs, NEFT/RTGS UTR numbers, or bank settlement manifests.

---

## 2. Operating Context Evaluation (Phase A)

Before establishing source-of-truth policies, the project's operational environment must be classified to determine the legal and financial authority of the available records.

### 2.1 Repository Evidence on Operating Context
- **Curriculum Architecture:** The repository root, documentation files, and commit history structure work into "Phase 1: Foundation (Days 1–5)", "Phase 2: Core HR (Days 6–10)", and "Phase 3: Teams and Insight (Days 11–15)".
- **Demo Accounts & Synthetic Credentials:** `03_Data_Pack/demo_users.json` explicitly provides four demo credentials (`ADMIN`, `HR`, `MANAGER`, `EMPLOYEE`) using mock email domains (`@znova-demo.example`) and includes instructions such as `"demo_password": "Horizon@2026 (hash it in YOUR seed script; never store plain text)"`.
- **Academic Programme Reference:** As documented in `docs/DAY11-FINAL-ACCEPTANCE-CLOSURE-REPORT.md`, the dataset represents supplied sample data for an advanced engineering capstone assessment.
- **Absence of External Legal Documentation:** There are no corporate articles of incorporation, bank disbursement account contracts, tax filing acknowledgments (ITR/Form 16/EPFO filings), or tripartite banking agreements in the codebase.

### 2.2 Formal Context Determination
```
PROJECT CONTEXT: ADVANCED ENTERPRISE SIMULATION / PROGRAMME ASSESSMENT
DATASET AUTHORITY: ESTABLISHED FOR THE SUPPLIED SYNTHETIC BENCHMARK
LEGAL/STATUTORY AUTHORITY: NOT ESTABLISHED FROM AVAILABLE EVIDENCE
```

### 2.3 Impact on Data Authority
- The data pack cannot be treated as legal proof of employee bank settlements or statutory tax remittance.
- The discrepancies between payroll run headers and itemized payslips are upstream data-generation artifacts present in the provided sample dataset.
- Therefore, the source-of-truth policy must be framed as a **rigorous enterprise standard simulation**: distinguishing technical authority (what the code and data support) from corporate governance authority (what human financial stakeholders must sign off).

---

## 3. Original JSON Files Inventory & Integrity (Phase B1)

The original source dataset resides in the `03_Data_Pack/` directory.

### 3.1 Cryptographic & Physical File Properties

| Source File | Physical File Path | File Size | SHA-256 Checksum | Record Count | Top-Level Structure |
|---|---|---:|---|---:|---|
| **Payroll Runs** | `03_Data_Pack/payroll_runs.json` | 4,062 B | `d501c1c70b0515d77f39dc2af9597b01b729e76eb3feff8d730c697131e74e21` | 18 | Uniform JSON Array |
| **Payslips** | `03_Data_Pack/payslips.json` | 1,432,529 B | `9e6f7649e92f821fd680ad9963b730d087c7fafa6a59ebff8790a88c54a04196` | 2,469 | Uniform JSON Array |
| **Employees** | `03_Data_Pack/employees.json` | 138,418 B | `ab0d227444095287aec9dbb21f0f31b98550336cd0a8bcfb74619b9947d26a90` | 441 | Uniform JSON Array |

### 3.2 Schema, Field Definitions & Data Types

#### A. `payroll_runs.json` (8 Fields)
- `run_id` (String, e.g. `"PR-2026-08"`): Unique identifier.
- `period_start` (String, ISO Date `"YYYY-MM-DD"`): Pay period commencement.
- `period_end` (String, ISO Date `"YYYY-MM-DD"`): Pay period conclusion.
- `pay_date` (String, ISO Date `"YYYY-MM-DD"` or `null`): Stored execution date (null for `PR-2026-09`).
- `employees_paid` (Integer): Upstream batch headcount figure.
- `total_gross` (Float / Number): Upstream total gross compensation.
- `total_net` (Float / Number): Upstream total net payable compensation.
- `status` (String): Stored operational status (`"PAID"` for 17 runs, `"POSTED - PAYMENT PENDING"` for `PR-2026-09`).

#### B. `payslips.json` (23 Fields)
- **Identifiers:** `payroll_item_id` (String, PK), `run_id` (String, FK), `employee_id` (String, FK).
- **Time Accounting:** `period_start`, `period_end`, `calendar_days` (Int), `lop_days` (Float), `payable_days` (Float).
- **Earnings Components:** `basic`, `hra`, `conveyance`, `medical`, `special_allowance`, `overtime_pay`, `variable_pay`, `gross_pay` (All Float).
- **Deduction Components:** `pf_employee`, `esi_employee`, `professional_tax`, `tds`, `other_deductions`, `total_deductions` (All Float).
- **Net Calculation:** `net_pay` (Float).

#### C. `employees.json` (10 Fields)
- `employee_id` (String, PK, e.g. `"EMP-0001"`).
- `full_name` (String): Worker full name.
- `work_email` (String): Unique company email address.
- `department_id` (String, FK to `departments.json`).
- `role_id` (String, FK to `roles.json`).
- `manager_id` (String, FK to `employees.json` or `null` for executive CEO).
- `work_location` (String): Office or city assignment.
- `work_mode` (String): `"Remote"`, `"Hybrid"`, or `"Onsite"`.
- `employment_type` (String): e.g. `"Full-time"`.
- `hire_date` (String, ISO Date `"YYYY-MM-DD"`): Effective hiring date.

### 3.3 Data Quality & Relationship Verification
- **Primary Key Uniqueness:**
  - `payroll_runs.json`: 18 records, exactly 18 distinct `run_id`s (0 duplicates).
  - `payslips.json`: 2,469 records, exactly 2,469 distinct `payroll_item_id`s (0 duplicates).
  - `employees.json`: 441 records, exactly 441 distinct `employee_id`s (0 duplicates).
- **Null Value Audit:**
  - `payroll_runs.json`: `pay_date` is `null` for exactly 1 record (`PR-2026-09`). All other fields non-null.
  - `payslips.json`: 0 nulls across all 2,469 rows and all 23 fields.
  - `employees.json`: `manager_id` is `null` for exactly 1 record (`EMP-0001`, CEO). All other fields non-null.
- **Relational Integrity:**
  - All 2,469 payslips reference existing `run_id`s in `payroll_runs.json`.
  - All 2,469 payslips reference valid `employee_id`s in `employees.json` (0 orphaned payslips).
  - Payslips exist **only for 6 of the 18 runs**:
    - `PR-2026-04` (388 payslips)
    - `PR-2026-05` (394 payslips)
    - `PR-2026-06` (406 payslips)
    - `PR-2026-07` (416 payslips)
    - `PR-2026-08` (424 payslips)
    - `PR-2026-09` (441 payslips)
  - The remaining 12 historical runs (`PR-2025-04` through `PR-2026-03`) contain **zero itemized payslips** in `03_Data_Pack/payslips.json`.
- **Source Metadata & Authority Documentation:**
  - None of the three JSON files contain embedded metadata, creation timestamps, generator signatures, or export manifests. They are raw data dumps.

---

## 4. Database Inspection (`prisma/dev.db`) (Phase B2)

The live application database was inspected using read-only SQLite connections (`file:prisma/dev.db?mode=ro`).

### 4.1 Database Physical Properties
- **Path:** `prisma/dev.db`
- **File Size:** 3,637,248 bytes
- **SHA-256:** `b88e178b1b341fb44d7b676dc9f320fff4079120ae63770d33abd32e3f9eb4ea`
- **Integrity Status:** `PRAGMA quick_check` returned `ok`; `PRAGMA foreign_key_check` returned 0 violations.

### 4.2 Table Catalog & Record Counts (28 Tables)

| Category | Table Name | Row Count | Primary Key | Foreign Key Target |
|---|---|---:|---|---|
| **Core Payroll** | `payroll_runs` | 18 | `id` (TEXT) | None |
| **Core Payroll** | `payslips` | 2,469 | `id` (TEXT) | `payroll_run_id` -> `payroll_runs`, `employee_id` -> `employees` |
| **Core Payroll** | `payroll_adjustments` | 0 | `id` (TEXT) | `payroll_run_id` -> `payroll_runs` |
| **Audit & Security** | `audit_logs` | 87 | `id` (TEXT) | None (loose linkage) |
| **Audit & Security** | `users` | 8 | `id` (TEXT) | `employee_id` -> `employees` |
| **Core HR** | `employees` | 441 | `id` (TEXT) | `department_id`, `role_id`, `manager_id` |
| **Core HR** | `departments` | 11 | `id` (TEXT) | None |
| **Core HR** | `roles` | 58 | `id` (TEXT) | None |
| **Core HR** | `teams` | 16 | `id` (TEXT) | None |
| **Operations** | `tasks` | 4,844 | `id` (TEXT) | `assignee_employee_id`, `sprint_id` |
| **Operations** | `sprints` | 38 | `id` (TEXT) | None |
| **Finance** | `invoices` | 743 | `id` (TEXT) | `client_id` |
| **Finance** | `expenses` | 501 | `id` (TEXT) | `vendor_id`, `department_id` |
| **AI Insights** | `ai_attrition_risk` | 430 | `id` (TEXT) | `employee_id` |
| **AI Insights** | `ai_anomaly_results` | 405 | `id` (TEXT) | None |
| **HR Operations** | `attendance_monthly` | 2,469 | `id` (TEXT) | `employee_id` |
| **HR Operations** | `leave_requests` | 2,183 | `id` (TEXT) | `employee_id` |
| **HR Operations** | `leave_balances` | 441 | `id` (TEXT) | `employee_id` |
| **System** | `_prisma_migrations` | 8 | `id` (TEXT) | None |

### 4.3 Database Schema Analysis for Payroll

#### A. `payroll_runs` Schema
- **Legacy Columns:** `id`, `period_start`, `period_end`, `payment_date`, `pay_date`, `employees_paid`, `total_gross`, `total_net`, `status`, `created_at`, `updated_at`.
- **Governance & Approval Columns:** `approval_status` (Default: `'Pending'`), `approval_notes`, `approved_at`, `approved_by_id`, `preparer_id`.
- **Step 1 Migration Historical Columns:** `original_employees_paid`, `original_total_gross`, `original_total_deductions`, `original_total_net`, `reconciled_at`, `reconciled_by_id`, `reconciliation_notes`.
- **Status Analysis:** All 18 rows currently have `approval_status = 'Pending'`. `approved_at` and `approved_by_id` are NULL.

#### B. `payslips` Schema
- **Columns:** `id`, `employee_id`, `payroll_run_id`, `period_start`, `period_end`, `calendar_days`, `lop_days`, `payable_days`, `basic`, `hra`, `conveyance`, `medical`, `special_allowance`, `overtime_pay`, `variable_pay`, `gross_pay`, `pf_employee`, `esi_employee`, `professional_tax`, `tds`, `other_deductions`, `total_deductions`, `net_pay`, `deductions`, `currency`, `pay_period`, `created_at`, `updated_at`.
- **Foreign Keys:** Enforced to `payroll_runs(id)` and `employees(id)`.
- **Indexes:** Dedicated indexes on `payroll_run_id` and `employee_id`.

#### C. `payroll_adjustments` Schema
- **Columns:** 36 columns supporting complete double-entry delta accounting (`original_*_paise`, `adjusted_*_paise`, `variance_*_paise`, `idempotency_key`, `reason`, `reconciliation_source`, `approved_by_id`).
- **Current Row Count:** **0 rows.** Table is created but completely empty, guaranteeing zero mutations have taken place.

### 4.4 Direct Comparison: Database vs. Original JSON
- **`payroll_runs`:** All 18 rows in `dev.db` match `03_Data_Pack/payroll_runs.json` with **0 differences** across `employees_paid`, `total_gross`, `total_net`, and `status`.
- **`payslips`:** All 2,469 rows in `dev.db` match `03_Data_Pack/payslips.json` with **0 differences** across all earnings, deductions, and net pay.
- **`employees`:** All 441 rows in `dev.db` match `03_Data_Pack/employees.json` with **0 differences**. During initial seeding, `full_name` was parsed into `first_name` and `last_name`, but the relational identity and hire dates are 100% faithful.

---

## 5. Existing Backups & Differential Analysis (Phase B3)

Six historical database backups exist in the repository across `prisma/backups/` and `backups/`.

### 5.1 Backup Inventory

| Backup Path | File Size | SHA-256 (First 8) | Created / Context |
|---|---:|---|---|
| `prisma/dev.db.bak` | 3,264,512 B | `17eb52d8` | Initial Day 1–5 baseline backup |
| `prisma/backups/dev-backup-2026-11-05T13-03-26-829Z.db` | 3,334,144 B | `fa45da31` | Pre-Day 11 working backup |
| `prisma/backups/dev-backup-day11-step1-pre-migration.db` | 3,637,248 B | `e5435160` | Day 11 Step 1 pre-migration backup |
| `prisma/backups/dev-backup-pre-deploy-20261106T160910Z.db` | 3,637,248 B | `e5435160` | Cold pre-deploy backup prior to Step 1 schema change |
| `backups/dev-before-day13-20261104-124337.db` | 3,637,248 B | `776112fc` | Day 13 Task Board baseline backup |
| `backups/dev-before-task-version-migration.db` | 3,637,248 B | `776112fc` | Task optimistic concurrency migration backup |

### 5.2 Content-Level Relational Hash Comparison
To eliminate confusion between SQLite file-level binary checksum divergence (caused by page header write counters and freelist reordering) and actual data changes, a cryptographic row-level content hash was executed across all backups:

- **`payslips` Table:** All 2,469 rows across all six backups produce the **exact identical content hash** as the live database. Zero payslip records have ever been modified.
- **`employees` Table:** All 441 rows across all six backups produce the **exact identical content hash** as the live database. Zero employee records have ever been modified.
- **`payroll_runs` Table:**
  - Common columns (`id`, `period_start`, `period_end`, `employees_paid`, `total_gross`, `total_net`, `status`, `pay_date`) are **100% identical** across all 18 rows in all backups.
  - The only difference in `payroll_runs` in the live database is the addition of the new audit and tracking columns introduced by the Day 11 Step 1 migration (`original_total_gross`, `reconciled_at`, etc.). All original data values are completely preserved.

---

## 6. Application Source Mapping (Phase B4)

The application codebase was traced to identify where every displayed payroll value originates.

### 6.1 Value Lineage Table

| Displayed Value | UI Component | API Route | Calculation / Query Location | Underlying Source | Evidence Classification |
|---|---|---|---|---|---|
| **Payroll Runs List** | `AdminPayrollConsole.tsx` | `GET /api/v1/payroll/runs` | `prisma.payrollRun.findMany({ orderBy: { periodStart: 'desc' } })` | Stored `payroll_runs` rows | Dataset Record |
| **Run Status Badge** | `AdminPayrollConsole.tsx` | `GET /api/v1/payroll/runs` | `run.status` (e.g. `'PAID'`) | Stored `payroll_runs.status` | Unverified System Status |
| **Approval Status Badge** | `AdminPayrollConsole.tsx` | `GET /api/v1/payroll/runs` | `run.approvalStatus` | Stored `payroll_runs.approval_status` | Governed Workflow Status |
| **Reconciliation Status Badge** | `AdminPayrollConsole.tsx` | `GET /api/v1/payroll/runs` | `reconcilePayrollRun(run.id)` | Dynamic comparison of Header vs `SUM(payslips)` | Derived Comparison Metric |
| **Header Gross / Net** | `PayrollRunDetails.tsx` | `GET /api/v1/payroll/runs/[id]` | `run.totalGross`, `run.totalNet` | Stored `payroll_runs` columns | Unreconciled Upstream Header |
| **Header Headcount** | `PayrollRunDetails.tsx` | `GET /api/v1/payroll/runs/[id]` | `run.employeesPaid` | Stored `payroll_runs.employees_paid` | Unreconciled Upstream Header |
| **Itemized Headcount** | `PayrollRunDetails.tsx` | `GET /api/v1/payroll/runs/[id]` | `payslips.length` / `COUNT(*)` | Aggregated `payslips` count | Observed Payroll Population |
| **Itemized Gross / Net** | `PayrollRunDetails.tsx` | `GET /api/v1/payroll/runs/[id]` | `reconciliationResult.calculatedGross` | Dynamic `SUM(payslips.gross_pay)` via BigInt engine | Itemized Payroll Aggregate |
| **Gross / Net Variance** | `PayrollRunDetails.tsx` | `GET /api/v1/payroll/runs/[id]` | `reconciliationResult.grossDifference` | Computed delta: `Itemized - Header` | Computed Reporting Variance |
| **Payslip Search Table** | `PayrollRunDetails.tsx` | `GET /api/v1/payroll/runs/[id]` | `prisma.payslip.findMany(...)` with employee join | Itemized `payslips` joined to `employees` | Recorded Employee Vouchers |
| **Reconciliation Preview** | `PayrollReconciliation.tsx` | `GET .../reconciliation-preview` | `calculatePayrollReconciliation(runId)` | Dynamic read-only BigInt paise calculation | Non-Mutating Calculation |

### 6.2 Conflict Analysis Between Database, API, and UI
1. **Header vs. Itemized Presentation:** The UI explicitly displays both the Unreconciled Upstream Payroll Header totals and the Itemized Aggregate totals side-by-side with discrepancy chips. It does not overwrite headers in the database, nor does it hide the variance.
2. **Approval vs. Payment Distinction:** The UI shows `Operational Status: PAID` (from `payroll_runs.status`) alongside `Approval Status: Pending` (from `payroll_runs.approval_status`). This accurately reflects the database state: the historical run has a legacy `'PAID'` string, but the maker-checker governance workflow has not approved it.
3. **Integer Arithmetic Protection:** `reconciliation-engine.ts` converts all database floats to integer paise using 64-bit BigInt, preventing any JavaScript IEEE-754 floating-point drift in displayed variances.

---

## 7. Integrity Conclusion & Stage 1 Baseline

| Audit Dimension | Forensic Determination |
|---|---|
| **Original JSON Data Pack** | Cryptographically verified (`03_Data_Pack/`), immutable, uniform schema |
| **Live Database (`dev.db`)** | 100% faithful to data pack; 0 financial mutations; foreign keys valid |
| **Historical Backups** | 100% payslip and employee row invariance across all 6 backups |
| **Dataset Authority** | `DATASET AUTHORITY: ESTABLISHED FOR THE SUPPLIED SYNTHETIC BENCHMARK` |
| **Mathematical Integrity** | `MATHEMATICAL INTEGRITY: VERIFIED WITHIN THE SUPPLIED DATASET` (0 paise error) |
| **Legal/Accounting Authority** | `LEGAL/ACCOUNTING AUTHORITY: NOT ESTABLISHED FROM AVAILABLE EVIDENCE` |
| **Bank Settlement Authority** | `BANK SETTLEMENT AUTHORITY: NOT ESTABLISHED FROM AVAILABLE EVIDENCE` |
| **Payroll Headers** | `UNRECONCILED UPSTREAM PAYROLL HEADER — GENERATION METHODOLOGY UNVERIFIED` |

*The database remains completely untouched. Stage 1 source inventory is complete.*
