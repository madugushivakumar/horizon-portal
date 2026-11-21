"use client";

/**
 * Horizon Portal — Task Board Summary Metrics
 * src/components/task-board/TaskBoardSummary.tsx
 *
 * Displays live KPI metric cards derived directly from real API responses:
 * - Total Matching Tasks (global matching count from pagination metadata)
 * - To Do (page count)
 * - In Progress (page count)
 * - Blocked (page count)
 * - Done (page count)
 * Explicitly distinguishes global matching total from page-level column distributions.
 */

import React from "react";
import { TaskBoardSummaryMetrics } from "@/types/task";
import { cn } from "@/lib/utils";

export interface TaskBoardSummaryProps {
  metrics: TaskBoardSummaryMetrics;
  className?: string;
}

export const TaskBoardSummary: React.FC<TaskBoardSummaryProps> = ({
  metrics,
  className,
}) => {
  const cards = [
    {
      title: "Total Matching",
      value: metrics.totalMatching.toLocaleString(),
      subtitle: `Loaded: ${metrics.totalLoaded}`,
      border: "border-zinc-200 dark:border-zinc-800",
      accent: "text-zinc-900 dark:text-zinc-50",
      bg: "bg-white dark:bg-zinc-900",
      indicator: "bg-zinc-500",
    },
    {
      title: "To Do",
      value: metrics.toDoCount.toLocaleString(),
      subtitle: "Pending execution",
      border: "border-zinc-200 dark:border-zinc-800",
      accent: "text-zinc-700 dark:text-zinc-300",
      bg: "bg-white dark:bg-zinc-900",
      indicator: "bg-zinc-400",
    },
    {
      title: "In Progress",
      value: metrics.inProgressCount.toLocaleString(),
      subtitle: "Active development",
      border: "border-blue-100 dark:border-blue-900/50",
      accent: "text-blue-600 dark:text-blue-400",
      bg: "bg-white dark:bg-zinc-900",
      indicator: "bg-blue-500",
    },
    {
      title: "Blocked",
      value: metrics.blockedCount.toLocaleString(),
      subtitle: "Requires intervention",
      border: "border-rose-100 dark:border-rose-900/50",
      accent: "text-rose-600 dark:text-rose-400",
      bg: "bg-white dark:bg-zinc-900",
      indicator: "bg-rose-500",
    },
    {
      title: "Done",
      value: metrics.doneCount.toLocaleString(),
      subtitle: "Successfully completed",
      border: "border-emerald-100 dark:border-emerald-900/50",
      accent: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-white dark:bg-zinc-900",
      indicator: "bg-emerald-500",
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
            "rounded-xl border p-4 shadow-xs transition-colors",
            card.bg,
            card.border
          )}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              {card.title}
            </span>
            <span
              className={cn("w-2 h-2 rounded-full", card.indicator)}
              aria-hidden="true"
            />
          </div>
          <div className={cn("text-2xl font-bold tracking-tight", card.accent)}>
            {card.value}
          </div>
          <p className="mt-1 text-[11px] text-zinc-400 dark:text-zinc-500 truncate">
            {card.subtitle}
          </p>
        </div>
      ))}
    </div>
  );
};
