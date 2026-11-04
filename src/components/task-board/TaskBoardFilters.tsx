"use client";

/**
 * Horizon Portal — Task Board Filter Toolbar
 * src/components/task-board/TaskBoardFilters.tsx
 *
 * Provides responsive controls to filter Kanban tasks by Team and Sprint:
 * - Team selector (actual database teams)
 * - Sprint selector (actual database sprints)
 * - Clear filters button
 * - Active filter indicator badges
 * - Matching record count readout
 */

import React from "react";
import { TeamOption, SprintOption } from "@/types/task";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface TaskBoardFiltersProps {
  teams: TeamOption[];
  sprints: SprintOption[];
  selectedTeamId: string;
  selectedSprintId: string;
  onTeamChange: (teamId: string) => void;
  onSprintChange: (sprintId: string) => void;
  onClearFilters: () => void;
  totalMatching: number;
  loadedCount: number;
  isLoadingFilters?: boolean;
  className?: string;
}

export const TaskBoardFilters: React.FC<TaskBoardFiltersProps> = ({
  teams,
  sprints,
  selectedTeamId,
  selectedSprintId,
  onTeamChange,
  onSprintChange,
  onClearFilters,
  totalMatching,
  loadedCount,
  isLoadingFilters = false,
  className,
}) => {
  const hasActiveFilters = Boolean(selectedTeamId || selectedSprintId);
  const activeTeam = teams.find((t) => t.id === selectedTeamId);
  const activeSprint = sprints.find((s) => s.id === selectedSprintId);

  return (
    <div
      className={cn(
        "rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-xs space-y-3",
        className
      )}
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Team Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-1.5">
            <label
              htmlFor="team-filter-select"
              className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 shrink-0"
            >
              Team:
            </label>
            <div className="relative">
              <select
                id="team-filter-select"
                value={selectedTeamId}
                onChange={(e) => onTeamChange(e.target.value)}
                disabled={isLoadingFilters}
                className={cn(
                  "h-9 px-3 pr-8 rounded-lg border text-xs font-medium bg-zinc-50 dark:bg-zinc-800/80 transition-colors cursor-pointer",
                  "border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100",
                  "focus:outline-hidden focus:ring-2 focus:ring-[var(--hz-primary)] focus:border-transparent",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                <option value="">All Teams ({teams.length})</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.teamName} ({team.id})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Sprint Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-1.5">
            <label
              htmlFor="sprint-filter-select"
              className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 shrink-0"
            >
              Sprint:
            </label>
            <div className="relative">
              <select
                id="sprint-filter-select"
                value={selectedSprintId}
                onChange={(e) => onSprintChange(e.target.value)}
                disabled={isLoadingFilters}
                className={cn(
                  "h-9 px-3 pr-8 rounded-lg border text-xs font-medium bg-zinc-50 dark:bg-zinc-800/80 transition-colors cursor-pointer",
                  "border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100",
                  "focus:outline-hidden focus:ring-2 focus:ring-[var(--hz-primary)] focus:border-transparent",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                <option value="">All Sprints ({sprints.length})</option>
                {sprints.map((sprint) => (
                  <option key={sprint.id} value={sprint.id}>
                    {sprint.sprintName} ({sprint.id})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onClearFilters}
              className="text-xs h-9"
              title="Clear all active filters"
            >
              Clear Filters
            </Button>
          )}
        </div>

        {/* Readout Counter */}
        <div className="text-xs text-zinc-500 dark:text-zinc-400 self-start md:self-center">
          Showing <span className="font-semibold text-zinc-900 dark:text-zinc-100">{loadedCount}</span> of{" "}
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">{totalMatching.toLocaleString()}</span> tasks
        </div>
      </div>

      {/* Active Filter Pills (if any) */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
          <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500">
            Active Filters:
          </span>
          {activeTeam && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
              Team: {activeTeam.teamName}
              <button
                type="button"
                onClick={() => onTeamChange("")}
                className="hover:text-blue-900 dark:hover:text-blue-100"
                aria-label={`Remove team filter ${activeTeam.teamName}`}
              >
                ×
              </button>
            </span>
          )}
          {activeSprint && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-900">
              Sprint: {activeSprint.sprintName}
              <button
                type="button"
                onClick={() => onSprintChange("")}
                className="hover:text-purple-900 dark:hover:text-purple-100"
                aria-label={`Remove sprint filter ${activeSprint.sprintName}`}
              >
                ×
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
};
