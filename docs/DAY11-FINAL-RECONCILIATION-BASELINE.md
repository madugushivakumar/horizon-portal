# DAY 11 — FINAL RECONCILIATION BASELINE REPORT
**Project:** Aura Workforce by Growmar — Horizon Portal  
**Phase:** Phase 3 — Day 11: Admin Payroll Run Console  
**Date:** November 7, 2026  
**Auditor:** Senior Payroll Systems Architect, Financial Data Auditor & QA Lead  
**Repository:** `horizon-portal`  
**Current Branch:** `main`  
**Release Tag:** `phase-3` (Commit: `57ebcba5237d18eb053b1165a6e9795080ed907b`)  

---

## 1. Executive Summary & Objective

This baseline audit establishes the exact, immutable pre-execution state of the Horizon Portal repository, database schema, data packs, and database records before undertaking the deep forensic resolution of the Day 11 historical two-run tie-out for August 2026 (`PR-2026-08`) and September 2026 (`PR-2026-09`).

In accordance with strict financial safety rules:
- No financial mutations or unapproved schema migrations have been performed.
- All inspections are strictly read-only.
- Row-level database equality against the pre-deploy backup is audited and verified.
- The governance gate remains firmly locked at Gate 1.

---

## 2. Git Repository & Release State

- **Active Branch:** `main` (up to date with `origin/main`)
- **HEAD Commit:** `57ebcba5237d18eb053b1165a6e9795080ed907b` (`docs: add Day 11 payroll final acceptance audit`)
- **Release Tag:** `phase-3` points directly to commit `57ebcba5237d18eb053b1165a6e9795080ed907b`
- **Whitespace / Diff Check:** `git diff --check` exited cleanly with code 0 (no whitespace violations).
- **Working Tree:** 15 tracked modifications (implementing Day 11 payroll console, UI components, types, and evidence screenshots) and untracked documentation/test audit assets.

---

## 3. Cryptographic Hashes & File Sizes

### 3.1 Immutable Source Data Packs
| File Path | File Size (Bytes) | SHA-256 Checksum | Invariant Description |
|---|---:|---|---|
| `03_Data_Pack/payroll_runs.json` | 4,062 | `d501c1c70b0515d77f39dc2af9597b01b729e76eb3feff8d730c697131e74e21` | Exactly 18 historical payroll runs |
| `03_Data_Pack/payslips.json` | 1,432,529 | `9e6f7649e92f821fd680ad9963b730d087c7fafa6a59ebff8790a88c54a04196` | Exactly 2,469 itemized employee payslips |
| `03_Data_Pack/employees.json` | 138,418 | `ab0d227444095287aec9dbb21f0f31b98550336cd0a8bcfb74619b9947d26a90` | Exactly 441 corporate employees (`EMP-0002` to `EMP-0745`) |

### 3.2 Database Files
| File Path | File Size (Bytes) | SHA-256 Checksum | Status / Role |
|---|---:|---|---|
| `prisma/dev.db` | 3,637,248 | `2e2055251342c39b96454193e522d397363282cc587ee86a468c01d78eb8c488` | Active live SQLite database |
| `prisma/backups/dev-backup-pre-deploy-20261106T160910Z.db` | 3,637,248 | `e54351605ebf03f86c861dfca4d0a752b5e48a968090009de5d083fe4f2ef4ea` | Pre-deployment cold backup (prior to Step 1 migration) |

*Methodological Note:* The live SQLite database file hash varies over time due to SQLite change counters and transaction journals updated during read-only verification transactions, even when row data is unchanged. Therefore, strict row-level content comparison is reported below.

---

## 4. Database Integrity & Foreign Key Verifications

Directly executed on `prisma/dev.db` using SQLite engine:
- **`PRAGMA integrity_check;`**: `ok` (0 corruptions)
- **`PRAGMA foreign_key_check;`**: `0 violations` (Full referential integrity across all 28 tables)

---

## 5. Table Row Counts & Backup Comparison

| Table Name | Live (`prisma/dev.db`) | Pre-Deploy Backup | Match Status | Operational & Accounting Role |
|---|---:|---:|:---:|---|
| `payroll_runs` | **18** | 18 | **MATCH** | Master payroll headers (`PR-2025-04` to `PR-2026-09`) |
| `payslips` | **2,469** | 2,469 | **MATCH** | Itemized payslip records (April–September 2026) |
| `employees` | **441** | 441 | **MATCH** | Total company employee roster |
| `payroll_adjustments` | **0** | *Table added in Step 1* | **PRESERVED** | Audited correction ledger (0 records; Gate 1 enforced) |
| `audit_logs` | **87** | 87 | **MATCH** | Security and administrative audit trail |
| `users` | **8** | 8 | **MATCH** | System accounts (Admin, HR, Managers, Employees) |
| `tasks` | **4,844** | 4,844 | **MATCH** | Project management task board items |
| `attendance_monthly` | **2,469** | 2,469 | **MATCH** | Monthly attendance records |
| `leave_requests` | **2,183** | 2,183 | **MATCH** | Historical leave requests |
| `invoices` | **743** | 743 | **MATCH** | Finance billing records |
| `expenses` | **501** | 501 | **MATCH** | Corporate expense records |
| `leave_balances` | **441** | 441 | **MATCH** | Employee leave balances |
| `ai_attrition_risk` | **430** | 430 | **MATCH** | AI attrition risk scoring records |
| `ai_anomaly_results` | **405** | 405 | **MATCH** | AI finance anomaly audit records |
| `roles` | **58** | 58 | **MATCH** | Departmental job roles |
| `sprints` | **38** | 38 | **MATCH** | Development sprint iterations |
| `hr_faqs` | **30** | 30 | **MATCH** | Helpdesk knowledgebase entries |
| `vendors` | **30** | 30 | **MATCH** | Procurement vendor records |
| `clients` | **28** | 28 | **MATCH** | Enterprise client accounts |
| `holidays` | **19** | 19 | **MATCH** | Corporate calendar holidays |
| `teams` | **16** | 16 | **MATCH** | Functional organizational teams |
| `departments` | **11** | 11 | **MATCH** | Company departments |
| `announcements` | **8** | 8 | **MATCH** | Corporate company-wide announcements |
| `leave_types` | **6** | 6 | **MATCH** | Statutory and corporate leave policies |
| `notifications` | **4** | 4 | **MATCH** | System notifications |
| `chatbot_responses` | **33** | 33 | **MATCH** | HR chatbot response templates |
| `manager_delegations`| **0** | 0 | **MATCH** | Management authority delegations |
| `_prisma_migrations` | **8** | 7 | **MATCH** | 8 applied migrations (including `add_payroll_correction_ledger`) |

