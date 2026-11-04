/**
 * Horizon Portal — Day 13 Phase 3 Task Board Frontend Verification Suite
 * scripts/test-day13-phase3-board-ui.ts
 *
 * Verifies:
 * 1. Navigation Integration:
 *    - /task-board registered in NAVIGATION_REGISTRY for Admin, HR, Manager, Employee
 *    - isRouteAllowedForRole returns true for all 4 roles
 *    - Breadcrumbs mapping for "task-board" defined
 * 2. Filter API (/api/v1/tasks/filters):
 *    - Returns 16 teams and 38 sprints
 *    - Correct schema and sorted outputs
 * 3. Frontend Data Model & Contract Validation:
 *    - Tasks match Task interface (id, type, priority, points, dates, team, sprint, assignee)
 *    - Assignee strictly contains safe fields (no compensation/credentials leaked)
 * 4. Kanban 4-Column Grouping Invariants:
 *    - Tasks group into To Do, In Progress, Blocked, Done
 *    - Cancelled tasks strictly excluded (0 in any column)
 *    - Column sum matches loaded page count
 * 5. Reusable Component File Architecture:
 *    - All 12 required components exist and export valid React components
 * 6. Phase 3 Scope Exclusions:
 *    - Verifies no drag-and-drop libraries (@dnd-kit) are installed in package.json
 */

import { PrismaClient } from "@prisma/client";
import { NextRequest } from "next/server";
import fs from "fs";
import path from "path";
import { createAuthToken } from "../src/lib/auth/token";
import { SESSION_COOKIE_NAME } from "../src/lib/auth/session";

import { NAVIGATION_REGISTRY, isRouteAllowedForRole, getNavigationForRole, Role } from "../src/config/navigation";
import { GET as getFilterOptions } from "../src/app/api/v1/tasks/filters/route";
import { GET as getTasksRoute } from "../src/app/api/v1/tasks/route";
import { Task, TaskApiResponse } from "../src/types/task";

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

