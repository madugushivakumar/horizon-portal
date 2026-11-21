/**
 * Horizon Portal — Day 11 Step 2A.1 Comprehensive Technical Remediation Test Suite
 * scripts/test-day11-step2a1-remediation.ts
 *
 * Fully isolated automated test suite covering:
 * 1. SQLite Signed 64-Bit Integer Boundary & Extrema Validation (assertSqliteInt64)
 * 2. Monetary Parsing & Half-Up Rounding Precision (parseToPaise)
 * 3. Exact Rupee & INR Formatting without Precision Drift
 * 4. Transaction-Scoped Preview Read Snapshot Consistency & Strict RBAC
 * 5. Audit Transaction Compatibility & Atomicity Rollback (Disposable Database)
 * 6. Actor Security & Maker-Checker Dual-Control Governance
 * 7. Idempotency Key & Revision Sequencing Validation
 * 8. Zero-Mutation Database Preservation Assertion on prisma/dev.db
 *
 * STRICT SAFETY RULE: Zero mutations in prisma/dev.db.
 */

import { prisma } from "../src/lib/prisma";
import { PrismaClient } from "@prisma/client";
import { createAuthToken } from "../src/lib/auth/token";
import { SESSION_COOKIE_NAME } from "../src/lib/auth/session";
import { NextRequest } from "next/server";
import * as fs from "fs";
import * as path from "path";
import { GET as getPreview } from "../src/app/api/v1/payroll/runs/[runId]/reconciliation-preview/route";
import {
  SQLITE_INT64_MIN,
  SQLITE_INT64_MAX,
  assertSqliteInt64,
  parseToPaise,
  formatPaiseToRupeeString,
  formatPaiseToINR,
  calculatePayrollReconciliation,
  serializeReconciliationResult,
} from "../src/lib/payroll/reconciliation-engine";
import {
  validatePayrollActor,
  validateMakerChecker,
  validateIdempotencyKey,
  validateAdjustmentRevision,
} from "../src/lib/payroll/payroll-security";
import {
  generatePayrollAuditEventId,
  buildPayrollCorrectionAuditPayload,
  persistPayrollAuditLog,
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

async function runStep2A1Tests() {
  console.log("================================================================================");
  console.log("   HORIZON PORTAL — DAY 11 STEP 2A.1 TECHNICAL REMEDIATION TEST SUITE          ");
  console.log("================================================================================\n");

  // Verify baseline dev.db state
  const initialRunsCount = await prisma.payrollRun.count();
  const initialPayslipsCount = await prisma.payslip.count();
  const initialEmployeesCount = await prisma.employee.count();
  const initialAdjustmentsCount = await prisma.payrollAdjustment.count();

  console.log("Live Database Initial State (prisma/dev.db):");
  console.log(`  - Payroll Runs: ${initialRunsCount}`);
  console.log(`  - Payslips:     ${initialPayslipsCount}`);
  console.log(`  - Employees:    ${initialEmployeesCount}`);
  console.log(`  - Adjustments:  ${initialAdjustmentsCount}\n`);

  assert(initialRunsCount === 18, "prisma/dev.db contains exactly 18 payroll runs");
  assert(initialPayslipsCount === 2469, "prisma/dev.db contains exactly 2,469 payslips");
  assert(initialEmployeesCount === 441, "prisma/dev.db contains exactly 441 employees");
  assert(initialAdjustmentsCount === 0, "prisma/dev.db contains exactly 0 adjustments");

  // ─────────────────────────────────────────────────────────────────────────────
  // SUITE 1: SQLite Signed 64-Bit Integer Boundary & Extrema Validation
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("\n--- 1. SQLite Signed 64-Bit Integer Boundary & Extrema (assertSqliteInt64) ---");

  // 1.1 Constant values
  assert(SQLITE_INT64_MIN === BigInt("-9223372036854775808"), "SQLITE_INT64_MIN equals -2^63 (-9223372036854775808)");
  assert(SQLITE_INT64_MAX === BigInt("9223372036854775807"), "SQLITE_INT64_MAX equals 2^63 - 1 (9223372036854775807)");

  // 1.2 Boundary checks that must pass
  let minPassed = false;
  try {
    assertSqliteInt64(SQLITE_INT64_MIN, "min bound");
    minPassed = true;
  } catch {}
  assert(minPassed, "assertSqliteInt64 accepts exact minimum bound (-2^63)");

  let maxPassed = false;
  try {
    assertSqliteInt64(SQLITE_INT64_MAX, "max bound");
    maxPassed = true;
  } catch {}
  assert(maxPassed, "assertSqliteInt64 accepts exact maximum bound (2^63 - 1)");

  let zeroPassed = false;
  try {
    assertSqliteInt64(BigInt(0), "zero");
    zeroPassed = true;
  } catch {}
  assert(zeroPassed, "assertSqliteInt64 accepts zero");

  let posPassed = false;
  try {
    assertSqliteInt64(BigInt("100000000000"), "positive 1B rupees in paise");
    posPassed = true;
  } catch {}
  assert(posPassed, "assertSqliteInt64 accepts large valid positive amount (100000000000)");

  let negPassed = false;
  try {
    assertSqliteInt64(BigInt("-100000000000"), "negative 1B rupees in paise");
    negPassed = true;
  } catch {}
  assert(negPassed, "assertSqliteInt64 accepts large valid negative amount (-100000000000)");

  // 1.3 Overflow checks that must throw RangeError
  let maxOverflowThrown = false;
  try {
    assertSqliteInt64(SQLITE_INT64_MAX + BigInt(1), "overflow test");
  } catch (err) {
    if (err instanceof RangeError && err.message.includes("Integer overflow")) {
      maxOverflowThrown = true;
    }
  }
  assert(maxOverflowThrown, "assertSqliteInt64 throws RangeError on SQLITE_INT64_MAX + 1");

  let maxExtremeOverflowThrown = false;
  try {
    assertSqliteInt64(SQLITE_INT64_MAX + BigInt("1000000000000"), "extreme overflow test");
  } catch (err) {
    if (err instanceof RangeError) maxExtremeOverflowThrown = true;
  }
  assert(maxExtremeOverflowThrown, "assertSqliteInt64 throws RangeError on extreme positive overflow");

  let minUnderflowThrown = false;
  try {
    assertSqliteInt64(SQLITE_INT64_MIN - BigInt(1), "underflow test");
  } catch (err) {
    if (err instanceof RangeError && err.message.includes("Integer overflow")) {
      minUnderflowThrown = true;
    }
  }
  assert(minUnderflowThrown, "assertSqliteInt64 throws RangeError on SQLITE_INT64_MIN - 1");

  let minExtremeUnderflowThrown = false;
  try {
    assertSqliteInt64(SQLITE_INT64_MIN - BigInt("1000000000000"), "extreme underflow test");
  } catch (err) {
    if (err instanceof RangeError) minExtremeUnderflowThrown = true;
  }
  assert(minExtremeUnderflowThrown, "assertSqliteInt64 throws RangeError on extreme negative underflow");

  // 1.4 Type checks that must throw TypeError
  const nonBigIntTypes: any[] = [123, "123", true, false, null, undefined, {}, []];
  let typeErrorsCaught = 0;
  for (const item of nonBigIntTypes) {
    try {
      assertSqliteInt64(item as any, "type test");
    } catch (err) {
      if (err instanceof TypeError) typeErrorsCaught++;
    }
  }
  assert(typeErrorsCaught === nonBigIntTypes.length, `assertSqliteInt64 throws TypeError for all non-BigInt types (${typeErrorsCaught}/${nonBigIntTypes.length})`);

  // 1.5 Custom field name verification
  let customFieldNamePresent = false;
  try {
    assertSqliteInt64(SQLITE_INT64_MAX + BigInt(1), "custom_gross_field");
  } catch (err) {
    if (err instanceof Error && err.message.includes("custom_gross_field")) {
      customFieldNamePresent = true;
    }
  }
  assert(customFieldNamePresent, "assertSqliteInt64 preserves custom field name in exception message");

  // ─────────────────────────────────────────────────────────────────────────────
  // SUITE 2: Monetary Parsing & Exact Integer Paise Half-Up Rounding
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("\n--- 2. Monetary Parsing & Paise Precision (parseToPaise) ---");

  const p1 = parseToPaise("54788660.03");
  assert(p1.paise === BigInt("5478866003"), "Parses '54788660.03' to exact 5478866003 paise");
  assert(p1.rupees === 54788660.03, "Rupee float representation matches");
  assert(p1.formattedRupees === "₹5,47,88,660.03", "Formatted INR matches Indian locale");

  const p2 = parseToPaise(48685007.97);
  assert(p2.paise === BigInt("4868500797"), "Parses number 48685007.97 to exact 4868500797 paise");

  const pZero1 = parseToPaise(0);
  const pZero2 = parseToPaise("0");
  const pZero3 = parseToPaise(null);
  const pZero4 = parseToPaise(undefined);
  const pZero5 = parseToPaise("");
  assert(
    pZero1.paise === BigInt(0) &&
    pZero2.paise === BigInt(0) &&
    pZero3.paise === BigInt(0) &&
    pZero4.paise === BigInt(0) &&
    pZero5.paise === BigInt(0),
    "Zero, empty, null, and undefined values cleanly parse to 0 paise"
  );

  const pCurrency = parseToPaise("₹1,23,456.78");
  assert(pCurrency.paise === BigInt("12345678"), "Parses formatted currency '₹1,23,456.78' to 12345678 paise");

  const pNegative = parseToPaise("-₹500.50");
  assert(pNegative.paise === BigInt("-50050"), "Parses negative currency '-₹500.50' to -50050 paise");

  const pSubPaise = parseToPaise("100.555");
  assert(pSubPaise.paise === BigInt("10056"), "Rounds sub-paise 100.555 to 10056 paise via half-up");
  assert(pSubPaise.precisionWarning !== undefined, "Emits precision warning for fractional sub-paise");

  const pTrailingZeros = parseToPaise("100.5500");
  assert(pTrailingZeros.precisionWarning === undefined, "Trailing zeros do not trigger sub-paise precision warning");

  let nanCaught = false;
  try {
    parseToPaise(NaN);
  } catch {
    nanCaught = true;
  }
  assert(nanCaught, "Rejects NaN with an explicit Error");

  let infCaught = false;
  try {
    parseToPaise(Infinity);
  } catch {
    infCaught = true;
  }
  assert(infCaught, "Rejects Infinity with an explicit Error");

  let nonNumericCaught = false;
  try {
    parseToPaise("invalid_amount_xyz");
  } catch {
    nonNumericCaught = true;
  }
  assert(nonNumericCaught, "Rejects malformed string with an explicit Error");

  // ─────────────────────────────────────────────────────────────────────────────
  // SUITE 3: Exact Rupee & INR Formatting
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("\n--- 3. Rupee & INR Formatting Without Floating Point Drift ---");

  assert(formatPaiseToRupeeString(BigInt("5443033152")) === "54430331.52", "Formats 5443033152 paise to '54430331.52'");
  assert(formatPaiseToRupeeString(BigInt("-35832851")) === "-358328.51", "Formats negative paise -35832851 to '-358328.51'");
  assert(formatPaiseToRupeeString(BigInt(0)) === "0.00", "Formats 0 paise to '0.00'");
  assert(formatPaiseToRupeeString(BigInt(5)) === "0.05", "Pads single-digit paise: 5 -> '0.05'");
  assert(formatPaiseToINR(BigInt("5443033152")) === "₹5,44,30,331.52", "Formats Indian numbering: '₹5,44,30,331.52'");
  assert(formatPaiseToINR(BigInt("-35832851")) === "-₹3,58,328.51", "Formats negative Indian numbering: '-₹3,58,328.51'");
  assert(formatPaiseToINR(BigInt(0)) === "₹0.00", "Formats zero Indian numbering: '₹0.00'");

  // ─────────────────────────────────────────────────────────────────────────────
  // SUITE 4: Transaction-Scoped Read Snapshot Consistency & Preview API RBAC
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("\n--- 4. Transaction-Scoped Preview Read Snapshot Consistency & RBAC ---");

  // Load test user accounts from database for RBAC
  const adminUser = await prisma.user.findFirst({ where: { role: "Admin", isActive: true } });
  const hrUser = await prisma.user.findFirst({ where: { role: "HR", isActive: true } });
  const managerUser = await prisma.user.findFirst({ where: { role: "Manager", isActive: true } });
  const employeeUser = await prisma.user.findFirst({ where: { role: "Employee", isActive: true } });

  assert(!!adminUser, "Found active Admin user in live database");
  assert(!!hrUser, "Found active HR user in live database");
  assert(!!managerUser, "Found active Manager user in live database");
  assert(!!employeeUser, "Found active Employee user in live database");

  // 4.1 Unauthenticated -> 401
  {
    const req = await createMockRequest("/api/v1/payroll/runs/PR-2026-09/reconciliation-preview");
    const res = await getPreview(req, { params: Promise.resolve({ runId: "PR-2026-09" }) });
    assert(res.status === 401, "Unauthenticated request returns HTTP 401 Unauthorized");
  }

  // 4.2 Employee -> 403
  if (employeeUser) {
    const req = await createMockRequest("/api/v1/payroll/runs/PR-2026-09/reconciliation-preview", employeeUser);
    const res = await getPreview(req, { params: Promise.resolve({ runId: "PR-2026-09" }) });
    assert(res.status === 403, "Employee role access returns HTTP 403 Forbidden");
  }

  // 4.3 Manager -> 403
  if (managerUser) {
    const req = await createMockRequest("/api/v1/payroll/runs/PR-2026-09/reconciliation-preview", managerUser);
    const res = await getPreview(req, { params: Promise.resolve({ runId: "PR-2026-09" }) });
    assert(res.status === 403, "Manager role access returns HTTP 403 Forbidden");
  }

  // 4.4 HR -> 200 Authorized (PR-2026-09)
  if (hrUser) {
    const req = await createMockRequest("/api/v1/payroll/runs/PR-2026-09/reconciliation-preview", hrUser);
    const res = await getPreview(req, { params: Promise.resolve({ runId: "PR-2026-09" }) });
    assert(res.status === 200, "HR role access returns HTTP 200 OK");
    const json = await res.json();
    assert(json.success === true, "Response payload contains success = true");
    assert(json.data.payrollRunId === "PR-2026-09", "Response contains correct runId PR-2026-09");
    assert(json.data.readOnly === true, "Response explicitly confirms readOnly = true");
    assert(json.data.financialMutationPerformed === false, "Response explicitly confirms financialMutationPerformed = false");
    assert(json.data.source.itemized.headcount === 441, "PR-2026-09 itemized headcount is 441 verified payslips");
    assert(json.data.source.header.headcount === 444, "PR-2026-09 header headcount is 444 phantom employees");
    assert(json.data.variance.headcount === -3, "PR-2026-09 headcount variance is -3");
    assert(json.data.eligibleForPreApprovalReconciliation === true, "PR-2026-09 is eligible for pre-approval reconciliation");
  }

  // 4.5 Admin -> 200 Authorized (PR-2026-08)
  if (adminUser) {
    const req = await createMockRequest("/api/v1/payroll/runs/PR-2026-08/reconciliation-preview", adminUser);
    const res = await getPreview(req, { params: Promise.resolve({ runId: "PR-2026-08" }) });
    assert(res.status === 200, "Admin role access returns HTTP 200 OK");
    const json = await res.json();
    assert(json.data.payrollRunId === "PR-2026-08", "Admin preview retrieves PR-2026-08");
    assert(json.data.eligibleForHistoricalAdjustment === true, "Admin preview reflects eligibleForHistoricalAdjustment = true");
    assert(json.data.source.itemized.headcount === 424, "PR-2026-08 itemized headcount is 424 verified payslips");
    assert(json.data.source.header.headcount === 429, "PR-2026-08 header headcount is 429");
    assert(json.data.variance.headcount === -5, "PR-2026-08 headcount variance is -5");
  }

  // 4.6 Missing Run -> 404
  if (adminUser) {
    const req = await createMockRequest("/api/v1/payroll/runs/PR-NONEXISTENT/reconciliation-preview", adminUser);
    const res = await getPreview(req, { params: Promise.resolve({ runId: "PR-NONEXISTENT" }) });
    assert(res.status === 404, "Nonexistent payroll run returns HTTP 404 Not Found");
  }

  // 4.7 Bad request (empty run ID)
  if (adminUser) {
    const req = await createMockRequest("/api/v1/payroll/runs/%20/reconciliation-preview", adminUser);
    const res = await getPreview(req, { params: Promise.resolve({ runId: " " }) });
    assert(res.status === 400, "Whitespace/empty payroll run returns HTTP 400 Bad Request");
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SUITE 5: Audit Transaction Compatibility & Atomicity Rollback (Disposable DB)
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("\n--- 5. Audit Transaction Compatibility & Atomicity Rollback (Disposable Database) ---");

  const devDbPath = path.resolve(process.cwd(), "prisma", "dev.db");
  const tempDbPath = path.resolve(process.cwd(), "prisma", "temp-atomicity-test.db");

  // Step 1: Copy dev.db to temp-atomicity-test.db
  fs.copyFileSync(devDbPath, tempDbPath);
  assert(fs.existsSync(tempDbPath), "Temporary isolated database file successfully created");

  // Step 2: Initialize isolated Prisma client pointing strictly to temp-atomicity-test.db
  const isolatedPrisma = new PrismaClient({
    datasources: {
      db: {
        url: `file:${tempDbPath}`,
      },
    },
  });

  try {
    const initialTempAudits = await isolatedPrisma.auditLog.count();
    const initialTempAdjustments = await isolatedPrisma.payrollAdjustment.count();

    console.log(`  Isolated DB Initial State: ${initialTempAudits} audit logs, ${initialTempAdjustments} adjustments`);

    // 5.1 Test atomic rollback on simulated failure
    let rollbackErrorCaught = false;
    try {
      await isolatedPrisma.$transaction(async (tx) => {
        // Step A: Insert audit log using the helper
        await persistPayrollAuditLog(tx, {
          eventId: generatePayrollAuditEventId("evt_test_rollback"),
          actorId: adminUser?.id || "usr_admin",
          actorEmail: adminUser?.email || "admin@example.com",
          actorRole: "ADMIN",
          action: "PAYROLL_PRE_APPROVAL_CORRECTION",
          fieldName: "reconciliation_status",
          oldValue: "54788660.03",
          newValue: "54430331.52",
          details: JSON.stringify({ test: "simulated_rollback" }),
        });

        // Step B: Intentionally throw to trigger transaction abort
        throw new Error("SIMULATED_TRANSACTION_FAILURE_FOR_ROLLBACK_VERIFICATION");
      });
    } catch (err) {
      if ((err as Error).message.includes("SIMULATED_TRANSACTION_FAILURE_FOR_ROLLBACK_VERIFICATION")) {
        rollbackErrorCaught = true;
      }
    }

    assert(rollbackErrorCaught, "Simulated transaction failure successfully triggered transaction abort");

    // Verify rollback: count MUST remain unchanged
    const postRollbackAudits = await isolatedPrisma.auditLog.count();
    assert(postRollbackAudits === initialTempAudits, `Atomicity rollback verified: audit_logs count remained ${postRollbackAudits} (did not increment)`);

    // 5.2 Test atomic commit on successful transaction
    let commitSuccess = false;
    let createdAuditId = "";
    try {
      createdAuditId = await isolatedPrisma.$transaction(async (tx) => {
        const auditId = await persistPayrollAuditLog(tx, {
          eventId: generatePayrollAuditEventId("evt_test_commit"),
          actorId: adminUser?.id || "usr_admin",
          actorEmail: adminUser?.email || "admin@example.com",
          actorRole: "ADMIN",
          action: "PAYROLL_HISTORICAL_ADJUSTED",
          fieldName: "reconciliation_status",
          oldValue: "48685007.97",
          newValue: "48450123.45",
          details: JSON.stringify({ test: "atomic_commit_verification" }),
        });
        return auditId;
      });
      commitSuccess = true;
    } catch (err) {
      console.error("Atomic commit unexpected error:", err);
    }

    assert(commitSuccess && createdAuditId.length > 0, "Audit persistence inside prisma.$transaction commits successfully on completion");

    const postCommitAudits = await isolatedPrisma.auditLog.count();
    assert(postCommitAudits === initialTempAudits + 1, `Post-commit audit_logs count incremented by exactly 1 (was ${initialTempAudits}, now ${postCommitAudits})`);
  } finally {
    // Disconnect isolated client and remove temporary database file
    await isolatedPrisma.$disconnect();
    if (fs.existsSync(tempDbPath)) {
      fs.unlinkSync(tempDbPath);
    }
  }

  assert(!fs.existsSync(tempDbPath), "Temporary isolated database file cleanly removed");

  // ─────────────────────────────────────────────────────────────────────────────
  // SUITE 6: Actor Security & Maker-Checker Dual-Control Governance
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("\n--- 6. Actor Security & Maker-Checker Dual-Control Governance ---");

  if (adminUser) {
    const adminCheck = await validatePayrollActor(adminUser.id);
    assert(adminCheck.valid === true, "Live active Admin user successfully validates");
  }

  if (hrUser) {
    const hrCheck = await validatePayrollActor(hrUser.id);
    assert(hrCheck.valid === true, "Live active HR user successfully validates");
  }

  const nonexistentActorCheck = await validatePayrollActor("usr_nonexistent_xyz");
  assert(nonexistentActorCheck.valid === false, "Non-existent user ID is rejected");

  if (adminUser && hrUser) {
    const selfApprovalCheck = validateMakerChecker(adminUser.id, adminUser.id);
    assert(selfApprovalCheck.valid === false, "Maker-Checker strictly rejects identical preparer and approver");

    const independentApprovalCheck = validateMakerChecker(hrUser.id, adminUser.id);
    assert(independentApprovalCheck.valid === true, "Maker-Checker accepts independent preparer (HR) and approver (Admin)");

    const emptyChecker = validateMakerChecker("", adminUser.id);
    assert(emptyChecker.valid === false, "Maker-Checker rejects empty preparer identifier");
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SUITE 7: Idempotency Key & Revision Sequencing Foundation
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("\n--- 7. Idempotency Key & Revision Sequencing Foundation ---");

  assert(validateIdempotencyKey("idem_pr202609_recon_001").valid === true, "Valid idempotency key accepted");
  assert(validateIdempotencyKey("8f3a9e2b-11d4-4a55-89c2-55fa1103cdef").valid === true, "Valid UUID idempotency key accepted");
  assert(validateIdempotencyKey("").valid === false, "Empty idempotency key rejected");
  assert(validateIdempotencyKey("short").valid === false, "Short idempotency key rejected");
  assert(validateIdempotencyKey("bad key with spaces!").valid === false, "Idempotency key with spaces rejected");

  assert(validateAdjustmentRevision(0, 1).valid === true, "Allows revision 1 after revision 0");
  assert(validateAdjustmentRevision(1, 2).valid === true, "Allows revision 2 after revision 1");
  assert(validateAdjustmentRevision(1, 1).valid === false, "Rejects duplicate revision 1 after revision 1");
  assert(validateAdjustmentRevision(1, 3).valid === false, "Rejects revision gap (skipping revision 2)");

  // ─────────────────────────────────────────────────────────────────────────────
  // SUITE 8: Zero-Mutation Database Preservation Assertion on prisma/dev.db
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("\n--- 8. Zero-Mutation Database Preservation Verification on prisma/dev.db ---");

  const finalRunsCount = await prisma.payrollRun.count();
  const finalPayslipsCount = await prisma.payslip.count();
  const finalEmployeesCount = await prisma.employee.count();
  const finalAdjustmentsCount = await prisma.payrollAdjustment.count();

  assert(finalRunsCount === 18, `payroll_runs count preserved at 18 (initial: 18, final: ${finalRunsCount})`);
  assert(finalPayslipsCount === 2469, `payslips count preserved at 2469 (initial: 2469, final: ${finalPayslipsCount})`);
  assert(finalEmployeesCount === 441, `employees count preserved at 441 (initial: 441, final: ${finalEmployeesCount})`);
  assert(finalAdjustmentsCount === 0, `payroll_adjustments count preserved at 0 (initial: 0, final: ${finalAdjustmentsCount})`);

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

runStep2A1Tests()
  .catch((err) => {
    console.error("Test execution fatal error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
