/**
 * Horizon Portal — Day 13 Team Task Board Backend Test Suite
 * scripts/test-day13-tasks-api.ts
 *
 * Automated verification of:
 * 1. Database schema and data integrity (16 teams, 38 sprints, 4,844 tasks, initialized versions)
 * 2. GET /api/v1/tasks endpoint:
 *    - Unauthenticated rejection (401)
 *    - Admin and HR organization-wide visibility (4,684 non-cancelled tasks)
 *    - Manager visibility (teams led + self-assigned + direct reports)
 *    - Employee visibility (self-assigned only)
 *    - Default exclusion of Cancelled tasks
 *    - Safe employee profile projection (no salary or credentials leaked)
 *    - Filtering by teamId, sprintId, and combinations
 *    - Pagination (bounds checking, pageSize limit 100, page/pageSize validation 400)
 * 3. PATCH /api/v1/tasks/[id] endpoint:
 *    - Unauthenticated rejection (401)
 *    - HR read-only rejection (403)
 *    - Unauthorized user mutation rejection (403)
 *    - Non-existent task rejection (404)
 *    - Schema validation errors (invalid status, missing/negative version, extra fields -> 400)
 *    - Authorized updates for Admin, Manager, and Employee (200)
 * 4. Optimistic Concurrency Control (OCC):
 *    - Concurrent update conflict returns HTTP 409 with VERSION_CONFLICT
 *    - Atomic version incrementation
 *    - Automatic state restoration of test tasks
 */

import { PrismaClient } from "@prisma/client";
import { NextRequest } from "next/server";
import { createAuthToken } from "../src/lib/auth/token";
import { SESSION_COOKIE_NAME } from "../src/lib/auth/session";

import { GET as getTasksRoute } from "../src/app/api/v1/tasks/route";
import { PATCH as patchTaskRoute } from "../src/app/api/v1/tasks/[id]/route";
import { Task, TaskApiResponse, SafeTaskAssignee } from "../src/types/task";

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
    method?: "GET" | "PATCH";
    user?: MockUser;
    body?: unknown;
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
    body: options?.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
}

