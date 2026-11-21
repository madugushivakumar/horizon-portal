"use client";

/**
 * Horizon Portal — HR Insights Skeleton Loader
 * src/components/hr-insights/HRInsightsSkeleton.tsx
 *
 * Full dashboard loading placeholder:
 * - Header skeleton with action button
 * - 6 KPI card skeletons
 * - Attrition distribution and factors skeletons
 * - Anomaly audit stream skeleton
 * - Eliminates layout shift during initial load and filtering
 */

import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface HRInsightsSkeletonProps {
  className?: string;
}

export const HRInsightsSkeleton: React.FC<HRInsightsSkeletonProps> = ({
  className,
}) => {
  return (
    <div
      role="status"
      aria-label="Loading workforce insights..."
      aria-busy="true"
      className={cn("space-y-6 animate-pulse", className)}
    >
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Skeleton width={220} height={28} rounded="md" />
            <Skeleton width={180} height={20} rounded="full" />
          </div>
          <Skeleton width={380} height={16} rounded="md" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton width={120} height={36} rounded="lg" />
          <Skeleton width={90} height={36} rounded="lg" />
        </div>
      </div>

      {/* 6 KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} elevation="flat" padding="sm" className="space-y-2 border border-zinc-200 dark:border-zinc-800">
            <div className="flex justify-between items-center">
              <Skeleton width="60%" height={12} rounded="md" />
              <Skeleton width={40} height={14} rounded="full" />
            </div>
            <Skeleton width="80%" height={26} rounded="md" />
            <Skeleton width="100%" height={12} rounded="md" />
          </Card>
        ))}
      </div>

      {/* Main Grid: Attrition Overview & Factors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attrition Risk Distribution Skeleton */}
        <Card elevation="raised" padding="md" className="space-y-4 border border-zinc-200 dark:border-zinc-800">
          <div className="flex justify-between">
            <Skeleton width={200} height={20} rounded="md" />
            <Skeleton width={140} height={16} rounded="full" />
          </div>
          <Skeleton width="100%" height={16} rounded="full" />
          <div className="grid grid-cols-3 gap-3">
            <Skeleton height={80} rounded="lg" />
            <Skeleton height={80} rounded="lg" />
            <Skeleton height={80} rounded="lg" />
          </div>
        </Card>

        {/* Factors Skeleton */}
        <Card elevation="raised" padding="md" className="space-y-4 border border-zinc-200 dark:border-zinc-800">
          <div className="flex justify-between">
            <Skeleton width={180} height={20} rounded="md" />
            <Skeleton width={120} height={16} rounded="full" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between">
                  <Skeleton width="45%" height={14} rounded="md" />
                  <Skeleton width="20%" height={14} rounded="md" />
                </div>
                <Skeleton width="100%" height={8} rounded="full" />
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Anomaly Stream Skeleton */}
      <Card elevation="raised" padding="md" className="space-y-4 border border-zinc-200 dark:border-zinc-800">
        <div className="flex justify-between">
          <Skeleton width={240} height={20} rounded="md" />
          <Skeleton width={140} height={16} rounded="full" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} height={64} rounded="lg" />
          ))}
        </div>
      </Card>
    </div>
  );
};
