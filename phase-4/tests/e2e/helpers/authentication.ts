import fs from "fs";
import path from "path";

/**
 * Credentials provider for Playwright E2E tests.
 *
 * Security Requirements:
 * 1. Hosted tests require explicit environment variables (E2E_*).
 * 2. Never print credentials, passwords, or tokens in logs or console.
 * 3. Never reuse Production credentials for testing.
 * 4. Local demo fallback only permitted when targeting local SQLite environment.
 */

export interface AccountCredentials {
  email: string;
  password: string;
  role: string;
  name: string;
}

const isHosted = Boolean(process.env.PLAYWRIGHT_BASE_URL);

let cachedDemoUsers: Array<{ email: string; password?: string; role: string; name: string }> | null = null;

function getDemoUsers() {
  if (cachedDemoUsers) return cachedDemoUsers;
  try {
    const demoPath = path.join(process.cwd(), "demo_users.json");
    if (fs.existsSync(demoPath)) {
      cachedDemoUsers = JSON.parse(fs.readFileSync(demoPath, "utf-8"));
    }
  } catch {
    cachedDemoUsers = [];
  }
  return cachedDemoUsers || [];
}

function resolvePassword(role: string, email: string, envVarPassword?: string): string {
  if (envVarPassword) {
    return envVarPassword;
  }

  if (isHosted) {
    throw new Error(
      `[SECURITY ERROR] Missing environment variable for ${role} test password on hosted environment. Hosted tests must supply explicit credentials (E2E_${role.toUpperCase()}_PASSWORD) and must never use local demo fallbacks.`
    );
  }

  const users = getDemoUsers();
  const found = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!found?.password) {
    throw new Error(`[CREDENTIAL ERROR] No test password could be resolved for ${role} (${email}).`);
  }
  return found.password;
}

export function getAdminCredentials(): AccountCredentials {
  const email = process.env.E2E_ADMIN_EMAIL || process.env.TEST_ADMIN_EMAIL || "admin@growmar.com";
  const password = resolvePassword("Admin", email, process.env.E2E_ADMIN_PASSWORD || process.env.TEST_ADMIN_PASSWORD);
  return { email, password, role: "Admin", name: "Alexander Wright" };
}

export function getEmployeeCredentials(): AccountCredentials {
  const email = process.env.E2E_EMPLOYEE_EMAIL || process.env.TEST_EMPLOYEE_EMAIL || "employee@growmar.com";
  const password = resolvePassword("Employee", email, process.env.E2E_EMPLOYEE_PASSWORD || process.env.TEST_EMPLOYEE_PASSWORD);
  return { email, password, role: "Employee", name: "Sophie Chen" };
}

export function getManagerCredentials(): AccountCredentials {
  const email = process.env.E2E_MANAGER_EMAIL || process.env.TEST_MANAGER_EMAIL || "manager@growmar.com";
  const password = resolvePassword("Manager", email, process.env.E2E_MANAGER_PASSWORD || process.env.TEST_MANAGER_PASSWORD);
  return { email, password, role: "Manager", name: "Marcus Brody" };
}

export function getHRCredentials(): AccountCredentials {
  const email = process.env.E2E_HR_EMAIL || process.env.TEST_HR_EMAIL || "hr@growmar.com";
  const password = resolvePassword("HR", email, process.env.E2E_HR_PASSWORD || process.env.TEST_HR_PASSWORD);
  return { email, password, role: "HR", name: "Eleanor Vance" };
}
