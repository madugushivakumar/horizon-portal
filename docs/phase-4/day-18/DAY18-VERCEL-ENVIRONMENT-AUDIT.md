# DAY 18 — VERCEL ENVIRONMENT VARIABLES & SCOPE AUDIT

**Date:** November 18, 2026  
**Project:** Horizon Portal  
**Target Environment:** Vercel Preview & Production  

---

## 1. ENVIRONMENT VARIABLES AUDIT MATRIX

Based on source code analysis across `src/lib/security/rate-limit/`, `src/lib/auth/`, and `src/proxy.ts`, the environment variable requirements and scopes are:

| Variable Name | Required Scope | Required / Optional | Code Inspection Source | Purpose & Security Enforcement |
| :--- | :--- | :--- | :--- | :--- |
| **`UPSTASH_REDIS_REST_URL`** | Production + Preview | **REQUIRED** in Prod/Preview | `src/lib/security/rate-limit/store.ts` | Upstash Redis REST endpoint. Must be HTTPS. Throws fatal error if missing in prod. |
| **`UPSTASH_REDIS_REST_TOKEN`** | Production + Preview | **REQUIRED** in Prod/Preview | `src/lib/security/rate-limit/store.ts` | Upstash REST Bearer token. Zero logs; never exposed in error dumps. |
| **`AUTH_SECRET`** | Production + Preview | **REQUIRED** in Prod/Preview | `src/lib/auth/token.ts`, `account-key.ts` | Secret key for JWT signing and fallback HMAC secret for pseudonymous account keys. |
| **`DATABASE_URL`** | Production + Preview | **REQUIRED** in Prod/Preview | `prisma/schema.prisma` | Neon PostgreSQL pooled connection string for runtime queries. |
| **`DIRECT_URL`** | Production + Preview | **REQUIRED** for Prisma migrations | `prisma/schema.prisma` | Direct connection string for Neon migrations (disabled during Day 18). |
| **`RATE_LIMIT_SECRET`** | Production + Preview | **OPTIONAL** | `src/lib/security/rate-limit/account-key.ts` | Dedicated salt for HMAC account keys. Falls back securely to `AUTH_SECRET`. |
| **`RATE_LIMIT_FAILURE_MODE`** | Production + Preview | **OPTIONAL** | `src/lib/security/rate-limit/config.ts` | `"fail-open"` (default) or `"fail-closed"`. |
| **`RATE_LIMIT_PREFIX`** | Production + Preview | **OPTIONAL** | `src/lib/security/rate-limit/config.ts` | Custom Redis prefix. Automatically uses `"rl:preview:auth"` in Preview when unset. |
| **`NODE_ENV`** | System Managed | **SYSTEM** (`"production"`) | Next.js runtime | Automatically provided by Vercel build environment. |

---

## 2. VERCEL SCREENSHOT CONFIRMATION

The user provided screenshot confirmation from Vercel Project Settings showing:
- `UPSTASH_REDIS_REST_URL`: Enabled for **Production and Preview**.
- `UPSTASH_REDIS_REST_TOKEN`: Enabled for **Production and Preview**.
- `AUTH_SECRET`: Enabled for **Production and Preview**.
- `DATABASE_URL`: Enabled for **Production and Preview**.
- `DIRECT_URL`: Enabled for **Production and Preview**.

### Scope Verification
- Because both `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are explicitly enabled for **Preview**, the serverless preview deployment will successfully initialize `UpstashRedisStore` without throwing missing-credential initialization errors.

---

## 3. CROSS-ENVIRONMENT KEY COLLISION RISK & MITIGATION

- **Risk:** Both Production and Preview use the same Upstash Redis database instance. If both environments wrote to `rl:auth:ip:...` and `rl:auth:account:...`, automated security scans or QA testing on the Preview deployment could inadvertently rate-limit real executive accounts in Production.
- **Mitigation Implemented:**
  In `src/lib/security/rate-limit/config.ts`:
  ```typescript
  prefix:
    process.env.RATE_LIMIT_PREFIX ||
    (process.env.VERCEL_ENV === "preview" ? "rl:preview:auth" : DEFAULT_RATE_LIMIT_CONFIG.prefix)
  ```
  In Preview deployments, Vercel automatically injects `VERCEL_ENV="preview"`. This routes all Preview rate-limiting traffic into the isolated `rl:preview:auth` namespace, guaranteeing **zero interference** with production traffic.
