"use client";

/**
 * Horizon Portal — Task Board Header
 * src/components/task-board/TaskBoardHeader.tsx
 *
 * Page title, operational subtitle, and refresh trigger.
 */

import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface TaskBoardHeaderProps {
  isRefreshing: boolean;
  onRefresh: () => void;
  lastUpdated?: Date | null;
  className?: string;
}

export const TaskBoardHeader: React.FC<TaskBoardHeaderProps> = ({
  isRefreshing,
  onRefresh,
  lastUpdated,
  className,
}) => {
  return (
    <header
      className={cn(
        "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-zinc-200 dark:border-zinc-800",
        className
      )}
    >
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Team Task Board
          </h1>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/80 dark:border-blue-900/60">
            Kanban
          </span>
        </div>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400 max-w-2xl">
          Manage team tasks, track sprint progress, and monitor work across your organization.
        </p>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {lastUpdated && (
          <span className="hidden sm:inline-block text-xs text-zinc-400 dark:text-zinc-500">
            Updated {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </span>
        )}

        <Button
          variant="secondary"
          size="sm"
          onClick={onRefresh}
          disabled={isRefreshing}
          loading={isRefreshing}
          leftIcon={
            !isRefreshing ? (
              <svg
                className="w-4 h-4 text-zinc-600 dark:text-zinc-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            ) : undefined
          }
        >
          {isRefreshing ? "Refreshing..." : "Refresh Board"}
        </Button>
      </div>
    </header>
  );
};
