"use client";

/**
 * Horizon Portal — Task Board Loading Skeleton
 * src/components/task-board/TaskBoardSkeleton.tsx
 *
 * Renders a zero-layout-shift loading skeleton for the Task Board:
 * - Summary metric card skeletons.
 * - Filter bar skeleton.
 * - Four Kanban column placeholder structures with mock card skeletons.
 */

import React from "react";
import { cn } from "@/lib/utils";

export const TaskBoardSkeleton: React.FC<{ className?: string }> = ({
  className,
}) => {
  return (
    <div className={cn("space-y-6 animate-pulse", className)}>
      {/* Summary Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 space-y-2.5"
          >
            <div className="h-3 w-20 bg-zinc-200 dark:bg-zinc-800 rounded" />
            <div className="h-7 w-14 bg-zinc-200 dark:bg-zinc-800 rounded" />
            <div className="h-2.5 w-24 bg-zinc-100 dark:bg-zinc-800/60 rounded" />
          </div>
        ))}
      </div>

      {/* Filter Bar Skeleton */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="h-9 w-44 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
          <div className="h-9 w-44 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
        </div>
        <div className="h-4 w-36 bg-zinc-200 dark:bg-zinc-800 rounded" />
      </div>

      {/* 4 Kanban Column Skeletons */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {["To Do", "In Progress", "Blocked", "Done"].map((colTitle, idx) => (
          <div
            key={idx}
            className="flex flex-col rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/40 min-h-[460px]"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between p-3.5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100/50 dark:bg-zinc-800/40 rounded-t-2xl">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                <span className="text-sm font-semibold text-zinc-400 dark:text-zinc-500">
                  {colTitle}
                </span>
              </div>
              <div className="w-6 h-5 rounded-full bg-zinc-200 dark:bg-zinc-800" />
            </div>

            {/* Column Card Placeholders */}
            <div className="p-3 space-y-3">
              {[...Array(3)].map((_, cIdx) => (
                <div
                  key={cIdx}
                  className="rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="h-3.5 w-16 bg-zinc-200 dark:bg-zinc-800 rounded" />
                    <div className="h-4 w-12 bg-zinc-100 dark:bg-zinc-800/60 rounded" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-20 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
                    <div className="h-5 w-14 bg-zinc-100 dark:bg-zinc-800/60 rounded-md" />
                  </div>
                  <div className="h-3 w-28 bg-zinc-100 dark:bg-zinc-800/60 rounded" />
                  <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                      <div className="h-3 w-16 bg-zinc-200 dark:bg-zinc-800 rounded" />
                    </div>
                    <div className="h-3 w-16 bg-zinc-100 dark:bg-zinc-800/60 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
