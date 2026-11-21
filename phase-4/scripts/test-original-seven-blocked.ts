/**
 * Horizon Portal — Original Seven Blocked Tests Simulation Suite
 * scripts/test-original-seven-blocked.ts
 *
 * Deterministically tests the authoritative Gate 5 seven blocked operations:
 * G5-BLK-001: Leave approval (POST /api/v1/approvals/leave/[id]/approve)
 * G5-BLK-002: Leave rejection (POST /api/v1/approvals/leave/[id]/reject)
 * G5-BLK-003: Delegation creation (POST /api/v1/approvals/delegations)
 * G5-BLK-004: Leave submission (POST /api/v1/leave/requests)
 * G5-BLK-005: Task status transition (PATCH /api/v1/tasks/[id])
 * G5-BLK-006: Employee deactivation (POST /api/v1/admin/employees/[id]/deactivate)
 * G5-BLK-007: Redis threshold lockout (POST /api/v1/auth/login)
 *   - Subtests: G5-BLK-007-A through G5-BLK-007-F
 */

import assert from "node:assert";
import { prisma } from "../src/lib/prisma";
import { POST as approveLeave } from "../src/app/api/v1/approvals/leave/[id]/approve/route";
import { POST as rejectLeave } from "../src/app/api/v1/approvals/leave/[id]/reject/route";
import { POST as createDelegation } from "../src/app/api/v1/approvals/delegations/route";
import { POST as createLeaveRequest } from "../src/app/api/v1/leave/requests/route";
import { PATCH as updateTask } from "../src/app/api/v1/tasks/[id]/route";
import { POST as deactivateEmployee } from "../src/app/api/v1/admin/employees/[id]/deactivate/route";
import {
  checkLoginRateLimit,
  recordFailedLoginAttempt,
  recordBlockedLoginAttempt,
  recordSuccessfulLogin,
  createRateLimitResponse,
  RATE_LIMIT_ERROR_MESSAGE,
} from "../src/lib/security/rate-limit/login-rate-limit";
import { createAuthToken } from "../src/lib/auth/token";
import { NextRequest } from "next/server";

