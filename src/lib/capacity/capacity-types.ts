/**
 * Horizon Portal — Capacity & Workload Engine Types
 * src/lib/capacity/capacity-types.ts
 *
 * Strict TypeScript domain models, constants, and calculation interfaces
 * for Day 14: Advanced Workload and Capacity Views.
 */

export const DAILY_STORY_POINT_CAPACITY = 5;

export const OPEN_TASK_STATUSES = ["To Do", "In Progress", "Blocked"] as const;
export type OpenTaskStatus = (typeof OPEN_TASK_STATUSES)[number];

export const COMPLETED_TASK_STATUSES = ["Done"] as const;
export type CompletedTaskStatus = (typeof COMPLETED_TASK_STATUSES)[number];

export const EXCLUDED_TASK_STATUSES = ["Cancelled"] as const;
export type ExcludedTaskStatus = (typeof EXCLUDED_TASK_STATUSES)[number];

export const WORKLOAD_CLASSIFICATIONS = [
  "Available",
  "Near Capacity",
  "At Capacity",
  "Overloaded",
] as const;

export type WorkloadClassification = (typeof WORKLOAD_CLASSIFICATIONS)[number];

export interface SprintDateRange {
  startDate: Date | string;
  endDate: Date | string;
}

export interface LeavePeriodInput {
  id?: string;
  startDate: Date | string;
  endDate: Date | string;
  status: string;
  days?: number;
}

export interface TaskWorkloadInput {
  id: string;
  storyPoints: number;
  status: string;
  assigneeEmployeeId: string;
}

export interface SprintWorkingDaysResult {
  workingDays: number;
  totalCalendarDays: number;
  weekendDays: number;
  holidayDays: number;
  workingDateStrings: string[];
  holidaysEncountered: string[];
}

export interface EmployeeLeaveCalculationResult {
  approvedLeaveWorkingDays: number;
  leaveDatesInSprint: string[];
  leaveReductionPoints: number;
  availableWorkingDays: number;
}

export interface WorkloadClassificationResult {
  classification: WorkloadClassification;
  isOverloaded: boolean;
  excessPoints: number;
  utilizationPercentage: number;
  warningMessage: string | null;
}

export interface EmployeeCapacityMetrics {
  employeeId: string;
  grossCapacity: number;
  approvedLeaveWorkingDays: number;
  leaveCapacityReduction: number;
  availableWorkingDays: number;
  netCapacity: number;
  plannedOpenPoints: number;
  completedPoints: number;
  totalPlannedPoints: number;
  excessPoints: number;
  utilizationPercentage: number;
  classification: WorkloadClassification;
  isOverloaded: boolean;
  warningMessage: string | null;
}

export interface SprintProgressMetrics {
  plannedPoints: number;
  completedPoints: number;
  remainingPoints: number;
  completionPercentage: number;
}

export interface SprintCapacitySummary {
  totalEmployees: number;
  overloadedEmployees: number;
  nearCapacityEmployees: number;
  availableEmployees: number;
  atCapacityEmployees: number;
  totalGrossCapacity: number;
  totalNetCapacity: number;
  totalOpenPoints: number;
  totalCompletedPoints: number;
  totalPlannedPoints: number;
  completionPercentage: number;
  workingDays: number;
}

export interface CapacityConfiguration {
  dailyStoryPointCapacity: number;
  capacityUnit: "story_points";
  assumptions: string[];
}

export const DEFAULT_CAPACITY_CONFIGURATION: CapacityConfiguration = {
  dailyStoryPointCapacity: DAILY_STORY_POINT_CAPACITY,
  capacityUnit: "story_points",
  assumptions: [
    "Monday to Friday are working days (weekends excluded)",
    "Official organization holidays falling on weekdays are excluded",
    "Only approved leaves reduce available capacity",
    "Overlapping approved leave records for the same date are deduplicated",
    "Story points represent relative planning effort and are not equivalent to hours",
    "Leave reduces estimated capacity, not assigned task points",
  ],
};

export interface SerializedEmployeeCapacityRecord {
  employeeId: string;
  employeeName: string;
  email: string;
  department: string | null;
  roleTitle: string | null;
  teams: string[];
  sprintId: string;
  sprintName: string;
  grossCapacity: number;
  approvedLeaveWorkingDays: number;
  leaveCapacityReduction: number;
  availableWorkingDays: number;
  netCapacity: number;
  plannedOpenPoints: number;
  completedPoints: number;
  totalPlannedPoints: number;
  excessPoints: number;
  utilizationPercentage: number | null;
  utilizationDisplay: string;
  classification: WorkloadClassification;
  isOverloaded: boolean;
  warningMessage: string | null;
}

export interface CapacityDashboardSummary extends SprintCapacitySummary {
  remainingPoints: number;
}

export interface CapacitySprintInfo {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  workingDays: number;
}

export interface CapacityDashboardData {
  sprint: CapacitySprintInfo;
  configuration: CapacityConfiguration;
  summary: CapacityDashboardSummary;
  sprintProgress: SprintProgressMetrics;
  employees: SerializedEmployeeCapacityRecord[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface CapacityApiResponse {
  success: boolean;
  data: CapacityDashboardData;
}

export interface CapacityFiltersData {
  sprints: CapacitySprintInfo[];
  teams: Array<{
    id: string;
    teamName: string;
  }>;
}

export interface CapacityFiltersResponse {
  success: boolean;
  data: CapacityFiltersData;
}
