/**
 * Horizon Portal — Task Validation Schemas
 * src/lib/validations/task.ts
 *
 * Implements strict Zod validation schemas for:
 * - GET /api/v1/tasks query parameters (pagination, optional teamId & sprintId filters)
 * - PATCH /api/v1/tasks/[id] request body (status enum, expectedVersion concurrency token)
 */

import { z } from "zod";

export const KANBAN_TASK_STATUSES = [
  "To Do",
  "In Progress",
  "Blocked",
  "Done",
] as const;

export type KanbanTaskStatus = (typeof KANBAN_TASK_STATUSES)[number];

/**
 * GET /api/v1/tasks query parameter schema
 * Validates integer pagination (page >= 1, 1 <= pageSize <= 100)
 * and optional teamId / sprintId filters.
 * Empty string filter values are safely converted to undefined.
 */
export const taskQuerySchema = z.object({
  departmentId: z.preprocess(
    (val) => (typeof val === "string" && val.trim() === "" ? undefined : val),
    z.string().trim().min(1, "departmentId cannot be empty if provided.").optional()
  ),
  teamId: z.preprocess(
    (val) => (typeof val === "string" && val.trim() === "" ? undefined : val),
    z.string().trim().min(1, "teamId cannot be empty if provided.").optional()
  ),
  sprintId: z.preprocess(
    (val) => (typeof val === "string" && val.trim() === "" ? undefined : val),
    z.string().trim().min(1, "sprintId cannot be empty if provided.").optional()
  ),
  page: z.preprocess(
    (val) => {
      if (val === undefined || val === null || val === "") return 1;
      const num = Number(val);
      return isNaN(num) ? val : num;
    },
    z
      .number()
      .int("page must be an integer.")
      .min(1, "page must be greater than or equal to 1.")
      .default(1)
  ),
  pageSize: z.preprocess(
    (val) => {
      if (val === undefined || val === null || val === "") return 50;
      const num = Number(val);
      return isNaN(num) ? val : num;
    },
    z
      .number()
      .int("pageSize must be an integer.")
      .min(1, "pageSize must be at least 1.")
      .max(100, "pageSize cannot exceed 100.")
      .default(50)
  ),
});

export type TaskQueryInput = z.infer<typeof taskQuerySchema>;

/**
 * PATCH /api/v1/tasks/[id] request body schema
 * Requires:
 * - status: one of "To Do", "In Progress", "Blocked", "Done"
 * - expectedVersion: non-negative integer for optimistic concurrency control
 * Strict mode ensures unexpected fields (like teamId, assignee, etc.) are rejected.
 */
export const taskStatusUpdateSchema = z
  .object({
    status: z.enum(KANBAN_TASK_STATUSES),
    expectedVersion: z
      .number()
      .int("expectedVersion must be an integer.")
      .min(0, "expectedVersion cannot be negative."),
  })
  .strict();

export type TaskStatusUpdateInput = z.infer<typeof taskStatusUpdateSchema>;
