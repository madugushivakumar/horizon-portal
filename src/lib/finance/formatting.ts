/**
 * Horizon Portal — Finance Formatting Utilities
 * src/lib/finance/formatting.ts
 *
 * Provides standardized Indian Rupee (INR) currency formatting, date parsing,
 * and presentation helpers for tables, KPI summary cards, and exports.
 */

/**
 * Formats a number in Indian Rupee format (INR) using en-IN locale grouping.
 * Examples:
 *   1558743836     -> "₹1,55,87,43,836"
 *   197476837.90   -> "₹19,74,76,837.90"
 */
export function formatINR(
  amount: number,
  options?: { showPaise?: boolean; compact?: boolean }
): string {
  if (typeof amount !== "number" || !Number.isFinite(amount)) {
    return "₹0";
  }

  if (options?.compact) {
    const abs = Math.abs(amount);
    if (abs >= 10_000_000) {
      // Crores
      return `₹${(amount / 10_000_000).toFixed(2)} Cr`;
    }
    if (abs >= 100_000) {
      // Lakhs
      return `₹${(amount / 100_000).toFixed(2)} L`;
    }
    if (abs >= 1_000) {
      return `₹${(amount / 1_000).toFixed(1)} K`;
    }
  }

  const hasDecimals = amount % 1 !== 0;
  const minimumFractionDigits = options?.showPaise ? 2 : (hasDecimals ? 2 : 0);
  const maximumFractionDigits = options?.showPaise ? 2 : (hasDecimals ? 2 : 0);

  return `₹${amount.toLocaleString("en-IN", {
    minimumFractionDigits,
    maximumFractionDigits,
  })}`;
}

/**
 * Formats a date into ISO standard YYYY-MM-DD date string.
 */
export function formatDateString(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "—";
  return d.toISOString().split("T")[0];
}

/**
 * Normalizes an invoice status into clean title-cased presentation string.
 */
export function formatStatusLabel(status: string): string {
  if (!status) return "";
  switch (status.toUpperCase().trim()) {
    case "PAID":
      return "Paid";
    case "SENT":
      return "Sent";
    case "PARTIALLY_PAID":
      return "Partially Paid";
    case "OVERDUE":
      return "Overdue";
    case "DRAFT":
      return "Draft";
    case "CANCELLED":
      return "Cancelled";
    case "UNPAID":
      return "Unpaid";
    default:
      return status;
  }
}

/**
 * Canonical mapping of Chart of Accounts expense category accounts to human-readable titles.
 */
export const EXPENSE_CATEGORY_MAP: Record<number, string> = {
  5101: "Office Rent",
  5102: "Utilities",
  5103: "Internet & Telecom",
  5104: "Cloud Infrastructure",
  5105: "Software Subscriptions",
  5106: "Travel & Conveyance",
  5107: "Marketing & Advertising",
  5108: "Professional Fees",
  5109: "Recruitment Costs",
  5110: "Training & Development",
  5111: "Insurance",
  5112: "Office Supplies",
};

/**
 * Returns formatted category account label (e.g. "5101 · Office Rent").
 */
export function formatExpenseCategory(categoryAccount: number | string | null | undefined): string {
  if (categoryAccount === null || categoryAccount === undefined) return "—";
  const num = typeof categoryAccount === "string" ? Number(categoryAccount) : categoryAccount;
  if (isNaN(num)) return String(categoryAccount);
  return EXPENSE_CATEGORY_MAP[num] ? `${num} · ${EXPENSE_CATEGORY_MAP[num]}` : String(num);
}
