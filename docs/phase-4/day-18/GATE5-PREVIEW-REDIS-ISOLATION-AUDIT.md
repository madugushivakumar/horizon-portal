# GATE 5 — PREVIEW REDIS ISOLATION AUDIT REPORT

**Project:** Horizon Portal  
**Date:** November 19, 2026  
**Auditor:** Application Security Engineer & Distributed Systems Auditor  

---

## 1. Executive Summary

Audit the Upstash Redis rate-limiting configuration across Preview and Production environments to evaluate key isolation, data boundaries, and collision risks.

---

## 2. Configuration & Policy Audit

| Parameter | Preview Environment | Production Environment | Isolation Mechanism |
| :--- | :--- | :--- | :--- |
| **Redis Endpoint** | Shared Upstash REST endpoint | Shared Upstash REST endpoint | Configured in Vercel settings |
| **Rate Limit Prefix**| `rl:preview:auth` | `rl:auth` | Dynamic code routing in `config.ts` |
| **IP Counter Key** | `rl:preview:auth:ip:<normalized_ip>` | `rl:auth:ip:<normalized_ip>` | Key prefix separation |
| **Account Counter Key**| `rl:preview:auth:account:<hmac_hex>` | `rl:auth:account:<hmac_hex>` | Key prefix separation |
| **Account Privacy** | HMAC-SHA256 (64-char hex digest) | HMAC-SHA256 (64-char hex digest) | Raw emails never stored in keys |
| **Failure Mode** | `fail-open` (configurable) | `fail-open` (configurable) | Bounded by 3000ms AbortController |

---

## 3. Verification & Safety Findings

1. **Namespace Separation:**
   `src/lib/security/rate-limit/config.ts` automatically evaluates `process.env.VERCEL_ENV === "preview" ? "rl:preview:auth" : "rl:auth"`.
   In Preview builds, Vercel injects `VERCEL_ENV="preview"`. This guarantees that Preview requests read and write strictly to `rl:preview:auth:...`, completely preventing key collisions with production `rl:auth:...`.
2. **Infrastructure Sharing Boundary:**
   Both environments utilize the same underlying Upstash database instance. Therefore, bulk destructive administrative commands (`FLUSHDB`, `FLUSHALL`) are strictly prohibited in code, tests, and operational runs to protect Production rate-limit state.
3. **Verdict:**
   **Key namespace isolation is CONFIRMED**. Administrative database-level isolation is shared. All tests adhere strictly to key-level expiration via TTLs.
