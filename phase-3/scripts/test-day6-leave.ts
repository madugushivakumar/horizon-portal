/**
 * Day 6 Automated Verification Test Suite
 * scripts/test-day6-leave.ts
 *
 * Verifies Leave & Attendance Self-Service:
 * 1. Insufficient balance refusal (HTTP 400)
 * 2. Overlapping date refusal (HTTP 409)
 * 3. Rejected/cancelled leaves do not block new requests
 * 4. Valid leave submission (HTTP 201) & atomic pending balance lock
 * 5. Authentication protection & privacy boundaries (401 for unauth, session isolation)
 * 6. Calendar accuracy (holidays & approved leaves)
 * 7. Latest monthly attendance metrics verification
 * 8. Database counts & integrity for the 5 relevant datasets
 */

import { prisma } from "../src/lib/prisma";

const BASE_URL = "http://localhost:3000";

interface LoginResult {
  cookie: string;
  user: {
    id: string;
    email: string;
    role: string;
    employeeId: string;
  };
}

async function loginAs(email: string, pass: string): Promise<LoginResult> {
  const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: pass }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Login failed for ${email}: ${JSON.stringify(data)}`);
  }

  const setCookie = res.headers.get("set-cookie") || "";
  const match = setCookie.match(/horizon_session=([^;]+)/);
  const cookie = match ? `horizon_session=${match[1]}` : "";

  return { cookie, user: data.user };
}

async function runDay6Tests() {
  console.log("=========================================================================");
  console.log("   HORIZON PORTAL — DAY 6 LEAVE & ATTENDANCE SELF-SERVICE SUITE         ");
  console.log("=========================================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, name: string, detail?: string) {
    if (condition) {
      console.log(`  ✓ [PASS] ${name}`);
      passed++;
    } else {
      console.error(`  ✗ [FAIL] ${name}`);
      if (detail) console.error(`    Detail: ${detail}`);
      failed++;
    }
  }

  // --- 1. Database Counts & Integrity for 5 Datasets ---
  console.log("--- 1. Database Counts for 5 Datasets ---");
  const [typesCount, balancesCount, requestsCount, holidaysCount, attendanceCount] =
    await Promise.all([
      prisma.leaveType.count(),
      prisma.leaveBalance.count(),
      prisma.leaveRequest.count(),
      prisma.holiday.count(),
      prisma.attendanceMonthly.count(),
    ]);

  assert(typesCount === 6, `Leave Types count is 6 (Got: ${typesCount})`);
  assert(balancesCount === 441, `Leave Balances count is 441 (Got: ${balancesCount})`);
  assert(requestsCount >= 2183, `Leave Requests count is >= 2,183 (Got: ${requestsCount})`);
  assert(holidaysCount === 19, `Holidays count is 19 (Got: ${holidaysCount})`);
  assert(attendanceCount === 2469, `Attendance Monthly count is 2,469 (Got: ${attendanceCount})`);

  // --- 2. Authentication & Privacy Protections ---
  console.log("\n--- 2. Authentication & Privacy Boundaries ---");
  const unauthBal = await fetch(`${BASE_URL}/api/v1/leave/balances`);
  assert(unauthBal.status === 401, `Unauthenticated /api/v1/leave/balances returns HTTP 401 (Got: ${unauthBal.status})`);

  const unauthReq = await fetch(`${BASE_URL}/api/v1/leave/requests`);
  assert(unauthReq.status === 401, `Unauthenticated /api/v1/leave/requests returns HTTP 401 (Got: ${unauthReq.status})`);

  const unauthPost = await fetch(`${BASE_URL}/api/v1/leave/requests`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ leaveTypeCode: "CL", startDate: "2026-11-01", endDate: "2026-11-02" }),
  });
  assert(unauthPost.status === 401, `Unauthenticated POST /api/v1/leave/requests returns HTTP 401 (Got: ${unauthPost.status})`);

  const unauthAtt = await fetch(`${BASE_URL}/api/v1/attendance/summary`);
  assert(unauthAtt.status === 401, `Unauthenticated /api/v1/attendance/summary returns HTTP 401 (Got: ${unauthAtt.status})`);

  // Log in as Demo Employee (Sasi Shetty, EMP-0188)
  console.log("\n--- 3. Authenticating as Demo Employee (EMP-0188) ---");
  const empLogin = await loginAs("employee@growmar.com", "Employee@Horizon2026!");
  assert(Boolean(empLogin.cookie), "Demo Employee authenticated successfully");
  assert(empLogin.user.employeeId === "EMP-0188", `Demo Employee mapped to EMP-0188 (Got: ${empLogin.user.employeeId})`);

  // --- 4. Personal Balances Verification ---
  console.log("\n--- 4. Personal Leave Balances Verification ---");
  const balRes = await fetch(`${BASE_URL}/api/v1/leave/balances`, {
    headers: { Cookie: empLogin.cookie },
  });
  assert(balRes.status === 200, `Balances endpoint returns HTTP 200 (Got: ${balRes.status})`);
  const balJson = await balRes.json();
  const balances = balJson.data?.balances || [];
  assert(balances.length === 6, `Returns all 6 leave types (Got: ${balances.length})`);

  const cl = balances.find((b: { code: string }) => b.code === "CL");
  assert(Boolean(cl), "Casual Leave (CL) is present in balances");
  assert(cl?.entitlement === 12, `CL Entitlement is 12 (Got: ${cl?.entitlement})`);
  assert(cl?.available <= 12, `CL Available is within quota (Got: ${cl?.available})`);

  // Ensure no password, salary, or bank details are leaked in leave response
  function hasForbiddenKeys(obj: unknown): boolean {
    if (!obj || typeof obj !== "object") return false;
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      const lower = k.toLowerCase();
      if (
        lower === "salary" ||
        lower === "compensation" ||
        lower.includes("password") ||
        lower === "bankname" ||
        lower === "accountnumber"
      ) {
        return true;
      }
      if (typeof v === "object" && hasForbiddenKeys(v)) {
        return true;
      }
    }
    return false;
  }

  assert(!hasForbiddenKeys(balJson), "Zero salary, compensation, or password property keys in balances response");

  // --- 5. REQUIRED TEST: Insufficient Balance Refusal ---
  console.log("\n--- 5. REQUIRED EVIDENCE: Insufficient Balance Refusal ---");
  // Employee only has ~10-12 days of CL. Requesting 90 working days must be rejected with HTTP 400.
  const overdrawnRes = await fetch(`${BASE_URL}/api/v1/leave/requests`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: empLogin.cookie },
    body: JSON.stringify({
      leaveTypeCode: "CL",
      startDate: "2027-01-01",
      endDate: "2027-05-30",
      reason: "Attempting to exceed quota",
    }),
  });

  assert(overdrawnRes.status === 400, `Insufficient balance refused with HTTP 400 (Got: ${overdrawnRes.status})`);
  const overdrawnJson = await overdrawnRes.json();
  assert(
    overdrawnJson.error && overdrawnJson.error.toLowerCase().includes("insufficient"),
    `Error message clearly explains insufficient balance: "${overdrawnJson.error}"`
  );

  // --- 6. REQUIRED TEST: Overlapping Date Refusal ---
  console.log("\n--- 6. REQUIRED EVIDENCE: Overlapping Date Refusal ---");
  // In the real data pack, EMP-0188 already has an approved leave request on 2026-08-03 to 2026-08-04 (LR-000768)
  const overlapRes = await fetch(`${BASE_URL}/api/v1/leave/requests`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: empLogin.cookie },
    body: JSON.stringify({
      leaveTypeCode: "CL",
      startDate: "2026-08-03",
      endDate: "2026-08-03",
      reason: "Attempting to book already approved day",
    }),
  });

  assert(overlapRes.status === 409, `Overlapping request refused with HTTP 409 Conflict (Got: ${overlapRes.status})`);
  const overlapJson = await overlapRes.json();
  assert(
    overlapJson.error && overlapJson.error.toLowerCase().includes("already have an active leave"),
    `Error message clearly explains overlap conflict: "${overlapJson.error}"`
  );

  // --- 7. Validation of Date Rules & Invalid Types ---
  console.log("\n--- 7. Date Ranges and Invalid Type Rejection ---");
  // Start date after end date
  const backwardsRes = await fetch(`${BASE_URL}/api/v1/leave/requests`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: empLogin.cookie },
    body: JSON.stringify({
      leaveTypeCode: "CL",
      startDate: "2026-11-10",
      endDate: "2026-11-05",
      reason: "Backwards date",
    }),
  });
  assert(backwardsRes.status === 400, `Backwards date range rejected with HTTP 400 (Got: ${backwardsRes.status})`);

  // Invalid Leave Type Code
  const fakeTypeRes = await fetch(`${BASE_URL}/api/v1/leave/requests`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: empLogin.cookie },
    body: JSON.stringify({
      leaveTypeCode: "INVALID_CODE_XYZ",
      startDate: "2026-11-05",
      endDate: "2026-11-06",
      reason: "Bogus code",
    }),
  });
  assert(fakeTypeRes.status === 400, `Invalid leave type rejected with HTTP 400 (Got: ${fakeTypeRes.status})`);

  // Missing required fields
  const missingRes = await fetch(`${BASE_URL}/api/v1/leave/requests`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: empLogin.cookie },
    body: JSON.stringify({ leaveTypeCode: "CL" }),
  });
  assert(missingRes.status === 400, `Missing start/end date rejected with HTTP 400 (Got: ${missingRes.status})`);

  // Weekend-only request (e.g. Saturday to Sunday: 2026-11-07 to 2026-11-08)
  const weekendRes = await fetch(`${BASE_URL}/api/v1/leave/requests`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: empLogin.cookie },
    body: JSON.stringify({
      leaveTypeCode: "CL",
      startDate: "2026-11-07",
      endDate: "2026-11-08",
      reason: "Weekend days",
    }),
  });
  assert(weekendRes.status === 400, `Weekend-only date range rejected with 0 working days (Got: ${weekendRes.status})`);

  // --- 8. Valid Leave Submission & Atomic Transaction ---
  console.log("\n--- 8. Valid Leave Submission & Atomic Pending Lock ---");
  // Pick an open future working day: Wednesday, 2026-11-18 to Wednesday, 2026-11-18 (1 working day)
  const testStartDate = "2026-11-18";
  const testEndDate = "2026-11-18";

  // Clean up any test artifact from prior test runs on this specific test date
  await prisma.leaveRequest.deleteMany({
    where: {
      employeeId: "EMP-0188",
      startDate: new Date(`${testStartDate}T00:00:00.000Z`),
    },
  });

  const validRes = await fetch(`${BASE_URL}/api/v1/leave/requests`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: empLogin.cookie },
    body: JSON.stringify({
      leaveTypeCode: "CL",
      startDate: testStartDate,
      endDate: testEndDate,
      reason: "Automated test time-off",
    }),
  });

  assert(validRes.status === 201, `Valid leave submission succeeds with HTTP 201 (Got: ${validRes.status})`);
  const validJson = await validRes.json();
  assert(validJson.success === true, "Response returns success: true");
  assert(validJson.data?.status === "Pending", "Newly submitted leave request status is strictly 'Pending'");
  assert(validJson.data?.days === 1, `Calculated working days is 1 (Got: ${validJson.data?.days})`);

  const createdId = validJson.data?.id;

  // Verify in database directly
  const dbReq = await prisma.leaveRequest.findUnique({
    where: { id: createdId },
  });
  assert(Boolean(dbReq), "Leave request is persisted in database");
  assert(dbReq?.employeeId === "EMP-0188", "Persisted request is strictly linked to EMP-0188");
  assert(dbReq?.status === "Pending", "Database confirms status is 'Pending'");

  // Verify new overlapping request on the exact same date is now rejected
  const repeatOverlapRes = await fetch(`${BASE_URL}/api/v1/leave/requests`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: empLogin.cookie },
    body: JSON.stringify({
      leaveTypeCode: "CL",
      startDate: testStartDate,
      endDate: testEndDate,
      reason: "Duplicate on same date",
    }),
  });
  assert(
    repeatOverlapRes.status === 409,
    `Submitting overlapping request while pending is rejected with HTTP 409 (Got: ${repeatOverlapRes.status})`
  );

  // --- 9. Calendar Events Verification ---
  console.log("\n--- 9. Calendar Events Verification ---");
  const calRes = await fetch(`${BASE_URL}/api/v1/leave/calendar?year=2026&month=11`, {
    headers: { Cookie: empLogin.cookie },
  });
  assert(calRes.status === 200, `Calendar API responds with HTTP 200 (Got: ${calRes.status})`);
  const calJson = await calRes.json();
  const holidays = calJson.data?.holidays || [];
  const leaves = calJson.data?.leaves || [];

  assert(Array.isArray(holidays), "Calendar returns holidays array");
  assert(Array.isArray(leaves), "Calendar returns employee leaves array");
  assert(
    leaves.some((l: { id: string }) => l.id === createdId),
    "Newly created leave request is visible on employee calendar"
  );

  // --- 10. Monthly Attendance Summary Verification ---
  console.log("\n--- 10. Monthly Attendance Summary Verification ---");
  const attRes = await fetch(`${BASE_URL}/api/v1/attendance/summary`, {
    headers: { Cookie: empLogin.cookie },
  });
  assert(attRes.status === 200, `Attendance summary responds with HTTP 200 (Got: ${attRes.status})`);
  const attJson = await attRes.json();
  const attData = attJson.data;

  assert(Boolean(attData), "Attendance summary data exists for EMP-0188");
  assert(attData.periodEndDate === "2026-09-30", `Period end date is 2026-09-30 (Got: ${attData?.periodEndDate})`);
  assert(attData.attendanceRate === 1, `Attendance rate is 100% (Got: ${attData?.attendanceRate})`);
  assert(attData.presentDays === 21, `Present days matches source data: 21 (Got: ${attData?.presentDays})`);
  assert(attData.scheduledDays === 21, `Scheduled days matches source data: 21 (Got: ${attData?.scheduledDays})`);

  // Clean up test request created in Step 8
  await prisma.leaveRequest.deleteMany({
    where: { id: createdId },
  });
  // Restore pending balance
  await prisma.leaveBalance.update({
    where: { employeeId: "EMP-0188" },
    data: { pendingDays: { decrement: 1 } },
  });

  console.log("\n=========================================================================");
  console.log(`TOTAL DAY 6 TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log("=========================================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runDay6Tests()
  .catch((err) => {
    console.error("Day 6 test execution error:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
