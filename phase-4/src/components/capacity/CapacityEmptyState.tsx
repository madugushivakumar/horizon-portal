"use client";

/**
 * Horizon Portal — Capacity Empty State
 * src/components/capacity/CapacityEmptyState.tsx
 *
 * Renders when no employees or capacity records match the active filters.
 */

import React from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

export interface CapacityEmptyStateProps {
  onResetFilters?: () => void;
  className?: string;
}

export const CapacityEmptyState: React.FC<CapacityEmptyStateProps> = ({
  onResetFilters,
  className,
}) => {
  return (
    <EmptyState
      title="No Capacity Records Found"
      description="No employees or capacity assignments matched the selected sprint and team filters. Try choosing a different sprint or clearing your team filter."
      className={className}
      icon={
        <svg
          className="h-7 w-7 text-zinc-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
          />
        </svg>
      }
      action={
        onResetFilters && (
          <Button variant="secondary" size="sm" onClick={onResetFilters}>
            Reset Team Filter
          </Button>
        )
      }
    />
  );
};
