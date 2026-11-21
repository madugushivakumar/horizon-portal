# HORIZON PORTAL v1.0.0 — PRODUCTION RELEASE RUNBOOK
## Step-by-Step Operator Instructions for Official Production Cutover

**Project:** Horizon Portal  
**Target Release:** `v1.0.0`  
**Date:** 2026-11-20  

---

## 1. PRE-RELEASE HEALTH GATES
Before executing production release, confirm:
- [ ] TypeScript check passes with zero errors: `npx tsc --noEmit`.
- [ ] Automated verification suite passes: `npx tsx scripts/test-unified-approvals.ts` (30/30).
- [ ] Hosted Preview deployment verified and tested with Playwright.
- [ ] Physical device QA verified on Android and iPhone.
- [ ] Product demo video recorded and archived.
- [ ] Production Neon database backup/snapshot taken.

---

## 2. PRODUCTION CUTOVER PROCEDURE

### Step 1: Production Neon Database Migration
```powershell
# Set migration administrator credentials for Production
$env:DIRECT_URL = "postgresql://migration_admin:<PROD_PASS>@ep-production.neon.tech/horizon_db?sslmode=require"
$env:EXPECTED_PREVIEW_ENDPOINT = "ep-production"
$env:MIGRATE_ENV = "production"

# Execute controlled migration deployer
.\scripts\deploy-migrations.ps1
```

### Step 2: Reconcile Production Role Grants
```bash
psql "$DIRECT_URL" -f scripts/day18-preview-runtime-grants.sql
```

### Step 3: Deploy Production Application to Vercel
```powershell
vercel --prod
```

### Step 4: Post-Deployment Smoke Verification
- Check health endpoint: `https://horizon-portal-sigma.vercel.app/api/health`
- Verify Login with demo session.
- Verify Unified Approval Center (`/approvals`).
- Check audit log emission in database.
- Confirm 501 Accounts Payable records remain intact:
  `SELECT count(*), status FROM expenses GROUP BY status;` -> 478 PAID, 23 UNPAID.
