# Stage 2: Final Vercel & Neon Configuration Analysis
## Official Documentation, Pricing, Limits & Connection Architecture (November 2026)

---

## 1. Vercel Hosting Specification

### 1.1 Architecture & Next.js 16 Optimization
- **Creators of Next.js:** Vercel natively optimizes Next.js 16 App Router, Server Components, Route Handlers, Partial Prefetching (PPR), and Cache Components (`cacheComponents: true`).
- **Serverless API Execution:** Serverless functions execute within isolated microVMs geographically co-located with the configured database region.
- **Static Assets & Edge CDN:** Global Anycast edge network with automatic Brotli/Gzip compression and immutable asset caching.
- **Zero Sleep Delay:** Static and server-rendered pages respond with zero cold-start delay (unlike Render's 50-second wake-up penalty).

### 1.2 Official Plan Limits & Terms
| Resource / Feature | Hobby Plan (Free) | Pro Plan ($20 / user / mo) |
| :--- | :--- | :--- |
| **Price** | $0 / month | $20 / user / month |
| **Commercial Terms** | Non-commercial / Educational / Evaluation | Commercial production permitted |
| **Bandwidth** | 100 GB / month | 1 TB included |
| **Serverless Invocations**| 1,000,000 invocations / month | Unlimited (metered overages) |
| **Execution Duration** | Up to 15 seconds per request | Up to 60 seconds (configurable up to 300s) |
| **Active CPU Time** | 4 CPU-hours / month | Pay-as-you-go overages |
| **Build Timeout** | 45 minutes per deployment | 45 minutes per deployment |
| **Deployments / Day** | 100 deployments / day | Unlimited |
| **Custom Domains** | Up to 50 domains with free automatic SSL | Custom domains with SSL & apex redirection |
| **Git Integration** | Automatic GitHub CI/CD on push | GitHub, GitLab, Bitbucket |

---

## 2. Neon Serverless PostgreSQL Specification

### 2.1 Engine & Storage Architecture
- **Engine Version:** PostgreSQL 16+ compatible with full relational capabilities.
- **Architecture:** Decoupled serverless storage and compute.
- **Autoscaling & Scale-to-Zero:** Automatically suspends compute after 5 minutes of zero traffic; wakes up in under 500 milliseconds on the first incoming SQL query.
- **Connection Pooling:** Integrated native PgBouncer connection pooling on port `6543`.
- **Encryption:** SSL enforced across all incoming connections (`sslmode=require`).

### 2.2 Official Plan Limits
| Resource / Feature | Free Tier ($0 / month) | Launch Plan (~$0.106 / CU-hr) |
| :--- | :--- | :--- |
| **Projects** | 1 Project (up to 100 projects per account) | Unlimited |
| **Storage Cap** | **1.0 GB** (Horizon Portal requires ~3.6 MB) | $0.35 / GB / month |
| **Compute Allowance** | **100 Compute Unit (CU) hours / month** | Metered per second (~$0.106 / CU-hr) |
| **Compute Scaling** | Up to 2 CU (8 GB RAM) | Up to 16 CU (64 GB RAM) |
| **Branching** | 10 branches (instant isolated copies) | Unlimited |
| **Public Data Egress**| 5 GB / month | Metered |
| **Point-in-Time Restore**| 6-hour history restore window | 7 days+ configurable |
| **Inactivity Policy** | **Scale-to-zero without database deletion.** | Always-on option available |

> [!NOTE]
> **Comparison vs. Alternatives:**
> - Render's free PostgreSQL strictly expires and is **deleted after 30 days**.
> - Supabase's free tier automatically **pauses after 7 days of inactivity**, requiring manual dashboard login to unpause.
> - Neon's free tier is **permanent**, scales to zero to conserve hours, and auto-resumes instantly upon query receipt.

---

## 3. Direct vs. Pooled Connection String Strategy

Prisma and Neon require distinct connection configurations depending on the operation:

### 3.1 Migration / DDL Execution (Direct Connection)
- **Port:** `5432` (Direct PostgreSQL server)
- **Mode:** Session mode
- **Why Required:** Prisma migrations execute DDL commands (`CREATE TABLE`, `ALTER TABLE`, `CREATE INDEX`) and acquire advisory locks (`prisma_migrations` lock table). PgBouncer transaction-mode poolers reject advisory locks and prepared statements.
- **Parameter:** `DIRECT_URL` in Prisma datasource.

### 3.2 Application Runtime Queries (Pooled Connection)
- **Port:** `6543` (PgBouncer connection pooler)
- **Mode:** Transaction pooling
- **Why Required:** Serverless functions on Vercel scale horizontally. Without pooling, hundreds of concurrent requests open hundreds of database connections, quickly exhausting PostgreSQL connection limits. PgBouncer multiplexes connections efficiently.
- **Parameter:** `DATABASE_URL` in Prisma datasource (`?pgbouncer=true&sslmode=require`).

### 3.3 Golden Standard Prisma Datasource Definition:
```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL") // Pooled connection string (port 6543)
  directUrl = env("DIRECT_URL")   // Direct connection string (port 5432)
}
```
