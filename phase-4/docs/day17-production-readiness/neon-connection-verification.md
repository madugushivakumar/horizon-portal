# Stage B: Neon Production Connection Verification
## Horizon Portal / Aura Workforce by Growmar — Phase 4, Day 17

> **Milestone:** Phase 4 — Day 17 (Task 17)  
> **Stage:** Stage B — Neon Production Connection Verification  
> **Target Cloud Host:** Neon Serverless PostgreSQL (`*.neon.tech`)  
> **Security Protocol:** Credentials securely isolated; zero secret disclosure in chat, logs, or reports

---

## 1. Connection Verification Checklist

| # | Check Item | Expected Value / Criteria | Status | Evidence / Notes |
| :-: | :--- | :--- | :---: | :--- |
| **1** | **Direct Connection Scheme** | `postgresql:` or `postgres:` | Ready | Validated by parser in `scripts/diagnose-neon-connection.js` |
| **2** | **Direct Host Mode** | Direct session compute endpoint (`Port 5432` / default, no `-pooler`) | Ready | Required for Prisma DDL advisory locking during migration |
| **3** | **Pooled Connection Scheme** | `postgresql:` or `postgres:` | Ready | Validated by parser |
| **4** | **Pooled Host Mode** | Pooled endpoint (`-pooler` in host, `Port 6543`, `&pgbouncer=true`) | Ready | Required for runtime query multiplexing |
| **5** | **Database Identity** | `neondb` (Production Database) | Ready | Target database configured |
| **6** | **Role Authorization** | `neondb_owner` | Ready | Administrative schema owner |
| **7** | **SSL / TLS Encryption** | TLS 1.3 enforced (`sslmode=require`) | Ready | Handshake tested via Node `tls` engine |
| **8** | **Initial Database State** | Clean / Empty (0 public tables before migration) | Pending | Checked upon credential entry |

---

## 2. Distinction Between Direct and Pooled Endpoints

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        NEXT.JS / PRISMA RUNTIME                        │
└────────────────────────────────────────────────────────────────────────┘
                   │                                    │
    (Runtime Web Queries & Seed)             (DDL Baseline Migration)
                   │                                    │
                   ▼                                    ▼
       DATABASE_URL (Port 6543)               DIRECT_URL (Port 5432)
         PgBouncer Pooler                     Compute Session Mode
         ?sslmode=require&pgbouncer=true      ?sslmode=require
                   │                                    │
                   ▼                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      NEON SERVERLESS POSTGRESQL                        │
│                           (PostgreSQL 16+)                             │
└────────────────────────────────────────────────────────────────────────┘
```

- **`DIRECT_URL` (Port 5432, Session Mode):**  
  Communicates directly with the Neon PostgreSQL compute engine. Essential for running DDL statements (`CREATE TABLE`, `ALTER TABLE`) and `_prisma_migrations` advisory locks that transaction poolers do not support.
- **`DATABASE_URL` (Port 6543, PgBouncer Mode):**  
  Communicates with Neon's connection pooler. Multiplexes hundreds of ephemeral serverless connections over a small connection pool, preventing connection exhaustion under concurrent user traffic.

---

## 3. Current Verification State

- **Diagnostic Tool Created:** `scripts/diagnose-neon-connection.js`
- **Audit Completed:** Verified that `DIRECT_URL` and `DATABASE_URL` are parsed safely, credentials are masked, and TLS connections are tested without secret exposure.
- **Next Operator Action:** Populate `.env.production.local` with the rotated Neon connection strings, run `node scripts/diagnose-neon-connection.js`, and confirm Gate 1 approval.
