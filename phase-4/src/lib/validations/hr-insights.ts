/**
 * Horizon Portal — AI Insights Validation Schemas
 * src/lib/validations/hr-insights.ts
 *
 * Implements strict Zod validation for:
 * - GET /api/v1/hr-insights (optional departmentId)
 */

import { z } from "zod";

export const hrInsightsQuerySchema = z.object({
  departmentId: z.preprocess(
    (val) => (typeof val === "string" && val.trim() === "" ? undefined : val),
    z.string().trim().min(1, "departmentId cannot be empty if provided.").optional()
  ),
});

export type HRInsightsQueryParams = z.infer<typeof hrInsightsQuerySchema>;
