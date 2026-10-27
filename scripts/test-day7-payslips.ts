/**
 * Horizon Portal — Day 7 Payslips Automated Verification Test Suite
 * scripts/test-day7-payslips.ts
 *
 * Comprehensive Phase 2 Day 7 Test Suite covering:
 * 1. Original Dataset Integrity & Record Counts (2,469 payslips, 18 payroll runs)
 * 2. Three-Employee Exact Net Pay & Precision Verification (Decimal-safe comparison)
 * 3. INR Formatting & Indian Numbering Words System Verification
 * 4. Server-Side Employee Ownership & Cross-Employee Protection (HTTP 403 Forbidden)
 * 5. Unauthenticated Request Rejection (HTTP 401 Unauthorized)
 * 6. Nonexistent Record Handling (HTTP 404 Not Found)
 * 7. Shared URL Protection & Cache-Control Headers
 * 8. Zero Private Data Leakage in Error Responses
 */

import { prisma } from "../src/lib/prisma";
import { createAuthToken } from "../src/lib/auth/token";
import { SESSION_COOKIE_NAME } from "../src/lib/auth/session";
import { GET as getPayslipList } from "../src/app/api/v1/payslips/route";
import { GET as getPayslipDetail } from "../src/app/api/v1/payslips/[run_id]/route";
import { formatMoney, amountInWords, inrFormatter } from "../src/lib/payroll/formatters";
import { NextRequest } from "next/server";
import fs from "fs";
import path from "path";

// Ensure AUTH_SECRET is set for token signing
if (!process.env.AUTH_SECRET) {
  process.env.AUTH_SECRET = "test-jwt-secret-horizon-portal-phase-2-day-7-secure-key";
}

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

// Decimal-safe exact monetary comparison
function exactMoneyEqual(a: number, b: number): boolean {
  return Math.abs(a - b) < 0.001;
}

// Mock NextRequest with authenticated session cookie
function createMockRequest(url: string, token?: string): NextRequest {
  const headers = new Headers();
  if (token) {
    headers.set("cookie", `${SESSION_COOKIE_NAME}=${token}`);
  }
  return new NextRequest(new URL(url, "http://localhost:3000"), {
    method: "GET",
    headers,
  });
}

