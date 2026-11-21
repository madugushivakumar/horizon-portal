/**
 * Horizon Portal — True Concurrent Approval Race-Condition Verification Suite
 * scripts/test-concurrency-approvals.ts
 */

import { prisma } from "../src/lib/prisma";
import {
  createExpenseAuthorization,
  decideExpenseAuthorization,
} from "../src/lib/expense-authorization/service";
import { AuthenticatedUser } from "../src/lib/auth/user";

const managerActor: AuthenticatedUser = {
  id: "user-mgr-01",
  email: "manager@horizon.internal",
  name: "Sarah Connor",
  role: "Manager",
  employeeId: "emp-mgr-01",
  isActive: true,
};

const employeeActor: AuthenticatedUser = {
  id: "user-sub-01",
  email: "john@horizon.internal",
  name: "John Doe",
  role: "Employee",
  employeeId: "emp-sub-01",
  isActive: true,
};

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${testName}${detail ? ` - ${detail}` : ""}`);
    failed++;
  }
}

async function runConcurrencyTests() {
  console.log("================================================================================");
  console.log("DAY 20 — ISSUE C: TRUE CONCURRENT APPROVAL RACE-CONDITION VERIFICATION");
  console.log("================================================================================");

  // Setup prerequisites: ensure department and employees exist
  let dept = await prisma.department.findFirst();
  if (!dept) {
    dept = await prisma.department.create({
      data: { id: "dept-eng-01", name: "Engineering", code: "ENG" },
    });
  }

  let mgr = await prisma.employee.findUnique({ where: { id: "emp-mgr-01" } });
  if (!mgr) {
    mgr = await prisma.employee.create({
      data: {
        id: "emp-mgr-01",
        firstName: "Sarah",
        lastName: "Connor",
        email: "manager@horizon.internal",
        departmentId: dept.id,
        hireDate: new Date("2021-01-15"),
        status: "Active",
      },
    });
  }

  let sub = await prisma.employee.findUnique({ where: { id: "emp-sub-01" } });
  if (!sub) {
    sub = await prisma.employee.create({
      data: {
        id: "emp-sub-01",
        firstName: "John",
        lastName: "Doe",
        email: "john@horizon.internal",
        departmentId: dept.id,
        managerId: "emp-mgr-01",
        hireDate: new Date("2022-03-01"),
        status: "Active",
      },
    });
  }

  // Ensure user records exist for notification delivery
  let subUser = await prisma.user.findFirst({ where: { employeeId: "emp-sub-01" } });
  if (!subUser) {
    subUser = await prisma.user.create({
      data: {
        id: "user-sub-01",
        email: "john@horizon.internal",
        name: "John Doe",
        passwordHash: "synthetic_hash",
        role: "Employee",
        employeeId: "emp-sub-01",
        isActive: true,
      },
    });
  }

  // Initial AP count baseline
  const initialApCount = await prisma.expense.count();
  const initialApPaid = await prisma.expense.count({ where: { status: "PAID" } });
  const initialApUnpaid = await prisma.expense.count({ where: { status: "UNPAID" } });
  console.log(`\n[BASELINE] General Ledger Expenses: ${initialApCount} (PAID: ${initialApPaid}, UNPAID: ${initialApUnpaid})`);

  // --- SCENARIO 1: TWO SIMULTANEOUS APPROVALS ---
  console.log("\n--- SCENARIO 1: TWO SIMULTANEOUS APPROVALS (10 REPETITIONS) ---");
  for (let cycle = 1; cycle <= 10; cycle++) {
    const created = await createExpenseAuthorization(employeeActor, {
      title: `Concurrent Approval Test Cycle ${cycle}`,
      description: "Testing simultaneous approval requests",
      category: 5101,
      requestedAmount: 500 + cycle,
      currency: "USD",
      departmentId: dept.id,
    });
    assert(!!created && !!created.id, `Cycle ${cycle}: Created authorization ${created?.referenceNumber}`);
    const authId = created.id;

    // Send two simultaneous approval decisions
    const [resA, resB] = await Promise.all([
      decideExpenseAuthorization(managerActor, authId, { action: "APPROVE", approvalNotes: "Fast approval A" }),
      decideExpenseAuthorization(managerActor, authId, { action: "APPROVE", approvalNotes: "Fast approval B" }),
    ]);

    const successes = [resA, resB].filter((r) => r.success && r.statusCode === 200);
    const conflicts = [resA, resB].filter((r) => !r.success && r.statusCode === 409);

    assert(successes.length === 1, `Cycle ${cycle}: Exactly one approval succeeded (Successes: ${successes.length})`);
    assert(conflicts.length === 1, `Cycle ${cycle}: Competing request rejected with HTTP 409 (Conflicts: ${conflicts.length})`);

    // Verify database state: status is APPROVED
    const record = await prisma.corporateExpenseAuthorization.findUnique({ where: { id: authId } });
    assert(record?.status === "APPROVED", `Cycle ${cycle}: Database state is APPROVED (Observed: ${record?.status})`);

    // Verify audit log count: exactly one decision audit event
    const decisionAudits = await prisma.auditLog.findMany({
      where: {
        action: { in: ["EXPENSE_AUTH_APPROVED", "EXPENSE_AUTH_REJECTED"] },
        details: { contains: authId },
      },
    });
    assert(decisionAudits.length === 1, `Cycle ${cycle}: Exactly one decision audit log recorded (Observed: ${decisionAudits.length})`);

    // Verify notifications: exactly one notification sent
    const notifs = await prisma.notification.findMany({
      where: { eventKey: { in: [`EXPENSE_AUTH_APPROVED_${authId}`, `EXPENSE_AUTH_REJECTED_${authId}`] } },
    });
    assert(notifs.length === 1, `Cycle ${cycle}: Exactly one notification sent (Observed: ${notifs.length})`);
  }

  // --- SCENARIO 2: SIMULTANEOUS APPROVAL VS REJECTION RACE ---
  console.log("\n--- SCENARIO 2: SIMULTANEOUS APPROVAL VS REJECTION RACE (10 REPETITIONS) ---");
  for (let cycle = 1; cycle <= 10; cycle++) {
    const created = await createExpenseAuthorization(employeeActor, {
      title: `Approve vs Reject Race Cycle ${cycle}`,
      description: "Testing conflicting simultaneous decisions",
      category: 5102,
      requestedAmount: 750 + cycle,
      currency: "USD",
      departmentId: dept.id,
    });
    const authId = created.id;

    // Send simultaneous APPROVE and REJECT decisions
    const [resApprove, resReject] = await Promise.all([
      decideExpenseAuthorization(managerActor, authId, { action: "APPROVE", approvalNotes: "Race Approval" }),
      decideExpenseAuthorization(managerActor, authId, { action: "REJECT", rejectionReason: "Race Rejection Reason" }),
    ]);

    const successes = [resApprove, resReject].filter((r) => r.success && r.statusCode === 200);
    const conflicts = [resApprove, resReject].filter((r) => !r.success && r.statusCode === 409);

    assert(successes.length === 1, `Race Cycle ${cycle}: Exactly one decision won the race (Successes: ${successes.length})`);
    assert(conflicts.length === 1, `Race Cycle ${cycle}: Losing decision received HTTP 409 Conflict (Conflicts: ${conflicts.length})`);

    const winnerAction = resApprove.success ? "APPROVED" : "REJECTED";
    const record = await prisma.corporateExpenseAuthorization.findUnique({ where: { id: authId } });
    assert(record?.status === winnerAction, `Race Cycle ${cycle}: Database status matches winner: ${winnerAction}`);

    // Verify no contradictory audit logs exist
    const decisionAudits = await prisma.auditLog.findMany({
      where: {
        action: { in: ["EXPENSE_AUTH_APPROVED", "EXPENSE_AUTH_REJECTED"] },
        details: { contains: authId },
      },
    });
    assert(decisionAudits.length === 1, `Race Cycle ${cycle}: Exactly 1 audit record without contradictory decisions`);
    assert(decisionAudits[0].action === `EXPENSE_AUTH_${winnerAction}`, `Race Cycle ${cycle}: Audit log action matches winner: ${decisionAudits[0].action}`);
  }

  // --- SCENARIO 3: HIGH-CONCURRENCY STORM (5 SIMULTANEOUS REQUESTS) ---
  console.log("\n--- SCENARIO 3: HIGH-CONCURRENCY STORM (5 SIMULTANEOUS REQUESTS, 5 CYCLES) ---");
  for (let cycle = 1; cycle <= 5; cycle++) {
    const created = await createExpenseAuthorization(employeeActor, {
      title: `Storm Concurrency Cycle ${cycle}`,
      description: "5 simultaneous decisions",
      category: 5103,
      requestedAmount: 1200 + cycle,
      currency: "USD",
      departmentId: dept.id,
    });
    const authId = created.id;

    // Send 5 concurrent requests at once
    const promises = [
      decideExpenseAuthorization(managerActor, authId, { action: "APPROVE", approvalNotes: "Storm 1" }),
      decideExpenseAuthorization(managerActor, authId, { action: "REJECT", rejectionReason: "Storm Rejection 2" }),
      decideExpenseAuthorization(managerActor, authId, { action: "APPROVE", approvalNotes: "Storm 3" }),
      decideExpenseAuthorization(managerActor, authId, { action: "REJECT", rejectionReason: "Storm Rejection 4" }),
      decideExpenseAuthorization(managerActor, authId, { action: "APPROVE", approvalNotes: "Storm 5" }),
    ];

    const results = await Promise.all(promises);
    const successes = results.filter((r) => r.success && r.statusCode === 200);
    const conflicts = results.filter((r) => !r.success && r.statusCode === 409);

    assert(successes.length === 1, `Storm Cycle ${cycle}: Exactly 1 request won the race (Successes: ${successes.length})`);
    assert(conflicts.length === 4, `Storm Cycle ${cycle}: Exactly 4 requests received HTTP 409 Conflict (Conflicts: ${conflicts.length})`);

    const finalAudits = await prisma.auditLog.findMany({
      where: {
        action: { in: ["EXPENSE_AUTH_APPROVED", "EXPENSE_AUTH_REJECTED"] },
        details: { contains: authId },
      },
    });
    assert(finalAudits.length === 1, `Storm Cycle ${cycle}: Zero duplicate audit events (Count: ${finalAudits.length})`);
  }

  // --- SCENARIO 4: GENERAL LEDGER ACCOUNTS PAYABLE PRESERVATION ---
  console.log("\n--- SCENARIO 4: ACCOUNTS PAYABLE PRESERVATION VERIFICATION ---");
  const finalApCount = await prisma.expense.count();
  const finalApPaid = await prisma.expense.count({ where: { status: "PAID" } });
  const finalApUnpaid = await prisma.expense.count({ where: { status: "UNPAID" } });

  assert(finalApCount === initialApCount, `Total AP Expense records unchanged: ${finalApCount} (Initial: ${initialApCount})`);
  assert(finalApPaid === initialApPaid, `PAID AP Expense records unchanged: ${finalApPaid} (Initial: ${initialApPaid})`);
  assert(finalApUnpaid === initialApUnpaid, `UNPAID AP Expense records unchanged: ${finalApUnpaid} (Initial: ${initialApUnpaid})`);

  console.log("\n================================================================================");
  console.log(`CONCURRENCY TEST SUMMARY: ${passed} PASSED, ${failed} FAILED (TOTAL: ${passed + failed})`);
  console.log("================================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runConcurrencyTests().catch((e) => {
  console.error("Fatal concurrency test error:", e);
  process.exit(1);
});
