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

  // --- RELATIONSHIP 1: Executive without Manager (EMP-0006: Tejas Chowdhury) ---
  console.log("\n▶ Relationship 1: Executive without Manager (EMP-0006 — Tejas Chowdhury)");
  const emp1Res = await fetchProfile("EMP-0006");
  assert(emp1Res.status === 200, "EMP-0006 endpoint returns HTTP 200");
  const emp1 = emp1Res.body.data;

  assert(emp1.id === "EMP-0006", "EMP-0006 ID is verified");
  assert(emp1.name === "Tejas Chowdhury", "EMP-0006 display name matches");
  assert(emp1.managerId === null, "EMP-0006 managerId is strictly null (Top-level executive)");
  assert(emp1.manager === null, "EMP-0006 manager object is strictly null");
  assert(Array.isArray(emp1.directReports), "EMP-0006 directReports is an array");
  assert(emp1.directReports.length >= 2, `EMP-0006 has direct reports (${emp1.directReports.length} found)`);

  // Verify DB record matches
  const dbEmp1 = await prisma.employee.findUnique({
    where: { id: "EMP-0006" },
    include: { directReports: true },
  });
  assert(dbEmp1?.managerId === null, "Database confirms EMP-0006 has no manager");
  assert(
    dbEmp1?.directReports.length === emp1.directReports.length,
    `Database direct report count matches API (${dbEmp1?.directReports.length} vs ${emp1.directReports.length})`
  );

  // --- RELATIONSHIP 2: Manager with both Manager and Direct Reports (EMP-0547: Imran Philip) ---
  console.log("\n▶ Relationship 2: Middle Manager (EMP-0547 — Imran Philip)");
  const emp3Res = await fetchProfile("EMP-0547");
  assert(emp3Res.status === 200, "EMP-0547 endpoint returns HTTP 200");
  const emp3 = emp3Res.body.data;

  assert(emp3.id === "EMP-0547", "EMP-0547 ID is verified");
  assert(emp3.name === "Imran Philip", "EMP-0547 display name matches");
  assert(emp3.managerId === "EMP-0685", "EMP-0547 managerId is EMP-0685");
  assert(Boolean(emp3.manager), "EMP-0547 has manager object");
  assert(emp3.manager?.id === "EMP-0685", "EMP-0547 manager is Siddharth Rao (EMP-0685)");
  assert(emp3.manager?.name === "Siddharth Rao", "EMP-0547 manager display name is Siddharth Rao");
  assert(Array.isArray(emp3.directReports), "EMP-0547 directReports is an array");
  assert(emp3.directReports.length > 0, `EMP-0547 has direct reports (${emp3.directReports.length} found)`);

  // Check that Sasi Shetty is in Imran Philip's direct reports
  const sasiInPhilipReports = emp3.directReports.some((r: { id: string }) => r.id === "EMP-0188");
  assert(sasiInPhilipReports, "EMP-0188 (Sasi Shetty) is listed among EMP-0547's direct reports");

  // Verify DB record matches
  const dbEmp3 = await prisma.employee.findUnique({
    where: { id: "EMP-0547" },
    include: { manager: true, directReports: true },
  });
  assert(dbEmp3?.manager?.id === "EMP-0685", "Database confirms EMP-0547 reports to EMP-0685");
  assert(
    Boolean(dbEmp3?.directReports.some((r) => r.id === "EMP-0188")),
    "Database confirms EMP-0188 reports to EMP-0547"
  );

  // --- RELATIONSHIP 3: Individual Contributor without Direct Reports (EMP-0188: Sasi Shetty) ---
  console.log("\n▶ Relationship 3: Individual Contributor (EMP-0188 — Sasi Shetty)");
  const emp4Res = await fetchProfile("EMP-0188");
  assert(emp4Res.status === 200, "EMP-0188 endpoint returns HTTP 200");
  const emp4 = emp4Res.body.data;

  assert(emp4.id === "EMP-0188", "EMP-0188 ID is verified");
  assert(emp4.name === "Sasi Shetty", "EMP-0188 display name matches");
  assert(emp4.managerId === "EMP-0547", "EMP-0188 managerId is EMP-0547");
  assert(Boolean(emp4.manager), "EMP-0188 has manager object");
  assert(emp4.manager?.id === "EMP-0547", "EMP-0188 manager is Imran Philip (EMP-0547)");
  assert(emp4.manager?.name === "Imran Philip", "EMP-0188 manager display name is Imran Philip");
  assert(Array.isArray(emp4.directReports), "EMP-0188 directReports is an array");
  assert(emp4.directReports.length === 0, "EMP-0188 has ZERO direct reports (Individual Contributor)");

  // Verify DB record matches
  const dbEmp4 = await prisma.employee.findUnique({
    where: { id: "EMP-0188" },
    include: { directReports: true },
  });
  assert(dbEmp4?.directReports.length === 0, "Database confirms EMP-0188 has 0 direct reports");

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
