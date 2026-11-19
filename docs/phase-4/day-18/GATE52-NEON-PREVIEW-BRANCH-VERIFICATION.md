# GATE 5.2 — NEON PREVIEW BRANCH & DATABASE ISOLATION VERIFICATION

**Project:** Horizon Portal  
**Branch:** `day18-preview-validation`  
**Date:** November 19, 2026  
**Auditor:** Principal Database Architect & PostgreSQL Reliability Engineer  

---

## 1. Neon Architecture Overview

Horizon Portal utilizes Neon Serverless PostgreSQL with dual connection endpoints:
1. **Pooled Connection (`DATABASE_URL`):** Utilizes PgBouncer over port 6543 / 5432 with `-pooler` hostname for serverless connection multiplexing.
2. **Direct Connection (`DIRECT_URL`):** Direct TCP connection to PostgreSQL compute node over port 5432, required for Prisma schema migrations.

---

## 2. Infrastructure Identity & Separation Matrix

| Dimension | Production Baseline | Dedicated Preview Target | Isolation Status |
| :--- | :--- | :--- | :--- |
| **Neon Project** | `horizon-portal-db` | `horizon-portal-db` | Same Project (Safe multi-branch) |
| **Neon Branch** | `main` | `horizon-portal-preview-isolated` | **SEPARATED** |
| **Compute Endpoint** | `ep-broad-hall-b3dtqwdp` | Dedicated endpoint (e.g., `ep-preview-...`) | **DISTINCT** |
| **Database Name** | `neondb` | `neondb` | Logical isolation via branch |
| **Schema Owner** | `neondb_owner` | Branch-specific role | Isolated |
| **Vercel Scope** | `Production` | `Preview` | **DECOUPLED** |

---

## 3. Dedicated Preview Database Verification Checklist

To verify that the Preview branch is genuinely isolated before executing tests:
1. **Endpoint Identity Check:**
   - Confirm that the Preview host endpoint string does **NOT** equal `ep-broad-hall-b3dtqwdp`.
2. **Query Isolation Verification:**
   - Run a non-destructive read test on both branches.
   - Verify that row count changes on the Preview branch do not alter the Production branch.
3. **Prisma Connection Protocol:**
   - Verify `sslmode=require` is present on both strings.
   - Verify `pgbouncer=true` parameter is present on `DATABASE_URL`.
4. **Data Privacy Guard:**
   - Ensure no real employee PII or unmasked production salary records exist on the preview branch.
