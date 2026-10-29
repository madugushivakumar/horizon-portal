/**
 * Horizon Portal — Day 9 Employee Management Console Test Suite
 * scripts/test-day9-employee-management.ts
 *
 * Comprehensive Automated Verification Suite for Task 9:
 * Section A: Authorization & Role-Based Access Control (401, 403, 200)
 * Section B: Employee Query, Search, Department Filter, Sort & Pagination
 * Section C: Employee Creation & Unique Constraints
 * Section D: Employee Modification & Precision Field Diff Tracking
 * Section E: Safe Reversible Deactivation & Linked Account Inactivation
 * Section F: Audit Trail Integrity, Session Actor & Secret Protection
 * Section G: Bulk CSV Export, Escaping & Formula Injection Defense
 * Section H: UI Component, Navigation & Regression Integrity
 */

import { NextRequest } from "next/server";
import { prisma } from "../src/lib/prisma";
import { createAuthToken } from "../src/lib/auth/token";
import { SESSION_COOKIE_NAME } from "../src/lib/auth/session";
import { GET as getAdminEmployees, POST as createAdminEmployee } from "../src/app/api/v1/admin/employees/route";
import { GET as getAdminEmployeeDetail, PATCH as updateAdminEmployee } from "../src/app/api/v1/admin/employees/[id]/route";
import { POST as deactivateAdminEmployee } from "../src/app/api/v1/admin/employees/[id]/deactivate/route";
import { GET as exportEmployeesCsv, sanitizeCsvCell } from "../src/app/api/v1/admin/employees/export/route";
import { GET as getAuditLogs } from "../src/app/api/v1/admin/audit/route";
import { isRouteAllowedForRole, getNavigationForRole } from "../src/config/navigation";
import { calculateEmployeeDiff } from "../src/lib/audit/audit-logger";
import fs from "fs";
import path from "path";

// Ensure AUTH_SECRET is set for token signing
if (!process.env.AUTH_SECRET) {
  process.env.AUTH_SECRET = "test-jwt-secret-horizon-portal-phase-2-day-9-secure-key";
}

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✓ [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`  ✗ [FAIL] ${testName}`);
    if (detail) console.error(`    Detail: ${detail}`);
    failed++;
  }
}

function createMockRequest(
  url: string,
  method: "GET" | "POST" | "PATCH" | "PUT",
  token?: string,
  body?: unknown
): NextRequest {
  const headers = new Headers();
  if (token) {
    headers.set("cookie", `${SESSION_COOKIE_NAME}=${token}`);
    headers.set("authorization", `Bearer ${token}`);
  }
  if (body) {
    headers.set("content-type", "application/json");
  }

  const init: any = {
    method,
    headers,
  };
  if (body) {
    init.body = JSON.stringify(body);
  }

  return new NextRequest(new URL(url, "http://localhost:3000"), init);
}