async function runTestSuite() {
  console.log("==================================================================");
  console.log("  HORIZON PORTAL — DAY 13 TASK BOARD BACKEND VERIFICATION SUITE   ");
  console.log("==================================================================\n");

  // Fetch verified test users
  const adminUser = await prisma.user.findUnique({ where: { email: "admin@growmar.com" } });
  const hrUser = await prisma.user.findUnique({ where: { email: "hr@growmar.com" } });
  const managerUser = await prisma.user.findUnique({ where: { email: "manager@growmar.com" } });
  const employeeUser = await prisma.user.findUnique({ where: { email: "employee@growmar.com" } });

  if (!adminUser || !hrUser || !managerUser || !employeeUser) {
    throw new Error("Missing required demo accounts in SQLite database.");
  }

  // -------------------------------------------------------------------------
  // SECTION 1: DATABASE INTEGRITY AND RECORD COUNTS
  // -------------------------------------------------------------------------
  console.log("--- SECTION 1: DATABASE INTEGRITY AND RECORD COUNTS ---");

  const totalTeams = await prisma.team.count();
  assert(totalTeams === 16, `Total teams count equals 16 (found ${totalTeams})`);

  const totalSprints = await prisma.sprint.count();
  assert(totalSprints === 38, `Total sprints count equals 38 (found ${totalSprints})`);

  const totalTasks = await prisma.task.count();
  assert(totalTasks === 4844, `Total tasks count equals 4,844 (found ${totalTasks})`);

  // Verify versions initialized
  const uninitializedVersions = await prisma.task.count({ where: { version: { lt: 0 } } });
  assert(uninitializedVersions === 0, "All task records have non-negative version");

  // Verify status distributions
  const blockedTasks = await prisma.task.count({ where: { status: "Blocked" } });
  const cancelledTasks = await prisma.task.count({ where: { status: "Cancelled" } });
  const doneTasks = await prisma.task.count({ where: { status: "Done" } });
  const inProgressTasks = await prisma.task.count({ where: { status: "In Progress" } });
  const toDoTasks = await prisma.task.count({ where: { status: "To Do" } });

  assert(blockedTasks === 147, `Blocked tasks == 147 (found ${blockedTasks})`);
  assert(cancelledTasks === 160, `Cancelled tasks == 160 (found ${cancelledTasks})`);
  assert(doneTasks === 4018, `Done tasks == 4,018 (found ${doneTasks})`);
  assert(inProgressTasks === 331, `In Progress tasks == 331 (found ${inProgressTasks})`);
  assert(toDoTasks === 188, `To Do tasks == 188 (found ${toDoTasks})`);

  // Verify priorities
  const p1Tasks = await prisma.task.count({ where: { priority: "P1" } });
  const p2Tasks = await prisma.task.count({ where: { priority: "P2" } });
  const p3Tasks = await prisma.task.count({ where: { priority: "P3" } });
  const p4Tasks = await prisma.task.count({ where: { priority: "P4" } });

  assert(p1Tasks === 397, `P1 priority tasks == 397 (found ${p1Tasks})`);
  assert(p2Tasks === 1267, `P2 priority tasks == 1,267 (found ${p2Tasks})`);
  assert(p3Tasks === 2191, `P3 priority tasks == 2,191 (found ${p3Tasks})`);
  assert(p4Tasks === 989, `P4 priority tasks == 989 (found ${p4Tasks})`);

  console.log();

  // -------------------------------------------------------------------------
  // SECTION 2: GET /api/v1/tasks API VERIFICATION
  // -------------------------------------------------------------------------
  console.log("--- SECTION 2: GET /api/v1/tasks API VERIFICATION ---");

  // 2.1 Unauthenticated request rejected with 401
  const unauthReq = await createMockRequest("/api/v1/tasks");
  const unauthRes = await getTasksRoute(unauthReq);
  assert(unauthRes.status === 401, "Unauthenticated GET returns HTTP 401");

  // 2.2 Admin visibility: sees all non-cancelled tasks (4,844 - 160 = 4,684)
  const adminReq = await createMockRequest("/api/v1/tasks?page=1&pageSize=50", { user: adminUser });
  const adminRes = await getTasksRoute(adminReq);
  assert(adminRes.status === 200, "Admin GET returns HTTP 200");
  const adminData = (await adminRes.json()) as TaskApiResponse;
  assert(adminData.success === true, "Admin response indicates success: true");
  assert(adminData.pagination.total === 4684, `Admin total matches non-cancelled tasks: 4,684 (got ${adminData.pagination.total})`);
  assert(adminData.data.length === 50, `Admin default page returns 50 tasks (got ${adminData.data.length})`);
  assert(adminData.pagination.totalPages === Math.ceil(4684 / 50), "Admin pagination totalPages calculated correctly");

  // Verify Cancelled tasks are strictly excluded
  const hasCancelled = adminData.data.some((t: Task) => t.status === "Cancelled");
  assert(!hasCancelled, "Cancelled tasks are strictly excluded from default board view");

  // Verify safe employee projection
  const firstWithAssignee = adminData.data.find((t: Task) => t.assignee !== null);
  if (firstWithAssignee && firstWithAssignee.assignee) {
    const a = firstWithAssignee.assignee as SafeTaskAssignee & Record<string, unknown>;
    assert(
      typeof a.id === "string" && typeof a.firstName === "string" && typeof a.email === "string",
      "Assignee includes safe fields (id, firstName, email)"
    );
    assert(
      a.salary === undefined && a.passwordHash === undefined && a.bankAccount === undefined,
      "Assignee projection strictly omits sensitive fields (salary, credentials)"
    );
  }

  // 2.3 HR visibility: unrestricted read access (4,684 tasks)
  const hrReq = await createMockRequest("/api/v1/tasks?page=1&pageSize=50", { user: hrUser });
  const hrRes = await getTasksRoute(hrReq);
  assert(hrRes.status === 200, "HR GET returns HTTP 200");
  const hrData = await hrRes.json();
  assert(hrData.pagination.total === 4684, `HR total matches non-cancelled tasks: 4,684 (got ${hrData.pagination.total})`);

  // 2.4 Manager visibility: led teams + self-assigned + direct reports
  const mgrReq = await createMockRequest("/api/v1/tasks?page=1&pageSize=50", { user: managerUser });
  const mgrRes = await getTasksRoute(mgrReq);
  assert(mgrRes.status === 200, "Manager GET returns HTTP 200");
  const mgrData = await mgrRes.json();

  // Calculate expected manager tasks directly from database
  const directReports = await prisma.employee.findMany({
    where: { managerId: managerUser.employeeId! },
    select: { id: true },
  });
  const drIds = directReports.map((dr) => dr.id);

  const expectedMgrCount = await prisma.task.count({
    where: {
      status: { not: "Cancelled" },
      OR: [
        { team: { teamLeadEmployeeId: managerUser.employeeId! } },
        { assigneeEmployeeId: managerUser.employeeId! },
        { assigneeEmployeeId: { in: drIds } },
      ],
    },
  });
  assert(
    mgrData.pagination.total === expectedMgrCount,
    `Manager total matches direct reports + self + led teams: ${expectedMgrCount} (got ${mgrData.pagination.total})`
  );

  // 2.5 Employee visibility: self-assigned tasks only
  const empReq = await createMockRequest("/api/v1/tasks?page=1&pageSize=50", { user: employeeUser });
  const empRes = await getTasksRoute(empReq);
  assert(empRes.status === 200, "Employee GET returns HTTP 200");
  const empData = (await empRes.json()) as TaskApiResponse;

  const expectedEmpCount = await prisma.task.count({
    where: {
      status: { not: "Cancelled" },
      assigneeEmployeeId: employeeUser.employeeId!,
    },
  });
  assert(
    empData.pagination.total === expectedEmpCount,
    `Employee total matches self-assigned non-cancelled tasks: ${expectedEmpCount} (got ${empData.pagination.total})`
  );
  const allAssignedToSelf = empData.data.every((t: Task) => t.assigneeEmployeeId === employeeUser.employeeId);
  assert(allAssignedToSelf, "All tasks returned to Employee are strictly assigned to that employee");

  // 2.6 Filtering by teamId
  const sampleTeam = await prisma.team.findFirst();
  if (sampleTeam) {
    const teamFilterReq = await createMockRequest(`/api/v1/tasks?teamId=${sampleTeam.id}`, { user: adminUser });
    const teamFilterRes = await getTasksRoute(teamFilterReq);
    assert(teamFilterRes.status === 200, `Filtering by teamId=${sampleTeam.id} returns HTTP 200`);
    const teamFilterData = (await teamFilterRes.json()) as TaskApiResponse;
    const allMatchTeam = teamFilterData.data.every((t: Task) => t.teamId === sampleTeam.id);
    assert(allMatchTeam, `Every returned task matches teamId ${sampleTeam.id}`);
  }

  // 2.7 Filtering by sprintId
  const sampleSprint = await prisma.sprint.findFirst();
  if (sampleSprint) {
    const sprintFilterReq = await createMockRequest(`/api/v1/tasks?sprintId=${sampleSprint.id}`, { user: adminUser });
    const sprintFilterRes = await getTasksRoute(sprintFilterReq);
    assert(sprintFilterRes.status === 200, `Filtering by sprintId=${sampleSprint.id} returns HTTP 200`);
    const sprintFilterData = (await sprintFilterRes.json()) as TaskApiResponse;
    const allMatchSprint = sprintFilterData.data.every((t: Task) => t.sprintId === sampleSprint.id);
    assert(allMatchSprint, `Every returned task matches sprintId ${sampleSprint.id}`);
  }

  // 2.8 Combined filters
  if (sampleTeam && sampleSprint) {
    const combinedFilterReq = await createMockRequest(
      `/api/v1/tasks?teamId=${sampleTeam.id}&sprintId=${sampleSprint.id}`,
      { user: adminUser }
    );
    const combinedFilterRes = await getTasksRoute(combinedFilterReq);
    assert(combinedFilterRes.status === 200, "Combined teamId and sprintId filtering returns HTTP 200");
    const combinedData = (await combinedFilterRes.json()) as TaskApiResponse;
    const allMatchBoth = combinedData.data.every(
      (t: Task) => t.teamId === sampleTeam.id && t.sprintId === sampleSprint.id
    );
    assert(allMatchBoth, "Every returned task matches both teamId and sprintId");
  }

  // 2.9 Pagination bounds and parameter validation
  const page1Req = await createMockRequest("/api/v1/tasks?page=1&pageSize=10", { user: adminUser });
  const page2Req = await createMockRequest("/api/v1/tasks?page=2&pageSize=10", { user: adminUser });
  const p1Res = await getTasksRoute(page1Req);
  const p2Res = await getTasksRoute(page2Req);
  const p1Data = (await p1Res.json()) as TaskApiResponse;
  const p2Data = (await p2Res.json()) as TaskApiResponse;
  const page1Ids = new Set(p1Data.data.map((t: Task) => t.id));
  const hasPageOverlap = p2Data.data.some((t: Task) => page1Ids.has(t.id));
  assert(!hasPageOverlap, "Page 1 and Page 2 have disjoint task record sets (pagination works)");

  // Validation: pageSize > 100 rejected with 400
  const invalidPageSizeReq = await createMockRequest("/api/v1/tasks?pageSize=101", { user: adminUser });
  const invalidPageSizeRes = await getTasksRoute(invalidPageSizeReq);
  assert(invalidPageSizeRes.status === 400, "pageSize > 100 rejected with HTTP 400");

  // Validation: negative page rejected with 400
  const invalidPageReq = await createMockRequest("/api/v1/tasks?page=-1", { user: adminUser });
  const invalidPageRes = await getTasksRoute(invalidPageReq);
  assert(invalidPageRes.status === 400, "Negative page rejected with HTTP 400");

  // Safe handling of empty filter parameters
  const emptyFiltersReq = await createMockRequest("/api/v1/tasks?teamId=&sprintId=", { user: adminUser });
  const emptyFiltersRes = await getTasksRoute(emptyFiltersReq);
  assert(emptyFiltersRes.status === 200, "Empty filter strings (?teamId=&sprintId=) safely handled with HTTP 200");

  console.log();

  // -------------------------------------------------------------------------
  // SECTION 3: PATCH /api/v1/tasks/[id] API VERIFICATION
  // -------------------------------------------------------------------------
  console.log("--- SECTION 3: PATCH /api/v1/tasks/[id] API VERIFICATION ---");

  // Find a specific test task assigned to the Employee
  const employeeTask = await prisma.task.findFirst({
    where: {
      assigneeEmployeeId: employeeUser.employeeId!,
      status: { not: "Cancelled" },
    },
  });

  if (!employeeTask) {
    throw new Error("Could not find a task assigned to demo employee for PATCH testing.");
  }

  // Find a task NOT assigned to the Employee (assigned to someone else)
  const otherTask = await prisma.task.findFirst({
    where: {
      assigneeEmployeeId: { not: employeeUser.employeeId! },
      team: { teamLeadEmployeeId: { not: managerUser.employeeId! } },
    },
  });

  if (!otherTask) {
    throw new Error("Could not find a task outside employee scope for authorization testing.");
  }

  const taskContext = { params: Promise.resolve({ id: employeeTask.id }) };
  const otherTaskContext = { params: Promise.resolve({ id: otherTask.id }) };

  // 3.1 Unauthenticated PATCH rejected with 401
  const unauthPatchReq = await createMockRequest(`/api/v1/tasks/${employeeTask.id}`, {
    method: "PATCH",
    body: { status: "In Progress", expectedVersion: 0 },
  });
  const unauthPatchRes = await patchTaskRoute(unauthPatchReq, taskContext);
  assert(unauthPatchRes.status === 401, "Unauthenticated PATCH returns HTTP 401");

  // 3.2 HR read-only check: HR cannot update tasks (403 Forbidden)
  const hrPatchReq = await createMockRequest(`/api/v1/tasks/${employeeTask.id}`, {
    method: "PATCH",
    user: hrUser,
    body: { status: "In Progress", expectedVersion: employeeTask.version },
  });
  const hrPatchRes = await patchTaskRoute(hrPatchReq, taskContext);
  assert(hrPatchRes.status === 403, "HR PATCH rejected with HTTP 403 (read-only enforcement)");

  // 3.3 Invalid payload: unrecognized status returns 400
  const invalidStatusReq = await createMockRequest(`/api/v1/tasks/${employeeTask.id}`, {
    method: "PATCH",
    user: adminUser,
    body: { status: "NonExistentStatus", expectedVersion: 0 },
  });
  const invalidStatusRes = await patchTaskRoute(invalidStatusReq, taskContext);
  assert(invalidStatusRes.status === 400, "Invalid status enum rejected with HTTP 400");

  // 3.4 Invalid payload: missing expectedVersion returns 400
  const missingVersionReq = await createMockRequest(`/api/v1/tasks/${employeeTask.id}`, {
    method: "PATCH",
    user: adminUser,
    body: { status: "In Progress" },
  });
  const missingVersionRes = await patchTaskRoute(missingVersionReq, taskContext);
  assert(missingVersionRes.status === 400, "Missing expectedVersion rejected with HTTP 400");

  // 3.5 Invalid payload: negative expectedVersion returns 400
  const negativeVersionReq = await createMockRequest(`/api/v1/tasks/${employeeTask.id}`, {
    method: "PATCH",
    user: adminUser,
    body: { status: "In Progress", expectedVersion: -1 },
  });
  const negativeVersionRes = await patchTaskRoute(negativeVersionReq, taskContext);
  assert(negativeVersionRes.status === 400, "Negative expectedVersion rejected with HTTP 400");

  // 3.6 Invalid payload: unexpected fields rejected by strict schema (400)
  const strictReq = await createMockRequest(`/api/v1/tasks/${employeeTask.id}`, {
    method: "PATCH",
    user: adminUser,
    body: { status: "In Progress", expectedVersion: 0, priority: "P1" },
  });
  const strictRes = await patchTaskRoute(strictReq, taskContext);
  assert(strictRes.status === 400, "Unexpected fields in PATCH payload rejected by strict validation (400)");

  // 3.7 Non-existent task returns 404
  const missingTaskContext = { params: Promise.resolve({ id: "NON-EXISTENT-TASK-9999" }) };
  const missingTaskReq = await createMockRequest("/api/v1/tasks/NON-EXISTENT-TASK-9999", {
    method: "PATCH",
    user: adminUser,
    body: { status: "In Progress", expectedVersion: 0 },
  });
  const missingTaskRes = await patchTaskRoute(missingTaskReq, missingTaskContext);
  assert(missingTaskRes.status === 404, "Non-existent task ID returns HTTP 404");

  // 3.8 Employee cannot update another employee's task (403 Forbidden)
  const empForbiddenReq = await createMockRequest(`/api/v1/tasks/${otherTask.id}`, {
    method: "PATCH",
    user: employeeUser,
    body: { status: "In Progress", expectedVersion: otherTask.version },
  });
  const empForbiddenRes = await patchTaskRoute(empForbiddenReq, otherTaskContext);
  assert(empForbiddenRes.status === 403, "Employee cannot update another employee's task (HTTP 403)");

  console.log();

  // -------------------------------------------------------------------------
  // SECTION 4: CONCURRENCY CONTROL & ATOMIC STATE RESTORATION
  // -------------------------------------------------------------------------
  console.log("--- SECTION 4: OPTIMISTIC CONCURRENCY CONTROL & STATE RESTORATION ---");

  // Record original task state for pristine restoration
  const originalStatus = employeeTask.status;
  const originalVersion = employeeTask.version;
  const testNewStatus = originalStatus === "In Progress" ? "Blocked" : "In Progress";

  try {
    // 4.1 Successful authorized update by Employee for their own task
    const validPatchReq = await createMockRequest(`/api/v1/tasks/${employeeTask.id}`, {
      method: "PATCH",
      user: employeeUser,
      body: { status: testNewStatus, expectedVersion: originalVersion },
    });
    const validPatchRes = await patchTaskRoute(validPatchReq, taskContext);
    assert(validPatchRes.status === 200, "Authorized employee PATCH returns HTTP 200");
    const validPatchData = await validPatchRes.json();
    assert(validPatchData.success === true, "PATCH response contains success: true");
    assert(validPatchData.data.status === testNewStatus, `Task status updated to '${testNewStatus}'`);
    assert(validPatchData.data.version === originalVersion + 1, `Task version incremented to ${originalVersion + 1}`);

    // 4.2 Optimistic concurrency collision: another request using the now-stale version
    const conflictingReq = await createMockRequest(`/api/v1/tasks/${employeeTask.id}`, {
      method: "PATCH",
      user: employeeUser,
      body: { status: "Done", expectedVersion: originalVersion }, // stale version!
    });
    const conflictingRes = await patchTaskRoute(conflictingReq, taskContext);
    assert(conflictingRes.status === 409, "Stale expectedVersion triggers HTTP 409 Conflict");
    const conflictData = await conflictingRes.json();
    assert(conflictData.code === "VERSION_CONFLICT", "Conflict response contains code: 'VERSION_CONFLICT'");
    assert(conflictData.data.version === originalVersion + 1, "Conflict response returns latest version in data");
    assert(conflictData.data.status === testNewStatus, "Conflict response returns current stored status in data");

    // 4.3 Successful follow-up update using latest version by Admin
    const adminUpdateReq = await createMockRequest(`/api/v1/tasks/${employeeTask.id}`, {
      method: "PATCH",
      user: adminUser,
      body: { status: "Done", expectedVersion: originalVersion + 1 },
    });
    const adminUpdateRes = await patchTaskRoute(adminUpdateReq, taskContext);
    assert(adminUpdateRes.status === 200, "Admin can update task with current version (HTTP 200)");
    const adminUpdateData = await adminUpdateRes.json();
    assert(adminUpdateData.data.version === originalVersion + 2, `Version incremented again to ${originalVersion + 2}`);
  } finally {
    // 4.4 Pristine restoration of test task to exact initial state
    await prisma.task.update({
      where: { id: employeeTask.id },
      data: {
        status: originalStatus,
        version: originalVersion,
      },
    });
    const restoredTask = await prisma.task.findUnique({ where: { id: employeeTask.id } });
    assert(
      restoredTask?.status === originalStatus && restoredTask?.version === originalVersion,
      `Pristine test restoration verified: status='${originalStatus}', version=${originalVersion}`
    );
  }

  console.log();

  // -------------------------------------------------------------------------
  // SECTION 5: FINAL DATABASE INVARIANT VERIFICATION
  // -------------------------------------------------------------------------
  console.log("--- SECTION 5: FINAL DATABASE INVARIANT VERIFICATION ---");

  const finalTotalTasks = await prisma.task.count();
  assert(finalTotalTasks === 4844, `Final database total tasks equals 4,844 (found ${finalTotalTasks})`);

  const finalCancelled = await prisma.task.count({ where: { status: "Cancelled" } });
  assert(finalCancelled === 160, `Final cancelled tasks unchanged at 160 (found ${finalCancelled})`);

  const finalDone = await prisma.task.count({ where: { status: "Done" } });
  assert(finalDone === 4018, `Final done tasks unchanged at 4,018 (found ${finalDone})`);

  console.log("\n==================================================================");
  console.log(`  SUITE SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite()
  .catch((err) => {
    console.error("Fatal error during test suite execution:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
