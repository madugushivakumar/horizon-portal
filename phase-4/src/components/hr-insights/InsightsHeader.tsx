"use client";

/**
 * Horizon Portal — Insights Header Component
 * src/components/hr-insights/InsightsHeader.tsx
 *
 * Professional header providing:
 * - Page Title: "AI Workforce Insights"
 * - Subtitle: "Workforce risk patterns and payroll anomaly intelligence."
 * - Mandatory AI Disclosure: "AI-generated, for human review"
 * - Department Filter integration
 * - Refresh action with loading indicator and last-updated timestamp
 */

import React from "react";
import { Button } from "@/components/ui/button";
import { AIReviewLabel } from "./AIReviewLabel";
import { DepartmentFilter } from "./DepartmentFilter";
import { DepartmentFilterItem } from "@/lib/hr-insights/types";
import { cn } from "@/lib/utils";

export interface InsightsHeaderProps {
  departments: DepartmentFilterItem[];
  selectedDepartmentId: string;
  onSelectDepartment: (departmentId: string) => void;
  unassignedOption?: {
    id: string;
    name: string;
    anomalyCount: number;
    anomalyCountDisplay: string;
  };
  isRefreshing: boolean;
  onRefresh: () => void;
  lastUpdated?: Date | null;
  className?: string;
}

export const InsightsHeader: React.FC<InsightsHeaderProps> = ({
  departments,
  selectedDepartmentId,
  onSelectDepartment,
  unassignedOption,
  isRefreshing,
  onRefresh,
  lastUpdated,
  className,
}) => {
  return (
    <header
      className={cn(
        "flex flex-col gap-4 border-b border-zinc-200 pb-5 dark:border-zinc-800",
        className
      )}
    >
      {/* Top Row: Title, Subtitle, Mandatory AI Disclosure, and Refresh */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              AI Workforce Insights
            </h1>
            <AIReviewLabel size="sm" variant="badge" />
          </div>
          <p className="mt-1 max-w-2xl text-sm text-zinc-500 dark:text-zinc-400">
            Workforce risk patterns and payroll anomaly intelligence. Model-generated advisory estimates requiring human review.
          </p>
        </div>

        {/* Refresh Action and Timestamp */}
        <div className="flex shrink-0 items-center gap-3 self-start sm:self-center">
          {lastUpdated && (
            <span
              className="text-xs text-zinc-400 dark:text-zinc-500"
              aria-live="polite"
            >
              Updated {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>
          )}

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            aria-label="Refresh AI Insights data"
            leftIcon={
              !isRefreshing ? (
                <svg
                  className="h-3.5 w-3.5 text-zinc-600 dark:text-zinc-400"
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
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
      </div>

      {/* Bottom Row: Department Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <DepartmentFilter
          departments={departments}
          selectedDepartmentId={selectedDepartmentId}
          onSelectDepartment={onSelectDepartment}
          unassignedOption={unassignedOption}
          disabled={isRefreshing}
        />

        {selectedDepartmentId && (
          <span className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
            Filtered Scope Active
          </span>
        )}
      </div>
    </header>
  );
};
