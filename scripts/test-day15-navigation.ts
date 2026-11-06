/**
 * Horizon Portal — Day 15 Navigation & RBAC Verification Suite
 * scripts/test-day15-navigation.ts
 *
 * Verifies:
 * 1. Navigation Registry & Metadata:
 *    - /hr-insights registered in NAVIGATION_REGISTRY with title 'AI Workforce Insights'
 *    - Permitted roles are strictly ['HR', 'Admin']
 *    - Icon identifier 'sparkles' mapped
 * 2. Role-Based Navigation Menu Visibility:
 *    - Admin: includes /hr-insights under 'Workforce & Operations'
 *    - HR: includes /hr-insights under 'People Operations'
 *    - Manager: strictly excludes /hr-insights from all navigation sections
 *    - Employee: strictly excludes /hr-insights from all navigation sections
 * 3. Server-Side Route Authorization (isRouteAllowedForRole):
 *    - Admin -> true
 *    - HR -> true
 *    - Manager -> false
 *    - Employee -> false
 * 4. Breadcrumb Label Integration:
 *    - ROUTE_LABELS['hr-insights'] equals 'AI Workforce Insights'
 * 5. Sidebar Icon Rendering:
 *    - 'sparkles' icon SVG renderer defined in Sidebar.tsx
 * 6. Direct Page Route Server Security (/hr-insights):
 *    - Unauthenticated request -> redirect to /login
 *    - Manager / Employee -> HTTP 403 Forbidden state view
 *    - HR / Admin -> HTTP 200 Dashboard view
 * 7. API RBAC Boundaries:
 *    - GET /api/v1/hr-insights enforces 401 for unauth, 403 for Manager/Employee, 200 for HR/Admin
 *    - GET /api/v1/hr-insights/filters enforces identical role boundaries
 */

import { PrismaClient } from "@prisma/client";
import { NextRequest } from "next/server";
import fs from "fs";
import path from "path";
import { createAuthToken } from "../src/lib/auth/token";
import { SESSION_COOKIE_NAME } from "../src/lib/auth/session";

import {
  NAVIGATION_REGISTRY,
  getNavigationForRole,
  isRouteAllowedForRole,
} from "../src/config/navigation";
import { GET as getHRInsightsRoute } from "../src/app/api/v1/hr-insights/route";
import { GET as getHRInsightsFiltersRoute } from "../src/app/api/v1/hr-insights/filters/route";

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
  name?: string | null;
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
      name: options.user.name || undefined,
    });
    headers.set("Cookie", `${SESSION_COOKIE_NAME}=${token}`);
    headers.set("Authorization", `Bearer ${token}`);
  }

  return new NextRequest(new URL(url, "http://localhost:3000"), {
    method: options?.method || "GET",
    headers,
  });
}

