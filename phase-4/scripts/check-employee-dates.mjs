import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const statuses = await prisma.employee.groupBy({
    by: ["status"],
    _count: true,
  });
  console.log("Employee statuses in DB:", statuses);

  const employees = await prisma.employee.findMany({
    select: {
      id: true,
      hireDate: true,
      status: true,
    },
    orderBy: { hireDate: "asc" },
  });

  const earliestHire = employees[0].hireDate;
  const latestHire = employees[employees.length - 1].hireDate;
  console.log(`Total employees: ${employees.length}`);
  console.log(`Earliest hire date: ${earliestHire?.toISOString().split("T")[0]}`);
  console.log(`Latest hire date: ${latestHire?.toISOString().split("T")[0]}`);

  // Check audit logs for any employee deactivations or terminations
  const deactivations = await prisma.auditLog.findMany({
    where: {
      action: {
        contains: "DEACTIVATE",
      },
    },
  });
  console.log(`Deactivation audit logs: ${deactivations.length}`);
}

main().finally(async () => {
  await prisma.$disconnect();
});

