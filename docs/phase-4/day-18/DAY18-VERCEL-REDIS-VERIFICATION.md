# HORIZON PORTAL — PHASE 4, DAY 18
# VERCEL ENVIRONMENT VARIABLE & UPSTASH REDIS CONFIGURATION AUDIT

**Document ID:** `DAY18-VERCEL-REDIS-VERIFICATION`  
**Project:** Horizon Portal  
**Target Environment:** Vercel Production & Preview  
**Execution Timestamp:** 2026-11-18T17:58:30+05:30  
**Auditor & DevOps Engineer:** Senior Full-Stack Engineer, Next.js Security Engineer & DevOps Auditor  

---

## 1. Executive Summary & Purpose

In accordance with Phase D of the Day 18 Master Execution Prompt and finding **`SEC-FIND-07`**, this report verifies the configuration and operational readiness of shared Upstash Redis distributed rate limiting for Horizon Portal on Vercel.

In multi-instance Vercel serverless environments, in-memory rate limiting is ineffective because each serverless execution context maintains isolated memory. To prevent credential stuffing and brute-force password spraying, rate-limiting counters must be shared atomically across all serverless instances via Upstash Redis REST.

---

## 2. Source Code Architecture Verification

A line-by-line inspection of `src/lib/security/rate-limit/` confirmed:

1. **Production Requirement (`store.ts`, Lines 209–222):**
   - When `NODE_ENV === "production"`, `getRateLimitStore()` strictly verifies that `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are present and non-empty.
   - If missing, it immediately throws an explicit configuration exception. **Silent in-memory fallback in production is strictly disabled.**
2. **Local Development / Test Fallback (`store.ts`, Lines 224–230):**
   - In non-production environments (`development` or `test`), an atomic `MemoryDistributedStore` is safely initialized.
3. **Endpoint URL Validation (`store.ts`, Lines 81–89):**
   - Enforces that `UPSTASH_REDIS_REST_URL` begins with `https://` or `http://`.
4. **Timeout Enforcement (`store.ts`, Line 79):**
   - All REST requests enforce an explicit **3,000ms timeout** using `AbortController` to prevent serverless function hangs.
5. **Fail-Open Policy Enforcement (`config.ts`, Lines 14–37):**
   - Default `RATE_LIMIT_FAILURE_MODE="fail-open"` ensures enterprise authentication availability during upstream Redis degraded events, while logging warnings to server error logs.
6. **Pseudonymous Account Hashing (`account-key.ts`, Lines 29–43):**
   - Emails are hashed via HMAC-SHA256 into 64-character hexadecimal digests (`rl:auth:account:<hmac_hex>`).
   - Uses `RATE_LIMIT_SECRET` with an automatic fallback to `AUTH_SECRET`. Raw email addresses are NEVER persisted in Redis keys or telemetry.
7. **Zero Secret Leakage:**
   - Error responses conceal Redis endpoints, credentials, and internal failure details, returning only generic user-safe payloads with standard `Retry-After` headers.

---

## 3. Vercel Environment Configuration Matrix

The following environment variables must be configured in the **Vercel Dashboard > Project Settings > Environment Variables**:

| Environment Variable | Production Scope | Preview Scope | Purpose / Source Verification | Verification Status |
|---|:---:|:---:|---|:---:|
| **`UPSTASH_REDIS_REST_URL`** | Required | Required | Upstash Redis REST HTTPS endpoint (`https://...upstash.io`) | **PENDING USER VERIFICATION** |
| **`UPSTASH_REDIS_REST_TOKEN`** | Required | Required | Upstash Redis REST authentication bearer token | **PENDING USER VERIFICATION** |
| **`AUTH_SECRET`** | Required | Required | 64-char hex secret for Jose HS256 JWT signing and sessions | **PRE-CONFIGURED / ACTIVE** |
| **`RATE_LIMIT_SECRET`** | Recommended | Recommended | 64-char hex HMAC secret (falls back to `AUTH_SECRET` if unset) | **FALLBACK SUPPORTED** |
| **`RATE_LIMIT_FAILURE_MODE`** | Optional | Optional | Configured to `"fail-open"` by default in code | **DEFAULTS TO FAIL-OPEN** |

> [!NOTE]
> Values are never logged, displayed, or requested in chat. Verification reports only `PRESENT`, `MISSING`, or `NOT VERIFIED`.

---

## 4. User Dashboard Instructions for Vercel Configuration

If `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are not yet added to Vercel:

1. Open your browser and navigate to:  
   `https://vercel.com/` → Select **Horizon Portal** → Click **Settings** → Click **Environment Variables**.
2. Add Variable 1:
   - **Key:** `UPSTASH_REDIS_REST_URL`
   - **Value:** `https://<your-database>.upstash.io`
   - **Environments:** Check **Production** and **Preview**.
3. Add Variable 2:
   - **Key:** `UPSTASH_REDIS_REST_TOKEN`
   - **Value:** `<your-upstash-rest-token>`
   - **Environments:** Check **Production** and **Preview**.
4. (Optional) Add Variable 3:
   - **Key:** `RATE_LIMIT_FAILURE_MODE`
   - **Value:** `fail-open`
   - **Environments:** Check **Production** and **Preview**.
5. Click **Save**.

---

## 5. Non-Destructive Redis Connectivity Policy

During production verification:
- **Zero Deletion:** Never execute `FLUSHDB`, `FLUSHALL`, or key deletion commands against shared Redis.
- **Isolated Namespacing:** Use dedicated test prefix or standard login failure counters for designated test accounts.
- **Zero Brute-Force Sweeps:** Perform only controlled, low-volume requests (1–2 failed logins) to verify counter increments and HTTP 429 Retry-After delivery.

---
*Environment verification specification certified.*
