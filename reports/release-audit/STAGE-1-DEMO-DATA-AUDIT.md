# Stage 1 — Demo-User Data, Test Fixture and Credential Investigation Audit Report

**Project:** Horizon Portal  
**Date:** 2026-11-21  
**Auditor:** Principal Software Architect & DevSecOps Engineer  
**Workspace:** `C:\HorizonPortal-Development\horizon-portal`  
**Status:** PASS (Safe Synthetic Demo Data Verified)

---

## 1. Executive Summary

A comprehensive investigation of all demo-user JSON files and test fixtures was conducted across the Horizon Portal repository. The audit reviewed the 7 known locations and discovered an 8th file (`phase-4/demo_users.json`).

All 8 files were synthetically generated for local development and E2E automated test runs. None contain real-world user credentials, production account data, or sensitive employee personal information.

- **Total Demo User JSON Files Identified:** 8 (5 Format A, 3 Format B)
- **Total Password-Related Records Across All Files:** 32 (8 files x 4 records)
- **Unique User Personas:** 8 (4 in Format A, 4 in Format B; both sets mapping to 4 standard RBAC roles)
- **Record Origin:** Category A — 100% Synthetic Mock Data (using fictional domains `growmar.com` and RFC 2606 reserved `.example`)
- **Password Representation:** Plaintext strings in JSON fixtures, hashed via `bcryptjs` (salt rounds = 10) at seeding runtime
- **Production Credential Exposure:** None

---

## 2. Inventory and File Integrity Analysis

### 2.1 File Catalog and Checksums

| # | Relative Path | Format | Records | Size (Bytes) | SHA-256 Checksum |
|---|---------------|--------|---------|--------------|-------------------|
| 1 | `demo_users.json` | Format A | 4 | 842 | `c1429b356ebffb19e832baf687c8e2a95f840867e702c886bd7d8c8ee1e0205b` |
| 2 | `03_Data_Pack/demo_users.json` | Format B | 4 | 978 | `05a4c9f5e325ec79bb255b0773527fef70ceb7ef61fa0009db4620c44b79ca98` |
| 3 | `phase-1/demo_users.json` | Format A | 4 | 842 | `c1429b356ebffb19e832baf687c8e2a95f840867e702c886bd7d8c8ee1e0205b` |
| 4 | `phase-2/demo_users.json` | Format A | 4 | 842 | `c1429b356ebffb19e832baf687c8e2a95f840867e702c886bd7d8c8ee1e0205b` |
| 5 | `phase-2/03_Data_Pack/demo_users.json` | Format B | 4 | 978 | `05a4c9f5e325ec79bb255b0773527fef70ceb7ef61fa0009db4620c44b79ca98` |
| 6 | `phase-3/demo_users.json` | Format A | 4 | 842 | `c1429b356ebffb19e832baf687c8e2a95f840867e702c886bd7d8c8ee1e0205b` |
| 7 | `phase-3/03_Data_Pack/demo_users.json` | Format B | 4 | 978 | `05a4c9f5e325ec79bb255b0773527fef70ceb7ef61fa0009db4620c44b79ca98` |
| 8 | `phase-4/demo_users.json` | Format A | 4 | 842 | `c1429b356ebffb19e832baf687c8e2a95f840867e702c886bd7d8c8ee1e0205b` |

### 2.2 Duplication Analysis
- **Format A Group (5 copies):** The root file and Phase 1, 2, 3, and 4 copies are 100% byte-for-byte identical (`c1429b356ebffb19e832baf687c8e2a95f840867e702c886bd7d8c8ee1e0205b`).
- **Format B Group (3 copies):** The `03_Data_Pack/demo_users.json` and Phase 2, 3 subfolder copies are 100% byte-for-byte identical (`05a4c9f5e325ec79bb255b0773527fef70ceb7ef61fa0009db4620c44b79ca98`).

---

## 3. Schema and Record Structure Verification

### Format A Schema (Legacy Root & Phase Copies)
- **Field Names:** `id`, `name`, `email`, `password`, `role`, `employee_id`, `is_active`
- **Record 1:** Role: `Admin` | ID: `EMP-0099` | Email domain: `@growmar.com` | Password length: 18 chars
- **Record 2:** Role: `HR` | ID: `EMP-0011` | Email domain: `@growmar.com` | Password length: 15 chars
- **Record 3:** Role: `Manager` | ID: `EMP-0547` | Email domain: `@growmar.com` | Password length: 20 chars
- **Record 4:** Role: `Employee` | ID: `EMP-0188` | Email domain: `@growmar.com` | Password length: 21 chars