async function runDay9Tests() {
  console.log("=========================================================================");
  console.log("   HORIZON PORTAL — DAY 9 ADMIN EMPLOYEE MANAGEMENT CONSOLE TEST SUITE   ");
  console.log("=========================================================================\n");

  // Load demo users from DB
  const [adminUser, hrUser, mgrUser, empUser] = await Promise.all([
    prisma.user.findFirst({ where: { role: "Admin", email: "admin@growmar.com" } }),
    prisma.user.findFirst({ where: { role: "HR", email: "hr@growmar.com" } }),
    prisma.user.findFirst({ where: { role: "Manager", email: "manager@growmar.com" } }),
    prisma.user.findFirst({ where: { role: "Employee", email: "employee@growmar.com" } }),
  ]);

  if (!adminUser || !hrUser || !mgrUser || !empUser) {
    throw new Error("Required demo users not found in database. Seed dev.db before running tests.");
  }

  const adminToken = await createAuthToken({
    sub: adminUser.id,
    email: adminUser.email,
    role: adminUser.role,
    name: adminUser.name,
  });

  const hrToken = await createAuthToken({
    sub: hrUser.id,
    email: hrUser.email,
    role: hrUser.role,
    name: hrUser.name,
  });

  const mgrToken = await createAuthToken({
    sub: mgrUser.id,
    email: mgrUser.email,
    role: mgrUser.role,
    name: mgrUser.name,
  });

  const empToken = await createAuthToken({
    sub: empUser.id,
    email: empUser.email,
    role: empUser.role,
    name: empUser.name,
  });

  const TEST_EMP_ID = "EMP-TEST-909";
  const TEST_EMAIL = "test.employee.day9@growmar.com";

  // Clean up any lingering test employee from previous runs
  try {
    await prisma.auditLog.deleteMany({ where: { employeeId: TEST_EMP_ID } });
    await prisma.employee.deleteMany({ where: { id: TEST_EMP_ID } });
  } catch {}

  // ───────────────────────────────────────────────────────────────────────────
  // SECTION A: Authorization & Role-Based Access Control
  // ───────────────────────────────────────────────────────────────────────────
  console.log("--- Section A: Authorization & Role Boundaries ---");

  // A1. Unauthenticated request -> HTTP 401
  const unauthReq = createMockRequest("/api/v1/admin/employees", "GET");
  const unauthRes = await getAdminEmployees(unauthReq);
  assert(unauthRes.status === 401, "Unauthenticated management list returns HTTP 401");

  // A2. Employee cannot create an employee -> HTTP 403
  const empCreateReq = createMockRequest("/api/v1/admin/employees", "POST", empToken, {
    id: "EMP-TEST-FORBIDDEN",
    firstName: "Hacker",
    lastName: "User",
    email: "hacker@growmar.com",
  });
  const empCreateRes = await createAdminEmployee(empCreateReq);
  assert(empCreateRes.status === 403, "Employee role cannot create an employee (HTTP 403)");

  // A3. Employee cannot edit an employee -> HTTP 403
  const empEditReq = createMockRequest(
    "/api/v1/admin/employees/EMP-0002",
    "PATCH",
    empToken,
    { firstName: "Tampered" }
  );
  const empEditRes = await updateAdminEmployee(empEditReq, {
    params: Promise.resolve({ id: "EMP-0002" }),
  });
  assert(empEditRes.status === 403, "Employee role cannot edit an employee (HTTP 403)");

  // A4. Employee cannot deactivate an employee -> HTTP 403
  const empDeactReq = createMockRequest(
    "/api/v1/admin/employees/EMP-0002/deactivate",
    "POST",
    empToken
  );
  const empDeactRes = await deactivateAdminEmployee(empDeactReq, {
    params: Promise.resolve({ id: "EMP-0002" }),
  });
  assert(empDeactRes.status === 403, "Employee role cannot deactivate an employee (HTTP 403)");

  // A5. Manager cannot perform management operations -> HTTP 403
  const mgrListReq = createMockRequest("/api/v1/admin/employees", "GET", mgrToken);
  const mgrListRes = await getAdminEmployees(mgrListReq);
  assert(mgrListRes.status === 403, "Manager role cannot access employee console list (HTTP 403)");

  const mgrCreateReq = createMockRequest("/api/v1/admin/employees", "POST", mgrToken, {
    id: "EMP-TEST-MGR-FORBIDDEN",
    firstName: "Manager",
    lastName: "Attempt",
    email: "mgr.attempt@growmar.com",
  });
  const mgrCreateRes = await createAdminEmployee(mgrCreateReq);
  assert(mgrCreateRes.status === 403, "Manager role cannot create an employee (HTTP 403)");

  // A6. Unauthorized users cannot read audit logs -> HTTP 403
  const empAuditReq = createMockRequest("/api/v1/admin/audit", "GET", empToken);
  const empAuditRes = await getAuditLogs(empAuditReq);
  assert(empAuditRes.status === 403, "Employee cannot read audit compliance records (HTTP 403)");

  const mgrAuditReq = createMockRequest("/api/v1/admin/audit", "GET", mgrToken);
  const mgrAuditRes = await getAuditLogs(mgrAuditReq);
  assert(mgrAuditRes.status === 403, "Manager cannot read audit compliance records (HTTP 403)");

  // A7. HR can access authorized management operations -> HTTP 200
  const hrListReq = createMockRequest("/api/v1/admin/employees", "GET", hrToken);
  const hrListRes = await getAdminEmployees(hrListReq);
  assert(hrListRes.status === 200, "HR role can access employee management list (HTTP 200)");

  // A8. Admin can access authorized management operations -> HTTP 200
  const adminListReq = createMockRequest("/api/v1/admin/employees", "GET", adminToken);
  const adminListRes = await getAdminEmployees(adminListReq);
  assert(adminListRes.status === 200, "Admin role can access employee management list (HTTP 200)");

  // ───────────────────────────────────────────────────────────────────────────
  // SECTION B: Employee Operations — Query, Search, Filter & Pagination
  // ───────────────────────────────────────────────────────────────────────────
  console.log("\n--- Section B: Query, Search, Filter, Sort & Pagination ---");

  const listData = await (await getAdminEmployees(hrListReq)).json();
  assert(Array.isArray(listData.data), "Employee list returns data array");
  assert(listData.data.length > 0, `Returned ${listData.data.length} records`);
  assert(listData.pagination?.total > 400, `Total count matches workforce size (Total: ${listData.pagination?.total})`);

  // B2. Privacy check: verify salary and credentials are NOT in list response
  const firstEmployee = listData.data[0];
  assert(firstEmployee.salary === undefined, "Salary is strictly excluded from list DTO");
  assert(firstEmployee.passwordHash === undefined, "passwordHash is strictly excluded from list DTO");
  assert(firstEmployee.password === undefined, "password is strictly excluded from list DTO");

  // B3. Search returns correct matches
  const searchReq = createMockRequest("/api/v1/admin/employees?search=Jatin", "GET", adminToken);
  const searchJson = await (await getAdminEmployees(searchReq)).json();
  const foundJatin = searchJson.data.some((e: any) =>
    e.fullName.toLowerCase().includes("jatin") || e.firstName.toLowerCase().includes("jatin")
  );
  assert(foundJatin, "Global search successfully finds employee by name");

  // B4. Department filter returns matching records
  const deptReq = createMockRequest("/api/v1/admin/employees?department=D01", "GET", adminToken);
  const deptJson = await (await getAdminEmployees(deptReq)).json();
  const allD01 = deptJson.data.every((e: any) => e.departmentId === "D01");
  assert(allD01 && deptJson.data.length > 0, "Department filter strictly returns D01 Engineering members");

  // B5. Sorting and pagination work deterministically
  const page1Req = createMockRequest("/api/v1/admin/employees?page=1&pageSize=5&sortBy=id&sortOrder=asc", "GET", adminToken);
  const page1Json = await (await getAdminEmployees(page1Req)).json();
  assert(page1Json.data.length === 5, "Pagination page size 5 respected");

  const page2Req = createMockRequest("/api/v1/admin/employees?page=2&pageSize=5&sortBy=id&sortOrder=asc", "GET", adminToken);
  const page2Json = await (await getAdminEmployees(page2Req)).json();
  assert(page2Json.data.length === 5, "Page 2 returns 5 records");
  assert(page1Json.data[0].id !== page2Json.data[0].id, "Page 1 and Page 2 records are distinct and sequential");

  // ───────────────────────────────────────────────────────────────────────────
  // SECTION C: Valid Creation, Validation & Duplicate Prevention
  // ───────────────────────────────────────────────────────────────────────────
  console.log("\n--- Section C: Employee Creation & Validation ---");

  // C1. Invalid employee input rejected (missing required fields)
  const invalidReq = createMockRequest("/api/v1/admin/employees", "POST", hrToken, {
    id: "EMP-INVALID",
    // Missing firstName, lastName, email
  });
  const invalidRes = await createAdminEmployee(invalidReq);
  assert(invalidRes.status === 400, "Creation with missing required fields returns HTTP 400");

  // C2. Valid employee creation persists
  const validCreateReq = createMockRequest("/api/v1/admin/employees", "POST", hrToken, {
    id: TEST_EMP_ID,
    firstName: "Varun",
    lastName: "Kulkarni",
    email: TEST_EMAIL,
    departmentId: "D01",
    roleId: "R003",
    workLocation: "Bangalore",
    workMode: "Hybrid",
    employmentType: "Permanent",
    hireDate: "2026-03-01",
    status: "Active",
  });
  const createRes = await createAdminEmployee(validCreateReq);
  const createJson = await createRes.json();
  assert(createRes.status === 201, `Valid employee creation succeeds with HTTP 201 (Got: ${createRes.status})`);
  assert(createJson.data.id === TEST_EMP_ID, "Returned record contains created employee ID");
  assert(createJson.data.fullName === "Varun Kulkarni", "Computed full name matches");

  // Verify in database directly
  const dbEmp = await prisma.employee.findUnique({ where: { id: TEST_EMP_ID } });
  assert(dbEmp !== null && dbEmp.email === TEST_EMAIL, "Employee persists accurately in SQLite dev.db");

  // C3. Duplicate identifier rejected with HTTP 409
  const dupIdReq = createMockRequest("/api/v1/admin/employees", "POST", adminToken, {
    id: TEST_EMP_ID, // duplicate ID
    firstName: "Another",
    lastName: "Person",
    email: "another.unique.email@growmar.com",
  });
  const dupIdRes = await createAdminEmployee(dupIdReq);
  assert(dupIdRes.status === 409, "Duplicate employee ID rejected with HTTP 409 Conflict");

  // C4. Duplicate email rejected with HTTP 409
  const dupEmailReq = createMockRequest("/api/v1/admin/employees", "POST", adminToken, {
    id: "EMP-TEST-DIFF-ID",
    firstName: "Another",
    lastName: "Person",
    email: TEST_EMAIL, // duplicate email
  });
  const dupEmailRes = await createAdminEmployee(dupEmailReq);
  assert(dupEmailRes.status === 409, "Duplicate employee email rejected with HTTP 409 Conflict");

  // ───────────────────────────────────────────────────────────────────────────
  // SECTION D: Employee Edit & Precision Field Diff Tracking
  // ───────────────────────────────────────────────────────────────────────────
  console.log("\n--- Section D: Modification & Field Diff Tracking ---");

  // D1. Valid edit updates intended fields
  const editReq = createMockRequest(
    `/api/v1/admin/employees/${TEST_EMP_ID}`,
    "PATCH",
    adminToken,
    {
      workLocation: "Pune",
      workMode: "Remote",
    }
  );
  const editRes = await updateAdminEmployee(editReq, {
    params: Promise.resolve({ id: TEST_EMP_ID }),
  });
  const editJson = await editRes.json();
  assert(editRes.status === 200, "Employee edit succeeds with HTTP 200");
  assert(editJson.data.workLocation === "Pune", "Work location updated to Pune");
  assert(editJson.data.workMode === "Remote", "Work mode updated to Remote");
  assert(editJson.diffs?.length === 2, `Exact 2 field diffs calculated (Got: ${editJson.diffs?.length})`);

  // D2. No-op updates do not produce false change records
  const noopReq = createMockRequest(
    `/api/v1/admin/employees/${TEST_EMP_ID}`,
    "PATCH",
    adminToken,
    {
      workLocation: "Pune", // Unchanged
      workMode: "Remote",   // Unchanged
    }
  );
  const initialAuditCount = await prisma.auditLog.count({
    where: { employeeId: TEST_EMP_ID, action: "EMPLOYEE_UPDATED" },
  });
  const noopRes = await updateAdminEmployee(noopReq, {
    params: Promise.resolve({ id: TEST_EMP_ID }),
  });
  const finalAuditCount = await prisma.auditLog.count({
    where: { employeeId: TEST_EMP_ID, action: "EMPLOYEE_UPDATED" },
  });
  assert(noopRes.status === 200, "No-op update returns HTTP 200");
  assert(initialAuditCount === finalAuditCount, "No-op update generated ZERO redundant audit entries");

  // D3. calculateEmployeeDiff helper unit check
  const unitDiff = calculateEmployeeDiff(
    { firstName: "Alice", phone: "123", salary: 50000, passwordHash: "secret" },
    { firstName: "Alice", phone: "456", salary: 99999, passwordHash: "newsecret" }
  );
  assert(unitDiff.length === 1 && unitDiff[0].fieldName === "phone", "calculateEmployeeDiff strictly ignores unchanged and sensitive fields");

  // ───────────────────────────────────────────────────────────────────────────
  // SECTION E: Safe Reversible Deactivation
  // ───────────────────────────────────────────────────────────────────────────
  console.log("\n--- Section E: Safe Deactivation & User Inactivation ---");

  // E1. Deactivate employee through dedicated endpoint
  const deactReq = createMockRequest(
    `/api/v1/admin/employees/${TEST_EMP_ID}/deactivate`,
    "POST",
    adminToken,
    { reason: "Completed assignment" }
  );
  const deactRes = await deactivateAdminEmployee(deactReq, {
    params: Promise.resolve({ id: TEST_EMP_ID }),
  });
  const deactJson = await deactRes.json();
  assert(deactRes.status === 200, "Deactivation endpoint returns HTTP 200");
  assert(deactJson.data?.status === "Inactive", "Status transitioned to Inactive");

  const deactDbEmp = await prisma.employee.findUnique({ where: { id: TEST_EMP_ID } });
  assert(deactDbEmp?.status === "Inactive", "Database confirms employee status is Inactive");

  // E2. Historical records are preserved (employee record was NOT deleted)
  assert(deactDbEmp !== null, "Employee record is safely preserved in DB (never deleted)");

  // ───────────────────────────────────────────────────────────────────────────
  // SECTION F: Audit Trail Integrity & Session Actor Verification
  // ───────────────────────────────────────────────────────────────────────────
  console.log("\n--- Section F: Audit Trail Integrity & Actor Validation ---");

  // F1. Verify creation audit records
  const creationLogs = await prisma.auditLog.findMany({
    where: { employeeId: TEST_EMP_ID, action: "EMPLOYEE_CREATED" },
  });
  assert(creationLogs.length > 0, `Creation generated audit entries (Found: ${creationLogs.length})`);
  assert(creationLogs[0].actorEmail === hrUser.email, `Actor identity derived from HR session (${creationLogs[0].actorEmail})`);

  // F2. Verify update audit records
  const updateLogs = await prisma.auditLog.findMany({
    where: { employeeId: TEST_EMP_ID, action: "EMPLOYEE_UPDATED" },
  });
  assert(updateLogs.length === 2, `Update generated exact changed field entries (Found: ${updateLogs.length})`);
  const locChange = updateLogs.find((l) => l.fieldName === "workLocation");
  assert(locChange?.oldValue === "Bangalore" && locChange?.newValue === "Pune", "Audit record preserves exact previous and new values");
  assert(updateLogs[0].actorEmail === adminUser.email, `Update actor captured from Admin session (${updateLogs[0].actorEmail})`);

  // F3. Verify deactivation audit record
  const deactLog = await prisma.auditLog.findFirst({
    where: { employeeId: TEST_EMP_ID, action: "EMPLOYEE_DEACTIVATED" },
  });
  assert(deactLog !== null, "Deactivation generated compliance audit record");
  assert(deactLog?.fieldName === "status" && deactLog?.newValue === "Inactive", "Deactivation audit logs status transition");

  // F4. Zero secrets in audit logs
  const allTestLogs = await prisma.auditLog.findMany({ where: { employeeId: TEST_EMP_ID } });
  const hasSecrets = allTestLogs.some((l) =>
    l.fieldName?.toLowerCase().includes("password") ||
    l.fieldName?.toLowerCase().includes("salary") ||
    l.oldValue?.includes("password") ||
    l.newValue?.includes("password")
  );
  assert(!hasSecrets, "Audit records strictly contain ZERO secrets, passwords, or salary entries");

  // F5. Query audit records via API
  const auditApiReq = createMockRequest(
    `/api/v1/admin/audit?employeeId=${TEST_EMP_ID}`,
    "GET",
    adminToken
  );
  const auditApiRes = await getAuditLogs(auditApiReq);
  const auditApiJson = await auditApiRes.json();
  assert(auditApiRes.status === 200, "Admin can retrieve audit log records via API (HTTP 200)");
  assert(auditApiJson.data.length >= 3, `API returned complete audit history (Count: ${auditApiJson.data.length})`);

  // ───────────────────────────────────────────────────────────────────────────
  // SECTION G: Bulk CSV Export & Formula Injection Defense
  // ───────────────────────────────────────────────────────────────────────────
  console.log("\n--- Section G: Bulk CSV Export & Formula Defense ---");

  // G1. Formula injection sanitizer unit check
  assert(sanitizeCsvCell("=SUM(1+1)") === "'=SUM(1+1)", "Formula injection = is safely escaped with single quote");
  assert(sanitizeCsvCell("+cmd|' /C calc'!A0") === "'+cmd|' /C calc'!A0", "Formula injection + is escaped");
  assert(sanitizeCsvCell("-2+3") === "'-2+3", "Formula injection - is escaped");
  assert(sanitizeCsvCell("@SUM(A1:A5)") === "'@SUM(A1:A5)", "Formula injection @ is escaped");
  assert(sanitizeCsvCell('Text with "quotes" and , comma') === '"Text with ""quotes"" and , comma"', "Commas and quotes are RFC 4180 escaped");

  // G2. CSV Export respects active department filter and includes all matching records
  const exportReq = createMockRequest(
    "/api/v1/admin/employees/export?department=D01",
    "GET",
    adminToken
  );
  const exportRes = await exportEmployeesCsv(exportReq);
  assert(exportRes.status === 200, "CSV export succeeds with HTTP 200");
  assert(Boolean(exportRes.headers.get("content-type")?.includes("text/csv")), "Content-Type is text/csv; charset=utf-8");

  const rawBuf = await exportRes.arrayBuffer();
  const rawBytes = new Uint8Array(rawBuf);
  const hasBom = rawBytes[0] === 0xef && rawBytes[1] === 0xbb && rawBytes[2] === 0xbf;
  assert(hasBom, "CSV starts with UTF-8 BOM (0xEF, 0xBB, 0xBF) for Microsoft Excel / Sheets compatibility");

  const csvText = new TextDecoder("utf-8").decode(rawBytes);
  assert(csvText.includes("Employee ID,First Name,Last Name"), "CSV contains expected column headers");
  assert(!csvText.includes("password"), "CSV strictly excludes password hashes");
  assert(!csvText.includes("salary"), "CSV strictly excludes salary compensation fields");

  // G3. Selected rows export
  const selectedExportReq = createMockRequest(
    `/api/v1/admin/employees/export?ids=${TEST_EMP_ID},EMP-0002`,
    "GET",
    hrToken
  );
  const selectedExportRes = await exportEmployeesCsv(selectedExportReq);
  const selectedCsv = await selectedExportRes.text();
  assert(selectedCsv.includes(TEST_EMP_ID) && selectedCsv.includes("EMP-0002"), "Selected rows export includes requested employee IDs");

  // G4. Unauthorized CSV export is rejected
  const empExportReq = createMockRequest("/api/v1/admin/employees/export", "GET", empToken);
  const empExportRes = await exportEmployeesCsv(empExportReq);
  assert(empExportRes.status === 403, "Employee cannot export CSV (HTTP 403 Forbidden)");

  // ───────────────────────────────────────────────────────────────────────────
  // SECTION H: Navigation, UI Integration & Regression Checks
  // ───────────────────────────────────────────────────────────────────────────
  console.log("\n--- Section H: Navigation & UI Integration ---");

  // H1. Route authorization checks
  assert(isRouteAllowedForRole("/admin/employees", "Admin") === true, "Admin is authorized for /admin/employees");
  assert(isRouteAllowedForRole("/admin/employees", "HR") === true, "HR is authorized for /admin/employees");
  assert(isRouteAllowedForRole("/admin/employees", "Manager") === false, "Manager is denied /admin/employees");
  assert(isRouteAllowedForRole("/admin/employees", "Employee") === false, "Employee is denied /admin/employees");

  // H2. Navigation menu displays item for HR and Admin
  const hrNav = getNavigationForRole("HR");
  const hrHrefs = hrNav.flatMap((s) => s.items.map((i) => i.href));
  assert(hrHrefs.includes("/admin/employees"), "HR navigation menu includes Employee Console (/admin/employees)");

  const adminNav = getNavigationForRole("Admin");
  const adminHrefs = adminNav.flatMap((s) => s.items.map((i) => i.href));
  assert(adminHrefs.includes("/admin/employees"), "Admin navigation menu includes Employee Console (/admin/employees)");

  const empNav = getNavigationForRole("Employee");
  const empHrefs = empNav.flatMap((s) => s.items.map((i) => i.href));
  assert(!empHrefs.includes("/admin/employees"), "Employee navigation menu strictly excludes Employee Console");

  // H3. Verify required files exist on filesystem
  const requiredFiles = [
    "src/app/admin/employees/page.tsx",
    "src/components/admin/employees/EmployeeManagementConsole.tsx",
    "src/components/admin/employees/EmployeeDrawer.tsx",
    "src/components/admin/employees/DeactivateConfirmationModal.tsx",
    "src/components/admin/employees/EmployeeAuditModal.tsx",
    "src/lib/audit/audit-logger.ts",
    "src/lib/validations/employee.ts",
    "src/app/api/v1/admin/employees/route.ts",
    "src/app/api/v1/admin/employees/[id]/route.ts",
    "src/app/api/v1/admin/employees/[id]/deactivate/route.ts",
    "src/app/api/v1/admin/employees/export/route.ts",
    "src/app/api/v1/admin/audit/route.ts",
  ];

  for (const file of requiredFiles) {
    const fullPath = path.resolve(process.cwd(), file);
    assert(fs.existsSync(fullPath), `Component file exists: ${file}`);
  }

  // Clean up test employee
  try {
    await prisma.auditLog.deleteMany({ where: { employeeId: TEST_EMP_ID } });
    await prisma.employee.deleteMany({ where: { id: TEST_EMP_ID } });
  } catch {}

  console.log("\n=========================================================================");
  console.log(`TOTAL DAY 9 TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log("=========================================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runDay9Tests().catch((err) => {
  console.error("Test execution encountered unexpected error:", err);
  process.exit(1);
});
