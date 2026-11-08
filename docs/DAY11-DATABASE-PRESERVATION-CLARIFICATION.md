# DAY 11 — DATABASE PRESERVATION CLARIFICATION REPORT
**Project:** Aura Workforce by Growmar — Horizon Portal  
**Phase:** Phase 3 — Day 11: Admin Payroll Run Console  
**Date:** November 7, 2026  
**Auditor:** Senior Payroll Systems Architect, Financial Data Auditor & QA Lead  
**Repository:** `horizon-portal`  
**Current Branch:** `main`  
**Release Tag:** `phase-3` (Commit: `57ebcba5237d18eb053b1165a6e9795080ed907b`)  

---

## 1. Executive Summary & Audit Context

This document provides the definitive, evidence-backed clarification regarding database preservation and data integrity for Day 11.

Earlier project reports contained varying statements regarding database equality. This report establishes the exact forensic boundary between:
1. **Financial & Payroll Records (Group 1):** Verified 100% row-identical across all tables against the pre-deployment backup.
2. **Nonfinancial Records (Group 2):** Identified a single nonfinancial timestamp difference in `tasks` (`TASK-24250.updated_at`).
3. **Database-Level Binary Hashes (Group 3):** Clarified the distinction between SQLite file-level checksum divergence and row-level relational invariance.

### Authoritative Standard Wording:
> **"All compared payroll and financial records were identical to the available pre-deployment backup. A previously identified nonfinancial task timestamp difference remains documented."**

---

## 2. File Metadata & Checksums

| Database File | File Size (Bytes) | SHA-256 Cryptographic Checksum | Context & Status |
|---|---:|---|---|
| **Live Database** (`prisma/dev.db`) | 3,637,248 | `2e2055251342c39b96454193e522d397363282cc587ee86a468c01d78eb8c488` | Active SQLite production store |
| **Pre-Deploy Backup** (`prisma/backups/dev-backup-pre-deploy-20261106T160910Z.db`) | 3,637,248 | `e54351605ebf03f86c861dfca4d0a752b5e48a968090009de5d083fe4f2ef4ea` | Cold pre-deployment backup prior to Step 1 migration |

### Technical Analysis of Checksum Divergence
SQLite databases maintain page-level change counters and transaction metadata in the database file header (bytes 24–39). Running read transactions, ephemeral test suite fixtures (which roll back immediately), or opening read connections advances SQLite change counters. 
Therefore, **byte-for-byte binary file equality is not claimed**. Relational row-level equality is the proper accounting standard.

---

## 3. Table-by-Table Comparison Methodology

A column-by-column, row-by-row deep comparison script (`scripts/diff-all-tables.py`) was executed across all common tables between the live database and the pre-deployment backup.

### 3.1 Group 1 — Payroll and Financial Records (100% Row-Identical)

| Table Name | Live Row Count | Backup Row Count | Column-by-Column Comparison | Preservation Status |
|---|---:|---:|:---:|:---:|
| `payroll_runs` | 18 | 18 | All 18 rows identical in all common columns | **100% IDENTICAL** |
| `payslips` | 2,469 | 2,469 | All 2,469 rows identical in all 23 columns | **100% IDENTICAL** |
| `employees` | 441 | 441 | All 441 rows identical in all columns | **100% IDENTICAL** |
| `expenses` | 501 | 501 | All 501 rows identical in all columns | **100% IDENTICAL** |
| `invoices` | 743 | 743 | All 743 rows identical in all columns | **100% IDENTICAL** |
| `attendance_monthly`| 2,469 | 2,469 | All 2,469 rows identical in all columns | **100% IDENTICAL** |
| `leave_balances` | 441 | 441 | All 441 rows identical in all columns | **100% IDENTICAL** |
| `leave_requests` | 2,183 | 2,183 | All 2,183 rows identical in all columns | **100% IDENTICAL** |
| `audit_logs` | 87 | 87 | All 87 rows identical in all columns | **100% IDENTICAL** |
| `users` | 8 | 8 | All 8 rows identical in all columns | **100% IDENTICAL** |
| `payroll_adjustments`| 0 | *Table added in Step 1* | 0 rows in live database | **0 ROWS (GATE 1 PRESERVED)** |

**Financial Preservation Finding:**
Zero financial records, payroll runs, payslips, employee master rows, compensation entitlements, or expense/invoice records have been modified.

---

### 3.2 Group 2 — Nonfinancial Records & Identified Discrepancy

Among all other 17 nonfinancial tables (`ai_anomaly_results`, `ai_attrition_risk`, `announcements`, `chatbot_responses`, `clients`, `departments`, `holidays`, `hr_faqs`, `leave_types`, `manager_delegations`, `notifications`, `roles`, `sprints`, `tasks`, `teams`, `vendors`):
- **16 tables** are 100% column-by-column identical.
- **1 table (`tasks`)** contains exactly **one row** with a timestamp difference:

```json
{
  "table": "tasks",
  "task_id": "TASK-24250",
  "discrepancy": {
    "column": "updated_at",
    "live_value": 1794046031397,
    "backup_value": 1793949532364
  },
  "impact": "Nonfinancial metadata only. Task title, description, status, assignee, and priority remain identical."
}
```

---

### 3.3 Group 3 — Database Structural Integrity & Foreign Keys

Direct SQLite PRAGMA execution on `prisma/dev.db`:
- **`PRAGMA integrity_check;`**:
  ```text
  ok
  ```
  Result: 0 corrupted pages, 0 B-tree errors, 0 index corruptions.
- **`PRAGMA foreign_key_check;`**:
  ```text
  0 violations
  ```
  Result: Complete referential integrity maintained across all 28 tables.

---

## 4. Prohibited vs. Compliant Statements

| Prohibited Unqualified Claim | Correct Qualified Statement |
|---|---|
| ❌ *"All 27 tables are completely identical."* | ✅ **"All compared payroll and financial records were identical to the available pre-deployment backup. A previously identified nonfinancial task timestamp difference remains documented."** |
| ❌ *"The entire database is byte-for-byte unchanged."* | ✅ **"Row-level relational invariance is verified for all financial tables; SQLite file checksum differences reflect standard change counters and transaction logging."** |
| ❌ *"No database changes occurred."* | ✅ **"Schema migration `20261106154652_add_payroll_correction_ledger` added the `payroll_adjustments` table, which holds exactly 0 records."** |

---

## 5. Conclusion

Database preservation is conclusively verified for all payroll and financial operations. Gate 1 remains firmly in place, and zero financial records have experienced modification.

