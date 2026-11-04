"use client";

/**
 * Horizon Portal — Finance Summary & Ageing Loading Skeleton
 * src/components/finance/FinanceSummarySkeleton.tsx
 *
 * Renders dimension-accurate skeletons matching the 5 KPI cards and 5 Ageing cards
 * to ensure zero layout shift (CLS) during initial hydration and refresh cycles.
 */

import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

export function FinanceSummarySkeleton() {
  return (
    <div className="space-y-8" role="status" aria-label="Loading financial metrics">
      {/* ── 1. KPI Cards Skeleton ─────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton variant="text" width="12rem" height="1.25rem" />
            <Skeleton variant="text" width="18rem" height="0.875rem" />
          </div>
          <Skeleton variant="text" width="5rem" height="0.875rem" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card
              key={`kpi-skel-${i}`}
              className="rounded-2xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs"
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Skeleton variant="text" width="60%" height="0.875rem" />
                  <Skeleton variant="rectangular" width="2rem" height="2rem" className="rounded-lg" />
                </div>
                <div className="mt-2 space-y-1.5">
                  <Skeleton variant="text" width="75%" height="1.75rem" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <Skeleton variant="text" width="85%" height="0.75rem" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* ── 2. Ageing Distribution Cards Skeleton ─────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton variant="text" width="14rem" height="1.25rem" />
            <Skeleton variant="text" width="20rem" height="0.875rem" />
          </div>
          <Skeleton variant="text" width="5rem" height="0.875rem" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={`ageing-skel-${i}`}
              className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <Skeleton variant="text" width="50%" height="0.875rem" />
                <Skeleton variant="text" width="3.5rem" height="1.25rem" className="rounded-full" />
              </div>
              <div className="space-y-1">
                <Skeleton variant="text" width="70%" height="1.5rem" />
                <Skeleton variant="text" width="45%" height="0.75rem" />
              </div>
              <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <Skeleton variant="text" width="90%" height="0.625rem" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default FinanceSummarySkeleton;
