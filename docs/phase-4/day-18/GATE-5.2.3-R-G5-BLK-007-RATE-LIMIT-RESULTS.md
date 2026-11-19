# GATE-5.2.3-R — G5-BLK-007 LOGIN RATE LIMIT RESULTS & SUBTESTS
## HORIZON PORTAL — DUAL-DIMENSION DISTRIBUTED BRUTE-FORCE VERIFICATION

---

## 1. G5-BLK-007 SUBTESTS SPECIFICATION & RESULTS

The login rate limiting mechanism was evaluated across six distinct operational subtests:

| Subtest ID | Target Capability | Verified Requirement | Deterministic Outcome | Live Cloud Status |
|---|---|---|---|---|
| **G5-BLK-007-A** | IP-Based Threshold | 10 attempts allowed per 15-minute window | **PASS** | **BLOCKED (Shared Redis)** |
| **G5-BLK-007-B** | Account-Based Threshold | 5 failed attempts allowed per 15-minute window | **PASS** | **BLOCKED (Shared Redis)** |
| **G5-BLK-007-C** | Blocked-Attempt Non-Extension | Blocked requests increment IP counter only; do not extend account lockout | **PASS** | **BLOCKED (Shared Redis)** |
| **G5-BLK-007-D** | Successful-Login Reset | Successful login clears account counter; preserves IP counter | **PASS** | **BLOCKED (Shared Redis)** |
| **G5-BLK-007-E** | HTTP 429 & Retry-After | Returns HTTP 429, uniform generic error message, and Retry-After header | **PASS** | **BLOCKED (Shared Redis)** |
| **G5-BLK-007-F** | Upstream Redis Failure Mode | Fail-open default permits employee login if Upstash is unavailable | **PASS** | **BLOCKED (Shared Redis)** |

---

## 2. SEC-FIND-06 REMEDIATION AUDIT (LOCKOUT NON-EXTENSION)

### Problem Description
Previously, attackers could permanently lock a victim out of their account by continuously transmitting failed login attempts during the lockout period, resetting the 15-minute account TTL indefinitely.

### Remediation Implementation
In `src/lib/security/rate-limit/login-rate-limit.ts`:
```typescript
export async function recordBlockedLoginAttempt(req: NextRequest | Request): Promise<void> {
  const config = getRateLimitConfig();
  const clientIp = getClientIp(req);
  const ipKey = `${config.prefix}:ip:${clientIp}`;

  try {
    const store = getRateLimitStore();
    // Increment only the IP counter, leaving the account lockout TTL untouched
    await store.incrementAndGetTTL(ipKey, config.ipWindowSeconds);
  } catch (err) {
    console.warn("[RateLimit] Failed to record blocked login attempt counter:", (err as Error).message);
  }
}
```
This ensures that regardless of how many requests an attacker sends, the legitimate employee is guaranteed unlock access after the original 15-minute window elapses.

---

## 3. UNIFORM GENERIC ERROR ENFORCEMENT

To prevent account enumeration, `createRateLimitResponse()` emits:
```json
{
  "error": "Too many login attempts. Please try again later."
}
```
with headers:
- `Retry-After: 900`
- `X-RateLimit-Limit: 10`
- `X-RateLimit-Remaining: 0`
- `X-RateLimit-Reset: <timestamp>`
The response strictly avoids disclosing whether the account exists or which dimension triggered the threshold.
