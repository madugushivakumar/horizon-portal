/**
 * Horizon Portal — Day 18 Route Verification Suite
 * scripts/test-day18-tasks-verification.ts
 *
 * Verifies request-time execution and behavior of GET /api/v1/tasks and GET /api/v1/tasks/filters:
 * 1. Return HTTP 401 when unauthenticated.
 * 2. Return HTTP 200 with appropriate scoped data when authenticated as Employee (own tasks only).
 * 3. Return HTTP 200 with team-scoped data when authenticated as Manager.
 * 4. Return HTTP 200 with all organization tasks when authenticated as Admin.
 * 5. Correctly handle filter query parameters (departmentId, teamId, sprintId).
 * 6. Return HTTP 400 for invalid query parameters.
 * 7. Return properly formatted filter options from GET /api/v1/tasks/filters.
 * 8. Re-verify prisma/dev.db size is exactly 3,637,248 bytes.
 */

import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { NextRequest } from "next/server";
import { createAuthToken } from "../src/lib/auth/token";
import { SESSION_COOKIE_NAME } from "../src/lib/auth/session";

import { GET as getTasksRoute } from "../src/app/api/v1/tasks/route";
import { GET as getTasksFiltersRoute } from "../src/app/api/v1/tasks/filters/route";

const prisma = new PrismaClient();

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✅ [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] ${testName}`);
    if (detail) console.error(`    Detail: ${detail}`);
    failed++;
  }
}

interface MockUser {
  id: string;
  email: string;
  role: string;
  employeeId?: string | null;
}

async function createMockRequest(
  url: string,
  options?: {
    user?: MockUser;
  }
): Promise<NextRequest> {
  const headers = new Headers();
  headers.set("Content-Type", "application/json");

  if (options?.user) {
    const token = await createAuthToken({
      sub: options.user.id,
      email: options.user.email,
      role: options.user.role,
      employeeId: options.user.employeeId || null,
    });
    headers.set("Cookie", `${SESSION_COOKIE_NAME}=${token}`);
  }

  return new NextRequest(new URL(url, "http://localhost:3000"), {
    method: "GET",
    headers,
  });
}

async function runTasksVerification() {
  console.log("==================================================================");
  console.log("  HORIZON PORTAL — DAY 18 TASKS API VERIFICATION SUITE           ");
  console.log("==================================================================\n");

  const adminUser = await prisma.user.findUnique({ where: { email: "admin@growmar.com" } });
  const managerUser = await prisma.user.findUnique({ where: { email: "manager@growmar.com" } });
  const employeeUser = await prisma.user.findUnique({ where: { email: "employee@growmar.com" } });

  if (!adminUser || !managerUser || !employeeUser) {
    throw new Error("Missing required demo accounts in SQLite database.");
  }

  // -------------------------------------------------------------------------
  // 1. Unauthenticated Request Rejection
  // -------------------------------------------------------------------------
  console.log("--- 1. Unauthenticated Request Rejection ---");
  const unauthTasksReq = await createMockRequest("/api/v1/tasks");
  const unauthTasksRes = await getTasksRoute(unauthTasksReq);
  assert(unauthTasksRes.status === 401, "GET /api/v1/tasks unauthenticated returns HTTP 401");

  const unauthFiltersReq = await createMockRequest("/api/v1/tasks/filters");
  const unauthFiltersRes = await getTasksFiltersRoute(unauthFiltersReq);
  assert(unauthFiltersRes.status === 401, "GET /api/v1/tasks/filters unauthenticated returns HTTP 401");

  // -------------------------------------------------------------------------
  // 2. Employee Visibility (Own Tasks Only)
  // -------------------------------------------------------------------------
  console.log("\n--- 2. Employee Visibility (Own Tasks Only) ---");
  const employeeTasksReq = await createMockRequest("/api/v1/tasks?pageSize=50", { user: employeeUser });
  const employeeTasksRes = await getTasksRoute(employeeTasksReq);
  assert(employeeTasksRes.status === 200, "GET /api/v1/tasks authenticated as Employee returns HTTP 200");
  const employeeData = await employeeTasksRes.json();
  assert(employeeData.success === true, "Employee response includes success: true");
  assert(Array.isArray(employeeData.data), "Employee response data is an array");
  
  // Verify all returned tasks are assigned to employeeUser.employeeId
  const nonSelfTasks = employeeData.data.filter(
    (t: any) => t.assigneeEmployeeId !== employeeUser.employeeId
  );
  assert(nonSelfTasks.length === 0, `All returned tasks belong strictly to Employee (${employeeUser.employeeId})`);
  assert(employeeData.data.every((t: any) => t.status !== "Cancelled"), "Cancelled tasks excluded by default");

  // -------------------------------------------------------------------------
  // 3. Manager Visibility (Team-Scoped)
  // -------------------------------------------------------------------------
  console.log("\n--- 3. Manager Visibility (Team-Scoped) ---");
  const managerTasksReq = await createMockRequest("/api/v1/tasks?pageSize=50", { user: managerUser });
  const managerTasksRes = await getTasksRoute(managerTasksReq);
  assert(managerTasksRes.status === 200, "GET /api/v1/tasks authenticated as Manager returns HTTP 200");
  const managerData = await managerTasksRes.json();
  assert(managerData.success === true, "Manager response includes success: true");
  assert(Array.isArray(managerData.data), "Manager response data is an array");
  assert(managerData.pagination.total > 0, `Manager sees authorized team/report tasks (total: ${managerData.pagination.total})`);

  // -------------------------------------------------------------------------
  // 4. Admin Visibility (All Organization Tasks)
  // -------------------------------------------------------------------------
  console.log("\n--- 4. Admin Visibility (All Organization Tasks) ---");
  const adminTasksReq = await createMockRequest("/api/v1/tasks?pageSize=50", { user: adminUser });
  const adminTasksRes = await getTasksRoute(adminTasksReq);
  assert(adminTasksRes.status === 200, "GET /api/v1/tasks authenticated as Admin returns HTTP 200");
  const adminData = await adminTasksRes.json();
  assert(adminData.success === true, "Admin response includes success: true");
  assert(adminData.pagination.total === 4684, `Admin total matches organization non-cancelled tasks (4,684, got ${adminData.pagination.total})`);

  // -------------------------------------------------------------------------
  // 5. Query Parameter Filtering (departmentId, teamId, sprintId)
  // -------------------------------------------------------------------------
  console.log("\n--- 5. Query Parameter Filtering ---");
  // Fetch a sprint and a team for testing
  const sampleTeam = await prisma.team.findFirst();
  const sampleSprint = await prisma.sprint.findFirst();

  if (sampleTeam) {
    const teamReq = await createMockRequest(`/api/v1/tasks?teamId=${sampleTeam.id}&pageSize=20`, { user: adminUser });
    const teamRes = await getTasksRoute(teamReq);
    assert(teamRes.status === 200, `Filtering by teamId (${sampleTeam.id}) returns HTTP 200`);
    const teamData = await teamRes.json();
    assert(
      teamData.data.every((t: any) => t.teamId === sampleTeam.id),
      `All returned tasks have teamId matching ${sampleTeam.id}`
    );
  }

  if (sampleSprint) {
    const sprintReq = await createMockRequest(`/api/v1/tasks?sprintId=${sampleSprint.id}&pageSize=20`, { user: adminUser });
    const sprintRes = await getTasksRoute(sprintReq);
    assert(sprintRes.status === 200, `Filtering by sprintId (${sampleSprint.id}) returns HTTP 200`);
    const sprintData = await sprintRes.json();
    assert(
      sprintData.data.every((t: any) => t.sprintId === sampleSprint.id),
      `All returned tasks have sprintId matching ${sampleSprint.id}`
    );
  }

  // -------------------------------------------------------------------------
  // 6. Invalid Query Parameter Rejection (HTTP 400)
  // -------------------------------------------------------------------------
  console.log("\n--- 6. Invalid Query Parameter Rejection (HTTP 400) ---");
  const invalidPageReq = await createMockRequest("/api/v1/tasks?page=0", { user: adminUser });
  const invalidPageRes = await getTasksRoute(invalidPageReq);
  assert(invalidPageRes.status === 400, "page=0 rejected with HTTP 400");

  const invalidPageSizeReq = await createMockRequest("/api/v1/tasks?pageSize=999", { user: adminUser });
  const invalidPageSizeRes = await getTasksRoute(invalidPageSizeReq);
  assert(invalidPageSizeRes.status === 400, "pageSize=999 rejected with HTTP 400");

  const nonNumericPageReq = await createMockRequest("/api/v1/tasks?page=abc", { user: adminUser });
  const nonNumericPageRes = await getTasksRoute(nonNumericPageReq);
  assert(nonNumericPageRes.status === 400, "page=abc rejected with HTTP 400");

  // -------------------------------------------------------------------------
  // 7. GET /api/v1/tasks/filters Response Structure
  // -------------------------------------------------------------------------
  console.log("\n--- 7. Tasks Filter Options Structure ---");
  const filtersReq = await createMockRequest("/api/v1/tasks/filters", { user: adminUser });
  const filtersRes = await getTasksFiltersRoute(filtersReq);
  assert(filtersRes.status === 200, "GET /api/v1/tasks/filters returns HTTP 200 for authenticated user");
  const filtersData = await filtersRes.json();
  assert(filtersData.success === true, "Filter response includes success: true");
  assert(Array.isArray(filtersData.departments), "Filter response includes departments array");
  assert(Array.isArray(filtersData.teams), "Filter response includes teams array");
  assert(Array.isArray(filtersData.sprints), "Filter response includes sprints array");
  assert(filtersData.departments.length > 0, `Departments returned: ${filtersData.departments.length}`);
  assert(filtersData.teams.length > 0, `Teams returned: ${filtersData.teams.length}`);
  assert(filtersData.sprints.length > 0, `Sprints returned: ${filtersData.sprints.length}`);

  // -------------------------------------------------------------------------
  // 8. Database File Size Invariant Verification
  // -------------------------------------------------------------------------
  console.log("\n--- 8. Database File Size Invariant Verification ---");
  const dbPath = path.join(process.cwd(), "prisma", "dev.db");
  const stat = fs.statSync(dbPath);
  const EXPECTED_BYTES = 3637248;
  assert(
    stat.size === EXPECTED_BYTES,
    `prisma/dev.db size is exactly ${EXPECTED_BYTES} bytes (Got: ${stat.size})`
  );

  console.log("\n==================================================================");
  console.log(`  VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTasksVerification()
  .catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
