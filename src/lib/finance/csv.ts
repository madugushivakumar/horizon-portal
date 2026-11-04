/**
 * Horizon Portal — Finance CSV Serialization & Security Utility
 * src/lib/finance/csv.ts
 *
 * Implements RFC 4180 compliant CSV serialization:
 * - UTF-8 Byte Order Mark (BOM: \uFEFF) for Excel / Google Sheets compatibility
 * - CRLF (\r\n) line terminators
 * - Quoting & escaping for commas, embedded quotation marks (""), and newlines
 * - Defensive formula injection protection against '=', '+', '-', '@', '\t', '\r'
 * - Preserves legitimate negative numbers (-1250.50) without corrupting them as formulas
 * - Preserves full decimal precision for financial amounts
 */

export const FORMULA_TRIGGERS = ["=", "+", "-", "@", "\t", "\r"];

/**
 * Sanitizes an individual CSV cell value.
 * - Null / undefined become empty string ("").
 * - Numbers are preserved as numeric strings without single-quote prefixing (protecting negative numbers).
 * - Text fields starting with formula triggers are prefixed with a single quote (').
 * - Fields containing quotes, commas, or newlines are wrapped in double quotes with quotes doubled.
 */
export function sanitizeCsvCell(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  // 1. Numeric financial values: preserve legitimate negative and decimal numbers without rounding
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      return "";
    }
    // Retain full numeric precision without arbitrary truncation
    return String(value);
  }

  // 2. Boolean values
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  // 3. Date objects
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? "" : value.toISOString().split("T")[0];
  }

  let str = String(value);

  // 4. Formula injection mitigation for text fields
  if (FORMULA_TRIGGERS.some((char) => str.startsWith(char))) {
    str = `'${str}`;
  }

  // 5. RFC 4180 escaping: wrap in quotes and escape internal double quotes if needed
  if (
    str.includes(",") ||
    str.includes('"') ||
    str.includes("\n") ||
    str.includes("\r")
  ) {
    str = `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

/**
 * Serializes headers and table rows into a standardized, BOM-prefixed, CRLF-delimited CSV string.
 */
export function serializeToCsv(
  headers: string[],
  rows: unknown[][]
): string {
  const headerLine = headers.map(sanitizeCsvCell).join(",");
  const dataLines = rows.map((row) => row.map(sanitizeCsvCell).join(","));
  const allLines = [headerLine, ...dataLines];

  // Prepend UTF-8 BOM (\uFEFF) and join lines with CRLF (\r\n)
  return "\uFEFF" + allLines.join("\r\n");
}
