/**
 * Horizon Portal — Safe Employee Data Contract
 * src/types/employee.ts
 *
 * Strict TypeScript types and contracts for Directory and Profile data.
 * CRITICAL PRIVACY RULE:
 * This contract strictly excludes salary, compensation, bank accounts,
 * passwords, password hashes, and private authentication tokens.
 */

export interface SafeDepartment {
  id: string;
  name: string;
  code?: string | null;
  description?: string | null;
}

export interface SafeRole {
  id: string;
  name: string;
  description?: string | null;
}

export interface SafeManager {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  role?: SafeRole | null;
}

export interface SafeDirectReport {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  role?: SafeRole | null;
  department?: SafeDepartment | null;
}

export interface SafeEmployeeSummary {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phone?: string | null;
  hireDate?: string | null;
  status: string;
  department: SafeDepartment | null;
  role: SafeRole | null;
  managerId?: string | null;
  manager: SafeManager | null;
}

export interface SafeEmployeeProfile extends SafeEmployeeSummary {
  directReports: SafeDirectReport[];
}

export interface PaginationMetadata {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface DirectoryApiResponse {
  data: SafeEmployeeSummary[];
  pagination: PaginationMetadata;
}

export interface ProfileApiResponse {
  data: SafeEmployeeProfile;
}

/**
 * List of sensitive fields strictly forbidden in directory and profile responses.
 * Used for runtime auditing and automated privacy leakage testing.
 */
export const PROHIBITED_PRIVATE_FIELDS = [
  "salary",
  "compensation",
  "bank",
  "bankAccount",
  "bank_account",
  "password",
  "passwordHash",
  "password_hash",
  "secret",
  "token",
  "authToken",
  "auth_token",
] as const;
