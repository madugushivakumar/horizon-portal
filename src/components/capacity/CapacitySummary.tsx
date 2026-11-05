"use client";

/**
 * Horizon Portal — Capacity Summary KPI Cards
 * src/components/capacity/CapacitySummary.tsx
 *
 * Displays top-level KPI metric cards for the capacity dashboard:
 * - Scoped Employees
 * - Total Net Capacity (Story Points)
 * - Planned Open Story Points
 * - Overloaded Employees Count
 * - Completed Story Points
 */

import React from "react";
import { CapacityDashboardSummary } from "@/lib/capacity/capacity-types";
import { cn } from "@/lib/utils";

export interface CapacitySummaryProps {
  summary: CapacityDashboardSummary;
  className?: string;
}

export const CapacitySummary: React.FC<CapacitySummaryProps> = ({
  summary,
  className,
}) => {
  const cards = [
    {
      title: "Team Headcount",
      value: summary.totalEmployees.toLocaleString(),
      subtitle: `${summary.availableEmployees} available • ${summary.nearCapacityEmployees} near cap`,
      border: "border-zinc-200 dark:border-zinc-800",
      accent: "text-zinc-900 dark:text-zinc-50",
      bg: "bg-white dark:bg-zinc-900",
      indicator: "bg-zinc-400 dark:bg-zinc-600",
    },
    {
      title: "Total Net Capacity",
      value: `${summary.totalNetCapacity.toLocaleString()} pts`,
      subtitle: `Gross: ${summary.totalGrossCapacity.toLocaleString()} pts`,
      border: "border-emerald-200/80 dark:border-emerald-900/50",
      accent: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-white dark:bg-zinc-900",
      indicator: "bg-emerald-500",
    },
    {
      title: "Open Workload",
      value: `${summary.totalOpenPoints.toLocaleString()} pts`,
      subtitle: `Planned tasks in sprint`,
      border: "border-blue-200/80 dark:border-blue-900/50",
      accent: "text-blue-600 dark:text-blue-400",
      bg: "bg-white dark:bg-zinc-900",
      indicator: "bg-blue-500",
    },
    {
      title: "Overloaded Members",
      value: summary.overloadedEmployees.toLocaleString(),
      subtitle:
        summary.overloadedEmployees > 0
          ? "Immediate rebalance needed"
          : "Workload within limits",
      border:
        summary.overloadedEmployees > 0
          ? "border-rose-300 dark:border-rose-800/80 ring-1 ring-rose-500/20"
          : "border-zinc-200 dark:border-zinc-800",
      accent:
        summary.overloadedEmployees > 0
          ? "text-rose-600 dark:text-rose-400"
          : "text-zinc-700 dark:text-zinc-300",
      bg:
        summary.overloadedEmployees > 0
          ? "bg-rose-50/30 dark:bg-rose-950/20"
          : "bg-white dark:bg-zinc-900",
      indicator:
        summary.overloadedEmployees > 0 ? "bg-rose-500 animate-pulse" : "bg-emerald-500",
    },
    {
      title: "Completed Points",
      value: `${summary.totalCompletedPoints.toLocaleString()} pts`,
      subtitle: `${summary.completionPercentage.toFixed(1)}% of total planned`,
      border: "border-purple-200/80 dark:border-purple-900/50",
      accent: "text-purple-600 dark:text-purple-400",
      bg: "bg-white dark:bg-zinc-900",
      indicator: "bg-purple-500",
    },
  ];

  return (
    <div
      className={cn(
        "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5",
        className
      )}
    >
      {cards.map((card, idx) => (
        <div
          key={idx}
          className={cn(
            "flex flex-col justify-between p-4 rounded-xl border transition-all duration-200 shadow-sm",
            card.border,
            card.bg
          )}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 truncate">
              {card.title}
            </span>
            <span
              className={cn("h-2 w-2 rounded-full shrink-0", card.indicator)}
              aria-hidden="true"
            />
          </div>

          <div className="mt-2.5">
            <span className={cn("text-2xl font-bold tracking-tight", card.accent)}>
              {card.value}
            </span>
          </div>

          <div className="mt-1.5 flex items-center gap-1.5">
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
              {card.subtitle}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};
