# GATE 5.2 — MANUAL CREDENTIAL AUTHORIZATION & PREVIEW INFRASTRUCTURE ACTIVATION GUIDE

**Project:** Horizon Portal  
**Branch:** `day18-preview-validation`  
**Target Environment:** Vercel Preview & Neon Isolated PostgreSQL  
**Date:** November 19, 2026  
**Auditor:** Principal Database Architect & DevSecOps Specialist  

---

## 1. Context & Objective

In Gate 5.1, the infrastructure audit revealed that the Vercel Preview environment shares the same Neon PostgreSQL instance (`ep-broad-hall-b3dtqwdp`) as Production. Because executing state-changing tests against a shared production database violates fundamental safety protocols, tests G5-BLK-001 through G5-BLK-007 were held BLOCKED.

Gate 5.2 defines the manual, human-authorized sequence required to provision a dedicated Neon Preview branch and decouple the Vercel Preview environment variables from Production.

---

## 2. Step 1: Provision Isolated Neon PostgreSQL Branch

### Option A: Neon Web Console (Recommended & Safest)
1. Navigate to the [Neon Console](https://console.neon.tech/).
2. Select the project: `horizon-portal-db` (or corresponding project).
3. In the left navigation sidebar, click on **Branches**.
4. Click **Create Branch**:
   - **Branch Name:** `horizon-portal-preview-isolated`
   - **Parent Branch:** `main`
   - **Branch Type:** Select **Empty** (Schema only / zero data cloned) OR clone from `main` if synthetic fixtures are to be migrated. *Note: An empty schema branch is safest to ensure zero production contamination.*
   - **Compute Endpoint:** Shared compute (0.25 CU minimum).
5. Once created, click on the **Dashboard** / **Connection Details** for the new branch `horizon-portal-preview-isolated`.
6. Record the following connection strings (DO NOT share these in public logs):
   - **Pooled Connection String (`DATABASE_URL`):** Includes `-pooler` in the host.
   - **Direct Connection String (`DIRECT_URL`):** Direct connection on port 5432 (without `-pooler`).

### Option B: Neon API Token
If using programmatic CLI provisioning:
1. Go to **Neon Console** -> **Account Settings** -> **API Keys**.
2. Click **Generate new API key**.
3. Label it: `horizon-portal-gate52-preview-provisioner`.
4. Copy the generated key.
5. In your local terminal, export:
   ```powershell
   $env:NEON_API_KEY="<your-generated-token>"
   ```

---

## 3. Step 2: Configure Vercel Preview Environment Variables

1. Navigate to the [Vercel Dashboard](https://vercel.com/).
2. Select the project: `horizon-portal` (Team: `shivakumarmudiraj565-5361s-projects`).
3. Go to **Settings** -> **Environment Variables**.
4. Locate `DATABASE_URL`:
   - Click the three dots `...` -> **Edit**.
   - **Uncheck** "Preview" so it is restricted ONLY to **Production** (and Development if desired).
   - Click **Save**.
5. Add the Preview-specific `DATABASE_URL`:
   - Click **Add New Variable**.
   - **Key:** `DATABASE_URL`
   - **Value:** `<new-neon-preview-pooled-connection-string>`
   - **Environment:** Check **Preview ONLY** (Uncheck Production and Development).
   - Click **Save**.
6. Repeat the exact same decoupling for `DIRECT_URL`:
   - Restrict existing `DIRECT_URL` to **Production**.
   - Add new `DIRECT_URL` pointing to the preview direct host, scoped to **Preview ONLY**.
7. Confirm that `AUTH_SECRET`, `NEXTAUTH_SECRET`, `UPSTASH_REDIS_REST_URL`, and `UPSTASH_REDIS_REST_TOKEN` are active across Preview.

---

## 4. Step 3: Trigger Vercel Preview Redeployment

Once the Preview environment variables are updated:
1. In the Vercel Dashboard, go to **Deployments**.
2. Locate the latest deployment on branch `day18-preview-validation` (Commit `ab466e84e778cc20f1bb77b4c82e56967436c2c7`).
3. Click the three dots `...` -> **Redeploy**.
4. Leave "Use existing Build Cache" unchecked to ensure fresh variable evaluation.
5. Wait for the deployment to finish (`Ready`).

---

## 5. Security & Isolation Invariants

- **Production Safety:** Production branch `main` and production host `ep-broad-hall-b3dtqwdp` must never receive migration commands or test mutations during this operation.
- **Local SQLite Preservation:** `prisma/dev.db` must remain at exactly 3,637,248 bytes.
- **Zero Secret Exposure:** Passwords and tokens must never be written to Git, chat messages, or public markdown reports.
