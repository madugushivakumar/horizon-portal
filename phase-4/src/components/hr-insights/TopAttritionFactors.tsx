"use client";

/**
 * Horizon Portal — Top Attrition Factors & Reasons
 * src/components/hr-insights/TopAttritionFactors.tsx
 *
 * Visual analysis of primary statistical attrition drivers:
 * - Tab 1: Thematic Factors (8 canonical workforce categories deduplicated per record)
 * - Tab 2: Specific Source Reasons (Top 10 exact strings from source records)
 * - Horizontal proportional meter bars
 * - Clear explanation of counting semantics (intra-record deduplication)
 * - Mandatory AI disclosure tag
 * - Strictly aggregate & non-deterministic advisory context
 */

import React, { useState } from "react";
import {
  ContributingFactor,
  SpecificReasonItem,
} from "@/lib/hr-insights/types";
import { Card } from "@/components/ui/card";
import { AIReviewLabel } from "./AIReviewLabel";
import { cn } from "@/lib/utils";

export interface TopAttritionFactorsProps {
  topFactors: ContributingFactor[];
  topSpecificReasons: SpecificReasonItem[];
  totalEvaluated: number;
  countingSemantics?: {
    description: string;
    intraRecordDeduplication: boolean;
    maxReasonsPerRecord: number;
  };
  className?: string;
}

export const TopAttritionFactors: React.FC<TopAttritionFactorsProps> = ({
  topFactors,
  topSpecificReasons,
  totalEvaluated,
  countingSemantics,
  className,
}) => {
  const [activeTab, setActiveTab] = useState<"thematic" | "specific">("thematic");

  // Determine maximum count for relative bar scaling
  const maxThematicCount =
    topFactors.length > 0 ? Math.max(...topFactors.map((f) => f.count)) : 1;
  const maxSpecificCount =
    topSpecificReasons.length > 0
      ? Math.max(...topSpecificReasons.map((r) => r.count))
      : 1;

  return (
    <Card
      elevation="raised"
      padding="md"
      className={cn("border border-zinc-200 dark:border-zinc-800 space-y-4", className)}
    >
      {/* Header and Tab Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Key Contributing Attrition Drivers
            </h3>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              Statistical Indicators
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Aggregated factors identified across historical employee retention evaluations.
          </p>
        </div>

        <AIReviewLabel size="sm" variant="badge" />
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex items-center justify-between gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-2">
        <div className="inline-flex rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab("thematic")}
            className={cn(
              "px-3 py-1.5 rounded-md transition-all",
              activeTab === "thematic"
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs font-semibold"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
            )}
          >
            Thematic Factor Groups ({topFactors.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("specific")}
            className={cn(
              "px-3 py-1.5 rounded-md transition-all",
              activeTab === "specific"
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs font-semibold"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
            )}
          >
            Specific Source Reasons ({topSpecificReasons.length})
          </button>
        </div>

        <span className="text-[11px] text-zinc-400 hidden sm:inline-block">
          {activeTab === "thematic" ? "Unique Employee Records" : "Verbatim Citation Frequency"}
        </span>
      </div>

      {/* Tab 1: Thematic Factors Content */}
      {activeTab === "thematic" && (
        <div className="space-y-3">
          <div className="space-y-2.5">
            {topFactors.map((item, index) => {
              const barWidth = Math.min(Math.max((item.count / maxThematicCount) * 100, 4), 100);

              return (
                <div key={item.factor} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center justify-center h-4 w-4 rounded-full bg-zinc-100 text-[10px] font-bold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                        {index + 1}
                      </span>
                      <span className="font-medium text-zinc-800 dark:text-zinc-200">
                        {item.factor}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 font-mono text-zinc-600 dark:text-zinc-400">
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {item.count} records
                      </span>
                      <span className="text-zinc-400">({item.percentage.toFixed(1)}%)</span>
                    </div>
                  </div>

                  {/* Proportional Bar */}
                  <div
                    role="progressbar"
                    aria-label={`Prevalence of ${item.factor}`}
                    aria-valuenow={item.percentage}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800"
                  >
                    <div
                      style={{ width: `${barWidth}%` }}
                      className="h-full rounded-full bg-blue-500 dark:bg-blue-400 transition-all duration-300"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Counting Semantics Footnote */}
          <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800/40 p-3 border border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-500 dark:text-zinc-400 space-y-1">
            <p className="font-semibold text-zinc-700 dark:text-zinc-300">
              Deduplication Methodology Note:
            </p>
            <p className="leading-relaxed">
              {countingSemantics?.description ||
                "Top factors group reasons into 8 canonical workforce themes deduplicated per employee record. Each evaluated employee cited up to 3 contributing reasons. Multiple reasons belonging to the same thematic category are counted once per employee."}
            </p>
          </div>
        </div>
      )}

      {/* Tab 2: Specific Source Reasons Content */}
      {activeTab === "specific" && (
        <div className="space-y-3">
          <div className="space-y-2.5">
            {topSpecificReasons.map((item, index) => {
              const barWidth = Math.min(Math.max((item.count / maxSpecificCount) * 100, 4), 100);

              return (
                <div key={item.reason} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center justify-center h-4 w-4 rounded-full bg-zinc-100 text-[10px] font-bold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                        {index + 1}
                      </span>
                      <span className="font-medium text-zinc-800 dark:text-zinc-200 truncate max-w-[280px] sm:max-w-md" title={item.reason}>
                        {item.reason}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 font-mono text-zinc-600 dark:text-zinc-400 shrink-0">
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {item.count} citations
                      </span>
                      <span className="text-zinc-400">({item.percentage.toFixed(1)}%)</span>
                    </div>
                  </div>

                  {/* Proportional Bar */}
                  <div
                    role="progressbar"
                    aria-label={`Citation frequency of ${item.reason}`}
                    aria-valuenow={item.percentage}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800"
                  >
                    <div
                      style={{ width: `${barWidth}%` }}
                      className="h-full rounded-full bg-indigo-500 dark:bg-indigo-400 transition-all duration-300"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800/40 p-3 border border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-500 dark:text-zinc-400">
            <strong>Source Notice:</strong> Specific reasons reflect exact strings generated by the attrition model across 3 reason slots. Percentages represent citation rate across the {totalEvaluated} evaluated employees.
          </div>
        </div>
      )}
    </Card>
  );
};
