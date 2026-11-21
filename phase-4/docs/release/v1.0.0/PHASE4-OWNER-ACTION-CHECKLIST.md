# PHASE 4 OWNER ACTION CHECKLIST
## Pre-Production Provisioning, Cloud Execution, Physical QA & Release Authorizations

**Project:** Horizon Portal — HR Operations & Enterprise Management Platform  
**Target Release:** `v1.0.0`  
**Phase:** Phase 4 — Release Governance  
**Workspace:** `C:\HorizonPortal-Development\horizon-portal`  
**Active Branch:** `day20-final-challenge`  
**Evaluation Date:** 2026-11-20  
**Lead Roles:** Release Manager, DevOps Cloud Engineer, Quality Architect  

---

## 1. OVERVIEW OF OWNER RESPONSIBILITIES

In accordance with Sections 3.4, 3.5, 16, and 20 of the Master Execution Prompt, the automated engineering environment strictly halts at external infrastructure boundaries. Cloud actions incurring costs, mutating database branches, creating Git tags, pushing commits, publishing recordings, or testing on physical hardware require **explicit owner action or authorization**.

---

## 2. ITEMIZED OWNER ACTION REGISTER

### Action 1: Provision Isolated Neon PostgreSQL Preview Branch
- **Why It Is Needed:** Enables running PostgreSQL database migrations without risking or altering the live Neon Production database (`ep-broad-hall-b3dtqwdp`).
- **Exact Prerequisite:** Access to Neon Web Console (`https://console.neon.tech`).
- **Exact Console Operations:**
  1. Log into Neon Console -> Project **Horizon Portal**.
  2. Navigate to **Branches** -> Click **New Branch**.
  3. Enter Branch Name: `preview-day20-final`. Parent: `main`.
  4. In the branch dashboard, obtain:
     - Direct Migration URL: `DIRECT_URL="postgresql://migration_admin:<PASSWORD>@ep-preview-day20.neon.tech/horizon_db?sslmode=require"`
     - Runtime Pooler URL: `DATABASE_URL="postgresql://app_runtime:<PASSWORD>@ep-preview-day20.neon.tech/horizon_db?sslmode=require"`
- **Expected Result:** An isolated disposable PostgreSQL branch active on Neon.
- **Evidence to Save:** Branch name, compute endpoint ID, and connection host.
- **Risk:** Zero risk to Production (isolated branch).
- **Explicit Authorization Required:** **YES**.

---

### Action 2: Apply Migrations & Role Grants to Preview Branch
- **Why It Is Needed:** Applies `20261117000000_init_postgresql` and `20261120180000_add_corporate_expense_authorizations` to create the schema and `corporate_expense_authorizations` table on PostgreSQL.
- **Exact Prerequisite:** Action 1 complete; `DIRECT_URL` exported to local terminal.
- **Exact Command:**
  ```powershell
  Set-Location "C:\HorizonPortal-Development\horizon-portal"
  $env:DIRECT_URL="<YOUR_PREVIEW_DIRECT_URL>"
  powershell -ExecutionPolicy Bypass -File scripts/deploy-migrations.ps1
  ```
- **Expected Result:** `All migrations have been successfully applied.` `_prisma_migrations` contains 2 applied migrations.
- **Evidence to Save:** Terminal output log saved to `docs/release/v1.0.0/evidence/preview-migration.log`.
- **Risk:** Zero risk to Production.
- **Explicit Authorization Required:** **YES**.

---

### Action 3: Configure Vercel Preview Environment Variables & Deploy
- **Why It Is Needed:** Deploys branch `day20-final-challenge` to a live Vercel Preview URL bound to the Preview database and Upstash Redis.
- **Exact Prerequisite:** Actions 1 & 2 complete; Upstash Preview Redis instance provisioned.
- **Exact Console Operations:**
  1. In Vercel Project Settings -> **Environment Variables** (Scope: **Preview** only):
     - `DATABASE_URL`: Preview Neon pooler connection string.
     - `DIRECT_URL`: Preview Neon direct connection string.
     - `AUTH_SECRET`: Dedicated 32-byte hexadecimal secret key.
     - `UPSTASH_REDIS_REST_URL`: Upstash Preview endpoint.
     - `UPSTASH_REDIS_REST_TOKEN`: Upstash Preview token.
  2. Authorize pushing branch `day20-final-challenge` to GitHub remote:
     ```powershell
     git -C "C:\HorizonPortal-Development\horizon-portal" push origin day20-final-challenge
     ```
