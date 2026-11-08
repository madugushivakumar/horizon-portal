"use client";

/**
 * Horizon Portal — Task Board Kanban Column
 * src/components/task-board/TaskBoardColumn.tsx
 *
 * Renders an enterprise Kanban column:
 * - Status header with distinct color accent.
 * - Current task count badge.
 * - dnd-kit droppable container with active drop highlight.
 * - Scrollable card list.
 * - Column-level empty state if 0 tasks match.
 */

import React from "react";
import { useDroppable } from "@dnd-kit/core";
import { Task, TaskStatus } from "@/types/task";
import { TaskCard } from "./TaskCard";
import { cn } from "@/lib/utils";

export interface TaskBoardColumnProps {
  status: TaskStatus;
  title: string;
  tasks: Task[];
  isDraggable?: boolean;
  pendingTaskIds?: Set<string>;
  className?: string;
}

const COLUMN_THEMES: Record<
  TaskStatus,
  {
    headerBg: string;
    border: string;
    badgeBg: string;
    badgeText: string;
    indicator: string;
  }
> = {
  "To Do": {
    headerBg: "bg-zinc-100/80 dark:bg-zinc-800/60",
    border: "border-zinc-200 dark:border-zinc-800",
    badgeBg: "bg-zinc-200 dark:bg-zinc-700",
    badgeText: "text-zinc-800 dark:text-zinc-200",
    indicator: "bg-zinc-400 dark:bg-zinc-500",
  },
  "In Progress": {
    headerBg: "bg-blue-50/80 dark:bg-blue-950/40",
    border: "border-blue-100 dark:border-blue-900/50",
    badgeBg: "bg-blue-200/70 dark:bg-blue-900/80",
    badgeText: "text-blue-800 dark:text-blue-200",
    indicator: "bg-blue-500 dark:bg-blue-400",
  },
  Blocked: {
    headerBg: "bg-rose-50/80 dark:bg-rose-950/40",
    border: "border-rose-100 dark:border-rose-900/50",
    badgeBg: "bg-rose-200/70 dark:bg-rose-900/80",
    badgeText: "text-rose-800 dark:text-rose-200",
    indicator: "bg-rose-500 dark:bg-rose-400",
  },
  Done: {
    headerBg: "bg-emerald-50/80 dark:bg-emerald-950/40",
    border: "border-emerald-100 dark:border-emerald-900/50",
    badgeBg: "bg-emerald-200/70 dark:bg-emerald-900/80",
    badgeText: "text-emerald-800 dark:text-emerald-200",
    indicator: "bg-emerald-500 dark:bg-emerald-400",
  },
};

export const TaskBoardColumn: React.FC<TaskBoardColumnProps> = ({
  status,
  title,
  tasks,
  isDraggable = false,
  pendingTaskIds,
  className,
}) => {
  const theme = COLUMN_THEMES[status] || COLUMN_THEMES["To Do"];

  // Integrate @dnd-kit droppable hook for this status column
  const { setNodeRef, isOver } = useDroppable({
    id: status,
    data: { status },
  });

  return (
    <section
      ref={setNodeRef}
      aria-label={`${title} column, ${tasks.length} tasks`}
      className={cn(
        "flex flex-col min-w-[280px] sm:min-w-[300px] lg:min-w-0 flex-1 rounded-2xl border bg-zinc-50/60 dark:bg-zinc-900/50 transition-all duration-150",
        theme.border,
        isOver &&
          "ring-2 ring-[var(--hz-primary)] bg-blue-50/40 dark:bg-blue-950/20 border-[var(--hz-primary)]/70 shadow-sm",
        className
      )}
    >
      {/* Column Header */}
      <div
        className={cn(
          "flex items-center justify-between px-4 py-3 border-b rounded-t-2xl transition-colors",
          theme.headerBg,
          theme.border,
          isOver && "border-[var(--hz-primary)]/40"
        )}
      >
        <div className="flex items-center gap-2.5">
          <span
            className={cn("w-2.5 h-2.5 rounded-full shrink-0", theme.indicator)}
            aria-hidden="true"
          />
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {title}
          </h3>
        </div>

        <span
          className={cn(
            "px-2 py-0.5 rounded-full text-xs font-bold shrink-0",
            theme.badgeBg,
            theme.badgeText
          )}
          title={`${tasks.length} tasks in ${title}`}
        >
          {tasks.length}
        </span>
      </div>

      {/* Cards Scrollable Body */}
      <div className="flex-1 p-3 space-y-3 overflow-y-auto max-h-[calc(100vh-280px)] min-h-[220px]">
        {tasks.length > 0 ? (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              isDraggable={isDraggable}
              isPending={pendingTaskIds?.has(task.id)}
            />
          ))
        ) : (
          <div
            className={cn(
              "h-full min-h-[160px] flex flex-col items-center justify-center p-6 text-center rounded-xl border border-dashed transition-colors",
              isOver
                ? "border-[var(--hz-primary)]/60 bg-[var(--hz-primary)]/5"
                : "border-zinc-200 dark:border-zinc-800/80 bg-white/40 dark:bg-zinc-900/30"
            )}
          >
            <svg
              className="w-8 h-8 text-zinc-300 dark:text-zinc-600 mb-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 font-medium">
              {isOver ? `Drop here to move to ${title}` : `No tasks in ${title}`}
            </p>
          </div>
        )}
      </div>
    </section>
  );
};
