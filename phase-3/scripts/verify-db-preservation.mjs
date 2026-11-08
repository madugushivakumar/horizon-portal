import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const [runs, slips, emps] = await Promise.all([
    prisma.payrollRun.count(),
    prisma.payslip.count(),
    prisma.employee.count(),
  ]);

  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    payrollRuns: runs,
    payslips: slips,
    employees: emps,
  }, null, 2));
}

main().finally(async () => {
  await prisma.$disconnect();
});

