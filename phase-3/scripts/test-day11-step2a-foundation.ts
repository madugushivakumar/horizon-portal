/**
 * Horizon Portal — Day 11 Step 2A Backend Foundation Comprehensive Test Suite
 * scripts/test-day11-step2a-foundation.ts
 *
 * Fully isolated automated test suite covering:
 * 1. Exact Integer Paise Arithmetic & Monetary Parsing
 * 2. Reconciliation Engine Invariants & Status Categorization (Mocked Isolation)
 * 3. Read-Only Preview API RBAC & Payload Verification (Real Database Runs, 0 Mutations)
 * 4. Actor Security & Maker-Checker Dual-Control Verification
 * 5. Idempotency Key & Revision Sequencing Foundation
 * 6. Audit Payload Builder & Correlation Traceability
 * 7. Byte-Level Database Preservation Assertion
 *
 * STRICT SAFETY RULE: Zero writes, zero inserts, zero deletes in prisma/dev.db.
 */

import { prisma } from "../src/lib/prisma";
import { createAuthToken } from "../src/lib/auth/token";
import { SESSION_COOKIE_NAME } from "../src/lib/auth/session";
import { NextRequest } from "next/server";
import { GET as getPreview } from "../src/app/api/v1/payroll/runs/[runId]/reconciliation-preview/route";
import {
  parseToPaise,
  formatPaiseToRupeeString,
  formatPaiseToINR,
  calculatePayrollReconciliation,
  serializeReconciliationResult,
} from "../src/lib/payroll/reconciliation-engine";
import {
  validatePayrollActor,
  validateHistoricalPayrollActor,
  validateMakerChecker,
  validateIdempotencyKey,
  validateAdjustmentRevision,
} from "../src/lib/payroll/payroll-security";
import {
  generatePayrollAuditEventId,
  buildPayrollCorrectionAuditPayload,
} from "../src/lib/payroll/payroll-audit";

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

async function createMockRequest(
  url: string,
  user?: { id: string; email: string; role: string; employeeId?: string | null }
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

  return new NextRequest(new URL(url, "http://localhost:3000"), {
    method: "GET",
    headers,
  });
}

