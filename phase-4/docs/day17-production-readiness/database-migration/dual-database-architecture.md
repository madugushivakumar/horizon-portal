# Stage 3: SQLite & PostgreSQL Dual-Database Architecture
## Horizon Portal / Aura Workforce by Growmar — Phase 4, Day 17

---

## 1. The Core Engineering Challenge in Prisma 6.19.3

In Prisma ORM 6.19.3:
1. **No Dynamic Provider Variable:** The `datasource db { provider = "..." }` block requires a **hardcoded string literal** (`"sqlite"` or `"postgresql"`). Syntax such as `provider = env("DATABASE_PROVIDER")` is rejected by the Prisma Schema Language compiler.
2. **Migration Provider Locking:** The file `prisma/migrations/migration_lock.toml` explicitly sets `provider = "sqlite"`. Attempting to run `prisma migrate deploy` against a PostgreSQL database will halt with Prisma Error `P3014`:
   > *The datasource provider 'postgresql' specified in your schema does not match the provider 'sqlite' of the migration history.*
3. **Query Engine Binaries:** Prisma generates client bindings specific to the underlying database engine. An engine compiled for SQLite cannot communicate with PostgreSQL over TCP/IP sockets.

---

## 2. Approved Dual-Environment Strategy

To guarantee **zero disruption** to existing local development while enabling **100% native PostgreSQL deployment on Vercel**, we implement a dual-schema, dual-engine strategy:

```text
horizon-portal/
├── prisma/
│   ├── schema.prisma                  # [LOCAL] Provider: sqlite (dev.db)
│   ├── schema.postgresql.prisma       # [PRODUCTION] Provider: postgresql (Neon)
│   ├── migrations/                    # [LOCAL] 8 SQLite migrations (Untouched)
│   │   ├── 20261021060321_init_...
│   │   └── migration_lock.toml        # provider = "sqlite"
│   ├── migrations_postgresql/         # [PRODUCTION] Clean PostgreSQL Baseline
│   │   ├── 20261117000000_init_pg/
│   │   │   └── migration.sql          # Clean PostgreSQL DDL for 27 models
│   │   └── migration_lock.toml        # provider = "postgresql"
│   ├── seed.ts                        # Master 23-dataset seed script (Universal)
│   └── dev.db                         # Authoritative local SQLite database (Preserved)
```

---

## 3. Client Generation & Interface Identicality

Both `prisma/schema.prisma` and `prisma/schema.postgresql.prisma` share:
- Exactly identical **27 models**.
- Exactly identical **field names, nullabilities, and defaults**.
- Identical String-based role and status representations (`role String`, `status String @default("Active")`).
- Identical `BigInt` field types for paise.

Because both generate their types to `node_modules/@prisma/client`, the TypeScript interfaces (`PrismaClient`, `User`, `Employee`, `PayrollRun`, `Payslip`, etc.) are **100% interchangeable**.

Application code in `src/` requires **zero modifications**:
```ts
// src/lib/prisma.ts continues to import without change:
import { PrismaClient } from "@prisma/client";
```

---

## 4. Operational Command Matrix

| Purpose | Command | Target Database | Schema Used |
| :--- | :--- | :--- | :--- |
| **Local Dev Client Gen** | `npm run prisma:generate` | SQLite (`dev.db`) | `prisma/schema.prisma` |
| **Local SQLite Migration** | `npx prisma migrate dev` | SQLite (`dev.db`) | `prisma/schema.prisma` |
| **Local SQLite Seed** | `npm run db:seed` | SQLite (`dev.db`) | `prisma/schema.prisma` |
| **Production Client Gen** | `npm run prisma:generate:pg` | PostgreSQL (Neon) | `prisma/schema.postgresql.prisma` |
| **Production Migration Deploy**| `npm run prisma:migrate:pg` | PostgreSQL (Neon) | `prisma/schema.postgresql.prisma` |
| **Production Seed** | `npm run db:seed:pg` | PostgreSQL (Neon) | `prisma/schema.postgresql.prisma` |
| **Vercel Cloud Build** | `npm run build:prod` | PostgreSQL (Neon) | `prisma/schema.postgresql.prisma` |

---

## 5. Local SQLite Preservation Guarantee

Under this architecture:
1. `prisma/dev.db` is **never targeted** by any production script or command.
2. The 8 historical SQLite migrations in `prisma/migrations/` are **never altered or deleted**.
3. All existing automated test suites (`npm run test`, `test:assistant`, `test:payroll`, etc.) continue to run against local SQLite without degradation.
