/**
 * Horizon Portal — Finance API Query Validation
 * src/lib/finance/validation.ts
 *
 * Implements strict, defensive validation for query parameters:
 * - Pagination parameters (page, pageSize) with bounds checking
 * - ISO calendar dates (YYYY-MM-DD) with chronological range validation
 * - Strict enum validation against actual Prisma schema status values
 * - Ageing bucket parameter validation
 * - String length limits to prevent DoS via unbounded payloads
 */

import { AgeingBucket } from "./types";
import { AGEING_BUCKET_KEYS } from "./ageing";

export const VALID_INVOICE_STATUSES = [
  "PAID",
  "SENT",
  "PARTIALLY_PAID",
  "OVERDUE",
  "DRAFT",
  "CANCELLED",
] as const;

export type ValidInvoiceStatus = (typeof VALID_INVOICE_STATUSES)[number];

export const VALID_EXPENSE_STATUSES = ["PAID", "UNPAID"] as const;

export type ValidExpenseStatus = (typeof VALID_EXPENSE_STATUSES)[number];

export interface ValidationSuccess<T> {
  valid: true;
  data: T;
}

export interface ValidationFailure {
  valid: false;
  error: string;
}

export type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

/**
 * Validates integer pagination parameters.
 * - page defaults to 1, must be >= 1.
 * - pageSize defaults to 20, must be between 1 and maxPageSize (default 100).
 */
export function validatePaginationParams(
  pageParam: string | null,
  pageSizeParam: string | null,
  maxPageSize = 100
): ValidationResult<{ page: number; pageSize: number }> {
  let page = 1;
  let pageSize = 20;

  if (pageParam !== null && pageParam !== undefined && pageParam.trim() !== "") {
    const parsedPage = Number(pageParam);
    if (!Number.isInteger(parsedPage) || parsedPage < 1) {
      return {
        valid: false,
        error: `Invalid 'page' parameter: expected positive integer, received '${pageParam}'.`,
      };
    }
    page = parsedPage;
  }

  if (pageSizeParam !== null && pageSizeParam !== undefined && pageSizeParam.trim() !== "") {
    const parsedPageSize = Number(pageSizeParam);
    if (!Number.isInteger(parsedPageSize) || parsedPageSize < 1 || parsedPageSize > maxPageSize) {
      return {
        valid: false,
        error: `Invalid 'pageSize' parameter: expected integer between 1 and ${maxPageSize}, received '${pageSizeParam}'.`,
      };
    }
    pageSize = parsedPageSize;
  }

  return { valid: true, data: { page, pageSize } };
}

/**
 * Validates ISO calendar date format YYYY-MM-DD.
 */
export function validateDateParam(
  paramName: string,
  dateStr: string | null | undefined
): ValidationResult<string | null> {
  if (!dateStr || dateStr.trim() === "") {
    return { valid: true, data: null };
  }

  const trimmed = dateStr.trim();
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(trimmed)) {
    return {
      valid: false,
      error: `Invalid '${paramName}' date format: expected 'YYYY-MM-DD', received '${dateStr}'.`,
    };
  }

  const d = new Date(`${trimmed}T00:00:00.000Z`);
  if (isNaN(d.getTime())) {
    return {
      valid: false,
      error: `Invalid '${paramName}' date: '${dateStr}' is not a valid calendar date.`,
    };
  }

  return { valid: true, data: trimmed };
}

/**
 * Validates chronological date range: from <= to.
 */
export function validateDateRange(
  fromStr: string | null,
  toStr: string | null
): ValidationResult<void> {
  if (fromStr && toStr) {
    if (fromStr > toStr) {
      return {
        valid: false,
        error: `Invalid date range: 'from' (${fromStr}) cannot be later than 'to' (${toStr}).`,
      };
    }
  }
  return { valid: true, data: undefined };
}

/**
 * Validates invoice status parameter against actual Prisma values.
 */
