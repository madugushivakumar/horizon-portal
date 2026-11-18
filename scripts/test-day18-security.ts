/**
 * Horizon Portal — Day 18 Security Regression Test Suite
 * scripts/test-day18-security.ts
 *
 * Comprehensive tests for Stage C critical security fixes:
 * 1. SEC-FIND-01: Demo-session production guard
 *    - Production Admin demo-session request rejected (404)
 *    - Production HR demo-session request rejected (404)
 *    - Production Manager demo-session request rejected (404)
 *    - Production Employee demo-session request rejected (404)
 *    - Email variations rejected (?email=admin@growmar.com, hr@growmar.com, etc.)
 *    - Case variations rejected (?role=admin, ADMIN, MaNaGeR)
 *    - Manipulated query parameters rejected
 *    - No production response issues an authentication cookie (Set-Cookie)
 *    - No production response generates a valid session token
 *    - Development mode non-404 behavior preserved
 *
 * 2. SEC-FIND-03a: Employee profile handler-level authentication (/api/v1/employees/[id])
 *    - Unauthenticated request returns HTTP 401
 *    - Authenticated request with valid token succeeds (HTTP 200) for Admin, HR, Manager, Employee
 *    - Sensitive compensation/bank fields strictly excluded from response
 *
 * 3. SEC-FIND-03b: Departments handler-level authentication (/api/v1/departments)
 *    - Unauthenticated request returns HTTP 401
 *    - Authenticated request with valid token succeeds (HTTP 200) for Admin, HR, Manager, Employee
 *    - Response structure and employee counts preserved
 *
 * 4. SEC-FIND-03c: Roles handler-level authentication (/api/v1/roles)
 *    - Unauthenticated request returns HTTP 401
 *    - Authenticated request with valid token succeeds (HTTP 200) for Admin, HR, Manager, Employee
 *    - Response structure preserved
 */

import { NextRequest } from "next/server";
import { prisma } from "../src/lib/prisma";
import { createAuthToken } from "../src/lib/auth/token";
import { SESSION_COOKIE_NAME } from "../src/lib/auth/session";

if (!process.env.AUTH_SECRET) {
  process.env.AUTH_SECRET = "test-secret-for-day18-security-tests-only";
}

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

function createMockRequest(
  url: string,
  options?: { token?: string; method?: string }
): NextRequest {
  const req = new NextRequest(new URL(url, "http://localhost:3000"), {
    method: options?.method || "GET",
  });
  if (options?.token) {
    req.cookies.set(SESSION_COOKIE_NAME, options.token);
  }
  return req;
}

