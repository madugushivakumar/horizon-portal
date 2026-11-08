"use client";

/**
 * Horizon Portal — HR Insights KPI Metrics
 * src/components/hr-insights/HRInsightsMetrics.tsx
 *
 * Renders six top-level responsive KPI cards:
 * 1. Employees Evaluated
 * 2. High Attrition Risk
 * 3. Medium Attrition Risk
 * 4. Low Attrition Risk
 * 5. Flagged Anomalies
 * 6. Historical Payroll Exposure
 *
 * Enforces strict label integrity:
 * - Cumulative financial exposure is strictly labeled "18-month cumulative historical flagged payroll exposure"
 * - Preserves small-group suppression (< 5) without converting null to 0
 * - Mandatory disclosure: "AI-generated, for human review"
 */

import React from "react";
import {
  AttritionInsightsData,
  PayrollAnomalyInsightsData,
} from "@/lib/hr-insights/types";
import { Card } from "@/components/ui/card";
import { AIReviewLabel } from "./AIReviewLabel";
import { cn } from "@/lib/utils";

export interface HRInsightsMetricsProps {
  attrition: AttritionInsightsData;
  payrollAnomalies: PayrollAnomalyInsightsData;
  className?: string;
}

export const HRInsightsMetrics: React.FC<HRInsightsMetricsProps> = ({
  attrition,
  payrollAnomalies,
  className,
}) => {
  const risk = attrition.riskBands;

  const cards = [
    {
      id: "evaluated",
      title: "Employees Evaluated",
      value: attrition.totalEvaluated.toLocaleString(),
      subtitle: "Active workforce evaluated",
      border: "border-zinc-200 dark:border-zinc-800",
      accent: "text-zinc-900 dark:text-zinc-50",
      bg: "bg-white dark:bg-zinc-900",
      indicator: "bg-zinc-500",
      badgeText: "Scope",
      badgeVariant: "neutral",
    },
    {
      id: "high-risk",
      title: "High Attrition Risk",
      value: risk.highDisplay,
      subtitle:
        risk.high !== null && risk.highRiskPercentage !== null
          ? `${risk.highRiskPercentage.toFixed(1)}% of evaluated headcount`
          : "Small group protected (< 5)",
      border: "border-rose-200/80 dark:border-rose-900/50",
      accent: "text-rose-600 dark:text-rose-400",
      bg: "bg-white dark:bg-zinc-900",
      indicator: "bg-rose-500",
      badgeText: risk.high !== null ? "High Priority" : "Protected",
      badgeVariant: "rose",
    },
    {
      id: "medium-risk",
      title: "Medium Attrition Risk",
      value: risk.mediumDisplay,
      subtitle:
        risk.medium !== null && attrition.totalEvaluated > 0
          ? `${((risk.medium / attrition.totalEvaluated) * 100).toFixed(1)}% moderate likelihood`
          : "Protected group",
      border: "border-amber-200/80 dark:border-amber-900/50",
      accent: "text-amber-600 dark:text-amber-400",
      bg: "bg-white dark:bg-zinc-900",
      indicator: "bg-amber-500",
      badgeText: "Moderate",
      badgeVariant: "amber",
    },
    {
      id: "low-risk",
      title: "Low Attrition Risk",
      value: risk.lowDisplay,
      subtitle:
        risk.low !== null && attrition.totalEvaluated > 0
          ? `${((risk.low / attrition.totalEvaluated) * 100).toFixed(1)}% retention baseline`
          : "Baseline",
      border: "border-emerald-200/80 dark:border-emerald-900/50",
      accent: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-white dark:bg-zinc-900",
      indicator: "bg-emerald-500",
      badgeText: "Stable",
      badgeVariant: "emerald",
    },
    {
      id: "anomalies",
      title: "Flagged Anomalies",
      value: payrollAnomalies.totalAnomalies.toLocaleString(),
      subtitle: `${payrollAnomalies.totalPayrollAnomalies} Payroll • ${payrollAnomalies.totalAttendanceAnomalies} Attendance`,
      border: "border-indigo-200/80 dark:border-indigo-900/50",
      accent: "text-indigo-600 dark:text-indigo-400",
      bg: "bg-white dark:bg-zinc-900",
      indicator: "bg-indigo-500",
      badgeText: "Anomalies",
      badgeVariant: "indigo",
    },
    {
      id: "exposure",
      title: "Historical Payroll Exposure",
      value: payrollAnomalies.formattedCumulativeMoneyAtRisk,
      subtitle: payrollAnomalies.aggregationLabel || "18-month cumulative historical flagged payroll exposure",
      border: "border-amber-200/80 dark:border-amber-900/50",
      accent: "text-amber-700 dark:text-amber-400",
      bg: "bg-white dark:bg-zinc-900",
      indicator: "bg-amber-600",
      badgeText: "18-Mo Cumulative",
      badgeVariant: "amber",
      isMonetary: true,
    },
  ];

  return (
    <section aria-labelledby="kpi-metrics-heading" className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <h2 id="kpi-metrics-heading" className="text-sm font-semibold tracking-wide uppercase text-zinc-500 dark:text-zinc-400">
          Executive KPI Summary
        </h2>
        <AIReviewLabel size="sm" variant="subtle" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {cards.map((card) => (
          <Card
            key={card.id}
            elevation="raised"
            padding="sm"
            className={cn(
              "relative overflow-hidden border transition-shadow hover:shadow-md",
              card.border,
              card.bg
            )}
          >
            {/* Top accent line */}
            <div className={cn("absolute top-0 left-0 right-0 h-1", card.indicator)} />

            <div className="flex flex-col justify-between h-full space-y-2 pt-1">
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400 truncate">
                  {card.title}
                </span>
                <span
                  className={cn(
                    "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold shrink-0",
                    card.badgeVariant === "rose" && "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300",
                    card.badgeVariant === "amber" && "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300",
                    card.badgeVariant === "emerald" && "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
                    card.badgeVariant === "indigo" && "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300",
                    card.badgeVariant === "neutral" && "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                  )}
                >
                  {card.badgeText}
                </span>
              </div>

              <div>
                <p className={cn("text-xl font-bold tracking-tight truncate", card.accent)}>
                  {card.value}
                </p>
                <p
                  className={cn(
                    "text-[11px] leading-tight line-clamp-2 mt-0.5",
                    card.isMonetary
                      ? "text-amber-700/90 dark:text-amber-400/90 font-medium"
                      : "text-zinc-500 dark:text-zinc-400"
                  )}
                  title={card.subtitle}
                >
                  {card.subtitle}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
};
