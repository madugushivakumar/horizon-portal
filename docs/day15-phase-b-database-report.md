# Day 15 — Phase B: Existing Database Verification & Safe Backup Report
## AI Insights Panel for HR Advanced — Aura Workforce by Growmar (Horizon Portal)

**Document Status:** Complete & Verified
**Phase:** Phase B — Existing Database Verification & Safe Backup
**Execution Timestamp:** 2026-11-05T18:35:00+05:30
**Base Commit:** `807fab1dfc8abbd5b406e5ed1aec7fcf6c5c9524` (Branch: `main`)

---

## 1. Executive Summary & Objective

In accordance with Phase B instructions, the existing database environment was comprehensively audited and secured prior to backend API or UI development. Both `AiAttritionRisk` and `AiAnomalyResult` models already exist in the database with their complete initial datasets.

### Core Discoveries & Confirmations
- **Zero Schema Mutations Needed:** `prisma/schema.prisma` already defines both models with exact field matching.
- **Zero Migrations Required:** No new database migrations or schema alter scripts were generated or applied.
- **100% Operational Data Preserved:** All 441 employees, 11 departments, 4,844 tasks, 38 sprints, 16 teams, 18 payroll runs, and 2,469 payslips remain 100% intact with 0 foreign-key violations.
- **Safe Atomic Backup Created:** A transactionally consistent, isolated SQLite backup was created via `VACUUM INTO` and verified to pass `PRAGMA integrity_check`.
- **Zero Seed Execution:** `prisma/seed.ts` contains 15 destructive `deleteMany` calls and was strictly **not executed**.

---

## 2. Pre-Flight Backup & Database Integrity Verification

### 2.1. Primary Database Metrics
- **Location:** `prisma/dev.db`
- **File Size:** 3.47 MB (3,637,248 bytes)
- **Status:** Online, active development database.

### 2.2. Transaction-Safe Backup Creation
To avoid reader/writer locks or incomplete page copies, SQLite's transactional `VACUUM INTO` mechanism was executed:
```sql
VACUUM INTO 'C:/Users/Madugu Shiva Kumar/OneDrive/图片/Desktop/horizon-portal/prisma/backups/dev-backup-2026-11-05T13-03-26-829Z.db';
```
- **Backup File Location:** `prisma/backups/dev-backup-2026-11-05T13-03-26-829Z.db`
- **Backup Size:** 3.18 MB (3,334,144 bytes) (compacted transactional snapshot).
- **Creation Timestamp:** `2026-11-05T13:03:26.829Z`

### 2.3. SQLite PRAGMA Verification
1. **Primary Database Integrity:**
   ```sql
   PRAGMA integrity_check;
   ```
   **Result:** `[ { integrity_check: 'ok' } ]` (0 corrupt pages).
2. **Backup Database Integrity (via ATTACH):**
   ```sql
   ATTACH DATABASE 'prisma/backups/dev-backup-2026-11-05T13-03-26-829Z.db' AS backup_db;
   PRAGMA backup_db.integrity_check;
   DETACH DATABASE backup_db;
   ```
   **Result:** `[ { integrity_check: 'ok' } ]` (Verified transactionally consistent and detached).
3. **Foreign Key Integrity Check:**
   ```sql
   PRAGMA foreign_key_check;
   ```
   **Result:** `0 violations` across all operational and AI tables.

---

## 3. Operational Data Preservation Audit (Days 1–14)

All operational entities created and verified in Days 1 through 14 were queried via Prisma to verify zero data loss:

