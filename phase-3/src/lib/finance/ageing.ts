/**
 * Horizon Portal — Dynamic Invoice Ageing Engine
 * src/lib/finance/ageing.ts
 *
 * Implements UTC date-only comparison and dynamic ageing classification:
 * - Days Overdue = Reporting Date (UTC midnight) - Due Date (UTC midnight)
 * - Boundaries:
 *    <= 0      -> NOT_OVERDUE ("Not overdue")
 *    1 to 30   -> 0_30 ("0–30 days")
 *    31 to 60  -> 31_60 ("31–60 days")
 *    61 to 90  -> 61_90 ("61–90 days")
 *    > 90      -> 90_PLUS ("90+ days")
 */

import { AgeingBucket, AgeingBucketSummary, InvoiceLike } from "./types";

export const AGEING_BUCKET_KEYS: AgeingBucket[] = [
  "NOT_OVERDUE",
  "0_30",
  "31_60",
  "61_90",
  "90_PLUS",
];

export const AGEING_BUCKET_LABELS: Record<AgeingBucket, string> = {
  NOT_OVERDUE: "Not overdue",
  "0_30": "0–30 days",
  "31_60": "31–60 days",
  "61_90": "61–90 days",
  "90_PLUS": "90+ days",
};

/**
 * Extracts UTC midnight timestamp (in milliseconds) from a Date object or ISO date string.
 * Guarantees date-only comparison without timezone skew.
 */
export function parseUtcDateOnly(dateInput: Date | string): number {
  if (!dateInput) {
    throw new TypeError("Date input cannot be null or undefined");
  }
  const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) {
    throw new RangeError(`Invalid date input: ${String(dateInput)}`);
  }
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

/**
 * Calculates whole days overdue relative to the reporting cutoff date.
 * Positive value = overdue by N whole days.
 * 0 or negative value = due today or in the future (not overdue).
 */
export function calculateDaysOverdue(
  dueDate: Date | string,
  reportingDate: Date | string
): number {
  const dueUtc = parseUtcDateOnly(dueDate);
  const repUtc = parseUtcDateOnly(reportingDate);
  const diffMs = repUtc - dueUtc;
  return Math.floor(diffMs / (24 * 60 * 60 * 1000));
}

/**
 * Classifies whole days overdue into canonical AgeingBucket keys.
 */
export function classifyAgeingBucket(daysOverdue: number): AgeingBucket {
  if (daysOverdue <= 0) {
    return "NOT_OVERDUE";
  }
  if (daysOverdue <= 30) {
    return "0_30";
  }
  if (daysOverdue <= 60) {
    return "31_60";
  }
  if (daysOverdue <= 90) {
    return "61_90";
  }
  return "90_PLUS";
}

/**
 * Returns human-readable presentation label for an AgeingBucket.
 */
export function getAgeingBucketLabel(bucket: AgeingBucket): string {
  return AGEING_BUCKET_LABELS[bucket] || bucket;
}

/**
 * Generates an empty baseline breakdown map covering all 5 buckets.
 */
export function createEmptyAgeingBreakdown(): Record<AgeingBucket, AgeingBucketSummary> {
  return {
    NOT_OVERDUE: {
      bucket: "NOT_OVERDUE",
      label: AGEING_BUCKET_LABELS.NOT_OVERDUE,
      count: 0,
      amount: 0,
      amountPaise: 0,
    },
    "0_30": {
      bucket: "0_30",
      label: AGEING_BUCKET_LABELS["0_30"],
      count: 0,
      amount: 0,
      amountPaise: 0,
    },
    "31_60": {
      bucket: "31_60",
      label: AGEING_BUCKET_LABELS["31_60"],
      count: 0,
      amount: 0,
      amountPaise: 0,
    },
    "61_90": {
      bucket: "61_90",
      label: AGEING_BUCKET_LABELS["61_90"],
      count: 0,
      amount: 0,
      amountPaise: 0,
    },
    "90_PLUS": {
      bucket: "90_PLUS",
      label: AGEING_BUCKET_LABELS["90_PLUS"],
      count: 0,
      amount: 0,
      amountPaise: 0,
    },
  };
}
