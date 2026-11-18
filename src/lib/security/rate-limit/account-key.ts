/**
 * Horizon Portal — Pseudonymous Account Key Derivation
 * src/lib/security/rate-limit/account-key.ts
 *
 * Derives irreversible, pseudonymous HMAC-SHA256 account identifiers for rate limiting.
 * Ensures that raw employee emails are NEVER exposed in Redis keys, metrics, or telemetry.
 */

import { createHmac } from "node:crypto";
import { DEFAULT_RATE_LIMIT_CONFIG } from "./config";

/**
 * Normalizes an email address according to standard enterprise identity rules:
 * - Trims leading and trailing whitespace
 * - Converts to lowercase
 */
export function normalizeEmail(email: string | null | undefined): string | null {
  if (!email || typeof email !== "string") {
    return null;
  }
  const trimmed = email.trim().toLowerCase();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Computes an HMAC-SHA256 hex digest of the normalized email.
 * Uses RATE_LIMIT_SECRET or AUTH_SECRET as the HMAC secret key.
 */
export function hashAccountIdentifier(email: string | null | undefined): string | null {
  const normalized = normalizeEmail(email);
  if (!normalized) {
    return null;
  }

  const isProduction = process.env.NODE_ENV === "production";
  const secret =
    process.env.RATE_LIMIT_SECRET ||
    process.env.AUTH_SECRET ||
    (isProduction ? null : "horizon-portal-pseudonymous-rate-limit-hmac-salt");

  if (!secret) {
    throw new Error(
      "Production rate limiting requires RATE_LIMIT_SECRET or AUTH_SECRET to be configured. Hardcoded fallback salt is disabled in production."
    );
  }

  const hmac = createHmac("sha256", secret);
  hmac.update(normalized, "utf8");
  return hmac.digest("hex");
}

/**
 * Formats the full distributed store key for account rate limiting:
 * `<prefix>:account:<hmac_hex>`
 * e.g., `rl:auth:account:a3f59e...`
 */
export function getAccountRateLimitKey(
  email: string | null | undefined,
  prefix: string = DEFAULT_RATE_LIMIT_CONFIG.prefix
): string | null {
  const hmacHex = hashAccountIdentifier(email);
  if (!hmacHex) {
    return null;
  }
  return `${prefix}:account:${hmacHex}`;
}
