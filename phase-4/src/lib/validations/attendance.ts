/**
 * Horizon Portal — Attendance Validation Schemas
 * src/lib/validations/attendance.ts
 *
 * Implements strict Zod validation for:
 * - GET /api/v1/attendance/summary (personal attendance summary query)
 * - GET /api/v1/team/attendance (team oversight query)
 */

import { z } from "zod";

/**
 * Team attendance query schema (GET /api/v1/team/attendance)
 */
export const teamAttendanceQuerySchema = z.object({
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
  department: z.preprocess(
    (val) => (typeof val === "string" && val.trim() === "" ? undefined : val),
    z.string().trim().max(100, "Department filter too long.").optional()
  ),
});

export type TeamAttendanceQuery = z.infer<typeof teamAttendanceQuerySchema>;