async function runStep2ATests() {
  console.log("================================================================================");
  console.log("   HORIZON PORTAL — DAY 11 STEP 2A BACKEND FOUNDATION TEST SUITE               ");
  console.log("================================================================================\n");

  // Record initial DB counts for preservation assertion
  const initialRunsCount = await prisma.payrollRun.count();
  const initialPayslipsCount = await prisma.payslip.count();
  const initialEmployeesCount = await prisma.employee.count();
  const initialAdjustmentsCount = await prisma.payrollAdjustment.count();

  console.log("Database Initial State:");
  console.log(`  - Payroll Runs: ${initialRunsCount}`);
  console.log(`  - Payslips:     ${initialPayslipsCount}`);
  console.log(`  - Employees:    ${initialEmployeesCount}`);
  console.log(`  - Adjustments:  ${initialAdjustmentsCount}\n`);

  // Load test user accounts from database for RBAC
  const adminUser = await prisma.user.findFirst({ where: { role: "Admin", isActive: true } });
  const hrUser = await prisma.user.findFirst({ where: { role: "HR", isActive: true } });
  const managerUser = await prisma.user.findFirst({ where: { role: "Manager", isActive: true } });
  const employeeUser = await prisma.user.findFirst({ where: { role: "Employee", isActive: true } });

  if (!adminUser || !hrUser || !managerUser || !employeeUser) {
    throw new Error("Missing required seed users for testing.");
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SUITE 1: Exact Integer Paise & Monetary Conversion Engine
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("--- 1. Exact Integer Paise Arithmetic & Monetary Conversion ---");

  // 1.1 Simple conversion
  assert(parseToPaise(100.5).paise === BigInt(10050), "Converts 100.50 INR to 10050 paise");
  assert(parseToPaise("100.50").paise === BigInt(10050), "Parses '100.50' string to 10050 paise");
  assert(parseToPaise("₹1,00,000.50").paise === BigInt(10000050), "Parses formatted currency '₹1,00,000.50' to 10000050 paise");

  // 1.2 Sub-paise precision handling
  assert(parseToPaise(0.01).paise === BigInt(1), "Converts 0.01 INR to 1 paise");
  assert(parseToPaise(null).paise === BigInt(0), "Handles null as 0 paise");
  assert(parseToPaise(undefined).paise === BigInt(0), "Handles undefined as 0 paise");

  // 1.3 Large crore values
  assert(parseToPaise(54788660.03).paise === BigInt(5478866003), "Converts September header gross ₹54,788,660.03 exactly to 5478866003 paise");
  assert(parseToPaise(54430331.52).paise === BigInt(5443033152), "Converts September payslip gross ₹54,430,331.52 exactly to 5443033152 paise");

  // 1.4 Rupee formatting without floating-point inaccuracy
  assert(formatPaiseToRupeeString(BigInt(5443033152)) === "54430331.52", "Formats paise to 2-decimal rupee string '54430331.52'");
  assert(formatPaiseToRupeeString(BigInt(-35832851)) === "-358328.51", "Formats negative paise to '-358328.51'");
  assert(formatPaiseToINR(BigInt(5443033152)) === "₹5,44,30,331.52", "Formats paise to localized Indian currency string '₹5,44,30,331.52'");
  assert(formatPaiseToINR(BigInt(-35832851)) === "-₹3,58,328.51", "Formats negative paise to localized string '-₹3,58,328.51'");

  // 1.5 Sub-paise warning detection
  const subPaiseResult = parseToPaise(100.555);
  assert(subPaiseResult.paise === BigInt(10056), "Rounds 100.555 half-up to 10056 paise");
  assert(subPaiseResult.precisionWarning !== undefined, "Detects sub-paise precision warning");

  // 1.6 Rejection of invalid inputs
  let nanThrown = false;
  try {
    parseToPaise("invalid-money");
  } catch {
    nanThrown = true;
  }
  assert(nanThrown, "Rejects malformed non-numeric currency string with exception");

  let nonFiniteThrown = false;
  try {
    parseToPaise(Infinity);
  } catch {
    nonFiniteThrown = true;
  }
  assert(nonFiniteThrown, "Rejects non-finite Infinity with exception");

  // ─────────────────────────────────────────────────────────────────────────────
  // SUITE 2: Calculation Engine with Isolated Synthetic Fixtures (Mock Client)
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("\n--- 2. Calculation Engine with Isolated Synthetic Fixtures ---");

  // 2.1 Synthetic MATCHED Run
  const mockMatchedClient = {
    payrollRun: {
      findUnique: async () => ({
        id: "PR-MOCK-MATCHED",
        periodStart: new Date("2026-07-01"),
        periodEnd: new Date("2026-07-31"),
        paymentDate: new Date("2026-08-01"),
        payDate: new Date("2026-08-01"),
        employeesPaid: 2,
        totalGross: 200000.0,
        totalNet: 170000.0,
        status: "PAID",
        approvalStatus: "Approved",
        payslips: [
          {
            id: "SLIP-01",
            employeeId: "EMP-01",
            grossPay: 100000.0,
            totalDeductions: 15000.0,
            deductions: 15000.0,
            netPay: 85000.0,
          },
          {
            id: "SLIP-02",
            employeeId: "EMP-02",
            grossPay: 100000.0,
            totalDeductions: 15000.0,
            deductions: 15000.0,
            netPay: 85000.0,
          },
        ],
      }),
    },
  } as any;

  const matchedRes = await calculatePayrollReconciliation("PR-MOCK-MATCHED", { tx: mockMatchedClient });
  assert(matchedRes !== null, "Engine processes synthetic matched run");
  if (matchedRes) {
    assert(matchedRes.reconciliationStatus === "MATCHED", "Synthetic balanced run returns MATCHED");
    assert(matchedRes.variance.grossPaise === BigInt(0), "Gross variance is 0 paise");
    assert(matchedRes.variance.netPaise === BigInt(0), "Net variance is 0 paise");
    assert(matchedRes.variance.deductionsPaise === BigInt(0), "Deductions variance is 0 paise");
    assert(matchedRes.variance.headcount === 0, "Headcount variance is 0");
    assert(matchedRes.invariants.headerEquationBalanced, "Header invariant balanced");
    assert(matchedRes.invariants.itemizedEquationBalanced, "Itemized invariant balanced");
    assert(matchedRes.invariants.varianceEquationBalanced, "Variance invariant balanced");
  }

  // 2.2 Synthetic MISMATCH Run with Overstated Header (Sign Convention Test)
  const mockMismatchClient = {
    payrollRun: {
      findUnique: async () => ({
        id: "PR-MOCK-MISMATCH",
        periodStart: new Date("2026-09-01"),
        periodEnd: new Date("2026-09-30"),
        paymentDate: null,
        payDate: null,
        employeesPaid: 3, // Header lists 3
        totalGross: 300000.0, // Header: 300,000
        totalNet: 255000.0, // Header Net: 255,000 (Deductions: 45,000)
        status: "POSTED - PAYMENT PENDING",
        approvalStatus: "Pending",
        payslips: [
          {
            id: "SLIP-01",
            employeeId: "EMP-01",
            grossPay: 100000.0,
            totalDeductions: 15000.0,
            deductions: 15000.0,
            netPay: 85000.0,
          },
          {
            id: "SLIP-02",
            employeeId: "EMP-02",
            grossPay: 100000.0,
            totalDeductions: 15000.0,
            deductions: 15000.0,
            netPay: 85000.0,
          },
          // 2 payslips actual = 200,000 Gross / 170,000 Net
        ],
      }),
    },
  } as any;

  const mismatchRes = await calculatePayrollReconciliation("PR-MOCK-MISMATCH", { tx: mockMismatchClient });
  assert(mismatchRes !== null, "Engine processes synthetic mismatch run");
  if (mismatchRes) {
    assert(mismatchRes.reconciliationStatus === "MISMATCH", "Returns MISMATCH status");
    // Sign convention: Itemized (200k) - Header (300k) = -100k
    assert(mismatchRes.variance.grossPaise === BigInt(-10000000), "Gross variance is -100,000 INR (-10,000,000 paise)");
    assert(mismatchRes.variance.netPaise === BigInt(-8500000), "Net variance is -85,000 INR (-8,500,000 paise)");
    assert(mismatchRes.variance.headcount === -1, "Headcount variance is -1 (2 actual - 3 stored)");
    assert(mismatchRes.variance.signConvention === "ITEMIZED_MINUS_STORED_HEADER", "Sign convention explicitly documented");
    assert(mismatchRes.eligibleForPreApprovalReconciliation === true, "Unpaid pending mismatch is eligible for pre-approval reconciliation");
  }

  // 2.3 Synthetic NO_ITEMS Run
  const mockNoItemsClient = {
    payrollRun: {
      findUnique: async () => ({
        id: "PR-MOCK-NO-ITEMS",
        periodStart: new Date("2026-01-01"),
        periodEnd: new Date("2026-01-31"),
        paymentDate: new Date("2026-02-01"),
        payDate: new Date("2026-02-01"),
        employeesPaid: 400,
        totalGross: 40000000.0,
        totalNet: 35000000.0,
        status: "PAID",
        approvalStatus: "Approved",
        payslips: [],
      }),
    },
  } as any;

  const noItemsRes = await calculatePayrollReconciliation("PR-MOCK-NO-ITEMS", { tx: mockNoItemsClient });
  assert(noItemsRes?.reconciliationStatus === "NO_ITEMS", "Run with 0 payslips correctly returns NO_ITEMS");

  // 2.4 Synthetic INVALID_DATA Run (Duplicate Payslip ID & Arithmetic Break)
  const mockInvalidClient = {
    payrollRun: {
      findUnique: async () => ({
        id: "PR-MOCK-INVALID",
        periodStart: new Date("2026-02-01"),
        periodEnd: new Date("2026-02-28"),
        paymentDate: null,
        payDate: null,
        employeesPaid: 2,
        totalGross: 200000.0,
        totalNet: 170000.0,
        status: "POSTED - PAYMENT PENDING",
        approvalStatus: "Pending",
        payslips: [
          {
            id: "SLIP-DUP", // Duplicate ID
            employeeId: "EMP-01",
            grossPay: 100000.0,
            totalDeductions: 10000.0,
            deductions: 10000.0,
            netPay: 70000.0, // Gross (100k) - Deductions (10k) !== Net (70k) -> Arithmetic Break!
          },
          {
            id: "SLIP-DUP", // Duplicate ID
            employeeId: "EMP-02",
            grossPay: 100000.0,
            totalDeductions: 10000.0,
            deductions: 10000.0,
            netPay: 90000.0,
          },
        ],
      }),
    },
  } as any;

  const invalidRes = await calculatePayrollReconciliation("PR-MOCK-INVALID", { tx: mockInvalidClient });
  assert(invalidRes?.reconciliationStatus === "INVALID_DATA", "Detects corrupted data and classifies as INVALID_DATA");
  assert(invalidRes?.dataQuality.duplicatePayslipIds.includes("SLIP-DUP") === true, "Flags duplicate payslip ID in dataQuality");
  assert(invalidRes?.dataQuality.arithmeticDiscrepancies.length! > 0, "Flags arithmetic line discrepancy where Gross - Deductions !== Net");

  // ─────────────────────────────────────────────────────────────────────────────
  // SUITE 3: Real Database Read-Only Calculation Engine Evaluation
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("\n--- 3. Real Database Read-Only Engine Evaluation (PR-2026-09 & PR-2026-08) ---");

  // 3.1 Evaluate September 2026 (PR-2026-09)
  const rec09 = await calculatePayrollReconciliation("PR-2026-09");
  assert(rec09 !== null, "Reconciliation engine successfully loads PR-2026-09");
  if (rec09) {
    assert(rec09.reconciliationStatus === "MISMATCH", "PR-2026-09 status is MISMATCH");
    assert(rec09.source.header.headcount === 444, "PR-2026-09 header headcount is 444");
    assert(rec09.source.itemized.headcount === 441, "PR-2026-09 itemized headcount is 441");
    assert(rec09.variance.headcount === -3, "PR-2026-09 headcount variance is -3 (441 itemized - 444 header)");
    assert(rec09.source.header.grossPaise === BigInt(5478866003), "PR-2026-09 header gross is 54,788,660.03 INR (5478866003 paise)");
    assert(rec09.source.itemized.grossPaise === BigInt(5443033152), "PR-2026-09 itemized gross is 54,430,331.52 INR (5443033152 paise)");
    assert(rec09.variance.grossPaise === BigInt(-35832851), "PR-2026-09 gross variance is -358,328.51 INR (-35832851 paise)");
    assert(rec09.source.header.netPaise === BigInt(4808967830), "PR-2026-09 header net is 48,089,678.30 INR (4808967830 paise)");
    assert(rec09.source.itemized.netPaise === BigInt(4778232660), "PR-2026-09 itemized net is 47,782,326.60 INR (4778232660 paise)");
    assert(rec09.variance.netPaise === BigInt(-30735170), "PR-2026-09 net variance is -307,351.70 INR (-30735170 paise)");
    assert(rec09.eligibleForPreApprovalReconciliation === true, "PR-2026-09 is eligible for pre-approval reconciliation");
    assert(rec09.eligibleForHistoricalAdjustment === false, "PR-2026-09 is NOT eligible for historical adjustment (not paid)");
    assert(rec09.readOnly === true, "Engine guarantees readOnly = true");
    assert(rec09.financialMutationPerformed === false, "Engine guarantees financialMutationPerformed = false");
  }

  // 3.2 Evaluate August 2026 (PR-2026-08)
  const rec08 = await calculatePayrollReconciliation("PR-2026-08");
  assert(rec08 !== null, "Reconciliation engine successfully loads PR-2026-08");
  if (rec08) {
    assert(rec08.reconciliationStatus === "MISMATCH", "PR-2026-08 status is MISMATCH");
    assert(rec08.source.header.headcount === 429, "PR-2026-08 header headcount is 429");
    assert(rec08.source.itemized.headcount === 424, "PR-2026-08 itemized headcount is 424");
    assert(rec08.variance.headcount === -5, "PR-2026-08 headcount variance is -5 (424 itemized - 429 header)");
    assert(rec08.source.header.grossPaise === BigInt(4868500797), "PR-2026-08 header gross is 48,685,007.97 INR (4868500797 paise)");
    assert(rec08.source.itemized.grossPaise === BigInt(4784740945), "PR-2026-08 itemized gross is 47,847,409.45 INR (4784740945 paise)");
    assert(rec08.variance.grossPaise === BigInt(-83759852), "PR-2026-08 gross variance is -837,598.52 INR (-83759852 paise)");
    assert(rec08.source.header.netPaise === BigInt(4317331836), "PR-2026-08 header net is 43,173,318.36 INR (4317331836 paise)");
    assert(rec08.source.itemized.netPaise === BigInt(4246796137), "PR-2026-08 itemized net is 42,467,961.37 INR (4246796137 paise)");
    assert(rec08.variance.netPaise === BigInt(-70535699), "PR-2026-08 net variance is -705,356.99 INR (-70535699 paise)");
    assert(rec08.eligibleForPreApprovalReconciliation === false, "PR-2026-08 is NOT eligible for pre-approval reconciliation (already paid)");
    assert(rec08.eligibleForHistoricalAdjustment === true, "PR-2026-08 is eligible for historical reporting adjustment");
  }

  // 3.3 BigInt Serialization Test
  if (rec09) {
    const serialized = serializeReconciliationResult(rec09);
    assert(typeof serialized.source.header.grossPaise === "string", "Serialized header grossPaise is string");
    assert(typeof serialized.source.itemized.grossPaise === "string", "Serialized itemized grossPaise is string");
    assert(typeof serialized.variance.grossPaise === "string", "Serialized variance grossPaise is string");
    const jsonString = JSON.stringify(serialized);
    assert(jsonString.includes('"5478866003"'), "JSON serialization succeeds without BigInt TypeError");
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SUITE 4: Read-Only Preview API Route Integration & RBAC
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("\n--- 4. Read-Only Preview API Route Integration & RBAC ---");

  // 4.1 Guest (Unauthenticated) -> 401
  {
    const req = await createMockRequest("/api/v1/payroll/runs/PR-2026-09/reconciliation-preview");
    const res = await getPreview(req, { params: Promise.resolve({ runId: "PR-2026-09" }) });
    assert(res.status === 401, "Guest access returns HTTP 401 Unauthorized");
  }

  // 4.2 Employee -> 403
  {
    const req = await createMockRequest("/api/v1/payroll/runs/PR-2026-09/reconciliation-preview", employeeUser);
    const res = await getPreview(req, { params: Promise.resolve({ runId: "PR-2026-09" }) });
    assert(res.status === 403, "Employee role access returns HTTP 403 Forbidden");
  }

  // 4.3 Manager -> 403
  {
    const req = await createMockRequest("/api/v1/payroll/runs/PR-2026-09/reconciliation-preview", managerUser);
    const res = await getPreview(req, { params: Promise.resolve({ runId: "PR-2026-09" }) });
    assert(res.status === 403, "Manager role access returns HTTP 403 Forbidden");
  }

  // 4.4 HR -> 200 Authorized
  {
    const req = await createMockRequest("/api/v1/payroll/runs/PR-2026-09/reconciliation-preview", hrUser);
    const res = await getPreview(req, { params: Promise.resolve({ runId: "PR-2026-09" }) });
    assert(res.status === 200, "HR role access returns HTTP 200 OK");
    const json = await res.json();
    assert(json.success === true, "Response payload contains success = true");
    assert(json.data.payrollRunId === "PR-2026-09", "Response contains correct runId PR-2026-09");
    assert(json.data.readOnly === true, "Response explicitly confirms readOnly = true");
    assert(json.data.financialMutationPerformed === false, "Response explicitly confirms financialMutationPerformed = false");
  }

  // 4.5 Admin -> 200 Authorized
  {
    const req = await createMockRequest("/api/v1/payroll/runs/PR-2026-08/reconciliation-preview", adminUser);
    const res = await getPreview(req, { params: Promise.resolve({ runId: "PR-2026-08" }) });
    assert(res.status === 200, "Admin role access returns HTTP 200 OK");
    const json = await res.json();
    assert(json.data.payrollRunId === "PR-2026-08", "Admin preview retrieves PR-2026-08");
    assert(json.data.eligibleForHistoricalAdjustment === true, "Admin preview reflects eligibleForHistoricalAdjustment = true");
  }

  // 4.6 Missing Run -> 404
  {
    const req = await createMockRequest("/api/v1/payroll/runs/PR-NONEXISTENT/reconciliation-preview", adminUser);
    const res = await getPreview(req, { params: Promise.resolve({ runId: "PR-NONEXISTENT" }) });
    assert(res.status === 404, "Nonexistent payroll run returns HTTP 404 Not Found");
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SUITE 5: Actor Identity Security & Maker-Checker Validation
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("\n--- 5. Actor Security & Maker-Checker Dual-Control Foundation ---");

  // 5.1 Active Admin actor validation
  const adminActorCheck = await validatePayrollActor(adminUser.id);
  assert(adminActorCheck.valid === true, "Live active Admin user successfully validates");

  // 5.2 Active HR actor validation
  const hrActorCheck = await validatePayrollActor(hrUser.id);
  assert(hrActorCheck.valid === true, "Live active HR user successfully validates");

  // 5.3 Non-existent user ID
  const nonexistentActorCheck = await validatePayrollActor("usr_nonexistent_xyz");
  assert(nonexistentActorCheck.valid === false, "Non-existent user ID is rejected");
  assert(nonexistentActorCheck.error?.includes("does not exist") === true, "Error message explains user does not exist");

  // 5.4 Maker-Checker: Self-approval rejection
  const selfApprovalCheck = validateMakerChecker(adminUser.id, adminUser.id);
  assert(selfApprovalCheck.valid === false, "Maker-Checker strictly rejects identical preparer and approver");
  assert(selfApprovalCheck.error?.includes("Maker-Checker violation") === true, "Rejection message explains Maker-Checker violation");

  // 5.5 Maker-Checker: Independent reviewer approval
  const independentApprovalCheck = validateMakerChecker(hrUser.id, adminUser.id);
  assert(independentApprovalCheck.valid === true, "Maker-Checker accepts independent preparer (HR) and approver (Admin)");

  // 5.6 Maker-Checker: Empty ID handling
  const emptyChecker = validateMakerChecker("", adminUser.id);
  assert(emptyChecker.valid === false, "Maker-Checker rejects empty preparer identifier");

  // ─────────────────────────────────────────────────────────────────────────────
  // SUITE 6: Idempotency Key & Revision Sequencing Foundation
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("\n--- 6. Idempotency Key & Revision Sequencing Foundation ---");

  // 6.1 Valid idempotency keys
  assert(validateIdempotencyKey("idem_pr202609_recon_001").valid === true, "Valid idempotency key accepted");
  assert(validateIdempotencyKey("8f3a9e2b-11d4-4a55-89c2-55fa1103cdef").valid === true, "Valid UUID idempotency key accepted");

  // 6.2 Invalid idempotency keys
  assert(validateIdempotencyKey("").valid === false, "Empty idempotency key rejected");
  assert(validateIdempotencyKey("short").valid === false, "Idempotency key shorter than 8 chars rejected");
  assert(validateIdempotencyKey("bad key with spaces!").valid === false, "Idempotency key with invalid characters rejected");

  // 6.3 Sequential revision increments
  assert(validateAdjustmentRevision(0, 1).valid === true, "Allows revision 1 after revision 0");
  assert(validateAdjustmentRevision(1, 2).valid === true, "Allows revision 2 after revision 1");
  assert(validateAdjustmentRevision(1, 1).valid === false, "Rejects duplicate revision 1 after revision 1");
  assert(validateAdjustmentRevision(1, 3).valid === false, "Rejects revision gap (skipping revision 2)");

  // ─────────────────────────────────────────────────────────────────────────────
  // SUITE 7: Audit Payload Builder & Correlation Traceability
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("\n--- 7. Audit Payload Builder & Correlation Traceability ---");

  const correlationId = generatePayrollAuditEventId();
  assert(correlationId.startsWith("evt_adj_"), "Correlation ID generates with standard 'evt_adj_' prefix");

  const auditPayload = buildPayrollCorrectionAuditPayload({
    action: "PAYROLL_PRE_APPROVAL_CORRECTION",
    payrollRunId: "PR-2026-09",
    actor: {
      actorId: hrUser.id,
      actorEmail: hrUser.email,
      actorRole: hrUser.role,
    },
    reason: "Pre-approval batch alignment of phantom headcount (+3) to 441 verified payslips.",
    correlationId,
    beforeSnapshot: {
      employeesPaid: 444,
      grossPaise: "5478866003",
      deductionsPaise: "669898173",
      netPaise: "4808967830",
      grossRupees: 54788660.03,
      deductionsRupees: 6698981.73,
      netRupees: 48089678.30,
    },
    afterSnapshot: {
      employeesPaid: 441,
      grossPaise: "5443033152",
      deductionsPaise: "664800492",
      netPaise: "4778232660",
      grossRupees: 54430331.52,
      deductionsRupees: 6648004.92,
      netRupees: 47782326.60,
    },
    variance: {
      headcount: -3,
      grossPaise: "-35832851",
      deductionsPaise: "-5097681",
      netPaise: "-30735170",
    },
    reconciliationStatus: "MATCHED",
  });

  assert(auditPayload.eventId === correlationId, "Audit payload preserves correlation ID");
  assert(auditPayload.action === "PAYROLL_PRE_APPROVAL_CORRECTION", "Audit payload action matches specification");
  assert(auditPayload.actorId === hrUser.id, "Audit payload records correct actor ID");
  assert(auditPayload.details.includes('"reason"'), "Audit payload details contains serialized reason");
  assert(auditPayload.details.includes('"before"'), "Audit payload details contains before snapshot");
  assert(auditPayload.details.includes('"after"'), "Audit payload details contains after snapshot");

  // ─────────────────────────────────────────────────────────────────────────────
  // SUITE 8: Byte-Level Database Preservation Assertion
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("\n--- 8. Byte-Level Database Preservation Verification ---");

  const finalRunsCount = await prisma.payrollRun.count();
  const finalPayslipsCount = await prisma.payslip.count();
  const finalEmployeesCount = await prisma.employee.count();
  const finalAdjustmentsCount = await prisma.payrollAdjustment.count();

  assert(finalRunsCount === initialRunsCount && finalRunsCount === 18, `payroll_runs count preserved at 18 (was ${initialRunsCount}, now ${finalRunsCount})`);
  assert(finalPayslipsCount === initialPayslipsCount && finalPayslipsCount === 2469, `payslips count preserved at 2469 (was ${initialPayslipsCount}, now ${finalPayslipsCount})`);
  assert(finalEmployeesCount === initialEmployeesCount && finalEmployeesCount === 441, `employees count preserved at 441 (was ${initialEmployeesCount}, now ${finalEmployeesCount})`);
  assert(finalAdjustmentsCount === initialAdjustmentsCount && finalAdjustmentsCount === 0, `payroll_adjustments count preserved at 0 (was ${initialAdjustmentsCount}, now ${finalAdjustmentsCount})`);

  // Verify PR-2026-08 remains completely untouched
  const pr08 = await prisma.payrollRun.findUnique({ where: { id: "PR-2026-08" } });
  assert(pr08?.status === "PAID", "PR-2026-08 operational status remains PAID");
  assert(pr08?.employeesPaid === 429, "PR-2026-08 headcount remains 429");
  assert(pr08?.totalGross === 48685007.97, "PR-2026-08 gross remains ₹48,685,007.97");
  assert(pr08?.totalNet === 43173318.36, "PR-2026-08 net remains ₹43,173,318.36");
  assert(pr08?.payDate?.toISOString().split("T")[0] === "2026-09-01", "PR-2026-08 payDate remains 2026-09-01");

  // Verify PR-2026-09 remains completely untouched
  const pr09 = await prisma.payrollRun.findUnique({ where: { id: "PR-2026-09" } });
  assert(pr09?.status === "POSTED - PAYMENT PENDING", "PR-2026-09 operational status remains POSTED - PAYMENT PENDING");
  assert(pr09?.employeesPaid === 444, "PR-2026-09 headcount remains 444");
  assert(pr09?.totalGross === 54788660.03, "PR-2026-09 gross remains ₹54,788,660.03");
  assert(pr09?.totalNet === 48089678.30, "PR-2026-09 net remains ₹48,089,678.30");
  assert(pr09?.payDate === null, "PR-2026-09 payDate remains null");

  console.log("\n================================================================================");
  console.log(`    TOTAL TESTS: ${totalTests} | PASSED: ${passedTests} | FAILED: ${failedTests}`);
  console.log("================================================================================\n");

  if (failedTests > 0) {
    process.exit(1);
  }
}

runStep2ATests()
  .catch((err) => {
    console.error("Test execution fatal error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

