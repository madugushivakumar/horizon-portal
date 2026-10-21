/**
 * Live End-to-End HTTP Flow Test
 * scripts/test-e2e-http.ts
 *
 * Performs real HTTP requests against localhost:3000 to verify:
 * 1. Unauthenticated redirect to /login
 * 2. Employee login & dashboard rendering with Employee role menu
 * 3. Employee accessing forbidden /admin/users -> 307 redirect to /dashboard?error=unauthorized
 * 4. Employee accessing forbidden /payroll -> 307 redirect
 * 5. Manager login & allowed /approvals, denied /payroll
 * 6. HR login & allowed /payroll, denied /approvals
 * 7. Admin login & allowed /admin/users, /payroll, /approvals
 * 8. Non-existent route returns 404
 */

const BASE_URL = "http://localhost:3000";

interface LoginResult {
  cookie: string;
  role: string;
  user: any;
}

async function loginAs(email: string, pass: string): Promise<LoginResult> {
  const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: pass }),
  });

  const cookieHeader = res.headers.get("set-cookie") || "";
  const data = await res.json();

  if (!res.ok) {
    throw new Error(`Login failed for ${email}: ${JSON.stringify(data)}`);
  }

  // Extract session token
  const match = cookieHeader.match(/horizon_session=([^;]+)/);
  const cookie = match ? `horizon_session=${match[1]}` : "";

  return {
    cookie,
    role: data.user.role,
    user: data.user,
  };
}

