/**
 * Horizon Portal — Authentication Validation Schemas
 * src/lib/validations/auth.ts
 *
 * Implements strict Zod validation for authentication endpoints (login, credentials).
 */

import { z } from "zod";

/**
 * Login request payload schema
 * Validates email format, non-empty password, and maximum input lengths.
 */
export const loginInputSchema = z.object({
  email: z
    .string({ error: "Email and password are required." })
    .trim()
    .min(1, "Email and password are required.")
    .email("Invalid email address format.")
    .max(255, "Invalid email or password length.")
    .toLowerCase(),
  password: z
    .string({ error: "Email and password are required." })
    .min(1, "Email and password are required.")
    .max(255, "Invalid email or password length."),
});

export type LoginInput = z.infer<typeof loginInputSchema>;