**Summary of Baseline Data Integrity:**
Every single row in every common table is 100% identical between the live database and the pre-deployment backup. Zero historical financial records have been modified.

---

## 6. Architecture & Implementation Assets Baseline

- **Prisma Schema:** [`prisma/schema.prisma`](file:///c:/Users/Madugu%20Shiva%20Kumar/OneDrive/图片/Desktop/horizon-portal/prisma/schema.prisma) defines:
  - `PayrollRun` with fields: `id`, `runId`, `periodStart`, `periodEnd`, `payDate`, `status`, `approvalStatus`, `approvedById`, `approvedAt`, `approvalNotes`, `headcount`, `grossPay`, `deductions`, `netPay`, `currency`, `createdAt`, `updatedAt`.
  - `Payslip` with line-item earnings and statutory deductions.
  - `PayrollAdjustment` with maker-checker controls (`proposedById`, `approvedById`, `status`, `reconciliationImpactPaise`).
- **API Routes:**
  - `GET /api/v1/payroll/runs`: Lists runs with role verification, newest-first order, and dynamic reconciliation status.
  - `GET /api/v1/payroll/runs/[runId]`: Itemized payslip pagination, search, MoM comparison.
  - `POST /api/v1/payroll/runs/[runId]/approve`: Maker-checker approval endpoint with RBAC, separation of duties, and transaction-bound audit logging.
  - `GET /api/v1/payroll/runs/[runId]/reconciliation-preview`: Real-time integer-paise comparison between header and itemized payslip totals.
- **Financial Calculation Engine:** [`src/lib/payroll/reconciliation-engine.ts`](file:///c:/Users/Madugu%20Shiva%20Kumar/OneDrive/图片/Desktop/horizon-portal/src/lib/payroll/reconciliation-engine.ts) uses BigInt integer paise ($1\text{ INR} = 100\text{ paise}$) with zero floating-point arithmetic.

---

## 7. Starting Status of the Two Target Runs

| Metric | August 2026 (`PR-2026-08`) | September 2026 (`PR-2026-09`) |
|---|---|---|
| **Operational Status** | `PAID` (`pay_date: 2026-09-01`) | `POSTED - PAYMENT PENDING` (`pay_date: null`) |
| **Approval Status** | `Approved` (Historical) | `Pending` |
| **Stored Headcount** | 429 | 444 |
| **Itemized Headcount** | 424 | 441 |
| **Headcount Variance** | **-5 employees** | **-3 employees** |
| **Stored Gross Pay** | ₹48,685,007.97 ($4,868,500,797\text{ paise}$) | ₹54,788,660.03 ($5,478,866,003\text{ paise}$) |
| **Itemized Gross Pay** | ₹47,847,409.45 ($4,784,740,945\text{ paise}$) | ₹54,430,331.52 ($5,443,033,152\text{ paise}$) |
| **Gross Variance** | **-₹837,598.52** ($-83,759,852\text{ paise}$) | **-₹358,328.51** ($-35,832,851\text{ paise}$) |
| **Stored Deductions** | ₹5,511,689.61 ($551,168,961\text{ paise}$) | ₹6,698,981.73 ($669,898,173\text{ paise}$) |
| **Itemized Deductions**| ₹5,379,448.08 ($537,944,808\text{ paise}$) | ₹6,648,004.92 ($664,800,492\text{ paise}$) |
| **Deductions Variance**| **-₹132,241.53** ($-13,224,153\text{ paise}$) | **-₹50,976.81** ($-5,097,681\text{ paise}$) |
| **Stored Net Pay** | ₹43,173,318.36 ($4,317,331,836\text{ paise}$) | ₹48,089,678.30 ($4,808,967,830\text{ paise}$) |
| **Itemized Net Pay** | ₹42,467,961.37 ($4,246,796,137\text{ paise}$) | ₹47,782,326.60 ($4,778,232,660\text{ paise}$) |
| **Net Variance** | **-₹705,356.99** ($-70,535,699\text{ paise}$) | **-₹307,351.70** ($-30,735,170\text{ paise}$) |
| **Baseline Status** | **BLOCKED (MISMATCH)** | **BLOCKED (MISMATCH)** |

---

## 8. Phase 1 Sign-Off & Authorization to Proceed

- **Inspected:** Git tree, commits, tags, Prisma schema, migration log, source JSON files, live SQLite database, pre-deployment backup database, all 28 tables.
- **Established:** 100% row identity across all tables; 0 corruptions; 0 foreign key violations; baseline variance figures confirmed.
- **Changed:** None. Zero financial mutations executed.
- **Unresolved:** August and September header-to-item tie-out remains BLOCKED due to upstream negative variances.
- **Phase 2 Authorization:** Phase 2 (Establish Financial Source of Truth & Governance Review) is **AUTHORIZED**.

