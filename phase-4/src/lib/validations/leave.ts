/**
 * Horizon Portal — Leave Management Validation Schemas
 * src/lib/validations/leave.ts
 *
 * Implements strict Zod validation for:
 * - POST /api/v1/leave/requests (submission)
 * - GET  /api/v1/leave/calendar (calendar query params)
 * - POST /api/v1/approvals/leave/[id]/approve (optional notes)
 * - POST /api/v1/approvals/leave/[id]/reject (mandatory reason)
 * - POST /api/v1/approvals/delegations (delegation creation)
 */

import { z } from "zod";

/**
 * Leave request submission schema (POST /api/v1/leave/requests)
 */
export const leaveRequestInputSchema = z.object({
  leaveTypeCode: z
    .string({ error: "Leave type is required." })
    .trim()
    .min(1, "Leave type is required.")
    .max(50, "Leave type code cannot exceed 50 characters."),
  startDate: z
    .string({ error: "Start date is required." })
    .trim()
    .min(1, "Start date is required.")
    .regex(/^\d{4}-\d{2}-\d{2}/, "Start date must be in YYYY-MM-DD format."),
  endDate: z
    .string({ error: "End date is required." })
    .trim()
    .min(1, "End date is required.")
    .regex(/^\d{4}-\d{2}-\d{2}/, "End date must be in YYYY-MM-DD format."),
  reason: z
    .string()
    .trim()
    .max(500, "Reason cannot exceed 500 characters.")
    .optional()
    .nullable(),
});

export type LeaveRequestInput = z.infer<typeof leaveRequestInputSchema>;

/**
 * Leave calendar query schema (GET /api/v1/leave/calendar)
 */
export const leaveCalendarQuerySchema = z.object({
  year: z.preprocess(
    (val) => {
      if (val === undefined || val === null || val === "") return undefined;
      const num = Number(val);
      return isNaN(num) ? val : num;
    },
    z
      .number({ error: "year must be an integer." })
      .int("year must be an integer.")
      .min(1900, "year must be 1900 or later.")
      .max(2100, "year cannot exceed 2100.")
      .optional()
  ),
  month: z.preprocess(
    (val) => {
      if (val === undefined || val === null || val === "") return undefined;
      const num = Number(val);
      return isNaN(num) ? val : num;
    },
    z
      .number({ error: "month must be an integer." })
      .int("month must be an integer.")
      .min(1, "month must be between 1 and 12.")
      .max(12, "month must be between 1 and 12.")
      .optional()
  ),
});

export type LeaveCalendarQuery = z.infer<typeof leaveCalendarQuerySchema>;

/**
 * Leave approval decision schema (POST /api/v1/approvals/leave/[id]/approve)
 */
export const leaveApprovalSchema = z.object({
  notes: z
    .string()
    .trim()
    .max(1000, "Notes cannot exceed 1000 characters.")
    .optional()
    .nullable(),
});

export type LeaveApprovalInput = z.infer<typeof leaveApprovalSchema>;

/**
 * Leave rejection decision schema (POST /api/v1/approvals/leave/[id]/reject)
 */
export const leaveRejectionSchema = z.object({
  reason: z
    .string({
      error:
        "A valid rejection reason is mandatory. Whitespace-only reasons are not accepted.",
    })
    .trim()
    .min(
      1,
      "A valid rejection reason is mandatory. Whitespace-only reasons are not accepted."
    )
    .max(1000, "Rejection reason cannot exceed 1000 characters."),
});

export type LeaveRejectionInput = z.infer<typeof leaveRejectionSchema>;

/**
 * Manager delegation creation schema (POST /api/v1/approvals/delegations)
 */
export const managerDelegationSchema = z.object({
  managerId: z
    .string()
    .trim()
    .min(1, "Original manager ID cannot be empty.")
    .max(100)
    .optional(),
  actingManagerId: z
    .string({ error: "Acting manager ID is required." })
    .trim()
    .min(1, "Acting manager ID is required.")
    .max(100, "Acting manager ID cannot exceed 100 characters."),
  startDate: z
    .string({ error: "Start date and end date are required." })
    .trim()
    .min(1, "Start date and end date are required.")
    .regex(/^\d{4}-\d{2}-\d{2}/, "Start date must be in YYYY-MM-DD format."),
  endDate: z
    .string({ error: "Start date and end date are required." })
    .trim()
    .min(1, "Start date and end date are required.")
    .regex(/^\d{4}-\d{2}-\d{2}/, "End date must be in YYYY-MM-DD format."),
  reason: z
    .string()
    .trim()
    .max(500, "Reason cannot exceed 500 characters.")
    .optional()
    .nullable(),
});

export type ManagerDelegationInput = z.infer<typeof managerDelegationSchema>;

/**
 * Leave approval queue query schema (GET /api/v1/approvals/leave)
 */
export const leaveApprovalQueueQuerySchema = z.object({
  status: z.string().trim().max(50).default("Pending"),
  department: z.string().trim().max(100).optional(),
  departmentId: z.string().trim().max(100).optional(),
  leaveType: z.string().trim().max(50).optional(),
  leaveTypeCode: z.string().trim().max(50).optional(),
  search: z.string().trim().max(100).optional(),
  startDate: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid start date format").optional(),
  endDate: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid end date format").optional(),
  page: z.preprocess(
    (val) => {
      if (val === undefined || val === null || val === "") return 1;
      const num = Number(val);
      return isNaN(num) ? val : num;
    },
    z.number({ error: "page must be an integer." }).int().min(1, "page must be >= 1").default(1)
  ),
  pageSize: z.preprocess(
    (val) => {
      if (val === undefined || val === null || val === "") return 25;
      const num = Number(val);
      return isNaN(num) ? val : num;
    },
    z.number({ error: "pageSize must be an integer." }).int().min(1).max(100, "pageSize cannot exceed 100").default(25)
  ),
  sortBy: z.enum(["appliedOn", "startDate", "endDate", "days"]).default("appliedOn"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type LeaveApprovalQueueQuery = z.infer<typeof leaveApprovalQueueQuerySchema>;
