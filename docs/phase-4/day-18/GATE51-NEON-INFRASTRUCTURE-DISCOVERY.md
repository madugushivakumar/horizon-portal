# GATE 5.1 — NEON INFRASTRUCTURE DISCOVERY REPORT

**Project:** Horizon Portal  
**Date:** November 19, 2026  
**Auditor:** Principal Database Architect & Neon Infrastructure Engineer  

---

## 1. Neon PostgreSQL Discovery Findings

Based on inspection of `prisma/schema.postgresql.prisma`, `prisma.config.postgresql.ts`, `.env.production.local`, and historical audit documentation:

1. **Host Fingerprint:** `ep-broad-hall-b3dtqwdp-pooler.c-4.ap-southeast-1.aws.neon.tech` (AWS Asia Pacific - Singapore).
2. **Database Engine:** PostgreSQL 16+ on Neon Serverless.
3. **Database Name:** `neondb`.
4. **Current Branch Allocation:** Single default `main` branch.
5. **Tooling Access:**
   - The standalone Neon CLI (`neon` / `neonctl`) is not installed in the execution environment.
   - No `NEON_API_KEY` or cloud management token is exported in the local environment.
   - Vercel CLI is unauthenticated locally.
6. **Isolation Status:**
   - Both Production and Preview currently resolve to the same Neon endpoint (`ep-broad-hall-b3dtqwdp`).
   - No separate preview branch exists in the active Vercel configuration.

---

## 2. Infrastructure Identity Matrix

| Attribute | Existing Production | Existing Preview | Target Isolated Architecture |
| :--- | :--- | :--- | :--- |
| **Neon Project** | `horizon-portal-db` (AWS ap-southeast-1) | `horizon-portal-db` (AWS ap-southeast-1) | Same Project |
| **Branch Name** | `main` | `main` (Shared) | `horizon-portal-preview-isolated` |
| **Endpoint ID** | `ep-broad-hall-b3dtqwdp` | `ep-broad-hall-b3dtqwdp` (Shared) | Dedicated Preview Endpoint |
| **Database** | `neondb` | `neondb` | `neondb` (Branch-isolated) |
| **Target Isolation**| **Production Target** | **Production Target (Violation)** | **Isolated Branch Target** |
