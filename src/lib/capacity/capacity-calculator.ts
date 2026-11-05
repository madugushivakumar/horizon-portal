/**
 * Horizon Portal — Capacity Calculation Engine
 * src/lib/capacity/capacity-calculator.ts
 *
 * Centralized, strongly typed calculation service for Day 14.
 * Computes:
 * - Gross Capacity: Sprint Working Days × Daily Baseline
 * - Leave Reduction: Approved Leave Working Days × Daily Baseline
 * - Available Working Days: max(0, Sprint Working Days - Approved Leave Working Days)
 * - Net Capacity: Available Working Days × Daily Baseline
 * - Workload: Planned Open Points (To Do, In Progress, Blocked) vs Completed (Done)
 * - Excludes Cancelled tasks from all workload sums.
 * - Aggregates sprint-level summary and progress metrics.
 */

import {
  COMPLETED_TASK_STATUSES,
  DAILY_STORY_POINT_CAPACITY,
  EmployeeCapacityMetrics,
  OPEN_TASK_STATUSES,
  SprintCapacitySummary,
  SprintProgressMetrics,
  TaskWorkloadInput,
} from "./capacity-types";
import { classifyWorkload } from "./workload-classifier";

/**
 * Calculates capacity, workload, and utilization metrics for an individual employee.
 *
 * Formula:
 * - Gross Capacity = Sprint Working Days × Daily Baseline
 * - Leave Reduction = Approved Leave Working Days × Daily Baseline
 * - Available Working Days = max(0, Sprint Working Days - Approved Leave Working Days)
 * - Net Capacity = Available Working Days × Daily Baseline
 * - Planned Open Points = Sum(storyPoints of tasks in ['To Do', 'In Progress', 'Blocked'])
 * - Completed Points = Sum(storyPoints of tasks in ['Done'])
 * - Cancelled tasks are strictly excluded.
 */
export function calculateEmployeeCapacity(params: {
  employeeId: string;
  sprintWorkingDays: number;
  approvedLeaveWorkingDays: number;
  tasks: TaskWorkloadInput[];
  dailyStoryPointCapacity?: number;
}): EmployeeCapacityMetrics {
  const {
    employeeId,
    sprintWorkingDays,
    approvedLeaveWorkingDays,
    tasks,
    dailyStoryPointCapacity = DAILY_STORY_POINT_CAPACITY,
  } = params;

  // 1. Working days and capacity bounds
  const safeSprintDays = Math.max(0, sprintWorkingDays);
  const safeLeaveDays = Math.max(0, Math.min(safeSprintDays, approvedLeaveWorkingDays));
  const availableWorkingDays = Math.max(0, safeSprintDays - safeLeaveDays);

  const grossCapacity = safeSprintDays * dailyStoryPointCapacity;
  const leaveCapacityReduction = safeLeaveDays * dailyStoryPointCapacity;
  const netCapacity = availableWorkingDays * dailyStoryPointCapacity;

  // 2. Filter tasks assigned to this employee and partition by status
  const employeeTasks = tasks.filter((t) => t.assigneeEmployeeId === employeeId);

  let plannedOpenPoints = 0;
  let completedPoints = 0;

  for (const task of employeeTasks) {
    const status = task.status;
    const points = typeof task.storyPoints === "number" && !isNaN(task.storyPoints) ? task.storyPoints : 0;

    // Check completed
    if (COMPLETED_TASK_STATUSES.includes(status as (typeof COMPLETED_TASK_STATUSES)[number])) {
      completedPoints += points;
      continue;
    }

    // Check open (active)
    if (OPEN_TASK_STATUSES.includes(status as (typeof OPEN_TASK_STATUSES)[number])) {
      plannedOpenPoints += points;
      continue;
    }

    // Cancelled tasks or unrecognized statuses are strictly excluded from open and completed workload
  }

  const totalPlannedPoints = plannedOpenPoints + completedPoints;

  // 3. Classify workload against net capacity
  const classificationResult = classifyWorkload(plannedOpenPoints, netCapacity);

  return {
    employeeId,
    grossCapacity,
    approvedLeaveWorkingDays: safeLeaveDays,
    leaveCapacityReduction,
    availableWorkingDays,
    netCapacity,
    plannedOpenPoints,
    completedPoints,
    totalPlannedPoints,
    excessPoints: classificationResult.excessPoints,
    utilizationPercentage: classificationResult.utilizationPercentage,
    classification: classificationResult.classification,
    isOverloaded: classificationResult.isOverloaded,
    warningMessage: classificationResult.warningMessage,
  };
}

/**
 * Calculates sprint progress metrics (planned, completed, remaining, and percentage).
 */
export function calculateSprintProgress(
  totalOpenPoints: number,
  totalCompletedPoints: number
): SprintProgressMetrics {
  const plannedPoints = totalOpenPoints + totalCompletedPoints;
  const remainingPoints = totalOpenPoints;
  const completionPercentage =
    plannedPoints > 0 ? Math.round((totalCompletedPoints / plannedPoints) * 1000) / 10 : 0;

  return {
    plannedPoints,
    completedPoints: totalCompletedPoints,
    remainingPoints,
    completionPercentage,
  };
}

/**
 * Aggregates all employee capacity metrics into an organization/sprint-level summary.
 */
export function calculateSprintCapacitySummary(
  employeeMetrics: EmployeeCapacityMetrics[],
  sprintWorkingDays: number
): SprintCapacitySummary {
  let overloadedEmployees = 0;
  let nearCapacityEmployees = 0;
  let availableEmployees = 0;
  let atCapacityEmployees = 0;

  let totalGrossCapacity = 0;
  let totalNetCapacity = 0;
  let totalOpenPoints = 0;
  let totalCompletedPoints = 0;

  for (const emp of employeeMetrics) {
    totalGrossCapacity += emp.grossCapacity;
    totalNetCapacity += emp.netCapacity;
    totalOpenPoints += emp.plannedOpenPoints;
    totalCompletedPoints += emp.completedPoints;

    switch (emp.classification) {
      case "Overloaded":
        overloadedEmployees++;
        break;
      case "Near Capacity":
        nearCapacityEmployees++;
        break;
      case "At Capacity":
        atCapacityEmployees++;
        break;
      case "Available":
        availableEmployees++;
        break;
    }
  }

  const totalPlannedPoints = totalOpenPoints + totalCompletedPoints;
  const progress = calculateSprintProgress(totalOpenPoints, totalCompletedPoints);

  return {
    totalEmployees: employeeMetrics.length,
    overloadedEmployees,
    nearCapacityEmployees,
    availableEmployees,
    atCapacityEmployees,
    totalGrossCapacity,
    totalNetCapacity,
    totalOpenPoints,
    totalCompletedPoints,
    totalPlannedPoints,
    completionPercentage: progress.completionPercentage,
    workingDays: sprintWorkingDays,
  };
}
