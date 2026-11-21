# HORIZON PORTAL — PHASE 4, DAY 18
# STAGE F: DISTRIBUTED LOGIN RATE LIMITING IMPLEMENTATION REPORT

**Document ID:** `DAY18-DISTRIBUTED-RATE-LIMIT-IMPLEMENTATION-REPORT`  
**System:** Horizon Portal — Enterprise HR Management Platform  
**Target Scope:** `POST /api/v1/auth/login` (SEC-FIND-02 Remediation)  
**Security Classification:** Highly Confidential / Application Security Audit  
**Author:** Principal Application Security Engineer & Distributed Systems Architect  
**Status:** COMPLETE & VERIFIED  
**Date:** November 18, 2026  

---

## 1. Executive Summary

During the initial Day 18 security audit, `POST /api/v1/auth/login` was identified as vulnerable to automated credential-stuffing and password brute-forcing due to the complete absence of rate-limiting controls (**Finding `SEC-FIND-02`**).

In serverless architectures (Next.js deployed on Vercel), traditional in-memory rate-limiting counters are fundamentally broken because requests fan out over ephemeral, isolated container instances.

Stage F successfully implemented, integrated, and verified an enterprise-grade, distributed rate-limiting subsystem for Horizon Portal. The implementation establishes:
1. **Dual-Dimension Protection:** 10 attempts per 15 minutes per client IP; 5 failed attempts per 15 minutes per targeted account.
2. **Zero Plaintext Email Leakage:** Pseudonymous HMAC-SHA256 account key derivation ensuring raw employee emails never appear in Redis keys or access logs.
3. **Atomic Multi-Instance Storage:** Production Upstash Redis support using native HTTP REST pipelining (zero external npm dependencies) with a 3,000ms timeout, coupled with a high-fidelity in-memory atomic store for local dev and automated CI/CD.
4. **RFC-Compliant HTTP 429 Contract:** Generic anti-enumeration error response with `Retry-After`, `X-RateLimit-Limit`, and `X-RateLimit-Remaining` headers, strictly omitting session cookies and tokens.
5. **Account Counter Reset on Success:** Legitimate users who mistype their password have their failure count cleared upon valid login, while the IP counter remains active to prevent attacker account-cycling exploits.
6. **100% Test & Build Pass Rate:** 51/51 automated rate-limiting tests passing, 0 TypeScript errors, 0 ESLint errors, and clean production compilation across all 63 routes.

---

## 2. Git Baseline & Integrity Preservation

Before implementing Stage F, the repository environment and database states were recorded and frozen:

| Attribute | Expected Baseline | Actual Verified State | Status |
|---|---|---|---|
| **Git Branch** | `main` | `main` | ✅ MATCH |
| **HEAD Commit** | `c6683d6054a5460fd36afbcc6e419c017894705e` | `c6683d6054a5460fd36afbcc6e419c017894705e` | ✅ MATCH |
| **Staged Git Files** | `0` | `0` | ✅ UNTOUCHED |
| **SQLite DB Size** | `3,637,248 bytes` | `3,637,248 bytes` | ✅ UNMUTATED |
| **Neon PostgreSQL** | `neondb` (27 tables, 15,229 records) | Read-only preserved | ✅ UNMUTATED |

---

## 3. Architecture & Code Changes

The rate-limiting architecture was implemented as a modular subsystem under `src/lib/security/rate-limit/`:

```
src/lib/security/rate-limit/
├── types.ts            # RateLimitDecision, RateLimitConfig, DistributedRateLimitStore interfaces
├── config.ts           # Policy defaults (10 IP / 15m, 5 Account / 15m, fail-open) & env parsers
├── client-ip.ts        # Trusted header extraction (x-real-ip, vercel, x-forwarded-for), normalization & port stripping
├── account-key.ts      # Pseudonymous HMAC-SHA256 key derivation with RATE_LIMIT_SECRET
├── store.ts            # UpstashRedisStore (native REST fetch) & MemoryDistributedStore (atomic CAS/TTL)
├── login-rate-limit.ts # High-level orchestration, 429 response builder, failure & success hooks
└── index.ts            # Barrel export
```