export function validateInvoiceStatusParam(
  statusParam: string | null | undefined
): ValidationResult<ValidInvoiceStatus | null> {
  if (!statusParam || statusParam.trim() === "" || statusParam.trim().toUpperCase() === "ALL") {
    return { valid: true, data: null };
  }

  const upper = statusParam.trim().toUpperCase();
  if (!VALID_INVOICE_STATUSES.includes(upper as ValidInvoiceStatus)) {
    return {
      valid: false,
      error: `Invalid invoice status: '${statusParam}'. Allowed values: ${VALID_INVOICE_STATUSES.join(", ")}.`,
    };
  }

  return { valid: true, data: upper as ValidInvoiceStatus };
}

/**
 * Validates dynamic ageing bucket parameter.
 */
export function validateAgeingParam(
  ageingParam: string | null | undefined
): ValidationResult<AgeingBucket | null> {
  if (!ageingParam || ageingParam.trim() === "" || ageingParam.trim().toUpperCase() === "ALL") {
    return { valid: true, data: null };
  }

  const upper = ageingParam.trim().toUpperCase();
  if (!AGEING_BUCKET_KEYS.includes(upper as AgeingBucket)) {
    return {
      valid: false,
      error: `Invalid ageing bucket: '${ageingParam}'. Allowed values: ${AGEING_BUCKET_KEYS.join(", ")}.`,
    };
  }

  return { valid: true, data: upper as AgeingBucket };
}

/**
 * Validates 'open' boolean filter parameter (strictly "true" or "false").
 */
export function validateOpenParam(
  openParam: string | null | undefined
): ValidationResult<boolean | null> {
  if (!openParam || openParam.trim() === "") {
    return { valid: true, data: null };
  }

  const lower = openParam.trim().toLowerCase();
  if (lower === "true") {
    return { valid: true, data: true };
  }
  if (lower === "false") {
    return { valid: true, data: false };
  }

  return {
    valid: false,
    error: `Invalid 'open' parameter: expected 'true' or 'false', received '${openParam}'.`,
  };
}

/**
 * Validates expense status parameter against actual Prisma schema.
 */
export function validateExpenseStatusParam(
  statusParam: string | null | undefined
): ValidationResult<ValidExpenseStatus | null> {
  if (!statusParam || statusParam.trim() === "" || statusParam.trim().toUpperCase() === "ALL") {
    return { valid: true, data: null };
  }

  const upper = statusParam.trim().toUpperCase();
  if (!VALID_EXPENSE_STATUSES.includes(upper as ValidExpenseStatus)) {
    return {
      valid: false,
      error: `Invalid expense status: '${statusParam}'. Allowed values: ${VALID_EXPENSE_STATUSES.join(", ")}.`,
    };
  }

  return { valid: true, data: upper as ValidExpenseStatus };
}

/**
 * Validates categoryAccount filter parameter (integer).
 */
export function validateCategoryParam(
  categoryParam: string | null | undefined
): ValidationResult<number | null> {
  if (!categoryParam || categoryParam.trim() === "" || categoryParam.trim().toUpperCase() === "ALL") {
    return { valid: true, data: null };
  }

  const parsed = Number(categoryParam.trim());
  if (!Number.isInteger(parsed) || parsed < 0) {
    return {
      valid: false,
      error: `Invalid 'category' parameter: expected positive integer, received '${categoryParam}'.`,
    };
  }

  return { valid: true, data: parsed };
}

/**
 * Validates search keyword length to guard against unbounded payloads.
 */
export function validateSearchQuery(
  searchParam: string | null | undefined,
  maxLength = 100
): ValidationResult<string> {
  if (!searchParam || searchParam.trim() === "") {
    return { valid: true, data: "" };
  }

  const trimmed = searchParam.trim();
  if (trimmed.length > maxLength) {
    return {
      valid: false,
      error: `Search query exceeds maximum length of ${maxLength} characters.`,
    };
  }

  return { valid: true, data: trimmed };
}
