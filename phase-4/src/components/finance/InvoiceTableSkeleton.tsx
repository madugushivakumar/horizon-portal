"use client";

/**
 * Horizon Portal — Invoice Table Loading Skeleton
 * src/components/finance/InvoiceTableSkeleton.tsx
 *
 * Renders pulsing shimmer placeholder rows matching the exact 9 columns of the invoice table.
 */

import React from "react";

export interface InvoiceTableSkeletonProps {
  rowCount?: number;
}

export function InvoiceTableSkeleton({ rowCount = 6 }: InvoiceTableSkeletonProps) {
  const rows = Array.from({ length: rowCount });

  return (
    <div className="animate-pulse divide-y divide-zinc-200 dark:divide-zinc-800" aria-label="Loading invoices">
      {rows.map((_, i) => (
        <div
          key={i}
          className="grid grid-cols-9 gap-4 px-4 py-3.5 items-center bg-white dark:bg-zinc-900"
        >
          {/* Invoice Number */}
          <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-24" />

          {/* Client Name */}
          <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-32" />

          {/* Invoice Date */}
          <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-20" />

          {/* Due Date */}
          <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-20" />

          {/* Total Amount */}
          <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-24 ml-auto" />

          {/* Amount Paid */}
          <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-24 ml-auto" />

          {/* Balance Due */}
          <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-24 ml-auto" />

          {/* Status Badge */}
          <div className="h-5 bg-zinc-200 dark:bg-zinc-800 rounded-full w-16 mx-auto" />

          {/* Ageing Badge */}
          <div className="h-5 bg-zinc-200 dark:bg-zinc-800 rounded-full w-20 mx-auto" />
        </div>
      ))}
    </div>
  );
}
