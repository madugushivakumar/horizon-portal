import { PrismaClient } from "@prisma/client";
import { calculateWorkingDaysInRange, calculateOverlappingLeaveWorkingDays } from "../src/lib/capacity/working-days";
import { calculateEmployeeCapacity } from "../src/lib/capacity/capacity-calculator";

const prisma = new PrismaClient();

async function main() {
  const sprint = await prisma.sprint.findUniqueOrThrow({ where: { id: "SP-38" } });
  const holidays = await prisma.holiday.findMany();
  const holidayStrings = holidays.map((h) => h.date.toISOString().split("T")[0]);
  const sprintDays = calculateWorkingDaysInRange(sprint.startDate, sprint.endDate, holidayStrings);

  console.log("=== SPRINT SP-38 ===");
  console.log({
    name: sprint.sprintName,
    startDate: sprint.startDate.toISOString().split("T")[0],
    endDate: sprint.endDate.toISOString().split("T")[0],
    workingDays: sprintDays.workingDays,
    holidayCount: sprintDays.holidaysEncountered.length,
    holidayDates: sprintDays.holidaysEncountered,
  });

  const empIds = ["EMP-0092", "EMP-0286"];
  for (const id of empIds) {
    const emp = await prisma.employee.findUniqueOrThrow({
      where: { id },
      include: {
        department: true,
        role: true,
        leaveRequests: { where: { status: "Approved" } },
      },
    });

    const tasks = await prisma.task.findMany({
      where: {
        assigneeEmployeeId: id,
        sprintId: "SP-38",
      },
    });

    const leaveCalc = calculateOverlappingLeaveWorkingDays(
      sprint.startDate,
      sprint.endDate,
      emp.leaveRequests,
      holidayStrings
    );

    const metrics = calculateEmployeeCapacity({
      employeeId: emp.id,
      sprintWorkingDays: sprintDays.workingDays,
      approvedLeaveWorkingDays: leaveCalc.approvedLeaveWorkingDays,
      tasks: tasks.map((t) => ({
        id: t.id,
        assigneeEmployeeId: t.assigneeEmployeeId,
        sprintId: t.sprintId,
        status: t.status,
        storyPoints: t.storyPoints,
      })),
    });

    console.log(`\n=== EMPLOYEE: ${emp.fullName || `${emp.firstName} ${emp.lastName}`} (${emp.id}) ===`);
    console.log(`Email: ${emp.email}`);
    console.log(`Department: ${emp.department?.name} | Role: ${emp.role?.roleTitle}`);
    console.log("Approved Leaves in Sprint Range:");
    const leavesInSprint = emp.leaveRequests.filter(
      (l) => l.startDate <= sprint.endDate && l.endDate >= sprint.startDate
    );
    console.log(
      leavesInSprint.map((l) => ({
        id: l.id,
        leaveTypeCode: l.leaveTypeCode,
        start: l.startDate.toISOString().split("T")[0],
        end: l.endDate.toISOString().split("T")[0],
        recordedDays: l.days,
      }))
    );
    console.log(`Overlapping leave dates counted: ${JSON.stringify(leaveCalc.leaveDatesInSprint)}`);
    console.log("Tasks Assigned in Sprint SP-38:");
    console.log(
      tasks.map((t) => ({
        id: t.id,
        taskType: t.taskType,
        status: t.status,
        storyPoints: t.storyPoints,
      }))
    );
    console.log("Calculated Capacity Results:");
    console.log({
      grossCapacity: metrics.grossCapacity,
      approvedLeaveWorkingDays: metrics.approvedLeaveWorkingDays,
      leaveCapacityReduction: metrics.leaveCapacityReduction,
      availableWorkingDays: metrics.availableWorkingDays,
      netCapacity: metrics.netCapacity,
      plannedOpenPoints: metrics.plannedOpenPoints,
      completedPoints: metrics.completedPoints,
      totalPlannedPoints: metrics.totalPlannedPoints,
      excessPoints: metrics.excessPoints,
      utilizationPercentage: metrics.utilizationPercentage,
      classification: metrics.classification,
      isOverloaded: metrics.isOverloaded,
      warningMessage: metrics.warningMessage,
    });
  }

  await prisma.$disconnect();
}

main().catch(console.error);
