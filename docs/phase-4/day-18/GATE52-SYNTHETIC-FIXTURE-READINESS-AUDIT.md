# GATE 5.2 — SYNTHETIC TEST FIXTURE READINESS & DATA INVARIANT AUDIT

**Project:** Horizon Portal  
**Branch:** `day18-preview-validation`  
**Date:** November 19, 2026  
**Auditor:** DevSecOps Specialist & QA Test Architect  

---

## 1. Objective & Non-Destructive Fixture Design

To safely execute the seven blocked security tests (G5-BLK-001 through G5-BLK-007) in the Vercel Preview environment, the preview database must contain synthetic test fixtures without importing or exposing real employee PII or production data.

---

## 2. Required Synthetic Test Entities

| Entity Type | Identifier | Role / Purpose | Safety Constraint |
| :--- | :--- | :--- | :--- |
| **Synthetic User 1** | `preview.admin@growmar.internal` | Administrator role | Synthetic credentials only |
| **Synthetic User 2** | `preview.manager@growmar.internal` | Manager (Engineering) | Synthetic credentials only |
| **Synthetic User 3** | `preview.emp1@growmar.internal` | Employee (Developer) | Synthetic credentials only |
| **Synthetic User 4** | `preview.emp2@growmar.internal` | Employee (Target for IDOR) | Synthetic credentials only |
| **Synthetic Employee** | `EMP-PREV-001` | Employee profile for User 3 | Mock data (no real PII) |
| **Synthetic Employee** | `EMP-PREV-002` | Employee profile for User 4 | Mock data (no real PII) |
| **Synthetic Payslip** | `PS-PREV-1001` | Assigned to EMP-PREV-001 | Fictitious salary numbers |
| **Synthetic Payslip** | `PS-PREV-1002` | Assigned to EMP-PREV-002 | Fictitious salary numbers |
| **Synthetic Leave** | `LR-PREV-2001` | Pending request from EMP-PREV-001 | Safe test record for approval/rejection |

---

## 3. Fixture Seeding Safety Protocol

1. **Synthetic Isolation Invariant:**
   - Synthetic fixtures are generated exclusively with the `.internal` test domain.
   - Fixture records are prefixed with `PREV-` or `preview.` to eliminate any possible confusion with production baseline data.
2. **Local Database Protection:**
   - The local SQLite database (`prisma/dev.db`) must remain completely untouched during preview seeding.
   - Its size must remain exactly 3,637,248 bytes.
3. **Execution Condition:**
   - Synthetic fixture scripts must ONLY run when `DATABASE_URL` is confirmed to point to the dedicated Neon preview branch.
