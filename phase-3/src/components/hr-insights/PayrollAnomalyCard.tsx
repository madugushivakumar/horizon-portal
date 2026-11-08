"use client";

/**
 * Horizon Portal — Payroll Anomaly Card
 * src/components/hr-insights/PayrollAnomalyCard.tsx
 *
 * Card component for individual payroll and attendance anomalies:
 * - Category badge (Payroll vs Attendance)
 * - Review Status: strictly "Flagged for Review"
 * - Masked Employee ID: "EMP-***" or "FORMER-EMP-***"
 * - Period, Reason Code, Description, Anomaly Score
 * - Financial formatting:
 *   - Null moneyAtRisk -> "N/A — Non-monetary Attendance" (never ₹0)
 *   - Zero moneyAtRisk -> "₹0.00"
 *   - Positive moneyAtRisk -> formatted Indian Rupee string
 */

import React from "react";
import { AnomalyItem } from "@/lib/hr-insights/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface PayrollAnomalyCardProps {
  item: AnomalyItem;
  className?: string;
}

export const PayrollAnomalyCard: React.FC<PayrollAnomalyCardProps> = ({
  item,
  className,
}) => {
  const isPayroll = item.category === "PAYROLL";

  // Financial value rendering rules
  let financialDisplay: string;
  let financialClass: string;

  if (item.moneyAtRisk === null) {
    financialDisplay = "N/A — Non-monetary Attendance";
    financialClass = "text-zinc-500 dark:text-zinc-400 italic";
  } else if (item.moneyAtRisk === 0) {
    financialDisplay = "₹0.00";
    financialClass = "text-zinc-700 dark:text-zinc-300 font-mono font-semibold";
  } else {
    financialDisplay = item.formattedMoneyAtRisk || `₹${item.moneyAtRisk.toLocaleString("en-IN")}`;
    financialClass = "text-amber-700 dark:text-amber-400 font-mono font-bold";
  }

  return (
    <Card
      elevation="flat"
      padding="sm"
      className={cn(
        "border transition-all hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900/80",
        isPayroll
          ? "border-l-4 border-l-emerald-500 border-zinc-200 dark:border-zinc-800"
          : "border-l-4 border-l-blue-500 border-zinc-200 dark:border-zinc-800",
        className
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        {/* Left Side: Metadata & Reason */}
        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {/* Category Badge */}
            <span
              className={cn(
                "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                isPayroll
                  ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-900/60"
                  : "bg-blue-50 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/80 dark:border-blue-900/60"
              )}
            >
              {item.category}
            </span>

            {/* Score */}
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              Score: {item.anomalyScore.toFixed(2)}
            </span>

            {/* Period */}
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono text-zinc-500 dark:text-zinc-400">
              Period: {item.period}
            </span>

            {/* Review Status (Mandatory text) */}
            <Badge variant="warning" size="sm">
              {item.reviewStatus}
            </Badge>

            {/* Unmatched Former Employee Badge */}
            {item.isUnmatchedEmployee && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-900/40">
                Former Employee
              </span>
            )}
          </div>

          {/* Reason Code and Description */}
          <div className="pt-0.5">
            <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
              <span className="font-mono text-zinc-600 dark:text-zinc-400 mr-1.5">
                [{item.reasonCode}]
              </span>
              {item.reasonText}
            </p>
          </div>

          {/* Department & Masked Employee */}
          <div className="flex flex-wrap items-center gap-3 text-[11px] text-zinc-500 dark:text-zinc-400 pt-0.5">
            <span>
              Subject: <strong className="font-mono font-medium text-zinc-700 dark:text-zinc-300">{item.employeeMask}</strong>
            </span>
            <span>•</span>
            <span>
              Department: <span className="font-medium text-zinc-700 dark:text-zinc-300">{item.departmentName || "Unassigned"}</span>
            </span>
            <span>•</span>
            <span className="font-mono text-[10px] text-zinc-400">
              Ref: {item.recordId}
            </span>
          </div>
        </div>

        {/* Right Side: Financial Exposure */}
        <div className="sm:text-right shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-zinc-100 dark:border-zinc-800">
          <span className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            Financial Exposure
          </span>
          <span className={cn("text-sm block mt-0.5", financialClass)}>
            {financialDisplay}
          </span>
        </div>
      </div>
    </Card>
  );
};
