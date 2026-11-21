"use client";

/**
 * Horizon Portal — Task Board Notification Banner
 * src/components/task-board/TaskBoardNotification.tsx
 *
 * Renders non-intrusive status feedback for:
 * - 409 Optimistic Concurrency Conflicts (warning/amber)
 * - 403 / 500 Rollbacks & Permission denials (error/rose)
 * - Successful task transitions (success/emerald)
 */

import React from "react";
import { TaskBoardNotification as NotificationType } from "@/types/task";
import { cn } from "@/lib/utils";

export interface TaskBoardNotificationProps {
  notification: NotificationType | null;
  onDismiss: () => void;
  className?: string;
}

const STYLES = {
  success: {
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    border: "border-emerald-200 dark:border-emerald-900/60",
    text: "text-emerald-800 dark:text-emerald-200",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
  },
  warning: {
    bg: "bg-amber-50 dark:bg-amber-950/40",
    border: "border-amber-200 dark:border-amber-900/60",
    text: "text-amber-800 dark:text-amber-200",
    iconColor: "text-amber-600 dark:text-amber-400",
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
    ),
  },
  error: {
    bg: "bg-rose-50 dark:bg-rose-950/40",
    border: "border-rose-200 dark:border-rose-900/60",
    text: "text-rose-800 dark:text-rose-200",
    iconColor: "text-rose-600 dark:text-rose-400",
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
  },
  info: {
    bg: "bg-blue-50 dark:bg-blue-950/40",
    border: "border-blue-200 dark:border-blue-900/60",
    text: "text-blue-800 dark:text-blue-200",
    iconColor: "text-blue-600 dark:text-blue-400",
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
};

export const TaskBoardNotificationBanner: React.FC<TaskBoardNotificationProps> = ({
  notification,
  onDismiss,
  className,
}) => {
  if (!notification) return null;

  const style = STYLES[notification.type] || STYLES.info;

  return (
    <div
      role="alert"
      className={cn(
        "flex items-center justify-between gap-3 px-4 py-3 rounded-xl border text-xs font-medium shadow-xs transition-all",
        style.bg,
        style.border,
        style.text,
        className
      )}
    >
      <div className="flex items-center gap-2.5">
        <span className={style.iconColor} aria-hidden="true">
          {style.icon}
        </span>
        <span>{notification.message}</span>
      </div>

      <button
        type="button"
        onClick={onDismiss}
        className="p-1 rounded-md opacity-70 hover:opacity-100 transition-opacity focus:outline-hidden focus:ring-2 focus:ring-current"
        aria-label="Dismiss notification"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};
