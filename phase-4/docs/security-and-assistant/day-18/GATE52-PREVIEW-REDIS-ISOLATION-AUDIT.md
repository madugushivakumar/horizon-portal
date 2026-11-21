# GATE 5.2 — PREVIEW REDIS ISOLATION & RATE-LIMIT AUDIT

**Project:** Horizon Portal  
**Branch:** `day18-preview-validation`  
**Date:** November 19, 2026  
**Auditor:** Application Security Engineer & Distributed Systems Architect  

---

## 1. Upstash Redis Rate Limiting Architecture

The Day 18 distributed login rate limiter protects Horizon Portal against credential-stuffing and distributed brute-force attacks across IP addresses and target accounts.

The implementation is located at `src/lib/security/rate-limit/config.ts`:
```typescript
function resolveKeyPrefix(): string {
  const vercelEnv = process.env.VERCEL_ENV;
  if (vercelEnv === 'preview') {
    return 'rl:preview:auth';
  }
  if (vercelEnv === 'development') {
    return 'rl:dev:auth';
  }
  return 'rl:auth';
}
```

---

## 2. Namespace Segregation Matrix

| Environment | `VERCEL_ENV` Value | Redis Key Prefix | Production Collision Risk |
| :--- | :--- | :--- | :--- |
| **Production** | `production` (or unset) | `rl:auth` | Baseline |
| **Vercel Preview** | `preview` | `rl:preview:auth` | **ZERO (Namespaced)** |
| **Local Development** | `development` | `rl:dev:auth` | **ZERO (Namespaced)** |

### Key Structure Examples
- **Preview IP Key:** `rl:preview:auth:ip:198.51.100.24`
- **Preview Account Key:** `rl:preview:auth:account:<64-char-hmac-sha256>`
- **Production IP Key:** `rl:auth:ip:198.51.100.24`
- **Production Account Key:** `rl:auth:account:<64-char-hmac-sha256>`

---

## 3. Security Findings & Operational Rules

1. **Namespace Isolation Verified:**
   Because all preview operations strictly prefix keys with `rl:preview:auth`, live rate limiting tests performed against the Vercel Preview deployment can never alter or corrupt production rate-limiting counters.
2. **Prohibition of Global Flush Operations:**
   Even though keys are safely isolated by namespace prefix, global operations such as `FLUSHDB` or `FLUSHALL` are strictly prohibited because both environments may share the same underlying Upstash Redis instance.
3. **Fail-Closed Protection:**
   In production and preview environments, if Upstash credentials are missing or invalid, the limiter throws an explicit error rather than silently degrading to insecure in-memory storage (SEC-FIND-07).
