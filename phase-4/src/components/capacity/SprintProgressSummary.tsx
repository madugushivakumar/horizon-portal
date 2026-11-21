"use client";

/**
 * Horizon Portal — Sprint Progress Summary
 * src/components/capacity/SprintProgressSummary.tsx
 *
 * Displays active sprint parameters, calendar duration, working days,
 * and overall story point burn/completion progress.
 */

import React from "react";
import { CapacitySprintInfo, SprintProgressMetrics } from "@/lib/capacity/capacity-types";
import { CapacityProgressBar } from "./CapacityProgressBar";
import { cn } from "@/lib/utils";

export interface SprintProgressSummaryProps {
  sprint: CapacitySprintInfo;
  progress: SprintProgressMetrics;
  className?: string;
}

export const SprintProgressSummary: React.FC<SprintProgressSummaryProps> = ({
  sprint,
  progress,
  className,
}) => {
  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
      });
    } catch {
      return isoString.split("T")[0];
    }
  };

  return (
    <div
      className={cn(
        "p-4 sm:p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-4",
        className
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
              {sprint.name}
            </h2>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              Sprint Context
            </span>
          </div>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            {formatDate(sprint.startDate)} &ndash; {formatDate(sprint.endDate)} &bull;{" "}
            <span className="font-semibold text-zinc-700 dark:text-zinc-300">
              {sprint.workingDays} working days
            </span>{" "}
            (weekends & holidays excluded)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-xs text-zinc-500 dark:text-zinc-400">Completion</span>
            <div className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
              {progress.completionPercentage.toFixed(1)}%
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <CapacityProgressBar
          value={progress.completionPercentage}
          barColor="bg-gradient-to-r from-blue-600 to-emerald-500"
          size="md"
          ariaLabel="Sprint story point completion progress"
        />
        <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 pt-1">
          <span>
            Completed: <strong className="text-zinc-800 dark:text-zinc-200">{progress.completedPoints} pts</strong>
          </span>
          <span>
            Remaining: <strong className="text-zinc-800 dark:text-zinc-200">{progress.remainingPoints} pts</strong>
          </span>
          <span>
            Total Planned: <strong className="text-zinc-800 dark:text-zinc-200">{progress.plannedPoints} pts</strong>
          </span>
        </div>
      </div>
    </div>
  );
};
