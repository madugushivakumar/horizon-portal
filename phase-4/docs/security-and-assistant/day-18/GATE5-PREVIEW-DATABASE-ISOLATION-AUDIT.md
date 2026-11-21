# GATE 5 — PREVIEW DATABASE ISOLATION AUDIT REPORT

**Project:** Horizon Portal  
**Date:** November 19, 2026  
**Auditor:** Database Reliability Engineer & DevSecOps Specialist  

---

## 1. Objective & Scope

Audit the hosted PostgreSQL database architecture to determine whether the Vercel Preview deployment operates against an isolated database target, or whether it shares infrastructure with Production.

---

## 2. Infrastructure Identity & Configuration Audit

| Attribute | Local Development | Vercel Preview (Current) | Vercel Production |
| :--- | :--- | :--- | :--- |
| **Database Engine** | SQLite 3 | Neon Serverless PostgreSQL | Neon Serverless PostgreSQL |
| **Prisma Schema** | `prisma/schema.prisma` | `prisma/schema.postgresql.prisma` | `prisma/schema.postgresql.prisma` |
| **Prisma Client Path**| Standard `@prisma/client` | `src/generated/postgresql-client` | `src/generated/postgresql-client` |
| **Host Fingerprint** | Local filesystem (`prisma/dev.db`)| `ep-broad-hall-b3dtqwdp-pooler...` | `ep-broad-hall-b3dtqwdp-pooler...` |
| **Database Name** | `dev.db` | `neondb` | `neondb` |
| **Schema Name** | SQLite Default | `public` | `public` |
| **Vercel Scope** | N/A (Local env) | **Shared with Production** | **Shared with Preview** |
| **Branch Separation** | N/A | **None (Single Neon Branch)** | **None (Single Neon Branch)** |

---

## 3. Findings & Safety Analysis

1. **Shared Database Target:**
   Vercel Project Settings configure `DATABASE_URL` and `DIRECT_URL` with a single value checked for both "Production" and "Preview". No dynamic schema prefixing (e.g. `?schema=preview`) or branch-level switching is implemented in `src/lib/prisma.ts`.
2. **Build & Startup Safety:**
   - The build command is `next build --webpack`. It does NOT execute `prisma migrate deploy` or `prisma db seed`.
   - Next.js build-time generation does not execute database writes.
   - At runtime, read-only queries are non-mutating.
3. **State-Changing Risk:**
   If live write tests (e.g. approving real or synthetic leave requests, creating employee records, modifying payroll) were executed against the Preview deployment, **those writes would directly persist to the Production Neon PostgreSQL database**.
4. **Hard Stop Condition Enforcement:**
   In accordance with Rule 1 and Rule 4 of the Master Prompt, **Preview database isolation is CLASSIFIED AS BLOCKED / NOT CONFIGURED**. All state-changing Preview tests are strictly forbidden until a dedicated Neon Preview branch is created and linked.
