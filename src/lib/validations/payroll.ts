/**
 * Horizon Portal — Payroll Query & Run Validation Schemas
 * src/lib/validations/payroll.ts
 *
 * Implements strict Zod validation for:
 * - GET /api/v1/payroll/runs (listing, filtering, pagination)
 * - POST /api/v1/payroll/runs/[runId]/approve (approval notes)
 */

import { z } from "zod";

/**
 * Payroll runs listing query schema (GET /api/v1/payroll/runs)
 */
export const payrollRunsQuerySchema = z.object({
  search: z.preprocess(
    (val) => (typeof val === "string" ? val.trim() : ""),
    z.string().max(255, "Search query cannot exceed 255 characters.").default("")
  ),
  status: z.preprocess(
    (val) => (typeof val === "string" ? val.trim().toLowerCase() : "all"),
    z.string().max(50, "Status filter cannot exceed 50 characters.").default("all")
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
      if (val === undefined || val === null || val === "") return 20;
      const num = Number(val);
      return isNaN(num) ? val : num;
    },
    z
      .number({ error: "pageSize must be an integer." })
      .int("pageSize must be an integer.")
      .min(1, "pageSize must be greater than or equal to 1.")
      .max(100, "pageSize cannot exceed 100.")
      .default(20)
  ),
});

export type PayrollRunsQuery = z.infer<typeof payrollRunsQuerySchema>;
