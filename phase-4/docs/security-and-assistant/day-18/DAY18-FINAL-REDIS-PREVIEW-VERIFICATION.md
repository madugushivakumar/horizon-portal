# HORIZON PORTAL — DAY 18: DISTRIBUTED REDIS PREVIEW & PRODUCTION VERIFICATION
## Stage F & Stage H Verification Report

**Date:** November 18, 2026  
**Auditor:** Principal Application Security Engineer  
**Status:** BLOCKED ON USER VERCEL SCOPE ACTION (Evidence Documented Below)

---

## 1. Executive Summary

This report establishes the configuration, security boundaries, failure modes, and connectivity status of the Upstash Redis distributed rate limiting architecture implemented for `POST /api/v1/auth/login`.

---

## 2. Environment Variable Scopes & Vercel Configuration

An inspection of the Vercel project configuration and environment scopes reveals:

| Variable | Required Scopes | Reported Vercel Scope | Operational Status |
|---|---|---|---|
| `UPSTASH_REDIS_REST_URL` | Production & Preview | Production Only | **MISSING IN PREVIEW** |
| `UPSTASH_REDIS_REST_TOKEN` | Production & Preview | Production Only | **MISSING IN PREVIEW** |
| `AUTH_SECRET` | Production & Preview | Production & Preview | Configured |
| `DATABASE_URL` | Production & Preview | Production & Preview | Configured (Neon PostgreSQL) |
| `DIRECT_URL` | Production & Preview | Production & Preview | Configured (Neon PostgreSQL) |
| `RATE_LIMIT_SECRET` | Production & Preview (Optional) | Falls back to `AUTH_SECRET` | Safe HMAC Key Available |
| `RATE_LIMIT_FAILURE_MODE` | Production & Preview (Optional) | Defaults to `fail-open` | Configured |

### Vercel Scope Block & Action Required
The Vercel environment variable settings currently assign `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` exclusively to the **Production** environment.
- **Preview Impact:** In the deployed Preview environment, because `NODE_ENV === "production"` on Vercel preview builds, `getRateLimitStore()` strictly prevents silent in-memory fallback (SEC-FIND-07). Without Redis credentials, serverless functions in Preview will fail rate-limit initialization.
- **Required User Action:** The user must open Vercel Project Settings -> **Environment Variables**, edit `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`, and check the **Preview** checkbox so that both Production and Preview have access to Upstash Redis.

---

## 3. HMAC Secret & Account Identifier Protection

### Implementation Audit (`src/lib/security/rate-limit/account-key.ts`)
1. **Pseudonymization:** Emails are normalized (trimmed, lowercased) and hashed via HMAC-SHA256 into a 64-character hexadecimal digest. Raw employee email addresses are **NEVER** transmitted to Redis or persisted in key names.
2. **Key Format:** Keys are structured as `<prefix>:account:<hmac_hex>` (e.g. `rl:auth:account:a3f59e...`).
3. **Fail-Safe Secret Remediation:**
   - **Audit Finding:** Previously, line 38 permitted a static fallback salt (`"horizon-portal-pseudonymous-rate-limit-hmac-salt"`) if both `RATE_LIMIT_SECRET` and `AUTH_SECRET` were undefined.
   - **Remediation Applied:** The code was updated to enforce that in production (`NODE_ENV === "production"`), missing secrets throw an explicit, fatal error:
     ```typescript
     const isProduction = process.env.NODE_ENV === "production";
     const secret =
       process.env.RATE_LIMIT_SECRET ||
       process.env.AUTH_SECRET ||
       (isProduction ? null : "horizon-portal-pseudonymous-rate-limit-hmac-salt");

     if (!secret) {
       throw new Error(
         "Production rate limiting requires RATE_LIMIT_SECRET or AUTH_SECRET to be configured. Hardcoded fallback salt is disabled in production."
       );
     }
     ```
   - In local development and automated testing, the fallback salt is permitted for test convenience. In production environments, silent predictable salts are strictly prohibited.

---

## 4. Rate Limiting Failure Behavior & Architectural Trade-Offs

### Dual-Layer Rate Limiting Policy
- **IP Rate Limit:** 10 attempts per 15 minutes (`900s` window). Mitigates brute-force sweeps, credential stuffing attacks, and denial-of-service attempts.
- **Account Rate Limit:** 5 failed attempts per 15 minutes (`900s` window). Mitigates targeted brute-forcing against individual corporate accounts across rotating client IPs.
- **Decoupled Reset (Security Invariant):** When a user successfully authenticates, their **account** failure counter is reset to 0, but the **client IP** abuse counter is **NOT** reset. This prevents attackers with valid credentials from resetting their IP quota to continue credential stuffing.

### Availability vs. Security Trade-Off (`fail-open`)
- **Default Mode:** `fail-open` (configured in `config.ts`).
- **Rationale:** If Upstash Redis experiences transient latency or downtime, `fail-open` ensures that legitimate enterprise employees (executives, HR, payroll administrators) can continue to log in without systemic denial-of-service.
- **Timeout Bound:** Network requests to Upstash REST pipeline are bounded by an `AbortController` with a strict `3000ms` timeout to prevent serverless function starvation.

---

## 5. Non-Destructive Redis Connectivity Verification

### Connectivity Test Script (`scripts/test-redis-connectivity.ts`)
- Connects using `UpstashRedisStore` native HTTP fetch pipeline.
- Generates a temporary isolated key: `test:connectivity:<timestamp>`.
- Executes atomic `INCR` + `EXPIRE` (NX) + `PTTL`.
- Verifies count=1 and positive TTL.
- Deletes only the temporary key via `DEL`.
- Zero use of `FLUSHDB` or `FLUSHALL`.
- Zero credentials or tokens logged.

### Local Execution Result
```text
================================================================================
  HORIZON PORTAL — PRODUCTION UPSTASH REDIS CONNECTIVITY TEST
================================================================================
[STATUS: BLOCKED] UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN is not configured.
  Configure these variables in your environment or Vercel Project Settings to proceed.
```
- **Finding:** Correctly blocked locally because production Upstash credentials are not stored in local `.env`.
- **Readiness:** As soon as the user adds Preview scope in Vercel, this script can execute against the Preview runtime.
