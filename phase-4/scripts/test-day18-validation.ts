/**
 * Horizon Portal — Day 18 Stage D Validation Test Suite
 * scripts/test-day18-validation.ts
 *
 * Comprehensive tests for Zod input validation hardening across:
 * - Login payload validation (POST /api/v1/auth/login)
 * - Leave request submission validation (POST /api/v1/leave/requests)
 * - Leave rejection decision validation (POST /api/v1/approvals/leave/[id]/reject)
 * - Manager delegation validation (POST /api/v1/approvals/delegations)
 * - Directory query parameter validation (GET /api/v1/employees)
 * - Calendar query parameter validation (GET /api/v1/leave/calendar)
 * - Team attendance query parameter validation (GET /api/v1/team/attendance)
 * - Payroll runs query parameter validation (GET /api/v1/payroll/runs)
 * - Identifier parameter validation (idParamSchema)
 */

import { NextRequest } from "next/server";
import { prisma } from "../src/lib/prisma";
import { createAuthToken } from "../src/lib/auth/token";
import { SESSION_COOKIE_NAME } from "../src/lib/auth/session";

import {
  loginInputSchema,
  leaveRequestInputSchema,
  leaveCalendarQuerySchema,
  leaveRejectionSchema,
  managerDelegationSchema,
  employeeDirectoryQuerySchema,
  teamAttendanceQuerySchema,
  payrollRunsQuerySchema,
  idParamSchema,
} from "../src/lib/validations";

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
  options?: { token?: string; method?: string; body?: unknown }
): NextRequest {
  const reqInit: { method: string; body?: string; headers?: Record<string, string> } = {
    method: options?.method || "GET",
  };

  if (options?.body !== undefined) {
    reqInit.body = typeof options.body === "string" ? options.body : JSON.stringify(options.body);
    reqInit.headers = { "Content-Type": "application/json" };
  }

  const req = new NextRequest(new URL(url, "http://localhost:3000"), reqInit);
  if (options?.token) {
    req.cookies.set(SESSION_COOKIE_NAME, options.token);
  }
  return req;
}

