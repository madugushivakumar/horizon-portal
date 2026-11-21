"use client";

/**
 * Horizon Portal — Overload Warning Alert
 * src/components/capacity/OverloadWarning.tsx
 *
 * Prominent warning banner displayed when one or more team members
 * are allocated more open story points than their net sprint capacity allows.
 */

import React, { useState } from "react";
import { cn } from "@/lib/utils";

export interface OverloadWarningProps {
  /** Count of employees exceeding 100% capacity in the current view */
  overloadedCount: number;
  /** Total excess story points across overloaded team members */
  totalExcessPoints?: number;
  /** Optional custom class name */
  className?: string;
}

export const OverloadWarning: React.FC<OverloadWarningProps> = ({
  overloadedCount,
  totalExcessPoints,
  className,
}) => {
  const [dismissed, setDismissed] = useState(false);

  if (overloadedCount === 0 || dismissed) {
    return null;
  }

  const employeeNoun = overloadedCount === 1 ? "team member" : "team members";

  return (
    <div
      role="alert"
      className={cn(
        "relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/80 dark:bg-rose-950/30 text-rose-950 dark:text-rose-100 transition-all",
        className
      )}
    >
      <div className="flex items-start gap-3.5">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400">
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-rose-900 dark:text-rose-200">
              Capacity Warning: {overloadedCount} {employeeNoun} Overloaded
            </h3>
            {totalExcessPoints !== undefined && totalExcessPoints > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-rose-200/80 dark:bg-rose-800/80 text-rose-900 dark:text-rose-100">
                +{totalExcessPoints} pts excess
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-rose-700 dark:text-rose-300 max-w-3xl leading-relaxed">
            Active workload exceeds net available sprint capacity after approved leave deductions.
            Reallocate tasks, split user stories, or defer backlog items to prevent delivery risk and burnout.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="self-start sm:self-center shrink-0 text-xs font-medium text-rose-600 hover:text-rose-800 dark:text-rose-400 dark:hover:text-rose-200 p-1.5 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors"
        aria-label="Dismiss capacity warning"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};
