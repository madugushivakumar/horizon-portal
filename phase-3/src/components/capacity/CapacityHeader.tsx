"use client";

/**
 * Horizon Portal — Capacity Header & Filters
 * src/components/capacity/CapacityHeader.tsx
 *
 * Header section providing:
 * - Page title and contextual subtitle
 * - Sprint selector dropdown
 * - Team filter dropdown (scoped to role permissions)
 * - Refresh button with busy spinner and last updated timestamp
 */

import React from "react";
import { Button } from "@/components/ui/button";
import { CapacitySprintInfo } from "@/lib/capacity/capacity-types";
import { cn } from "@/lib/utils";

export interface CapacityHeaderProps {
  sprints: CapacitySprintInfo[];
  selectedSprintId: string;
  onSelectSprint: (sprintId: string) => void;
  teams: Array<{ id: string; teamName: string }>;
  selectedTeamId: string;
  onSelectTeam: (teamId: string) => void;
  isRefreshing: boolean;
  onRefresh: () => void;
  lastUpdated?: Date | null;
  className?: string;
}

export const CapacityHeader: React.FC<CapacityHeaderProps> = ({
  sprints,
  selectedSprintId,
  onSelectSprint,
  teams,
  selectedTeamId,
  onSelectTeam,
  isRefreshing,
  onRefresh,
  lastUpdated,
  className,
}) => {
  return (
    <header
      className={cn(
        "flex flex-col gap-4 pb-5 border-b border-zinc-200 dark:border-zinc-800",
        className
      )}
    >
      {/* Top row: Title, Subtitle, and Refresh Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Workload &amp; Capacity
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-900/60">
              Bandwidth Engine
            </span>
          </div>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400 max-w-2xl">
            Track sprint bandwidth, approved leave reductions, planned open story points, and workload utilization.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-start sm:self-center">
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
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
      </div>

      {/* Bottom row: Interactive Filters */}
      <div className="flex flex-wrap items-center gap-3 pt-2">
        {/* Sprint Selector */}
        <div className="flex items-center gap-2">
          <label
            htmlFor="capacity-sprint-select"
            className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 shrink-0"
          >
            Sprint:
          </label>
          <select
            id="capacity-sprint-select"
            value={selectedSprintId}
            onChange={(e) => onSelectSprint(e.target.value)}
            disabled={isRefreshing || sprints.length === 0}
            className="h-9 px-3 py-1.5 text-xs font-medium rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
          >
            {sprints.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.workingDays} working days)
              </option>
            ))}
          </select>
        </div>

        {/* Team Selector */}
        {teams.length > 0 && (
          <div className="flex items-center gap-2">
            <label
              htmlFor="capacity-team-select"
              className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 shrink-0"
            >
              Team:
            </label>
            <select
              id="capacity-team-select"
              value={selectedTeamId}
              onChange={(e) => onSelectTeam(e.target.value)}
              disabled={isRefreshing}
              className="h-9 px-3 py-1.5 text-xs font-medium rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
            >
              <option value="">All Accessible Teams</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.teamName}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </header>
  );
};
