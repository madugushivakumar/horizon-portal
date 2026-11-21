import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Horizon Portal — Global Route Loading State
 * src/app/loading.tsx
 *
 * Rendered by Next.js streaming runtime while a route or page transitions.
 * Prevents layout shift using realistic structural skeleton cards.
 */

export default function Loading() {
  return (
    <div
      role="status"
      aria-label="Loading page content"
      aria-busy="true"
      className="p-6 space-y-6 max-w-7xl mx-auto w-full animate-in fade-in duration-150"
    >
      {/* Page Title & Breadcrumbs Skeleton */}
      <div className="space-y-2">
        <Skeleton variant="text" width="25%" height="1.75rem" />
        <Skeleton variant="text" width="45%" height="1rem" />
      </div>

      {/* Banner Skeleton */}
      <Skeleton variant="rectangular" height="8rem" className="rounded-2xl" />

      {/* Metrics Row Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Skeleton variant="rectangular" height="6.5rem" className="rounded-xl" />
        <Skeleton variant="rectangular" height="6.5rem" className="rounded-xl" />
        <Skeleton variant="rectangular" height="6.5rem" className="rounded-xl" />
        <Skeleton variant="rectangular" height="6.5rem" className="rounded-xl" />
      </div>

      {/* Table / Content Area Skeleton */}
      <div className="space-y-3 pt-2">
        <div className="flex justify-between items-center">
          <Skeleton variant="text" width="20%" height="1.25rem" />
          <Skeleton variant="rectangular" width="6rem" height="2rem" className="rounded-lg" />
        </div>
        <Skeleton variant="rectangular" height="16rem" className="rounded-xl" />
      </div>

      <span className="sr-only">Loading page content, please wait...</span>
    </div>
  );
}
