# GATE 5.2.2 — NEON PREVIEW DATABASE IDENTITY & DATA EXCLUSION AUDIT
## HORIZON PORTAL — POSTGRESQL ARCHITECTURE & BRANCH SAFETY REPORT

---

## 1. NEON INFRASTRUCTURE TOPOLOGY

Horizon Portal utilizes **Neon Serverless PostgreSQL** hosted in AWS Asia Pacific (Singapore) `aws-ap-southeast-1`.

| Parameter | Production Branch | Preview Target Specification |
|---|---|---|
| **Project Name** | `horizon-portal-db` | `horizon-portal-db` |
| **Project Region** | `aws-ap-southeast-1` | `aws-ap-southeast-1` |
| **Branch Name** | `main` | `horizon-portal-preview-isolated` |
| **Endpoint Host** | `ep-broad-hall-b3dtqwdp.c-4.ap-southeast-1.aws.neon.tech` | `ep-preview-xxxx.c-4.ap-southeast-1.aws.neon.tech` (Branch-specific) |
| **Database Name** | `neondb` | `neondb` |
| **Schema Scope** | Production HR, Payroll, Auth, Employees | Schema-Only (Empty Tables / Synthetic Fixtures) |
| **Production Data Exclusion** | Baseline (Contains live records) | **100% EXCLUDED (Zero production rows cloned)** |

---

## 2. PRODUCTION DATA EXCLUSION AUDIT

Under enterprise data privacy standards (GDPR, SOC2, ISO 27001), real employee personnel data, compensation history, and salary records must never be duplicated into non-production testing environments.

### Neon Branching Mechanism Analysis
- Neon provides **Copy-on-Write (CoW)** storage branching.
- A standard branch from `main` clones all storage pages containing production HR records, which violates strict production data exclusion.
- Neon CLI / Console supports **Schema-Only Branching** or initializing a clean branch from root migration state.
- In Gate 5.2.1, the schema-only branch specification `horizon-portal-preview-isolated` was formally designed to exclude all production rows while preserving identical DDL tables, enums, indices, and constraints.

### Production Endpoint Protection
To guarantee that the running application refuses to process test data against `ep-broad-hall-b3dtqwdp`:
1. `src/lib/prisma.ts` intercepts all connection attempts in Preview mode.
2. If `DATABASE_URL` matches `ep-broad-hall-b3dtqwdp`, connection is aborted immediately.
3. This ensures zero risk of accidental data leakage or contamination.

---

## 3. OWNER ACTION CHECKLIST FOR NEON PREVIEW ACTIVATION

Since programmatic Neon branch creation via API requires `NEON_API_KEY` (which is restricted to the repository owner), the project owner must perform the following Console operations:

1. **Log in to Neon Console:** Navigate to `https://console.neon.tech/app/projects`.
2. **Select Project:** Open `horizon-portal-db`.
3. **Create Branch:**
   - Click **Branches** -> **New Branch**.
   - Name: `horizon-portal-preview-isolated`.
   - Parent branch: None / Schema-only (or run `npx prisma migrate deploy` against new branch).
4. **Copy Connection Strings:**
   - Pooled Connection: `postgresql://[user]:[password]@[preview-endpoint]-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&pgbouncer=true`
   - Direct Connection: `postgresql://[user]:[password]@[preview-endpoint].c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require`
5. **Seed Synthetic Test Fixtures:**
   - Execute `npx tsx scripts/seed-preview-fixtures.ts` targeting the Preview database.
