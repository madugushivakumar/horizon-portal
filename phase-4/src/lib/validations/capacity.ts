/**
 * Horizon Portal — Capacity Validation Schemas
 * src/lib/validations/capacity.ts
 *
 * Implements strict Zod validation for:
 * - GET /api/v1/capacity (sprintId, optional teamId, pagination)
 * - Enforces page >= 1, 1 <= pageSize <= 100
 */

import { z } from "zod";

export const capacityQuerySchema = z.object({
  sprintId: z
    .string({
      error: "sprintId is required.",
    })
    .trim()
    .min(1, "sprintId cannot be empty."),

  teamId: z.preprocess(
    (val) => (typeof val === "string" && val.trim() === "" ? undefined : val),
    z.string().trim().min(1, "teamId cannot be empty if provided.").optional()
  ),

  page: z.preprocess(
    (val) => {
      if (val === undefined || val === null || val === "") return 1;
      const num = Number(val);
      return isNaN(num) ? val : num;
    },
    z
      .number({
        error: "page must be an integer.",
      })
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
      .number({
        error: "pageSize must be an integer.",
      })
      .int("pageSize must be an integer.")
      .min(1, "pageSize must be greater than or equal to 1.")
      .max(100, "pageSize cannot exceed 100.")
      .default(50)
  ),
});

export type CapacityQueryInput = z.infer<typeof capacityQuerySchema>;
