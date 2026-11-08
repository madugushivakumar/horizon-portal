/**
 * Reporting Hierarchy Verification Test Suite
 * scripts/test-reporting-hierarchy.ts
 *
 * Verifies the 3-tier reporting line requirement:
 * 1. Manager above the employee (when present)
 * 2. Selected employee in hierarchy
 * 3. Direct reports below the employee (when present)
 * 4. Executive handling (no manager)
 * 5. Individual contributor handling (no direct reports)
 * 6. Non-existent employee (404)
 * 7. Verification of 3 real employee relationships in the database
 */

import { prisma } from "../src/lib/prisma";

const BASE_URL = "http://localhost:3000";

interface LoginResult {
  cookie: string;
}

async function loginAsAdmin(): Promise<LoginResult> {
  const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@growmar.com", password: "Admin@Horizon2026!" }),
  });

  const setCookie = res.headers.get("set-cookie") || "";
  const match = setCookie.match(/horizon_session=([^;]+)/);
  const cookie = match ? `horizon_session=${match[1]}` : "";

  return { cookie };
}

async function testHierarchy() {
  console.log("===============================================================");
  console.log("  HORIZON PORTAL — REPORTING HIERARCHY VERIFICATION SUITE       ");
  console.log("===============================================================\n");

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

  const { cookie } = await loginAsAdmin();
  assert(Boolean(cookie), "Admin session established for hierarchy verification");

  // Helper to fetch employee profile
  async function fetchProfile(empId: string) {
    const res = await fetch(`${BASE_URL}/api/v1/employees/${empId}`, {
      headers: { Cookie: cookie },
    });
    const status = res.status;
    const body = await res.json();
    return { status, body };
  }

  // --- RELATIONSHIP 1: Executive without Manager (EMP-001: Alexander Wright) ---
  console.log("\n▶ Relationship 1: Executive without Manager (EMP-001 — Alexander Wright)");
  const emp1Res = await fetchProfile("EMP-001");
  assert(emp1Res.status === 200, "EMP-001 endpoint returns HTTP 200");
  const emp1 = emp1Res.body.data;

  assert(emp1.id === "EMP-001", "EMP-001 ID is verified");
  assert(emp1.name === "Alexander Wright", "EMP-001 display name matches");
  assert(emp1.managerId === null, "EMP-001 managerId is strictly null (Top-level executive)");
  assert(emp1.manager === null, "EMP-001 manager object is strictly null");
  assert(Array.isArray(emp1.directReports), "EMP-001 directReports is an array");
  assert(emp1.directReports.length >= 2, `EMP-001 has direct reports (${emp1.directReports.length} found)`);

  // Verify DB record matches
  const dbEmp1 = await prisma.employee.findUnique({
    where: { id: "EMP-001" },
    include: { directReports: true },
  });
  assert(dbEmp1?.managerId === null, "Database confirms EMP-001 has no manager");
  assert(
    dbEmp1?.directReports.length === emp1.directReports.length,
    `Database direct report count matches API (${dbEmp1?.directReports.length} vs ${emp1.directReports.length})`
  );

  // --- RELATIONSHIP 2: Manager with both Manager and Direct Reports (EMP-003: Marcus Brody) ---
  console.log("\n▶ Relationship 2: Middle Manager (EMP-003 — Marcus Brody)");
  const emp3Res = await fetchProfile("EMP-003");
  assert(emp3Res.status === 200, "EMP-003 endpoint returns HTTP 200");
  const emp3 = emp3Res.body.data;

  assert(emp3.id === "EMP-003", "EMP-003 ID is verified");
  assert(emp3.name === "Marcus Brody", "EMP-003 display name matches");
  assert(emp3.managerId === "EMP-001", "EMP-003 managerId is EMP-001");
  assert(Boolean(emp3.manager), "EMP-003 has manager object");
  assert(emp3.manager?.id === "EMP-001", "EMP-003 manager is Alexander Wright (EMP-001)");
  assert(emp3.manager?.name === "Alexander Wright", "EMP-003 manager display name is Alexander Wright");
  assert(Array.isArray(emp3.directReports), "EMP-003 directReports is an array");
  assert(emp3.directReports.length > 0, `EMP-003 has direct reports (${emp3.directReports.length} found)`);

  // Check that Sophie Chen is in Marcus Brody's direct reports
  const sophieInBrodyReports = emp3.directReports.some((r: { id: string }) => r.id === "EMP-004");
  assert(sophieInBrodyReports, "EMP-004 (Sophie Chen) is listed among EMP-003's direct reports");

  // Verify DB record matches
  const dbEmp3 = await prisma.employee.findUnique({
    where: { id: "EMP-003" },
    include: { manager: true, directReports: true },
  });
  assert(dbEmp3?.manager?.id === "EMP-001", "Database confirms EMP-003 reports to EMP-001");
  assert(
    Boolean(dbEmp3?.directReports.some((r) => r.id === "EMP-004")),
    "Database confirms EMP-004 reports to EMP-003"
  );

  // --- RELATIONSHIP 3: Individual Contributor without Direct Reports (EMP-004: Sophie Chen) ---
  console.log("\n▶ Relationship 3: Individual Contributor (EMP-004 — Sophie Chen)");
  const emp4Res = await fetchProfile("EMP-004");
  assert(emp4Res.status === 200, "EMP-004 endpoint returns HTTP 200");
  const emp4 = emp4Res.body.data;

  assert(emp4.id === "EMP-004", "EMP-004 ID is verified");
  assert(emp4.name === "Sophie Chen", "EMP-004 display name matches");
  assert(emp4.managerId === "EMP-003", "EMP-004 managerId is EMP-003");
  assert(Boolean(emp4.manager), "EMP-004 has manager object");
  assert(emp4.manager?.id === "EMP-003", "EMP-004 manager is Marcus Brody (EMP-003)");
  assert(emp4.manager?.name === "Marcus Brody", "EMP-004 manager display name is Marcus Brody");
  assert(Array.isArray(emp4.directReports), "EMP-004 directReports is an array");
  assert(emp4.directReports.length === 0, "EMP-004 has ZERO direct reports (Individual Contributor)");

  // Verify DB record matches
  const dbEmp4 = await prisma.employee.findUnique({
    where: { id: "EMP-004" },
    include: { directReports: true },
  });
  assert(dbEmp4?.directReports.length === 0, "Database confirms EMP-004 has 0 direct reports");

  // --- EDGE CASES: Non-existent employee & Invalid ID ---
  console.log("\n▶ Edge Cases: 404 Not Found & Malformed ID");
  const notFoundRes = await fetchProfile("EMP-999-DOESNOTEXIST");
  assert(notFoundRes.status === 404, "Non-existent employee returns HTTP 404");
  assert(Boolean(notFoundRes.body.error), "404 response includes structured error message");

  console.log("\n===============================================================");
  console.log(`TOTAL HIERARCHY TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log("===============================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

testHierarchy()
  .catch((err) => {
    console.error("Hierarchy test execution error:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
