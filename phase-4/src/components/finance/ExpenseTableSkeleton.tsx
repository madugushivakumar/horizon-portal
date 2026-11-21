"use client";

/**
 * Horizon Portal — Expense Table Loading Skeleton
 * src/components/finance/ExpenseTableSkeleton.tsx
 *
 * Renders pulsing shimmer placeholder rows matching the exact columns of the expense table.
 */

import React from "react";

export interface ExpenseTableSkeletonProps {
  rowCount?: number;
}

export function ExpenseTableSkeleton({ rowCount = 6 }: ExpenseTableSkeletonProps) {
  const rows = Array.from({ length: rowCount });

  return (
    <div
      className="animate-pulse divide-y divide-zinc-200 dark:divide-zinc-800"
      aria-label="Loading expenses"
    >
      {rows.map((_, i) => (
        <div
          key={i}
          className="grid grid-cols-9 gap-4 px-4 py-3.5 items-center bg-white dark:bg-zinc-900"
        >
          {/* 1. Date */}
          <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-20" />

          {/* 2. Bill Ref */}
          <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-28" />

          {/* 3. Vendor */}
          <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-32" />

          {/* 4. Category */}
          <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-28" />

          {/* 5. Department */}
          <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-24" />

          {/* 6. Description */}
          <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-36" />

          {/* 7. Due Date */}
          <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-20" />

          {/* 8. Total Amount */}
          <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-24 ml-auto" />

          {/* 9. Status Badge */}
          <div className="h-5 bg-zinc-200 dark:bg-zinc-800 rounded-full w-16 mx-auto" />
        </div>
      ))}
    </div>
  );
}
