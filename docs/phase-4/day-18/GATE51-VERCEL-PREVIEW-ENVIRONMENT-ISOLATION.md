# GATE 5.1 — VERCEL PREVIEW ENVIRONMENT ISOLATION REPORT

**Project:** Horizon Portal  
**Date:** November 19, 2026  
**Auditor:** DevOps Engineer & Release Validation Specialist  

---

## 1. Vercel Environment Scope Audit

An audit of the Vercel Project Settings for `horizon-portal` establishes:

| Variable Name | Production Scope | Preview Scope | Isolation Status |
| :--- | :---: | :---: | :--- |
| `DATABASE_URL` | Enabled | Enabled | **SHARED** (Points to `ep-broad-hall-b3dtqwdp`) |
| `DIRECT_URL` | Enabled | Enabled | **SHARED** (Points to `ep-broad-hall-b3dtqwdp`) |
| `AUTH_SECRET` | Enabled | Enabled | Configured |
| `RATE_LIMIT_SECRET` | Enabled | Enabled | Optional (Defaults safely) |
| `UPSTASH_REDIS_REST_URL` | Enabled | Enabled | Shared REST Instance |
| `UPSTASH_REDIS_REST_TOKEN`| Enabled | Enabled | Shared REST Token |

---

## 2. Environment Isolation Requirements for Production Release

To achieve total cloud-level database isolation between Production and Preview:
1. In Vercel Project Settings > Environment Variables:
   - Edit `DATABASE_URL`: restrict the existing production connection string exclusively to **Production**.
   - Add a new `DATABASE_URL` entry scoped exclusively to **Preview**, containing the pooled connection string for the dedicated Neon Preview branch.
   - Edit `DIRECT_URL`: repeat scope separation for direct migration connections.
2. Production variables must remain completely unchanged.
3. The current unauthenticated CLI state prevents programmatic mutation of Vercel Project Settings, guaranteeing that zero accidental overrides occurred.
