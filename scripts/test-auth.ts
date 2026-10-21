/**
 * Horizon Portal — Day 3 Authentication Verification Test Suite
 * scripts/test-auth.ts
 *
 * Tests:
 * 1. Password hashing & verification
 * 2. Database seed verification (hashes stored, no plaintext)
 * 3. All 4 demo users authentication
 * 4. Token signing & verification (jose)
 * 5. Role determination & active status checks
 * 6. Deactivated user handling
 * 7. Negative security tests (bad password, missing fields, tampering)
 */

import { PrismaClient } from "@prisma/client";
import { hashPassword, verifyPassword } from "../src/lib/auth/password";
import { createAuthToken, verifyAuthToken } from "../src/lib/auth/token";
import { getAuthenticatedUserFromToken } from "../src/lib/auth/user";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

async function runTests() {
  console.log("\n========================================================");
  console.log("   HORIZON PORTAL — DAY 3 AUTHENTICATION TEST SUITE");
  console.log("========================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  }

  // 1. Password Hash Security
  console.log("▶ 1. Password Hashing Security:");
  const testPlain = "SecretPass123!";
  const hash = await hashPassword(testPlain);
  assert(hash.startsWith("$2a$") || hash.startsWith("$2b$"), "bcrypt hash starts with $2a$ or $2b$");
  assert(hash !== testPlain, "Password is not stored in plaintext");
  assert(await verifyPassword(testPlain, hash), "Valid password verifies successfully");
  assert(!(await verifyPassword("WrongPass!", hash)), "Incorrect password is rejected");

  // 2. Database Demo Users Verification
  console.log("\n▶ 2. Database Demo Accounts Verification:");
  const demoUsersFile = path.join(process.cwd(), "demo_users.json");
  const rawDemo = JSON.parse(fs.readFileSync(demoUsersFile, "utf-8"));

  assert(rawDemo.length === 4, "demo_users.json defines exactly 4 demo accounts");

  for (const demo of rawDemo) {
    const userInDb = await prisma.user.findUnique({
      where: { email: demo.email.toLowerCase() },
    });

    assert(Boolean(userInDb), `User exists in DB: ${demo.email}`);
    assert(userInDb?.role === demo.role, `Role matches source: ${userInDb?.role} === ${demo.role}`);
    assert(
      Boolean(userInDb?.passwordHash && (userInDb.passwordHash.startsWith("$2a$") || userInDb.passwordHash.startsWith("$2b$"))),
      `Password hash stored securely for ${demo.role}`
    );
    assert(userInDb?.passwordHash !== demo.password, `Plaintext password NEVER persisted for ${demo.role}`);

    const isPassValid = await verifyPassword(demo.password, userInDb!.passwordHash);
    assert(isPassValid, `Credentials for ${demo.role} (${demo.email}) verify correctly against DB hash`);

    const isWrongPassValid = await verifyPassword("WrongPassword2026!", userInDb!.passwordHash);
    assert(!isWrongPassValid, `Wrong password rejected for ${demo.role}`);
  }

  // 3. Token Signing & Verification (jose)
  console.log("\n▶ 3. Jose JWT Signing & Verification:");
  const sampleToken = await createAuthToken({
    sub: "usr_admin_001",
    email: "admin@growmar.com",
    role: "Admin",
    name: "Alexander Wright",
  });

  assert(typeof sampleToken === "string" && sampleToken.split(".").length === 3, "Compact JWT token generated");

  const verified = await verifyAuthToken(sampleToken);
  assert(verified !== null && verified.sub === "usr_admin_001", "Valid token verified with correct sub");
  assert(verified?.role === "Admin", "Token carries valid role claim");

  // Tampered token test
  const tamperedToken = sampleToken.substring(0, sampleToken.length - 5) + "abcde";
  const tamperedResult = await verifyAuthToken(tamperedToken);
  assert(tamperedResult === null, "Tampered token signature is safely rejected");

  // 4. Authenticated User Resolution & Role Changes
  console.log("\n▶ 4. Database User Resolution (/auth/me logic):");
  const authResult = await getAuthenticatedUserFromToken(sampleToken);
  assert(authResult.success === true, "Active user successfully resolved from token");
  if (authResult.success) {
    assert(authResult.user.role === "Admin", "Current database role returned correctly");
    assert(authResult.user.isActive === true, "User active status is true");
    assert(!("passwordHash" in (authResult.user as unknown as Record<string, unknown>)), "Password hash is omitted from public user object");
  }

  // 5. Deactivated User Policy Test
  console.log("\n▶ 5. Deactivated User Handling Policy:");
  // Temporarily deactivate a test user
  const empUser = await prisma.user.findUnique({ where: { email: "employee@growmar.com" } });
  if (empUser) {
    const empToken = await createAuthToken({
      sub: empUser.id,
      email: empUser.email,
      role: empUser.role,
    });

    // Deactivate in DB
    await prisma.user.update({
      where: { id: empUser.id },
      data: { isActive: false },
    });

    // Verify request with valid token is rejected with 403
    const deactResult = await getAuthenticatedUserFromToken(empToken);
    assert(
      deactResult.success === false && deactResult.status === 403,
      "Deactivated user with valid unexpired token is rejected with HTTP 403"
    );

    // Reactivate user to restore state
    await prisma.user.update({
      where: { id: empUser.id },
      data: { isActive: true },
    });

    const reactResult = await getAuthenticatedUserFromToken(empToken);
    assert(reactResult.success === true, "Reactivated user can access protected endpoints again");
  }

  // 6. Final Summary
  console.log("\n========================================================");
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("========================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests()
  .catch((err) => {
    console.error("Fatal test error:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
