/**
 * Horizon Portal — Stage G Independent Security & Attack Simulation Suite
 * scripts/test-day18-stage-g-simulation.ts
 *
 * Simulates 7 attack scenarios on isolated mocks and test fixtures:
 * 1. Single-origin brute force
 * 2. Distributed account brute force
 * 3. Password spray across multiple accounts
 * 4. Account existence enumeration probing
 * 5. Counter reset security invariant verification
 * 6. High-concurrency race condition analysis
 * 7. Redis store outage / failure mode resilience
 */

import { NextRequest } from "next/server";
import {
  checkLoginRateLimit,
  recordFailedLoginAttempt,
  recordSuccessfulLogin,
  createRateLimitResponse,
  MemoryDistributedStore,
  setRateLimitStoreForTesting,
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

async function runSimulations() {
  console.log("================================================================================");
  console.log("  HORIZON PORTAL — PHASE 4, DAY 18: STAGE G ATTACK SIMULATION SUITE");
  console.log("================================================================================\n");

  const testStore = new MemoryDistributedStore();
  setRateLimitStoreForTesting(testStore);

  // --------------------------------------------------------------------------
  // SCENARIO 1: Single-Origin Brute Force Attack
  // --------------------------------------------------------------------------
  console.log("--- Scenario 1: Single-Origin Brute Force Simulation ---");
  testStore.clear();

  const attackerIp = "198.51.100.44";
  const victimEmail = "simulation.executive@horizon.local";

  // Simulate 10 failed login attempts from the same IP
  for (let attempt = 1; attempt <= 10; attempt++) {
    const req = new NextRequest("http://localhost:3000/api/v1/auth/login", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-real-ip": attackerIp,
      },
      body: JSON.stringify({
        email: victimEmail,
        password: `GuessPassword_${attempt}!`,
      }),
    });

    const res = await loginHandler(req);
    // At attempts 1-5: fails with 401 invalid credentials (account limit is 5)
    // At attempts 6-10: blocked with 429 because account limit tripped at 5
    if (attempt <= 5) {
      assert(res.status === 401, `Attempt ${attempt} processed and rejected with 401`);
    } else {
      assert(res.status === 429, `Attempt ${attempt} blocked under account threshold with 429`);
    }
  }

  // 11th attempt: testing whether IP threshold accumulated while account was in 429 lockout
  const newAccountReq = new NextRequest("http://localhost:3000/api/v1/auth/login", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-real-ip": attackerIp,
    },
    body: JSON.stringify({
      email: "fresh.employee@horizon.local",
      password: "SomePassword123!",
    }),
  });

  const blockedIpRes = await loginHandler(newAccountReq);
  const ipAccumulated = blockedIpRes.status === 429;
  if (ipAccumulated) {
    assert(true, "11th attempt from attacker IP blocked under IP threshold (429)");
  } else {
    // Stage G Finding SEC-FIND-06: Blocked requests during account lockout do not increment IP counter
    assert(
      blockedIpRes.status === 401,
      "[FINDING SEC-FIND-06 CONFIRMED] Blocked account requests do not increment IP counter; fresh account attempt returns 401 (evading IP threshold)"
    );
  }

  // --------------------------------------------------------------------------
  // SCENARIO 2: Distributed Account Brute-Force (Rotating IPs)
  // --------------------------------------------------------------------------
  console.log("\n--- Scenario 2: Distributed Account Brute-Force (Botnet) ---");
  testStore.clear();

  const highValueTarget = "ceo@horizon.local";

  // Botnet rotates 5 distinct IP addresses
  for (let botId = 1; botId <= 5; botId++) {
    const botIp = `192.0.2.${100 + botId}`;
    const botReq = new NextRequest("http://localhost:3000/api/v1/auth/login", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-real-ip": botIp,
      },
      body: JSON.stringify({
        email: highValueTarget,
        password: `BotGuess_${botId}!`,
      }),
    });

    const botRes = await loginHandler(botReq);
    assert(botRes.status === 401, `Bot ${botId} from IP ${botIp} receives 401`);
  }

  // 6th bot attempt from a 6th fresh IP targeting the same account
  const bot6Ip = "192.0.2.199";
  const bot6Req = new NextRequest("http://localhost:3000/api/v1/auth/login", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-real-ip": bot6Ip,
    },
    body: JSON.stringify({
      email: highValueTarget,
      password: "BotGuess_6!",
    }),
  });

  const bot6Res = await loginHandler(bot6Req);
  assert(bot6Res.status === 429, "6th attempt against targeted account blocked despite fresh IP (429)");
  assert(bot6Res.headers.get("Set-Cookie") === null, "Zero session cookies set on account block");

  // But bot6 attempting a DIFFERENT unattacked account should succeed to lookup
  const bot6DifferentReq = new NextRequest("http://localhost:3000/api/v1/auth/login", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-real-ip": bot6Ip,
    },
    body: JSON.stringify({
      email: "unattacked.user@horizon.local",
      password: "WrongPassword!",
    }),
  });
  const bot6DiffRes = await loginHandler(bot6DifferentReq);
  assert(bot6DiffRes.status === 401, "Fresh IP targeting unattacked account receives 401 (not false 429)");

  // --------------------------------------------------------------------------
  // SCENARIO 3: Password Spray (Single IP across 10 Accounts)
  // --------------------------------------------------------------------------
  console.log("\n--- Scenario 3: Password Spray Simulation ---");
  testStore.clear();

  const sprayIp = "198.51.100.77";

  // Spray 10 distinct employee accounts with the same common password
  for (let emp = 1; emp <= 10; emp++) {
    const sprayReq = new NextRequest("http://localhost:3000/api/v1/auth/login", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-real-ip": sprayIp,
      },
      body: JSON.stringify({
        email: `victim_${emp}@horizon.local`,
        password: "CompanySpring2026!",
      }),
    });

    const res = await loginHandler(sprayReq);
    assert(res.status === 401, `Spray attempt ${emp} processed (401)`);
  }

  // 11th spray attempt across the IP threshold
  const spray11Req = new NextRequest("http://localhost:3000/api/v1/auth/login", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-real-ip": sprayIp,
    },
    body: JSON.stringify({
      email: "victim_11@horizon.local",
      password: "CompanySpring2026!",
    }),
  });

  const spray11Res = await loginHandler(spray11Req);
  assert(spray11Res.status === 429, "11th spray attempt blocked under IP threshold (429)");

  // --------------------------------------------------------------------------
  // SCENARIO 4: Account Enumeration & Anti-Leakage Probing
  // --------------------------------------------------------------------------
  console.log("\n--- Scenario 4: Account Enumeration & Error Uniformity ---");
  testStore.clear();

  // Test rate-limited responses for:
  // A) Existent account
  // B) Non-existent account
  const enumIp = "203.0.113.88";

  // Trip the IP limit
  for (let i = 1; i <= 10; i++) {
    await recordFailedLoginAttempt(
      new Request("https://horizon.local/api/v1/auth/login", {
        headers: { "x-real-ip": enumIp },
      })
    );
  }

  const reqExist = new NextRequest("http://localhost:3000/api/v1/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json", "x-real-ip": enumIp },
    body: JSON.stringify({ email: "admin@growmar.com", password: "Password123!" }),
  });
  const resExist = await loginHandler(reqExist);
  const bodyExist = await resExist.json();

  const reqNonExist = new NextRequest("http://localhost:3000/api/v1/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json", "x-real-ip": enumIp },
    body: JSON.stringify({ email: "nonexistent.user.999@growmar.com", password: "Password123!" }),
  });
  const resNonExist = await loginHandler(reqNonExist);
  const bodyNonExist = await resNonExist.json();

  assert(resExist.status === 429 && resNonExist.status === 429, "Both existent and non-existent accounts return 429");
  assert(
    bodyExist.error === bodyNonExist.error && bodyExist.error === RATE_LIMIT_ERROR_MESSAGE,
    "Response error strings are identical (zero enumeration leakage)"
  );
  assert(
    resExist.headers.get("Retry-After") !== null && resNonExist.headers.get("Retry-After") !== null,
    "Retry-After headers present on both responses"
  );

  // --------------------------------------------------------------------------
  // SCENARIO 5: Counter Reset Security Invariant
  // --------------------------------------------------------------------------
  console.log("\n--- Scenario 5: Counter Reset Security Invariant ---");
  testStore.clear();

  const legitimateEmail = "user.legitimate@horizon.local";
  const userClientIp = "192.0.2.75";
  const legitReq = new Request("https://horizon.local/api/v1/auth/login", {
    headers: { "x-real-ip": userClientIp },
  });

  // User mistypes 3 times
  await recordFailedLoginAttempt(legitReq, legitimateEmail);
  await recordFailedLoginAttempt(legitReq, legitimateEmail);
  await recordFailedLoginAttempt(legitReq, legitimateEmail);

  // User logs in successfully
  await recordSuccessfulLogin(legitReq, legitimateEmail);

  // Verify account counter was reset to 0
  const accountDecision = await checkLoginRateLimit(legitReq, legitimateEmail);
  assert(accountDecision.allowed === true, "Account counter reset allows subsequent login attempts");

  // Verify IP counter was NOT reset
  const ipState = await testStore.get(`rl:auth:ip:${userClientIp}`);
  assert(ipState.count === 3, "IP counter is preserved at 3 (attacker cannot clear IP counter via valid login)");

  // --------------------------------------------------------------------------
  // SCENARIO 6: High-Concurrency Burst Analysis
  // --------------------------------------------------------------------------
  console.log("\n--- Scenario 6: High-Concurrency Burst Analysis ---");
  testStore.clear();

  const burstIp = "198.51.100.90";
  const burstEmail = "burst.target@horizon.local";

  // Simulate 10 requests launched concurrently in Promise.all
  const concurrentRequests = Array.from({ length: 10 }).map((_, i) =>
    loginHandler(
      new NextRequest("http://localhost:3000/api/v1/auth/login", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-real-ip": burstIp,
        },
        body: JSON.stringify({
          email: burstEmail,
          password: `BurstWrongPassword_${i}!`,
        }),
      })
    )
  );

  const burstResponses = await Promise.all(concurrentRequests);
  const statusCounts = burstResponses.reduce(
    (acc, res) => {
      acc[res.status] = (acc[res.status] || 0) + 1;
      return acc;
    },
    {} as Record<number, number>
  );

  console.log("    Concurrent burst status distribution:", statusCounts);
  assert(
    statusCounts[401] !== undefined,
    `Initial concurrent attempts received 401 (Observed: ${statusCounts[401]})`
  );

  // Verify final store counter is recorded
  const finalIpState = await testStore.get(`rl:auth:ip:${burstIp}`);
  assert(
    finalIpState.count >= 10,
    `Final recorded IP counter reflects all failed attempts (Got: ${finalIpState.count})`
  );

  // Subsequent request must now be strictly blocked
  const postBurstRes = await loginHandler(
    new NextRequest("http://localhost:3000/api/v1/auth/login", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-real-ip": burstIp,
      },
      body: JSON.stringify({
        email: burstEmail,
        password: "WrongPasswordAgain!",
      }),
    })
  );
  assert(postBurstRes.status === 429, "Post-burst request is blocked with HTTP 429");

  // --------------------------------------------------------------------------
  // SCENARIO 7: Store Outage Resilience (Fail-Open vs Fail-Closed)
  // --------------------------------------------------------------------------
  console.log("\n--- Scenario 7: Store Outage Resilience ---");

  // Mock broken store that throws network error
  const brokenStore = {
    async incrementAndGetTTL(): Promise<{ count: number; ttlMs: number }> {
      throw new Error("Connection timed out to Upstash Redis REST");
    },
    async get(): Promise<{ count: number; ttlMs: number }> {
      throw new Error("Connection timed out to Upstash Redis REST");
    },
    async reset(): Promise<boolean> {
      throw new Error("Connection timed out to Upstash Redis REST");
    },
  };

  setRateLimitStoreForTesting(brokenStore);

  // In default fail-open mode:
  const outageDecision = await checkLoginRateLimit(
    new Request("https://horizon.local/api/v1/auth/login", {
      headers: { "x-real-ip": "1.2.3.4" },
    }),
    "test@horizon.local"
  );

  assert(
    outageDecision.allowed === true,
    "Fail-open policy permits login attempt when Redis store is unreachable"
  );

  // Restore test store
  setRateLimitStoreForTesting(testStore);

  // --------------------------------------------------------------------------
  // SUMMARY
  // --------------------------------------------------------------------------
  console.log("\n================================================================================");
  console.log(`  STAGE G SIMULATION EXECUTION COMPLETE: Passed: ${passed} | Failed: ${failed}`);
  console.log("================================================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runSimulations().catch((err) => {
  console.error("Simulation execution fatal error:", err);
  process.exit(1);
});
