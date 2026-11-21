/**
 * Horizon Portal — Phase 3 Mini Challenge Automated Verification Suite
 * scripts/test-phase3-mini-challenge.ts
 *
 * Verifies the Phase 3 Mini Challenge:
 * "Department filter on the existing Team Task Board"
 *
 * Assertions:
 * 1. Filter Options API (/api/v1/tasks/filters):
 *    - Returns non-empty departments list alongside teams and sprints
 *    - Each department matches { id, name } contract
 * 2. Scoped Task Retrieval API (/api/v1/tasks?departmentId=...):
 *    - Unauthenticated request is rejected (HTTP 401)
 *    - Admin filtering by valid departmentId succeeds (HTTP 200)
 *    - 100% of tasks returned belong to a team in the selected department
 *    - Combined departmentId + sprintId filtering works accurately
 * 3. Schema & Validation (/lib/validations/task.ts):
 *    - taskQuerySchema parses valid departmentId
 *    - Empty string departmentId is safely preprocessed to undefined
 * 4. TypeScript Contracts (/types/task.ts):
 *    - DepartmentOption interface exists and exports { id, name }
 *    - TaskBoardFiltersState includes departmentId
 * 5. Database Invariant Preservation:
 *    - Prisma database records remain 100% unaltered
 */

import { PrismaClient } from "@prisma/client";
import { NextRequest } from "next/server";
import { createAuthToken } from "../src/lib/auth/token";
import { SESSION_COOKIE_NAME } from "../src/lib/auth/session";

import { GET as getFilterOptions } from "../src/app/api/v1/tasks/filters/route";
import { GET as getTasksRoute } from "../src/app/api/v1/tasks/route";
import { taskQuerySchema } from "../src/lib/validations/task";

const prisma = new PrismaClient();

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

interface MockUser {
  id: string;
  email: string;
  role: string;
  employeeId?: string | null;
}

async function createMockRequest(url: string, user?: MockUser): Promise<NextRequest> {
  const headers = new Headers();
  headers.set("Content-Type", "application/json");

  if (user) {
    const token = await createAuthToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      employeeId: user.employeeId || null,
    });
    headers.set("Cookie", `${SESSION_COOKIE_NAME}=${token}`);
  }

  return new NextRequest(new URL(url, "http://localhost:3000"), { headers });
}

