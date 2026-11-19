# GATE 5.3 — REMAINING RISKS & OWNER ACTION REGISTER
## HORIZON PORTAL — POST-AUDIT HANDOFF & CLOUD CONFIGURATION GUIDE

---

## 1. RESIDUAL RISK ANALYSIS

| Risk ID | Description | Severity | Likelihood | Impact | Code Mitigation Status |
|---|---|---|---|---|---|
| **RSK-01** | Preview connects to Production PostgreSQL if owner fails to scope variables | HIGH | LOW | HIGH | **MITIGATED IN CODE:** `src/lib/prisma.ts` throws fatal runtime `SECURITY VIOLATION` if `ep-broad-hall-b3dtqwdp` is targeted in Preview. |
| **RSK-02** | Accidental migration execution against Production database during preview deployment | CRITICAL | LOW | CRITICAL | **MITIGATED IN CONFIG:** `prisma.config.postgresql.ts` halts execution if `ep-broad-hall-b3dtqwdp` is targeted in Preview. |
| **RSK-03** | Upstash Redis free tier quota exhaustion during high-volume brute-force attacks | LOW | MEDIUM | LOW | **MITIGATED IN CODE:** `failureMode: "fail-open"` allows legitimate employee login requests to proceed even if Redis is unreachable. |
| **RSK-04** | Cross-employee horizontal IDOR attempts on payroll or leave endpoints | CRITICAL | LOW | CRITICAL | **MITIGATED IN CODE:** Strict session employee ID comparison rejects unauthorized requests with HTTP 403 and zero data return. |
| **RSK-05** | Sensitive field exposure via new API endpoints added in future phases | MEDIUM | LOW | HIGH | **MITIGATED IN TESTS:** Centralized Prisma select helpers and regression test `test-privacy-leakage.ts` assert 0 leaks. |

---

## 2. STEP-BY-STEP OWNER ACTIONS

Because cloud credentials (`NEON_API_KEY`, `VERCEL_TOKEN`, `UPSTASH_REDIS_REST_TOKEN`) are withheld from the local runner for security, the repository owner must complete the following actions:

### Step 1: Neon Console (Branch Provisioning)
1. Navigate to **Neon Console** at `https://console.neon.tech/`.
2. Select project: `horizon-portal-db`.
3. Go to **Branches** -> click **New Branch**.
4. Name the branch: `horizon-portal-preview-isolated`.
5. Select: **Empty / Schema-only** root branch (or clone schema without data).
6. Copy the two generated connection strings (Pooled and Direct).

### Step 2: Upstash Console (Dedicated Preview Redis)
1. Navigate to **Upstash Console** at `https://console.upstash.com/redis`.
2. Click **Create Database**.
3. Name: `horizon-portal-preview-redis` (Region: `ap-southeast-1` Singapore).
4. Copy the REST URL and REST Token.

### Step 3: Vercel Project Settings (Variable Scoping)
1. Navigate to **Vercel Dashboard** -> select `horizon-portal` project -> **Settings** -> **Environment Variables**.
2. Locate `DATABASE_URL`:
   - Click **Edit** -> **Uncheck Preview** (leaving only Production and Development checked) -> Save.
   - Click **Add New Variable** -> Key: `DATABASE_URL` -> Value: `<Neon-Preview-Pooled-URI>` -> Select **Preview ONLY** -> Save.
3. Locate `DIRECT_URL`:
   - Click **Edit** -> **Uncheck Preview** (leaving only Production and Development checked) -> Save.
   - Click **Add New Variable** -> Key: `DIRECT_URL` -> Value: `<Neon-Preview-Direct-URI>` -> Select **Preview ONLY** -> Save.
4. Locate / Add Upstash Redis variables:
   - Key: `UPSTASH_REDIS_REST_URL` -> Value: `<Preview-Upstash-URL>` -> Select **Preview ONLY** -> Save.
   - Key: `UPSTASH_REDIS_REST_TOKEN` -> Value: `<Preview-Upstash-Token>` -> Select **Preview ONLY** -> Save.

### Step 4: Seed Fixtures & Trigger Redeployment
1. Execute migration against the new preview branch:
   ```powershell
   $env:DIRECT_URL="<Neon-Preview-Direct-URI>"
   npx prisma migrate deploy --config prisma.config.postgresql.ts
   ```
2. In Vercel Deployments, redeploy the latest commit on `day18-preview-validation`.
3. Execute the 7 live state-changing tests against the live Preview deployment URL.