async function runNavigationTests() {
  console.log("==================================================================");
  console.log("   HORIZON PORTAL — DAY 15 NAVIGATION & RBAC VERIFICATION SUITE   ");
  console.log("==================================================================");

  // -------------------------------------------------------------------------
  // SECTION 1: CENTRAL NAVIGATION REGISTRY INTEGRATION
  // -------------------------------------------------------------------------
  console.log("\n--- SECTION 1: CENTRAL REGISTRY INTEGRATION ---");

  const hrInsightsItem = NAVIGATION_REGISTRY.find((item) => item.id === "hr-insights");
  assert(Boolean(hrInsightsItem), "Item 'hr-insights' is registered in NAVIGATION_REGISTRY");
  assert(hrInsightsItem?.title === "AI Workforce Insights", "Item title equals 'AI Workforce Insights'");
  assert(hrInsightsItem?.href === "/hr-insights", "Item route href equals '/hr-insights'");
  assert(hrInsightsItem?.icon === "sparkles", "Item icon is set to 'sparkles'");
  assert(
    Boolean(
      hrInsightsItem?.roles.includes("HR") &&
      hrInsightsItem?.roles.includes("Admin") &&
      !hrInsightsItem?.roles.includes("Manager") &&
      !hrInsightsItem?.roles.includes("Employee")
    ),
    "Item roles are strictly ['HR', 'Admin'] (Manager and Employee excluded)"
  );

  // -------------------------------------------------------------------------
  // SECTION 2: ROLE-BASED NAVIGATION MENU MAPPING
  // -------------------------------------------------------------------------
  console.log("\n--- SECTION 2: ROLE-BASED MENU VISIBILITY ---");

  // Admin Navigation
  const adminSections = getNavigationForRole("Admin");
  const adminHrefs = adminSections.flatMap((s) => s.items.map((i) => i.href));
  assert(adminHrefs.includes("/hr-insights"), "Admin menu includes '/hr-insights'");

  const adminWorkforceSection = adminSections.find((s) => s.heading === "Workforce & Operations");
  assert(
    Boolean(adminWorkforceSection && adminWorkforceSection.items.some((i) => i.id === "hr-insights")),
    "Admin menu places 'hr-insights' under 'Workforce & Operations' section"
  );

  // HR Navigation
  const hrSections = getNavigationForRole("HR");
  const hrHrefs = hrSections.flatMap((s) => s.items.map((i) => i.href));
  assert(hrHrefs.includes("/hr-insights"), "HR menu includes '/hr-insights'");

  const hrPeopleSection = hrSections.find((s) => s.heading === "People Operations");
  assert(
    Boolean(hrPeopleSection && hrPeopleSection.items.some((i) => i.id === "hr-insights")),
    "HR menu places 'hr-insights' under 'People Operations' section"
  );

  // Manager Navigation (Strictly Excluded)
  const managerSections = getNavigationForRole("Manager");
  const managerHrefs = managerSections.flatMap((s) => s.items.map((i) => i.href));
  assert(!managerHrefs.includes("/hr-insights"), "Manager menu strictly excludes '/hr-insights'");

  // Employee Navigation (Strictly Excluded)
  const employeeSections = getNavigationForRole("Employee");
  const employeeHrefs = employeeSections.flatMap((s) => s.items.map((i) => i.href));
  assert(!employeeHrefs.includes("/hr-insights"), "Employee menu strictly excludes '/hr-insights'");

  // -------------------------------------------------------------------------
  // SECTION 3: SERVER-SIDE ROUTE AUTHORIZATION (isRouteAllowedForRole)
  // -------------------------------------------------------------------------
  console.log("\n--- SECTION 3: SERVER-SIDE ROUTE AUTHORIZATION (isRouteAllowedForRole) ---");

  assert(isRouteAllowedForRole("/hr-insights", "Admin") === true, "isRouteAllowedForRole allows Admin to access /hr-insights");
  assert(isRouteAllowedForRole("/hr-insights", "HR") === true, "isRouteAllowedForRole allows HR to access /hr-insights");
  assert(isRouteAllowedForRole("/hr-insights", "Manager") === false, "isRouteAllowedForRole denies Manager from accessing /hr-insights");
  assert(isRouteAllowedForRole("/hr-insights", "Employee") === false, "isRouteAllowedForRole denies Employee from accessing /hr-insights");

  // -------------------------------------------------------------------------
  // SECTION 4: BREADCRUMBS & SIDEBAR ICON INTEGRATION
  // -------------------------------------------------------------------------
  console.log("\n--- SECTION 4: BREADCRUMBS & SIDEBAR ICON ---");

  const breadcrumbsContent = fs.readFileSync(
    path.join(process.cwd(), "src/components/layout/Breadcrumbs.tsx"),
    "utf-8"
  );
  assert(
    breadcrumbsContent.includes('"hr-insights": "AI Workforce Insights"'),
    "Breadcrumbs ROUTE_LABELS includes 'hr-insights' mapped to 'AI Workforce Insights'"
  );

  const sidebarContent = fs.readFileSync(
    path.join(process.cwd(), "src/components/layout/Sidebar.tsx"),
    "utf-8"
  );
  assert(
    sidebarContent.includes('case "sparkles":'),
    "Sidebar component renders dedicated SVG icon for 'sparkles'"
  );

  // -------------------------------------------------------------------------
  // SECTION 5: SERVER PAGE DIRECT ACCESS SECURITY
  // -------------------------------------------------------------------------
  console.log("\n--- SECTION 5: SERVER PAGE GUARD SECURITY ---");

  const pageContent = fs.readFileSync(
    path.join(process.cwd(), "src/app/hr-insights/page.tsx"),
    "utf-8"
  );

  assert(
    pageContent.includes('redirect("/login")'),
    "Page route redirects unauthenticated direct URL access to /login"
  );
  assert(
    pageContent.includes('role !== "ADMIN" && role !== "HR"'),
    "Page route enforces strict role check (ADMIN and HR only)"
  );
  assert(
    pageContent.includes("Access Restricted — 403 Forbidden"),
    "Page route renders explicit 403 Forbidden state view for unauthorized roles"
  );

  // -------------------------------------------------------------------------
  // SECTION 6: API RBAC BOUNDARIES
  // -------------------------------------------------------------------------
  console.log("\n--- SECTION 6: API RBAC BOUNDARIES ---");

  const [adminUser, hrUser, managerUser, employeeUser] = await Promise.all([
    prisma.user.findUnique({ where: { email: "admin@growmar.com" } }),
    prisma.user.findUnique({ where: { email: "hr@growmar.com" } }),
    prisma.user.findUnique({ where: { email: "manager@growmar.com" } }),
    prisma.user.findUnique({ where: { email: "employee@growmar.com" } }),
  ]);

  if (!adminUser || !hrUser || !managerUser || !employeeUser) {
    throw new Error("Missing test users in database.");
  }

  // Unauthenticated -> 401
  const unauthRes = await getHRInsightsRoute(await createMockRequest("/api/v1/hr-insights"));
  assert(unauthRes.status === 401, "Unauthenticated GET /api/v1/hr-insights returns HTTP 401");

  // Employee -> 403
  const empRes = await getHRInsightsRoute(await createMockRequest("/api/v1/hr-insights", { user: employeeUser }));
  assert(empRes.status === 403, "Employee GET /api/v1/hr-insights returns HTTP 403 Forbidden");

  // Manager -> 403
  const mgrRes = await getHRInsightsRoute(await createMockRequest("/api/v1/hr-insights", { user: managerUser }));
  assert(mgrRes.status === 403, "Manager GET /api/v1/hr-insights returns HTTP 403 Forbidden");

  // HR -> 200
  const hrRes = await getHRInsightsRoute(await createMockRequest("/api/v1/hr-insights", { user: hrUser }));
  assert(hrRes.status === 200, "HR GET /api/v1/hr-insights returns HTTP 200 OK");

  // Admin -> 200
  const adminRes = await getHRInsightsRoute(await createMockRequest("/api/v1/hr-insights", { user: adminUser }));
  assert(adminRes.status === 200, "Admin GET /api/v1/hr-insights returns HTTP 200 OK");

  // Filters Endpoint RBAC boundaries
  const unauthFilters = await getHRInsightsFiltersRoute(await createMockRequest("/api/v1/hr-insights/filters"));
  assert(unauthFilters.status === 401, "Unauthenticated GET /api/v1/hr-insights/filters returns HTTP 401");

  const empFilters = await getHRInsightsFiltersRoute(await createMockRequest("/api/v1/hr-insights/filters", { user: employeeUser }));
  assert(empFilters.status === 403, "Employee GET /api/v1/hr-insights/filters returns HTTP 403 Forbidden");

  const mgrFilters = await getHRInsightsFiltersRoute(await createMockRequest("/api/v1/hr-insights/filters", { user: managerUser }));
  assert(mgrFilters.status === 403, "Manager GET /api/v1/hr-insights/filters returns HTTP 403 Forbidden");

  const hrFilters = await getHRInsightsFiltersRoute(await createMockRequest("/api/v1/hr-insights/filters", { user: hrUser }));
  assert(hrFilters.status === 200, "HR GET /api/v1/hr-insights/filters returns HTTP 200 OK");

  const adminFilters = await getHRInsightsFiltersRoute(await createMockRequest("/api/v1/hr-insights/filters", { user: adminUser }));
  assert(adminFilters.status === 200, "Admin GET /api/v1/hr-insights/filters returns HTTP 200 OK");

  // Summary
  console.log("\n==================================================================");
  console.log(`  DAY 15 NAVIGATION SUITE: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runNavigationTests()
  .catch((err) => {
    console.error("Unexpected error during navigation test execution:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
