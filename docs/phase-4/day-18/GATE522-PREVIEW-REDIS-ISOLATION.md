# GATE 5.2.2 — PREVIEW REDIS NAMESPACE & RATE LIMITING INFRASTRUCTURE ISOLATION
## HORIZON PORTAL — DISTRIBUTED CACHE & KEYSPACE PARTITIONING REPORT

---

## 1. DISTRIBUTED RATE LIMITING ARCHITECTURE

Horizon Portal implements a distributed dual-dimension brute-force protection system powered by **Upstash Redis REST API** (`@upstash/redis`):

- **IP Dimension:** Limits any single client IP address to 10 login requests per 15-minute sliding window (900 seconds).
- **Account Dimension:** Limits failed login attempts targeting any single employee email to 5 attempts per 15-minute sliding window (900 seconds).
- **Pseudonymous Storage:** Account keys are hashed using `HMAC-SHA256(email, secret)` to prevent plaintext email leakage in Redis memory or logs.

---

## 2. NAMESPACE ISOLATION MECHANISM

To prevent Preview environment testing (such as brute-force tests or automated penetration probes) from exhausting rate limits or blocking legitimate employees in Production, keyspace prefix separation is implemented:

| Environment | Active Prefix | Example IP Key | Example Account Key |
|---|---|---|---|
| **Production** | `rl:auth` | `rl:auth:ip:198.51.100.1` | `rl:auth:acc:a1b2c3d4e5f6...` |
| **Preview** | `rl:preview:auth` | `rl:preview:auth:ip:198.51.100.1` | `rl:preview:auth:acc:a1b2c3d4e5f6...` |

### Code Verification (`src/lib/security/rate-limit/config.ts`)
```typescript
export function getRateLimitConfig(): RateLimitConfig {
  // ...
  return {
    // ...
    prefix:
      process.env.RATE_LIMIT_PREFIX ||
      (process.env.VERCEL_ENV === "preview" ? "rl:preview:auth" : DEFAULT_RATE_LIMIT_CONFIG.prefix),
  };
}
```

---

## 3. KEY SEPARATION & SAFETY AUDIT

1. **Keyspace Independence:**
   - Keys written by Preview instances are strictly scoped under `rl:preview:auth:*`.
   - Keys written by Production instances are strictly scoped under `rl:auth:*`.
   - Redis commands (`GET`, `SET`, `INCR`, `EXPIRE`) executed by Preview requests cannot query, mutate, or evict Production keys.
2. **Prohibition of Flush Commands:**
   - Automated scripts and handlers strictly avoid `FLUSHDB` or `FLUSHALL`.
   - Resetting test accounts is done strictly via individual key deletion (`DEL rl:preview:auth:acc:<hash>`).
3. **Fail-Open Resilience:**
   - In the event of network timeouts, Redis downtime, or quota exhaustion, `failureMode: "fail-open"` ensures that genuine user login requests are permitted with a warning log, avoiding denial-of-service to employees.
