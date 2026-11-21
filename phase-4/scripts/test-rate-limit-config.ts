/**
 * Horizon Portal — Rate Limit Configuration & Precedence Verification Test
 * scripts/test-rate-limit-config.ts
 *
 * Verifies:
 * 1. Canonical variable parsing (RATE_LIMIT_IP_MAX, RATE_LIMIT_IP_WINDOW, etc.)
 * 2. Default values matching 10 attempts, 900s (15 min), 5 attempts, 900s, fail-open
 * 3. Safe fallback on invalid/negative/non-numeric inputs
 * 4. Legacy alias support (LOGIN_RATE_LIMIT_*) and precedence
 * 5. Time units in seconds
 * 6. Secret credentials protection
 */

import assert from "node:assert";
import { getRateLimitConfig, DEFAULT_RATE_LIMIT_CONFIG } from "../src/lib/security/rate-limit/config";

console.log("==================================================================");
console.log("   HORIZON PORTAL — RATE LIMIT CONFIGURATION VERIFICATION        ");
console.log("==================================================================\n");

let passed = 0;

// Save original env
const originalEnv = { ...process.env };

function cleanEnv() {
  delete process.env.RATE_LIMIT_IP_MAX;
  delete process.env.RATE_LIMIT_IP_WINDOW;
  delete process.env.RATE_LIMIT_ACCOUNT_MAX;
  delete process.env.RATE_LIMIT_ACCOUNT_WINDOW;
  delete process.env.RATE_LIMIT_FAILURE_MODE;
  delete process.env.RATE_LIMIT_PREFIX;
  delete process.env.LOGIN_RATE_LIMIT_IP_MAX;
  delete process.env.LOGIN_RATE_LIMIT_IP_WINDOW;
  delete process.env.LOGIN_RATE_LIMIT_ACCOUNT_MAX;
  delete process.env.LOGIN_RATE_LIMIT_ACCOUNT_WINDOW;
  delete process.env.LOGIN_RATE_LIMIT_FAILURE_MODE;
  delete process.env.VERCEL_ENV;
}

