# DAY 18 — RATE LIMITING POLICY & THRESHOLD AUDIT

**Date:** November 18, 2026  
**Project:** Horizon Portal  
**Target File Scope:**  
- `src/lib/security/rate-limit/config.ts`  
- `src/lib/security/rate-limit/login-rate-limit.ts`  
- `src/lib/security/rate-limit/store.ts`  
- `src/lib/security/rate-limit/account-key.ts`  
- `src/app/api/v1/auth/login/route.ts`  
- `scripts/test-day18-login-rate-limit.ts`  

---

## 1. EXECUTIVE SUMMARY & DISCREPANCY RECONCILIATION

### Reported Discrepancy
- Earlier architectural documentation described:
  - IP Limit: 10 attempts per 15 minutes.
  - Account Limit: 5 failed attempts per 15 minutes.
- A subsequent conversational response summarized:
  - "5 requests per 60 seconds" across login and mutation routes.

### Forensic Code Inspection Findings
An exhaustive audit across all route handlers in `src/app/api/` revealed:
1. **Mutation Routes Rate Limiting:** There is **zero** rate-limiting middleware or code in mutation routes (`tasks`, `leave`, `payroll`, `employees`, etc.). Authorization on mutation routes is strictly enforced via RBAC, CSRF session token validation, and IDOR tenant ownership checks. The claim of "mutation route rate limiting" was a conversational summarization inaccuracy.
2. **Login Rate Limiting Thresholds:** The actual, operational implementation in `config.ts` and verified by `scripts/test-day18-login-rate-limit.ts` is:
   - **IP Dimension:** **10 attempts per 15 minutes** (900 seconds)
   - **Account Dimension:** **5 failed attempts per 15 minutes** (900 seconds)
   - **Scope:** Restricted specifically to `POST /api/v1/auth/login`

---

## 2. POLICY COMPARISON MATRIX

| Dimension | Intended Day 18 Policy | Actual Codebase Implementation | Verified Behavior / Result |
| :--- | :--- | :--- | :--- |
| **IP Threshold** | 10 attempts | `config.ipLimit = 10` | Allowed through 10; 11th returns HTTP 429 |
| **IP Window** | 15 minutes (900s) | `config.ipWindowSeconds = 900` | Expiry set via Redis `EXPIRE key 900 NX` |
| **Account Threshold** | 5 failed attempts | `config.accountLimit = 5` | Allowed through 5; 6th returns HTTP 429 |
| **Account Window** | 15 minutes (900s) | `config.accountWindowSeconds = 900` | Expiry set via Redis `EXPIRE key 900 NX` |
| **Increment Trigger** | Failed auth only | `recordFailedLoginAttempt` called on 401/403 only | Successful attempts do not increment failure counters |
| **Successful Login Reset** | Reset account counter | `recordSuccessfulLogin` invokes `store.reset(accountKey)` | Account failure count resets to 0 upon valid login |
| **IP Counter Reset on Success** | Retain IP counter | Intentionally does not reset IP counter | Prevents attacker loop cycling from clearing IP abuse |
| **Blocked Account Behavior** | Increment attacking IP counter | `recordBlockedLoginAttempt` called on 429 | SEC-FIND-06 fix: increments IP abuse counter without extending account lockout |
| **Lockout Extension** | No lockout extension on 429 | `accountKey` counter is NOT incremented when blocked | Attackers cannot indefinitely lock an account via automated requests |
| **Storage Engine** | Shared Redis | `UpstashRedisStore` via atomic REST pipeline | Atomic `INCR` + `EXPIRE NX` + `PTTL` in 1 HTTP round-trip |
| **Mutation Route Limits** | None | No rate limit calls in mutation handlers | Protected via RBAC, Zod schemas, and session auth |

---

## 3. ZERO-LEAKAGE GUARANTEE & KEY FORMAT

- **Zero Plaintext PII in Redis:**
  - Raw email addresses are NEVER passed into Redis keys.
  - Normalized email addresses (`email.trim().toLowerCase()`) are hashed via HMAC-SHA256:
    `rl:auth:account:<hmac_sha256_hex>`
  - HMAC secret uses `RATE_LIMIT_SECRET` or `AUTH_SECRET`.
  - In production (`NODE_ENV === "production"`), missing HMAC secret causes an immediate fatal error rather than using a hardcoded salt.
- **Client IP Extraction:**
  - `getClientIp` prioritizes platform-authoritative headers: `x-vercel-forwarded-for` -> `x-real-ip` -> `x-forwarded-for`.
  - IP keys are normalized with ports stripped: `rl:auth:ip:<normalized_ip>`.

---

## 4. PREVIEW VS PRODUCTION NAMESPACE ISOLATION

To prevent test-traffic in Vercel Preview from polluting production rate-limit counters or locking out production executives:
- In `src/lib/security/rate-limit/config.ts`:
  ```typescript
  prefix:
    process.env.RATE_LIMIT_PREFIX ||
    (process.env.VERCEL_ENV === "preview" ? "rl:preview:auth" : DEFAULT_RATE_LIMIT_CONFIG.prefix)
  ```
- In local development and automated CI tests: `VERCEL_ENV` is unset, using default `"rl:auth"`.
- In Vercel Production: `VERCEL_ENV === "production"`, using `"rl:auth"`.
- In Vercel Preview: `VERCEL_ENV === "preview"`, using `"rl:preview:auth"`.

---

## 5. POLICY VERDICT

**VERIFIED AND CONSISTENT**: The actual codebase adheres exactly to the enterprise Day 18 policy: **10 IP attempts / 15m** and **5 Account failed attempts / 15m**.