async function runDay7Tests() {
  console.log("=========================================================================");
  console.log("   HORIZON PORTAL — DAY 7 PAYSLIP VIEWER & DOWNLOAD VERIFICATION SUITE   ");
  console.log("=========================================================================\n");

  // ─────────────────────────────────────────────────────────────────────────
  // 1. Original Dataset & Database Record Counts
  // ─────────────────────────────────────────────────────────────────────────
  console.log("--- 1. Original Payroll Datasets Verification ---");
  const payslipsJsonPath = path.join(process.cwd(), "03_Data_Pack", "payslips.json");
  const payrollRunsJsonPath = path.join(process.cwd(), "03_Data_Pack", "payroll_runs.json");

  const rawPayslips = JSON.parse(fs.readFileSync(payslipsJsonPath, "utf-8"));
  const rawPayrollRuns = JSON.parse(fs.readFileSync(payrollRunsJsonPath, "utf-8"));

  const dbPayslipCount = await prisma.payslip.count();
  const dbPayrollRunCount = await prisma.payrollRun.count();

  assert(rawPayslips.length === 2469, "03_Data_Pack/payslips.json has exactly 2,469 records");
  assert(rawPayrollRuns.length === 18, "03_Data_Pack/payroll_runs.json has exactly 18 records");
  assert(
    dbPayslipCount === rawPayslips.length,
    `Database payslips count (${dbPayslipCount}) matches source JSON (2469)`
  );
  assert(
    dbPayrollRunCount === rawPayrollRuns.length,
    `Database payroll_runs count (${dbPayrollRunCount}) matches source JSON (18)`
  );

  // ─────────────────────────────────────────────────────────────────────────
  // 2. Three Representative Employees Net Pay Verification (Section 10)
  // ─────────────────────────────────────────────────────────────────────────
  console.log("\n--- 2. Three-Employee Exact Net Pay & Precision Verification ---");

  interface TargetEmployeeSpec {
    empId: string;
    expectedName: string;
    roleDescription: string;
    runId: string;
    expectedItemId: string;
  }

  const testEmployees: TargetEmployeeSpec[] = [
    {
      empId: "EMP-0188",
      expectedName: "Sasi Shetty",
      roleDescription: "Individual Contributor (Employee)",
      runId: "PR-2026-04",
      expectedItemId: "PI-004883",
    },
    {
      empId: "EMP-0547",
      expectedName: "Imran Philip",
      roleDescription: "Manager",
      runId: "PR-2026-04",
      expectedItemId: "PI-005076",
    },
    {
      empId: "EMP-0011",
      expectedName: "Hemant Mathew",
      roleDescription: "HR Specialist",
      runId: "PR-2026-04",
      expectedItemId: "PI-004797",
    },
  ];

  for (const empSpec of testEmployees) {
    console.log(`\n▶ Verifying Employee: ${empSpec.empId} (${empSpec.roleDescription})`);

    // Find original source JSON record
    const sourceRecord = rawPayslips.find(
      (p: { employee_id: string; run_id: string }) =>
        p.employee_id === empSpec.empId && p.run_id === empSpec.runId
    );
    assert(!!sourceRecord, `Source record found for ${empSpec.empId} in ${empSpec.runId}`);
    assert(
      sourceRecord.payroll_item_id === empSpec.expectedItemId,
      `Source item identifier matches expected ${empSpec.expectedItemId}`
    );

    // Find database record
    const dbRecord = await prisma.payslip.findUnique({
      where: { id: sourceRecord.payroll_item_id },
      include: { employee: true },
    });
    assert(!!dbRecord, `Database record found for item ${sourceRecord.payroll_item_id}`);

    // Verify employee ownership mapping
    assert(
      dbRecord?.employeeId === empSpec.empId,
      `Ownership mapping: payslip belongs to ${empSpec.empId}`
    );
    assert(
      dbRecord?.employee.fullName === empSpec.expectedName,
      `Employee identity matches expected ${empSpec.expectedName}`
    );

    // Verify exact monetary breakdown
    assert(
      exactMoneyEqual(dbRecord?.basic ?? 0, sourceRecord.basic),
      `Basic salary: Source ${sourceRecord.basic} === DB ${dbRecord?.basic}`
    );
    assert(
      exactMoneyEqual(dbRecord?.hra ?? 0, sourceRecord.hra),
      `HRA: Source ${sourceRecord.hra} === DB ${dbRecord?.hra}`
    );
    assert(
      exactMoneyEqual(dbRecord?.grossPay ?? 0, sourceRecord.gross_pay),
      `Gross Pay: Source ${sourceRecord.gross_pay} === DB ${dbRecord?.grossPay}`
    );
    assert(
      exactMoneyEqual(dbRecord?.totalDeductions ?? 0, sourceRecord.total_deductions),
      `Total Deductions: Source ${sourceRecord.total_deductions} === DB ${dbRecord?.totalDeductions}`
    );
    assert(
      exactMoneyEqual(dbRecord?.netPay ?? 0, sourceRecord.net_pay),
      `Net Pay: Source ${sourceRecord.net_pay} === DB ${dbRecord?.netPay}`
    );

    // Verify exact INR formatting
    const formattedExpected = inrFormatter.format(sourceRecord.net_pay);
    const formattedActual = formatMoney(dbRecord?.netPay);
    assert(
      formattedActual === formattedExpected,
      `INR formatting matches Intl.NumberFormat: ${formattedActual}`
    );

    // Decimal-safe precision check: gross - deductions === net
    const computedNet = (dbRecord?.grossPay ?? 0) - (dbRecord?.totalDeductions ?? 0);
    assert(
      exactMoneyEqual(computedNet, dbRecord?.netPay ?? 0),
      `Mathematical reconciliation: Gross (${dbRecord?.grossPay}) - Deductions (${dbRecord?.totalDeductions}) === Net Pay (${dbRecord?.netPay})`
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 3. Indian Rupee Formatting & Words Conversion Verification
  // ─────────────────────────────────────────────────────────────────────────
  console.log("\n--- 3. Monetary Formatter & Indian Numbering Words ---");
  const testAmount = 134247.96;
  const inWords = amountInWords(testAmount);
  assert(
    inWords.includes("One Lakh Thirty-Four Thousand") && inWords.includes("Ninety-Six Paise"),
    `Amount in words converted correctly: "${inWords}"`
  );
  assert(
    formatMoney(0) === inrFormatter.format(0),
    `Zero formatted correctly as INR: "${formatMoney(0)}"`
  );

  // ─────────────────────────────────────────────────────────────────────────
  // 4. Server-Side Ownership Protection & API Security (Sections 11 & 12)
  // ─────────────────────────────────────────────────────────────────────────
  console.log("\n--- 4. Cross-Employee Ownership Protection & Security Suite ---");

  // Lookup demo users from database
  const userA = await prisma.user.findFirst({ where: { employeeId: "EMP-0188" } });
  const userB = await prisma.user.findFirst({ where: { employeeId: "EMP-0547" } });

  assert(!!userA, "Employee A (EMP-0188) user found in DB");
  assert(!!userB, "Employee B (EMP-0547) user found in DB");

  const tokenA = userA
    ? await createAuthToken({
        sub: userA.id,
        email: userA.email,
        role: userA.role,
        name: userA.name,
        employeeId: userA.employeeId,
      })
    : "";

  const tokenB = userB
    ? await createAuthToken({
        sub: userB.id,
        email: userB.email,
        role: userB.role,
        name: userB.name,
        employeeId: userB.employeeId,
      })
    : "";

  // Test A: Unauthenticated request to /api/v1/payslips rejected with 401
  {
    const req = createMockRequest("http://localhost:3000/api/v1/payslips");
    const res = await getPayslipList(req);
    assert(res.status === 401, "Unauthenticated payslip list request rejected with HTTP 401");
  }

  // Test B: Unauthenticated request to /api/v1/payslips/[run_id] rejected with 401
  {
    const req = createMockRequest("http://localhost:3000/api/v1/payslips/PR-2026-04");
    const res = await getPayslipDetail(req, { params: Promise.resolve({ run_id: "PR-2026-04" }) });
    assert(res.status === 401, "Unauthenticated payslip detail request rejected with HTTP 401");
  }

  // Test C: Employee A fetches their own payslip list
  {
    const req = createMockRequest("http://localhost:3000/api/v1/payslips", tokenA);
    const res = await getPayslipList(req);
    assert(res.status === 200, "Employee A can fetch their payslip list (HTTP 200)");

    const json = await res.json();
    assert(Array.isArray(json.data), "Response data is an array");
    assert(json.data.length === 6, `Employee A received exactly their 6 payslips (got ${json.data.length})`);

    // Verify chronological order (newest first)
    const dates = json.data.map((p: { periodStart: string }) => p.periodStart);
    const isSorted = dates.every((d: string, i: number) => i === 0 || d <= dates[i - 1]);
    assert(isSorted, "Payslip list is chronologically sorted (newest period first)");

    // Verify no records from Employee B are returned
    const leakedB = json.data.some((p: { id: string }) => p.id === "PI-005076");
    assert(!leakedB, "List does not leak Employee B's payslip PI-005076");

    // Verify Cache-Control header
    const cacheHeader = res.headers.get("Cache-Control");
    assert(
      Boolean(cacheHeader?.includes("private") && cacheHeader?.includes("no-cache")),
      "List response includes strict private Cache-Control header"
    );
  }

  // Test D: Employee A fetches their OWN payslip (PR-2026-04 / PI-004883)
  {
    const req = createMockRequest("http://localhost:3000/api/v1/payslips/PR-2026-04", tokenA);
    const res = await getPayslipDetail(req, { params: Promise.resolve({ run_id: "PR-2026-04" }) });
    assert(res.status === 200, "Employee A can view their own payslip (HTTP 200)");

    const json = await res.json();
    assert(json.data.id === "PI-004883", "Detail returns correct payroll_item_id PI-004883");
    assert(json.data.employee.id === "EMP-0188", "Detail returns authenticated employee ID EMP-0188");
    assert(json.data.employee.fullName === "Sasi Shetty", "Detail returns correct employee name");
    assert(exactMoneyEqual(json.data.netPay, 134247.96), "Detail returns exact net pay ₹1,34,247.96");
  }

  // Test E: Employee A attempts to access Employee B's payslip (PI-005076) -> HTTP 403 Forbidden!
  {
    const req = createMockRequest("http://localhost:3000/api/v1/payslips/PI-005076", tokenA);
    const res = await getPayslipDetail(req, { params: Promise.resolve({ run_id: "PI-005076" }) });
    assert(
      res.status === 403,
      "CRITICAL: Cross-employee access returns HTTP 403 Forbidden"
    );

    const json = await res.json();
    assert(
      !json.data,
      "Zero private data returned when Employee A requests Employee B's payslip"
    );
    assert(
      typeof json.error === "string" && json.error.toLowerCase().includes("forbidden"),
      "Error response clearly communicates access forbidden"
    );
  }

  // Test F: Employee B accesses their own payslip (PI-005076) -> HTTP 200 OK!
  {
    const req = createMockRequest("http://localhost:3000/api/v1/payslips/PI-005076", tokenB);
    const res = await getPayslipDetail(req, { params: Promise.resolve({ run_id: "PI-005076" }) });
    assert(res.status === 200, "Employee B can access their own payslip PI-005076 (HTTP 200)");

    const json = await res.json();
    assert(json.data.employee.id === "EMP-0547", "Detail returns Imran Philip's employee ID EMP-0547");
    assert(exactMoneyEqual(json.data.netPay, 215682.42), "Detail returns exact net pay ₹2,15,682.42");
  }

  // Test G: Employee B attempts to access Employee A's payslip (PI-004883) -> HTTP 403 Forbidden!
  {
    const req = createMockRequest("http://localhost:3000/api/v1/payslips/PI-004883", tokenB);
    const res = await getPayslipDetail(req, { params: Promise.resolve({ run_id: "PI-004883" }) });
    assert(
      res.status === 403,
      "CRITICAL: Employee B is forbidden from accessing Employee A's payslip (HTTP 403)"
    );

    const json = await res.json();
    assert(!json.data, "Zero private data returned to Employee B");
  }

  // Test H: Nonexistent payroll run ID -> HTTP 404 Not Found
  {
    const req = createMockRequest("http://localhost:3000/api/v1/payslips/NONEXISTENT-9999", tokenA);
    const res = await getPayslipDetail(req, {
      params: Promise.resolve({ run_id: "NONEXISTENT-9999" }),
    });
    assert(res.status === 404, "Nonexistent payroll run returns HTTP 404 Not Found");
  }

  // Test I: Shared URL Tampering Protection
  {
    // A shared URL like /payslips/PI-005076 opened by Employee A is rejected at server level
    const tamperedReq = createMockRequest(
      "http://localhost:3000/api/v1/payslips/PI-005076",
      tokenA
    );
    const tamperedRes = await getPayslipDetail(tamperedReq, {
      params: Promise.resolve({ run_id: "PI-005076" }),
    });
    assert(
      tamperedRes.status === 403,
      "URL tampering: opening shared URL of another employee is rejected (HTTP 403)"
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Summary
  // ─────────────────────────────────────────────────────────────────────────
  console.log("\n=========================================================================");
  console.log(`DAY 7 PAYSLIPS TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("=========================================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runDay7Tests()
  .catch((err) => {
    console.error("Test execution failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
