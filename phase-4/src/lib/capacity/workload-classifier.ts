/**
 * Horizon Portal — Workload Classifier & Utilization Service
 * src/lib/capacity/workload-classifier.ts
 *
 * Classifies employee workload based on utilization against net capacity:
 * - Below 80%: Available
 * - 80% to below 100%: Near Capacity
 * - 100%: At Capacity
 * - Above 100%: Overloaded
 *
 * Handles zero-capacity scenarios gracefully without division-by-zero errors:
 * - Zero capacity + zero workload = 0% utilization ("Available").
 * - Zero capacity + positive workload = infinite utilization ("Overloaded").
 */

import {
  WorkloadClassification,
  WorkloadClassificationResult,
} from "./capacity-types";

/**
 * Calculates utilization percentage rounded to 1 decimal place.
 * Returns 0 if both net capacity and planned open points are 0.
 * Returns Infinity if net capacity is 0 and planned open points > 0.
 */
export function calculateUtilizationPercentage(
  plannedOpenPoints: number,
  netCapacity: number
): number {
  if (netCapacity <= 0) {
    if (plannedOpenPoints <= 0) {
      return 0;
    }
    return Number.POSITIVE_INFINITY;
  }

  const raw = (plannedOpenPoints / netCapacity) * 100;
  return Math.round(raw * 10) / 10;
}

/**
 * Classifies employee workload and produces actionable excess-point metrics
 * and professional warning messages.
 */
export function classifyWorkload(
  plannedOpenPoints: number,
  netCapacity: number
): WorkloadClassificationResult {
  const excessPoints = Math.max(0, plannedOpenPoints - netCapacity);
  const utilization = calculateUtilizationPercentage(plannedOpenPoints, netCapacity);

  // Case 1: Zero net capacity (e.g. employee on full-sprint leave)
  if (netCapacity <= 0) {
    if (plannedOpenPoints <= 0) {
      return {
        classification: "Available",
        isOverloaded: false,
        excessPoints: 0,
        utilizationPercentage: 0,
        warningMessage: null,
      };
    }

    return {
      classification: "Overloaded",
      isOverloaded: true,
      excessPoints: plannedOpenPoints,
      utilizationPercentage: 100, // Safe display representation for UI progress bars
      warningMessage: `Employee has 0 net working capacity due to approved leave, but is assigned ${plannedOpenPoints} open story points.`,
    };
  }

  // Case 2: Positive net capacity
  if (utilization < 80) {
    return {
      classification: "Available",
      isOverloaded: false,
      excessPoints: 0,
      utilizationPercentage: utilization,
      warningMessage: null,
    };
  }

  if (utilization >= 80 && utilization < 100) {
    return {
      classification: "Near Capacity",
      isOverloaded: false,
      excessPoints: 0,
      utilizationPercentage: utilization,
      warningMessage: `Workload is near sprint capacity (${utilization}% utilization, ${netCapacity - plannedOpenPoints} points remaining).`,
    };
  }

  if (utilization === 100) {
    return {
      classification: "At Capacity",
      isOverloaded: false,
      excessPoints: 0,
      utilizationPercentage: 100,
      warningMessage: "Workload is at exactly 100% of estimated sprint capacity.",
    };
  }

  // Overloaded (> 100%)
  return {
    classification: "Overloaded",
    isOverloaded: true,
    excessPoints,
    utilizationPercentage: utilization,
    warningMessage: `Capacity exceeded — workload is ${excessPoints} story points above estimated sprint capacity (${utilization}% utilization).`,
  };
}

/**
 * Returns UI style tokens and badge configurations for a given workload classification.
 */
export function getWorkloadStatusStyle(classification: WorkloadClassification): {
  variant: "success" | "warning" | "danger" | "neutral";
  label: string;
  badgeClass: string;
  progressBarClass: string;
} {
  switch (classification) {
    case "Available":
      return {
        variant: "success",
        label: "Available",
        badgeClass:
          "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
        progressBarClass: "bg-emerald-500 dark:bg-emerald-400",
      };
    case "Near Capacity":
      return {
        variant: "warning",
        label: "Near Capacity",
        badgeClass:
          "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
        progressBarClass: "bg-amber-500 dark:bg-amber-400",
      };
    case "At Capacity":
      return {
        variant: "warning",
        label: "At Capacity",
        badgeClass:
          "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/50 dark:text-amber-200 dark:border-amber-700",
        progressBarClass: "bg-amber-600 dark:bg-amber-500",
      };
    case "Overloaded":
      return {
        variant: "danger",
        label: "Overloaded",
        badgeClass:
          "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800",
        progressBarClass: "bg-rose-600 dark:bg-rose-500",
      };
  }
}
