# GATE 5.2.2-R — VERCEL PREVIEW ENVIRONMENT BINDING REPORT
## HORIZON PORTAL — VERCEL VARIABLE SCOPING & DEPLOYMENT PROTECTION AUDIT

---

## 1. ENVIRONMENT VARIABLE SCOPE ARCHITECTURE

Vercel provides explicit environment variable scoping across three distinct targets:
1. **Production:** Deployed from the default branch (`main`).
2. **Preview:** Deployed from feature/remediation branches (e.g., `day18-preview-validation`) and pull requests.
3. **Development:** Pulled locally via `vercel env pull`.

### Scope Audit & Target Separation

| Environment Variable | Production Target | Preview Required Target | Scope Status in Vercel | Risk if Shared |
|---|---|---|---|---|
| `DATABASE_URL` | Neon `main` Pooled (`ep-broad-hall-b3dtqwdp`) | Dedicated Preview Branch Pooled | **CHECKBOX SHARED (Historically)** | Preview queries hit Production DB |
| `DIRECT_URL` | Neon `main` Direct (Port 5432) | Dedicated Preview Branch Direct | **CHECKBOX SHARED (Historically)** | Preview migrations alter Production DB |
| `UPSTASH_REDIS_REST_URL` | Upstash Production Instance | Dedicated Upstash Preview Instance | Shared Cluster | Risk of rate-limit quota exhaustion |
| `UPSTASH_REDIS_REST_TOKEN`| Upstash Production Token | Dedicated Upstash Preview Token | Shared Cluster | Shared authentication scope |
| `RATE_LIMIT_PREFIX` | Default (`rl:auth`) | Auto (`rl:preview:auth`) | Dynamically Scoped | Partitioned at key level |
| `AUTH_SECRET` | Production Cryptographic Secret | Dedicated Preview Secret | Shared/Production | Session spoofing risk |

---

## 2. VERCEL DEPLOYMENT PROTECTION STATUS

- Vercel Preview Deployments for the `horizon-portal` project utilize standard deployment protection (SSO / password gate or preview token).
- Standard security policy mandates that deployment protection must **not** be disabled for testing convenience.
- Automated API tests run against the deployment must provide the Vercel protection bypass token (`x-vercel-protection-bypass`) or authenticate via authorized session headers.

---

## 3. OWNER DASHBOARD RECONFIGURATION PROCEDURE

To enforce full environment isolation in Vercel Project Settings:

1. **Open Vercel Dashboard:** Navigate to `https://vercel.com/` -> `horizon-portal` -> **Settings** -> **Environment Variables**.
2. **Decouple `DATABASE_URL`:**
   - Locate existing `DATABASE_URL`.
   - Click **Edit** -> **Uncheck Preview** (keep Production and Development checked) -> Save.
   - Click **Add New Variable** -> Key: `DATABASE_URL` -> Value: `<Dedicated-Preview-Pooled-URI>` -> Select **Preview ONLY** -> Save.
3. **Decouple `DIRECT_URL`:**
   - Locate existing `DIRECT_URL`.
   - Click **Edit** -> **Uncheck Preview** (keep Production and Development checked) -> Save.
   - Click **Add New Variable** -> Key: `DIRECT_URL` -> Value: `<Dedicated-Preview-Direct-URI>` -> Select **Preview ONLY** -> Save.
4. **Decouple Upstash Redis:**
   - Add Preview-scoped `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` pointing to a dedicated Preview Redis database.
5. **Redeploy:**
   - Trigger a redeployment of branch `day18-preview-validation` in Vercel Deployments.
