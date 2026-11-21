/**
 * Horizon Portal — Stage F Distributed Login Rate Limiting Verification Suite
 * scripts/test-day18-login-rate-limit.ts
 *
 * Comprehensive automated verification for:
 * 1. Client IP extraction, normalization, port-stripping, and header precedence
 * 2. Pseudonymous HMAC-SHA256 account key derivation and zero-leakage guarantee
 * 3. Distributed store atomic operations and TTL expiry mechanics
 * 4. Dual-dimension rate limiting (IP threshold = 10, Account threshold = 5)
 * 5. Distributed brute-force defense (rotating IPs against single account blocked)
 * 6. Credential stuffing defense (single IP spraying multiple accounts blocked)
 * 7. HTTP 429 contract verification (Retry-After header, generic error payload, anti-enumeration)
 * 8. Zero-token / zero-cookie issuance invariant under rate limit block
 * 9. Account counter reset on successful authentication
 * 10. Operational resilience (fail-open vs fail-closed policy)
 */

import { NextRequest } from "next/server";
import {
  getClientIp,
  normalizeIp,
  getAccountRateLimitKey,
  hashAccountIdentifier,
  normalizeEmail,
  MemoryDistributedStore,
  setRateLimitStoreForTesting,
  checkLoginRateLimit,
  recordFailedLoginAttempt,
  recordSuccessfulLogin,
  createRateLimitResponse,
  RATE_LIMIT_ERROR_MESSAGE,
} from "../src/lib/security/rate-limit";
import { POST as loginHandler } from "../src/app/api/v1/auth/login/route";

let passed = 0;
let failed = 0;

function assert(condition: boolean, description: string, details?: unknown) {
  if (condition) {
    passed++;
    console.log(`  [PASS] ${description}`);
  } else {
    failed++;
    console.error(`  [FAIL] ${description}`);
    if (details !== undefined) {
      console.error("         Details:", details);
    }
  }
}

