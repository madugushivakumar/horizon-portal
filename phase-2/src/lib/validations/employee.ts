/**
 * Horizon Portal — Employee Form & API Validation Schemas
 * src/lib/validations/employee.ts
 *
 * Implements Zod validation rules shared across React Hook Form client-side validation
 * and server-side Next.js route handlers.
 */

import { z } from "zod";

export const employeeCreateSchema = z.object({
  id: z
    .string()
    .trim()
    .min(3, "Employee ID must be at least 3 characters.")
    .max(20, "Employee ID cannot exceed 20 characters.")
    .regex(/^[A-Za-z0-9-_]+$/, "Employee ID may only contain letters, numbers, hyphens, and underscores."),
  firstName: z
    .string()
    .trim()
    .min(1, "First name is required.")
    .max(50, "First name cannot exceed 50 characters."),
  lastName: z
    .string()
    .trim()
    .min(1, "Last name is required.")
    .max(50, "Last name cannot exceed 50 characters."),
  email: z
    .string()
    .trim()
    .min(1, "Email is required.")
    .email("Invalid email address format.")
    .toLowerCase(),
  workEmail: z
    .string()
    .trim()
    .email("Invalid work email address format.")
    .toLowerCase()
    .or(z.literal(""))
    .optional()
    .nullable(),
  phone: z
    .string()
    .trim()
    .max(25, "Phone number cannot exceed 25 characters.")
    .or(z.literal(""))
    .optional()
    .nullable(),
  departmentId: z
    .string()
    .trim()
    .or(z.literal(""))
    .optional()
    .nullable(),
  roleId: z
    .string()
    .trim()
    .or(z.literal(""))
    .optional()
    .nullable(),
  managerId: z
    .string()
    .trim()
    .or(z.literal(""))
    .optional()
    .nullable(),
  workLocation: z
    .string()
    .trim()
    .max(60, "Work location cannot exceed 60 characters.")
    .or(z.literal(""))
    .optional()
    .nullable(),
  workMode: z
    .enum(["Remote", "Hybrid", "Onsite", ""])
    .optional()
    .nullable(),
  employmentType: z
    .enum(["Permanent", "Contract", "Intern", "Full-Time", ""])
    .optional()
    .nullable(),
  hireDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Hire date must be in YYYY-MM-DD format.")
    .or(z.literal(""))
    .optional()
    .nullable(),
  status: z
    .enum(["Active", "Inactive", "Deactivated", "On Leave"])
    .default("Active"),
});

export const employeeUpdateSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, "First name is required.")
    .max(50, "First name cannot exceed 50 characters.")
    .optional(),
  lastName: z
    .string()
    .trim()
    .min(1, "Last name is required.")
    .max(50, "Last name cannot exceed 50 characters.")
    .optional(),
  email: z
    .string()
    .trim()
    .email("Invalid email address format.")
    .toLowerCase()
    .optional(),
  workEmail: z
    .string()
    .trim()
    .email("Invalid work email address format.")
    .toLowerCase()
    .or(z.literal(""))
    .optional()
    .nullable(),
  phone: z
    .string()
    .trim()
    .max(25, "Phone number cannot exceed 25 characters.")
    .or(z.literal(""))
    .optional()
    .nullable(),
  departmentId: z
    .string()
    .trim()
    .or(z.literal(""))
    .optional()
    .nullable(),
  roleId: z
    .string()
    .trim()
    .or(z.literal(""))
    .optional()
    .nullable(),
  managerId: z
    .string()
    .trim()
    .or(z.literal(""))
    .optional()
    .nullable(),
  workLocation: z
    .string()
    .trim()
    .max(60, "Work location cannot exceed 60 characters.")
    .or(z.literal(""))
    .optional()
    .nullable(),
  workMode: z
    .enum(["Remote", "Hybrid", "Onsite", ""])
    .optional()
    .nullable(),
  employmentType: z
    .enum(["Permanent", "Contract", "Intern", "Full-Time", ""])
    .optional()
    .nullable(),
  hireDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Hire date must be in YYYY-MM-DD format.")
    .or(z.literal(""))
    .optional()
    .nullable(),
  status: z
    .enum(["Active", "Inactive", "Deactivated", "On Leave"])
    .optional(),
});

export type EmployeeCreateInput = z.infer<typeof employeeCreateSchema>;
export type EmployeeUpdateInput = z.infer<typeof employeeUpdateSchema>;
