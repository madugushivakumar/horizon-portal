"use client";

/**
 * Horizon Portal — Department Attrition Table
 * src/components/hr-insights/DepartmentAttritionTable.tsx
 *
 * Detailed department comparison table with strict Statistical Disclosure Control:
 * - Department ID, Name, Evaluated Headcount
 * - Low, Medium, High Risk distributions
 * - Preserves primary suppression (< 5) and complementary suppression (Residual Protection)
 * - Never converts null to 0
 * - Never infers or calculates suppressed counts from totals
 * - Responsive desktop table and mobile card layout
 * - Mandatory AI disclosure tag
 */

import React from "react";
import { DepartmentAttritionMetric } from "@/lib/hr-insights/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AIReviewLabel } from "./AIReviewLabel";
import { cn } from "@/lib/utils";

export interface DepartmentAttritionTableProps {
  departments: DepartmentAttritionMetric[];
  className?: string;
}

export const DepartmentAttritionTable: React.FC<DepartmentAttritionTableProps> = ({
  departments,
  className,
}) => {
  return (
    <Card
      elevation="raised"
      padding="none"
      className={cn("border border-zinc-200 dark:border-zinc-800 overflow-hidden", className)}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-5 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Department Attrition Comparison
            </h3>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              {departments.length} Departments
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Cross-department risk breakdown. Protected small groups (&lt; 5) and complementary cells are strictly suppressed.
          </p>
        </div>

        <AIReviewLabel size="sm" variant="badge" />
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400 font-semibold">
              <th scope="col" className="px-5 py-3">Department</th>
              <th scope="col" className="px-4 py-3 text-right">Evaluated</th>
              <th scope="col" className="px-4 py-3 text-right">Low Risk</th>
              <th scope="col" className="px-4 py-3 text-right">Medium Risk</th>
              <th scope="col" className="px-4 py-3 text-right">High Risk</th>
              <th scope="col" className="px-5 py-3 text-center">Privacy Safeguard</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {departments.map((dept) => {
              const isHighSuppressed = dept.high === null;
              const isMedSuppressed = dept.medium === null;
              const isLowSuppressed = dept.low === null;

              return (
                <tr
                  key={dept.departmentId}
                  className="transition-colors hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30"
                >
                  {/* Department Name & ID */}
                  <td className="px-5 py-3.5 font-medium text-zinc-900 dark:text-zinc-100">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                        {dept.departmentId}
                      </span>
                      <span>{dept.departmentName}</span>
                    </div>
                  </td>

                  {/* Evaluated Headcount */}
                  <td className="px-4 py-3.5 text-right font-medium text-zinc-700 dark:text-zinc-300">
                    {dept.totalEvaluated === 0 ? (
                      <span className="text-zinc-400 italic">Excluded (0)</span>
                    ) : (
                      dept.totalEvaluated.toLocaleString()
                    )}
                  </td>

                  {/* Low Risk */}
                  <td className="px-4 py-3.5 text-right font-medium">
                    {isLowSuppressed ? (
                      <Badge variant="warning" size="sm">
                        {dept.lowDisplay}
                      </Badge>
                    ) : (
                      <span className="text-emerald-700 dark:text-emerald-400">
                        {dept.lowDisplay}
                      </span>
                    )}
                  </td>

                  {/* Medium Risk */}
                  <td className="px-4 py-3.5 text-right font-medium">
                    {isMedSuppressed ? (
                      <Badge variant="secondary" size="sm" title="Complementary suppression to prevent residual leakage">
                        {dept.mediumDisplay.includes("Residual") ? "Suppressed *" : dept.mediumDisplay}
                      </Badge>
                    ) : (
                      <span className="text-amber-700 dark:text-amber-400">
                        {dept.mediumDisplay}
                      </span>
                    )}
                  </td>

                  {/* High Risk */}
                  <td className="px-4 py-3.5 text-right font-medium">
                    {isHighSuppressed ? (
                      <Badge variant="warning" size="sm" title="Primary suppression (< 5)">
                        {dept.highDisplay}
                      </Badge>
                    ) : (
                      <span className="text-rose-700 dark:text-rose-400 font-semibold">
                        {dept.highDisplay}
                      </span>
                    )}
                  </td>

                  {/* Privacy Safeguard Status */}
                  <td className="px-5 py-3.5 text-center">
                    {dept.hasSuppression ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/80 dark:border-amber-900/60">
                        <svg className="h-3 w-3 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        Protected &lt; 5
                      </span>
                    ) : dept.totalEvaluated === 0 ? (
                      <span className="text-[11px] text-zinc-400 italic">No Model Records</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Unsuppressed (&ge; 5)
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card Alternative */}
      <div className="block md:hidden divide-y divide-zinc-200 dark:divide-zinc-800">
        {departments.map((dept) => (
          <div key={dept.departmentId} className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                  {dept.departmentId}
                </span>
                <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">
                  {dept.departmentName}
                </span>
              </div>
              <span className="text-[11px] font-medium text-zinc-500">
                {dept.totalEvaluated} Evaluated
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1 text-center text-xs">
              <div className="p-2 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30">
                <span className="block text-[10px] text-emerald-800 dark:text-emerald-300 font-medium">Low</span>
                <span className="font-bold text-emerald-900 dark:text-emerald-100">{dept.lowDisplay}</span>
              </div>
              <div className="p-2 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30">
                <span className="block text-[10px] text-amber-800 dark:text-amber-300 font-medium">Medium</span>
                <span className="font-bold text-amber-900 dark:text-amber-100">{dept.mediumDisplay.includes("Residual") ? "Suppressed" : dept.mediumDisplay}</span>
              </div>
              <div className="p-2 rounded-lg bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30">
                <span className="block text-[10px] text-rose-800 dark:text-rose-300 font-medium">High</span>
                <span className="font-bold text-rose-900 dark:text-rose-100">{dept.highDisplay}</span>
              </div>
            </div>

            {dept.hasSuppression && (
              <p className="text-[10px] text-amber-700 dark:text-amber-400 italic">
                * Cells with &lt; 5 records and companion cells are suppressed for re-identification protection.
              </p>
            )}
          </div>
        ))}
      </div>

      {/* SDC Explanatory Footnote */}
      <div className="p-4 bg-zinc-50 dark:bg-zinc-800/40 border-t border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
        <strong>* Statistical Disclosure Control (SDC) Policy:</strong> Departments containing fewer than 5 high-risk records have their high-risk count suppressed (&lt; 5). To prevent residual subtraction leakage from total evaluated headcount, companion medium-risk cells are also secondary-suppressed. Values are strictly aggregate and cannot be reverse-engineered.
      </div>
    </Card>
  );
};