### 3.1 Route Handler Integration (`src/app/api/v1/auth/login/route.ts`)
The execution order within `POST /api/v1/auth/login` was hardened to enforce rate limits before expensive database lookups and bcrypt password verification:

1. **Body Parsing:** Safe JSON parsing (returns 400 if malformed).
2. **Schema Validation:** Zod safeParse using `loginInputSchema` (returns 400 if invalid).
3. **Rate Limit Gate:**
   ```ts
   const rateLimitDecision = await checkLoginRateLimit(request, normalizedEmail);
   if (!rateLimitDecision.allowed) {
     return createRateLimitResponse(rateLimitDecision);
   }
   ```
4. **Database Lookup:** Find user by email.
   - If user does not exist: call `recordFailedLoginAttempt(request, normalizedEmail)` -> return 401.
5. **Account Status Check:** Verify `user.isActive`.
   - If deactivated: call `recordFailedLoginAttempt(request, normalizedEmail)` -> return 403.
6. **Bcrypt Verification:** Compare password hash.
   - If invalid: call `recordFailedLoginAttempt(request, normalizedEmail)` -> return 401.
7. **Success Transition:**
   - Call `recordSuccessfulLogin(request, normalizedEmail)` to clear account failure count.
   - Generate signed JWT and set secure HTTP-only session cookie -> return 200.

---

## 4. Upstash Redis REST Integration (Zero Dependency)

To avoid bundling bloated npm packages, `UpstashRedisStore` communicates directly with the Upstash REST endpoint:
- **Pipeline Endpoint:** `POST ${UPSTASH_REDIS_REST_URL}/pipeline` with `Bearer` authentication.
- **Atomic Operations:** Sent as a single HTTP batch:
  ```json
  [
    ["INCR", "rl:auth:ip:198.51.100.1"],
    ["EXPIRE", "rl:auth:ip:198.51.100.1", 900, "NX"],
    ["PTTL", "rl:auth:ip:198.51.100.1"]
  ]
  ```
- **Execution Deadline:** Enforced via `AbortController` at 3,000ms.
- **Fail-Open Default:** If Upstash Redis is unreachable, the system logs a structured warning and allows the request through, preserving critical enterprise employee access.

---

## 5. Automated Verification Results

A dedicated automated test suite (`scripts/test-day18-login-rate-limit.ts`) was executed via `npm run test:rate-limit`.

