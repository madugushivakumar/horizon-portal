/**
 * Corporate Expense Authorization Validation Schemas
 * src/lib/validations/expense-authorization.ts
 */

import { z } from "zod";

export const corporateExpenseCategoryCodes = [
  5101, // Rent & Facilities
  5102, // Electricity & Utilities
  5103, // Internet & Telecom
  5104, // Cloud Infrastructure
  5105, // Software Subscriptions
  5106, // Travel & Conveyance
  5107, // Marketing & Advertising
  5108, // Professional Fees & Legal
  5109, // Recruitment & Talent Acquisition
  5110, // Training & Development
] as const;

export const expenseAuthStatusEnum = z.enum([
  "DRAFT",
  "PENDING_APPROVAL",
  "APPROVED",
  "REJECTED",
  "CLOSED",
]);

export const createExpenseAuthorizationSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Title must be at least 3 characters.")
    .max(120, "Title cannot exceed 120 characters."),
  description: z
    .string()
    .trim()
    .min(5, "Description must be at least 5 characters.")
    .max(1000, "Description cannot exceed 1000 characters."),
  category: z.coerce
    .number()
    .int()
    .refine((val) => (corporateExpenseCategoryCodes as readonly number[]).includes(val), {
      message: "Category must be a valid Chart of Accounts code (5101-5110).",
    }),
  requestedAmount: z.coerce
    .number()
    .positive("Requested amount must be greater than zero.")
    .max(10000000, "Requested amount cannot exceed 10,000,000."),
  currency: z
    .string()
    .default("USD")
    .refine((val) => /^[A-Z]{3}$/.test(val), {
      message: "Currency must be a 3-letter ISO code.",
    }),
  departmentId: z
    .string()
    .trim()
    .min(1, "Department ID cannot be empty."),
  requiredByDate: z
    .string()
    .optional()
    .nullable()
    .refine(
      (val) => !val || !isNaN(Date.parse(val)),
      "Required by date must be a valid date string."
    ),
  vendorName: z
    .string()
    .trim()
    .max(150, "Vendor name cannot exceed 150 characters.")
    .optional()
    .nullable(),
});

export const expenseAuthorizationDecisionSchema = z
  .object({
    action: z.enum(["APPROVE", "REJECT"]),
    rejectionReason: z
      .string()
      .trim()
      .optional()
      .nullable(),
    approvalNotes: z
      .string()
      .trim()
      .max(500, "Approval notes cannot exceed 500 characters.")
      .optional()
      .nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.action === "REJECT") {
      if (!data.rejectionReason || data.rejectionReason.trim().length < 3) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["rejectionReason"],
          message: "A mandatory rejection reason of at least 3 characters is required when rejecting a request.",
        });
      }
    }
  });

export const unifiedApprovalsQuerySchema = z.object({
  domain: z
    .enum(["all", "leave", "corporate-expense"])
    .default("all"),
  status: z
    .enum(["all", "pending", "approved", "rejected"])
    .default("pending"),
  search: z
    .string()
    .trim()
    .optional(),
  departmentId: z
    .string()
    .trim()
    .optional(),
  page: z.coerce
    .number()
    .int()
    .positive()
    .default(1),
  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .default(20),
  sortBy: z
    .enum(["date", "amount", "requester", "department", "status"])
    .default("date"),
  sortOrder: z
    .enum(["asc", "desc"])
    .default("desc"),
});

export type CreateExpenseAuthorizationInput = z.infer<typeof createExpenseAuthorizationSchema>;
export type ExpenseAuthorizationDecisionInput = z.infer<typeof expenseAuthorizationDecisionSchema>;
export type UnifiedApprovalsQueryInput = z.infer<typeof unifiedApprovalsQuerySchema>;
