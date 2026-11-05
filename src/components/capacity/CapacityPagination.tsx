"use client";

/**
 * Horizon Portal — Capacity Pagination Controls
 * src/components/capacity/CapacityPagination.tsx
 *
 * Server-backed page navigation for employee capacity listings:
 * - Previous / Next navigation buttons with bounds checks
 * - Current page and total page count indicator
 * - Record index range display (e.g. "Showing records 1 to 25 of 142")
 */

import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface CapacityPaginationProps {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  isLoading?: boolean;
  className?: string;
}

export const CapacityPagination: React.FC<CapacityPaginationProps> = ({
  page,
  pageSize,
  total,
  totalPages,
  onPageChange,
  isLoading = false,
  className,
}) => {
  if (total === 0) return null;

  const canGoPrevious = page > 1 && !isLoading;
  const canGoNext = page < totalPages && !isLoading;

  const startRecord = (page - 1) * pageSize + 1;
  const endRecord = Math.min(page * pageSize, total);

  return (
    <nav
      aria-label="Capacity dashboard pagination"
      className={cn(
        "flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-2",
        className
      )}
    >
      <div className="text-xs text-zinc-500 dark:text-zinc-400">
        Showing records{" "}
        <span className="font-semibold text-zinc-900 dark:text-zinc-100">
          {startRecord}
        </span>{" "}
        to{" "}
        <span className="font-semibold text-zinc-900 dark:text-zinc-100">
          {endRecord}
        </span>{" "}
        of{" "}
        <span className="font-semibold text-zinc-900 dark:text-zinc-100">
          {total.toLocaleString()}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-xs text-zinc-500 dark:text-zinc-400 mr-2">
          Page{" "}
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">
            {page}
          </span>{" "}
          of{" "}
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">
            {totalPages || 1}
          </span>
        </span>

        <Button
          variant="secondary"
          size="sm"
          disabled={!canGoPrevious}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
          leftIcon={
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          }
        >
          Previous
        </Button>

        <Button
          variant="secondary"
          size="sm"
          disabled={!canGoNext}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
          rightIcon={
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          }
        >
          Next
        </Button>
      </div>
    </nav>
  );
};
