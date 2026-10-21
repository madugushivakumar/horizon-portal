/**
 * Live HTTP Endpoint Verification for Day 3
 * scripts/test-endpoints.ts
 */

const BASE_URL = "http://localhost:3000";

interface LoginResponse {
  success: boolean;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    employeeId?: string | null;
  };
}

async function testHttpEndpoints() {
  console.log("\n========================================================");
  console.log("   LIVE HTTP ENDPOINT TESTS — DAY 3 AUTHENTICATION");
  console.log("========================================================\n");

  const roles = [
    { role: "Admin", email: "admin@growmar.com", pass: "Admin@Horizon2026!" },
    { role: "HR", email: "hr@growmar.com", pass: "HR@Horizon2026!" },
    { role: "Manager", email: "manager@growmar.com", pass: "Manager@Horizon2026!" },
    { role: "Employee", email: "employee@growmar.com", pass: "Employee@Horizon2026!" },
  ];

  for (const user of roles) {
    // 1. Test POST /api/v1/auth/login
    const loginRes = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: user.email, password: user.pass }),
    });

    const setCookie = loginRes.headers.get("set-cookie") || "";
    const loginData: LoginResponse = await loginRes.json();

    console.log(`▶ Testing ${user.role} (${user.email}):`);
    console.log(`  Status: ${loginRes.status} ${loginRes.statusText}`);
    console.log(`  User: ${loginData.user?.name} (${loginData.user?.role})`);
    console.log(`  Has Cookie: ${setCookie.includes("horizon_session")}`);
    console.log(`  HttpOnly: ${setCookie.toLowerCase().includes("httponly")}`);
    console.log(`  SameSite: ${setCookie.toLowerCase().includes("samesite=lax")}`);

    if (loginRes.status !== 200 || loginData.user?.role !== user.role) {
      throw new Error(`Login failed for ${user.role}`);
    }

    // Extract cookie
    const cookieHeader = setCookie.split(";")[0];

    // 2. Test GET /api/v1/auth/me with Cookie
    const meRes = await fetch(`${BASE_URL}/api/v1/auth/me`, {
      headers: { Cookie: cookieHeader },
    });
    const meData = await meRes.json();
    console.log(`  /auth/me Status: ${meRes.status}`);
    console.log(`  /auth/me Verified Role: ${meData.user?.role}`);

    if (meRes.status !== 200 || meData.user?.role !== user.role) {
      throw new Error(`/auth/me verification failed for ${user.role}`);
    }

    // 3. Test POST /api/v1/auth/logout
    const logoutRes = await fetch(`${BASE_URL}/api/v1/auth/logout`, {
      method: "POST",
      headers: { Cookie: cookieHeader },
    });
    const logoutCookie = logoutRes.headers.get("set-cookie") || "";
    console.log(`  Logout Status: ${logoutRes.status}`);
    console.log(`  Logout Clears Cookie: ${logoutCookie.includes("Max-Age=0") || logoutCookie.includes("expires=")}`);
    console.log("  ---------------------------------------------");
  }

  // 4. Test Negative: Bad Password
  console.log("\n▶ Testing Negative Case: Incorrect Password");
  const badLogin = await fetch(`${BASE_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@growmar.com", password: "WrongPassword999!" }),
  });
  const badData = await badLogin.json();
  console.log(`  Status: ${badLogin.status} (Expected: 401)`);
  console.log(`  Message: "${badData.error}"`);
  if (badLogin.status !== 401) {
    throw new Error("Bad password was not rejected with 401");
  }

  // 5. Test Negative: Unauthenticated /auth/me
  console.log("\n▶ Testing Negative Case: Unauthenticated /auth/me");
  const unauthMe = await fetch(`${BASE_URL}/api/v1/auth/me`);
  const unauthData = await unauthMe.json();
  console.log(`  Status: ${unauthMe.status} (Expected: 401)`);
  console.log(`  Message: "${unauthData.error}"`);
  if (unauthMe.status !== 401) {
    throw new Error("Unauthenticated /auth/me was not rejected with 401");
  }

  // 6. Test Middleware: Unauthenticated access to /employees redirects to /login
  console.log("\n▶ Testing Middleware: Protected Route Redirection");
  const redirectRes = await fetch(`${BASE_URL}/employees`, {
    redirect: "manual",
  });
  console.log(`  Status: ${redirectRes.status} (Expected: 307 or 302 redirect)`);
  const location = redirectRes.headers.get("location") || "";
  console.log(`  Redirect Location: "${location}"`);
  if (!location.includes("/login")) {
    throw new Error(`Expected redirect to /login, got: ${location}`);
  }

  console.log("\n========================================================");
  console.log("   ALL LIVE HTTP TESTS PASSED SUCCESSFULLY! ✅");
  console.log("========================================================\n");
}

testHttpEndpoints().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});

export {};
