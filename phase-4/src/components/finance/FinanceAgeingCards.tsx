"use client";

/**
 * Horizon Portal — Live Invoice Ageing Distribution Cards
 * src/components/finance/FinanceAgeingCards.tsx
 *
 * Renders the 5 live dynamic invoice ageing distribution buckets:
 * 1. Not Overdue (Current receivables due on/after cutoff)
 * 2. 0–30 Days (Overdue up to 1 month)
 * 3. 31–60 Days (Overdue 1 to 2 months)
 * 4. 61–90 Days (Overdue 2 to 3 months)
 * 5. 90+ Days (Delinquent past 3 months)
 *
 * Reconciles the sum of bucket amounts directly with summary.outstandingAmount
 * and displays zero values cleanly without errors.
 */

import React from "react";
import { Badge } from "@/components/ui/badge";
import { formatINR } from "@/lib/finance/formatting";
import { AgeingBucket, FinanceSummary } from "@/lib/finance/types";

export interface FinanceAgeingCardsProps {
  summary: FinanceSummary;
}

interface BucketConfig {
  key: AgeingBucket;
  title: string;
  badgeText: string;
  badgeVariant: "secondary" | "warning" | "danger";
  containerClass: string;
  textClass: string;
  description: string;
}

const BUCKET_CONFIGS: BucketConfig[] = [
  {
    key: "NOT_OVERDUE",
    title: "Not Overdue",
    badgeText: "Current",
    badgeVariant: "secondary",
    containerClass: "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900",
    textClass: "text-zinc-900 dark:text-zinc-100",
    description: "Future or due today",
  },
  {
    key: "0_30",
    title: "0 – 30 Days",
    badgeText: "Recent",
    badgeVariant: "warning",
    containerClass: "border-amber-200 dark:border-amber-900/40 bg-amber-50/20 dark:bg-amber-950/10",
    textClass: "text-amber-700 dark:text-amber-400",
    description: "Overdue 1 to 30 days",
  },
  {
    key: "31_60",
    title: "31 – 60 Days",
    badgeText: "Follow-up",
    badgeVariant: "warning",
    containerClass: "border-orange-200 dark:border-orange-900/40 bg-orange-50/20 dark:bg-orange-950/10",
    textClass: "text-orange-700 dark:text-orange-400",
    description: "Overdue 31 to 60 days",
  },
  {
    key: "61_90",
    title: "61 – 90 Days",
    badgeText: "Urgent",
    badgeVariant: "danger",
    containerClass: "border-rose-200 dark:border-rose-900/40 bg-rose-50/20 dark:bg-rose-950/10",
    textClass: "text-rose-700 dark:text-rose-400",
    description: "Overdue 61 to 90 days",
  },
  {
    key: "90_PLUS",
    title: "90+ Days",
    badgeText: "Critical",
    badgeVariant: "danger",
    containerClass: "border-red-300 dark:border-red-900/60 bg-red-50/30 dark:bg-red-950/20",
    textClass: "text-red-700 dark:text-red-400",
    description: "Delinquent > 90 days",
  },
];

export function FinanceAgeingCards({ summary }: FinanceAgeingCardsProps) {
  const breakdown = summary.ageingBreakdown;

  // Compute sum of bucket amounts directly from the breakdown to demonstrate tie-out
  let sumBucketAmount = 0;
  let sumBucketCount = 0;
  for (const cfg of BUCKET_CONFIGS) {
    const bucket = breakdown?.[cfg.key];
    if (bucket) {
      sumBucketAmount += bucket.amount;
      sumBucketCount += bucket.count;
    }
  }

  // Verify mathematical reconciliation against API outstanding
  const isReconciled =
    summary.reconciliation?.invariants?.ageingAmountValid ??
    sumBucketAmount === summary.outstandingAmount;

  return (
    <div className="space-y-4" aria-label="Invoice Ageing Distribution">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
        <div>
          <h2
            id="section-ageing-heading"
            className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight"
          >
            Invoice Ageing Distribution
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Open receivables grouped by overdue age relative to snapshot cutoff ({summary.reportingDate}).
          </p>
        </div>
        <span className="text-[11px] font-mono text-zinc-400 self-start sm:self-auto">
          Section 2 of 4
        </span>
      </div>

      {/* 5 Dynamic Ageing Buckets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {BUCKET_CONFIGS.map((cfg) => {
          const bucket = breakdown?.[cfg.key] || {
            bucket: cfg.key,
            label: cfg.title,
            count: 0,
            amount: 0,
          };

          return (
            <div
              key={cfg.key}
              className={`p-4 rounded-xl border ${cfg.containerClass} shadow-xs space-y-2`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  {cfg.title}
                </span>
                <Badge variant={cfg.badgeVariant} size="sm">
                  {cfg.badgeText}
                </Badge>
              </div>

              <div
                className={`text-xl font-bold font-mono ${cfg.textClass} truncate`}
                title={formatINR(bucket.amount)}
              >
                {formatINR(bucket.amount)}
              </div>

              <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                {bucket.count.toLocaleString("en-IN")} {bucket.count === 1 ? "Open Invoice" : "Open Invoices"}
              </div>

              <p className="text-[10px] text-zinc-400 pt-1.5 border-t border-zinc-100 dark:border-zinc-800">
                {cfg.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Mathematical Reconciliation Status Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/40 text-xs">
        <div className="flex items-center gap-2">
          {isReconciled ? (
            <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-bold">
              ✓
            </div>
          ) : (
            <div className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xs font-bold">
              !
            </div>
          )}
          <span className="text-zinc-700 dark:text-zinc-300 font-medium">
            Ageing Tie-Out:
          </span>
          <span className="text-zinc-500 dark:text-zinc-400 font-mono">
            Sum of 5 Buckets ({formatINR(sumBucketAmount)}) == Total Outstanding ({formatINR(summary.outstandingAmount)})
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-zinc-400">
            Open Invoices: {sumBucketCount} / {summary.openInvoiceCount}
          </span>
          <Badge variant={isReconciled ? "secondary" : "warning"} size="sm">
            {isReconciled ? "Reconciled (100% Match)" : "Pending Tie-Out"}
          </Badge>
        </div>
      </div>
    </div>
  );
}

export default FinanceAgeingCards;
