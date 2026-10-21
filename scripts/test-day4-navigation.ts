/**
 * Day 4 Verification Test Suite
 * scripts/test-day4-navigation.ts
 *
 * Verifies role-based navigation mapping, menu filtering, server route authorization,
 * and user role identities for all 4 demo users (Admin, HR, Manager, Employee).
 */

import { getNavigationForRole, isRouteAllowedForRole, NAVIGATION_REGISTRY, Role } from "../src/config/navigation";

interface DemoUserTestConfig {
  role: Role;
  email: string;
  expectedSections: string[];
  expectedAllowedRoutes: string[];
  expectedDeniedRoutes: string[];
}

const DEMO_TEST_MATRIX: DemoUserTestConfig[] = [
  {
    role: "Employee",
    email: "employee@growmar.com",
    expectedSections: ["Overview", "Self Service"],
    expectedAllowedRoutes: ["/dashboard", "/employees", "/leave", "/payslips"],
    expectedDeniedRoutes: [
      "/approvals",
      "/team",
      "/leave-management",
      "/payroll",
      "/recruitment",
      "/admin/users",
      "/admin/settings",
      "/admin/audit",
    ],
  },
  {
    role: "Manager",
    email: "manager@growmar.com",
    expectedSections: ["Overview", "Management"],
    expectedAllowedRoutes: ["/dashboard", "/employees", "/approvals", "/team"],
    expectedDeniedRoutes: [
      "/leave",
      "/payslips",
      "/leave-management",
      "/payroll",
      "/recruitment",
      "/admin/users",
      "/admin/settings",
      "/admin/audit",
    ],
  },
  {
    role: "HR",
    email: "hr@growmar.com",
    expectedSections: ["Overview", "People Operations"],
    expectedAllowedRoutes: [
      "/dashboard",
      "/employees",
      "/leave-management",
      "/payroll",
      "/recruitment",
    ],
    expectedDeniedRoutes: [
      "/leave",
      "/payslips",
      "/approvals",
      "/team",
      "/admin/users",
      "/admin/settings",
      "/admin/audit",
    ],
  },
  {
    role: "Admin",
    email: "admin@growmar.com",
    expectedSections: ["Overview", "Workforce & Operations", "Administration"],
    expectedAllowedRoutes: [
      "/dashboard",
      "/employees",
      "/approvals",
      "/team",
      "/leave-management",
      "/payroll",
      "/recruitment",
      "/admin/users",
      "/admin/settings",
      "/admin/audit",
    ],
    expectedDeniedRoutes: ["/leave", "/payslips"],
  },
];

async function runTests() {
  console.log("===============================================================");
  console.log("   HORIZON PORTAL — DAY 4 ROLE-AWARE NAVIGATION VERIFICATION   ");
  console.log("===============================================================\n");

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

  // 1. Central Navigation Registry Validation
  console.log("--- 1. Central Navigation Registry Tests ---");
  assert(
    NAVIGATION_REGISTRY.length >= 10,
    `Registry defines complete set of portal items (found ${NAVIGATION_REGISTRY.length} items)`
  );

  const hasUniqueIds = new Set(NAVIGATION_REGISTRY.map((i) => i.id)).size === NAVIGATION_REGISTRY.length;
  assert(hasUniqueIds, "All navigation items have unique identifiers");

  const hasUniqueHrefs = new Set(NAVIGATION_REGISTRY.map((i) => i.href)).size === NAVIGATION_REGISTRY.length;
  assert(hasUniqueHrefs, "All navigation routes have unique href paths");

  // 2. Role-to-Menu Matrix Tests
  console.log("\n--- 2. Role-to-Menu Mapping Tests ---");
  for (const config of DEMO_TEST_MATRIX) {
    console.log(`\nTesting Role: [${config.role}] (${config.email})`);

    const sections = getNavigationForRole(config.role);
    const sectionHeadings = sections.map((s) => s.heading);

    assert(
      JSON.stringify(sectionHeadings) === JSON.stringify(config.expectedSections),
      `Section structure for ${config.role}`,
      `Expected ${JSON.stringify(config.expectedSections)}, received ${JSON.stringify(sectionHeadings)}`
    );

    const renderedHrefs = sections.flatMap((s) => s.items.map((i) => i.href));

    // Verify all allowed routes are rendered
    for (const allowedRoute of config.expectedAllowedRoutes) {
      assert(
        renderedHrefs.includes(allowedRoute),
        `${config.role} menu includes authorized route: ${allowedRoute}`
      );
    }

    // Verify denied routes are NOT rendered in the menu
    for (const deniedRoute of config.expectedDeniedRoutes) {
      assert(
        !renderedHrefs.includes(deniedRoute),
        `${config.role} menu excludes unauthorized route: ${deniedRoute}`
      );
    }
  }

  // 3. Server-Side Route Authorization Tests (isRouteAllowedForRole)
  console.log("\n--- 3. Server-Side Route Authorization Enforcement ---");
  for (const config of DEMO_TEST_MATRIX) {
    for (const allowedRoute of config.expectedAllowedRoutes) {
      const allowed = isRouteAllowedForRole(allowedRoute, config.role);
      assert(
        allowed === true,
        `Server allows ${config.role} to access ${allowedRoute}`
      );
    }

    for (const deniedRoute of config.expectedDeniedRoutes) {
      const allowed = isRouteAllowedForRole(deniedRoute, config.role);
      assert(
        allowed === false,
        `Server forbids ${config.role} from accessing ${deniedRoute}`
      );
    }
  }

  // 4. Admin Subroute Protection Fallback Rule
  console.log("\n--- 4. Unmapped Admin Route Enforcement ---");
  const randomAdminRoute = "/admin/internal-backdoor";
  assert(
    isRouteAllowedForRole(randomAdminRoute, "Admin") === true,
    "Admin can access unmapped /admin/* routes"
  );
  assert(
    isRouteAllowedForRole(randomAdminRoute, "Employee") === false,
    "Employee is denied access to unmapped /admin/* routes"
  );
  assert(
    isRouteAllowedForRole(randomAdminRoute, "Manager") === false,
    "Manager is denied access to unmapped /admin/* routes"
  );
  assert(
    isRouteAllowedForRole(randomAdminRoute, "HR") === false,
    "HR is denied access to unmapped /admin/* routes"
  );

  console.log("\n===============================================================");
  console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log("===============================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution error:", err);
  process.exit(1);
});