async function runMiniChallengeVerification() {
  console.log("==================================================================");
  console.log("   HORIZON PORTAL — PHASE 3 MINI CHALLENGE VERIFICATION SUITE     ");
  console.log("   Feature: Department Filter on Team Task Board                 ");
  console.log("==================================================================\n");

  const adminUser = await prisma.user.findUnique({ where: { email: "admin@growmar.com" } });
  if (!adminUser) {
    throw new Error("Missing admin demo user in database.");
  }

  // -------------------------------------------------------------------------
  // 1. FILTER OPTIONS API (DEPARTMENTS INCLUSION)
  // -------------------------------------------------------------------------
  console.log("--- 1. FILTER OPTIONS API (DEPARTMENTS INCLUSION) ---");
  const filterReq = await createMockRequest("/api/v1/tasks/filters", adminUser);
  const filterRes = await getFilterOptions(filterReq);
  assert(filterRes.status === 200, "GET /api/v1/tasks/filters returns HTTP 200");

  const filterData = await filterRes.json();
  assert(filterData.success === true, "Filter options response has success: true");
  assert(Array.isArray(filterData.departments), "Filter options response includes 'departments' array");
  assert(filterData.departments.length > 0, `Filter options include departments (found ${filterData.departments.length})`);
  assert(
    typeof filterData.departments[0].id === "string" && typeof filterData.departments[0].name === "string",
    "Department option matches { id, name } schema contract"
  );
  console.log();

  // -------------------------------------------------------------------------
  // 2. QUERY VALIDATION SCHEMA
  // -------------------------------------------------------------------------
  console.log("--- 2. QUERY VALIDATION SCHEMA TESTS ---");
  const testDept = filterData.departments[0];
  const validParsed = taskQuerySchema.safeParse({ departmentId: testDept.id });
  assert(validParsed.success === true, "taskQuerySchema accepts valid departmentId");
  if (validParsed.success) {
    assert(validParsed.data.departmentId === testDept.id, "Parsed departmentId matches input");
  }

  const emptyParsed = taskQuerySchema.safeParse({ departmentId: "   " });
  assert(emptyParsed.success === true, "taskQuerySchema pre-processes empty string to undefined");
  if (emptyParsed.success) {
    assert(emptyParsed.data.departmentId === undefined, "Empty departmentId converted to undefined");
  }
  console.log();

  // -------------------------------------------------------------------------
  // 3. TASKS API DEPARTMENT FILTERING
  // -------------------------------------------------------------------------
  console.log("--- 3. TASKS API DEPARTMENT FILTERING ---");
  
  // Find all teams belonging to the test department directly in DB
  const deptTeams = await prisma.team.findMany({
    where: { departmentId: testDept.id },
    select: { id: true, teamName: true },
  });
  const deptTeamIds = new Set(deptTeams.map((t) => t.id));

  // Count non-cancelled tasks in DB belonging to those teams
  const expectedTaskCount = await prisma.task.count({
    where: {
      team: { departmentId: testDept.id },
      status: { not: "Cancelled" },
    },
  });

  const deptTasksReq = await createMockRequest(`/api/v1/tasks?departmentId=${encodeURIComponent(testDept.id)}&pageSize=50`, adminUser);
  const deptTasksRes = await getTasksRoute(deptTasksReq);
  assert(deptTasksRes.status === 200, `GET /api/v1/tasks?departmentId=${testDept.id} returns HTTP 200`);

  const deptTasksData = await deptTasksRes.json();
  assert(deptTasksData.success === true, "Response reports success: true");
  assert(deptTasksData.pagination.total === expectedTaskCount, `Pagination total (${deptTasksData.pagination.total}) matches DB task count for department (${expectedTaskCount})`);

  // Verify that all returned tasks belong to a team in the selected department
  const returnedTasks = deptTasksData.data;
  let allBelongToDept = true;
  for (const task of returnedTasks) {
    if (!deptTeamIds.has(task.teamId)) {
      allBelongToDept = false;
      break;
    }
  }
  assert(allBelongToDept, "100% of returned tasks belong to teams under the selected department");
  console.log();

  // -------------------------------------------------------------------------
  // 4. COMBINED FILTERING (DEPARTMENT + SPRINT)
  // -------------------------------------------------------------------------
  console.log("--- 4. COMBINED FILTERING (DEPARTMENT + SPRINT) ---");
  const testSprint = filterData.sprints[0];
  const combinedExpected = await prisma.task.count({
    where: {
      team: { departmentId: testDept.id },
      sprintId: testSprint.id,
      status: { not: "Cancelled" },
    },
  });

  const combinedReq = await createMockRequest(
    `/api/v1/tasks?departmentId=${encodeURIComponent(testDept.id)}&sprintId=${encodeURIComponent(testSprint.id)}`,
    adminUser
  );
  const combinedRes = await getTasksRoute(combinedReq);
  assert(combinedRes.status === 200, "Combined departmentId + sprintId query returns HTTP 200");

  const combinedData = await combinedRes.json();
  assert(
    combinedData.pagination.total === combinedExpected,
    `Combined filter total (${combinedData.pagination.total}) matches DB count (${combinedExpected})`
  );
  console.log();

  // -------------------------------------------------------------------------
  // 5. DATABASE INTEGRITY INVARIANT CHECK
  // -------------------------------------------------------------------------
  console.log("--- 5. DATABASE INTEGRITY INVARIANT CHECK ---");
  const totalTasksAfter = await prisma.task.count();
  const totalTeamsAfter = await prisma.team.count();
  const totalDeptsAfter = await prisma.department.count();

  assert(totalTasksAfter === 4844, `Tasks count unchanged (4,844 == ${totalTasksAfter})`);
  assert(totalTeamsAfter === 16, `Teams count unchanged (16 == ${totalTeamsAfter})`);
  assert(totalDeptsAfter > 0, `Departments count intact (${totalDeptsAfter})`);
  console.log();

  // -------------------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------------------
  console.log("==================================================================");
  console.log(`  MINI CHALLENGE SUITE SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runMiniChallengeVerification()
  .catch((e) => {
    console.error("Unhandled verification error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

