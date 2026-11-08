import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== INSPECTING EMPLOYEES & HIRE DATES ===");

  // Find employees with hireDate in September or October 2026
  const emps = await prisma.employee.findMany({
    where: {
      hireDate: {
        gte: new Date("2026-08-01T00:00:00.000Z")
      }
    },
    orderBy: { hireDate: "asc" },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      hireDate: true,
      salary: true,
      status: true
    }
  });

  console.log(`Employees hired on or after Aug 1, 2026: ${emps.length}`);
  for (const e of emps) {
    console.log(`ID: ${e.id} | ${e.firstName} ${e.lastName} | Hired: ${e.hireDate.toISOString()} | Salary: ₹${e.salary}`);
    const slips = await prisma.payslip.findMany({
      where: { employeeId: e.id },
      select: { payrollRunId: true, grossPay: true, netPay: true, deductions: true }
    });
    console.log(`  Payslips: ${slips.map(s => `${s.payrollRunId} (Gross: ₹${s.grossPay}, Net: ₹${s.netPay})`).join("; ")}`);
  }

  // Look for any employees with ID >= 420
  const maxEmps = await prisma.employee.findMany({
    orderBy: { id: "desc" },
    take: 15,
    select: { id: true, firstName: true, lastName: true, hireDate: true }
  });
  console.log("\nLast 15 employees by ID descending:");
  for (const e of maxEmps) {
    console.log(`  ${e.id} | ${e.firstName} ${e.lastName} | Hired: ${e.hireDate.toISOString()}`);
  }
}

main().finally(async () => {
  await prisma.$disconnect();
});

