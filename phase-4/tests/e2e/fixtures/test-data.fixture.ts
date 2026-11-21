import { PrismaClient } from "@prisma/client";

/**
 * Horizon Portal — Test Data Fixture & Isolation Manager
 * tests/e2e/fixtures/test-data.fixture.ts
 *
 * Requirements:
 * 1. Create unique, isolated test records per test journey.
 * 2. Ensure zero dependency on execution order between tests.
 * 3. Track and clean up ONLY records created by the current test run.
 * 4. Never delete or mutate pre-existing database records.
 * 5. Strictly fail closed if targeting Production infrastructure.
 */

// Production protection guard
const dbUrl = process.env.DATABASE_URL || "file:./dev.db";
if (
  dbUrl.includes("ep-broad-hall-b3dtqwdp") ||
  dbUrl.includes("growmar-production")
) {
  throw new Error(
    "[SECURITY HALT] test-data fixture detected PRODUCTION database configuration! Direct fixture mutations against Production are strictly forbidden."
  );
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: dbUrl,
    },
  },
});

// Tracking sets for strict cleanup isolation
const createdLeaveRequestIds = new Set<string>();
const createdTaskIds = new Set<string>();
const createdPayslipIds = new Set<string>();
const baselineBalances = new Map<string, { cl: number; sl: number; el: number; pending: number }>();

export interface IsolatedLeaveOptions {
  employeeId?: string;
  leaveTypeCode?: string;
  days?: number;
  reason?: string;
  status?: "Pending" | "Approved" | "Rejected";
  startDate?: Date;
  endDate?: Date;
}

export interface IsolatedTaskOptions {
  teamId?: string;
  sprintId?: string;
  assigneeEmployeeId?: string;
  taskType?: string;
  priority?: string;
  storyPoints?: number;
  status?: "To Do" | "In Progress" | "Blocked" | "Done";
}

/**
 * Creates an independent, isolated LeaveRequest record.
 * Automatically registered for teardown cleanup.
 */
export async function createIsolatedLeaveRequest(options: IsolatedLeaveOptions = {}) {
  const employeeId = options.employeeId || "EMP-0188"; // Sophie Chen
  const leaveTypeCode = options.leaveTypeCode || "CL";
  const days = options.days ?? 1.0;
  const status = options.status || "Pending";
  const uniqueId = `E2E-LV-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  // Default to future working day
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 2);
  tomorrow.setHours(0, 0, 0, 0);

  const startDate = options.startDate || tomorrow;
  const endDate = options.endDate || tomorrow;
  const reason = options.reason || `Automated E2E Test Leave Request [${uniqueId}]`;

  // Capture baseline leave balance for restoration on cleanup
  if (!baselineBalances.has(employeeId)) {
    const bal = await prisma.leaveBalance.findUnique({ where: { employeeId } });
    if (bal) {
      baselineBalances.set(employeeId, {
        cl: bal.clBalance,
        sl: bal.slBalance,
        el: bal.elBalance,
        pending: bal.pendingDays,
      });
    }
  }

  const record = await prisma.leaveRequest.create({
    data: {
      id: uniqueId,
      employeeId,
      leaveTypeCode,
      startDate,
      endDate,
      days,
      status,
      reason,
      appliedOn: new Date(),
    },
  });

  createdLeaveRequestIds.add(record.id);
  return record;
}

/**
 * Creates an independent, isolated Kanban Task.
 * Automatically registered for teardown cleanup.
 */
export async function createIsolatedTask(options: IsolatedTaskOptions = {}) {
  const teamId = options.teamId || "T01";
  const sprintId = options.sprintId || "SP-01";
  const assigneeEmployeeId = options.assigneeEmployeeId || "EMP-0188"; // Sophie Chen
  const taskType = options.taskType || "Feature";
  const priority = options.priority || "P2";
  const storyPoints = options.storyPoints ?? 3;
  const status = options.status || "To Do";

  const uniqueId = `E2E-TSK-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  const createdDate = new Date();
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 7);

  const record = await prisma.task.create({
    data: {
      id: uniqueId,
      teamId,
      sprintId,
      assigneeEmployeeId,
      taskType,
      priority,
      storyPoints,
      createdDate,
      dueDate,
      status,
      isOverdueAtCutoff: "No",
      version: 0,
    },
    include: {
      team: true,
      sprint: true,
    },
  });

  createdTaskIds.add(record.id);
  return record;
}

/**
 * Retrieves a known existing payslip for the specified employee, or verifies availability.
 */
export async function getEmployeePayslip(employeeId = "EMP-0188") {
  const payslip = await prisma.payslip.findFirst({
    where: { employeeId },
    include: {
      payrollRun: true,
      employee: true,
    },
  });

  if (!payslip) {
    throw new Error(`[DATA FIXTURE ERROR] No seeded payslip found for test employee ${employeeId}.`);
  }

  return payslip;
}

/**
 * Retrieves a known foreign payslip belonging to a DIFFERENT employee for IDOR testing.
 */
export async function getForeignPayslip(excludeEmployeeId = "EMP-0188") {
  const foreignPayslip = await prisma.payslip.findFirst({
    where: {
      employeeId: { not: excludeEmployeeId },
    },
    include: {
      payrollRun: true,
      employee: true,
    },
  });

  if (!foreignPayslip) {
    throw new Error(
      `[DATA FIXTURE ERROR] No foreign payslip found excluding employee ${excludeEmployeeId}.`
    );
  }

  return foreignPayslip;
}

/**
 * Cleans up ONLY records created during the test run.
 * Pre-existing data is strictly preserved.
 */
export async function cleanupTestData(): Promise<{
  deletedLeaves: number;
  deletedTasks: number;
  deletedPayslips: number;
}> {
  let deletedLeaves = 0;
  let deletedTasks = 0;
  let deletedPayslips = 0;

  if (createdLeaveRequestIds.size > 0) {
    const res = await prisma.leaveRequest.deleteMany({
      where: { id: { in: Array.from(createdLeaveRequestIds) } },
    });
    deletedLeaves = res.count;
    createdLeaveRequestIds.clear();
  }

  if (createdTaskIds.size > 0) {
    const res = await prisma.task.deleteMany({
      where: { id: { in: Array.from(createdTaskIds) } },
    });
    deletedTasks = res.count;
    createdTaskIds.clear();
  }

  if (createdPayslipIds.size > 0) {
    const res = await prisma.payslip.deleteMany({
      where: { id: { in: Array.from(createdPayslipIds) } },
    });
    deletedPayslips = res.count;
    createdPayslipIds.clear();
  }

  // Restore employee leave balances to baseline to preserve deterministic idempotency
  for (const [empId, base] of baselineBalances.entries()) {
    await prisma.leaveBalance.update({
      where: { employeeId: empId },
      data: {
        clBalance: base.cl,
        slBalance: base.sl,
        elBalance: base.el,
        pendingDays: base.pending,
      },
    }).catch(() => {});
  }
  baselineBalances.clear();

  return { deletedLeaves, deletedTasks, deletedPayslips };
}

/**
 * Disconnects the Prisma client connection cleanly.
 */
export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();
}