| Model / Entity | Target Table | Expected Count | Current DB Count | Status | Notes |
|---|---|---:|---:|:---:|---|
| **Employees** | `employees` | 441 | 441 | **PASS** | Full active workforce preserved. |
| **Departments** | `departments` | 11 | 11 | **PASS** | `D00` through `D10` intact. |
| **Teams** | `teams` | 16 | 16 | **PASS** | All engineering & ops teams intact. |
| **Sprints** | `sprints` | 38 | 38 | **PASS** | Historical & active sprints preserved. |
| **Tasks** | `tasks` | 4,844 | 4,844 | **PASS** | Day 13 Kanban board data preserved with version concurrency. |
| **Payroll Runs** | `payroll_runs` | 18 | 18 | **PASS** | 18 monthly periods (`PR-2025-04` through `PR-2026-09`). |
| **Payslips** | `payslips` | 2,469 | 2,469 | **PASS** | Individual compensation statements intact. |
| **Leave Balances** | `leave_balances` | 441 | 441 | **PASS** | Annual leave balances intact. |
| **Leave Requests** | `leave_requests` | 2,183 | 2,183 | **PASS** | Historical time-off requests intact. |
| **Holidays** | `holidays` | 19 | 19 | **PASS** | Official company holidays intact. |

---

## 4. AI Datasets & Models Inspection

### 4.1. Schema Alignment Verification
The existing schema models in `prisma/schema.prisma` (lines 596–645) were compared field-by-field against `03_Data_Pack/ai_attrition_risk.json` and `03_Data_Pack/ai_anomaly_results.json`:

1. **`AiAttritionRisk` (`prisma/schema.prisma` lines 622–645):**
   - Matches all 11 JSON attributes: `id` (`prediction_id`), `employeeId`, `departmentId`, `asOfDate`, `riskScore12m`, `riskBand`, `topReason1`, `topReason2`, `topReason3`, `modelVersion`, `modelNote`.
   - Foreign key relations: `@relation(fields: [employeeId], references: [id])` and `@relation(fields: [departmentId], references: [id])`.
   - Database table: `ai_attrition_risk` contains exactly **430 records**.
2. **`AiAnomalyResult` (`prisma/schema.prisma` lines 596–616):**
   - Matches all 12 JSON attributes: `id` (`result_id`), `sourceDataset`, `recordId`, `employeeId`, `period`, `anomalyScore`, `flagged`, `reasonCode`, `reasonText`, `moneyAtRisk`, `modelVersion`, `scoredAt`.
   - Indexing: `@@index([employeeId])`, `@@index([sourceDataset])`.
   - Database table: `ai_anomaly_results` contains exactly **405 records**.

### 4.2. Confirmation: No Schema Changes or Migrations Required
Both models are already synthesized, indexed, and migrated. Running `npx prisma migrate dev` or creating dummy migrations is completely unnecessary and would introduce risk to `migration_lock.toml`.

---

## 5. Attrition Risk Data Reconciliation & Referential Integrity

### 5.1. Record Count & Risk Band Reconciliation
A complete query over all 430 attrition records in `ai_attrition_risk` confirmed:
- **Total Records:** Exactly **430 records** (100% reconciliation).
- **Risk Band Breakdown:**
  - **High:** **43 records** (10.0%) — Continuous scores `0.286` to `0.486`.
  - **Medium:** **86 records** (20.0%) — Continuous scores `0.180` to `0.285`.
  - **Low:** **301 records** (70.0%) — Continuous scores `0.010` to `0.179`.
  - **Other / Invalid:** **0 records**.
  - *Reconciliation Formula:* $43 + 86 + 301 = 430$ (Exact match with model note: *"Bands: High = top 10%, Medium = next 20%"*).

### 5.2. Referential Integrity & Relationship Audit
- **Employee Reference (`employee_id`):**
  - Missing or orphan employee references: **0**.
  - All 430 records reference valid, active employees in the `Employee` table.
- **Department Reference (`department_id`):**
  - Missing department references: **0**.
  - All 430 records reference valid departments (`D01` through `D10`).
- **Department Consistency:**
  - Evaluated `record.departmentId === employee.departmentId` across all 430 records.
  - Result: **0 discrepancies** (100% consistent).

---

## 6. Anomaly Results Reconciliation & Referential Analysis

