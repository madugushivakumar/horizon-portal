"use client";

/**
 * Horizon Portal — Capacity Progress Bar
 * src/components/capacity/CapacityProgressBar.tsx
 *
 * Visual progress bar component with support for:
 * - Workload utilization (Available, Near Capacity, At Capacity, Overloaded)
 * - Zero-capacity division-by-zero handling ("∞" representation)
 * - Sprint completion progress
 * - Accessible ARIA attributes and dark mode support
 */

import React from "react";
import { WorkloadClassification } from "@/lib/capacity/capacity-types";
import { cn } from "@/lib/utils";

export interface CapacityProgressBarProps {
  /** Numerical percentage value (null when net capacity is 0 and points > 0) */
  value: number | null;
  /** Formatted string representation (e.g. "20.0%", "112.5%", "∞") */
  displayValue?: string;
  /** Optional workload classification for automatic threshold color mapping */
  classification?: WorkloadClassification;
  /** Custom bar color override (e.g. "bg-blue-600" for sprint completion) */
  barColor?: string;
  /** Visual height size */
  size?: "sm" | "md" | "lg";
  /** Whether to render the textual percentage value next to the bar */
  showLabel?: boolean;
  /** Accessible label describing what the bar measures */
  ariaLabel?: string;
  className?: string;
}

export const CapacityProgressBar: React.FC<CapacityProgressBarProps> = ({
  value,
  displayValue,
  classification,
  barColor,
  size = "md",
  showLabel = false,
  ariaLabel = "Workload utilization",
  className,
}) => {
  const isInfinite = value === null || displayValue === "∞";
  const isOverloaded = classification === "Overloaded" || isInfinite || (value !== null && value > 100);

  // Determine bar fill percentage (clamped between 0 and 100 for visual width)
  const clampedPercentage = isInfinite ? 100 : Math.min(Math.max(value ?? 0, 0), 100);

  // Determine color if not explicitly overridden
  let activeBarColor = barColor;
  if (!activeBarColor) {
    if (classification) {
      switch (classification) {
        case "Available":
          activeBarColor = "bg-emerald-500 dark:bg-emerald-400";
          break;
        case "Near Capacity":
          activeBarColor = "bg-amber-500 dark:bg-amber-400";
          break;
        case "At Capacity":
          activeBarColor = "bg-amber-600 dark:bg-amber-500";
          break;
        case "Overloaded":
          activeBarColor = "bg-rose-500 dark:bg-rose-400";
          break;
      }
    } else if (isOverloaded) {
      activeBarColor = "bg-rose-500 dark:bg-rose-400";
    } else if (value !== null && value >= 80) {
      activeBarColor = "bg-amber-500 dark:bg-amber-400";
    } else {
      activeBarColor = "bg-blue-600 dark:bg-blue-400";
    }
  }

  const heightClasses = {
    sm: "h-1.5",
    md: "h-2.5",
    lg: "h-3.5",
  };

  const formattedDisplay =
    displayValue ?? (value !== null ? `${value.toFixed(1)}%` : "N/A");

  return (
    <div className={cn("w-full flex items-center gap-2.5", className)}>
      <div
        className={cn(
          "w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden relative",
          heightClasses[size]
        )}
        role="progressbar"
        aria-label={ariaLabel}
        aria-valuenow={isInfinite ? 100 : (value ?? 0)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuetext={formattedDisplay}
      >
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300 ease-out",
            activeBarColor,
            isInfinite && "animate-pulse"
          )}
          style={{ width: `${clampedPercentage}%` }}
        />
      </div>

      {showLabel && (
        <span
          className={cn(
            "text-xs font-semibold tabular-nums shrink-0",
            isOverloaded
              ? "text-rose-600 dark:text-rose-400 font-bold"
              : "text-zinc-700 dark:text-zinc-300"
          )}
        >
          {formattedDisplay}
        </span>
      )}
    </div>
  );
};
