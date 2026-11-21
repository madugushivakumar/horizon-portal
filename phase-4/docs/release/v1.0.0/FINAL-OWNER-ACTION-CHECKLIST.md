# HORIZON PORTAL v1.0.0 — FINAL OWNER ACTION CHECKLIST
## Clear, Itemized Procedures for Outstanding Cloud, Hardware & Release Tasks

**Project:** Horizon Portal  
**Target Release:** `v1.0.0`  
**Date:** 2026-11-20  
**Current Status:** **GRADE B — CONDITIONALLY ACCEPTED**  

---

## 1. SUMMARY OF PENDING OWNER ACTIONS

The project owner must execute the following 4 distinct procedures to complete the release:

```text
[ ] Action 1: Provision Isolated Neon Preview Branch & Run PostgreSQL Migrations
[ ] Action 2: Deploy Vercel Preview Environment & Run Playwright E2E
[ ] Action 3: Conduct Physical Mobile Device Testing (Android & iPhone)
[ ] Action 4: Record Five-Minute Product Walkthrough Video
[ ] Action 5: Authorize and Execute Official v1.0.0 Release Tagging
```

---

## 2. DETAILED ACTION RUNBOOKS

### ACTION 1: Neon Preview Database & PostgreSQL Migration Execution
1. Open Neon Console (`https://console.neon.tech`).
2. Create branch `preview-day20-final` from parent `main`.
3. In branch settings, note compute endpoint (e.g. `ep-preview-day20.neon.tech`).
4. On administrative terminal:
   ```powershell
   cd C:\HorizonPortal-Development\horizon-portal
   $env:DIRECT_URL = "postgresql://cloud_admin:<PASSWORD>@ep-preview-day20.neon.tech/horizon_db?sslmode=require"
   $env:EXPECTED_PREVIEW_ENDPOINT = "ep-preview-day20"
   $env:MIGRATE_ENV = "preview"

   .\scripts\deploy-migrations.ps1
   ```
5. Apply least-privilege role grants:
   ```bash
   psql "$DIRECT_URL" -f scripts/day18-preview-runtime-grants.sql
   ```

---

### ACTION 2: Vercel Preview Deployment & Automated Verification
1. In Vercel Project Settings, add Preview environment variables:
   - `DATABASE_URL`: `postgresql://app_runtime:<PASSWORD>@ep-preview-day20-pooler.neon.tech/horizon_db?sslmode=require`
   - `DIRECT_URL`: Direct connection string.
   - `UPSTASH_REDIS_REST_URL`: Upstash Preview URL.
   - `UPSTASH_REDIS_REST_TOKEN`: Upstash Preview Token.
   - `JWT_SECRET`: Random 64-char string.
2. Deploy Preview:
   ```powershell
   vercel --preview
   ```
3. Run automated hosted E2E verification:
   ```powershell
   $env:BASE_URL = "https://<your-preview-url>.vercel.app"
   npx playwright test
   ```

---

### ACTION 3: Physical Device Testing
Follow [`PHYSICAL-DEVICE-QA.md`](file:///C:/HorizonPortal-Development/horizon-portal/docs/release/v1.0.0/PHYSICAL-DEVICE-QA.md):
1. Open preview URL on physical Android phone (Chrome) and iPhone (Safari).
2. Test login, hamburger menu, Leave submission, and Unified Approval Center (`/approvals`).
3. Verify virtual keyboard behavior in the Rejection Reason modal.
4. Record PASS/FAIL in `PHYSICAL-DEVICE-QA.md`.

---

### ACTION 4: Product Demo Video Recording
Follow [`PRODUCT-DEMO-RECORDING-REPORT.md`](file:///C:/HorizonPortal-Development/horizon-portal/docs/release/v1.0.0/PRODUCT-DEMO-RECORDING-REPORT.md):
1. Open OBS / Loom / Camtasia (1080p, 60fps).
2. Follow the 8-scene script in [`DAY20-FIVE-MINUTE-PRODUCT-DEMO-SCRIPT.md`](file:///C:/HorizonPortal-Development/horizon-portal/docs/day20/DAY20-FIVE-MINUTE-PRODUCT-DEMO-SCRIPT.md).
3. Ensure no personal credentials or browser bookmarks are shown.
4. Save recording to `recordings/v1.0.0-product-demo.mp4`.

---

### ACTION 5: Official v1.0.0 Release Tagging
Once Actions 1–4 are validated:
```powershell
cd C:\HorizonPortal-Development\horizon-portal

# 1. Commit final verified codebase
git add .
git commit -m "feat(release): Horizon Portal v1.0.0 production release"

# 2. Tag official release
git tag -a v1.0.0 -m "Release v1.0.0 — Horizon Portal Production Release"

# 3. Push to remote repository
git push origin day20-final-challenge --tags
```
