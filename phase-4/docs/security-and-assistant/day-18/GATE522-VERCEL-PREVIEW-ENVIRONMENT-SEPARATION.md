# GATE 5.2.2 — VERCEL PREVIEW ENVIRONMENT SEPARATION AUDIT
## HORIZON PORTAL — VERCEL ENVIRONMENT VARIABLE SCOPING & PROJECT ISOLATION

---

## 1. VERCEL ENVIRONMENT VARIABLE SCOPES

In Vercel's platform architecture, environment variables can be scoped to three distinct target environments:
1. **Production:** Deployed from `main` branch.
2. **Preview:** Deployed from pull requests and non-default branches (e.g., `day18-preview-validation`).
3. **Development:** Downloaded via `vercel env pull` for local CLI execution.

### Environment Variable Scope Audit Matrix

| Variable Name | Production Scope Target | Preview Scope Required | Current Project Risk | Remediation Action |
|---|---|---|---|---|
| `DATABASE_URL` | Neon `main` (ep-broad-hall-b3dtqwdp) | Neon `horizon-portal-preview-isolated` | Shared if checkboxes include Preview | Uncheck Preview on Production string; Add Preview-only string |
| `DIRECT_URL` | Neon `main` direct port 5432 | Neon `horizon-portal-preview-isolated` direct | Shared if checkboxes include Preview | Uncheck Preview on Production direct string; Add Preview-only direct string |
| `UPSTASH_REDIS_REST_URL` | Upstash Production Instance | Upstash Preview / Shared Cluster | Low (Prefix isolated) | Keep or provision dedicated Preview DB |
| `UPSTASH_REDIS_REST_TOKEN`| Upstash Production Token | Upstash Preview Token | Low (Prefix isolated) | Match Redis instance scope |
| `RATE_LIMIT_PREFIX` | Default (`rl:auth`) | Auto (`rl:preview:auth`) | Zero risk | Automatically isolated via `VERCEL_ENV` |
| `AUTH_SECRET` | Production Cryptographic Secret | Independent Preview Secret | Medium | Rotate or provide dedicated preview secret |

---

## 2. AUTOMATIC ENVIRONMENT DETECTION

The Horizon Portal application code automatically detects the deployment tier via built-in Vercel system environment variables:
- `process.env.VERCEL_ENV`: Populated with `"preview"`, `"production"`, or `"development"`.
- `process.env.VERCEL`: Set to `"1"` on all Vercel deployments.
- `process.env.VERCEL_GIT_COMMIT_REF`: Set to branch name (`day18-preview-validation`).

These variables are leveraged by:
1. `src/lib/auth/session.ts` to enforce `secure: true` session cookies in Preview.
2. `src/lib/security/rate-limit/config.ts` to apply `rl:preview:auth` namespace isolation.
3. `src/lib/prisma.ts` to enforce fail-closed rejection of `ep-broad-hall-b3dtqwdp`.

---

## 3. OWNER DASHBOARD ACTIONS TO FINALIZE SEPARATION

The repository owner must configure the following in the Vercel Dashboard (`Settings -> Environment Variables`):

1. **Edit existing `DATABASE_URL`:**
   - Uncheck **Preview**. (Keep Production checked).
2. **Add new `DATABASE_URL`:**
   - Check **Preview** only.
   - Value: Dedicated Neon Preview pooled connection string.
3. **Edit existing `DIRECT_URL`:**
   - Uncheck **Preview**. (Keep Production checked).
4. **Add new `DIRECT_URL`:**
   - Check **Preview** only.
   - Value: Dedicated Neon Preview direct connection string.
5. **Trigger Redeployment:**
   - In Vercel Deployments, redeploy the `day18-preview-validation` commit with "Redeploy with existing build cache" unchecked.
