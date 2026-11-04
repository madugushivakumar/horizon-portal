/**
 * Horizon Portal — Task Board Data Contracts
 * src/types/task.ts
 *
 * Strict TypeScript types for the Team Task Board frontend:
 * - Reflects the exact GET /api/v1/tasks backend response.
 * - Enforces safe employee assignee projection (no compensation/credentials).
 * - Defines Kanban column categories, priorities, and pagination models.
 */

export type TaskStatus = "To Do" | "In Progress" | "Blocked" | "Done";

export type TaskPriority = "P1" | "P2" | "P3" | "P4";

export interface SafeTaskAssignee {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string | null;
  email: string;
}

export interface TaskTeamRef {
  id: string;
  teamName: string;
}

export interface TaskSprintRef {
  id: string;
  sprintName: string;
}

export interface Task {
  id: string;
  teamId: string;
  sprintId: string;
  assigneeEmployeeId: string;
  taskType: string;
  priority: TaskPriority | string;
  storyPoints: number;
  createdDate: string;
  startedDate: string | null;
  dueDate: string;
  completedDate: string | null;
  status: TaskStatus | string;
  version: number;
  createdAt: string;
  updatedAt: string;
  team: TaskTeamRef;
  sprint: TaskSprintRef;
  assignee: SafeTaskAssignee | null;
}

export interface TaskPagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface TaskApiResponse {
  success: boolean;
  data: Task[];
  pagination: TaskPagination;
}

export interface TaskBoardFiltersState {
  teamId: string;
  sprintId: string;
}

export interface TeamOption {
  id: string;
  teamName: string;
}

export interface SprintOption {
  id: string;
  sprintName: string;
}

export interface TaskBoardSummaryMetrics {
  totalLoaded: number;
  totalMatching: number;
  toDoCount: number;
  inProgressCount: number;
  blockedCount: number;
  doneCount: number;
}

export interface TaskBoardNotification {
  id: string;
  type: "success" | "warning" | "error" | "info";
  message: string;
}
