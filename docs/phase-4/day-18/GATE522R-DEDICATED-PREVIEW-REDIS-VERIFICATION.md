# GATE 5.2.2-R — DEDICATED PREVIEW REDIS VERIFICATION REPORT
## HORIZON PORTAL — CACHE INFRASTRUCTURE & KEYSPACE ISOLATION AUDIT

---

## 1. PREVIOUS REPORT CLAIM VS ARCHITECTURAL REALITY

### Previous Claim in Earlier Report
Earlier reports marked Redis Isolation as "PASS" based on the fact that `src/lib/security/rate-limit/config.ts` dynamically switches the key prefix from `rl:auth` to `rl:preview:auth` when `process.env.VERCEL_ENV === "preview"`.

### Architectural Audit Correction
A key prefix provides **logical keyspace partitioning within a single Redis database**. It does **not** provide independent infrastructure isolation:
1. **Shared Database Instance:** If Preview and Production share the same `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`, both tiers compete for the exact same daily command quota, memory limits, and bandwidth.
2. **Denial-of-Service Risk:** Volumetric brute-force testing against Preview can exhaust Upstash free-tier daily command limits, causing Production employee login rate-limiting to degrade or fail.
3. **Correct Finding:** True infrastructure isolation requires a **separate Upstash Redis database instance** dedicated to Preview testing.
4. **Current Status:** Logical keyspace partitioning (`rl:preview:auth`) is fully verified and active. Infrastructure-level database separation is **PENDING OWNER UPSTASH CONSOLE ACTION**.

---

## 2. RATE LIMITING SPECIFICATION & THRESHOLDS

Configured in `src/lib/security/rate-limit/config.ts` and `login-rate-limit.ts`:

| Dimension | Window | Threshold | Key Structure | Hash / Anonymization |
|---|---|---|---|---|
| **IP-Based** | 15 minutes (900s) | 10 attempts | `{prefix}:ip:{clientIp}` | Raw Client IP |
| **Account-Based** | 15 minutes (900s) | 5 failed attempts | `{prefix}:acc:{hash}` | HMAC-SHA256 (Zero plaintext email) |

### Non-Extension Mitigation (SEC-FIND-06)
- Implemented `recordBlockedLoginAttempt()` in `src/lib/security/rate-limit/login-rate-limit.ts`.
- When an account is locked out, further unauthorized attempts increment the client IP counter only.
- Crucially, the account key's TTL is **not** reset or extended, ensuring legitimate users regain account access after the original 15-minute lockout expires.

---

## 3. OWNER ACTION TO PROVISION DEDICATED PREVIEW REDIS

1. **Log in to Upstash Console:** Navigate to `https://console.upstash.com/redis`.
2. **Create New Database:**
   - Name: `horizon-portal-preview-redis`
   - Region: Asia Pacific (Singapore) `ap-southeast-1` (same region as Neon DB for minimal latency).
   - Type: Serverless.
3. **Copy Credentials:**
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
4. **Bind in Vercel:**
   - Add these variables scoped strictly to **Preview** in Vercel Project Settings.