async function runTests() {
  console.log("\n========================================================");
  console.log("   HORIZON PORTAL — DAY 18 STAGE D VALIDATION SUITE");
  console.log("========================================================\n");

  // Fetch real seeded demo accounts from the development database
  const adminUser = await prisma.user.findFirst({ where: { role: "Admin", isActive: true } });
  const hrUser = await prisma.user.findFirst({ where: { role: "HR", isActive: true } });
  const managerUser = await prisma.user.findFirst({ where: { role: "Manager", isActive: true } });
  const employeeUser = await prisma.user.findFirst({ where: { role: "Employee", isActive: true } });

  const adminToken = adminUser ? await createAuthToken({ sub: adminUser.id, email: adminUser.email, role: adminUser.role, employeeId: adminUser.employeeId }) : "";
  const hrToken = hrUser ? await createAuthToken({ sub: hrUser.id, email: hrUser.email, role: hrUser.role, employeeId: hrUser.employeeId }) : "";
  const managerToken = managerUser ? await createAuthToken({ sub: managerUser.id, email: managerUser.email, role: managerUser.role, employeeId: managerUser.employeeId }) : "";
  const employeeToken = employeeUser ? await createAuthToken({ sub: employeeUser.id, email: employeeUser.email, role: employeeUser.role, employeeId: employeeUser.employeeId }) : "";

  // ─────────────────────────────────────────────────────────
  // CATEGORY A: Required Fields & Empty Inputs
  // ─────────────────────────────────────────────────────────
  console.log("▶ A. Required Fields & Empty Inputs\n");

  // A1. Login schema rejects missing fields
  assert(!loginInputSchema.safeParse({}).success, "Login rejects empty object");
  assert(!loginInputSchema.safeParse({ email: "test@growmar.com" }).success, "Login rejects missing password");
  assert(!loginInputSchema.safeParse({ password: "Password123!" }).success, "Login rejects missing email");

  // A2. Leave request schema rejects missing fields
  assert(!leaveRequestInputSchema.safeParse({}).success, "Leave request rejects empty object");
  assert(!leaveRequestInputSchema.safeParse({ startDate: "2026-11-20", endDate: "2026-11-22" }).success, "Leave request rejects missing leaveTypeCode");
  assert(!leaveRequestInputSchema.safeParse({ leaveTypeCode: "CL", endDate: "2026-11-22" }).success, "Leave request rejects missing startDate");
  assert(!leaveRequestInputSchema.safeParse({ leaveTypeCode: "CL", startDate: "2026-11-20" }).success, "Leave request rejects missing endDate");

  // A3. Leave rejection schema rejects empty reason
  assert(!leaveRejectionSchema.safeParse({}).success, "Rejection rejects empty object");
  assert(!leaveRejectionSchema.safeParse({ reason: "" }).success, "Rejection rejects empty string reason");
  assert(!leaveRejectionSchema.safeParse({ reason: "   " }).success, "Rejection rejects whitespace-only reason");

  // A4. Delegation schema rejects missing fields
  assert(!managerDelegationSchema.safeParse({}).success, "Delegation rejects empty object");
  assert(!managerDelegationSchema.safeParse({ actingManagerId: "EMP-002" }).success, "Delegation rejects missing dates");

  // A5. Identifier schema rejects empty/whitespace
  assert(!idParamSchema.safeParse("").success, "ID param rejects empty string");
  assert(!idParamSchema.safeParse("   ").success, "ID param rejects whitespace string");

  // ─────────────────────────────────────────────────────────
  // CATEGORY B: Data Types & Coercion
  // ─────────────────────────────────────────────────────────
  console.log("\n▶ B. Data Types & Coercion\n");

  // B1. Non-string inputs where string expected
  assert(!loginInputSchema.safeParse({ email: 12345, password: "valid" }).success, "Login rejects numeric email");
  assert(!loginInputSchema.safeParse({ email: "a@b.com", password: true }).success, "Login rejects boolean password");

  // B2. Calendar query pagination/integer types
  assert(!leaveCalendarQuerySchema.safeParse({ year: "invalid-year" }).success, "Calendar rejects non-numeric year");
  assert(!leaveCalendarQuerySchema.safeParse({ month: "invalid-month" }).success, "Calendar rejects non-numeric month");

  // B3. Team attendance query types
  assert(!teamAttendanceQuerySchema.safeParse({ year: "abc" }).success, "Team attendance rejects non-numeric year");
  assert(!teamAttendanceQuerySchema.safeParse({ month: "xyz" }).success, "Team attendance rejects non-numeric month");

  // B4. Directory query pagination coercion
  const dirParsed = employeeDirectoryQuerySchema.safeParse({ page: "3", pageSize: "25" });
  assert(dirParsed.success && dirParsed.data.page === 3 && dirParsed.data.pageSize === 25, "Directory safely coerces numeric string page & pageSize");

  // ─────────────────────────────────────────────────────────
  // CATEGORY C: Boundaries & Length Limits
  // ─────────────────────────────────────────────────────────
  console.log("\n▶ C. Boundaries & Length Limits\n");

  // C1. Excessively long email / password
  const longEmail = "a".repeat(250) + "@growmar.com";
  assert(!loginInputSchema.safeParse({ email: longEmail, password: "valid" }).success, "Login rejects email exceeding 255 chars");

  const longPassword = "p".repeat(256);
  assert(!loginInputSchema.safeParse({ email: "test@growmar.com", password: longPassword }).success, "Login rejects password exceeding 255 chars");

  // C2. Calendar month boundaries (1 to 12)
  assert(!leaveCalendarQuerySchema.safeParse({ month: 0 }).success, "Calendar rejects month < 1");
  assert(!leaveCalendarQuerySchema.safeParse({ month: 13 }).success, "Calendar rejects month > 12");
  assert(leaveCalendarQuerySchema.safeParse({ month: 1 }).success, "Calendar accepts month = 1");
  assert(leaveCalendarQuerySchema.safeParse({ month: 12 }).success, "Calendar accepts month = 12");

  // C3. Calendar year boundaries (1900 to 2100)
  assert(!leaveCalendarQuerySchema.safeParse({ year: 1899 }).success, "Calendar rejects year < 1900");
  assert(!leaveCalendarQuerySchema.safeParse({ year: 2101 }).success, "Calendar rejects year > 2100");
  assert(leaveCalendarQuerySchema.safeParse({ year: 2026 }).success, "Calendar accepts year = 2026");

  // C4. Directory page size limits (max 100)
  assert(!employeeDirectoryQuerySchema.safeParse({ pageSize: 150 }).success, "Directory rejects pageSize > 100");
  assert(!employeeDirectoryQuerySchema.safeParse({ page: 0 }).success, "Directory rejects page < 1");

  // C5. ID length limit (max 128)
  const longId = "X".repeat(129);
  assert(!idParamSchema.safeParse(longId).success, "ID param rejects identifier exceeding 128 chars");

  // ─────────────────────────────────────────────────────────
  // CATEGORY D: Format Validation
  // ─────────────────────────────────────────────────────────
  console.log("\n▶ D. Format Validation\n");

  // D1. Invalid email format
  assert(!loginInputSchema.safeParse({ email: "not-an-email", password: "Password123!" }).success, "Login rejects invalid email format");
  assert(!loginInputSchema.safeParse({ email: "missing@domain", password: "Password123!" }).success, "Login rejects incomplete email domain");

  // D2. Invalid date formats
  assert(!leaveRequestInputSchema.safeParse({ leaveTypeCode: "CL", startDate: "20-11-2026", endDate: "2026-11-22" }).success, "Leave request rejects non-YYYY-MM-DD start date");
  assert(!leaveRequestInputSchema.safeParse({ leaveTypeCode: "CL", startDate: "2026-11-20", endDate: "tomorrow" }).success, "Leave request rejects verbal end date");

  // D3. Delegation invalid date format
  assert(!managerDelegationSchema.safeParse({ actingManagerId: "EMP-002", startDate: "invalid", endDate: "2026-11-22" }).success, "Delegation rejects invalid start date");

  // ─────────────────────────────────────────────────────────
  // CATEGORY E: HTTP Route Handler Integration Tests
  // ─────────────────────────────────────────────────────────
  console.log("\n▶ E. HTTP Route Handler Integration Tests\n");

  // E1. POST /api/v1/auth/login invalid payloads
  const { POST: loginPOST } = await import("../src/app/api/v1/auth/login/route");

  const loginRes1 = await loginPOST(createMockRequest("/api/v1/auth/login", { method: "POST", body: {} }));
  assert(loginRes1.status === 422 || loginRes1.status === 400, "POST /api/v1/auth/login returns HTTP 422/400 for empty body");
  const loginBody1 = await loginRes1.json();
  assert(loginBody1.details !== undefined, "Login validation error response includes structured details");

  const loginRes2 = await loginPOST(createMockRequest("/api/v1/auth/login", { method: "POST", body: { email: "not-an-email", password: "valid" } }));
  assert(loginRes2.status === 422 || loginRes2.status === 400, "POST /api/v1/auth/login returns HTTP 422/400 for malformed email");

  // E2. POST /api/v1/leave/requests invalid payloads
  const { POST: leaveRequestsPOST } = await import("../src/app/api/v1/leave/requests/route");

  const leaveRes1 = await leaveRequestsPOST(createMockRequest("/api/v1/leave/requests", { method: "POST", token: employeeToken, body: {} }));
  assert(leaveRes1.status === 422 || leaveRes1.status === 400, "POST /api/v1/leave/requests returns HTTP 422/400 for empty body");
  const leaveBody1 = await leaveRes1.json();
  assert(leaveBody1.details !== undefined, "Leave request validation error includes structured details");

  const leaveRes2 = await leaveRequestsPOST(createMockRequest("/api/v1/leave/requests", { method: "POST", token: employeeToken, body: { leaveTypeCode: "CL", startDate: "bad-date", endDate: "2026-11-22" } }));
  assert(leaveRes2.status === 422 || leaveRes2.status === 400, "POST /api/v1/leave/requests returns HTTP 422/400 for invalid date format");

  // E3. POST /api/v1/approvals/leave/[id]/reject validation
  const { POST: rejectPOST } = await import("../src/app/api/v1/approvals/leave/[id]/reject/route");

  const rejectRes1 = await rejectPOST(
    createMockRequest("/api/v1/approvals/leave/LR-001/reject", { method: "POST", token: managerToken, body: { reason: "   " } }),
    { params: Promise.resolve({ id: "LR-001" }) }
  );
  assert(rejectRes1.status === 422 || rejectRes1.status === 400, "POST /api/v1/approvals/leave/[id]/reject returns HTTP 422/400 for whitespace-only reason");

  // E4. GET /api/v1/employees query validation
  const { GET: employeesGET } = await import("../src/app/api/v1/employees/route");

  const empRes1 = await employeesGET(createMockRequest("/api/v1/employees?page=0", { token: employeeToken }));
  assert(empRes1.status === 422 || empRes1.status === 400, "GET /api/v1/employees returns HTTP 422/400 for page=0");

  const empRes2 = await employeesGET(createMockRequest("/api/v1/employees?pageSize=999", { token: employeeToken }));
  assert(empRes2.status === 422 || empRes2.status === 400, "GET /api/v1/employees returns HTTP 422/400 for pageSize=999");

  // E5. GET /api/v1/leave/calendar query validation
  const { GET: calendarGET } = await import("../src/app/api/v1/leave/calendar/route");

  const calRes1 = await calendarGET(createMockRequest("/api/v1/leave/calendar?month=15", { token: employeeToken }));
  assert(calRes1.status === 422 || calRes1.status === 400, "GET /api/v1/leave/calendar returns HTTP 422/400 for month=15");

  const calRes2 = await calendarGET(createMockRequest("/api/v1/leave/calendar?year=1850", { token: employeeToken }));
  assert(calRes2.status === 422 || calRes2.status === 400, "GET /api/v1/leave/calendar returns HTTP 422/400 for year=1850");

  // ─────────────────────────────────────────────────────────
  // CATEGORY F: Regression Protection
  // ─────────────────────────────────────────────────────────
  console.log("\n▶ F. Regression Protection\n");

  // F1. Valid login continues to succeed
  const validLoginRes = await loginPOST(createMockRequest("/api/v1/auth/login", {
    method: "POST",
    body: { email: "admin@growmar.com", password: "Admin@Horizon2026!" },
  }));
  assert(validLoginRes.status === 200, "Valid login request succeeds with HTTP 200");
  const validLoginBody = await validLoginRes.json();
  assert(validLoginBody.user?.role === "Admin", "Valid login returns correct user object");

  // F2. Valid employee directory query continues to succeed
  const validEmpRes = await employeesGET(createMockRequest("/api/v1/employees?page=1&pageSize=10", { token: employeeToken }));
  assert(validEmpRes.status === 200, "Valid employee directory request succeeds with HTTP 200");
  const validEmpBody = await validEmpRes.json();
  assert(Array.isArray(validEmpBody.data), "Directory response contains data array");

  // F3. Valid calendar query continues to succeed
  const validCalRes = await calendarGET(createMockRequest("/api/v1/leave/calendar?year=2026&month=11", { token: employeeToken }));
  assert(validCalRes.status === 200, "Valid calendar query succeeds with HTTP 200");

  // ─────────────────────────────────────────────────────────
  // SUMMARY
  // ─────────────────────────────────────────────────────────
  console.log("\n========================================================");
  console.log(`  DAY 18 STAGE D SUMMARY: ${passed} PASSED, ${failed} FAILED`);
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
