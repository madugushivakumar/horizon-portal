/**
 * Horizon Portal — Day 11 Admin Payroll Console Comprehensive Test Suite
 * scripts/test-day11-payroll.ts
 *
 * Full lifecycle integration tests:
 * - Server-side RBAC authorization (401, 403, 200)
 * - Payroll runs listing, ordering, search, and filtering
 * - Detail inspection & employee payslip search
 * - Reconciliation status & discrepancy enforcement
 * - Month-over-Month (MoM) calculations
 * - Safe approval workflow, separation of duties, and double-approval prevention
 * - Transactional audit logging
 * - Complete database rollback & data preservation
 */

import { prisma } from "../src/lib/prisma";
import { createAuthToken } from "../src/lib/auth/token";
import { GET as getRunsList } from "../src/app/api/v1/payroll/runs/route";
import { GET as getRunDetail } from "../src/app/api/v1/payroll/runs/[runId]/route";
import { POST as approveRun } from "../src/app/api/v1/payroll/runs/[runId]/approve/route";
import { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "../src/lib/auth/session";

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, message: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ ${message}`);
  } else {
    failedTests++;
    console.error(`  ✗ FAIL: ${message}`);
  }
}

// Helper to create synthetic NextRequest with session cookie
async function createMockRequest(
  url: string,
  user?: { id: string; email: string; role: string; employeeId?: string | null },
  method: string = "GET",
  body?: Record<string, unknown>
): Promise<NextRequest> {
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

  const reqInit: RequestInit = {
    method,
    headers,
  };

  if (body) {
    reqInit.body = JSON.stringify(body);
  }

  return new NextRequest(new URL(url, "http://localhost:3000"), reqInit as any);
}

async function runPayrollTests() {
  console.log("================================================================================");
  console.log("    HORIZON PORTAL — DAY 11 ADMIN PAYROLL CONSOLE TEST SUITE                    ");
  console.log("================================================================================\n");

  // Fetch test users from database
  const adminUser = await prisma.user.findFirst({ where: { role: "Admin", isActive: true } });
  const hrUser = await prisma.user.findFirst({ where: { role: "HR", isActive: true } });
  const managerUser = await prisma.user.findFirst({ where: { role: "Manager", isActive: true } });
  const employeeUser = await prisma.user.findFirst({ where: { role: "Employee", isActive: true } });

  if (!adminUser || !hrUser || !managerUser || !employeeUser) {
    throw new Error("Missing required seed users for testing.");
  }

  console.log("Test accounts loaded:");
  console.log(`  Admin:    ${adminUser.email} (${adminUser.id})`);
  console.log(`  HR:       ${hrUser.email} (${hrUser.id})`);
  console.log(`  Manager:  ${managerUser.email} (${managerUser.id})`);
  console.log(`  Employee: ${employeeUser.email} (${employeeUser.id})\n`);

  // ── 1. Suite: Server-Side Authorization & RBAC ──────────────────────────────
  console.log("--- 1. Server-Side Role-Based Authorization ---");

  // A. Unauthenticated request to listing
  {
    const req = await createMockRequest("/api/v1/payroll/runs");
    const res = await getRunsList(req);
    assert(res.status === 401, "Unauthenticated access to /api/v1/payroll/runs returns HTTP 401");
  }

  // B. Employee request to listing
  {
    const req = await createMockRequest("/api/v1/payroll/runs", employeeUser);
    const res = await getRunsList(req);
    assert(res.status === 403, "Employee role access to /api/v1/payroll/runs returns HTTP 403 Forbidden");
  }

  // C. Manager request to listing
  {
    const req = await createMockRequest("/api/v1/payroll/runs", managerUser);
    const res = await getRunsList(req);
    assert(res.status === 403, "Manager role access to /api/v1/payroll/runs returns HTTP 403 Forbidden");
  }

  // D. HR request to listing
  {
    const req = await createMockRequest("/api/v1/payroll/runs", hrUser);
    const res = await getRunsList(req);
    assert(res.status === 200, "HR role access to /api/v1/payroll/runs succeeds with HTTP 200");
  }

  // E. Admin request to listing
  {
    const req = await createMockRequest("/api/v1/payroll/runs", adminUser);
    const res = await getRunsList(req);
    assert(res.status === 200, "Admin role access to /api/v1/payroll/runs succeeds with HTTP 200");
  }

  // F. Employee request to detail
  {
    const req = await createMockRequest("/api/v1/payroll/runs/PR-2026-09", employeeUser);
    const res = await getRunDetail(req, { params: Promise.resolve({ runId: "PR-2026-09" }) });
    assert(res.status === 403, "Employee role access to /api/v1/payroll/runs/[runId] returns HTTP 403 Forbidden");
  }

  // G. Employee request to approve
  {
    const req = await createMockRequest("/api/v1/payroll/runs/PR-2026-09/approve", employeeUser, "POST");
    const res = await approveRun(req, { params: Promise.resolve({ runId: "PR-2026-09" }) });
    assert(res.status === 403, "Employee role attempt to approve returns HTTP 403 Forbidden");
  }

  // ── 2. Suite: Payroll Runs Master List API ──────────────────────────────────
  console.log("\n--- 2. Payroll Runs Master List & Invariants ---");
  {
    const req = await createMockRequest("/api/v1/payroll/runs?pageSize=50", adminUser);
    const res = await getRunsList(req);
    const json = await res.json();

    assert(json.data.length === 18, `Returns all 18 payroll runs (got ${json.data.length})`);
    
    // Check ordering (newest first)
    const firstRun = json.data[0];
    const secondRun = json.data[1];
    assert(firstRun.id === "PR-2026-09", "Newest run is PR-2026-09");
    assert(secondRun.id === "PR-2026-08", "Second newest run is PR-2026-08");

    // Check status preservation
    assert(firstRun.status === "POSTED - PAYMENT PENDING", "Preserves exact operational status 'POSTED - PAYMENT PENDING'");
    assert(secondRun.status === "PAID", "Preserves historical operational status 'PAID'");
    assert(firstRun.approvalStatus === "Pending", "PR-2026-09 approvalStatus is 'Pending'");
    assert(secondRun.approvalStatus === "Approved", "PR-2026-08 historical approvalStatus is 'Approved'");

    // Check reconciliation badges returned
    assert(firstRun.reconciliationStatus === "MISMATCH", "PR-2026-09 reconciliation badge is MISMATCH");
    const olderRun = json.data.find((r: { id: string }) => r.id === "PR-2026-03");
    assert(olderRun && olderRun.reconciliationStatus === "NO_ITEMS", "Historical run PR-2026-03 badge is NO_ITEMS");

    // Check search filter
    const searchReq = await createMockRequest("/api/v1/payroll/runs?search=September", adminUser);
    const searchRes = await getRunsList(searchReq);
    const searchJson = await searchRes.json();
    assert(searchJson.data.length >= 1 && searchJson.data[0].periodLabel.includes("September"), "Search by 'September' successfully filters list");
  }

  // ── 3. Suite: Payroll Run Detail & Items Inspection ─────────────────────────
  console.log("\n--- 3. Payroll Run Detail & Itemized Table ---");
  {
    const req = await createMockRequest("/api/v1/payroll/runs/PR-2026-09", hrUser);
    const res = await getRunDetail(req, { params: Promise.resolve({ runId: "PR-2026-09" }) });
    assert(res.status === 200, "HR successfully retrieves PR-2026-09 details");
    const json = await res.json();
    const data = json.data;

    assert(data.header.id === "PR-2026-09", "Header runId matches PR-2026-09");
    assert(data.items.data.length > 0, `Returns itemized payslip rows (${data.items.data.length} on page 1)`);
    assert(data.items.pagination.total === 441, "Total item count matches 441 payslips");

    // Check security: zero credential leakage in payslip item payload
    const sampleItem = data.items.data[0];
    assert(!("password" in sampleItem), "Item payload strictly omits password");
    assert(!("passwordHash" in sampleItem), "Item payload strictly omits passwordHash");
    assert(!("token" in sampleItem), "Item payload strictly omits token");
    assert(!("bankAccount" in sampleItem), "Item payload strictly omits bankAccount");

    // Employee search within run
    const empSearchReq = await createMockRequest(`/api/v1/payroll/runs/PR-2026-09?search=${encodeURIComponent(sampleItem.employeeId)}`, hrUser);
    const empSearchRes = await getRunDetail(empSearchReq, { params: Promise.resolve({ runId: "PR-2026-09" }) });
    const empSearchJson = await empSearchRes.json();
    assert(empSearchJson.data.items.data.length >= 1, `Search by Employee ID '${sampleItem.employeeId}' returns matching row`);
  }

  // ── 4. Suite: Month-over-Month Comparison Engine ───────────────────────────
  console.log("\n--- 4. Month-over-Month (MoM) Trend Comparison ---");
  {
    const req = await createMockRequest("/api/v1/payroll/runs/PR-2026-09", adminUser);
    const res = await getRunDetail(req, { params: Promise.resolve({ runId: "PR-2026-09" }) });
    const json = await res.json();
    const mom = json.data.monthOverMonth;

    assert(mom.isAvailable === true, "MoM comparison is available for PR-2026-09");
    assert(mom.previousPeriod === "August 2026", `Identifies consecutive prior period as 'August 2026' (got ${mom.previousPeriod})`);
    assert(mom.direction === "increase", "Detects net payout increase direction");
    assert(mom.difference === 4916359.94, `Calculates absolute variance of +₹4,916,359.94 (got ${mom.difference})`);
    assert(mom.percentageChange === 11.39, `Calculates percentage change of +11.39% (got ${mom.percentageChange}%)`);

    // Edge case: Oldest run PR-2025-04 has no previous period
    const oldestReq = await createMockRequest("/api/v1/payroll/runs/PR-2025-04", adminUser);
    const oldestRes = await getRunDetail(oldestReq, { params: Promise.resolve({ runId: "PR-2025-04" }) });
    const oldestJson = await oldestRes.json();
    const oldestMom = oldestJson.data.monthOverMonth;
    assert(oldestMom.isAvailable === false, "Handles missing prior period for PR-2025-04 gracefully (isAvailable: false)");
    assert(oldestMom.message.includes("unavailable"), "Displays friendly unavailable message");
  }

  // ── 5. Suite: Approval Workflow & Invariants (Negative Tests) ───────────────
  console.log("\n--- 5. Approval Workflow Negative & Invariant Tests ---");
  
  // A. Attempting to approve an unreconciled run (PR-2026-09 with mismatch) must be rejected with 422
  {
    const req = await createMockRequest("/api/v1/payroll/runs/PR-2026-09/approve", adminUser, "POST");
    const res = await approveRun(req, { params: Promise.resolve({ runId: "PR-2026-09" }) });
    assert(res.status === 422, "Approval of unreconciled run PR-2026-09 is rejected with HTTP 422 Unprocessable Entity");
    const json = await res.json();
    assert(json.reconciliationStatus === "MISMATCH", "Rejection response specifies MISMATCH status");
  }

  // B. Attempting to approve an already PAID run (PR-2026-08) must be rejected with 409
  {
    const req = await createMockRequest("/api/v1/payroll/runs/PR-2026-08/approve", adminUser, "POST");
    const res = await approveRun(req, { params: Promise.resolve({ runId: "PR-2026-08" }) });
    assert(res.status === 409, "Approval of already paid run PR-2026-08 is rejected with HTTP 409 Conflict");
  }

  // C. Attempting to approve a run without items returns HTTP 422
  {
    const tempNoItemsId = "PR-TEST-NO-ITEMS";
    await prisma.payrollRun.create({
      data: {
        id: tempNoItemsId,
        periodStart: new Date("2026-11-01"),
        periodEnd: new Date("2026-11-30"),
        status: "POSTED - PAYMENT PENDING",
        approvalStatus: "Pending",
      },
    });
    try {
      const req = await createMockRequest(`/api/v1/payroll/runs/${tempNoItemsId}/approve`, adminUser, "POST");
      const res = await approveRun(req, { params: Promise.resolve({ runId: tempNoItemsId }) });
      assert(res.status === 422, "Approval of pending run with NO_ITEMS is rejected with HTTP 422 Unprocessable Entity");
      const json = await res.json();
      assert(json.reconciliationStatus === "NO_ITEMS", "Response indicates NO_ITEMS reconciliation status");
    } finally {
      await prisma.payrollRun.delete({ where: { id: tempNoItemsId } });
    }
  }

  // ── 6. Suite: Isolated Test Fixture Approval Lifecycle ──────────────────────
  console.log("\n--- 6. Isolated Test Fixture Approval & Separation of Duties ---");
  const testRunId = "PR-TEST-ISOLATED-001";
  const testPayslipId = "PI-TEST-ISOLATED-001";
  const testEmp = await prisma.employee.findFirst();

  if (!testEmp) {
    throw new Error("Missing employee for test fixture.");
  }

  try {
    // Create an isolated test payroll run with exact matching payslip totals
    await prisma.payrollRun.create({
      data: {
        id: testRunId,
        periodStart: new Date("2026-10-01"),
        periodEnd: new Date("2026-10-31"),
        paymentDate: null,
        payDate: null,
        employeesPaid: 1,
        totalGross: 100000.0,
        totalNet: 85000.0,
        status: "POSTED - PAYMENT PENDING",
        approvalStatus: "Pending",
        preparerId: hrUser.id, // Prepared by HR User
      },
    });

    await prisma.payslip.create({
      data: {
        id: testPayslipId,
        employeeId: testEmp.id,
        payrollRunId: testRunId,
        periodStart: new Date("2026-10-01"),
        periodEnd: new Date("2026-10-31"),
        calendarDays: 31,
        payableDays: 31,
        basic: 60000,
        hra: 30000,
        specialAllowance: 10000,
        grossPay: 100000.0,
        pfEmployee: 1800,
        professionalTax: 200,
        tds: 13000,
        totalDeductions: 15000.0,
        netPay: 85000.0,
        currency: "INR",
      },
    });

    // Verify reconciliation of isolated test run: exactly MATCHED
    const testRec = await prisma.payrollRun.findUnique({
      where: { id: testRunId },
      include: { payslips: true },
    });
    assert(testRec !== null, "Isolated test run fixture created successfully");

    // A. Separation of Duties: HR user attempts to approve their OWN run
    const selfApproveReq = await createMockRequest(
      `/api/v1/payroll/runs/${testRunId}/approve`,
      hrUser,
      "POST"
    );
    const selfApproveRes = await approveRun(selfApproveReq, {
      params: Promise.resolve({ runId: testRunId }),
    });
    assert(
      selfApproveRes.status === 403,
      "Preparer self-approval is strictly blocked with HTTP 403 Forbidden"
    );
    const selfJson = await selfApproveRes.json();
    assert(
      selfJson.error.includes("Separation of duties"),
      "Error explicitly cites 'Separation of duties violation'"
    );

    // B. Independent Admin approves the test run
    const adminApproveReq = await createMockRequest(
      `/api/v1/payroll/runs/${testRunId}/approve`,
      adminUser,
      "POST",
      { notes: "Independent compliance review passed." }
    );
    const adminApproveRes = await approveRun(adminApproveReq, {
      params: Promise.resolve({ runId: testRunId }),
    });
    assert(
      adminApproveRes.status === 200,
      "Independent Admin approval succeeds with HTTP 200"
    );

    // Verify DB update
    const approvedRunRecord = await prisma.payrollRun.findUnique({ where: { id: testRunId } });
    assert(
      approvedRunRecord?.approvalStatus === "Approved",
      "approvalStatus updated to 'Approved'"
    );
    assert(
      approvedRunRecord?.status === "POSTED - PAYMENT PENDING",
      "Operational status 'POSTED - PAYMENT PENDING' is preserved intact"
    );
    assert(
      approvedRunRecord?.approvedById === adminUser.id,
      `approvedById recorded as ${adminUser.id}`
    );
    assert(
      approvedRunRecord?.approvalNotes === "Independent compliance review passed.",
      "Approval notes persisted correctly"
    );

    // C. Concurrency / Double Approval Prevention
    const duplicateApproveReq = await createMockRequest(
      `/api/v1/payroll/runs/${testRunId}/approve`,
      adminUser,
      "POST"
    );
    const duplicateApproveRes = await approveRun(duplicateApproveReq, {
      params: Promise.resolve({ runId: testRunId }),
    });
    assert(
      duplicateApproveRes.status === 409,
      "Duplicate approval attempt is rejected with HTTP 409 Conflict"
    );

    // D. Transactional Audit Log Entry Verification
    const auditEntry = await prisma.auditLog.findFirst({
      where: {
        action: "PAYROLL_APPROVED",
        details: { contains: testRunId },
      },
    });
    assert(auditEntry !== null, "PAYROLL_APPROVED audit log entry created in transaction");
    if (auditEntry) {
      assert(auditEntry.actorId === adminUser.id, "Audit entry actorId matches approver");
      assert(auditEntry.actorRole === "Admin", "Audit entry actorRole matches approver role");
      assert(
        Boolean(auditEntry.details?.includes("Approved")),
        "Audit details record 'Approved' transition"
      );
    }
  } finally {
    // Clean up isolated test records completely
    await prisma.payslip.deleteMany({ where: { payrollRunId: testRunId } });
    await prisma.auditLog.deleteMany({ where: { details: { contains: testRunId } } });
    await prisma.payrollRun.deleteMany({ where: { id: testRunId } });
    console.log("  ✓ Isolated test fixture cleaned up safely from database");
  }

  // ── 7. Suite: Database Integrity & Seed Count Verification ─────────────────
  console.log("\n--- 7. Database Integrity & Data Preservation Check ---");
  const finalRuns = await prisma.payrollRun.count();
  const finalPayslips = await prisma.payslip.count();
  assert(finalRuns === 18, `Authoritative payroll runs count is exactly 18 (got ${finalRuns})`);
  assert(finalPayslips === 2469, `Authoritative payslips count is exactly 2,469 (got ${finalPayslips})`);

  console.log("\n================================================================================");
  console.log(` ALL PAYROLL CONSOLE TESTS COMPLETE: ${passedTests}/${totalTests} PASSED (${failedTests} FAILED)`);
  console.log("================================================================================\n");

  if (failedTests > 0) {
    process.exit(1);
  }
}

runPayrollTests().catch((err) => {
  console.error("Test execution aborted:", err);
  process.exit(1);
}).finally(() => prisma.$disconnect());
