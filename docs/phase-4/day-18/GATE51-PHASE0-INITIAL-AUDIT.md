# GATE 5.1 — PHASE 0: INITIAL REPOSITORY AND ENVIRONMENT AUDIT REPORT

**Project:** Horizon Portal  
**Branch:** `day18-preview-validation`  
**HEAD SHA:** `ab466e84e778cc20f1bb77b4c82e56967436c2c7`  
**Parent SHA:** `39010b228b91f9a403b73676ce6fc73822514726`  
**Base SHA:** `c6683d6054a5460fd36afbcc6e419c017894705e` (`origin/main`)  
**Date:** November 19, 2026  
**Auditor:** Principal Database Architect & Release Validation Specialist  

---

## 1. Project & Repository Identity

- **Working Directory:** `C:\Users\Madugu Shiva Kumar\OneDrive\图片\Desktop\horizon-portal`
- **Git Remote:** `https://github.com/madugushivakumar/horizon-portal.git`
- **Staging Area Status:** 0 staged files (`git diff --cached --stat` empty).
- **Working Tree State:** Exactly 7 intentionally excluded tracked modifications preserved unstaged (`.env.example`, `.env.production.example`, and 5 test scripts).
- **Local SQLite Database (`prisma/dev.db`):** 3,637,248 bytes.

---

## 2. Sanitized Environment-Variable Inventory

| Variable Name | Local Development | Vercel Preview | Vercel Production | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `DATABASE_URL` | `file:./dev.db` | Pooled Neon PostgreSQL (Shared) | Pooled Neon PostgreSQL (Shared) | Runtime Prisma query execution |
| `DIRECT_URL` | Unset (SQLite) | Direct Neon PostgreSQL (Shared) | Direct Neon PostgreSQL (Shared) | Direct connection for Prisma migrations |
| `AUTH_SECRET` | Configured locally | Configured (Preview scope) | Configured (Production scope) | JWT token signing & session verification |
| `RATE_LIMIT_SECRET` | Optional (falls back) | Optional (falls back) | Optional (falls back) | HMAC-SHA256 salt for pseudonymous account keys |
| `UPSTASH_REDIS_REST_URL`| Local/Test fallback | HTTPS Endpoint (Preview scope) | HTTPS Endpoint (Production scope) | Serverless Upstash Redis REST endpoint |
| `UPSTASH_REDIS_REST_TOKEN`| Local/Test fallback| REST Token (Preview scope) | REST Token (Production scope) | Bearer token for Upstash Redis pipeline |

*Zero secret values exposed.*
