/**
 * Horizon Portal — Directory & Employee Query Validation Schemas
 * src/lib/validations/directory.ts
 *
 * Implements strict Zod validation for employee directory searching,
 * department filtering, and pagination.
 */

import { z } from "zod";

/**
 * Public employee directory query schema (GET /api/v1/employees)
 */
export const employeeDirectoryQuerySchema = z.object({
  search: z.preprocess(
    (val) => (typeof val === "string" ? val.trim() : ""),
    z.string().max(255, "Search query cannot exceed 255 characters.").default("")
  ),
  department: z.preprocess(
    (val) => (typeof val === "string" ? val.trim() : ""),
    z.string().max(100, "Department identifier cannot exceed 100 characters.").default("")
  ),
  page: z.preprocess(
    (val) => {
      if (val === undefined || val === null || val === "") return 1;
      const num = Number(val);
      return isNaN(num) ? val : num;
    },
    z
      .number({ error: "page must be an integer." })
      .int("page must be an integer.")
      .min(1, "page must be greater than or equal to 1.")
      .default(1)
  ),
  pageSize: z.preprocess(
    (val) => {
      if (val === undefined || val === null || val === "") return 12;
      const num = Number(val);
      return isNaN(num) ? val : num;
    },
    z
      .number({ error: "pageSize must be an integer." })
      .int("pageSize must be an integer.")
      .min(1, "pageSize must be greater than or equal to 1.")
      .max(100, "pageSize cannot exceed 100.")
      .default(12)
  ),
});

export type EmployeeDirectoryQuery = z.infer<typeof employeeDirectoryQuerySchema>;
