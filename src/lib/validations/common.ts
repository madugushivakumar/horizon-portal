/**
 * Horizon Portal — Common Reusable Validation Schemas
 * src/lib/validations/common.ts
 *
 * Implements strict, reusable Zod schemas for pagination, IDs, search, and sorting.
 */

import { z } from "zod";

/**
 * Standard identifier parameter (route params, IDs)
 * Rejects empty, whitespace-only, or excessively long IDs.
 */
export const idParamSchema = z
  .string({ error: "Invalid identifier provided." })
  .trim()
  .min(1, "Identifier cannot be empty.")
  .max(128, "Identifier cannot exceed 128 characters.");

/**
 * Common pagination query schema
 * Safely coerces integer page (min 1, default 1) and pageSize (1..100, default 10 or 20).
 */
export const createPaginationSchema = (defaultPageSize: number = 20, maxPageSize: number = 100) =>
  z.object({
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
        if (val === undefined || val === null || val === "") return defaultPageSize;
        const num = Number(val);
        return isNaN(num) ? val : num;
      },
      z
        .number({ error: "pageSize must be an integer." })
        .int("pageSize must be an integer.")
        .min(1, "pageSize must be greater than or equal to 1.")
        .max(maxPageSize, `pageSize cannot exceed ${maxPageSize}.`)
        .default(defaultPageSize)
    ),
  });

/**
 * Standard date range query schema (YYYY-MM-DD format)
 */
export const dateRangeQuerySchema = z.object({
  startDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "startDate must be in YYYY-MM-DD format.")
    .optional(),
  endDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "endDate must be in YYYY-MM-DD format.")
    .optional(),
});
