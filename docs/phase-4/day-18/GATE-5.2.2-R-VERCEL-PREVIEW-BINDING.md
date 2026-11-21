# GATE-5.2.2-R — VERCEL PREVIEW ENVIRONMENT BINDING REPORT
## HORIZON PORTAL — VERCEL ENVIRONMENT VARIABLE SCOPES & DEPLOYMENT PROTECTION

---

## 1. VERCEL ENVIRONMENT SCOPE AUDIT

Vercel provides three distinct execution tiers for environment variables:
1. **Production:** Applied to deployments from the primary branch (`main`).
2. **Preview:** Applied to deployments from non-default branches (`day18-preview-validation`) and pull requests.
3. **Development:** Downloaded for local execution via `vercel env pull`.

### Variable Scope Assessment

| Variable Name | Required Scope | Target Infrastructure | Shared Risk |
|---|---|---|---|
| `DATABASE_URL` | Preview ONLY | Dedicated Neon Preview Branch (`pgbouncer=true`) | High: Queries mutate Production PostgreSQL if shared |
| `DIRECT_URL` | Preview ONLY | Dedicated Neon Preview Direct (Port 5432) | Critical: Migrations alter Production schema if shared |
| `UPSTASH_REDIS_REST_URL` | Preview ONLY | Dedicated Preview Redis Database | Medium: Shared command quota |
| `UPSTASH_REDIS_REST_TOKEN`| Preview ONLY | Dedicated Preview Redis Token | Medium: Shared authentication |
| `RATE_LIMIT_PREFIX` | Preview ONLY | `rl:preview:auth` | Zero: Scoped dynamically by `VERCEL_ENV` |
| `AUTH_SECRET` | Preview ONLY | Dedicated Preview Cryptographic Secret | Medium: Session token interchangeability |

---

## 2. DEPLOYMENT PROTECTION & ACCESS RULES

1. **Deployment Protection Status:**
   - Vercel Preview Deployments for `horizon-portal` are protected by Vercel Authentication (SSO / Deployment Protection Gate).
   - Under Section 3.1 & 7.6 of the execution standard, Deployment Protection must **never** be disabled to simplify testing.
   - External automated HTTP probes must provide the authorized Vercel protection bypass token or execute via authenticated test sessions.
2. **Production Preservation:**
   - Production environment variables must remain strictly untouched during Preview reconfiguration.
   - When decoupling `DATABASE_URL`, unchecking "Preview" on the Production string leaves the Production connection string intact for `main`.

---

## 3. STATUS & NEXT STEPS

- **Application Configuration Ready:** Dynamic runtime routing in `src/lib/prisma.ts` detects `process.env.VERCEL_ENV === "preview"` and enforces preview behavior.
- **Console Binding:** **PENDING OWNER DASHBOARD ACTION** (Uncheck Preview on Production variables; add Preview-scoped connection strings).