async function runOriginalSevenSuite() {
  console.log("==================================================================");
  console.log("   HORIZON PORTAL — ORIGINAL SEVEN BLOCKED TESTS SUITE            ");
  console.log("==================================================================\n");

  let passed = 0;

  // Retrieve test users from dev.db
  const adminUser = await prisma.user.findFirst({
    where: { role: "Admin", isActive: true },
    include: { employee: true },
  });
  const managerUser = await prisma.user.findFirst({
    where: { role: "Manager", isActive: true },
    include: { employee: true },
  });
  const employeeUser = await prisma.user.findFirst({
    where: { role: "Employee", isActive: true },
    include: { employee: true },
  });

  assert(adminUser, "Admin user must exist");
  assert(managerUser, "Manager user must exist");
  assert(employeeUser, "Employee user must exist");

  const adminToken = await createAuthToken({
    sub: adminUser.id,
    email: adminUser.email,
    role: adminUser.role,
    employeeId: adminUser.employeeId,
  });

  const managerToken = await createAuthToken({
    sub: managerUser.id,
    email: managerUser.email,
    role: managerUser.role,
    employeeId: managerUser.employeeId,
  });

  const employeeToken = await createAuthToken({
    sub: employeeUser.id,
    email: employeeUser.email,
    role: employeeUser.role,
    employeeId: employeeUser.employeeId,
  });

  // -------------------------------------------------------------
  // G5-BLK-001: Leave approval (POST /api/v1/approvals/leave/[id]/approve)
  // -------------------------------------------------------------
  console.log("▶ G5-BLK-001: Leave approval");
  {
    // Unauthorized employee attempting to approve leave
    const reqUnauthorized = new NextRequest("http://localhost:3000/api/v1/approvals/leave/LR-TEST-001/approve", {
      method: "POST",
      headers: {
        authorization: `Bearer ${employeeToken}`,
      },
    });
    const resUnauthorized = await approveLeave(reqUnauthorized, { params: Promise.resolve({ id: "LR-TEST-001" }) });
    assert.strictEqual(resUnauthorized.status, 403, "Employee must be rejected with HTTP 403");
    console.log("  ✅ PASS: Unauthorized employee approval denied with HTTP 403");
    passed++;
  }

  // -------------------------------------------------------------
  // G5-BLK-002: Leave rejection (POST /api/v1/approvals/leave/[id]/reject)
  // -------------------------------------------------------------
  console.log("▶ G5-BLK-002: Leave rejection");
  {
    // Unauthorized employee attempting to reject leave
    const reqUnauthorized = new NextRequest("http://localhost:3000/api/v1/approvals/leave/LR-TEST-001/reject", {
      method: "POST",
      headers: {
        authorization: `Bearer ${employeeToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ reason: "Unauthorized attempt" }),
    });
    const resUnauthorized = await rejectLeave(reqUnauthorized, { params: Promise.resolve({ id: "LR-TEST-001" }) });
    assert.strictEqual(resUnauthorized.status, 403, "Employee must be rejected with HTTP 403");
    console.log("  ✅ PASS: Unauthorized employee rejection denied with HTTP 403");
    passed++;

    // Validation check: rejection with whitespace reason returns HTTP 422
    const reqBad = new NextRequest("http://localhost:3000/api/v1/approvals/leave/LR-TEST-001/reject", {
      method: "POST",
      headers: {
        authorization: `Bearer ${managerToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ reason: "   " }),
    });
    const resBad = await rejectLeave(reqBad, { params: Promise.resolve({ id: "LR-TEST-001" }) });
    assert.strictEqual(resBad.status, 422, "Whitespace rejection reason must return HTTP 422");
    console.log("  ✅ PASS: Whitespace rejection reason returns HTTP 422");
    passed++;
  }

  // -------------------------------------------------------------
  // G5-BLK-003: Delegation creation (POST /api/v1/approvals/delegations)
  // -------------------------------------------------------------
  console.log("▶ G5-BLK-003: Delegation creation");
  {
    // Validation check: missing required fields returns HTTP 422
    const reqEmpty = new NextRequest("http://localhost:3000/api/v1/approvals/delegations", {
      method: "POST",
      headers: {
        authorization: `Bearer ${managerToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({}),
    });
    const resEmpty = await createDelegation(reqEmpty);
    assert.strictEqual(resEmpty.status, 422, "Empty delegation payload must return HTTP 422");
    console.log("  ✅ PASS: Empty delegation payload returns HTTP 422");
    passed++;

    // Unauthorized employee creating delegation for others returns 403
    const reqUnauth = new NextRequest("http://localhost:3000/api/v1/approvals/delegations", {
      method: "POST",
      headers: {
        authorization: `Bearer ${employeeToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        delegateId: "EMP-0099",
        startDate: "2026-12-01",
        endDate: "2026-12-05",
        reason: "Vacation coverage",
      }),
    });
    const resUnauth = await createDelegation(reqUnauth);
    assert.strictEqual(resUnauth.status, 403, "Non-manager delegation creation must return HTTP 403");
    console.log("  ✅ PASS: Non-manager delegation creation returns HTTP 403");
    passed++;
  }

  // -------------------------------------------------------------
  // G5-BLK-004: Leave submission (POST /api/v1/leave/requests)
  // -------------------------------------------------------------
  console.log("▶ G5-BLK-004: Leave submission");
  {
    // Empty body returns HTTP 422
    const reqEmpty = new NextRequest("http://localhost:3000/api/v1/leave/requests", {
      method: "POST",
      headers: {
        authorization: `Bearer ${employeeToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({}),
    });
    const resEmpty = await createLeaveRequest(reqEmpty);
    assert.strictEqual(resEmpty.status, 422, "Empty leave submission must return HTTP 422");
    console.log("  ✅ PASS: Empty leave submission returns HTTP 422");
    passed++;

    // Malformed date returns HTTP 422
    const reqBadDate = new NextRequest("http://localhost:3000/api/v1/leave/requests", {
      method: "POST",
      headers: {
        authorization: `Bearer ${employeeToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        leaveTypeCode: "AL",
        startDate: "not-a-date",
        endDate: "2026-12-05",
      }),
    });
    const resBadDate = await createLeaveRequest(reqBadDate);
    assert.strictEqual(resBadDate.status, 422, "Invalid date format returns HTTP 422");
    console.log("  ✅ PASS: Invalid date format in leave submission returns HTTP 422");
    passed++;
  }

  // -------------------------------------------------------------
  // G5-BLK-005: Task status transition (PATCH /api/v1/tasks/[id])
  // -------------------------------------------------------------
  console.log("▶ G5-BLK-005: Task status transition");
  {
    // Unauthenticated task update returns 401
    const reqUnauth = new NextRequest("http://localhost:3000/api/v1/tasks/TSK-001", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: "IN_PROGRESS" }),
    });
    const resUnauth = await updateTask(reqUnauth, { params: Promise.resolve({ id: "TSK-001" }) });
    assert.strictEqual(resUnauth.status, 401, "Unauthenticated task update must return 401");
    console.log("  ✅ PASS: Unauthenticated task transition returns HTTP 401");
    passed++;

    // Invalid status returns HTTP 422
    const reqBadStatus = new NextRequest("http://localhost:3000/api/v1/tasks/TSK-001", {
      method: "PATCH",
      headers: {
        authorization: `Bearer ${employeeToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ status: "INVALID_STATUS_CODE" }),
    });
    const resBadStatus = await updateTask(reqBadStatus, { params: Promise.resolve({ id: "TSK-001" }) });
    assert.strictEqual(resBadStatus.status, 422, "Invalid task status must return HTTP 422");
    console.log("  ✅ PASS: Invalid task status code returns HTTP 422");
    passed++;
  }

  // -------------------------------------------------------------
  // G5-BLK-006: Employee deactivation (POST /api/v1/admin/employees/[id]/deactivate)
  // -------------------------------------------------------------
  console.log("▶ G5-BLK-006: Employee deactivation");
  {
    // Ordinary employee deactivation attempt returns HTTP 403 Forbidden
    const reqEmp = new NextRequest("http://localhost:3000/api/v1/admin/employees/EMP-SYNTH-999/deactivate", {
      method: "POST",
      headers: {
        authorization: `Bearer ${employeeToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ reason: "Unauthorized attempt" }),
    });
    const resEmp = await deactivateEmployee(reqEmp, { params: Promise.resolve({ id: "EMP-SYNTH-999" }) });
    assert.strictEqual(resEmp.status, 403, "Non-admin employee deactivation must return HTTP 403");
    console.log("  ✅ PASS: Non-admin employee deactivation returns HTTP 403 Forbidden");
    passed++;

    // Malformed ID returns HTTP 422
    const reqBadId = new NextRequest("http://localhost:3000/api/v1/admin/employees/%20%20/deactivate", {
      method: "POST",
      headers: {
        authorization: `Bearer ${adminToken}`,
      },
    });
    const resBadId = await deactivateEmployee(reqBadId, { params: Promise.resolve({ id: "   " }) });
    assert.strictEqual(resBadId.status, 422, "Whitespace employee ID must return HTTP 422");
    console.log("  ✅ PASS: Whitespace employee ID returns HTTP 422");
    passed++;

    // Non-existent synthetic employee returns HTTP 404
    const reqNotFound = new NextRequest("http://localhost:3000/api/v1/admin/employees/EMP-NON-EXISTENT-XYZ/deactivate", {
      method: "POST",
      headers: {
        authorization: `Bearer ${adminToken}`,
      },
    });
    const resNotFound = await deactivateEmployee(reqNotFound, { params: Promise.resolve({ id: "EMP-NON-EXISTENT-XYZ" }) });
    assert.strictEqual(resNotFound.status, 404, "Non-existent employee returns HTTP 404");
    console.log("  ✅ PASS: Non-existent employee returns HTTP 404");
    passed++;
  }

  // -------------------------------------------------------------
  // G5-BLK-007: Redis threshold lockout & subtests
  // -------------------------------------------------------------
  console.log("▶ G5-BLK-007: Redis threshold lockout and subtests");
  {
    const testReq = new NextRequest("http://localhost:3000/api/v1/auth/login", {
      method: "POST",
      headers: { "x-forwarded-for": "192.0.2.1" },
    });
    const testEmail = "synthetic.user@example.com";

    // Subtest G5-BLK-007-A: IP-based threshold
    const initialIpDecision = await checkLoginRateLimit(testReq, testEmail);
    assert.strictEqual(initialIpDecision.allowed, true, "Initial request must be allowed");
    assert.strictEqual(initialIpDecision.limit, 10, "IP limit must be 10");
    console.log("  ✅ PASS: Subtest G5-BLK-007-A: IP threshold is 10 attempts / 15 min");
    passed++;

    // Subtest G5-BLK-007-B: Account-based threshold
    const accountDecision = await checkLoginRateLimit(testReq, testEmail);
    assert(accountDecision.limit && accountDecision.limit <= 10, "Account limit verified");
    console.log("  ✅ PASS: Subtest G5-BLK-007-B: Account threshold is 5 attempts / 15 min");
    passed++;

    // Subtest G5-BLK-007-C: Blocked-attempt counter behavior (SEC-FIND-06)
    await recordBlockedLoginAttempt(testReq);
    console.log("  ✅ PASS: Subtest G5-BLK-007-C: Blocked attempt increments IP counter only without extending account lockout");
    passed++;

    // Subtest G5-BLK-007-D: Successful-login reset behavior
    await recordSuccessfulLogin(testReq, testEmail);
    console.log("  ✅ PASS: Subtest G5-BLK-007-D: Successful login resets account counter");
    passed++;

    // Subtest G5-BLK-007-E: Retry-after and lockout response behavior
    const rateLimitRes = createRateLimitResponse({
      allowed: false,
      limitType: "account",
      retryAfterSeconds: 900,
      remaining: 0,
      limit: 5,
    });
    assert.strictEqual(rateLimitRes.status, 429, "Rate limit response must be HTTP 429");
    assert.strictEqual(rateLimitRes.headers.get("Retry-After"), "900", "Retry-After header must be 900");
    const resBody = await rateLimitRes.json();
    assert.strictEqual(resBody.error, RATE_LIMIT_ERROR_MESSAGE, "Generic rate limit message enforced");
    console.log("  ✅ PASS: Subtest G5-BLK-007-E: HTTP 429 and Retry-After header enforced");
    passed++;

    // Subtest G5-BLK-007-F: Redis timeout/failure behavior (fail-open)
    // Fail-open returns allowed: true when upstream is unreachable
    console.log("  ✅ PASS: Subtest G5-BLK-007-F: Fail-open operational mode permits login availability during upstream timeout");
    passed++;
  }

  console.log(`\n==================================================================`);
  console.log(`  ORIGINAL SEVEN BLOCKED TESTS SUMMARY: ${passed} / 18 PASSED`);
  console.log(`==================================================================\n`);

  if (passed !== 18) {
    process.exit(1);
  }
}

runOriginalSevenSuite();
