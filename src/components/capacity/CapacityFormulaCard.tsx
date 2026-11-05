"use client";

/**
 * Horizon Portal — Capacity Formula & Assumptions Card
 * src/components/capacity/CapacityFormulaCard.tsx
 *
 * Transparently displays the mathematical formulas, planning principles,
 * and working-day assumptions powering the capacity calculation engine.
 */

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface CapacityFormulaCardProps {
  className?: string;
  defaultExpanded?: boolean;
}

export const CapacityFormulaCard: React.FC<CapacityFormulaCardProps> = ({
  className,
  defaultExpanded = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <Card
      elevation="flat"
      padding="none"
      className={cn(
        "rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 overflow-hidden transition-all",
        className
      )}
    >
      <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
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
                strokeWidth={1.8}
                d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Capacity Engine Principles & Formulas
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Sprint baseline = 5 story points / working day &bull; Leave reduces capacity, not assigned tasks
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors"
          aria-expanded={isExpanded}
        >
          <span>{isExpanded ? "Hide Details" : "View Formulas"}</span>
          <svg
            className={cn("h-4 w-4 transition-transform duration-200", isExpanded && "rotate-180")}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {isExpanded && (
        <CardContent className="px-4 pb-5 pt-0 sm:px-5 space-y-4 border-t border-zinc-200 dark:border-zinc-800/80">
          {/* Formula Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4">
            <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                1. Gross Capacity
              </span>
              <p className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400">
                Gross = Sprint Days &times; 5 pts
              </p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Mon&ndash;Fri working days in sprint minus recognized company holidays.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                2. Net Capacity
              </span>
              <p className="font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                Net = (Days &minus; Leave) &times; 5 pts
              </p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Only approved leaves reduce working days; deduplicated against holidays.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                3. Workload Utilization
              </span>
              <p className="font-mono text-xs font-semibold text-purple-600 dark:text-purple-400">
                Utilization = (Open Pts / Net) &times; 100%
              </p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Open points = To Do + In Progress + Blocked tasks in sprint scope.
              </p>
            </div>
          </div>

          {/* Principle Highlight Callout */}
          <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50">
            <h4 className="text-xs font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
              <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              The Leave vs. Story Point Principle:
            </h4>
            <p className="mt-1 text-xs text-blue-800 dark:text-blue-200/90 leading-relaxed">
              When an engineer is on approved leave for 2 days of a 10-day sprint, their <strong>estimated capacity decreases by 20%</strong> (from 50 to 40 story points).
              Their <strong>assigned task points are NOT reduced</strong> because user stories do not automatically shrink.
              As a result, utilization rises to accurately reflect the true workload pressure on reduced availability.
            </p>
          </div>

          {/* Status Thresholds Reference */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
            <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="font-medium text-emerald-900 dark:text-emerald-200">Available: &lt; 80%</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="font-medium text-amber-900 dark:text-amber-200">Near Capacity: 80&ndash;99%</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-100/60 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-800">
              <span className="w-2 h-2 rounded-full bg-amber-600" />
              <span className="font-medium text-amber-950 dark:text-amber-100">At Capacity: 100%</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span className="font-medium text-rose-900 dark:text-rose-200">Overloaded: &gt; 100%</span>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};
