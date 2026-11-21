"use client";

/**
 * Horizon Portal — Employee Capacity Table
 * src/components/capacity/EmployeeCapacityTable.tsx
 *
 * Detailed desktop and tablet data table displaying:
 * - Scoped employee information, team assignments, and roles
 * - Working days, approved leave deductions, available days
 * - Gross capacity, leave reduction, net capacity
 * - Planned open points, completed points, total planned points
 * - Workload utilization progress bar and status badge
 * - Sorting controls and overloaded row highlight
 */

import React, { useState } from "react";
import { SerializedEmployeeCapacityRecord } from "@/lib/capacity/capacity-types";
import { WorkloadStatusBadge } from "./WorkloadStatusBadge";
import { CapacityProgressBar } from "./CapacityProgressBar";
import { cn } from "@/lib/utils";

export type SortField =
  | "name"
  | "netCapacity"
  | "openPoints"
  | "utilization"
  | "status";
export type SortDirection = "asc" | "desc";

export interface EmployeeCapacityTableProps {
  employees: SerializedEmployeeCapacityRecord[];
  className?: string;
}

export const EmployeeCapacityTable: React.FC<EmployeeCapacityTableProps> = ({
  employees,
  className,
}) => {
  const [sortField, setSortField] = useState<SortField>("utilization");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection(field === "name" ? "asc" : "desc");
    }
  };

  const sortedEmployees = [...employees].sort((a, b) => {
    let comparison = 0;
    switch (sortField) {
      case "name":
        comparison = a.employeeName.localeCompare(b.employeeName);
        break;
      case "netCapacity":
        comparison = a.netCapacity - b.netCapacity;
        break;
      case "openPoints":
        comparison = a.plannedOpenPoints - b.plannedOpenPoints;
        break;
      case "utilization": {
        // Safe comparison handling null (infinite overload)
        const aVal = a.utilizationPercentage ?? (a.isOverloaded ? 999999 : 0);
        const bVal = b.utilizationPercentage ?? (b.isOverloaded ? 999999 : 0);
        comparison = aVal - bVal;
        break;
      }
      case "status": {
        const order = { Overloaded: 4, "At Capacity": 3, "Near Capacity": 2, Available: 1 };
        comparison = (order[a.classification] || 0) - (order[b.classification] || 0);
        break;
      }
    }
    return sortDirection === "asc" ? comparison : -comparison;
  });

  const renderSortIndicator = (field: SortField) => {
    if (sortField !== field) {
      return (
        <svg
          className="w-3.5 h-3.5 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity ml-1"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return (
      <svg
        className="w-3.5 h-3.5 text-zinc-900 dark:text-zinc-100 ml-1"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        {sortDirection === "asc" ? (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        )}
      </svg>
    );
  };

  return (
    <div
      className={cn(
        "hidden md:block rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm",
        className
      )}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs divide-y divide-zinc-200 dark:divide-zinc-800">
          <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-300 font-semibold uppercase tracking-wider text-[11px]">
            <tr>
              <th scope="col" className="py-3.5 px-4">
                <button
                  type="button"
                  onClick={() => handleSort("name")}
                  className="group flex items-center hover:text-zinc-900 dark:hover:text-white"
                >
                  Employee
                  {renderSortIndicator("name")}
                </button>
              </th>
              <th scope="col" className="py-3.5 px-4 text-center">
                Working Days
                <span className="block text-[10px] font-normal text-zinc-400 normal-case">
                  Sprint / Leave / Avail
                </span>
              </th>
              <th scope="col" className="py-3.5 px-4 text-center">
                <button
                  type="button"
                  onClick={() => handleSort("netCapacity")}
                  className="group inline-flex items-center hover:text-zinc-900 dark:hover:text-white"
                >
                  Capacity (Pts)
                  {renderSortIndicator("netCapacity")}
                </button>
                <span className="block text-[10px] font-normal text-zinc-400 normal-case">
                  Gross &minus; Leave = Net
                </span>
              </th>
              <th scope="col" className="py-3.5 px-4 text-center">
                <button
                  type="button"
                  onClick={() => handleSort("openPoints")}
                  className="group inline-flex items-center hover:text-zinc-900 dark:hover:text-white"
                >
                  Workload (Pts)
                  {renderSortIndicator("openPoints")}
                </button>
                <span className="block text-[10px] font-normal text-zinc-400 normal-case">
                  Open / Done / Total
                </span>
              </th>
              <th scope="col" className="py-3.5 px-4 w-44">
                <button
                  type="button"
                  onClick={() => handleSort("utilization")}
                  className="group flex items-center hover:text-zinc-900 dark:hover:text-white"
                >
                  Utilization
                  {renderSortIndicator("utilization")}
                </button>
              </th>
              <th scope="col" className="py-3.5 px-4 text-center">
                <button
                  type="button"
                  onClick={() => handleSort("status")}
                  className="group inline-flex items-center hover:text-zinc-900 dark:hover:text-white"
                >
                  Status
                  {renderSortIndicator("status")}
                </button>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {sortedEmployees.map((record) => {
              const isOverloaded = record.isOverloaded;

              return (
                <tr
                  key={record.employeeId}
                  className={cn(
                    "transition-colors",
                    isOverloaded
                      ? "bg-rose-50/40 dark:bg-rose-950/20 hover:bg-rose-100/50 dark:hover:bg-rose-900/30"
                      : "hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
                  )}
                >
                  {/* 1. Employee Name, Role, Team */}
                  <td className="py-3 px-4">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                          {record.employeeName}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">
                          {record.employeeId}
                        </span>
                      </div>
                      <div className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 flex-wrap mt-0.5">
                        {record.roleTitle && <span>{record.roleTitle}</span>}
                        {record.department && (
                          <>
                            <span>&bull;</span>
                            <span>{record.department}</span>
                          </>
                        )}
                      </div>
                      {record.teams.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {record.teams.map((team, idx) => (
                            <span
                              key={idx}
                              className="px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-[10px] text-zinc-600 dark:text-zinc-300"
                            >
                              {team}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* 2. Working Days Breakdown */}
                  <td className="py-3 px-4 text-center tabular-nums">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-100/80 dark:bg-zinc-800/60 text-xs">
                      <span title="Sprint working days" className="font-medium text-zinc-700 dark:text-zinc-300">
                        {record.availableWorkingDays + record.approvedLeaveWorkingDays}d
                      </span>
                      <span className="text-zinc-400">/</span>
                      <span
                        title="Approved leave days"
                        className={cn(
                          "font-semibold",
                          record.approvedLeaveWorkingDays > 0
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-zinc-400"
                        )}
                      >
                        {record.approvedLeaveWorkingDays}d leave
                      </span>
                      <span className="text-zinc-400">/</span>
                      <span title="Available working days" className="font-bold text-emerald-600 dark:text-emerald-400">
                        {record.availableWorkingDays}d
                      </span>
                    </div>
                  </td>

                  {/* 3. Capacity Breakdown */}
                  <td className="py-3 px-4 text-center tabular-nums">
                    <div className="text-xs">
                      <span className="font-bold text-zinc-900 dark:text-zinc-100">
                        {record.netCapacity} pts
                      </span>
                      {record.leaveCapacityReduction > 0 && (
                        <span className="block text-[11px] text-zinc-500 dark:text-zinc-400">
                          {record.grossCapacity} &minus;{" "}
                          <span className="text-amber-600 dark:text-amber-400">
                            {record.leaveCapacityReduction}
                          </span>
                        </span>
                      )}
                    </div>
                  </td>

                  {/* 4. Task Points Breakdown */}
                  <td className="py-3 px-4 text-center tabular-nums">
                    <div className="text-xs">
                      <span
                        className={cn(
                          "font-bold",
                          isOverloaded
                            ? "text-rose-600 dark:text-rose-400"
                            : "text-zinc-900 dark:text-zinc-100"
                        )}
                      >
                        {record.plannedOpenPoints} pts open
                      </span>
                      <span className="block text-[11px] text-zinc-500 dark:text-zinc-400">
                        {record.completedPoints} done &bull; {record.totalPlannedPoints} total
                      </span>
                    </div>
                  </td>

                  {/* 5. Utilization Progress Bar & Percentage */}
                  <td className="py-3 px-4">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-zinc-500 dark:text-zinc-400">Load</span>
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
                      {isOverloaded && record.excessPoints > 0 && (
                        <span className="block text-[10px] font-semibold text-rose-600 dark:text-rose-400">
                          +{record.excessPoints} pts excess
                        </span>
                      )}
                    </div>
                  </td>

                  {/* 6. Workload Status Badge */}
                  <td className="py-3 px-4 text-center">
                    <WorkloadStatusBadge classification={record.classification} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