- **Expected Result:** Vercel automatically deploys preview URL: `https://horizon-portal-preview-xyz.vercel.app`.
- **Evidence to Save:** Deployment URL, Vercel build log ID.
- **Risk:** Zero risk to Production domain.
- **Explicit Authorization Required:** **YES**.

---

### Action 4: Execute Hosted Playwright E2E Suite & 4-Role Verification
- **Why It Is Needed:** Validates the five mandatory business journeys and four user roles against live hosted infrastructure.
- **Exact Prerequisite:** Action 3 complete (live Preview URL accessible).
- **Exact Command:**
  ```powershell
  Set-Location "C:\HorizonPortal-Development\horizon-portal"
  $env:PLAYWRIGHT_BASE_URL="https://horizon-portal-preview-xyz.vercel.app"
  npx playwright test --config=playwright.config.ts --project="Desktop Chrome"
  ```
- **Expected Result:** All 17 E2E tests pass against the live hosted preview.
- **Evidence to Save:** HTML report generated in `playwright-report/index.html`.
- **Risk:** Minimal (executes against isolated preview test data).
- **Explicit Authorization Required:** **NO** (once Preview is provisioned).

---

### Action 5: Perform Hands-On Physical Device Touch QA
- **Why It Is Needed:** Verifies touchscreen ergonomics, mobile virtual keyboard behavior, and WebKit Safari rendering on real smartphone hardware.
- **Exact Prerequisite:** Action 3 complete; physical Android and/or iPhone device with mobile browser.
- **Exact Protocol:** Follow the 16-point checklist in `docs/release/v1.0.0/PHYSICAL-DEVICE-QA.md`.
- **Expected Result:** Smooth touch interactions, zero horizontal scroll, legible dialogs.
- **Evidence to Save:** Completed checklist and hardware photos/screenshots.
- **Risk:** Zero risk.
- **Explicit Authorization Required:** **NO** (owner testing).

---

### Action 6: Record & Verify Official Five-Minute Product Demo Video
- **Why It Is Needed:** Satisfies official programme submission requirement.
- **Exact Prerequisite:** Action 3 complete; camera and microphone setup.
- **Exact Protocol:**
  1. Follow `docs/day20/DAY20-FIVE-MINUTE-PRODUCT-DEMO-SCRIPT.md`:
     - 0:00–1:00: Presenter on camera explaining problem, users, and tech stack.
     - 1:00–5:00: Live screen recording of hosted Preview URL in browser address bar demonstrating the 7 scenes.
  2. Upload to YouTube as **Unlisted**.
  3. Verify playback in a private/incognito browser window.
- **Expected Result:** 5-minute unlisted video link accessible without Google login.
- **Evidence to Save:** Unlisted YouTube URL saved in `docs/release/v1.0.0/FINAL-PRODUCT-DEMO-VERIFICATION.md`.
- **Risk:** Zero risk.
- **Explicit Authorization Required:** **YES** (publishing/recording).

---

### Action 7: Authorize Programme & Release Git Tags
- **Why It Is Needed:** Establishes formal immutable Git references for programme grading and software release.
- **Exact Prerequisite:** Actions 1–6 reviewed and approved.
- **Exact Commands:**
  ```powershell
  Set-Location "C:\HorizonPortal-Development\horizon-portal"

  # 1. Tag for Phase 4 Programme Submission
  git tag -a phase-4 -m "Release Horizon Portal Phase 4 (Days 16-20 and Final Challenge)"
  git push origin phase-4

  # 2. Tag for Product v1.0.0 Release (following preview sign-off)
  git tag -a v1.0.0 -m "Horizon Portal v1.0.0 Enterprise Release"
  git push origin v1.0.0
  ```
- **Expected Result:** Tags `phase-4` and `v1.0.0` published on GitHub remote.
- **Evidence to Save:** `git show phase-4`, `git show v1.0.0`.
- **Risk:** Permanent Git tag creation.
- **Explicit Authorization Required:** **YES**.
