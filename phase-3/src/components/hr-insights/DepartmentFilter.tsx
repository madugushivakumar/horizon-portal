"use client";

/**
 * Horizon Portal — Department Filter Component
 * src/components/hr-insights/DepartmentFilter.tsx
 *
 * Accessible department selector for the AI Insights dashboard:
 * - Includes 'All Departments' organization-wide option
 * - Lists all 11 departments with evaluation & anomaly counts
 * - Displays '< 5' small-group suppression indicators safely
 * - Includes 'Unassigned / Former Employees' option
 * - Fully keyboard-navigable with clear focus rings
 */

import React from "react";
import { DepartmentFilterItem } from "@/lib/hr-insights/types";
import { cn } from "@/lib/utils";

export interface DepartmentFilterProps {
  departments: DepartmentFilterItem[];
  selectedDepartmentId: string;
  onSelectDepartment: (departmentId: string) => void;
  unassignedOption?: {
    id: string;
    name: string;
    anomalyCount: number;
    anomalyCountDisplay: string;
  };
  disabled?: boolean;
  className?: string;
}

export const DepartmentFilter: React.FC<DepartmentFilterProps> = ({
  departments,
  selectedDepartmentId,
  onSelectDepartment,
  unassignedOption,
  disabled = false,
  className,
}) => {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <label
        htmlFor="hr-insights-department-select"
        className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 shrink-0"
      >
        Department:
      </label>
      <div className="relative">
        <select
          id="hr-insights-department-select"
          aria-label="Filter insights by department"
          value={selectedDepartmentId}
          onChange={(e) => onSelectDepartment(e.target.value)}
          disabled={disabled || departments.length === 0}
          className="h-9 min-w-[240px] max-w-[320px] rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-900 shadow-xs transition-colors focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-blue-400"
        >
          <option value="">All Departments (Organization-Wide)</option>

          <optgroup label="Organizational Departments">
            {departments.map((dept) => {
              const attLabel = dept.hasAttritionData
                ? `${dept.attritionCountDisplay} Attrition`
                : "No Attrition Model Data";
              const anoLabel = `${dept.anomalyCountDisplay} Anomalies`;
              const suppressionNote = dept.isSuppressed ? " [Protected < 5]" : "";

              return (
                <option key={dept.id} value={dept.id}>
                  {dept.id} — {dept.name} ({attLabel}, {anoLabel}){suppressionNote}
                </option>
              );
            })}
          </optgroup>

          {unassignedOption && (
            <optgroup label="Historical & Former Employees">
              <option value={unassignedOption.id}>
                {unassignedOption.name} ({unassignedOption.anomalyCountDisplay} Anomalies)
              </option>
            </optgroup>
          )}
        </select>
      </div>
    </div>
  );
};
