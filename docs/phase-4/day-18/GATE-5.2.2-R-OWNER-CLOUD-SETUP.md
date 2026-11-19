# GATE-5.2.2-R — OWNER CLOUD SETUP COMPLETION GUIDE & STATUS
## HORIZON PORTAL — DEVSECOPS & CLOUD ARCHITECTURE HANDOFF

---

## 1. EXECUTIVE MISSION & AUTHENTICATION BOUNDARY

| Field | Detail |
|---|---|
| **Audit Date** | November 19, 2026 |
| **Auditor Role** | Senior DevSecOps Engineer & Release-Gate Owner |
| **Target Application** | Horizon Portal (Next.js 16.4.6, React 19.3.0, Prisma 6.19.3) |
| **Branch / Commit SHA** | `day18-preview-validation` / `ab466e84e778cc20f1bb77b4c82e56967436c2c7` |
| **Authentication Boundary**| Cloud credentials (`NEON_API_KEY`, `VERCEL_TOKEN`, `UPSTASH_REDIS_REST_TOKEN`) are withheld from local runner environment for security |
| **Current Gate Status** | **CONDITIONAL PASS — FAIL-CLOSED GUARDS IMPLEMENTED; OWNER DASHBOARD ACTIONS PENDING** |

---

## 2. PRE-EXISTING CLOUD STATUS AUDIT

An independent audit of the local process environment and project configurations established:
1. `NEON_API_KEY`: **UNSET** (Owner account required for branch provisioning API).
2. `VERCEL_TOKEN`: **UNSET** (Owner account required for project environment variable API).
3. `UPSTASH_REDIS_REST_TOKEN`: **UNSET** in process environment (Present only in application `.env` for local mock/shared instance).
4. `ep-broad-hall-b3dtqwdp`: Confirmed as the historical Neon **compute endpoint ID**, not a branch ID.
5. In accordance with Section 3.4 (Human Approval Boundary), automated execution cannot and will not fabricate cloud creation. Precise owner navigation instructions are provided below.

---

## 3. OWNER ACTION 1: NEON CONSOLE (BRANCH CREATION)

**Objective:** Provision an independent, schema-only root branch for Preview testing without duplicating Production HR records.

### Navigation & Actions:
1. Navigate to **Neon Console**: `https://console.neon.tech/app/projects`.
2. Select Project: `horizon-portal-db` (Region: AWS `ap-southeast-1` Singapore).
3. Select **Branches** in the left navigation sidebar.
4. Click **New Branch**:
   - **Branch Name:** `horizon-portal-preview-isolated`
   - **Branch Type:** Select **Empty / Schema-only** (or root branch without parent data).
   - *Security Requirement:* Do **not** select `main` as a data-bearing parent branch.
5. Click **Create Branch**.
6. Under **Connection Details**, record the two branch-specific connection URIs:
   - **Pooled Runtime Connection (`DATABASE_URL`):**
     `postgresql://[user]:[password]@ep-preview-[id]-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&pgbouncer=true`
   - **Direct Migration Connection (`DIRECT_URL`):**
     `postgresql://[user]:[password]@ep-preview-[id].c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require`

---

## 4. OWNER ACTION 2: UPSTASH CONSOLE (DEDICATED REDIS)

**Objective:** Eliminate shared quota and DoS risks by provisioning an independent Upstash Redis database for Preview rate limiting.

### Navigation & Actions:
1. Navigate to **Upstash Console**: `https://console.upstash.com/redis`.
2. Click **Create Database**:
   - **Name:** `horizon-portal-preview-redis`
   - **Region:** `ap-southeast-1` (Singapore — co-located with Neon).
   - **Type:** Serverless.
3. Click **Create**.
4. In the database overview tab, locate **REST API**:
   - Copy `UPSTASH_REDIS_REST_URL`.
   - Copy `UPSTASH_REDIS_REST_TOKEN`.

---

## 5. OWNER ACTION 3: VERCEL DASHBOARD (VARIABLE SCOPING)

**Objective:** Bind dedicated Preview credentials exclusively to the Preview environment scope, ensuring zero exposure to Production.

### Navigation & Actions:
1. Navigate to **Vercel Dashboard**: `https://vercel.com/` -> select `horizon-portal` project.
2. Go to **Settings** -> **Environment Variables**.
3. **Decouple `DATABASE_URL`:**
   - Locate the existing `DATABASE_URL`.
   - Click **Edit** -> **Uncheck Preview** (keep Production and Development checked) -> Save.
   - Click **Add New Variable**:
     - Key: `DATABASE_URL`
     - Value: `<Neon-Preview-Pooled-URI>`
     - Environments: Select **Preview ONLY** -> Save.
4. **Decouple `DIRECT_URL`:**
   - Locate the existing `DIRECT_URL`.
   - Click **Edit** -> **Uncheck Preview** (keep Production and Development checked) -> Save.
   - Click **Add New Variable**:
     - Key: `DIRECT_URL`
     - Value: `<Neon-Preview-Direct-URI>`
     - Environments: Select **Preview ONLY** -> Save.
5. **Add Dedicated Preview Redis Variables:**
   - Click **Add New Variable**:
     - Key: `UPSTASH_REDIS_REST_URL`
     - Value: `<Preview-Upstash-REST-URL>`
     - Environments: Select **Preview ONLY** -> Save.
   - Click **Add New Variable**:
     - Key: `UPSTASH_REDIS_REST_TOKEN`
     - Value: `<Preview-Upstash-REST-Token>`
     - Environments: Select **Preview ONLY** -> Save.
6. **Trigger Deployment:**
   - Go to **Deployments** tab -> find latest deployment on branch `day18-preview-validation` -> click **Redeploy**.

---

## 6. COMPLETION EVIDENCE CHECKLIST FOR RE-VERIFICATION

When owner actions are complete, the following authoritative evidence artifacts must be captured:
- [ ] Neon Preview Branch ID (e.g. `br-preview-xxxx`)
- [ ] Neon Preview Compute Endpoint ID (e.g. `ep-preview-xxxx`)
- [ ] Upstash Preview Database ID & Endpoint Fingerprint
- [ ] Vercel Deployment ID for redeployed commit
- [ ] Read-only row-count verification confirming 0 production HR rows in Preview DB
