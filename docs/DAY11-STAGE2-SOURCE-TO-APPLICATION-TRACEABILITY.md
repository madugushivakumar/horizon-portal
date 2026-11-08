# DAY 11 — STAGE 2: SOURCE-TO-APPLICATION TRACEABILITY
## End-to-End Architectural Traceability of Payroll Records from Raw JSON to User Interface

| Document Field | Value |
|---|---|
| **Project** | Aura Workforce by Growmar — Horizon Portal |
| **Phase / Task** | Phase 3 — Day 11: Admin Payroll Run Console |
| **Stage** | Stage 2 of 6 — Root-Cause Forensic Investigation |
| **Document Identifier** | `docs/DAY11-STAGE2-SOURCE-TO-APPLICATION-TRACEABILITY.md` |
| **Date** | November 7, 2026 |
| **Investigation Scope** | Comprehensive architectural mapping of payroll data lineage |

---

## 1. Architectural Overview & Data Pipeline

The payroll lifecycle in Horizon Portal flows through six distinct architectural layers:

```text
Layer 1: Upstream Benchmark Storage (03_Data_Pack/)
                      |
                      v
Layer 2: Database Ingestion & Seeding (prisma/seed.ts)
                      |
                      v
Layer 3: Relational Persistence (prisma/dev.db via SQLite)
                      |
                      v
Layer 4: Calculation & Reconciliation Engine (src/lib/payroll/)
                      |
                      v
Layer 5: Server-Side API Handlers (src/app/api/v1/payroll/)
                      |
                      v
Layer 6: React UI Presentation (src/components/payroll/)
```

---

## 2. Layer-by-Layer Detailed Forensic Traceability

### Layer 1: Raw JSON Benchmark Data (`03_Data_Pack/`)
- **`03_Data_Pack/payroll_runs.json` (4,062 bytes, SHA-256: `d501c1c70b...`):**
  - Contains 18 JSON objects representing monthly payroll runs (`PR-2025-04` through `PR-2026-09`).
  - Fields: `run_id`, `period_start`, `period_end`, `pay_date`, `employees_paid`, `total_gross`, `total_net`, `status`.
  - Headers contain pre-seeded numbers where `employees_paid`, `total_gross`, and `total_net` exceed itemized payslip totals.
- **`03_Data_Pack/payslips.json` (1,432,529 bytes, SHA-256: `9e6f7649e9...`):**
  - Contains 2,469 JSON objects covering the six runs `PR-2026-04` through `PR-2026-09`.
  - Fields: `payroll_item_id`, `run_id`, `employee_id`, earnings components (`basic`..`variable_pay`), deductions components (`pf`..`other_deductions`), `gross_pay`, `total_deductions`, `net_pay`.
  - Line-item arithmetic satisfies $\text{Gross} - \text{Deductions} \equiv \text{Net}$ in 100% of rows.
- **`03_Data_Pack/employees.json` (138,418 bytes, SHA-256: `ab0d227444...`):**
  - Contains 441 employee master records with effective hire dates ranging from 2012-01-31 to 2026-09-28.

### Layer 2: Database Ingestion & Seeding (`prisma/seed.ts`)
- **File Reference:** `prisma/seed.ts`
- **Function:** `seedDataPack()`
- **Payroll Runs Seeding (Lines 348–392):**
  ```typescript
  const rawPayrollRuns = loadJson<RawPayrollRun[]>("payroll_runs.json");
  for (const pr of rawPayrollRuns) {
    await prisma.payrollRun.upsert({
      where: { id: pr.run_id },
      update: {
        periodStart: new Date(pr.period_start),
        periodEnd: new Date(pr.period_end),
        paymentDate: pr.pay_date ? new Date(pr.pay_date) : null,
        payDate: pr.pay_date ? new Date(pr.pay_date) : null,
        employeesPaid: pr.employees_paid,
        totalGross: pr.total_gross,
        totalNet: pr.total_net,
        status: pr.status,
      },
      create: { ... }
    });
  }
  ```
  *Audit Verification:* Direct 1-to-1 field mapping. Zero arithmetic operations or filtering.
- **Payslips Seeding (Lines 394–458):**
  ```typescript
  const rawPayslips = loadJson<RawPayslip[]>("payslips.json");
  const payslipChunks = chunkArray(rawPayslips, 300);
  for (const chunk of payslipChunks) {
    await prisma.payslip.createMany({
      data: chunk.map((p) => ({
        id: p.payroll_item_id,
        payrollRunId: p.run_id,
        employeeId: p.employee_id,
        grossPay: p.gross_pay,
        totalDeductions: p.total_deductions,
        netPay: p.net_pay,
        ...
      }))
    });
  }
  ```
  *Audit Verification:* Direct batch insert into SQLite. Zero records dropped.

