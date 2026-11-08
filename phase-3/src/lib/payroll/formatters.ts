/**
 * Horizon Portal — Payroll & Currency Formatters
 * src/lib/payroll/formatters.ts
 *
 * Implements strict en-IN monetary formatting using Intl.NumberFormat,
 * preserving exact database values and avoiding floating point inaccuracies.
 */

export const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Formats a monetary number into Indian Rupee standard format (e.g. ₹1,34,247.96).
 * Preserves explicit decimal precision and supports alternate currencies if specified.
 */
export function formatMoney(amount: number | null | undefined, currency: string = "INR"): string {
  if (amount === null || amount === undefined || Number.isNaN(amount)) {
    return currency === "INR" ? inrFormatter.format(0) : `${currency} 0.00`;
  }

  if (currency === "INR") {
    return inrFormatter.format(amount);
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Formats ISO date or Date object into human-readable date (e.g., "01 May 2026").
 */
export function formatDisplayDate(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return "—";
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

/**
 * Formats a pay period string or date range into month/year label (e.g. "April 2026").
 */
export function formatPayPeriodLabel(periodStart: string | Date, runId?: string | null): string {
  const date = typeof periodStart === "string" ? new Date(periodStart) : periodStart;
  if (!Number.isNaN(date.getTime())) {
    return new Intl.DateTimeFormat("en-IN", {
      month: "long",
      year: "numeric",
    }).format(date);
  }
  return runId || "Pay Period";
}

/**
 * Converts a positive number to Indian Rupees in words (Indian numbering system: Lakhs, Crores).
 * Standard on Indian payroll slips.
 */
export function amountInWords(amount: number): string {
  if (amount === 0) return "Zero Rupees Only";
  if (amount < 0) return "Negative " + amountInWords(Math.abs(amount));

  const units = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen",
  ];

  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  function convertSection(num: number): string {
    let str = "";
    if (num > 99) {
      str += units[Math.floor(num / 100)] + " Hundred ";
      num %= 100;
    }
    if (num > 19) {
      const ten = tens[Math.floor(num / 10)];
      num %= 10;
      if (num > 0) {
        str += `${ten}-${units[num]} `;
        num = 0;
      } else {
        str += `${ten} `;
      }
    }
    if (num > 0) {
      str += units[num] + " ";
    }
    return str.trim();
  }

  // Exact whole & paise calculation
  const whole = Math.floor(amount);
  const paise = Math.round((amount - whole) * 100);

  let words = "";

  const crore = Math.floor(whole / 10000000);
  let rem = whole % 10000000;

  const lakh = Math.floor(rem / 100000);
  rem = rem % 100000;

  const thousand = Math.floor(rem / 1000);
  rem = rem % 1000;

  const hundred = rem;

  if (crore > 0) {
    words += convertSection(crore) + " Crore ";
  }
  if (lakh > 0) {
    words += convertSection(lakh) + " Lakh ";
  }
  if (thousand > 0) {
    words += convertSection(thousand) + " Thousand ";
  }
  if (hundred > 0) {
    words += convertSection(hundred) + " ";
  }

  words = words.trim() + " Rupees";

  if (paise > 0) {
    words += " and " + convertSection(paise) + " Paise";
  }

  return words.trim() + " Only";
}
