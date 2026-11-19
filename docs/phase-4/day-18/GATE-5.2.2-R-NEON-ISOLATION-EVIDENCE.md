# GATE-5.2.2-R — NEON PREVIEW DATABASE ISOLATION & DATA EXCLUSION EVIDENCE
## HORIZON PORTAL — POSTGRESQL ARCHITECTURE & CLOUD IDENTITY AUDIT

---

## 1. NEON INFRASTRUCTURE HIERARCHY AUDIT

### Distinction Between Endpoint ID and Branch ID
- **Historical Reference:** `ep-broad-hall-b3dtqwdp`
- **Architectural Clarification:** Neon compute endpoints follow the naming pattern `ep-<adjective>-<noun>-<hash>`. Therefore, `ep-broad-hall-b3dtqwdp` represents a **Neon Compute Endpoint ID**, *not* a Git or Neon Branch ID.
- Neon branches carry IDs formatted as `br-<name>-<hash>`.
- The Production branch is named `main`.
- The requested Preview branch is named `horizon-portal-preview-isolated`.

---

## 2. PRODUCTION VS PREVIEW IDENTITY SPECIFICATION

| Infrastructure Identity | Production (Authoritative Baseline) | Preview Target Specification | Current Verification Status |
|---|---|---|---|
| **Neon Project Name** | `horizon-portal-db` | `horizon-portal-db` | Authoritative |
| **Project Region** | `aws-ap-southeast-1` (Singapore) | `aws-ap-southeast-1` (Singapore) | Authoritative |
| **Branch Name** | `main` | `horizon-portal-preview-isolated` | Target Specification |
| **Parent Branch** | Root | Independent Root / Empty Schema | Pending Owner Creation |
| **Compute Endpoint ID** | `ep-broad-hall-b3dtqwdp` | Dedicated Preview Endpoint ID | Pending Owner Creation |
| **Database Name** | `neondb` | `neondb` | Target Specification |
| **HR Employee Rows** | Baseline Production Data | **0 rows (100% Excluded)** | Target Specification |
| **Prisma Runtime Client** | Dynamic PgClient | Dynamic PgClient (Preview Guarded) | **PASS (Fail-closed in code)** |
| **Prisma Migration CLI** | Direct Unpooled (Port 5432) | Direct Unpooled (Preview Guarded) | **PASS (Fail-closed in config)** |

---

## 3. PRODUCTION DATA EXCLUSION REQUIREMENT

1. **Storage Branching vs Schema Initialization:**
   - Standard Neon branch creation duplicates copy-on-write pointers to parent storage pages. If branched from `main`, real employee salaries, PAN numbers, tax IDs, and bank details would be accessible to the Preview application.
   - To satisfy compliance standards (SOC 2, GDPR, ISO 27001), the Preview branch must be created as an **empty / schema-only branch**.
2. **Schema Deployment:**
   - The PostgreSQL schema must be established via `npx prisma migrate deploy --config prisma.config.postgresql.ts` pointing to the Preview branch.
   - Test data must be seeded exclusively via synthetic fixture generators (`prisma/seed.postgresql.ts`), guaranteeing zero production data replication.

---

## 4. FAIL-CLOSED RUNTIME & MIGRATION GUARDS

To ensure the application refuses to connect to Production if environment variables are misconfigured:

### Runtime Interceptor (`src/lib/prisma.ts`)
```typescript
if (process.env.VERCEL_ENV === "preview") {
  if (!process.env.DATABASE_URL) {
    throw new Error("CONFIGURATION ERROR: VERCEL_ENV is 'preview' but DATABASE_URL is missing.");
  }
  if (process.env.DATABASE_URL.includes("ep-broad-hall-b3dtqwdp")) {
    throw new Error("SECURITY VIOLATION: Vercel Preview environment is configured with Production PostgreSQL endpoint (ep-broad-hall-b3dtqwdp).");
  }
}
```

### Migration Interceptor (`prisma.config.postgresql.ts`)
```typescript
if (process.env.VERCEL_ENV === "preview" || process.env.MIGRATE_ENV === "preview") {
  if (directUrl.includes("ep-broad-hall-b3dtqwdp")) {
    throw new Error("SECURITY VIOLATION: Migration execution targeted Production PostgreSQL endpoint during Preview workflow.");
  }
}
```

### Verification Status
- Verified via `scripts/test-prisma-isolation-guards.ts`: **5 / 5 assertions passed**.
- Preview mode immediately halts execution if configured with `ep-broad-hall-b3dtqwdp`.
