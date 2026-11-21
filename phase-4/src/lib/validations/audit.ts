/**
 * Horizon Portal — Audit Query Validation Schemas
 * src/lib/validations/audit.ts
 *
 * Implements strict Zod validation for GET /api/v1/admin/audit
 */

import { z } from "zod";

export const auditLogsQuerySchema = z.object({
  employeeId: z.preprocess(
    (val) => (typeof val === "string" && val.trim() === "" ? undefined : val),
    z.string().trim().max(100).optional()
  ),
  action: z.preprocess(
    (val) => (typeof val === "string" && val.trim() === "" ? undefined : val),
    z.string().trim().max(100).optional()
  ),
  actorId: z.preprocess(
    (val) => (typeof val === "string" && val.trim() === "" ? undefined : val),
    z.string().trim().max(100).optional()
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
      if (val === undefined || val === null || val === "") return 25;
      const num = Number(val);
      return isNaN(num) ? val : num;
    },
    z
      .number({ error: "pageSize must be an integer." })
      .int("pageSize must be an integer.")
      .min(1, "pageSize must be greater than or equal to 1.")
      .max(100, "pageSize cannot exceed 100.")
      .default(25)
  ),
});

export type AuditLogsQuery = z.infer<typeof auditLogsQuerySchema>;
