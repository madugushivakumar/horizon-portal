# DAY 18 — REDIS FAILURE MODE & OPERATIONAL RESILIENCE AUDIT

**Date:** November 18, 2026  
**Project:** Horizon Portal  
**Target Files:**  
- `src/lib/security/rate-limit/store.ts`  
- `src/lib/security/rate-limit/config.ts`  
- `src/lib/security/rate-limit/account-key.ts`  
- `src/app/api/v1/auth/login/route.ts`  

---

## 1. EXECUTIVE SUMMARY: DUAL-PHASE FAILURE ARCHITECTURE

A critical distinction exists between two distinct failure scenarios:
1. **Infrastructure Initialization Failures (Missing Credentials):** The store enforces a **strict fail-closed initialization policy** in production and preview (`NODE_ENV === "production"`). Silent in-memory fallback is disabled.
2. **Transient Runtime Outages (Redis Degraded / Network Timeout):** The runtime rate-limiter evaluates `RATE_LIMIT_FAILURE_MODE`. Under the enterprise default (`fail-open`), intermittent upstream Redis outages permit employee logins while emitting high-priority security warnings. If configured to `fail-closed`, all logins are rejected with HTTP 429 (`Retry-After: 60`).

---

## 2. SCENARIO-BY-SCENARIO DECISION TABLE

| Scenario | Trigger / Condition | Actual Code Implementation | Operational Behavior & Impact |
| :--- | :--- | :--- | :--- |
| **Missing Redis URL in Production** | `UPSTASH_REDIS_REST_URL` unset or empty when `NODE_ENV === "production"` | `store.ts` line 219 throws `Error: Production distributed rate limiting requires valid...` | **Fail-Closed Initialization:** Serverless handler throws on startup; zero silent in-memory fallback. |
| **Missing Redis Token in Production** | `UPSTASH_REDIS_REST_TOKEN` unset or empty when `NODE_ENV === "production"` | `store.ts` line 219 throws `Error: Production distributed rate limiting requires valid...` | **Fail-Closed Initialization:** Same as above. Prevents uncoordinated memory rate limiting across lambdas. |
| **Redis Network Timeout (>3000ms)** | Upstash REST endpoint does not respond within 3000ms `AbortController` | `UpstashRedisStore.executePipeline` aborts and throws `AbortError` | **Governed by `failureMode`:**<br>• If `fail-open` (default): logs warning, returns `allowed: true`. Employees can log in.<br>• If `fail-closed`: logs error, returns `allowed: false` with HTTP 429 (`Retry-After: 60`). |
| **Upstash HTTP 401/403 (Bad Token)** | Upstash responds with invalid authentication | `executePipeline` throws `Error: Upstash Redis HTTP 401: Unauthorized` | Caught by `checkLoginRateLimit` catch block; follows configured `failureMode`. |
| **Upstash HTTP 500 / 503 (Outage)** | Upstash infrastructure outage | `executePipeline` throws `Error: Upstash Redis HTTP 500` | Caught by `checkLoginRateLimit` catch block; follows configured `failureMode`. |
| **Local Development / CI Tests** | `NODE_ENV !== "production"` and no Upstash credentials | `store.ts` lines 224-229 instantiates `MemoryDistributedStore` | **Permitted local fallback:** In-memory atomic store used for offline dev and test suites. |
| **Missing HMAC Secret in Production** | `RATE_LIMIT_SECRET` and `AUTH_SECRET` missing in production | `account-key.ts` line 42 throws `Error: Production rate limiting requires...` | **Fail-Closed Initialization:** Refuses to use predictable hardcoded salt in production. |
| **Vercel Preview Deployment** | Next.js sets `NODE_ENV === "production"` in Vercel Preview | `store.ts` enforces production rules | Requires valid `UPSTASH_REDIS_REST_URL` and `TOKEN` scoped to Preview. Zero memory fallback. |

---

## 3. SECURITY & AVAILABILITY TRADE-OFF ANALYSIS

### Enterprise Default (`fail-open`)
- **Advantage:** Guarantees business continuity. If Upstash experiences an outage or network latency spike, employees and executives are not locked out of the Horizon Portal.
- **Trade-off:** During a transient Redis outage, volumetric brute-force attacks against `/api/v1/auth/login` are not rate-limited. (Password verification via bcrypt and account deactivation checks remain 100% active).

### Hardened Option (`RATE_LIMIT_FAILURE_MODE=fail-closed`)
- **Advantage:** Maximum security posture. In the event of a Redis failure, all login attempts are unconditionally rejected.
- **Trade-off:** Any upstream Redis downtime causes a total authentication outage for all Horizon Portal users.

---

## 4. AUDIT VERDICT

**CONSISTENT AND DEFENSIVE**: The codebase properly distinguishes between configuration failure (fail-closed initialization) and operational transport failure (configurable policy defaulting to fail-open).
