# Neon Serverless PostgreSQL Provisioning & Configuration Guide
## Horizon Portal / Aura Workforce by Growmar — Phase 4, Day 17

> **Milestone:** Phase 4 — Day 17 (Task 17)  
> **Status:** Ready for Provisioning Input  
> **Target Cloud Database:** Neon Serverless PostgreSQL (PostgreSQL 16+)  
> **Tier:** Free Hobby Tier ($0.00 / month) — within approved boundaries  
> **Region:** Recommended: AWS `us-east-1` (N. Virginia) or closest to Vercel deployment region (`iad1`)

---

## 1. Neon Configuration Specification

To ensure high performance, connection pooling, and zero migration failures, the Neon project should be configured as follows:

| Parameter | Specification | Purpose |
| :--- | :--- | :--- |
| **Project Name** | `horizon-portal-prod` | Standard naming convention |
| **PostgreSQL Version** | 16 (or latest stable) | Fully compatible with Prisma 6.19.3 native types |
| **Region** | `us-east-1` (US East, N. Virginia) | Colocated with Vercel's default serverless region (`iad1`) |
| **Compute Scaling** | 0.25 CU (Autoscaling down to 0 after 5m) | 100% free-tier compliant, zero idle billing |
| **Storage Allocation** | ~100 MB initial | Free tier includes 1 GB storage (plenty for 23 datasets) |

---

## 2. Connection Strings Required

Neon provides two distinct connection strings in the Dashboard under **Connection Details**:

### 1. `DIRECT_URL` (Direct Connection — Port 5432)
- **Format:** `postgresql://[user]:[password]@[neon-host]:5432/[dbname]?sslmode=require`
- **Role:** Dedicated for **schema migrations** (`npm run prisma:migrate:pg`) and DDL locking.
- **Why Port 5432:** Transaction pooling interferes with PostgreSQL advisory locks and migration table state. The direct connection communicates with the compute instance in session mode.

### 2. `DATABASE_URL` (Pooled Connection — Port 6543)
- **Format:** `postgresql://[user]:[password]@[neon-host]:6543/[dbname]?sslmode=require&pgbouncer=true`
- **Role:** Dedicated for **Next.js serverless runtime queries** via `@prisma/client`.
- **Why Port 6543:** Next.js serverless functions scale up dynamically. Neon's built-in PgBouncer multiplexes hundreds of concurrent serverless queries over a small pool of database connections, preventing connection exhaustion.

---

## 3. Security Hygiene Checklist

- [x] Passwords must be cryptographically generated.
- [x] `sslmode=require` must be present on both URLs to enforce TLS in transit.
- [x] Raw connection strings containing passwords must **never** be committed to Git, logged to console, or embedded in documentation.
- [x] Connection strings will be configured directly in Vercel Project Settings > Environment Variables.
- [x] Local `.env` remains locked to `DATABASE_URL="file:./dev.db"` to guarantee SQLite safety.

---

## 4. Provisioning Status & Next Steps

1. User creates or opens the Neon project and copies the connection strings:
   - **Pooled connection string** (for `DATABASE_URL`)
   - **Direct connection string** (for `DIRECT_URL`)
2. With user confirmation:
   - Run `npm run prisma:migrate:pg` against `DIRECT_URL` to apply the 27-table baseline.
   - Run `npm run db:seed:pg` against `DATABASE_URL` to seed the 23 datasets.
