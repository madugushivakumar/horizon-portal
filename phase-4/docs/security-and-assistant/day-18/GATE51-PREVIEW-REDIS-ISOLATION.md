# GATE 5.1 — PREVIEW REDIS ISOLATION AUDIT REPORT

**Project:** Horizon Portal  
**Date:** November 19, 2026  
**Auditor:** Application Security Engineer & Distributed Systems Lead  

---

## 1. Upstash Redis Namespace Isolation (`src/lib/security/rate-limit/config.ts`)

```typescript
prefix:
  process.env.RATE_LIMIT_PREFIX ||
  (process.env.VERCEL_ENV === "preview" ? "rl:preview:auth" : DEFAULT_RATE_LIMIT_CONFIG.prefix)
```

### Verification Results:
1. **Dynamic Routing:**
   - In Preview (`process.env.VERCEL_ENV === "preview"`): `prefix` evaluates to `rl:preview:auth`.
   - In Production (`process.env.VERCEL_ENV === "production"`): `prefix` evaluates to `rl:auth`.
2. **Key Formats:**
   - Client IP: `<prefix>:ip:<normalized_ip>`
   - Account: `<prefix>:account:<hmac_sha256_hex>`
3. **Decoupled Reset Invariant:**
   Successful logins reset only the account failure key (`<prefix>:account:<hmac_hex>`). The client IP abuse key (`<prefix>:ip:<normalized_ip>`) is strictly preserved across authentication events.
4. **Safety & Zero Disruption:**
   Because Preview and Production namespaces are distinct, preview rate-limiting tests cannot modify production counters or trigger production account lockouts.
   Destructive commands (`FLUSHDB`, `FLUSHALL`) are strictly disallowed.
