# GATE 5.3 — REMAINING RISKS & OWNER ACTION REGISTER
## HORIZON PORTAL — POST-AUDIT HANDOFF & RISK MANAGEMENT REGISTER

---

## 1. RESIDUAL RISK ANALYSIS

| Risk ID | Risk Description | Severity | Likelihood | Impact | Built-in Mitigation / Status |
|---|---|---|---|---|---|
| **RSK-01** | Preview environment connects to Production PostgreSQL if owner omits preview environment variable separation | HIGH | LOW | HIGH | **MITIGATED IN CODE:** Fail-closed check in `src/lib/prisma.ts` throws a fatal error if `VERCEL_ENV === "preview"` targets `ep-broad-hall-b3dtqwdp`. |
| **RSK-02** | Accidental migration execution against Production database during preview deployment | CRITICAL | LOW | CRITICAL | **MITIGATED IN CONFIG:** Fail-closed guard in `prisma.config.postgresql.ts` halts migrations if `VERCEL_ENV === "preview"` targets `ep-broad-hall-b3dtqwdp`. |
| **RSK-03** | Upstash Redis free tier quota exhaustion during high-volume brute-force attacks | LOW | MEDIUM | LOW | **MITIGATED IN SERVICE:** `failureMode: "fail-open"` allows legitimate employee login requests to proceed even if Redis is unreachable. |
| **RSK-04** | Cross-employee horizontal IDOR attempts on payroll or leave endpoints | CRITICAL | LOW | CRITICAL | **MITIGATED IN ROUTES:** Strict session employee ID comparison rejects unauthorized requests with HTTP 403 and zero data return. |
| **RSK-05** | Sensitive field exposure via new API endpoints added in future phases | MEDIUM | LOW | HIGH | **MITIGATED IN ARCHITECTURE:** Centralized Prisma select helpers and regression test `test-privacy-leakage.ts` assert 0 leaks. |

---

## 2. OWNER DASHBOARD ACTIONS (STEP-BY-STEP HANDOFF)

Because cloud dashboard actions require human owner authentication (`NEON_API_KEY` and `VERCEL_TOKEN` are not stored in the repository to prevent credential theft), the repository owner must execute the following actions:

### Step 1: Neon Console (5 Minutes)
1. Navigate to **Neon Console** at `https://console.neon.tech/`.
2. Open the `horizon-portal-db` project.
3. In the sidebar, select **Branches** -> click **New Branch**.
4. Name the branch: `horizon-portal-preview-isolated`.
5. Select branch type: **Empty / Schema-only** (or clone schema from `main` without copying data).
6. Copy the two generated connection strings (Pooled and Direct).

### Step 2: Vercel Project Settings (5 Minutes)
1. Navigate to **Vercel Dashboard** -> select `horizon-portal` project -> **Settings** -> **Environment Variables**.
2. Locate `DATABASE_URL`:
   - Click the three dots -> **Edit**.
   - **Uncheck Preview** (leaving only Production and Development checked).
   - Click **Save**.
3. Click **Add New Variable**:
   - Key: `DATABASE_URL`
   - Value: `<Neon-Preview-Pooled-Connection-String>`
   - Environment: Select **Preview** ONLY.
   - Click **Save**.
4. Locate `DIRECT_URL`:
   - Click the three dots -> **Edit**.
   - **Uncheck Preview** (leaving only Production and Development checked).
   - Click **Save**.
5. Click **Add New Variable**:
   - Key: `DIRECT_URL`
   - Value: `<Neon-Preview-Direct-Connection-String>`
   - Environment: Select **Preview** ONLY.
   - Click **Save**.

### Step 3: Seed Synthetic Preview Fixtures & Redeploy (3 Minutes)
1. Run migration against the new preview branch:
   ```bash
   DIRECT_URL="<Neon-Preview-Direct-Connection-String>" npx prisma migrate deploy --config prisma.config.postgresql.ts
   ```
2. Trigger Preview redeployment in Vercel to activate the new environment variables.
3. All 7 state-changing penetration tests (G5-BLK-001 through G5-BLK-007) can now be safely executed against the live preview URL with zero risk to production.
