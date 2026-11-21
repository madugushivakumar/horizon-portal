/**
 * Horizon Portal — Login Rate Limiting & Brute-Force Protection Service
 * src/lib/security/rate-limit/login-rate-limit.ts
 *
 * Implements dual-dimension distributed rate limiting for POST /api/v1/auth/login:
 * 1. IP Dimension: 10 attempts per 15 minutes (mitigates distributed spraying & volumetric attacks)
 * 2. Account Dimension: 5 failed attempts per 15 minutes (mitigates targeted credential brute-forcing)
 *
 * Adheres to:
 * - Unified HTTP 429 response preventing user enumeration
 * - Pseudonymous HMAC-SHA256 account keys (zero plaintext email leakage)
 * - Configurable failure policy (fail-open enterprise default vs fail-closed)
 */

import { NextRequest, NextResponse } from "next/server";
import { getRateLimitConfig } from "./config";
import { getClientIp } from "./client-ip";
import { getAccountRateLimitKey } from "./account-key";
import { getRateLimitStore } from "./store";
import { RateLimitDecision } from "./types";

/**
 * Standard generic error message for rate-limited requests.
 * Explicitly conceals whether the account exists or which dimension triggered the block.
 */
export const RATE_LIMIT_ERROR_MESSAGE = "Too many login attempts. Please try again later.";

/**
 * Checks whether an incoming login request is allowed under the current IP and account limits.
 * Inspects state without incrementing failure counters (increment occurs upon authentication failure).
 */
export async function checkLoginRateLimit(
  req: NextRequest | Request,
  email?: string
): Promise<RateLimitDecision> {
  const config = getRateLimitConfig();
  const clientIp = getClientIp(req);
  const ipKey = `${config.prefix}:ip:${clientIp}`;
  const accountKey = email ? getAccountRateLimitKey(email, config.prefix) : null;

  try {
    const store = getRateLimitStore();
    // 1. Check IP rate limit
    const ipState = await store.get(ipKey);
    if (ipState.count >= config.ipLimit) {
      const retryAfterSeconds = Math.max(1, Math.ceil(ipState.ttlMs / 1000));
      return {
        allowed: false,
        limitType: "ip",
        retryAfterSeconds,
        remaining: 0,
        limit: config.ipLimit,
        resetAt: new Date(Date.now() + ipState.ttlMs),
      };
    }

    // 2. Check Account rate limit (if email provided)
    if (accountKey) {
      const accountState = await store.get(accountKey);
      if (accountState.count >= config.accountLimit) {
        const retryAfterSeconds = Math.max(1, Math.ceil(accountState.ttlMs / 1000));
        return {
          allowed: false,
          limitType: "account",
          retryAfterSeconds,
          remaining: 0,
          limit: config.accountLimit,
          resetAt: new Date(Date.now() + accountState.ttlMs),
        };
      }
    }

    const remaining = Math.max(0, config.ipLimit - ipState.count);
    return {
      allowed: true,
      remaining,
      limit: config.ipLimit,
    };
  } catch (err) {
    // Operational resilience: handle store failure
    if (config.failureMode === "fail-closed") {
      console.error("[RateLimit] Store failure in fail-closed mode; rejecting request:", (err as Error).message);
      return {
        allowed: false,
        retryAfterSeconds: 60,
        limit: config.ipLimit,
        remaining: 0,
      };
    }

    // Fail-open default: log warning and permit login attempt to protect service availability
    console.warn("[RateLimit] Store failure in fail-open mode; permitting request:", (err as Error).message);
    return {
      allowed: true,
      remaining: 1,
      limit: config.ipLimit,
    };
  }
}

/**
 * Records an authentication failure by incrementing both the IP counter and the Account counter.
 */
export async function recordFailedLoginAttempt(
  req: NextRequest | Request,
  email?: string
): Promise<void> {
  const config = getRateLimitConfig();
  const clientIp = getClientIp(req);
  const ipKey = `${config.prefix}:ip:${clientIp}`;
  const accountKey = email ? getAccountRateLimitKey(email, config.prefix) : null;

  try {
    const store = getRateLimitStore();
    // Increment IP failure counter
    await store.incrementAndGetTTL(ipKey, config.ipWindowSeconds);

    // Increment Account failure counter (if email exists)
    if (accountKey) {
      await store.incrementAndGetTTL(accountKey, config.accountWindowSeconds);
    }
  } catch (err) {
    console.warn("[RateLimit] Failed to record login failure counter:", (err as Error).message);
  }
}

/**
 * Records a rate-limit blocked attempt against the client IP only (SEC-FIND-06 Remediation).
 * Crucially, does NOT increment the account counter, preventing attackers from artificially
 * extending an account's lockout duration while ensuring all hostile requests contribute to IP throttling.
 */
export async function recordBlockedLoginAttempt(
  req: NextRequest | Request
): Promise<void> {
  const config = getRateLimitConfig();
  const clientIp = getClientIp(req);
  const ipKey = `${config.prefix}:ip:${clientIp}`;

  try {
    const store = getRateLimitStore();
    await store.incrementAndGetTTL(ipKey, config.ipWindowSeconds);
  } catch (err) {
    console.warn("[RateLimit] Failed to record blocked login attempt counter:", (err as Error).message);
  }
}

/**
 * Resets the account-specific failure counter upon a successful authentication.
 * Leaves the IP counter intact to prevent attacker account-cycling exploits.
 */
export async function recordSuccessfulLogin(
  _req: NextRequest | Request,
  email?: string
): Promise<void> {
  if (!email) return;

  const config = getRateLimitConfig();
  const accountKey = getAccountRateLimitKey(email, config.prefix);

  if (accountKey) {
    try {
      const store = getRateLimitStore();
      await store.reset(accountKey);
    } catch (err) {
      console.warn("[RateLimit] Failed to reset account counter on successful login:", (err as Error).message);
    }
  }
}

/**
 * Constructs an RFC-compliant HTTP 429 Too Many Requests response.
 */
export function createRateLimitResponse(decision: RateLimitDecision): NextResponse {
  const retryAfter = Math.max(1, decision.retryAfterSeconds || 60);

  const headers = new Headers();
  headers.set("Content-Type", "application/json");
  headers.set("Retry-After", String(retryAfter));
  if (typeof decision.limit === "number") {
    headers.set("X-RateLimit-Limit", String(decision.limit));
  }
  headers.set("X-RateLimit-Remaining", "0");
  if (decision.resetAt) {
    headers.set("X-RateLimit-Reset", String(Math.floor(decision.resetAt.getTime() / 1000)));
  }

  return new NextResponse(
    JSON.stringify({
      error: RATE_LIMIT_ERROR_MESSAGE,
    }),
    {
      status: 429,
      headers,
    }
  );
}