async function runTests() {
  console.log("================================================================================");
  console.log("  HORIZON PORTAL — PHASE 4, DAY 18: STAGE F RATE LIMITING TEST SUITE");
  console.log("================================================================================\n");

  const memoryStore = new MemoryDistributedStore();
  setRateLimitStoreForTesting(memoryStore);

  // --------------------------------------------------------------------------
  // SECTION 1: Client IP Extraction & Normalization
  // --------------------------------------------------------------------------
  console.log("--- Section 1: Client IP Extraction and Normalization ---");

  assert(normalizeIp("192.168.1.100") === "192.168.1.100", "Normalizes clean IPv4 address");
  assert(normalizeIp("  10.0.0.1  ") === "10.0.0.1", "Trims whitespace from IPv4");
  assert(normalizeIp("192.168.1.50:8080") === "192.168.1.50", "Strips port from IPv4 address");
  assert(normalizeIp("::ffff:192.0.2.1") === "192.0.2.1", "Strips ::ffff: IPv4-mapped IPv6 prefix");
  assert(
    normalizeIp("2001:0db8:85a3:0000:0000:8a2e:0370:7334") ===
      "2001:0db8:85a3:0000:0000:8a2e:0370:7334",
    "Preserves valid standard IPv6 address"
  );
  assert(normalizeIp("::1") === "::1", "Preserves compressed IPv6 localhost address");
  assert(normalizeIp("[2001:db8::1]:8080") === "2001:db8::1", "Strips brackets and port from IPv6");
  assert(normalizeIp("999.999.999.999") === null, "Rejects out-of-range IPv4 address");
  assert(normalizeIp("invalid-ip-string") === null, "Rejects arbitrary non-IP string");
  assert(normalizeIp("") === null, "Rejects empty IP string");

  // Header precedence in Request
  const reqWithAllHeaders = new Request("https://horizon.local/api/v1/auth/login", {
    headers: {
      "x-real-ip": "203.0.113.1",
      "x-vercel-forwarded-for": "203.0.113.2",
      "x-forwarded-for": "203.0.113.3, 10.0.0.1",
    },
  });
  assert(
    getClientIp(reqWithAllHeaders) === "203.0.113.2",
    "Prioritizes platform-authoritative x-vercel-forwarded-for when both x-vercel and x-real-ip present"
  );

  const reqWithRealIpFallback = new Request("https://horizon.local/api/v1/auth/login", {
    headers: {
      "x-real-ip": "203.0.113.1",
      "x-forwarded-for": "203.0.113.3, 10.0.0.1",
    },
  });
  assert(
    getClientIp(reqWithRealIpFallback) === "203.0.113.1",
    "Falls back to x-real-ip when x-vercel-forwarded-for is absent"
  );

  const reqWithVercelHeader = new Request("https://horizon.local/api/v1/auth/login", {
    headers: {
      "x-vercel-forwarded-for": "203.0.113.4, 198.51.100.1",
      "x-forwarded-for": "203.0.113.5",
    },
  });
  assert(
    getClientIp(reqWithVercelHeader) === "203.0.113.4",
    "Extracts first IP from x-vercel-forwarded-for"
  );

  const reqWithForwardedHeader = new Request("https://horizon.local/api/v1/auth/login", {
    headers: {
      "x-forwarded-for": "198.51.100.25:443, 10.0.0.1",
    },
  });
  assert(
    getClientIp(reqWithForwardedHeader) === "198.51.100.25",
    "Extracts first IP from x-forwarded-for and strips port"
  );

  const reqWithNoHeaders = new Request("https://horizon.local/api/v1/auth/login");
  assert(
    getClientIp(reqWithNoHeaders) === "unknown-client-ip",
    "Falls back to unknown-client-ip when no client IP header exists"
  );

  // --------------------------------------------------------------------------
  // SECTION 2: Pseudonymous Account Key Derivation
  // --------------------------------------------------------------------------
  console.log("\n--- Section 2: Pseudonymous Account Key Derivation ---");

  assert(normalizeEmail("  User.Test@Horizon.COM  ") === "user.test@horizon.com", "Normalizes email (trim and lowercase)");
  assert(normalizeEmail("") === null, "Normalizes empty email to null");
  assert(normalizeEmail(undefined) === null, "Handles undefined email");

  const hash1 = hashAccountIdentifier("admin@horizon.com");
  const hash2 = hashAccountIdentifier("  ADMIN@horizon.COM  ");
  assert(typeof hash1 === "string" && hash1.length === 64, "Generates 64-character HMAC-SHA256 hex digest");
  assert(hash1 === hash2, "Normalizes email before hashing; identical digests produced");

  const accountKey = getAccountRateLimitKey("admin@horizon.com", "rl:auth");
  assert(
    accountKey === `rl:auth:account:${hash1}`,
    "Formats key as <prefix>:account:<hmac_hex>"
  );
  assert(
    !accountKey?.includes("admin") && !accountKey?.includes("horizon.com"),
    "Guarantees raw email string is NEVER present in Redis key"
  );

  // --------------------------------------------------------------------------
  // SECTION 3: Distributed Store Atomic Operations
  // --------------------------------------------------------------------------
  console.log("\n--- Section 3: Distributed Store Atomic Operations ---");

  memoryStore.clear();
  const testKey = "test:atomic:counter";

  const inc1 = await memoryStore.incrementAndGetTTL(testKey, 10);
  assert(inc1.count === 1 && inc1.ttlMs > 9000 && inc1.ttlMs <= 10000, "First increment sets count=1 and initial TTL");

  const inc2 = await memoryStore.incrementAndGetTTL(testKey, 10);
  assert(inc2.count === 2, "Second increment returns count=2");

  const getState = await memoryStore.get(testKey);
  assert(getState.count === 2, "get() retrieves current count without mutating");

  const resetResult = await memoryStore.reset(testKey);
  assert(resetResult === true, "reset() deletes existing key");

  const afterReset = await memoryStore.get(testKey);
  assert(afterReset.count === 0 && afterReset.ttlMs === 0, "get() returns count=0 for non-existent key");

  // --------------------------------------------------------------------------
  // SECTION 4: IP Rate Limiting Enforcement (Threshold = 10 attempts)
  // --------------------------------------------------------------------------
  console.log("\n--- Section 4: IP Rate Limiting Enforcement ---");

  memoryStore.clear();
  const ipReq = new Request("https://horizon.local/api/v1/auth/login", {
    headers: { "x-real-ip": "198.51.100.99" },
  });

  // Verify initial state
  const initialDecision = await checkLoginRateLimit(ipReq);
  assert(initialDecision.allowed === true && initialDecision.remaining === 10, "Initial check allows request with remaining=10");

  // Record 10 failed login attempts from this IP
  for (let i = 1; i <= 10; i++) {
    await recordFailedLoginAttempt(ipReq);
  }

  // 11th attempt must be blocked
  const blockedDecision = await checkLoginRateLimit(ipReq);
  assert(blockedDecision.allowed === false, "11th attempt from same IP is blocked");
  assert(blockedDecision.limitType === "ip", "Limit type identifies as 'ip'");
  assert((blockedDecision.retryAfterSeconds ?? 0) > 0, "Provides positive retryAfterSeconds");

  const blockedResponse = createRateLimitResponse(blockedDecision);
  assert(blockedResponse.status === 429, "Returns HTTP 429 Too Many Requests");
  assert(blockedResponse.headers.get("Retry-After") !== null, "Sets Retry-After header");
  assert(blockedResponse.headers.get("X-RateLimit-Remaining") === "0", "Sets X-RateLimit-Remaining: 0");

  const blockedBody = await blockedResponse.json();
  assert(
    blockedBody.error === RATE_LIMIT_ERROR_MESSAGE,
    "Returns standardized generic error payload concealing dimension"
  );

  // --------------------------------------------------------------------------
  // SECTION 5: Targeted Account Brute-Force Protection (Threshold = 5 failed attempts)
  // --------------------------------------------------------------------------
  console.log("\n--- Section 5: Targeted Account Brute-Force Protection ---");

  memoryStore.clear();
  const targetEmail = "target.executive@horizon.com";

  // Simulate distributed botnet rotating IPs against single target email
  for (let i = 1; i <= 5; i++) {
    const rotatingIpReq = new Request("https://horizon.local/api/v1/auth/login", {
      headers: { "x-real-ip": `203.0.113.${10 + i}` },
    });
    await recordFailedLoginAttempt(rotatingIpReq, targetEmail);
  }

  // 6th attempt from a fresh, never-before-seen IP targeting the same account
  const freshIpReq = new Request("https://horizon.local/api/v1/auth/login", {
    headers: { "x-real-ip": "192.0.2.200" },
  });

  const accountBlockedDecision = await checkLoginRateLimit(freshIpReq, targetEmail);
  assert(
    accountBlockedDecision.allowed === false,
    "Blocks distributed brute-force attack against single account across rotating IPs"
  );
  assert(accountBlockedDecision.limitType === "account", "Limit type identifies as 'account'");

  // However, a different account from that fresh IP should still be allowed!
  const differentAccountDecision = await checkLoginRateLimit(freshIpReq, "other.employee@horizon.com");
  assert(
    differentAccountDecision.allowed === true,
    "Fresh IP targeting an unblocked account is NOT blocked (avoids false-positive spillover)"
  );

  // --------------------------------------------------------------------------
  // SECTION 6: Account Counter Reset on Successful Login
  // --------------------------------------------------------------------------
  console.log("\n--- Section 6: Account Counter Reset on Successful Login ---");

  memoryStore.clear();
  const legitimateEmail = "legit.user@horizon.com";
  const userReq = new Request("https://horizon.local/api/v1/auth/login", {
    headers: { "x-real-ip": "10.10.10.1" },
  });

  // User mistypes password 3 times
  for (let i = 1; i <= 3; i++) {
    await recordFailedLoginAttempt(userReq, legitimateEmail);
  }

  const legitKey = getAccountRateLimitKey(legitimateEmail)!;
  const beforeState = await memoryStore.get(legitKey);
  assert(beforeState.count === 3, "Failure counter is 3 after mistyped passwords");

  // User enters correct password -> recordSuccessfulLogin
  await recordSuccessfulLogin(userReq, legitimateEmail);

  const afterState = await memoryStore.get(legitKey);
  assert(afterState.count === 0, "Successful login resets account failure counter to 0");

  // IP failure counter is NOT reset (prevents account-cracking loops from resetting attacker IP)
  const ipKey = `rl:auth:ip:10.10.10.1`;
  const ipAfterSuccess = await memoryStore.get(ipKey);
  assert(ipAfterSuccess.count === 3, "Successful login does NOT reset IP counter (security invariant)");

  // --------------------------------------------------------------------------
  // SECTION 7: Route Handler Integration (POST /api/v1/auth/login)
  // --------------------------------------------------------------------------
  console.log("\n--- Section 7: Route Handler Integration & Security Invariants ---");

  memoryStore.clear();
  const testIp = "198.51.100.123";
  const victimEmail = "rate.test.victim@horizon.com";

  // Trip the account limit
  for (let i = 1; i <= 5; i++) {
    const tripReq = new NextRequest("http://localhost:3000/api/v1/auth/login", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-real-ip": `203.0.113.${50 + i}`,
      },
      body: JSON.stringify({
        email: victimEmail,
        password: "WrongPassword123!",
      }),
    });
    const res = await loginHandler(tripReq);
    assert(res.status === 401, `Attempt ${i} returns 401 invalid credentials`);
  }

  // 6th attempt should now be rate-limited by the handler directly with HTTP 429
  const blockedReq = new NextRequest("http://localhost:3000/api/v1/auth/login", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-real-ip": testIp,
    },
    body: JSON.stringify({
      email: victimEmail,
      password: "AnyPassword!",
    }),
  });

  const handlerRes = await loginHandler(blockedReq);
  assert(handlerRes.status === 429, "Route handler returns HTTP 429 Too Many Requests");
  assert(handlerRes.headers.get("Retry-After") !== null, "Route handler sets Retry-After header");
  assert(
    handlerRes.headers.get("Set-Cookie") === null,
    "Rate-limited request issues ZERO session cookies (Set-Cookie is null)"
  );

  const handlerBody = await handlerRes.json();
  assert(
    handlerBody.error === RATE_LIMIT_ERROR_MESSAGE,
    "Route handler returns generic rate-limit error message"
  );
  assert(!("token" in handlerBody), "Rate-limited response returns ZERO tokens");
  assert(!("user" in handlerBody), "Rate-limited response returns ZERO user data");

  // Verify SEC-FIND-06 fix:
  // 1. Blocked request must increment the IP abuse counter
  const ipStateAfterBlock = await memoryStore.get(`rl:auth:ip:${testIp}`);
  assert(
    ipStateAfterBlock.count === 1,
    "SEC-FIND-06: Blocked request increments client IP abuse counter (count=1)"
  );

  // 2. Blocked request must NOT increment the account failure counter beyond threshold
  const victimKey = getAccountRateLimitKey(victimEmail)!;
  const victimAccountState = await memoryStore.get(victimKey);
  assert(
    victimAccountState.count === 5,
    "SEC-FIND-06: Blocked request does NOT increment account counter past threshold (count remains 5)"
  );

  // 3. Send 9 more blocked attempts from this IP targeting the already-blocked account
  for (let i = 2; i <= 10; i++) {
    const loopReq = new NextRequest("http://localhost:3000/api/v1/auth/login", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-real-ip": testIp,
      },
      body: JSON.stringify({
        email: victimEmail,
        password: "AnyPassword!",
      }),
    });
    await loginHandler(loopReq);
  }
  const ipStateAtLimit = await memoryStore.get(`rl:auth:ip:${testIp}`);
  assert(
    ipStateAtLimit.count === 10,
    "IP counter accumulates all 10 blocked attempts from the client IP"
  );

  // 4. 11th attempt from this IP targeting a FRESH, unblocked account must now be blocked under the IP threshold!
  const freshAccountReq = new NextRequest("http://localhost:3000/api/v1/auth/login", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-real-ip": testIp,
    },
    body: JSON.stringify({
      email: "fresh.innocent.user@horizon.com",
      password: "AnyPassword123!",
    }),
  });
  const freshRes = await loginHandler(freshAccountReq);
  assert(
    freshRes.status === 429,
    "SEC-FIND-06: 11th attempt targeting fresh account is blocked under IP limit (account-cycling thwarted)"
  );

  // --------------------------------------------------------------------------
  // SECTION 8: Production Shared Store Configuration Enforcement (SEC-FIND-07)
  // --------------------------------------------------------------------------
  console.log("\n--- Section 8: Production Shared Store Enforcement (SEC-FIND-07) ---");

  // Temporarily unset custom testing store so getRateLimitStore() evaluates environment
  setRateLimitStoreForTesting(null);
  const originalEnv = process.env.NODE_ENV;
  const originalUrl = process.env.UPSTASH_REDIS_REST_URL;
  const originalToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  try {
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;

    const { getRateLimitStore } = await import("../src/lib/security/rate-limit/store");

    let threwInProd = false;
    try {
      getRateLimitStore();
    } catch (err) {
      threwInProd = true;
      assert(
        (err as Error).message.includes("Production distributed rate limiting requires valid"),
        "SEC-FIND-07: Throws explicit error in production when Upstash credentials are unset"
      );
    }
    assert(threwInProd, "Production strictly prohibits silent in-memory fallback");

    // Malformed URL validation
    let threwMalformed = false;
    process.env.UPSTASH_REDIS_REST_URL = "ftp://invalid-url.com";
    process.env.UPSTASH_REDIS_REST_TOKEN = "valid-token";
    try {
      getRateLimitStore();
    } catch (err) {
      threwMalformed = true;
      assert(
        (err as Error).message.includes("Invalid Upstash Redis URL"),
        "SEC-FIND-07: Rejects malformed non-HTTP/HTTPS Upstash URL"
      );
    }
    assert(threwMalformed, "Rejects malformed Redis endpoint URLs");

    // Valid configuration
    process.env.UPSTASH_REDIS_REST_URL = "https://mock-cluster.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "mock-secret-token";
    const prodStore = getRateLimitStore();
    assert(
      prodStore instanceof Object && "incrementAndGetTTL" in prodStore,
      "Valid Upstash URL and Token creates Upstash store in production"
    );

  } finally {
    (process.env as Record<string, string | undefined>).NODE_ENV = originalEnv;
    if (originalUrl !== undefined) process.env.UPSTASH_REDIS_REST_URL = originalUrl;
    else delete process.env.UPSTASH_REDIS_REST_URL;
    if (originalToken !== undefined) process.env.UPSTASH_REDIS_REST_TOKEN = originalToken;
    else delete process.env.UPSTASH_REDIS_REST_TOKEN;
    // Restore test store
    setRateLimitStoreForTesting(memoryStore);
  }

  // --------------------------------------------------------------------------
  // SUMMARY
  // --------------------------------------------------------------------------
  console.log("\n================================================================================");
  console.log(`  STAGE H TEST EXECUTION COMPLETE: Passed: ${passed} | Failed: ${failed}`);
  console.log("================================================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution fatal error:", err);
  process.exit(1);
});
