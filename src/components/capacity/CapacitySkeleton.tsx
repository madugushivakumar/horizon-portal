"use client";

/**
 * Horizon Portal — Capacity Dashboard Loading Skeleton
 * src/components/capacity/CapacitySkeleton.tsx
 *
 * Renders a zero-layout-shift loading skeleton for the Capacity Dashboard:
 * - Summary KPI cards placeholders
 * - Sprint progress box placeholder
 * - Table row placeholders
 */

import React from "react";
import { cn } from "@/lib/utils";

export const CapacitySkeleton: React.FC<{ className?: string }> = ({
  className,
}) => {
  return (
    <div className={cn("space-y-6 animate-pulse", className)}>
      {/* Summary KPI Cards Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 space-y-2.5"
          >
            <div className="h-3 w-20 bg-zinc-200 dark:bg-zinc-800 rounded" />
            <div className="h-7 w-16 bg-zinc-200 dark:bg-zinc-800 rounded" />
            <div className="h-2.5 w-24 bg-zinc-100 dark:bg-zinc-800/60 rounded" />
          </div>
        ))}
      </div>

      {/* Sprint Progress Summary Skeleton */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 space-y-3">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-5 w-40 bg-zinc-200 dark:bg-zinc-800 rounded" />
            <div className="h-3 w-64 bg-zinc-100 dark:bg-zinc-800/60 rounded" />
          </div>
          <div className="h-7 w-14 bg-zinc-200 dark:bg-zinc-800 rounded" />
        </div>
        <div className="h-3 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full" />
        <div className="flex justify-between">
          <div className="h-3 w-24 bg-zinc-100 dark:bg-zinc-800/60 rounded" />
          <div className="h-3 w-24 bg-zinc-100 dark:bg-zinc-800/60 rounded" />
          <div className="h-3 w-24 bg-zinc-100 dark:bg-zinc-800/60 rounded" />
        </div>
      </div>

      {/* Table Placeholder */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 space-y-4">
        <div className="h-8 w-full bg-zinc-100 dark:bg-zinc-800/60 rounded-lg" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center justify-between gap-4 py-3 border-b border-zinc-100 dark:border-zinc-800 last:border-b-0">
            <div className="space-y-1.5 w-1/4">
              <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-800 rounded" />
              <div className="h-2.5 w-20 bg-zinc-100 dark:bg-zinc-800/60 rounded" />
            </div>
            <div className="h-4 w-24 bg-zinc-200 dark:bg-zinc-800 rounded" />
            <div className="h-4 w-20 bg-zinc-200 dark:bg-zinc-800 rounded" />
            <div className="h-4 w-24 bg-zinc-200 dark:bg-zinc-800 rounded" />
            <div className="h-4 w-28 bg-zinc-200 dark:bg-zinc-800 rounded" />
            <div className="h-5 w-20 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
};
