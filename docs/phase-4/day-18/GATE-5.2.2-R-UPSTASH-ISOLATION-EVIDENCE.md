# GATE-5.2.2-R — UPSTASH PREVIEW REDIS ISOLATION EVIDENCE
## HORIZON PORTAL — CACHE INFRASTRUCTURE & DISTRIBUTED BRUTE-FORCE AUDIT

---

## 1. PREVIOUS REPORT CLAIM RECONCILIATION

### Previous Claim in Earlier Report
Earlier reports claimed that Redis isolation had achieved **PASS** based on key prefix separation (`rl:preview:auth`).

### Architectural Correction & Evidence
1. **Namespace Partitioning != Infrastructure Isolation:**
   - Setting a prefix (`rl:preview:auth`) partitions key names within a single database.
   - Both Preview and Production environments share the same Upstash database instance, connection token, and daily command quota.
2. **Denial-of-Service & Lockout Contamination:**
   - Volumetric penetration testing against the Preview deployment can exhaust the Upstash database command limit, causing Production login rate-limiting to degrade.
3. **Correct Assessment:**
   - Logical Partitioning: **PASS** (Active and verified in `src/lib/security/rate-limit/config.ts`).
   - Infrastructure Isolation: **PENDING** (Requires independent Upstash database instance `horizon-portal-preview-redis`).

---

## 2. DISTRIBUTED RATE LIMITING SPECIFICATION

| Rate Limiting Parameter | Configured Value | Enforcement Policy |
|---|---|---|
| **IP Sliding Window** | 15 minutes (900 seconds) | Max 10 attempts per client IP |
| **Account Sliding Window** | 15 minutes (900 seconds) | Max 5 failed attempts per account |
| **Account Key Hashing** | HMAC-SHA256 | Zero plaintext email stored in Redis |
| **Lockout Non-Extension** | SEC-FIND-06 Remediation | Blocked attempts increment IP counter only |
| **Account Reset on Success**| Immediate reset | Clears account counter; leaves IP counter intact |
| **Failure Mode** | Fail-open (`failureMode: "fail-open"`)| Permits login if Upstash is unreachable |
| **HTTP Response** | HTTP 429 Too Many Requests | Uniform generic message; `Retry-After: 900` |

---

## 3. FAIL-OPEN RESILIENCE CODE AUDIT

In `src/lib/security/rate-limit/login-rate-limit.ts`:
```typescript
try {
  const store = getRateLimitStore();
  // Evaluate IP and account limits...
} catch (err) {
  if (config.failureMode === "fail-closed") {
    return { allowed: false, retryAfterSeconds: 60, remaining: 0, limit: config.ipLimit };
  }
  // Fail-open default: log warning and permit request to protect service availability
  console.warn("[RateLimit] Store failure in fail-open mode; permitting request:", (err as Error).message);
  return { allowed: true, remaining: 1, limit: config.ipLimit };
}
```
This guarantees that an Upstash outage or quota exhaustion does not lock real employees out of the portal.

---

## 4. STATUS SUMMARY

- Code Implementation: **PASS**
- Deterministic Rate Limit Tests: **PASS** (18/18 assertions in `test-original-seven-blocked.ts`)
- Key Prefix Partitioning: **PASS** (`rl:preview:auth` active in Preview)
- Independent Database Instance: **PENDING OWNER UPSTASH ACTION**
