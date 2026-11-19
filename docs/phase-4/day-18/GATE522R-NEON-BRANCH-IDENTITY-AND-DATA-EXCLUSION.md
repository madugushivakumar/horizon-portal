# GATE 5.2.2-R — NEON PREVIEW BRANCH IDENTITY & DATA EXCLUSION REPORT
## HORIZON PORTAL — POSTGRESQL ARCHITECTURE & CLOUD SAFETY RECONCILIATION

---

## 1. NEON INFRASTRUCTURE ARCHITECTURE & METADATA RECONCILIATION

### Hostname Prefix vs Branch ID Clarification
- In previous audit reports, `ep-broad-hall-b3dtqwdp` was frequently referred to as an "endpoint host". It is critical to state that `ep-broad-hall-b3dtqwdp` is a **Neon compute endpoint ID / hostname prefix**, *not* a branch ID.
- Neon infrastructure is hierarchically structured:
  - **Project:** `horizon-portal-db` (Region: `aws-ap-southeast-1`, Singapore)
  - **Branches:** `main` (Production Branch ID: e.g. `br-main-...`), `horizon-portal-preview-isolated` (Targeted Preview Branch ID)
  - **Endpoints:** Each branch has one or more compute endpoints (e.g., `ep-broad-hall-b3dtqwdp` is attached to `main`).
  - **Databases:** `neondb`
  - **Roles:** `neondb_owner`

### Production vs Preview Specification

| Infrastructure Identity | Production (Authoritative Baseline) | Preview Target Specification | Current Status |
|---|---|---|---|
| **Neon Project Name** | `horizon-portal-db` | `horizon-portal-db` | Existing |
| **Project Region** | `aws-ap-southeast-1` | `aws-ap-southeast-1` | Existing |
| **Branch Name** | `main` | `horizon-portal-preview-isolated` | Target Specification |
| **Branch Type** | Primary Production Branch | Root / Schema-Only Branch | Pending Owner Creation |
| **Endpoint Hostname Prefix** | `ep-broad-hall-b3dtqwdp` | Dedicated Preview Endpoint (e.g., `ep-preview-...`) | Pending Owner Binding |
| **Database Name** | `neondb` | `neondb` | Target |
| **Data Content** | Baseline Production HR Data | **100% EXCLUDED (Zero production rows)** | Target Specification |

---

## 2. PRODUCTION DATA EXCLUSION PRINCIPLE

Under GDPR, SOC 2, and enterprise HR security baselines:
- Real employee records (salaries, bank accounts, PAN numbers, tax IDs, performance ratings) must never be replicated into Preview testing environments.
- Standard Neon branch creation forks the storage pages of the parent branch, duplicating all confidential production HR rows.
- **Enforced Strategy:** The Preview branch must be initialized as an **empty / schema-only root branch** where application tables, enums, indices, and constraints are created via `prisma migrate deploy`, populated exclusively with synthetic fixtures.
- **Fail-Closed Code Enforcement:**
  - `src/lib/prisma.ts` enforces that if `VERCEL_ENV === "preview"` detects the Production endpoint (`ep-broad-hall-b3dtqwdp`), execution immediately halts with a fatal security violation.

---

## 3. OWNER ACTION FOR NEON PREVIEW ACTIVATION

Because `NEON_API_KEY` is withheld from the local execution environment for credential security, the repository owner must execute the following actions in the Neon Console:

1. **Access Console:** Log in to `https://console.neon.tech/` and select `horizon-portal-db`.
2. **Create Schema-Only Branch:**
   - Go to **Branches** -> **New Branch**.
   - Name: `horizon-portal-preview-isolated`.
   - Select: **Empty / Schema-only** (or initialize clean root branch).
3. **Capture Connection Strings:**
   - Pooled Connection: `postgresql://[role]:[password]@[preview-endpoint]-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&pgbouncer=true`
   - Direct Connection: `postgresql://[role]:[password]@[preview-endpoint].c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require`
4. **Deploy Schema:**
   - Execute migrations using the direct connection:
     ```powershell
     $env:DIRECT_URL="postgresql://[role]:[password]@[preview-endpoint].c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
     npx prisma migrate deploy --config prisma.config.postgresql.ts
     ```
