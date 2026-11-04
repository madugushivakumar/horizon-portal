"use client";

/**
 * Horizon Portal — Task Story Points Indicator
 * src/components/task-board/TaskStoryPoints.tsx
 *
 * Renders agile estimation points with clean icon and typography.
 */

import React from "react";
import { cn } from "@/lib/utils";

export interface TaskStoryPointsProps {
  points: number;
  className?: string;
}

export const TaskStoryPoints: React.FC<TaskStoryPointsProps> = ({
  points,
  className,
}) => {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold",
        "bg-zinc-100 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700/60",
        className
      )}
      title={`${points} Story Points`}
      aria-label={`${points} Story Points`}
    >
      <svg
        className="w-3 h-3 text-zinc-400 dark:text-zinc-500"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 10V3L4 14h7v7l9-11h-7z"
        />
      </svg>
      <span>{points} pts</span>
    </span>
  );
};