### 6.1. Matched vs. Unmatched Records
- **Total Anomaly Records:** Exactly **405 records**.
- **Matched Active Employees:** **355 records** (87.7%) match active employees in `Employee` table across 192 distinct individuals.
- **Unmatched Employee References:** **50 records** (12.3%) reference 33 unique employee IDs that are historical or former employees:
  - Sample unmatched IDs: `EMP-0356`, `EMP-0460`, `EMP-0630`, `EMP-0578`, `EMP-0388`, `EMP-0561`, `EMP-0274`, `EMP-0452`, `EMP-0614`, `EMP-0598`.
  - **Dataset Distribution of Unmatched:**
    - Attendance anomalies: 32 records.
    - Payroll anomalies: 18 records.
- **Architectural Validation:**
  - Because `AiAnomalyResult` was intentionally designed without a hard foreign-key constraint `@relation`, these 50 historical records persist safely without database integrity violations.
  - **Policy for Phase C/D:** In queries, matched records join with `Employee` and inherit their department. Unmatched records will be mapped to `"Unassigned / Former"` and preserved without modification.

---

## 7. Financial Reconciliation & Double-Counting Assessment

### 7.1. Null vs. Zero Preservation
A critical requirement is ensuring `null` is preserved as distinct from `0.00`:
- **Attendance Anomalies (`attendance_monthly_features`):** Exactly **221 records** have `moneyAtRisk === null`.
  - Attendance anomalies represent behavioral attendance shifts, not direct payroll ledger discrepancies.
  - Zero attendance records have a numeric value.
- **Payroll Anomalies (`payroll_monthly_features`):** Exactly **184 records** have a numeric value for `moneyAtRisk`:
  - **Zero Money at Risk (`moneyAtRisk === 0`):** Exactly **6 records** (All 6 are `STATISTICAL_OUTLIER`: *"Unusual combination of pay ratios versus all other payslips"*).
  - **Positive Money at Risk (`moneyAtRisk > 0`):** Exactly **178 records**.
  - Zero payroll records have `moneyAtRisk === null`.
- **Integrity Result:** $221\text{ (null)} + 6\text{ (zero)} + 178\text{ (positive)} = 405\text{ total records}$. The distinction between non-monetary (`null`) and zero-variance (`0`) is 100% verified.

### 7.2. Decimal-Safe Recalculation
To eliminate IEEE-754 floating-point rounding errors, the sum of all 184 payroll anomalies was calculated using integer paise arithmetic:
$$\text{paise} = \sum \text{round}(v \times 100)$$

```ts
let totalPaise = 0n;
for (const a of anomalyRecords) {
  if (a.moneyAtRisk !== null) {
    totalPaise += BigInt(Math.round(a.moneyAtRisk * 100));
  }
}
const totalRupees = Number(totalPaise) / 100;
```
- **Total Calculated Paise:** `3,142,123,907n`
- **Total Calculated Amount:** **₹31,421,239.07 INR**
- **Reported Target:** **₹31,421,239.07 INR**
- **Discrepancy:** **₹0.00** (Exact reconciliation to the paisa).

### 7.3. Double-Counting Risk Assessment
We evaluated whether summing all 184 payroll anomaly records risks double-counting:
1. **Uniqueness Audit:**
   - Evaluated `(employee_id, period)` pairs across all 184 payroll records.
   - Result: Exactly **184 unique pairs** (0 duplicate records for the same employee in the same month).
   - Each anomaly points to a distinct monthly payslip record (`recordId: PI-XXXXXX`).
2. **Temporal Distribution Assessment:**
   - The 184 records span **18 calendar months** (April 2025 to September 2026), averaging ~10 anomalies per month.
3. **Core Conclusion & UI Recommendation:**
   - Each individual record represents an independent monthly line item. Summing them across the entire dataset does **not** double-count individual payslips.
   - **However**, the ₹31.42M INR figure is a **cumulative 18-month historical total**, **not** a single-month active payroll deficit.
   - In Phase C and Phase D, the UI and API will clearly label this metric as **"Cumulative Money at Risk (18-Month Horizon)"** and provide department-scoped totals to prevent executive misinterpretation.

---

## 8. Status Semantics Audit: `flagged = "Y"`

