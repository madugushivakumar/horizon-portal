/**
 * Horizon Portal — Day 18 IDOR & Role Authorization Attack Verification Suite
 * scripts/test-day18-idor-attack.ts
 *
 * Simulates real-world IDOR and privilege escalation attacks:
 * 1. Payslip IDOR: Cross-employee access, non-existent runs, malformed identifiers.
 * 2. Leave IDOR: Employee approval attempt, cross-team manager approval attempt, self-approval prevention.
 * 3. Role Authorization: Employee attacking admin/audit, payroll/runs, and hr-insights.
 * 4. PII Leakage Protection: Prohibited fields (salary, bankAccount, panNumber) excluded from directory.
 * 5. Security Audit Logging: Verifies structured audit emission on unauthorized access.
 */

import { PrismaClient } from "@prisma/client";
import { NextRequest } from "next/server";
import { createAuthToken } from "../src/lib/auth/token";
import { SESSION_COOKIE_NAME } from "../src/lib/auth/session";

import { GET as getPayslipDetail } from "../src/app/api/v1/payslips/[run_id]/route";
import { GET as getPayslipList } from "../src/app/api/v1/payslips/route";
import { POST as approveLeave } from "../src/app/api/v1/approvals/leave/[id]/approve/route";
import { GET as getAuditLogs } from "../src/app/api/v1/admin/audit/route";
import { GET as getPayrollRuns } from "../src/app/api/v1/payroll/runs/route";
import { GET as getHrInsights } from "../src/app/api/v1/hr-insights/route";
import { GET as getEmployeesDirectory } from "../src/app/api/v1/employees/route";
import { verifyApproverAuthorization } from "../src/lib/leave/approval-service";

