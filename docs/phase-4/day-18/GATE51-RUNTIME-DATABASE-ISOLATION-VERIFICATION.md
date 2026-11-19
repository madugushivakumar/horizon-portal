# GATE 5.1 — APPLICATION RUNTIME DATABASE ISOLATION VERIFICATION

**Project:** Horizon Portal  
**Date:** November 19, 2026  
**Auditor:** Principal Software Architect & Application Security Engineer  

---

## 1. Runtime Database Selection Architecture (`src/lib/prisma.ts`)

```typescript
const isPostgres = Boolean(
  process.env.DATABASE_URL &&
    (process.env.DATABASE_URL.startsWith("postgresql://") ||
      process.env.DATABASE_URL.startsWith("postgres://"))
);

function createClient(): SqliteClient {
  if (isPostgres) {
    return new PgClient({ log: logOptions }) as unknown as SqliteClient;
  }
  return new SqliteClient({ log: logOptions });
}
```

### Architectural Findings:
1. `src/lib/prisma.ts` dynamically evaluates `process.env.DATABASE_URL`.
2. When running locally with SQLite (`DATABASE_URL="file:./dev.db"`), Prisma instantiates `@prisma/client` targeting `prisma/dev.db`.
3. When running in hosted environments where `DATABASE_URL` begins with `postgresql://` or `postgres://`, Prisma instantiates `PgClient` targeting the hosted PostgreSQL instance.
4. `src/lib/prisma.ts` does **not** dynamically alter the connection target or schema name based on `process.env.VERCEL_ENV`. It relies exclusively on the connection string injected into `process.env.DATABASE_URL` by the runtime environment.

---

## 2. Runtime Isolation Verdict: BLOCKED

Because Vercel environment variables currently inject the shared Production connection string into Preview builds, the runtime environment in Preview currently targets the Production Neon database.  
**Stateful live write tests remain strictly prohibited on Preview.**
