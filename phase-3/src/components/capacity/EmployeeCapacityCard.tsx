"use client";

/**
 * Horizon Portal — Mobile Employee Capacity Card
 * src/components/capacity/EmployeeCapacityCard.tsx
 *
 * Responsive card layout for mobile viewports (< 768px):
 * Displays employee capacity, leave impact, planned open points,
 * and utilization with clear touch-friendly spacing.
 */

import React from "react";
import { SerializedEmployeeCapacityRecord } from "@/lib/capacity/capacity-types";
import { WorkloadStatusBadge } from "./WorkloadStatusBadge";
import { CapacityProgressBar } from "./CapacityProgressBar";
import { cn } from "@/lib/utils";

export interface EmployeeCapacityCardProps {
  record: SerializedEmployeeCapacityRecord;
  className?: string;
}

export const EmployeeCapacityCard: React.FC<EmployeeCapacityCardProps> = ({
  record,
  className,
}) => {
  const isOverloaded = record.isOverloaded;

  return (
    <div
      className={cn(
        "flex flex-col p-4 rounded-xl border bg-white dark:bg-zinc-900 space-y-3.5 transition-colors shadow-sm",
        isOverloaded
          ? "border-rose-300 dark:border-rose-900 bg-rose-50/20 dark:bg-rose-950/20"
          : "border-zinc-200 dark:border-zinc-800",
        className
      )}
    >
      {/* Header: Name, Role, Badge */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
              {record.employeeName}
            </h3>
            <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">
              {record.employeeId}
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            {record.roleTitle || "Team Member"}
            {record.department && ` • ${record.department}`}
          </p>
        </div>

        <WorkloadStatusBadge classification={record.classification} />
      </div>

      {/* Team Chips */}
      {record.teams.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {record.teams.map((team, idx) => (
            <span
              key={idx}
              className="px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
            >
              {team}
            </span>
          ))}
        </div>
      )}

      {/* Utilization Bar */}
      <div className="space-y-1 pt-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-500 dark:text-zinc-400">Utilization</span>
          <span
            className={cn(
              "font-bold tabular-nums",
              isOverloaded
                ? "text-rose-600 dark:text-rose-400"
                : "text-zinc-800 dark:text-zinc-200"
            )}
          >
            {record.utilizationDisplay}
          </span>
        </div>
        <CapacityProgressBar
          value={record.utilizationPercentage}
          displayValue={record.utilizationDisplay}
          classification={record.classification}
          size="sm"
          ariaLabel={`Utilization for ${record.employeeName}`}
        />
      </div>

      {/* 3 Metric Grid */}
      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800/80 text-center">
        {/* Available Days */}
        <div className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
          <span className="block text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
            Available
          </span>
          <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
            {record.availableWorkingDays}d
          </span>
          {record.approvedLeaveWorkingDays > 0 && (
            <span className="block text-[10px] text-amber-600 dark:text-amber-400">
              ({record.approvedLeaveWorkingDays}d leave)
            </span>
          )}
        </div>

        {/* Net Capacity */}
        <div className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
          <span className="block text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
            Net Capacity
          </span>
          <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
            {record.netCapacity} pts
          </span>
          <span className="block text-[10px] text-zinc-400">
            ({record.grossCapacity} gross)
          </span>
        </div>

        {/* Planned Open */}
        <div className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
          <span className="block text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
            Open Workload
          </span>
          <span
            className={cn(
              "text-xs font-bold",
              isOverloaded
                ? "text-rose-600 dark:text-rose-400"
                : "text-zinc-900 dark:text-zinc-100"
            )}
          >
            {record.plannedOpenPoints} pts
          </span>
          <span className="block text-[10px] text-zinc-400">
            ({record.completedPoints} done)
          </span>
        </div>
      </div>

      {/* Warning Callout for Overloaded Members */}
      {isOverloaded && (
        <div className="p-2.5 rounded-lg bg-rose-100/70 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/80 flex items-center gap-2 text-xs text-rose-800 dark:text-rose-300">
          <svg className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="font-medium">
            {record.warningMessage || `Exceeds net capacity by ${record.excessPoints} points.`}
          </span>
        </div>
      )}
    </div>
  );
};