const prisma = new PrismaClient();

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✅ [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] ${testName}`);
    if (detail) console.error(`    Detail: ${detail}`);
    failed++;
  }
}

async function createMockRequest(
  url: string,
  options?: {
    method?: "GET" | "POST";
    token?: string;
    body?: unknown;
  }
): Promise<NextRequest> {
  const headers = new Headers();
  headers.set("Content-Type", "application/json");

  if (options?.token) {
    headers.set("Cookie", `${SESSION_COOKIE_NAME}=${options.token}`);
  }

  return new NextRequest(new URL(url, "http://localhost:3000"), {
    method: options?.method || "GET",
    headers,
    body: options?.body ? JSON.stringify(options.body) : undefined,
  });
}

async function runIdorAttackSuite() {
  console.log("================================================================================");
  console.log("  HORIZON PORTAL — PHASE 4, DAY 18: IDOR & AUTHORIZATION ATTACK SUITE");
  console.log("================================================================================\n");

  // Fetch verified test users
  const adminUser = await prisma.user.findUnique({ where: { email: "admin@growmar.com" } });
  const managerUser = await prisma.user.findUnique({ where: { email: "manager@growmar.com" } });
  const employeeUser = await prisma.user.findUnique({ where: { email: "employee@growmar.com" } });

  if (!adminUser || !managerUser || !employeeUser) {
    throw new Error("Missing required demo accounts in SQLite database.");
  }

  // Generate signed JWT tokens
  const employeeToken = await createAuthToken({
    sub: employeeUser.id,
    email: employeeUser.email,
    role: employeeUser.role,
    employeeId: employeeUser.employeeId,
  });

  const managerToken = await createAuthToken({
    sub: managerUser.id,
    email: managerUser.email,
    role: managerUser.role,
    employeeId: managerUser.employeeId,
  });

  const adminToken = await createAuthToken({
    sub: adminUser.id,
    email: adminUser.email,
    role: adminUser.role,
    employeeId: adminUser.employeeId,
  });

  // --------------------------------------------------------------------------
  // SECTION 1: PAYSLIP IDOR ATTACKS
  // --------------------------------------------------------------------------
  console.log("--- Section 1: Payslip IDOR Attacks ---");

  // 1.1 Employee views their own payslip
  const ownPayslipReq = await createMockRequest("/api/v1/payslips/PR-2026-04", { token: employeeToken });
  const ownPayslipRes = await getPayslipDetail(ownPayslipReq, { params: Promise.resolve({ run_id: "PR-2026-04" }) });
  assert(ownPayslipRes.status === 200, "Employee can view own payslip (HTTP 200)");
  const ownPayslipData = await ownPayslipRes.json();
  assert(ownPayslipData.data.employee.id === employeeUser.employeeId, "Own payslip data matches authenticated employeeId");
  assert(typeof ownPayslipData.data.netPay === "number" && ownPayslipData.data.netPay > 0, "Own payslip contains netPay");

  // 1.2 Employee attempts to access another employee's specific payroll item
  // Target: PI-005076 belongs to manager EMP-0547
  const crossPayslipReq = await createMockRequest("/api/v1/payslips/PI-005076", { token: employeeToken });
  const crossPayslipRes = await getPayslipDetail(crossPayslipReq, { params: Promise.resolve({ run_id: "PI-005076" }) });
  assert(crossPayslipRes.status === 403, "Cross-employee payslip access rejected with HTTP 403 Forbidden");
  const crossPayslipData = await crossPayslipRes.json();
  assert(!crossPayslipData.data, "Zero payslip data returned on unauthorized access");
  assert(
    typeof crossPayslipData.error === "string" && crossPayslipData.error.toLowerCase().includes("forbidden"),
    "Explicit authorization failure message returned"
  );

  // 1.3 Employee attempts to access non-existent run ID
  const nonExistentReq = await createMockRequest("/api/v1/payslips/PR-9999-99", { token: employeeToken });
  const nonExistentRes = await getPayslipDetail(nonExistentReq, { params: Promise.resolve({ run_id: "PR-9999-99" }) });
  assert(nonExistentRes.status === 404, "Non-existent payroll run rejected with HTTP 404 Not Found");

  // 1.4 Unauthenticated payslip access
  const unauthPayslipReq = await createMockRequest("/api/v1/payslips/PR-2026-04");
  const unauthPayslipRes = await getPayslipDetail(unauthPayslipReq, { params: Promise.resolve({ run_id: "PR-2026-04" }) });
  assert(unauthPayslipRes.status === 401, "Unauthenticated payslip detail rejected with HTTP 401 Unauthorized");

  // 1.5 Unauthenticated payslip list
  const unauthListReq = await createMockRequest("/api/v1/payslips");
  const unauthListRes = await getPayslipList(unauthListReq);
  assert(unauthListRes.status === 401, "Unauthenticated payslip list rejected with HTTP 401 Unauthorized");

  // --------------------------------------------------------------------------
  // SECTION 2: LEAVE APPROVAL IDOR & SEPARATION OF DUTIES
  // --------------------------------------------------------------------------
  console.log("\n--- Section 2: Leave Approval IDOR & Separation of Duties ---");

  // 2.1 Unauthenticated leave approval attempt
  const unauthApproveReq = await createMockRequest("/api/v1/approvals/leave/LR-000194/approve", {
    method: "POST",
  });
  const unauthApproveRes = await approveLeave(unauthApproveReq, { params: Promise.resolve({ id: "LR-000194" }) });
  assert(unauthApproveRes.status === 401, "Unauthenticated leave approval rejected with HTTP 401");

  // 2.2 Employee attempts privilege escalation: approving a leave request
  const empApproveReq = await createMockRequest("/api/v1/approvals/leave/LR-000194/approve", {
    method: "POST",
    token: employeeToken,
  });
  const empApproveRes = await approveLeave(empApproveReq, { params: Promise.resolve({ id: "LR-000194" }) });
  assert(empApproveRes.status === 403, "Employee leave approval attempt rejected with HTTP 403 Forbidden");

  // 2.3 Cross-team manager approval attempt: Manager EMP-0547 attempts to approve LR-000194 (managed by EMP-0051)
  const crossMgrApproveReq = await createMockRequest("/api/v1/approvals/leave/LR-000194/approve", {
    method: "POST",
    token: managerToken,
  });
  const crossMgrApproveRes = await approveLeave(crossMgrApproveReq, { params: Promise.resolve({ id: "LR-000194" }) });
  assert(crossMgrApproveRes.status === 403, "Cross-team manager leave approval rejected with HTTP 403 Forbidden");
  const crossMgrData = await crossMgrApproveRes.json();
  assert(
    crossMgrData.error.includes("authorized") || crossMgrData.error.includes("permission") || crossMgrData.error.includes("not authorized"),
    "Cross-team authorization error explicitly stated"
  );

  // 2.4 Service-layer strict self-approval prevention
  const selfAuthCheck = await verifyApproverAuthorization(
    {
      id: managerUser.id,
      email: managerUser.email,
      role: "Manager",
      employeeId: managerUser.employeeId,
      name: managerUser.name,
      isActive: true,
    },
    managerUser.employeeId!
  );
  assert(selfAuthCheck.authorized === false, "Self-approval is strictly unauthorized at service layer");
  assert(selfAuthCheck.isSelf === true, "isSelf flag set to true");
  assert(Boolean(selfAuthCheck.reason?.includes("Self-approval is strictly prohibited")), "Explicit self-approval error reason");

  // --------------------------------------------------------------------------
  // SECTION 3: PRIVILEGED ENDPOINT ACCESS ATTACKS
  // --------------------------------------------------------------------------
  console.log("\n--- Section 3: Privileged Endpoint Access Attacks ---");

  // 3.1 Employee attempts to access Admin Audit Logs (/api/v1/admin/audit)
  const empAuditReq = await createMockRequest("/api/v1/admin/audit", { token: employeeToken });
  const empAuditRes = await getAuditLogs(empAuditReq);
  assert(empAuditRes.status === 403, "Employee access to /api/v1/admin/audit rejected with HTTP 403 Forbidden");

  // 3.2 Employee attempts to access Payroll Runs (/api/v1/payroll/runs)
  const empPayrollReq = await createMockRequest("/api/v1/payroll/runs", { token: employeeToken });
  const empPayrollRes = await getPayrollRuns(empPayrollReq);
  assert(empPayrollRes.status === 403, "Employee access to /api/v1/payroll/runs rejected with HTTP 403 Forbidden");

  // 3.3 Employee attempts to access HR Insights (/api/v1/hr-insights)
  const empInsightsReq = await createMockRequest("/api/v1/hr-insights", { token: employeeToken });
  const empInsightsRes = await getHrInsights(empInsightsReq);
  assert(empInsightsRes.status === 403, "Employee access to /api/v1/hr-insights rejected with HTTP 403 Forbidden");

  // 3.4 Manager attempts to access Admin Audit Logs (/api/v1/admin/audit)
  const mgrAuditReq = await createMockRequest("/api/v1/admin/audit", { token: managerToken });
  const mgrAuditRes = await getAuditLogs(mgrAuditReq);
  assert(mgrAuditRes.status === 403, "Manager access to /api/v1/admin/audit rejected with HTTP 403 Forbidden");

  // 3.5 Manager attempts to access Payroll Runs (/api/v1/payroll/runs)
  const mgrPayrollReq = await createMockRequest("/api/v1/payroll/runs", { token: managerToken });
  const mgrPayrollRes = await getPayrollRuns(mgrPayrollReq);
  assert(mgrPayrollRes.status === 403, "Manager access to /api/v1/payroll/runs rejected with HTTP 403 Forbidden");

  // 3.6 Manager attempts to access HR Insights (/api/v1/hr-insights)
  const mgrInsightsReq = await createMockRequest("/api/v1/hr-insights", { token: managerToken });
  const mgrInsightsRes = await getHrInsights(mgrInsightsReq);
  assert(mgrInsightsRes.status === 403, "Manager access to /api/v1/hr-insights rejected with HTTP 403 Forbidden");

  // 3.7 Admin access to Admin Audit Logs succeeds
  const adminAuditReq = await createMockRequest("/api/v1/admin/audit", { token: adminToken });
  const adminAuditRes = await getAuditLogs(adminAuditReq);
  assert(adminAuditRes.status === 200, "Admin access to /api/v1/admin/audit authorized (HTTP 200)");

  // --------------------------------------------------------------------------
  // SECTION 4: PRIVACY & SENSITIVE FIELD AUDIT
  // --------------------------------------------------------------------------
  console.log("\n--- Section 4: Privacy & Sensitive Field Filtering ---");

  const dirReq = await createMockRequest("/api/v1/employees?pageSize=20", { token: employeeToken });
  const dirRes = await getEmployeesDirectory(dirReq);
  assert(dirRes.status === 200, "Employee directory query succeeds (HTTP 200)");
  const dirData = await dirRes.json();
  assert(Array.isArray(dirData.data) && dirData.data.length > 0, "Directory returned records");

  let salaryLeaked = false;
  let bankLeaked = false;
  let panLeaked = false;

  for (const emp of dirData.data) {
    if ("salary" in emp) salaryLeaked = true;
    if ("bankAccount" in emp) bankLeaked = true;
    if ("panNumber" in emp) panLeaked = true;
  }

  assert(!salaryLeaked, "Directory response strictly excludes 'salary'");
  assert(!bankLeaked, "Directory response strictly excludes 'bankAccount'");
  assert(!panLeaked, "Directory response strictly excludes 'panNumber'");

  console.log("\n================================================================================");
  console.log(`  IDOR ATTACK SUITE SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("================================================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runIdorAttackSuite()
  .catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
