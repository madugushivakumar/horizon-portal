# Neon Credential Security & Connection Verification
## Horizon Portal / Aura Workforce by Growmar — Phase 4, Day 17

> **Milestone:** Phase 4 — Day 17 (Task 17)  
> **Stage:** Stage 6 — Neon Credential Security and Connection Verification  
> **Status:** Security Baseline Verified | Awaiting Rotated Credentials for Live Handshake  
> **Target Cloud Host:** Neon Serverless PostgreSQL (`*.neon.tech`)

---

## 1. Credential Security & Hygiene Audit

Before configuring any database connections, a comprehensive security audit was performed across the repository:

| Security Check | Verification Method | Status | Result / Evidence |
| :--- | :--- | :---: | :--- |
| **Historical Password Rotation** | Policy Requirement | **ENFORCED** | Any previously exposed credentials are treated as compromised and invalidated. |
| **Zero Secrets in Git Tracked Files** | `git grep -i "neon.tech"` <br> `git grep -i "postgresql://"` | **PASS** | 0 occurrences of real connection strings or passwords in git tree. |
| **Environment File Exclusion** | `.gitignore` rule inspection | **PASS** | `.env*` excluded; only `.env.example` and `.env.production.example` allowed. |
| **Production Example Template** | `.env.production.example` inspection | **PASS** | Contains only bracketed placeholders (`[username]`, `[password]`, etc.). |
| **No Client Leakage (`NEXT_PUBLIC_`)** | Source code grep for `NEXT_PUBLIC_DATABASE_URL` | **PASS** | 0 occurrences. Zero database credentials exposed to client bundle. |
| **Local SQLite Preservation** | `DATABASE_URL` in local `.env` | **PASS** | Retains `file:./dev.db` so local dev/tests never touch production by accident. |

---

## 2. Environment Variable Mapping & Architecture

Prisma ORM 6.19.3 in conjunction with Neon Serverless PostgreSQL requires two distinct connection endpoints:

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        NEXT.JS / PRISMA RUNTIME                        │
└────────────────────────────────────────────────────────────────────────┘
                   │                                    │
    (Serverless Runtime Queries)             (DDL Migrations & Locking)
                   │                                    │
                   ▼                                    ▼
       DATABASE_URL (Port 6543)               DIRECT_URL (Port 5432)
         PgBouncer Pooler                     Compute Session
         ?sslmode=require&pgbouncer=true      ?sslmode=require
                   │                                    │
                   ▼                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      NEON SERVERLESS POSTGRESQL                        │
│                           (PostgreSQL 16+)                             │
└────────────────────────────────────────────────────────────────────────┘
```

### Detailed Mapping:

1. **`DATABASE_URL` (Pooled Connection — Port 6543)**
   - **Consumer:** `@prisma/client` initialized in `src/lib/prisma.ts`.
   - **Configuration:** `postgresql://[user]:[password]@[neon-host]:6543/[dbname]?sslmode=require&pgbouncer=true`
   - **Purpose:** Multiplexes concurrent serverless queries through Neon's built-in PgBouncer pooler, preventing connection starvation during traffic spikes.
   - **Prisma 6 Config:** Configured via `datasource db { provider = "postgresql"; url = env("DATABASE_URL") }`.

2. **`DIRECT_URL` (Direct Session Connection — Port 5432)**
   - **Consumer:** Prisma CLI during `prisma migrate deploy` (invoked via `npm run prisma:migrate:pg`).
   - **Configuration:** `postgresql://[user]:[password]@[neon-host]:5432/[dbname]?sslmode=require`
   - **Purpose:** Direct session mode connection to PostgreSQL compute instance. Required because PgBouncer does not support advisory locks and DDL transaction state required by `_prisma_migrations`.
   - **Prisma 6 Config:** Configured in `prisma/schema.postgresql.prisma` via `directUrl = env("DIRECT_URL")` and in `prisma.config.postgresql.ts`.

---

## 3. Safe Connectivity Verification Protocol

When connection strings are provided, connectivity verification must be performed using a safe diagnostic script that **never prints or logs passwords or credentials**:

```ts
// Safe Handshake Verification Specification:
// 1. Parse connection string using URL parser.
// 2. Extract host, port, database, and sslmode without logging username/password.
// 3. Connect using pg Client with ssl: { rejectUnauthorized: true }.
// 4. Run:
//    - SELECT version();                --> Confirms PostgreSQL engine and version
//    - SELECT current_database();       --> Confirms target database name
//    - SELECT current_user;             --> Confirms authorized role
//    - SHOW ssl;                        --> Confirms SSL is ON
// 5. Query information_schema.tables to verify initial empty/clean state.
// 6. Close connection.
```

---

## 4. Current Gate Status

- [x] Security hygiene verified.
- [x] Variable mapping confirmed against `prisma/schema.postgresql.prisma` and `prisma.config.postgresql.ts`.
- [ ] Awaiting rotated Neon connection strings (`DIRECT_URL` and `DATABASE_URL`) from user to perform the initial live connectivity handshake.
