# GATE 5.2.3-R — LIVE REDIS RATE LIMIT VERIFICATION REPORT
## HORIZON PORTAL — DISTRIBUTED BRUTE-FORCE DEFENSE & SUBTESTS AUDIT

---

## 1. DUAL-DIMENSION RATE LIMITING SPECIFICATION

Horizon Portal enforces distributed rate limiting across both client IP addresses and user accounts on `POST /api/v1/auth/login`:

- **IP Limit:** 10 requests per 15-minute window (900s).
- **Account Limit:** 5 failed attempts per 15-minute window (900s).
- **Hash Anonymization:** Account keys store `HMAC-SHA256(email, secret)`, guaranteeing zero plaintext email exposure in Redis.
- **Fail-Open Policy:** If Upstash Redis experiences transient downtime or quota exhaustion, `failureMode: "fail-open"` ensures that genuine employee login traffic is not disrupted.

---

## 2. G5-BLK-007 SUBTESTS VERIFICATION REGISTER

| Subtest ID | Target Capability | Code Implementation Location | Deterministic Test Result | Live Cloud Status | Status Justification |
|---|---|---|---|---|---|
| **G5-BLK-007-A** | IP-based threshold (10 attempts / 15m) | `src/lib/security/rate-limit/login-rate-limit.ts` | **PASS (100%)** | **BLOCKED** | Testing against shared Redis risks locking real IP |
| **G5-BLK-007-B** | Account threshold (5 failed attempts / 15m)| `src/lib/security/rate-limit/login-rate-limit.ts` | **PASS (100%)** | **BLOCKED** | Testing against shared Redis risks locking real account |
| **G5-BLK-007-C** | Blocked-attempt non-extension behavior | `recordBlockedLoginAttempt()` | **PASS (100%)** | **BLOCKED** | Verified in unit test; cloud verification pending isolated DB |
| **G5-BLK-007-D** | Successful-login reset behavior | `recordSuccessfulLogin()` | **PASS (100%)** | **BLOCKED** | Verified in unit test; cloud verification pending isolated DB |
| **G5-BLK-007-E** | HTTP 429 and Retry-After header | `createRateLimitResponse()` | **PASS (100%)** | **BLOCKED** | Verified in unit test; cloud verification pending isolated DB |
| **G5-BLK-007-F** | Upstream Redis failure / timeout behavior | `checkLoginRateLimit()` catch block | **PASS (100%)** | **BLOCKED** | Fail-open behavior confirmed in code and simulation |

---

## 3. SEC-FIND-06 REMEDIATION AUDIT (LOCKOUT NON-EXTENSION)

### Vulnerability Addressed
Previously, an attacker could continuously extend a victim's lockout by repeatedly submitting login attempts while the account was locked out.

### Verified Defense
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
Deterministic unit tests confirmed that blocked login attempts increment IP counters while leaving account-specific reset timestamps unaffected.
