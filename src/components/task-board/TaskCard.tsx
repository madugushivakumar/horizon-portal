"use client";

/**
 * Horizon Portal — Task Card Component
 * src/components/task-board/TaskCard.tsx
 *
 * Compact, accessible, and information-dense Kanban card:
 * - Primary info: Task ID, Task Type, Status.
 * - Priority: P1 / P2 / P3 / P4 indicator.
 * - Agile points: Story point pill.
 * - Assignee: Full name with fallback initials avatar.
 * - Due date: Formatted calendar date with overdue warning flag.
 * - dnd-kit draggable integration with grab cursor, drag feedback, and pending state.
 */

import React from "react";
import { useDraggable } from "@dnd-kit/core";
import { Task } from "@/types/task";
import { TaskPriorityBadge } from "./TaskPriorityBadge";
import { TaskStoryPoints } from "./TaskStoryPoints";
import { cn } from "@/lib/utils";

export interface TaskCardProps {
  task: Task;
  isDraggable?: boolean;
  isPending?: boolean;
  isOverlay?: boolean;
  className?: string;
}

function formatDueDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function isOverdue(dateStr: string, status: string): boolean {
  if (status === "Done") return false;
  try {
    const due = new Date(dateStr).getTime();
    return due < Date.now();
  } catch {
    return false;
  }
}

function getInitials(firstName?: string, lastName?: string): string {
  const f = firstName?.[0] || "";
  const l = lastName?.[0] || "";
  return (f + l).toUpperCase() || "?";
}

const TASK_TYPE_STYLES: Record<string, string> = {
  Bug: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/60",
  Feature: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-900/60",
  Task: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/60",
  Spike: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900/60",
  Improvement: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/60",
};

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  isDraggable = false,
  isPending = false,
  isOverlay = false,
  className,
}) => {
  // Integrate @dnd-kit draggable hook (bypassed if rendering as overlay)
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
    data: { task },
    disabled: !isDraggable || isPending || isOverlay,
  });

  const overdue = isOverdue(task.dueDate, task.status);
  const assigneeName =
    task.assignee?.fullName ||
    (task.assignee?.firstName
      ? `${task.assignee.firstName} ${task.assignee.lastName}`.trim()
      : null);

  const typeStyle =
    TASK_TYPE_STYLES[task.taskType] ||
    "bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700";

  return (
    <article
      ref={isOverlay ? undefined : setNodeRef}
      aria-label={`Task ${task.id}: ${task.taskType}, priority ${task.priority}${isPending ? " (updating)" : ""}`}
      aria-grabbed={isDragging ? true : undefined}
      {...(isOverlay ? {} : attributes)}
      {...(isOverlay ? {} : listeners)}
      className={cn(
        "group relative rounded-xl border bg-white dark:bg-zinc-900 p-4 shadow-xs transition-all duration-150 select-none",
        "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-sm",
        "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--hz-primary)]",
        isDraggable && !isPending && "cursor-grab active:cursor-grabbing",
        !isDraggable && "cursor-default",
        isPending && "opacity-70 cursor-wait",
        isDragging && "opacity-25 border-dashed border-zinc-400 dark:border-zinc-600 shadow-none",
        isOverlay &&
          "shadow-xl border-[var(--hz-primary)]/50 ring-2 ring-[var(--hz-primary)]/20 rotate-1 cursor-grabbing z-50",
        className
      )}
    >
      {/* Pending status pill banner */}
      {isPending && (
        <div className="absolute top-2 right-2 flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 text-[10px] font-semibold animate-pulse border border-blue-200 dark:border-blue-900">
          <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          <span>Saving...</span>
        </div>
      )}

      {/* Top row: Task ID & Type badge */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <span className="font-mono text-xs font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
          {task.id}
        </span>
        {!isPending && (
          <span
            className={cn(
              "inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border",
              typeStyle
            )}
          >
            {task.taskType}
          </span>
        )}
      </div>

      {/* Middle row: Priority badge and Story Points */}
      <div className="flex items-center gap-2 mb-3">
        <TaskPriorityBadge priority={task.priority} />
        <TaskStoryPoints points={task.storyPoints} />
      </div>

      {/* Team and Sprint context */}
      <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mb-3 flex items-center gap-2 truncate">
        {task.team?.teamName && (
          <span className="truncate font-medium">{task.team.teamName}</span>
        )}
        {task.sprint?.sprintName && (
          <>
            <span className="text-zinc-300 dark:text-zinc-700">•</span>
            <span className="truncate">{task.sprint.sprintName}</span>
          </>
        )}
      </div>

      {/* Bottom row: Assignee & Due Date */}
      <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-zinc-100 dark:border-zinc-800/80">
        {/* Assignee */}
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="w-6 h-6 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-[10px] font-bold text-zinc-700 dark:text-zinc-300 shrink-0"
            title={assigneeName || "Unassigned"}
            aria-hidden="true"
          >
            {task.assignee
              ? getInitials(task.assignee.firstName, task.assignee.lastName)
              : "—"}
          </div>
          <span
            className="text-xs text-zinc-700 dark:text-zinc-300 truncate max-w-[110px]"
            title={assigneeName || "Unassigned"}
          >
            {assigneeName || "Unassigned"}
          </span>
        </div>

        {/* Due date */}
        <div
          className={cn(
            "flex items-center gap-1 text-[11px] shrink-0 font-medium",
            overdue
              ? "text-rose-600 dark:text-rose-400 font-semibold"
              : "text-zinc-500 dark:text-zinc-400"
          )}
          title={overdue ? "Overdue task" : `Due on ${formatDueDate(task.dueDate)}`}
        >
          {overdue && (
            <svg
              className="w-3.5 h-3.5 text-rose-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          )}
          <span>{formatDueDate(task.dueDate)}</span>
        </div>
      </div>
    </article>
  );
};