### Layer 3: Relational Persistence (`prisma/dev.db`)
- **Table `payroll_runs` (18 rows):**
  - Primary Key: `id` (e.g. `'PR-2026-08'`).
  - Holds stored header values (`employees_paid`, `total_gross`, `total_net`, `status`, `approval_status`).
- **Table `payslips` (2,469 rows):**
  - Primary Key: `id`. Foreign Keys: `payroll_run_id` -> `payroll_runs(id)`, `employee_id` -> `employees(id)`.
  - Holds itemized vouchers.
- **Table `payroll_adjustments` (0 rows):**
  - Empty table dedicated to authorized double-entry adjustments post-Gate 1.

### Layer 4: Calculation & Reconciliation Engine (`src/lib/payroll/`)
- **File Reference:** `src/lib/payroll/reconciliation-engine.ts`
- **Function:** `calculatePayrollReconciliation(runId: string)`
  - Reads stored header: `prisma.payrollRun.findUnique({ where: { id: runId } })`.
  - Reads itemized payslips: `prisma.payslip.findMany({ where: { payrollRunId: runId } })`.
  - Converts all values to 64-bit BigInt integer paise:
    ```typescript
    const paise = BigInt(Math.round(amount * 100));
    assertSqliteInt64(paise);
    ```
  - Calculates exact sums:
    $$\text{calculatedGrossPaise} = \sum \text{payslip.grossPayPaise}$$
    $$\text{calculatedDeductionsPaise} = \sum \text{payslip.totalDeductionsPaise}$$
    $$\text{calculatedNetPaise} = \sum \text{payslip.netPayPaise}$$
  - Computes exact variances:
    $$\text{grossVariancePaise} = \text{calculatedGrossPaise} - \text{storedGrossPaise}$$
    $$\text{netVariancePaise} = \text{calculatedNetPaise} - \text{storedNetPaise}$$
  - Enforces invariant: $\text{calculatedGrossPaise} - \text{calculatedDeductionsPaise} \equiv \text{calculatedNetPaise}$.

### Layer 5: Server-Side API Handlers (`src/app/api/v1/payroll/`)
- **Endpoint 1:** `GET /api/v1/payroll/runs` (`src/app/api/v1/payroll/runs/route.ts`)
  - Authenticates via JWT cookie (`SESSION_COOKIE_NAME`).
  - Enforces RBAC: Only `ADMIN` and `HR` roles permitted (HTTP 403 for others).
  - Queries all 18 runs ordered by `periodStart desc`.
  - Runs dynamic reconciliation badge check on each run:
    If `itemizedCount !== employeesPaid` or variances $\ne 0$, returns `reconciliationStatus = "MISMATCH"`.
- **Endpoint 2:** `GET /api/v1/payroll/runs/[runId]` (`src/app/api/v1/payroll/runs/[runId]/route.ts`)
  - Returns detailed header records, Month-over-Month metrics, and paginated payslips.
- **Endpoint 3:** `GET /api/v1/payroll/runs/[runId]/reconciliation-preview`
  - Read-only preview endpoint returning exact BigInt paise serialization without database mutation.

### Layer 6: React UI Presentation (`src/components/payroll/`)
- **Component 1:** `AdminPayrollConsole.tsx` (`src/components/payroll/AdminPayrollConsole.tsx`)
  - Renders master payroll run table with status chips:
    - Operational Status: `PAID` / `POSTED - PAYMENT PENDING`
    - Approval Status: `Pending`
    - Reconciliation Status: `MISMATCH` (red badge for all 6 target runs)
- **Component 2:** `PayrollRunDetails.tsx` (`src/components/payroll/PayrollRunDetails.tsx`)
  - Renders Dual Presentation:
    - **Stored Header Block:** Shows `employeesPaid`, `totalGross`, `totalNet`.
    - **Reconciled Itemized Block:** Shows `payslipCount`, `calculatedGross`, `calculatedNet`.
    - **Variance Callout:** Highlights discrepancies with exact difference amounts.
    - **Payslip Search Table:** Allows filtering by employee name, ID, and department.

---

## 3. Discrepancy Invariant Analysis Across Layers

| Verification Test | Observation | Conclusion |
|---|---|---|
| Did the seed script alter values? | Raw JSON values $\equiv$ SQLite table values in 100% of rows. | **No transformation artifact.** |
| Did the database drop payslips? | 2,469 payslips in JSON $\equiv$ 2,469 payslips in SQLite. | **Zero missing rows.** |
| Did the API filter out records? | API queries `where: { payrollRunId: runId }` without extra filters. | **No API query defects.** |
| Did the UI misrepresent sums? | UI displays both stored headers and calculated sums accurately. | **No UI distortion.** |

---

## 4. Architectural Finding

The Horizon Portal application architecture is **100% faithful** to the underlying data stores. It does not introduce, exacerbate, or conceal discrepancies. The header-to-payslip mismatches originate entirely in the upstream benchmark JSON files (`03_Data_Pack/`).