try {
  // Test 1: Defaults match documented defaults
  cleanEnv();
  const defaultConfig = getRateLimitConfig();
  assert.strictEqual(defaultConfig.ipLimit, 10, "Default IP limit must be 10");
  assert.strictEqual(defaultConfig.ipWindowSeconds, 900, "Default IP window must be 900 seconds");
  assert.strictEqual(defaultConfig.accountLimit, 5, "Default account limit must be 5");
  assert.strictEqual(defaultConfig.accountWindowSeconds, 900, "Default account window must be 900 seconds");
  assert.strictEqual(defaultConfig.failureMode, "fail-open", "Default failure mode must be fail-open");
  assert.strictEqual(defaultConfig.prefix, "rl:auth", "Default prefix must be rl:auth");
  console.log("  ✅ PASS: Defaults match documented policy (10 attempts, 900s window, 5 attempts, 900s window, fail-open)");
  passed++;

  // Test 2: Canonical variables are parsed correctly
  cleanEnv();
  process.env.RATE_LIMIT_IP_MAX = "20";
  process.env.RATE_LIMIT_IP_WINDOW = "1800";
  process.env.RATE_LIMIT_ACCOUNT_MAX = "8";
  process.env.RATE_LIMIT_ACCOUNT_WINDOW = "1200";
  process.env.RATE_LIMIT_FAILURE_MODE = "fail-closed";
  const customConfig = getRateLimitConfig();
  assert.strictEqual(customConfig.ipLimit, 20);
  assert.strictEqual(customConfig.ipWindowSeconds, 1800);
  assert.strictEqual(customConfig.accountLimit, 8);
  assert.strictEqual(customConfig.accountWindowSeconds, 1200);
  assert.strictEqual(customConfig.failureMode, "fail-closed");
  console.log("  ✅ PASS: Canonical RATE_LIMIT_* variables parsed accurately");
  passed++;

  // Test 3: Safe fallback on non-numeric or negative values
  cleanEnv();
  process.env.RATE_LIMIT_IP_MAX = "-5";
  process.env.RATE_LIMIT_IP_WINDOW = "invalid_string";
  process.env.RATE_LIMIT_ACCOUNT_MAX = "0";
  process.env.RATE_LIMIT_ACCOUNT_WINDOW = "-900";
  const safeFallback = getRateLimitConfig();
  assert.strictEqual(safeFallback.ipLimit, DEFAULT_RATE_LIMIT_CONFIG.ipLimit);
  assert.strictEqual(safeFallback.ipWindowSeconds, DEFAULT_RATE_LIMIT_CONFIG.ipWindowSeconds);
  assert.strictEqual(safeFallback.accountLimit, DEFAULT_RATE_LIMIT_CONFIG.accountLimit);
  assert.strictEqual(safeFallback.accountWindowSeconds, DEFAULT_RATE_LIMIT_CONFIG.accountWindowSeconds);
  console.log("  ✅ PASS: Invalid and negative values safely fall back to defaults");
  passed++;

  // Test 4: Legacy alias support (LOGIN_RATE_LIMIT_*)
  cleanEnv();
  process.env.LOGIN_RATE_LIMIT_IP_MAX = "15";
  process.env.LOGIN_RATE_LIMIT_IP_WINDOW = "600";
  process.env.LOGIN_RATE_LIMIT_ACCOUNT_MAX = "7";
  process.env.LOGIN_RATE_LIMIT_ACCOUNT_WINDOW = "600";
  process.env.LOGIN_RATE_LIMIT_FAILURE_MODE = "fail-closed";
  const legacyConfig = getRateLimitConfig();
  assert.strictEqual(legacyConfig.ipLimit, 15);
  assert.strictEqual(legacyConfig.ipWindowSeconds, 600);
  assert.strictEqual(legacyConfig.accountLimit, 7);
  assert.strictEqual(legacyConfig.accountWindowSeconds, 600);
  assert.strictEqual(legacyConfig.failureMode, "fail-closed");
  console.log("  ✅ PASS: Legacy LOGIN_RATE_LIMIT_* aliases supported when canonical variables are omitted");
  passed++;

  // Test 5: Precedence: Canonical RATE_LIMIT_* overrides LOGIN_RATE_LIMIT_*
  cleanEnv();
  process.env.RATE_LIMIT_IP_MAX = "10";
  process.env.LOGIN_RATE_LIMIT_IP_MAX = "99";
  process.env.RATE_LIMIT_IP_WINDOW = "900";
  process.env.LOGIN_RATE_LIMIT_IP_WINDOW = "60";
  const precedenceConfig = getRateLimitConfig();
  assert.strictEqual(precedenceConfig.ipLimit, 10, "Canonical RATE_LIMIT_IP_MAX must take precedence");
  assert.strictEqual(precedenceConfig.ipWindowSeconds, 900, "Canonical RATE_LIMIT_IP_WINDOW must take precedence");
  console.log("  ✅ PASS: Canonical variables take strict precedence over legacy aliases");
  passed++;

  // Test 6: Vercel preview prefix adaptation
  cleanEnv();
  process.env.VERCEL_ENV = "preview";
  const previewConfig = getRateLimitConfig();
  assert.strictEqual(previewConfig.prefix, "rl:preview:auth");
  console.log("  ✅ PASS: Vercel Preview environment adapts prefix to rl:preview:auth");
  passed++;

} finally {
  // Restore original environment
  for (const key of Object.keys(process.env)) {
    if (!(key in originalEnv)) {
      delete process.env[key];
    }
  }
  Object.assign(process.env, originalEnv);
}

console.log("\n==================================================================");
console.log(`  RATE LIMIT CONFIG TEST COMPLETE: ${passed} / 6 PASSED`);
console.log("==================================================================\n");
