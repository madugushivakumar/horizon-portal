/**
 * Horizon Portal — Admin Finance Validation Schemas
 * src/lib/validations/finance.ts
 *
 * Implements strict Zod schemas for:
 * - GET /api/v1/admin/finance/invoices
 * - GET /api/v1/admin/finance/expenses
 * - GET /api/v1/admin/finance/summary
 * - GET /api/v1/admin/finance/export/invoices
 * - GET /api/v1/admin/finance/export/expenses
 */

import { z } from "zod";

export const financeInvoiceStatuses = [
  "PAID",
  "SENT",
  "PARTIALLY_PAID",
  "OVERDUE",
  "DRAFT",
  "CANCELLED",
] as const;

export const financeExpenseStatuses = ["PAID", "UNPAID"] as const;

export const financeAgeingBuckets = [
  "NOT_OVERDUE",
  "0_30",
  "31_60",
  "61_90",
  "90_PLUS",
] as const;

/**
 * Invoices list query schema
 */
export const invoicesQuerySchema = z.object({
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
      if (val === undefined || val === null || val === "") return 20;
      const num = Number(val);
      return isNaN(num) ? val : num;
    },
    z.number({ error: "pageSize must be an integer." }).int().min(1).max(100, "pageSize cannot exceed 100").default(20)
  ),
  search: z.string().trim().max(100).optional(),
  status: z.enum(financeInvoiceStatuses, { error: "Invalid status filter provided." }).optional(),
  ageing: z.enum(financeAgeingBuckets, { error: "Invalid ageing bucket provided." }).optional(),
  open: z.enum(["true", "false", "all"], { error: "Invalid open parameter provided." }).optional(),
  from: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, "from must be in YYYY-MM-DD format.").optional(),
  to: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, "to must be in YYYY-MM-DD format.").optional(),
});

/**
 * Expenses list query schema
 */
export const expensesQuerySchema = z.object({
  page: z.preprocess(
    (val) => {
      if (val === undefined || val === null || val === "") return 20;
      const num = Number(val);
      return isNaN(num) ? val : num;
    },
    z.number({ error: "page must be an integer." }).int().min(1, "page must be >= 1").default(1)
  ),
  pageSize: z.preprocess(
    (val) => {
      if (val === undefined || val === null || val === "") return 20;
      const num = Number(val);
      return isNaN(num) ? val : num;
    },
    z.number({ error: "pageSize must be an integer." }).int().min(1).max(100, "pageSize cannot exceed 100").default(20)
  ),
  search: z.string().trim().max(100).optional(),
  status: z.enum(financeExpenseStatuses, { error: "Invalid status filter provided." }).optional(),
  category: z.string().trim().max(100).optional(),
  from: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, "from must be in YYYY-MM-DD format.").optional(),
  to: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, "to must be in YYYY-MM-DD format.").optional(),
});

/**
 * Finance summary query schema
 */
export const financeSummaryQuerySchema = z.object({
  from: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, "from must be in YYYY-MM-DD format.").optional(),
  to: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, "to must be in YYYY-MM-DD format.").optional(),
});

/**
 * Finance invoices export query schema
 */
export const financeInvoicesExportQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),
  status: z.enum(financeInvoiceStatuses).optional(),
  ageing: z.enum(financeAgeingBuckets).optional(),
  open: z.enum(["true", "false", "all"]).optional(),
  from: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

/**
 * Finance expenses export query schema
 */
export const financeExpensesExportQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),
  status: z.enum(financeExpenseStatuses).optional(),
  category: z.string().trim().max(100).optional(),
  from: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});
