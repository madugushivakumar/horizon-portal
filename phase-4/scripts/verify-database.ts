/**
 * Database Verification & Table Count Audit
 * scripts/verify-database.ts
 *
 * Queries all 9 workforce tables + users table, checks foreign keys,
 * and validates database integrity.
 */

import { prisma } from "../src/lib/prisma";

async function verifyDatabase() {
  console.log("===============================================================");
  console.log("       HORIZON PORTAL — DATABASE AUDIT & TABLE VERIFICATION    ");
  console.log("===============================================================\n");

  // 1. Table Record Counts
  const [
    users,
    departments,
    roles,
    employees,
    payrollRuns,
    payslips,
    leaveTypes,
    leaveBalances,
    leaveRequests,
    holidays,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.department.count(),
    prisma.role.count(),
    prisma.employee.count(),
    prisma.payrollRun.count(),
    prisma.payslip.count(),
    prisma.leaveType.count(),
    prisma.leaveBalance.count(),
    prisma.leaveRequest.count(),
    prisma.holiday.count(),
  ]);

  console.log("▶ Current SQLite Database Record Counts (dev.db):");
  console.log(`  - users:           ${users}`);
  console.log(`  - departments:     ${departments}`);
  console.log(`  - roles:           ${roles}`);
  console.log(`  - employees:       ${employees}`);
  console.log(`  - payroll_runs:    ${payrollRuns}`);
  console.log(`  - payslips:        ${payslips}`);
  console.log(`  - leave_types:     ${leaveTypes}`);
  console.log(`  - leave_balances:  ${leaveBalances}`);
  console.log(`  - leave_requests:  ${leaveRequests}`);
  console.log(`  - holidays:        ${holidays}`);

  // 2. Foreign Key & Integrity Check
  console.log("\n▶ Foreign Key & Relationship Integrity Check:");
  const employeesWithoutDept = await prisma.employee.count({
    where: { departmentId: null },
  });
  console.log(`  - Employees without department: ${employeesWithoutDept}`);

  const employeesWithoutRole = await prisma.employee.count({
    where: { roleId: null },
  });
  console.log(`  - Employees without organizational role: ${employeesWithoutRole}`);

  const employeesWithManager = await prisma.employee.count({
    where: { managerId: { not: null } },
  });
  console.log(`  - Employees with manager relationship: ${employeesWithManager}`);

  const usersLinkedToEmployee = await prisma.user.count({
    where: { employeeId: { not: null } },
  });
  console.log(`  - Demo users linked to Employee records: ${usersLinkedToEmployee} / ${users}`);

  // Check SQLite PRAGMA foreign_key_check
  const fkViolations = await prisma.$queryRawUnsafe<unknown[]>("PRAGMA foreign_key_check;");
  console.log(`  - SQLite PRAGMA foreign_key_check violations: ${fkViolations.length}`);

  console.log("\n===============================================================\n");
}

verifyDatabase()
  .catch((err) => {
    console.error("Database audit failure:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