```text
================================================================================
  HORIZON PORTAL — PHASE 4, DAY 18: STAGE F RATE LIMITING TEST SUITE
================================================================================

--- Section 1: Client IP Extraction and Normalization ---
  [PASS] Normalizes clean IPv4 address
  [PASS] Trims whitespace from IPv4
  [PASS] Strips port from IPv4 address
  [PASS] Strips ::ffff: IPv4-mapped IPv6 prefix
  [PASS] Preserves valid standard IPv6 address
  [PASS] Preserves compressed IPv6 localhost address
  [PASS] Strips brackets and port from IPv6
  [PASS] Rejects out-of-range IPv4 address
  [PASS] Rejects arbitrary non-IP string
  [PASS] Rejects empty IP string
  [PASS] Prioritizes x-real-ip when all forward headers present
  [PASS] Extracts first IP from x-vercel-forwarded-for
  [PASS] Extracts first IP from x-forwarded-for and strips port
  [PASS] Falls back to unknown-client-ip when no client IP header exists

--- Section 2: Pseudonymous Account Key Derivation ---
  [PASS] Normalizes email (trim and lowercase)
  [PASS] Normalizes empty email to null
  [PASS] Handles undefined email
  [PASS] Generates 64-character HMAC-SHA256 hex digest
  [PASS] Normalizes email before hashing; identical digests produced
  [PASS] Formats key as <prefix>:account:<hmac_hex>
  [PASS] Guarantees raw email string is NEVER present in Redis key

--- Section 3: Distributed Store Atomic Operations ---
  [PASS] First increment sets count=1 and initial TTL
  [PASS] Second increment returns count=2
  [PASS] get() retrieves current count without mutating
  [PASS] reset() deletes existing key
  [PASS] get() returns count=0 for non-existent key

--- Section 4: IP Rate Limiting Enforcement ---
  [PASS] Initial check allows request with remaining=10
  [PASS] 11th attempt from same IP is blocked
  [PASS] Limit type identifies as 'ip'
  [PASS] Provides positive retryAfterSeconds
  [PASS] Returns HTTP 429 Too Many Requests
  [PASS] Sets Retry-After header
  [PASS] Sets X-RateLimit-Remaining: 0
  [PASS] Returns standardized generic error payload concealing dimension

--- Section 5: Targeted Account Brute-Force Protection ---
  [PASS] Blocks distributed brute-force attack against single account across rotating IPs
  [PASS] Limit type identifies as 'account'
  [PASS] Fresh IP targeting an unblocked account is NOT blocked (avoids false-positive spillover)

--- Section 6: Account Counter Reset on Successful Login ---
  [PASS] Failure counter is 3 after mistyped passwords
  [PASS] Successful login resets account failure counter to 0
  [PASS] Successful login does NOT reset IP counter (security invariant)

--- Section 7: Route Handler Integration & Security Invariants ---
  [PASS] Attempt 1 returns 401 invalid credentials
  [PASS] Attempt 2 returns 401 invalid credentials
  [PASS] Attempt 3 returns 401 invalid credentials
  [PASS] Attempt 4 returns 401 invalid credentials
  [PASS] Attempt 5 returns 401 invalid credentials
  [PASS] Route handler returns HTTP 429 Too Many Requests
  [PASS] Route handler sets Retry-After header
  [PASS] Rate-limited request issues ZERO session cookies (Set-Cookie is null)
  [PASS] Route handler returns generic rate-limit error message
  [PASS] Rate-limited response returns ZERO tokens
  [PASS] Rate-limited response returns ZERO user data

================================================================================
  STAGE F TEST EXECUTION COMPLETE: Passed: 51 | Failed: 0
================================================================================
```

---

## 6. Regression Testing & Static Analysis

| Suite | Command | Assertions | Result |
|---|---|---|---|
| **Stage F Rate Limiting** | `npm run test:rate-limit` | 51 assertions | ✅ 51 PASSED, 0 FAILED |
| **Day 18 Security (Auth & RBAC)** | `npm run test:security` | 46 assertions | ✅ 46 PASSED, 0 FAILED |
| **Day 18 Input Validation** | `npm run test:validation` | 54 assertions | ✅ 54 PASSED, 0 FAILED |
| **Day 18 Security Headers & CSP** | `npm run test:headers` | 63 assertions | ✅ 63 PASSED, 0 FAILED |
| **Authentication & Tokens** | `npm run test:auth` | 39 assertions | ✅ 39 PASSED, 0 FAILED |
| **Leave & Attendance Management** | `npm run test:leave` | 43 assertions | ✅ 43 PASSED, 0 FAILED |
| **Privacy & Salary Leakage** | `npm run test:privacy` | 62 assertions | ✅ 62 PASSED, 0 FAILED |
| **Payslip Access Control** | `npm run test:payslips` | 67 assertions | ✅ 67 PASSED, 0 FAILED |
| **TypeScript Static Typecheck** | `npx tsc --noEmit` | Project-wide | ✅ 0 ERRORS |
| **ESLint Static Code Quality** | `npm run lint` | Project-wide | ✅ 0 ERRORS |
| **Next.js Production Build** | `npm run build` | 63 routes | ✅ COMPILED (63/63 routes) |
| **Total Test Suite Assertions** | Combined | **425 assertions** | **100% SUCCESS** |

---

## 7. Security Remediation Status: SEC-FIND-02

With the completion and verification of Stage F:
- **Finding:** `SEC-FIND-02` (Missing request throttling and brute-force protection on `/api/v1/auth/login`)
- **Status:** **FULLY RESOLVED & VERIFIED**
- **Inventory Documentation:** Updated in `docs/phase-4/day-18/DAY18-API-ROUTE-SECURITY-INVENTORY.md`

Stage F is officially signed off and ready for Stage G penetration simulation.