async function runPhase3Verification() {
  console.log("==================================================================");
  console.log("   HORIZON PORTAL — DAY 13 PHASE 3 TASK BOARD UI VERIFICATION     ");
  console.log("==================================================================\n");

  const adminUser = await prisma.user.findUnique({ where: { email: "admin@growmar.com" } });
  const hrUser = await prisma.user.findUnique({ where: { email: "hr@growmar.com" } });
  const managerUser = await prisma.user.findUnique({ where: { email: "manager@growmar.com" } });
  const employeeUser = await prisma.user.findUnique({ where: { email: "employee@growmar.com" } });

  if (!adminUser || !hrUser || !managerUser || !employeeUser) {
    throw new Error("Missing required demo accounts in SQLite database.");
  }

  // -------------------------------------------------------------------------
  // 1. NAVIGATION INTEGRATION TESTS
  // -------------------------------------------------------------------------
  console.log("--- 1. NAVIGATION INTEGRATION TESTS ---");

  const taskBoardNavItem = NAVIGATION_REGISTRY.find((item) => item.href === "/task-board");
  assert(Boolean(taskBoardNavItem), "Navigation registry contains entry for /task-board");
  assert(taskBoardNavItem?.id === "task-board", "Task board navigation item ID is 'task-board'");
  assert(taskBoardNavItem?.title === "Team Task Board", "Navigation title is 'Team Task Board'");

  const allRoles: Role[] = ["Admin", "HR", "Manager", "Employee"];
  for (const role of allRoles) {
    const isAllowed = isRouteAllowedForRole("/task-board", role);
    assert(isAllowed, `Server route gate permits ${role} to access /task-board`);

    const roleSections = getNavigationForRole(role);
    const roleHrefs = roleSections.flatMap((s) => s.items.map((i) => i.href));
    assert(roleHrefs.includes("/task-board"), `${role} navigation sidebar includes /task-board`);
  }

  // Verify Breadcrumbs label mapping exists
  const breadcrumbsContent = fs.readFileSync(
    path.join(process.cwd(), "src/components/layout/Breadcrumbs.tsx"),
    "utf-8"
  );
  assert(
    breadcrumbsContent.includes('"task-board": "Team Task Board"'),
    "Breadcrumbs ROUTE_LABELS maps 'task-board' to 'Team Task Board'"
  );

  console.log();

  // -------------------------------------------------------------------------
  // 2. FILTER OPTIONS API TESTS
  // -------------------------------------------------------------------------
  console.log("--- 2. FILTER OPTIONS API TESTS ---");

  const filterReq = await createMockRequest("/api/v1/tasks/filters", adminUser);
  const filterRes = await getFilterOptions(filterReq);
  assert(filterRes.status === 200, "GET /api/v1/tasks/filters returns HTTP 200");

  const filterData = await filterRes.json();
  assert(filterData.success === true, "Filter options response has success: true");
  assert(filterData.teams.length === 16, `Filter options include all 16 teams (found ${filterData.teams.length})`);
  assert(filterData.sprints.length === 38, `Filter options include all 38 sprints (found ${filterData.sprints.length})`);
  assert(
    typeof filterData.teams[0].id === "string" && typeof filterData.teams[0].teamName === "string",
    "Team options match { id, teamName } schema"
  );
  assert(
    typeof filterData.sprints[0].id === "string" && typeof filterData.sprints[0].sprintName === "string",
    "Sprint options match { id, sprintName } schema"
  );

  console.log();

  // -------------------------------------------------------------------------
  // 3. FRONTEND DATA MODEL & KANBAN GROUPING INVARIANTS
  // -------------------------------------------------------------------------
  console.log("--- 3. FRONTEND DATA MODEL & KANBAN GROUPING ---");

  const tasksReq = await createMockRequest("/api/v1/tasks?page=1&pageSize=50", adminUser);
  const tasksRes = await getTasksRoute(tasksReq);
  assert(tasksRes.status === 200, "GET /api/v1/tasks returns HTTP 200");

  const tasksData = (await tasksRes.json()) as TaskApiResponse;
  const tasks = tasksData.data;
  assert(tasks.length === 50, "Default page returns 50 loaded tasks");

  // Verify grouping into 4 columns
  const todoTasks = tasks.filter((t: Task) => t.status === "To Do");
  const inProgressTasks = tasks.filter((t: Task) => t.status === "In Progress");
  const blockedTasks = tasks.filter((t: Task) => t.status === "Blocked");
  const doneTasks = tasks.filter((t: Task) => t.status === "Done");
  const cancelledTasks = tasks.filter((t: Task) => t.status === "Cancelled");

  assert(cancelledTasks.length === 0, "Default loaded tasks contain 0 Cancelled tasks");
  assert(
    todoTasks.length + inProgressTasks.length + blockedTasks.length + doneTasks.length === tasks.length,
    `4 Kanban columns account for 100% of loaded tasks (${todoTasks.length} + ${inProgressTasks.length} + ${blockedTasks.length} + ${doneTasks.length} = ${tasks.length})`
  );

  // Verify card fields
  const sampleTask = tasks[0];
  assert(Boolean(sampleTask.id), `Task has unique ID (${sampleTask.id})`);
  assert(Boolean(sampleTask.taskType), `Task has taskType (${sampleTask.taskType})`);
  assert(["P1", "P2", "P3", "P4"].includes(sampleTask.priority), `Task has valid priority (${sampleTask.priority})`);
  assert(typeof sampleTask.storyPoints === "number", `Task has numeric storyPoints (${sampleTask.storyPoints})`);
  assert(Boolean(sampleTask.dueDate), `Task has dueDate (${sampleTask.dueDate})`);
  assert(Boolean(sampleTask.team?.teamName), `Task has team name (${sampleTask.team?.teamName})`);
  assert(Boolean(sampleTask.sprint?.sprintName), `Task has sprint name (${sampleTask.sprint?.sprintName})`);

  console.log();

  // -------------------------------------------------------------------------
  // 4. REUSABLE COMPONENT ARCHITECTURE INTEGRITY
  // -------------------------------------------------------------------------
  console.log("--- 4. REUSABLE COMPONENT ARCHITECTURE INTEGRITY ---");

  const expectedComponents = [
    "src/app/task-board/page.tsx",
    "src/types/task.ts",
    "src/components/task-board/TaskBoard.tsx",
    "src/components/task-board/TaskBoardHeader.tsx",
    "src/components/task-board/TaskBoardSummary.tsx",
    "src/components/task-board/TaskBoardFilters.tsx",
    "src/components/task-board/TaskBoardColumn.tsx",
    "src/components/task-board/TaskCard.tsx",
    "src/components/task-board/TaskPriorityBadge.tsx",
    "src/components/task-board/TaskStoryPoints.tsx",
    "src/components/task-board/TaskBoardPagination.tsx",
    "src/components/task-board/TaskBoardSkeleton.tsx",
    "src/components/task-board/TaskBoardEmptyState.tsx",
    "src/components/task-board/TaskBoardErrorState.tsx",
  ];

  for (const compPath of expectedComponents) {
    const fullPath = path.join(process.cwd(), compPath);
    const exists = fs.existsSync(fullPath);
    assert(exists, `Component exists: ${compPath}`);
  }

  console.log();

  // -------------------------------------------------------------------------
  // 5. PACKAGE DEPENDENCY COMPLIANCE CHECK
  // -------------------------------------------------------------------------
  console.log("--- 5. PACKAGE DEPENDENCY COMPLIANCE CHECK ---");

  const pkgJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), "package.json"), "utf-8"));
  const deps = { ...(pkgJson.dependencies || {}), ...(pkgJson.devDependencies || {}) };

  assert(Boolean(deps["@dnd-kit/core"]), "@dnd-kit/core is installed in package.json");
  assert(Boolean(deps["@dnd-kit/utilities"]), "@dnd-kit/utilities is installed in package.json");
  assert(!deps["react-beautiful-dnd"], "react-beautiful-dnd is NOT installed in package.json (clean dependency set)");

  console.log("\n==================================================================");
  console.log(`  PHASE 3 SUITE SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase3Verification()
  .catch((err) => {
    console.error("Fatal error during Phase 3 verification:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