### Format B Schema (Data Pack Standard)
- **Field Names:** `label`, `employee_id`, `full_name`, `username`, `role`, `demo_password`
- **Record 1:** Role: `ADMIN` | ID: `EMP-0099` | Username: `sanjay.kumar@znova-demo.example` | demo_password length: 66 chars
- **Record 2:** Role: `HR` | ID: `EMP-0011` | Username: `hemant.mathew@znova-demo.example` | demo_password length: 66 chars
- **Record 3:** Role: `MANAGER` | ID: `EMP-0547` | Username: `imran.philip@znova-demo.example` | demo_password length: 66 chars
- **Record 4:** Role: `EMPLOYEE` | ID: `EMP-0188` | Username: `sasi.shetty@znova-demo.example` | demo_password length: 66 chars

---

## 4. Password Representation & Authentication Implementation

### 4.1 Field Length and Structure
- **Format A (`password` field):** Values are plaintext strings constructed as `[Role]@Horizon2026!` (lengths 15, 18, 20, 21 characters).
- **Format B (`demo_password` field):** Length of 66 characters was previously noted as ambiguous. Inspection reveals each entry consists of a base string followed by documentation annotations, explicitly ending in `(plain text)`.

### 4.2 Application Cryptographic Verification
Inspection of `phase-4/src/lib/auth/password.ts`:
- Employs `bcryptjs` with salt rounds = 10 (`hashPassword(password)` and `verifyPassword(password, hash)`).
- Does not log passwords or expose hashes.

Inspection of `phase-4/prisma/seed.ts` and `phase-4/prisma/seed.postgresql.ts`:
- **Format B Users (`rawDemoUsers`):** Seeded by hashing the uniform demo password (`bcrypt.hash("Horizon@2026", 10)`).
- **Format A Users (`legacyUsers`):** Seeded by hashing the role-specific passwords (`bcrypt.hash(u.password, 10)`).
- In both databases (SQLite and PostgreSQL), all stored passwords are secure 60-character bcrypt hashes (`$2a$10$...` / `$2b$10$...`).

---

## 5. Origin Determination

**Classification: Category A — 100% Synthetic Test Accounts**
- **Domain Verification:** Format A uses `growmar.com` (a mock demonstration entity); Format B uses `znova-demo.example` (RFC 2606 reserved TLD specifically intended for non-routable, non-production examples).
- **Employee ID Mapping:** Both sets of personas intentionally reference the four core employee records in the synthetic workforce dataset (`EMP-0099`, `EMP-0011`, `EMP-0547`, `EMP-0188`).
- **Absence of Real PII:** All addresses, phone numbers, and salaries tied to these records are generated fixture data from the Phase 2/3 Data Pack.

---

## 6. Consumers and Repository Dependencies

A repository-wide reference scan identified 27 files referencing `demo_users.json`:
1. **Database Seeders:**
   - `phase-4/prisma/seed.ts`
   - `phase-4/prisma/seed.postgresql.ts`
   - Historical seeders in `phase-1/`, `phase-2/`, `phase-3/`
2. **Automated Testing & E2E:**
   - `phase-4/tests/e2e/helpers/authentication.ts`: Reads root `demo_users.json` as a local SQLite fallback when `E2E_*` environment variables are absent.
   - `phase-4/tests/e2e/fixtures/auth.fixture.ts`: Leverages authentication helpers.
3. **Verification Scripts:**
   - `phase-4/scripts/test-auth.ts`: Validates bcrypt hashing against demo fixtures.
   - `phase-4/scripts/verify-data-pack.ts`: Validates 23 JSON datasets including `demo_users.json`.

---

## 7. Remediation and Release Recommendations

1. **Retain Canonical Fixtures for Seed & E2E:**
   - Retain `03_Data_Pack/demo_users.json` as the canonical master dataset required by `prisma/seed.ts`.
   - Retain root or phase-4 `demo_users.json` required by Playwright authentication helpers.
2. **Prune Phase-Redundant Copies in Clean Release Branch:**
   - Redundant copies in `phase-1/`, `phase-2/`, `phase-3/` belong to historical development phases and should be maintained in archive branches, while the clean release branch focuses on Phase 4.
3. **Documentation Clarification:**
   - The Root and Phase 4 `README.md` must explicitly declare that all demo users are synthetic, isolated development fixtures and must never be deployed to live production systems without replacement.

---
**Stage 1 Sign-Off:** PASS
