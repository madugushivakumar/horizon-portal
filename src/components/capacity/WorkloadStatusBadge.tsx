"use client";

/**
 * Horizon Portal — Workload Status Badge
 * src/components/capacity/WorkloadStatusBadge.tsx
 *
 * Renders color-coded status badges for workload classification:
 * - Available: Emerald / Green (0–79%)
 * - Near Capacity: Amber (80–99%)
 * - At Capacity: Amber-Dark (100%)
 * - Overloaded: Rose / Red (> 100%)
 */

import React from "react";
import { WorkloadClassification } from "@/lib/capacity/capacity-types";
import { getWorkloadStatusStyle } from "@/lib/capacity/workload-classifier";
import { cn } from "@/lib/utils";

export interface WorkloadStatusBadgeProps {
  classification: WorkloadClassification;
  showDot?: boolean;
  className?: string;
}

export const WorkloadStatusBadge: React.FC<WorkloadStatusBadgeProps> = ({
  classification,
  showDot = true,
  className,
}) => {
  const style = getWorkloadStatusStyle(classification);

  const dotColors: Record<WorkloadClassification, string> = {
    Available: "bg-emerald-500",
    "Near Capacity": "bg-amber-500",
    "At Capacity": "bg-amber-600",
    Overloaded: "bg-rose-500",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-colors",
        style.badgeClass,
        className
      )}
    >
      {showDot && (
        <span
          className={cn("h-1.5 w-1.5 rounded-full shrink-0", dotColors[classification])}
          aria-hidden="true"
        />
      )}
      {style.label}
    </span>
  );
};
