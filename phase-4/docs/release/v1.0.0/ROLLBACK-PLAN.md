# HORIZON PORTAL v1.0.0 — PRODUCTION ROLLBACK PLAN
## Contingency Protocols, Database Recovery & Traffic Rollback Procedures

**Project:** Horizon Portal  
**Target Release:** `v1.0.0`  
**Date:** 2026-11-20  

---

## 1. ROLLBACK TRIGGERS
Execute immediate rollback if any of the following occur during release:
1. Database migration failure or schema lock timeout.
2. Application crash / HTTP 500 error rate > 1% on production routes.
3. Unintended mutation of historical Accounts Payable records (`expenses`).
4. Critical security vulnerability or authorization bypass detected.

---

## 2. ROLLBACK PROCEDURES

### 2.1 Application Traffic Rollback (Vercel)
Vercel allows instant, zero-downtime rollback to the previous deployment:
1. Open Vercel Dashboard -> **Horizon Portal** -> **Deployments**.
2. Locate the previous stable production deployment (commit `0552321`).
3. Click the **...** menu -> **Instant Rollback**.
4. Traffic is immediately redirected to the previous build within 5 seconds.

### 2.2 Database Rollback (Neon Serverless Branching)
Because Neon provides instant point-in-time branch restoration:
1. In Neon Console, select the Production branch.
2. Select **Restore to point in time** (timestamp immediately prior to migration execution).
3. Alternatively, if table `corporate_expense_authorizations` needs to be removed without affecting existing tables:
   ```sql
   DROP TABLE IF EXISTS "corporate_expense_authorizations" CASCADE;
   DELETE FROM "_prisma_migrations" WHERE "migration_name" = '20261120180000_add_corporate_expense_authorizations';
   ```

### 2.3 Git Tag & Commit Reversion
If release tag was already pushed:
```powershell
git tag -d v1.0.0
git push --delete origin v1.0.0
git checkout main
git revert HEAD -m "revert: rollback v1.0.0 release"
git push origin main
```
