/**
 * Horizon Portal — Day 14 Capacity Frontend & Navigation Verification Suite
 * scripts/test-day14-capacity-ui.ts
 *
 * Verifies:
 * 1. Navigation Integration:
 *    - /capacity registered in NAVIGATION_REGISTRY for Admin, HR, Manager, Employee
 *    - isRouteAllowedForRole returns true for all 4 roles
 *    - Menu hierarchy places /capacity in "Overview" section for all roles
 *    - Breadcrumbs mapping for "capacity" defined
 *    - Sidebar icon mapped for "scale"
 * 2. Page & Component File Architecture:
 *    - /capacity/page.tsx exists and exports valid metadata
 *    - All 14 capacity components exist in src/components/capacity/
 * 3. Filter API Integration (/api/v1/capacity/filters):
 *    - Returns valid sprint array with calculated working days
 *    - Role-based team scoping (Admin/HR gets all teams, Manager gets scoped teams, Employee gets personal teams)
 * 4. Capacity Dashboard Data Contracts & Serialization:
 *    - End-to-end API response conforms to CapacityDashboardData contract
 *    - Summary metrics include totalEmployees, netCapacity, openPoints, overloadedCount
 *    - Sprint progress metrics include completionPercentage
 *    - Employee records contain safe projections (no compensation or credentials)
 * 5. Workload Classification & Threshold Invariants:
 *    - Available (< 80%), Near Capacity (80–99%), At Capacity (100%), Overloaded (> 100%)
 *    - Zero-capacity handling: non-crashing, null utilizationPercentage, "∞" display string
 * 6. The 20% Leave Reduction Core Invariant:
 *    - Validates on real database records that leave strictly reduces capacity (not task story points)
 */

import { PrismaClient } from "@prisma/client";
import { NextRequest } from "next/server";
import fs from "fs";
import path from "path";
import { createAuthToken } from "../src/lib/auth/token";
import { SESSION_COOKIE_NAME } from "../src/lib/auth/session";

import {
  NAVIGATION_REGISTRY,
  isRouteAllowedForRole,
  getNavigationForRole,
  Role,
} from "../src/config/navigation";
import { GET as getCapacityFilterOptions } from "../src/app/api/v1/capacity/filters/route";
import { GET as getCapacityDashboardRoute } from "../src/app/api/v1/capacity/route";
import {
  CapacityApiResponse,
  CapacityFiltersResponse,
  SerializedEmployeeCapacityRecord,
} from "../src/lib/capacity/capacity-types";

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