- **Distribution:** All 405 anomaly records have `flagged: "Y"`.
- **Model Pipeline Meaning:** In the isolation forest data pipeline, `flagged = "Y"` denotes that the anomaly score exceeded the classification threshold and was **flagged by the model for human review**.
- **Human Review Meaning:** It does **not** signify that an HR or Finance specialist has completed human review.
- **Governance Invariant:** No review workflow statuses (such as "Reviewed", "Resolved", "Dismissed", or "Confirmed Fraud") exist in the underlying data pack. We will **not invent speculative review statuses**. In the UI, this badge will be clearly labeled:
  > **`Flagged for Review`**

---

## 9. Seed Script Destructive Risk Analysis

An audit of `prisma/seed.ts` revealed that it was designed as an initial full-import seed rather than an incremental seed:

```ts
// Lines 72-97 in prisma/seed.ts:
await prisma.user.updateMany({ ... });
await prisma.employee.deleteMany({ ... });
await prisma.role.deleteMany({ ... });
await prisma.department.deleteMany({ ... });
await prisma.aiAttritionRisk.deleteMany();
await prisma.aiAnomalyResult.deleteMany();
await prisma.expense.deleteMany();
await prisma.invoice.deleteMany();
await prisma.task.deleteMany();
await prisma.attendanceMonthly.deleteMany();
await prisma.leaveRequest.deleteMany();
await prisma.leaveBalance.deleteMany();
await prisma.payslip.deleteMany();
await prisma.sprint.deleteMany();
await prisma.team.deleteMany();
```
- **Hazard:** Running `npm run db:seed` or `prisma db seed` would wipe out the entire database, deleting all 4,844 tasks, 38 sprints, and operational records created in Days 13 and 14.
- **Safety Directive:** `prisma/seed.ts` **must never be run**. The database is already fully populated, consistent, and backed up.

---

## 10. Quality Gates & Phase B Verification Summary

| Verification Step | Command / Query | Expected Result | Actual Result | Status |
|---|---|---|---|:---:|
| **Prisma Schema Validation** | `npx prisma validate` | Valid schema | Valid schema 🚀 | **PASS** |
| **TypeScript Compilation** | `npx tsc --noEmit` | Exit code 0 | Exit code 0 (0 errors) | **PASS** |
| **SQLite Integrity Check** | `PRAGMA integrity_check;` | `ok` | `ok` | **PASS** |
| **Foreign Key Check** | `PRAGMA foreign_key_check;` | 0 violations | 0 violations | **PASS** |
| **Backup Integrity Check** | `PRAGMA backup_db.integrity_check;` | `ok` | `ok` | **PASS** |
| **Attrition Record Count** | `prisma.aiAttritionRisk.count()` | 430 | 430 | **PASS** |
| **Anomaly Record Count** | `prisma.aiAnomalyResult.count()` | 405 | 405 | **PASS** |
| **Risk Band Reconciliation** | Low (301), Med (86), High (43) | 301 / 86 / 43 | 301 / 86 / 43 | **PASS** |
| **Decimal Exposure Recalculation** | Integer paise sum / 100 | ₹31,421,239.07 | ₹31,421,239.07 | **PASS** |
| **Null vs Zero Preservation** | 221 null, 6 zero, 178 positive | 221 / 6 / 178 | 221 / 6 / 178 | **PASS** |

---

## 11. Approval Checkpoint & Next Steps

```
================================================================================
                    PHASE B CHECKPOINT — DATABASE VERIFIED
================================================================================
 Status:
   - Consistent, atomic SQLite backup created at:
     prisma/backups/dev-backup-2026-11-05T13-03-26-829Z.db
   - Both AI models verified in Prisma & SQLite (430 attrition, 405 anomaly records).
   - Zero schema modifications or migrations required.
   - All operational records (4,844 tasks, 38 sprints, 441 employees) preserved.
   - PRAGMA integrity_check and foreign_key_check: 100% clean.
   - Financial exposure verified to the paisa (₹31,421,239.07 INR).
   - STOPPED: No API routes, UI components, or navigation changes executed.
================================================================================
```

*Standing by for explicit user approval of Phase B before beginning Phase C (Backend, Aggregation & API Implementation).*
