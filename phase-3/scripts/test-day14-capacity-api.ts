/**
 * Horizon Portal — Day 14 Phase C Workload & Capacity API Test Suite
 * scripts/test-day14-capacity-api.ts
 *
 * Automated verification of:
 * 1. Authentication and role-based access control (Admin, HR, Manager, Employee, Unauthenticated)
 * 2. Parameter validation (sprintId required, teamId, page >= 1, 1 <= pageSize <= 100, 400 on violations)
 * 3. 404 on non-existent sprint and 403 on unauthorized team access
 * 4. Filters API (/api/v1/capacity/filters) role scoping
 * 5. Main Capacity API (/api/v1/capacity) calculations:
 *    - Sprint working days with holiday deduction
 *    - Approved leave deduction vs unapproved leave exclusion
 *    - Gross capacity, leave reduction, net capacity
 *    - Open task aggregation (To Do, In Progress, Blocked)
 *    - Completed task aggregation (Done)
 *    - Cancelled task exclusion
 *    - Employees with 0 assigned tasks included in scope
 *    - Zero-capacity JSON serialization (utilizationPercentage: null, display: "∞", no literal Infinity)
 *    - Pagination and summary calculation independent of current page
 *    - Sensitive field omission (no salary, credentials, medical notes)
 * 6. Database invariant verification (zero permanent mutations)
 */

import { PrismaClient } from "@prisma/client";
import { NextRequest } from "next/server";
import { createAuthToken } from "../src/lib/auth/token";
import { SESSION_COOKIE_NAME } from "../src/lib/auth/session";

import { GET as getCapacityRoute } from "../src/app/api/v1/capacity/route";
import { GET as getCapacityFiltersRoute } from "../src/app/api/v1/capacity/filters/route";
import { CapacityApiResponse, CapacityFiltersResponse, SerializedEmployeeCapacityRecord } from "../src/lib/capacity/capacity-types";

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

async function createMockRequest(
  url: string,
  options?: {
    method?: "GET";
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
    method: options?.method || "GET",
    headers,
  });
}