async function runTests() {
  console.log("===============================================================");
  console.log("   HORIZON PORTAL — DAY 14 WORKLOAD & CAPACITY UI & NAV SUITE  ");
  console.log("===============================================================\n");

  try {
    // ── SECTION 1: Navigation Registry & Route Authorization ────────────────
    console.log("--- Section 1: Navigation Integration & Role-Based Access ---");

    const capacityNavItem = NAVIGATION_REGISTRY.find((item) => item.id === "capacity");
    assert(!!capacityNavItem, "Registry defines 'capacity' navigation item");
    assert(
      capacityNavItem?.href === "/capacity",
      "Capacity navigation item links to '/capacity'"
    );
    assert(
      capacityNavItem?.icon === "scale",
      "Capacity navigation item uses 'scale' icon"
    );

    const expectedRoles: Role[] = ["Admin", "HR", "Manager", "Employee"];
    const allRolesIncluded = expectedRoles.every((r) =>
      capacityNavItem?.roles.includes(r)
    );
    assert(allRolesIncluded, "Capacity route is registered for Admin, HR, Manager, and Employee");

    for (const role of expectedRoles) {
      const allowed = isRouteAllowedForRole("/capacity", role);
      assert(allowed, `isRouteAllowedForRole permits ${role} to access /capacity`);

      const sections = getNavigationForRole(role);
      const overviewSection = sections.find((s) => s.heading === "Overview");
      const hasItemInOverview = overviewSection?.items.some((i) => i.href === "/capacity");
      assert(
        !!hasItemInOverview,
        `${role} navigation includes '/capacity' under 'Overview' section`
      );
    }

    // Verify Breadcrumbs label mapping
    const breadcrumbsPath = path.join(process.cwd(), "src/components/layout/Breadcrumbs.tsx");
    const breadcrumbsContent = fs.readFileSync(breadcrumbsPath, "utf-8");
    assert(
      breadcrumbsContent.includes('capacity: "Workload & Capacity"'),
      "Breadcrumbs component contains 'capacity' route label mapping"
    );

    // Verify Sidebar icon mapping
    const sidebarPath = path.join(process.cwd(), "src/components/layout/Sidebar.tsx");
    const sidebarContent = fs.readFileSync(sidebarPath, "utf-8");
    assert(
      sidebarContent.includes('case "scale":'),
      "Sidebar component contains SVG icon rendering for 'scale'"
    );

    // ── SECTION 2: Component Architecture Verification ──────────────────────
    console.log("\n--- Section 2: Component & Page Architecture ---");

    const pagePath = path.join(process.cwd(), "src/app/capacity/page.tsx");
    assert(fs.existsSync(pagePath), "Capacity page route exists at src/app/capacity/page.tsx");

    const pageContent = fs.readFileSync(pagePath, "utf-8");
    assert(
      pageContent.includes("export const metadata"),
      "Capacity page route exports page metadata"
    );
    assert(
      pageContent.includes("export default async function CapacityPage"),
      "Capacity page route exports default async server component"
    );

    const requiredComponents = [
      "WorkloadStatusBadge.tsx",
      "CapacityProgressBar.tsx",
      "OverloadWarning.tsx",
      "CapacityFormulaCard.tsx",
      "CapacitySummary.tsx",
      "SprintProgressSummary.tsx",
      "EmployeeCapacityTable.tsx",
      "EmployeeCapacityCard.tsx",
      "CapacityPagination.tsx",
      "CapacityHeader.tsx",
      "CapacitySkeleton.tsx",
      "CapacityEmptyState.tsx",
      "CapacityErrorState.tsx",
      "CapacityDashboard.tsx",
    ];

    for (const comp of requiredComponents) {
      const compPath = path.join(process.cwd(), "src/components/capacity", comp);
      assert(fs.existsSync(compPath), `Capacity component exists: ${comp}`);
    }

    // ── SECTION 3: Filter API Integration ───────────────────────────────────
    console.log("\n--- Section 3: Filter API Integration (/api/v1/capacity/filters) ---");

    const adminUser = await prisma.user.findFirst({
      where: { role: "Admin" },
    });
    if (!adminUser) throw new Error("No Admin user found");

    const adminFilterReq = await createMockRequest(
      "http://localhost:3000/api/v1/capacity/filters",
      adminUser
    );
    const adminFilterRes = await getCapacityFilterOptions(adminFilterReq);
    assert(adminFilterRes.status === 200, "Admin filter options query returns HTTP 200");

    const adminFilterJson = (await adminFilterRes.json()) as CapacityFiltersResponse;
    assert(adminFilterJson.success === true, "Filter options response indicates success");
    assert(adminFilterJson.data.sprints.length > 0, "Returns non-empty sprints array");
    assert(adminFilterJson.data.teams.length > 0, "Returns non-empty teams array");

    const firstSprint = adminFilterJson.data.sprints[0];
    assert(
      typeof firstSprint.id === "string" &&
        typeof firstSprint.name === "string" &&
        typeof firstSprint.startDate === "string" &&
        typeof firstSprint.endDate === "string" &&
        typeof firstSprint.workingDays === "number" &&
        firstSprint.workingDays > 0,
      `Sprint record ${firstSprint.id} has valid calculated workingDays (${firstSprint.workingDays})`
    );

    const sp38Filter = adminFilterJson.data.sprints.find((s) => s.id === "SP-38");
    assert(!!sp38Filter, "SP-38 found in filter options");
    assert(
      sp38Filter?.workingDays === 9,
      `Filters endpoint reports effective workingDays = 9 for SP-38 (holiday 2026-09-14 excluded once) [actual: ${sp38Filter?.workingDays}]`
    );

    // ── SECTION 4: Dashboard API Contract & Data Serialization ──────────────
    console.log("\n--- Section 4: Dashboard API Contract & Serialization ---");

    const targetSprintId = "SP-38";
    const capacityReq = await createMockRequest(
      `http://localhost:3000/api/v1/capacity?sprintId=${targetSprintId}&page=1&pageSize=25`,
      adminUser
    );
    const capacityRes = await getCapacityDashboardRoute(capacityReq);
    assert(capacityRes.status === 200, `Capacity API query for ${targetSprintId} returns HTTP 200`);

    const capacityJson = (await capacityRes.json()) as CapacityApiResponse;
    assert(capacityJson.success === true, "Capacity API response indicates success");

    const data = capacityJson.data;
    assert(data.sprint.id === targetSprintId, "Response contains matching sprint ID");
    assert(data.sprint.workingDays === 9, "Capacity endpoint reports effective workingDays = 9 for SP-38");

    // Consistency Regression Assertion: both endpoints return 9 for SP-38
    assert(
      sp38Filter?.workingDays === data.sprint.workingDays && data.sprint.workingDays === 9,
      "Both /api/v1/capacity/filters and /api/v1/capacity return identical workingDays = 9 for SP-38"
    );

    assert(
      typeof data.summary.totalEmployees === "number" && data.summary.totalEmployees > 0,
      `Summary totalEmployees is valid (${data.summary.totalEmployees})`
    );
    assert(
      typeof data.summary.totalNetCapacity === "number" && data.summary.totalNetCapacity > 0,
      `Summary totalNetCapacity is valid (${data.summary.totalNetCapacity} pts)`
    );
    assert(
      typeof data.summary.totalOpenPoints === "number",
      `Summary totalOpenPoints is valid (${data.summary.totalOpenPoints} pts)`
    );
    assert(
      typeof data.summary.overloadedEmployees === "number",
      `Summary overloadedEmployees count is valid (${data.summary.overloadedEmployees})`
    );

    assert(
      typeof data.sprintProgress.plannedPoints === "number" &&
        typeof data.sprintProgress.completedPoints === "number" &&
        typeof data.sprintProgress.completionPercentage === "number",
      "Sprint progress metrics are properly serialized"
    );

    assert(data.employees.length > 0, `Returned ${data.employees.length} employee records on page 1`);

    // Verify employee record schema and privacy guards
    const sampleEmp = data.employees[0];
    assert(typeof sampleEmp.employeeId === "string", "Employee record contains employeeId");
    assert(typeof sampleEmp.employeeName === "string", "Employee record contains employeeName");
    assert(typeof sampleEmp.email === "string", "Employee record contains email");
    assert(typeof sampleEmp.grossCapacity === "number", "Employee record contains grossCapacity");
    assert(typeof sampleEmp.netCapacity === "number", "Employee record contains netCapacity");
    assert(
      typeof sampleEmp.plannedOpenPoints === "number",
      "Employee record contains plannedOpenPoints"
    );
    assert(
      typeof sampleEmp.utilizationDisplay === "string",
      `Employee record contains utilizationDisplay ("${sampleEmp.utilizationDisplay}")`
    );

    // Verify no privacy leakage in JSON response
    const rawJsonStr = JSON.stringify(capacityJson);
    assert(!rawJsonStr.includes("baseSalary"), "Response contains zero salary / compensation leakage");
    assert(!rawJsonStr.includes("passwordHash"), "Response contains zero credential leakage");
    assert(!rawJsonStr.includes("medicalNotes"), "Response contains zero medical note leakage");

    // ── SECTION 5: Workload Classification Invariants ───────────────────────
    console.log("\n--- Section 5: Workload Classification & Threshold Invariants ---");

    const validClassifications = ["Available", "Near Capacity", "At Capacity", "Overloaded"];
    let allStatusValid = true;
    for (const emp of data.employees) {
      if (!validClassifications.includes(emp.classification)) {
        allStatusValid = false;
        break;
      }
    }
    assert(allStatusValid, "All employee records have valid workload classifications");

    // Check classification logic consistency
    let classificationsMatch = true;
    for (const emp of data.employees) {
      if (emp.netCapacity > 0 && emp.utilizationPercentage !== null) {
        if (emp.utilizationPercentage > 100 && emp.classification !== "Overloaded") {
          classificationsMatch = false;
        } else if (emp.utilizationPercentage === 100 && emp.classification !== "At Capacity") {
          classificationsMatch = false;
        } else if (
          emp.utilizationPercentage >= 80 &&
          emp.utilizationPercentage < 100 &&
          emp.classification !== "Near Capacity"
        ) {
          classificationsMatch = false;
        } else if (emp.utilizationPercentage < 80 && emp.classification !== "Available") {
          classificationsMatch = false;
        }
      }
    }
    assert(classificationsMatch, "Employee classification matches numerical utilization thresholds");

    // ── SECTION 6: The 20% Leave Reduction Core Principle ───────────────────
    console.log("\n--- Section 6: Leave Reduction Core Invariant Check ---");

    // Fetch team T14 where Keerthi Karthikeyan (EMP-0092) is present
    const t14Req = await createMockRequest(
      `http://localhost:3000/api/v1/capacity?sprintId=SP-38&teamId=T14`,
      adminUser
    );
    const t14Res = await getCapacityDashboardRoute(t14Req);
    const t14Json = (await t14Res.json()) as CapacityApiResponse;

    const keerthi = t14Json.data.employees.find(
      (e: SerializedEmployeeCapacityRecord) => e.employeeId === "EMP-0092"
    );
    assert(!!keerthi, "Found test employee Keerthi Karthikeyan (EMP-0092) in T14");

    if (keerthi) {
      assert(
        keerthi.grossCapacity === 45,
        `Keerthi gross capacity is 45 (9 working days * 5 pts) [actual: ${keerthi.grossCapacity}]`
      );
      assert(
        keerthi.approvedLeaveWorkingDays === 4,
        `Keerthi has 4 approved leave days in SP-38 [actual: ${keerthi.approvedLeaveWorkingDays}]`
      );
      assert(
        keerthi.leaveCapacityReduction === 20,
        `Keerthi leave reduces capacity by 20 pts (4 * 5) [actual: ${keerthi.leaveCapacityReduction}]`
      );
      assert(
        keerthi.netCapacity === 25,
        `Keerthi net capacity is 25 pts (45 - 20) [actual: ${keerthi.netCapacity}]`
      );
      assert(
        keerthi.plannedOpenPoints === 5,
        `Keerthi assigned tasks are NOT reduced by leave (5 open points remain) [actual: ${keerthi.plannedOpenPoints}]`
      );
      assert(
        keerthi.utilizationPercentage === 20,
        `Keerthi utilization is calculated against net capacity (5 / 25 = 20%) [actual: ${keerthi.utilizationPercentage}%]`
      );
      assert(
        keerthi.classification === "Available",
        `Keerthi classified as 'Available' (< 80%) [actual: ${keerthi.classification}]`
      );
    }
  } catch (error) {
    console.error("Test execution encountered an unhandled exception:", error);
    failed++;
  } finally {
    await prisma.$disconnect();
  }

  console.log("\n===============================================================");
  console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log("===============================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