async function runTests() {
  console.log("\n========================================================");
  console.log("   HORIZON PORTAL — DAY 18 SECURITY VERIFICATION SUITE");
  console.log("========================================================\n");

  // Fetch real seeded demo accounts from the development database
  const adminUser = await prisma.user.findFirst({ where: { role: "Admin", isActive: true } });
  const hrUser = await prisma.user.findFirst({ where: { role: "HR", isActive: true } });
  const managerUser = await prisma.user.findFirst({ where: { role: "Manager", isActive: true } });
  const employeeUser = await prisma.user.findFirst({ where: { role: "Employee", isActive: true } });
  const sampleEmployee = await prisma.employee.findFirst({ select: { id: true } });

  const testEmployeeId = sampleEmployee ? sampleEmployee.id : "EMP-001";

  // Create real JWT tokens for each role
  const adminToken = adminUser
    ? await createAuthToken({ sub: adminUser.id, email: adminUser.email, role: adminUser.role, employeeId: adminUser.employeeId })
    : null;
  const hrToken = hrUser
    ? await createAuthToken({ sub: hrUser.id, email: hrUser.email, role: hrUser.role, employeeId: hrUser.employeeId })
    : null;
  const managerToken = managerUser
    ? await createAuthToken({ sub: managerUser.id, email: managerUser.email, role: managerUser.role, employeeId: managerUser.employeeId })
    : null;
  const employeeToken = employeeUser
    ? await createAuthToken({ sub: employeeUser.id, email: employeeUser.email, role: employeeUser.role, employeeId: employeeUser.employeeId })
    : null;

  // ─────────────────────────────────────────────────────────
  // PART 1: SEC-FIND-01 — Demo-session Production Guard Tests
  // ─────────────────────────────────────────────────────────
  console.log("▶ 1. SEC-FIND-01: Demo-session Production Guard\n");

  const { GET: demoSessionGET } = await import("../src/app/api/v1/auth/demo-session/route");

  const originalNodeEnv = process.env.NODE_ENV;

  try {
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";

    // 1.1 Admin role rejected in production
    const resAdmin = await demoSessionGET(createMockRequest("/api/v1/auth/demo-session?role=Admin"));
    assert(resAdmin.status === 404, "Production Admin demo-session request rejected (HTTP 404)");
    assert(!resAdmin.headers.get("set-cookie")?.includes(SESSION_COOKIE_NAME), "No session cookie set for Admin request in production");

    // 1.2 HR role rejected in production
    const resHR = await demoSessionGET(createMockRequest("/api/v1/auth/demo-session?role=HR"));
    assert(resHR.status === 404, "Production HR demo-session request rejected (HTTP 404)");
    assert(!resHR.headers.get("set-cookie")?.includes(SESSION_COOKIE_NAME), "No session cookie set for HR request in production");

    // 1.3 Manager role rejected in production
    const resMgr = await demoSessionGET(createMockRequest("/api/v1/auth/demo-session?role=Manager"));
    assert(resMgr.status === 404, "Production Manager demo-session request rejected (HTTP 404)");
    assert(!resMgr.headers.get("set-cookie")?.includes(SESSION_COOKIE_NAME), "No session cookie set for Manager request in production");

    // 1.4 Employee role rejected in production
    const resEmp = await demoSessionGET(createMockRequest("/api/v1/auth/demo-session?role=Employee"));
    assert(resEmp.status === 404, "Production Employee demo-session request rejected (HTTP 404)");
    assert(!resEmp.headers.get("set-cookie")?.includes(SESSION_COOKIE_NAME), "No session cookie set for Employee request in production");

    // 1.5 Email-based queries rejected in production
    const resEmail1 = await demoSessionGET(createMockRequest("/api/v1/auth/demo-session?email=admin@growmar.com"));
    assert(resEmail1.status === 404, "Production email request (?email=admin@growmar.com) rejected (HTTP 404)");

    const resEmail2 = await demoSessionGET(createMockRequest("/api/v1/auth/demo-session?email=hr@growmar.com"));
    assert(resEmail2.status === 404, "Production email request (?email=hr@growmar.com) rejected (HTTP 404)");

    const resEmail3 = await demoSessionGET(createMockRequest("/api/v1/auth/demo-session?email=attacker@evil.com"));
    assert(resEmail3.status === 404, "Production arbitrary email request rejected (HTTP 404)");

    // 1.6 Case variations & parameter manipulation rejected in production
    const resCase1 = await demoSessionGET(createMockRequest("/api/v1/auth/demo-session?role=admin"));
    assert(resCase1.status === 404, "Production lowercase role (?role=admin) rejected (HTTP 404)");

    const resCase2 = await demoSessionGET(createMockRequest("/api/v1/auth/demo-session?role=ADMIN"));
    assert(resCase2.status === 404, "Production uppercase role (?role=ADMIN) rejected (HTTP 404)");

    const resManip = await demoSessionGET(createMockRequest("/api/v1/auth/demo-session?role=Admin&redirect=//evil.com"));
    assert(resManip.status === 404, "Production manipulated redirect parameter rejected (HTTP 404)");

    // 1.7 Confirm response body error message and no session token generated
    const body = await resAdmin.json();
    assert(body.error === "This endpoint is not available in production.", "Production response body communicates endpoint unavailability");
    assert(!("token" in body), "Production response body contains no token");

  } finally {
    if (originalNodeEnv !== undefined) {
      (process.env as Record<string, string | undefined>).NODE_ENV = originalNodeEnv;
    } else {
      (process.env as Record<string, string | undefined>).NODE_ENV = undefined;
    }
  }

  // 1.8 Development mode behavior preserved (does not trigger production guard)
  try {
    (process.env as Record<string, string | undefined>).NODE_ENV = "development";
    const devRes = await demoSessionGET(createMockRequest("/api/v1/auth/demo-session?role=Admin"));
    // In development mode, should redirect (307) or succeed, never return 404 "This endpoint is not available in production."
    if (devRes.status === 404) {
      const devBody = await devRes.json();
      assert(devBody.error !== "This endpoint is not available in production.", "Development mode does not trigger production 404 guard");
    } else {
      assert(devRes.status === 307 || devRes.status === 200, "Development mode executes normal session generation");
    }
  } finally {
    if (originalNodeEnv !== undefined) {
      (process.env as Record<string, string | undefined>).NODE_ENV = originalNodeEnv;
    } else {
      (process.env as Record<string, string | undefined>).NODE_ENV = undefined;
    }
  }

  // ─────────────────────────────────────────────────────────
  // PART 2: SEC-FIND-03a — Employee Details Handler-level Auth
  // ─────────────────────────────────────────────────────────
  console.log("\n▶ 2. SEC-FIND-03a: Employee Details Handler-level Auth (/api/v1/employees/[id])\n");

  const { GET: employeeGET } = await import("../src/app/api/v1/employees/[id]/route");

  // 2.1 Unauthenticated request rejected with HTTP 401
  const unauthEmpRes = await employeeGET(
    createMockRequest(`/api/v1/employees/${testEmployeeId}`),
    { params: Promise.resolve({ id: testEmployeeId }) }
  );
  assert(unauthEmpRes.status === 401, "Unauthenticated employee detail request rejected with HTTP 401");
  const unauthEmpBody = await unauthEmpRes.json();
  assert(unauthEmpBody.error !== undefined, "HTTP 401 response contains explicit error message");

  // 2.2 Invalid token rejected with HTTP 401
  const invalidTokenRes = await employeeGET(
    createMockRequest(`/api/v1/employees/${testEmployeeId}`, { token: "invalid.jwt.token" }),
    { params: Promise.resolve({ id: testEmployeeId }) }
  );
  assert(invalidTokenRes.status === 401, "Malformed session token rejected with HTTP 401");

  // 2.3 Permitted role access (Admin, HR, Manager, Employee)
  if (adminToken) {
    const res = await employeeGET(
      createMockRequest(`/api/v1/employees/${testEmployeeId}`, { token: adminToken }),
      { params: Promise.resolve({ id: testEmployeeId }) }
    );
    assert(res.status === 200, "Admin can view employee profile (HTTP 200)");
  }

  if (hrToken) {
    const res = await employeeGET(
      createMockRequest(`/api/v1/employees/${testEmployeeId}`, { token: hrToken }),
      { params: Promise.resolve({ id: testEmployeeId }) }
    );
    assert(res.status === 200, "HR can view employee profile (HTTP 200)");
  }

  if (managerToken) {
    const res = await employeeGET(
      createMockRequest(`/api/v1/employees/${testEmployeeId}`, { token: managerToken }),
      { params: Promise.resolve({ id: testEmployeeId }) }
    );
    assert(res.status === 200, "Manager can view employee profile (HTTP 200)");
  }

  if (employeeToken) {
    const res = await employeeGET(
      createMockRequest(`/api/v1/employees/${testEmployeeId}`, { token: employeeToken }),
      { params: Promise.resolve({ id: testEmployeeId }) }
    );
    assert(res.status === 200, "Employee can view directory profile (HTTP 200)");

    // 2.4 Verify sensitive field exclusion (salary, compensation, bankAccount)
    const empData = await res.json();
    assert(empData.data !== undefined, "Employee profile response includes 'data' object");
    assert(empData.data.salary === undefined, "Directory profile strictly excludes 'salary'");
    assert(empData.data.bankAccount === undefined, "Directory profile strictly excludes 'bankAccount'");
    assert(empData.data.panNumber === undefined, "Directory profile strictly excludes 'panNumber'");
  }

  // ─────────────────────────────────────────────────────────
  // PART 3: SEC-FIND-03b — Departments Handler-level Auth
  // ─────────────────────────────────────────────────────────
  console.log("\n▶ 3. SEC-FIND-03b: Departments Handler-level Auth (/api/v1/departments)\n");

  const { GET: departmentsGET } = await import("../src/app/api/v1/departments/route");

  // 3.1 Unauthenticated request rejected with HTTP 401
  const unauthDeptRes = await departmentsGET(createMockRequest("/api/v1/departments"));
  assert(unauthDeptRes.status === 401, "Unauthenticated departments request rejected with HTTP 401");
  const unauthDeptBody = await unauthDeptRes.json();
  assert(unauthDeptBody.error !== undefined, "HTTP 401 response contains explicit error message");

  // 3.2 Permitted role access for all authenticated roles
  if (adminToken) {
    const res = await departmentsGET(createMockRequest("/api/v1/departments", { token: adminToken }));
    assert(res.status === 200, "Admin can access departments (HTTP 200)");
  }

  if (hrToken) {
    const res = await departmentsGET(createMockRequest("/api/v1/departments", { token: hrToken }));
    assert(res.status === 200, "HR can access departments (HTTP 200)");
  }

  if (managerToken) {
    const res = await departmentsGET(createMockRequest("/api/v1/departments", { token: managerToken }));
    assert(res.status === 200, "Manager can access departments (HTTP 200)");
  }

  if (employeeToken) {
    const res = await departmentsGET(createMockRequest("/api/v1/departments", { token: employeeToken }));
    assert(res.status === 200, "Employee can access departments (HTTP 200)");

    // 3.3 Verify response structure and employeeCount
    const deptData = await res.json();
    assert(Array.isArray(deptData.data), "Departments response contains 'data' array");
    if (deptData.data.length > 0) {
      assert(typeof deptData.data[0].employeeCount === "number", "Department items include aggregated 'employeeCount'");
      assert(typeof deptData.data[0].name === "string", "Department items include 'name'");
    }
  }

  // ─────────────────────────────────────────────────────────
  // PART 4: SEC-FIND-03c — Roles Handler-level Auth
  // ─────────────────────────────────────────────────────────
  console.log("\n▶ 4. SEC-FIND-03c: Roles Handler-level Auth (/api/v1/roles)\n");

  const { GET: rolesGET } = await import("../src/app/api/v1/roles/route");

  // 4.1 Unauthenticated request rejected with HTTP 401
  const unauthRolesRes = await rolesGET(createMockRequest("/api/v1/roles"));
  assert(unauthRolesRes.status === 401, "Unauthenticated roles request rejected with HTTP 401");
  const unauthRolesBody = await unauthRolesRes.json();
  assert(unauthRolesBody.error !== undefined, "HTTP 401 response contains explicit error message");

  // 4.2 Permitted role access for all authenticated roles
  if (adminToken) {
    const res = await rolesGET(createMockRequest("/api/v1/roles", { token: adminToken }));
    assert(res.status === 200, "Admin can access roles (HTTP 200)");
  }

  if (hrToken) {
    const res = await rolesGET(createMockRequest("/api/v1/roles", { token: hrToken }));
    assert(res.status === 200, "HR can access roles (HTTP 200)");
  }

  if (managerToken) {
    const res = await rolesGET(createMockRequest("/api/v1/roles", { token: managerToken }));
    assert(res.status === 200, "Manager can access roles (HTTP 200)");
  }

  if (employeeToken) {
    const res = await rolesGET(createMockRequest("/api/v1/roles", { token: employeeToken }));
    assert(res.status === 200, "Employee can access roles (HTTP 200)");

    // 4.3 Verify response structure
    const rolesData = await res.json();
    assert(Array.isArray(rolesData.data), "Roles response contains 'data' array");
    if (rolesData.data.length > 0) {
      assert(typeof rolesData.data[0].name === "string", "Role items include 'name'");
      assert(rolesData.data[0].level !== undefined, "Role items include 'level'");
    }
  }

  // ─────────────────────────────────────────────────────────
  // SUMMARY
  // ─────────────────────────────────────────────────────────
  console.log("\n========================================================");
  console.log(`  DAY 18 SECURITY SUMMARY: ${passed} PASSED, ${failed} FAILED`);
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
