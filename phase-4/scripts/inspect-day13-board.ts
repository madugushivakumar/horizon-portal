import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("\n--- DATABASE COUNTS ---");

  const [teams, sprints, tasks] = await Promise.all([
    prisma.team.count(),
    prisma.sprint.count(),
    prisma.task.count(),
  ]);

  console.log({ teams, sprints, tasks });

  console.log("\n--- DATABASE STATUS DISTRIBUTION ---");

  const statuses = await prisma.task.groupBy({
    by: ["status"],
    _count: { _all: true },
    orderBy: { status: "asc" },
  });

  console.table(
    statuses.map((item) => ({
      status: item.status,
      count: item._count._all,
    }))
  );

  console.log("\n--- DATABASE PRIORITY DISTRIBUTION ---");

  const priorities = await prisma.task.groupBy({
    by: ["priority"],
    _count: { _all: true },
    orderBy: { priority: "asc" },
  });

  console.table(
    priorities.map((item) => ({
      priority: item.priority,
      count: item._count._all,
    }))
  );

  console.log("\n--- SAMPLE TASK RECORDS ---");

  const samples = await prisma.task.findMany({
    take: 5,
    select: {
      id: true,
      teamId: true,
      sprintId: true,
      taskType: true,
      priority: true,
      storyPoints: true,
      status: true,
      dueDate: true,
    },
  });

  console.dir(samples, { depth: null });
}

main()
  .catch((error) => {
    console.error("Database inspection failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
