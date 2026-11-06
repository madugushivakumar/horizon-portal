"use client";

/**
 * Horizon Portal — Attrition Risk Overview
 * src/components/hr-insights/AttritionRiskOverview.tsx
 *
 * Accessible visual distribution of workforce turnover likelihood:
 * - Low, Medium, and High risk band meters with counts & percentages
 * - Stacked multi-segment proportional meter bar
 * - Dual-coding: text labels, percentage chips, and semantic colors
 * - Strictly aggregate: zero employee names, IDs, emails, or individual scores
 * - Preserves Statistical Disclosure Control (SDC) for small groups
 * - Mandatory AI disclosure tag
 */

import React from "react";
import { RiskBandCounts } from "@/lib/hr-insights/types";
import { Card } from "@/components/ui/card";
import { AIReviewLabel } from "./AIReviewLabel";
import { cn } from "@/lib/utils";

export interface AttritionRiskOverviewProps {
  riskBands: RiskBandCounts;
  totalEvaluated: number;
  className?: string;
}

export const AttritionRiskOverview: React.FC<AttritionRiskOverviewProps> = ({
  riskBands,
  totalEvaluated,
  className,
}) => {
  // Calculate display percentages for unsuppressed bands safely
  const lowPct =
    riskBands.low !== null && totalEvaluated > 0
      ? ((riskBands.low / totalEvaluated) * 100).toFixed(1)
      : null;

  const medPct =
    riskBands.medium !== null && totalEvaluated > 0
      ? ((riskBands.medium / totalEvaluated) * 100).toFixed(1)
      : null;

  const highPct =
    riskBands.highRiskPercentage !== null
      ? riskBands.highRiskPercentage.toFixed(1)
      : riskBands.high !== null && totalEvaluated > 0
      ? ((riskBands.high / totalEvaluated) * 100).toFixed(1)
      : null;

  // Segment widths for stacked bar (fall back gracefully if suppressed)
  const lowWidth = lowPct ? parseFloat(lowPct) : 0;
  const medWidth = medPct ? parseFloat(medPct) : 0;
  const highWidth = highPct ? parseFloat(highPct) : 0;

  return (
    <Card
      elevation="raised"
      padding="md"
      className={cn("border border-zinc-200 dark:border-zinc-800 space-y-5", className)}
    >
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Attrition Risk Distribution (12-Month Horizon)
            </h3>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              {totalEvaluated.toLocaleString()} Evaluated
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Statistical modeling of baseline turnover probability across active workforce. Strictly aggregate metrics.
          </p>
        </div>

        <AIReviewLabel size="sm" variant="badge" />
      </div>

      {/* Suppression Notification Banner (if active department has protected cells) */}
      {riskBands.isSuppressed && (
        <div
          role="note"
          aria-label="Small group privacy protection active"
          className="rounded-lg border border-amber-200 bg-amber-50/80 p-3 text-xs text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300"
        >
          <div className="flex items-start gap-2">
            <svg
              className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            <div>
              <p className="font-semibold">Privacy Safeguard Active (Small-Group Protection)</p>
              <p className="mt-0.5 leading-relaxed text-amber-700 dark:text-amber-400">
                {riskBands.suppressionNote ||
                  "Categories with fewer than 5 individuals are suppressed (< 5) along with companion cells to prevent mathematical re-identification."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stacked Proportional Distribution Meter */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
          <span>Overall Distribution</span>
          <span>100% Workforce Representation</span>
        </div>

        <div
          role="progressbar"
          aria-label="Attrition risk band proportion"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={100}
          className="flex h-4 w-full overflow-hidden rounded-full bg-zinc-100 p-0.5 dark:bg-zinc-800"
        >
          {lowWidth > 0 && (
            <div
              style={{ width: `${lowWidth}%` }}
              className="h-full rounded-l-full bg-emerald-500 transition-all duration-500 dark:bg-emerald-400"
              title={`Low Risk: ${lowPct}%`}
            />
          )}
          {medWidth > 0 && (
            <div
              style={{ width: `${medWidth}%` }}
              className="h-full bg-amber-500 transition-all duration-500 dark:bg-amber-400"
              title={`Medium Risk: ${medPct}%`}
            />
          )}
          {highWidth > 0 && (
            <div
              style={{ width: `${highWidth}%` }}
              className={cn(
                "h-full bg-rose-500 transition-all duration-500 dark:bg-rose-400",
                lowWidth === 0 && medWidth === 0 && "rounded-l-full",
                "rounded-r-full"
              )}
              title={`High Risk: ${highPct}%`}
            />
          )}
          {riskBands.isSuppressed && (
            <div
              style={{ width: "100%" }}
              className="h-full rounded-full bg-amber-200 dark:bg-amber-900/60 transition-all"
              title="Suppressed Distribution (Small-Group Protection)"
            />
          )}
        </div>
      </div>

      {/* 3 Detail Cards: Low, Medium, High */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
        {/* Low Risk */}
        <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/40 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Low Risk Band
            </span>
            {lowPct && (
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                {lowPct}%
              </span>
            )}
          </div>
          <div className="mt-2">
            <p className="text-2xl font-bold tracking-tight text-emerald-900 dark:text-emerald-100">
              {riskBands.lowDisplay}
            </p>
            <p className="text-xs text-emerald-700/90 dark:text-emerald-400/90 mt-0.5">
              Annual predicted likelihood &lt; 15%. Stable retention profile.
            </p>
          </div>
        </div>

        {/* Medium Risk */}
        <div className="rounded-xl border border-amber-200/80 bg-amber-50/40 p-4 dark:border-amber-900/40 dark:bg-amber-950/20">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800 dark:text-amber-300">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              Medium Risk Band
            </span>
            {medPct && (
              <span className="text-xs font-bold text-amber-700 dark:text-amber-400">
                {medPct}%
              </span>
            )}
          </div>
          <div className="mt-2">
            <p className="text-2xl font-bold tracking-tight text-amber-900 dark:text-amber-100">
              {riskBands.mediumDisplay}
            </p>
            <p className="text-xs text-amber-700/90 dark:text-amber-400/90 mt-0.5">
              Annual predicted likelihood 15%–40%. Candidate for proactive 1-on-1s.
            </p>
          </div>
        </div>

        {/* High Risk */}
        <div className="rounded-xl border border-rose-200/80 bg-rose-50/40 p-4 dark:border-rose-900/40 dark:bg-rose-950/20">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-800 dark:text-rose-300">
              <span className="h-2 w-2 rounded-full bg-rose-500" />
              High Risk Band
            </span>
            {highPct && (
              <span className="text-xs font-bold text-rose-700 dark:text-rose-400">
                {highPct}%
              </span>
            )}
          </div>
          <div className="mt-2">
            <p className="text-2xl font-bold tracking-tight text-rose-900 dark:text-rose-100">
              {riskBands.highDisplay}
            </p>
            <p className="text-xs text-rose-700/90 dark:text-rose-400/90 mt-0.5">
              Annual predicted likelihood &gt; 40%. Requires career growth and engagement support.
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
};
