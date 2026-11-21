/**
 * Horizon Portal — Non-Destructive Upstash Redis Connectivity Test
 * scripts/test-redis-connectivity.ts
 *
 * Verifies live Upstash Redis connectivity in production configuration:
 * 1. Verifies presence and valid protocol of UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.
 * 2. Connects using UpstashRedisStore.
 * 3. Tests atomic pipeline operations (INCR + EXPIRE + PTTL) using a dedicated temporary key.
 * 4. Cleans up only the temporary key.
 * 5. Strictly protects secrets; never logs tokens, URLs, or Redis keys.
 */

import { UpstashRedisStore } from "../src/lib/security/rate-limit/store";

async function main() {
  console.log("================================================================================");
  console.log("  HORIZON PORTAL — PRODUCTION UPSTASH REDIS CONNECTIVITY TEST");
  console.log("================================================================================");

  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

  if (!url || !token) {
    console.error("[STATUS: BLOCKED] UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN is not configured.");
    console.error("  Configure these variables in your environment or Vercel Project Settings to proceed.");
    process.exit(2);
  }

  if (!url.startsWith("https://") && !url.startsWith("http://")) {
    console.error("[STATUS: ERROR] UPSTASH_REDIS_REST_URL must start with https:// or http://");
    process.exit(1);
  }

  console.log("[CHECK] Upstash Redis credentials detected in environment.");
  console.log("[CHECK] Protocol validation passed (valid HTTP/HTTPS endpoint).");

  const store = new UpstashRedisStore(url, token, 3000);
  const testKey = `test:connectivity:${Date.now()}`;

  try {
    console.log("[TEST] Performing atomic INCR and TTL test on temporary namespace...");
    const result = await store.incrementAndGetTTL(testKey, 60);

    if (result.count !== 1) {
      throw new Error(`Expected count=1 on initial test increment, got count=${result.count}`);
    }

    if (result.ttlMs <= 0) {
      throw new Error(`Expected positive TTL, got ttlMs=${result.ttlMs}`);
    }

    console.log("[PASS] Atomic pipeline execution successful (INCR count=1, positive TTL confirmed).");

    console.log("[TEST] Cleaning up temporary test key...");
    const deleted = await store.reset(testKey);

    if (!deleted) {
      console.warn("[WARN] Temporary key deletion returned non-1 result (key may have already expired).");
    } else {
      console.log("[PASS] Temporary test key cleanly deleted from shared Redis.");
    }

    console.log("================================================================================");
    console.log("  VERDICT: PASS — Upstash Redis is reachable and operational.");
    console.log("================================================================================");
  } catch (error) {
    console.error("[STATUS: FAIL] Redis connectivity failed:", error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Unexpected error during test execution:", err);
  process.exit(1);
});