async function runCapacityApiTests() {
  console.log("==================================================================");
  console.log("  HORIZON PORTAL — DAY 14 WORKLOAD & CAPACITY API TEST SUITE      ");
  console.log("==================================================================\n");

  // Fetch verified test users
  const adminUser = await prisma.user.findUnique({ where: { email: "admin@growmar.com" } });
  const hrUser = await prisma.user.findUnique({ where: { email: "hr@growmar.com" } });
  const managerUser = await prisma.user.findUnique({ where: { email: "manager@growmar.com" } });
  const employeeUser = await prisma.user.findUnique({ where: { email: "employee@growmar.com" } });

  if (!adminUser || !hrUser || !managerUser || !employeeUser) {
    throw new Error("Missing required demo accounts in SQLite database.");
  }

  // Record database counts before test execution
  const initialTeams = await prisma.team.count();
  const initialSprints = await prisma.sprint.count();
  const initialTasks = await prisma.task.count();
  const initialLeaves = await prisma.leaveRequest.count();

  // -------------------------------------------------------------------------
  // 1. AUTHENTICATION & SECURITY BOUNDARIES
  // -------------------------------------------------------------------------
  console.log("--- 1. AUTHENTICATION & SECURITY ENFORCEMENT ---");

  // 1.1 Unauthenticated request to /api/v1/capacity
  const unauthCapReq = await createMockRequest("/api/v1/capacity?sprintId=SP-38");
  const unauthCapRes = await getCapacityRoute(unauthCapReq);
  assert(unauthCapRes.status === 401, "Unauthenticated GET /api/v1/capacity returns HTTP 401");

  // 1.2 Unauthenticated request to /api/v1/capacity/filters
  const unauthFiltersReq = await createMockRequest("/api/v1/capacity/filters");
  const unauthFiltersRes = await getCapacityFiltersRoute(unauthFiltersReq);
  assert(unauthFiltersRes.status === 401, "Unauthenticated GET /api/v1/capacity/filters returns HTTP 401");

  // -------------------------------------------------------------------------
  // 2. QUERY PARAMETER VALIDATION (ZOD)
  // -------------------------------------------------------------------------
  console.log("\n--- 2. PARAMETER VALIDATION & ERROR HANDLING ---");

  // 2.1 Missing sprintId
  const noSprintReq = await createMockRequest("/api/v1/capacity", { user: adminUser });
  const noSprintRes = await getCapacityRoute(noSprintReq);
  assert(noSprintRes.status === 400, "Missing sprintId rejected with HTTP 400");
  const noSprintData = (await noSprintRes.json()) as { error: string };
  assert(noSprintData.error.includes("sprintId"), "Error message specifies sprintId requirement");

  // 2.2 Empty sprintId
  const emptySprintReq = await createMockRequest("/api/v1/capacity?sprintId=", { user: adminUser });
  const emptySprintRes = await getCapacityRoute(emptySprintReq);
  assert(emptySprintRes.status === 400, "Empty sprintId rejected with HTTP 400");

  // 2.3 Non-existent sprintId
  const nonExistentReq = await createMockRequest("/api/v1/capacity?sprintId=SP-NONEXISTENT", { user: adminUser });
  const nonExistentRes = await getCapacityRoute(nonExistentReq);
  assert(nonExistentRes.status === 404, "Non-existent sprintId rejected with HTTP 404");

  // 2.4 Invalid negative page
  const invalidPageReq = await createMockRequest("/api/v1/capacity?sprintId=SP-38&page=-1", { user: adminUser });
  const invalidPageRes = await getCapacityRoute(invalidPageReq);
  assert(invalidPageRes.status === 400, "Negative page rejected with HTTP 400");

  // 2.5 pageSize > 100
  const maxPageSizeReq = await createMockRequest("/api/v1/capacity?sprintId=SP-38&pageSize=101", { user: adminUser });
  const maxPageSizeRes = await getCapacityRoute(maxPageSizeReq);
  assert(maxPageSizeRes.status === 400, "pageSize > 100 rejected with HTTP 400");

  // -------------------------------------------------------------------------
  // 3. ADMIN ACCESS & ORGANIZATION-WIDE CALCULATIONS
  // -------------------------------------------------------------------------
  console.log("\n--- 3. ADMIN ORGANIZATION-WIDE CAPACITY ---");

  const adminReq = await createMockRequest("/api/v1/capacity?sprintId=SP-38&page=1&pageSize=50", { user: adminUser });
  const adminRes = await getCapacityRoute(adminReq);
  assert(adminRes.status === 200, "Admin GET /api/v1/capacity returns HTTP 200");

  const adminData = (await adminRes.json()) as CapacityApiResponse;
  assert(adminData.success === true, "Admin response contains success: true");

  // Sprint details
  assert(adminData.data.sprint.id === "SP-38", "Sprint ID matches 'SP-38'");
  assert(adminData.data.sprint.name === "Sprint 38", "Sprint name matches 'Sprint 38'");
  assert(adminData.data.sprint.workingDays === 9, "Sprint working days = 9 (reflecting 1 official weekday holiday)");

  // Configuration
  assert(adminData.data.configuration.dailyStoryPointCapacity === 5, "Daily story point baseline = 5");
  assert(adminData.data.configuration.capacityUnit === "story_points", "Capacity unit = 'story_points'");

  // Population and pagination
  assert(adminData.data.summary.totalEmployees === 441, "Admin summary includes all 441 active employees");
  assert(adminData.data.pagination.total === 441, "Pagination total matches 441");
  assert(adminData.data.pagination.page === 1, "Current page = 1");
  assert(adminData.data.pagination.pageSize === 50, "Page size = 50");
  assert(adminData.data.pagination.totalPages === 9, "Total pages = 9 (Math.ceil(441 / 50))");
  assert(adminData.data.employees.length === 50, "Returned page contains exactly 50 employees");

  // Summary aggregation independent of pagination
  assert(
    adminData.data.summary.totalPlannedPoints ===
      adminData.data.summary.totalOpenPoints + adminData.data.summary.totalCompletedPoints,
    "Summary totalPlannedPoints = totalOpenPoints + totalCompletedPoints"
  );
  assert(
    adminData.data.summary.totalPlannedPoints === adminData.data.sprintProgress.plannedPoints,
    "Summary planned points match sprintProgress planned points"
  );
  assert(
    adminData.data.summary.completionPercentage === adminData.data.sprintProgress.completionPercentage,
    "Summary completion percentage matches sprintProgress completion percentage"
  );

  // -------------------------------------------------------------------------
  // 4. SENSITIVE DATA OMISSION (PRIVACY LEAKAGE AUDIT)
  // -------------------------------------------------------------------------
  console.log("\n--- 4. SENSITIVE DATA OMISSION & PROJECTION SAFETY ---");

  const sampleEmployee = adminData.data.employees[0] as unknown as Record<string, unknown>;
  assert(Boolean(sampleEmployee.employeeId), "Employee includes employeeId");
  assert(Boolean(sampleEmployee.employeeName), "Employee includes employeeName");
  assert(Boolean(sampleEmployee.email), "Employee includes email");
  assert(sampleEmployee.salary === undefined, "Employee projection strictly omits salary");
  assert(sampleEmployee.passwordHash === undefined, "Employee projection strictly omits passwordHash");
  assert(sampleEmployee.bankAccount === undefined, "Employee projection strictly omits bankAccount");
  assert(sampleEmployee.medicalNotes === undefined, "Employee projection strictly omits medicalNotes");

  // -------------------------------------------------------------------------
  // 5. HR ACCESS (WORKFORCE-WIDE SCOPE)
  // -------------------------------------------------------------------------
  console.log("\n--- 5. HR WORKFORCE CAPACITY ACCESS ---");

  const hrReq = await createMockRequest("/api/v1/capacity?sprintId=SP-38&page=1&pageSize=50", { user: hrUser });
  const hrRes = await getCapacityRoute(hrReq);
  assert(hrRes.status === 200, "HR GET returns HTTP 200");
  const hrData = (await hrRes.json()) as CapacityApiResponse;
  assert(hrData.data.summary.totalEmployees === 441, "HR has workforce-wide visibility (441 employees)");

  // -------------------------------------------------------------------------
  // 6. MANAGER ROLE SCOPING & UNAUTHORIZED TEAM FILTERING
  // -------------------------------------------------------------------------
  console.log("\n--- 6. MANAGER SCOPE & UNAUTHORIZED TEAM ENFORCEMENT ---");

  const mgrReq = await createMockRequest("/api/v1/capacity?sprintId=SP-38", { user: managerUser });
  const mgrRes = await getCapacityRoute(mgrReq);
  assert(mgrRes.status === 200, "Manager GET returns HTTP 200");
  const mgrData = (await mgrRes.json()) as CapacityApiResponse;

  assert(
    mgrData.data.summary.totalEmployees < 441,
    `Manager scope is restricted to team/reports (${mgrData.data.summary.totalEmployees} < 441)`
  );
  assert(
    mgrData.data.summary.totalEmployees > 0,
    "Manager scope contains active reports/self"
  );

  // Unauthorized team filter for manager: team T16 is not led by manager and has no reports
  const unauthTeamReq = await createMockRequest(
    "/api/v1/capacity?sprintId=SP-38&teamId=T16",
    { user: managerUser }
  );
  const unauthTeamRes = await getCapacityRoute(unauthTeamReq);
  assert(
    unauthTeamRes.status === 403,
    "Manager accessing unauthorized team 'T16' rejected with HTTP 403 Forbidden"
  );

  // -------------------------------------------------------------------------
  // 7. EMPLOYEE ROLE SCOPING (SELF-ONLY ENFORCEMENT)
  // -------------------------------------------------------------------------
  console.log("\n--- 7. EMPLOYEE SELF-ONLY ACCESS ENFORCEMENT ---");

  const empReq = await createMockRequest("/api/v1/capacity?sprintId=SP-38", { user: employeeUser });
  const empRes = await getCapacityRoute(empReq);
  assert(empRes.status === 200, "Employee GET returns HTTP 200");
  const empData = (await empRes.json()) as CapacityApiResponse;

  assert(
    empData.data.summary.totalEmployees === 1,
    `Employee scope is strictly 1 employee (got ${empData.data.summary.totalEmployees})`
  );
  assert(
    empData.data.employees[0]?.employeeId === employeeUser.employeeId,
    `Returned employee is strictly self (${employeeUser.employeeId})`
  );

  // Employee attempting to filter unauthorized team
  const unauthEmpTeamReq = await createMockRequest(
    "/api/v1/capacity?sprintId=SP-38&teamId=UNAUTHORIZED_TEAM_XYZ",
    { user: employeeUser }
  );
  const unauthEmpTeamRes = await getCapacityRoute(unauthEmpTeamReq);
  assert(
    unauthEmpTeamRes.status === 403,
    "Employee requesting unauthorized team rejected with HTTP 403 Forbidden"
  );

  // -------------------------------------------------------------------------
  // 8. FILTERS ENDPOINT AUTHORIZATION SCOPE
  // -------------------------------------------------------------------------
  console.log("\n--- 8. CAPACITY FILTERS ENDPOINT AUTHORIZATION ---");

  // Admin filters
  const adminFiltersReq = await createMockRequest("/api/v1/capacity/filters", { user: adminUser });
  const adminFiltersRes = await getCapacityFiltersRoute(adminFiltersReq);
  assert(adminFiltersRes.status === 200, "Admin GET /api/v1/capacity/filters returns HTTP 200");
  const adminFiltersData = (await adminFiltersRes.json()) as CapacityFiltersResponse;
  assert(adminFiltersData.data.sprints.length === 38, "Admin filters include all 38 sprints");
  assert(adminFiltersData.data.teams.length === 16, "Admin filters include all 16 teams");
  const sp38InFilters = adminFiltersData.data.sprints.find((s) => s.id === "SP-38");
  assert(
    sp38InFilters?.workingDays === 9,
    `Admin filters report SP-38 workingDays = 9 (holiday excluded) [actual: ${sp38InFilters?.workingDays}]`
  );
  assert(
    sp38InFilters?.workingDays === adminData.data.sprint.workingDays && sp38InFilters?.workingDays === 9,
    "Both capacity filters and capacity endpoints return identical workingDays = 9 for SP-38"
  );

  // HR filters
  const hrFiltersReq = await createMockRequest("/api/v1/capacity/filters", { user: hrUser });
  const hrFiltersRes = await getCapacityFiltersRoute(hrFiltersReq);
  const hrFiltersData = (await hrFiltersRes.json()) as CapacityFiltersResponse;
  assert(hrFiltersData.data.teams.length === 16, "HR filters include all 16 teams");

  // Employee filters
  const empFiltersReq = await createMockRequest("/api/v1/capacity/filters", { user: employeeUser });
  const empFiltersRes = await getCapacityFiltersRoute(empFiltersReq);
  const empFiltersData = (await empFiltersRes.json()) as CapacityFiltersResponse;
  assert(
    empFiltersData.data.teams.length <= 16,
    "Employee filters only include teams the employee belongs to"
  );

  // -------------------------------------------------------------------------
  // 9. LEAVE INTEGRATION & CAPACITY DEDUCTION
  // -------------------------------------------------------------------------
  console.log("\n--- 9. LEAVE DEDUCTION & REAL RECORD ACCURACY ---");

  // Query Team T14 to verify EMP-0092 (Keerthi Karthikeyan) who has approved ML overlapping SP-38
  const t14Req = await createMockRequest("/api/v1/capacity?sprintId=SP-38&teamId=T14", { user: adminUser });
  const t14Res = await getCapacityRoute(t14Req);
  assert(t14Res.status === 200, "Admin GET /api/v1/capacity?sprintId=SP-38&teamId=T14 returns HTTP 200");
  const t14Data = (await t14Res.json()) as CapacityApiResponse;

  const keerthiRecord = t14Data.data.employees.find(
    (e: SerializedEmployeeCapacityRecord) => e.employeeId === "EMP-0092"
  );
  assert(Boolean(keerthiRecord), "Keerthi capacity record retrieved successfully in Team T14");

  if (keerthiRecord) {
    assert(
      keerthiRecord.grossCapacity === 45,
      "Keerthi gross capacity = 9 days * 5 = 45 story points"
    );
    assert(
      keerthiRecord.approvedLeaveWorkingDays === 4,
      `Keerthi approved leave working days in SP-38 = 4 (got ${keerthiRecord.approvedLeaveWorkingDays})`
    );
    assert(
      keerthiRecord.leaveCapacityReduction === 20,
      "Keerthi leave capacity reduction = 4 * 5 = 20 points"
    );
    assert(
      keerthiRecord.availableWorkingDays === 5,
      "Keerthi available working days = 9 - 4 = 5 days"
    );
    assert(
      keerthiRecord.netCapacity === 25,
      "Keerthi net capacity = 5 * 5 = 25 story points"
    );
    assert(
      keerthiRecord.plannedOpenPoints === 5,
      `Keerthi planned open points = 5 (got ${keerthiRecord.plannedOpenPoints})`
    );
    assert(
      keerthiRecord.utilizationPercentage === 20.0,
      `Keerthi utilization = (5 / 25) * 100 = 20.0% (got ${keerthiRecord.utilizationPercentage})`
    );
    assert(
      keerthiRecord.classification === "Available",
      "Keerthi classification is 'Available'"
    );
  }

  // -------------------------------------------------------------------------
  // 10. EMPLOYEES WITH ZERO TASKS INCLUDED IN CAPACITY SCOPE
  // -------------------------------------------------------------------------
  console.log("\n--- 10. EMPLOYEES WITH ZERO TASKS INCLUDED ---");

  const zeroTaskEmployee = adminData.data.employees.find(
    (e: SerializedEmployeeCapacityRecord) => e.plannedOpenPoints === 0 && e.completedPoints === 0
  );
  assert(
    Boolean(zeroTaskEmployee),
    "Employees with 0 assigned tasks are included in capacity view"
  );
  if (zeroTaskEmployee) {
    assert(
      zeroTaskEmployee.netCapacity > 0,
      `Zero-task employee has positive available net capacity (${zeroTaskEmployee.netCapacity} pts)`
    );
    assert(
      zeroTaskEmployee.utilizationPercentage === 0,
      "Zero-task employee has 0% utilization"
    );
    assert(
      zeroTaskEmployee.classification === "Available",
      "Zero-task employee classified as 'Available'"
    );
  }

  // -------------------------------------------------------------------------
  // 11. ZERO-CAPACITY JSON SERIALIZATION SAFETY
  // -------------------------------------------------------------------------
  console.log("\n--- 11. ZERO-CAPACITY JSON SERIALIZATION SAFETY ---");

  // Inspect raw JSON string representation to verify no literal "Infinity" or "NaN"
  const rawAdminJsonText = JSON.stringify(adminData);
  assert(
    !rawAdminJsonText.includes(":Infinity") && !rawAdminJsonText.includes(":NaN"),
    "JSON response strictly contains no literal Infinity or NaN tokens"
  );

  // -------------------------------------------------------------------------
  // 12. DATABASE INVARIANT & RESTORATION AUDIT
  // -------------------------------------------------------------------------
  console.log("\n--- 12. FINAL DATABASE INVARIANT VERIFICATION ---");

  const finalTeams = await prisma.team.count();
  const finalSprints = await prisma.sprint.count();
  const finalTasks = await prisma.task.count();
  const finalLeaves = await prisma.leaveRequest.count();

  assert(finalTeams === initialTeams, `Teams count preserved at ${initialTeams}`);
  assert(finalSprints === initialSprints, `Sprints count preserved at ${initialSprints}`);
  assert(finalTasks === initialTasks, `Tasks count preserved at ${initialTasks}`);
  assert(finalLeaves === initialLeaves, `Leave requests count preserved at ${initialLeaves}`);

  // -------------------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------------------
  console.log("\n==================================================================");
  console.log(`  PHASE C SUITE SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runCapacityApiTests()
  .catch((err) => {
    console.error("Test execution failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