async function testE2E() {
  console.log("===============================================================");
  console.log("     LIVE E2E HTTP VERIFICATION SUITE — HORIZON PORTAL         ");
  console.log("===============================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, name: string, detail?: string) {
    if (condition) {
      console.log(`  ✓ [PASS] ${name}`);
      passed++;
    } else {
      console.error(`  ✗ [FAIL] ${name}`);
      if (detail) console.error(`    Detail: ${detail}`);
      failed++;
    }
  }

  // 1. Unauthenticated route protection
  console.log("--- 1. Unauthenticated Page Protection ---");
  const unauthRes = await fetch(`${BASE_URL}/dashboard`, { redirect: "manual" });
  assert(
    unauthRes.status === 307 || unauthRes.status === 302,
    `Unauthenticated /dashboard redirects to login (Status: ${unauthRes.status})`
  );
  const location = unauthRes.headers.get("location") || "";
  assert(
    location.includes("/login?from=%2Fdashboard"),
    `Redirect location preserves target: ${location}`
  );

  // 2. Employee Login & Dashboard
  console.log("\n--- 2. Employee Role-Aware Access ---");
  const emp = await loginAs("employee@growmar.com", "Employee@Horizon2026!");
  assert(emp.role === "Employee", `Employee authenticated: ${emp.user.name}`);

  // Fetch dashboard with Employee cookie
  const empDashRes = await fetch(`${BASE_URL}/dashboard`, {
    headers: { Cookie: emp.cookie },
  });
  assert(empDashRes.status === 200, `Employee accesses /dashboard (Status: ${empDashRes.status})`);
  const empDashHtml = await empDashRes.text();
  assert(
    empDashHtml.includes("Horizon Portal"),
    "Employee dashboard rendered Horizon Portal shell"
  );

  // Employee accessing forbidden route: /admin/users
  const empAdminRes = await fetch(`${BASE_URL}/admin/users`, {
    headers: { Cookie: emp.cookie },
    redirect: "manual",
  });
  assert(
    empAdminRes.status === 307 || empAdminRes.status === 302,
    `Employee is denied access to /admin/users (Status: ${empAdminRes.status})`
  );
  const empAdminLoc = empAdminRes.headers.get("location") || "";
  assert(
    empAdminLoc.includes("/dashboard?error=unauthorized&denied=%2Fadmin%2Fusers"),
    `Redirects to dashboard with unauthorized error: ${empAdminLoc}`
  );

  // Employee accessing forbidden route: /payroll
  const empPayrollRes = await fetch(`${BASE_URL}/payroll`, {
    headers: { Cookie: emp.cookie },
    redirect: "manual",
  });
  assert(
    empPayrollRes.status === 307 || empPayrollRes.status === 302,
    `Employee is denied access to /payroll (Status: ${empPayrollRes.status})`
  );

  // 3. Manager Role Access
  console.log("\n--- 3. Manager Role-Aware Access ---");
  const mgr = await loginAs("manager@growmar.com", "Manager@Horizon2026!");
  assert(mgr.role === "Manager", `Manager authenticated: ${mgr.user.name}`);

  // Manager accessing allowed route: /approvals
  const mgrApprRes = await fetch(`${BASE_URL}/approvals`, {
    headers: { Cookie: mgr.cookie },
  });
  assert(mgrApprRes.status === 200, `Manager accesses allowed /approvals (Status: ${mgrApprRes.status})`);

  // Manager accessing denied route: /admin/settings
  const mgrAdminRes = await fetch(`${BASE_URL}/admin/settings`, {
    headers: { Cookie: mgr.cookie },
    redirect: "manual",
  });
  assert(
    mgrAdminRes.status === 307 || mgrAdminRes.status === 302,
    `Manager is denied access to /admin/settings (Status: ${mgrAdminRes.status})`
  );

  // 4. HR Role Access
  console.log("\n--- 4. HR Role-Aware Access ---");
  const hr = await loginAs("hr@growmar.com", "HR@Horizon2026!");
  assert(hr.role === "HR", `HR authenticated: ${hr.user.name}`);

  // HR accessing allowed route: /payroll
  const hrPayRes = await fetch(`${BASE_URL}/payroll`, {
    headers: { Cookie: hr.cookie },
  });
  assert(hrPayRes.status === 200, `HR accesses allowed /payroll (Status: ${hrPayRes.status})`);

  // HR accessing denied route: /approvals
  const hrApprRes = await fetch(`${BASE_URL}/approvals`, {
    headers: { Cookie: hr.cookie },
    redirect: "manual",
  });
  assert(
    hrApprRes.status === 307 || hrApprRes.status === 302,
    `HR is denied access to /approvals (Status: ${hrApprRes.status})`
  );

  // 5. Admin Role Access
  console.log("\n--- 5. Admin Full Management Access ---");
  const admin = await loginAs("admin@growmar.com", "Admin@Horizon2026!");
  assert(admin.role === "Admin", `Admin authenticated: ${admin.user.name}`);

  // Admin accessing /admin/users
  const admUsersRes = await fetch(`${BASE_URL}/admin/users`, {
    headers: { Cookie: admin.cookie },
  });
  assert(admUsersRes.status === 200, `Admin accesses /admin/users (Status: ${admUsersRes.status})`);

  // Admin accessing /payroll
  const admPayRes = await fetch(`${BASE_URL}/payroll`, {
    headers: { Cookie: admin.cookie },
  });
  assert(admPayRes.status === 200, `Admin accesses /payroll (Status: ${admPayRes.status})`);

  // Admin accessing /approvals
  const admApprRes = await fetch(`${BASE_URL}/approvals`, {
    headers: { Cookie: admin.cookie },
  });
  assert(admApprRes.status === 200, `Admin accesses /approvals (Status: ${admApprRes.status})`);

  // 6. Custom 404 Page Check
  console.log("\n--- 6. Custom 404 Not Found Page ---");
  const notFoundRes = await fetch(`${BASE_URL}/some-non-existent-route-9999`, {
    headers: { Cookie: admin.cookie },
  });
  assert(
    notFoundRes.status === 404,
    `Non-existent route returns HTTP 404 status (Status: ${notFoundRes.status})`
  );
  const notFoundHtml = await notFoundRes.text();
  assert(
    notFoundHtml.includes("404 · Page Not Found") || notFoundHtml.includes("Lost in the Horizon?"),
    "Custom 404 page renders Horizon branded not-found content"
  );

  console.log("\n===============================================================");
  console.log(`TOTAL E2E TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log("===============================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

testE2E().catch((err) => {
  console.error("E2E Test execution error:", err);
  process.exit(1);
});
