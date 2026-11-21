/**
 * Horizon Portal — Rate Limiting Policy Configuration
 * src/lib/security/rate-limit/config.ts
 */

import { RateLimitConfig } from "./types";

/**
 * Default distributed rate-limiting thresholds:
 * - IP limit: 10 attempts per 15 minutes (mitigates credential stuffing sweeps & DDoS)
 * - Account limit: 5 failed attempts per 15 minutes (mitigates targeted account brute-forcing)
 * - Failure mode: fail-open (prioritizes enterprise employee login availability during upstream Redis degraded state)
 */
export const DEFAULT_RATE_LIMIT_CONFIG: RateLimitConfig = {
  ipLimit: 10,
  ipWindowSeconds: 900, // 15 minutes
  accountLimit: 5,
  accountWindowSeconds: 900, // 15 minutes
  failureMode: "fail-open",
  prefix: "rl:auth",
};

export function getRateLimitConfig(): RateLimitConfig {
  const ipLimit = parseInt(process.env.RATE_LIMIT_IP_MAX || "", 10);
  const ipWindow = parseInt(process.env.RATE_LIMIT_IP_WINDOW || "", 10);
  const accountLimit = parseInt(process.env.RATE_LIMIT_ACCOUNT_MAX || "", 10);
  const accountWindow = parseInt(process.env.RATE_LIMIT_ACCOUNT_WINDOW || "", 10);
  const failureMode = process.env.RATE_LIMIT_FAILURE_MODE === "fail-closed" ? "fail-closed" : "fail-open";

  return {
    ipLimit: Number.isFinite(ipLimit) && ipLimit > 0 ? ipLimit : DEFAULT_RATE_LIMIT_CONFIG.ipLimit,
    ipWindowSeconds: Number.isFinite(ipWindow) && ipWindow > 0 ? ipWindow : DEFAULT_RATE_LIMIT_CONFIG.ipWindowSeconds,
    accountLimit: Number.isFinite(accountLimit) && accountLimit > 0 ? accountLimit : DEFAULT_RATE_LIMIT_CONFIG.accountLimit,
    accountWindowSeconds: Number.isFinite(accountWindow) && accountWindow > 0 ? accountWindow : DEFAULT_RATE_LIMIT_CONFIG.accountWindowSeconds,
    failureMode,
    prefix:
      process.env.RATE_LIMIT_PREFIX ||
      (process.env.VERCEL_ENV === "preview" ? "rl:preview:auth" : DEFAULT_RATE_LIMIT_CONFIG.prefix),
  };
}
