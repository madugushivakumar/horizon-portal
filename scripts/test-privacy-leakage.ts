/**
 * Automated Privacy & Sensitive Field Leakage Test
 * scripts/test-privacy-leakage.ts
 *
 * Verifies that the Employee Directory and Profile API responses NEVER expose
 * salary, compensation, bank details, passwords, password hashes, or authentication tokens.
 *
 * Audits every single key at the top level and recursively throughout nested objects
 * (such as department, manager, and direct reports).
 */

import { PROHIBITED_PRIVATE_FIELDS } from "../src/types/employee";

const BASE_URL = "http://localhost:3000";

const FORBIDDEN_PATTERNS = [
  ...PROHIBITED_PRIVATE_FIELDS,
  "salary",
  "compensation",
  "bank",
  "password",
  "password_hash",
  "passwordHash",
  "secret",
  "token",
];

function recursivelyAuditKeys(obj: unknown, path = ""): string[] {
  const violations: string[] = [];

  if (!obj || typeof obj !== "object") {
    return violations;
  }

  if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      violations.push(...recursivelyAuditKeys(item, `${path}[${index}]`));
    });
    return violations;
  }

  for (const [key, value] of Object.entries(obj)) {
    const currentPath = path ? `${path}.${key}` : key;
    const lowerKey = key.toLowerCase();

    // Check if key matches or contains any forbidden pattern
    for (const pattern of FORBIDDEN_PATTERNS) {
      if (lowerKey === pattern.toLowerCase() || lowerKey.includes("salary") || lowerKey.includes("password")) {
        violations.push(`Forbidden field "${key}" detected at path: ${currentPath} (Value: ${JSON.stringify(value)})`);
      }
    }

    if (value && typeof value === "object") {
      violations.push(...recursivelyAuditKeys(value, currentPath));
    }
  }

  return violations;
}

interface LoginResult {
  cookie: string;
  role: string;
}

async function loginAs(email: string, pass: string): Promise<LoginResult> {
  const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: pass }),
  });


  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Login failed for ${email} (status: ${res.status}): ${JSON.stringify(data)}`);
  }

  const setCookie = res.headers.get("set-cookie") || "";
  const match = setCookie.match(/horizon_session=([^;]+)/);
  const cookie = match ? `horizon_session=${match[1]}` : "";

  return {
    cookie,
    role: data?.user?.role || "",
  };
}

async function testPrivacyLeakage() {
  console.log("===============================================================");
  console.log("   HORIZON PORTAL — PRIVACY & SENSITIVE FIELD AUDIT TEST       ");
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

  // 1. Unauthenticated Access Protection Check
  console.log("--- 1. Testing Unauthenticated Request Protection ---");
  const unauthRes = await fetch(`${BASE_URL}/api/v1/employees`);
  assert(
    unauthRes.status === 401,
    `Unauthenticated request to /api/v1/employees rejected with HTTP 401 (Got: ${unauthRes.status})`
  );

  // 2. Authenticate as Admin user
  console.log("\n--- 2. Authenticating as Demo Admin ---");
  const { cookie } = await loginAs("admin@growmar.com", "Admin@Horizon2026!");
  assert(Boolean(cookie), "Admin session cookie obtained successfully");

  // 3. Audit Directory API Response (GET /api/v1/employees)
  console.log("\n--- 3. Auditing Employee Directory API ---");
  const dirRes = await fetch(`${BASE_URL}/api/v1/employees?pageSize=50`, {
    headers: { Cookie: cookie },
  });
  assert(dirRes.status === 200, `Directory API responds with HTTP 200 (Status: ${dirRes.status})`);

  const dirJson = await dirRes.json();
  assert(Array.isArray(dirJson.data), "Directory response contains data array");
  assert(dirJson.data?.length > 0, `Directory returned ${dirJson.data?.length} records`);

  const dirViolations = recursivelyAuditKeys(dirJson);
  assert(
    dirViolations.length === 0,
    "Directory serialized response contains ZERO prohibited private fields",
    dirViolations.join("\n")
  );

  // Verify safe fields ARE present
  const sampleEmp = dirJson.data[0];
  assert(Boolean(sampleEmp.id), "Safe field 'id' is present");
  assert(Boolean(sampleEmp.name), "Safe field 'name' is present");
  assert(Boolean(sampleEmp.email), "Safe field 'email' is present");
  assert(Boolean(sampleEmp.status), "Safe field 'status' is present");
  assert(sampleEmp.salary === undefined, "Critical: 'salary' property is strictly undefined");

  // 4. Audit Individual Profile API Responses (GET /api/v1/employees/[id])
  console.log("\n--- 4. Auditing Individual Employee Profile APIs ---");
  const testIds = ["EMP-001", "EMP-002", "EMP-003", "EMP-004"];

  for (const id of testIds) {
    console.log(`\nAuditing Profile: ${id}`);
    const profRes = await fetch(`${BASE_URL}/api/v1/employees/${id}`, {
      headers: { Cookie: cookie },
    });
    assert(profRes.status === 200, `Profile endpoint for ${id} returns HTTP 200`);

    const profJson = await profRes.json();
    assert(Boolean(profJson.data), `Profile data object exists for ${id}`);

    const profViolations = recursivelyAuditKeys(profJson);
    assert(
      profViolations.length === 0,
      `Profile response for ${id} (including nested manager & reports) contains ZERO private fields`,
      profViolations.join("\n")
    );

    const profileData = profJson.data;
    assert(profileData.salary === undefined, `Profile ${id}: 'salary' is strictly undefined`);

    if (profileData.manager) {
      assert(
        profileData.manager.salary === undefined,
        `Nested manager object in ${id} does NOT leak salary`
      );
    }

    if (profileData.directReports && profileData.directReports.length > 0) {
      for (const report of profileData.directReports) {
        assert(
          report.salary === undefined,
          `Nested direct report (${report.id}) in ${id} does NOT leak salary`
        );
      }
    }
  }

  console.log("\n===============================================================");
  console.log(`TOTAL PRIVACY TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log("===============================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

testPrivacyLeakage().catch((err) => {
  console.error("Privacy test execution error:", err);
  process.exit(1);
});

export {};
