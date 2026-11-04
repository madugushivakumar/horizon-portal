"use client";

/**
 * Horizon Portal — Invoice Table Server-Side Pagination
 * src/components/finance/InvoicePagination.tsx
 *
 * Controls server-side pagination with matching count, current page, and accessible triggers.
 */

import React from "react";
import { Button } from "@/components/ui/button";
import { FinancePaginationMetadata } from "@/lib/finance/types";

export interface InvoicePaginationProps {
  pagination: FinancePaginationMetadata;
  onPageChange: (newPage: number) => void;
  isLoading: boolean;
}

export function InvoicePagination({
  pagination,
  onPageChange,
  isLoading,
}: InvoicePaginationProps) {
  const { page, pageSize, totalRecords, totalPages, hasNextPage, hasPreviousPage } = pagination;

  const startRecord = totalRecords === 0 ? 0 : (page - 1) * pageSize + 1;
  const endRecord = Math.min(page * pageSize, totalRecords);

  return (
    <div className="p-3.5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-zinc-500 dark:text-zinc-400">
      {/* Record Counter */}
      <div>
        <span>
          Showing{" "}
          <strong className="text-zinc-800 dark:text-zinc-200">
            {startRecord.toLocaleString("en-IN")}
          </strong>{" "}
          to{" "}
          <strong className="text-zinc-800 dark:text-zinc-200">
            {endRecord.toLocaleString("en-IN")}
          </strong>{" "}
          of{" "}
          <strong className="text-zinc-800 dark:text-zinc-200">
            {totalRecords.toLocaleString("en-IN")}
          </strong>{" "}
          invoices
        </span>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center gap-2 self-end sm:self-auto">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={!hasPreviousPage || isLoading}
          aria-label="Previous Page"
          className="text-xs disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </Button>

        <span className="px-2 font-mono text-zinc-600 dark:text-zinc-400 text-xs">
          Page <strong className="text-zinc-900 dark:text-zinc-100">{page}</strong> of{" "}
          <strong className="text-zinc-900 dark:text-zinc-100">{totalPages || 1}</strong>
        </span>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={!hasNextPage || isLoading}
          aria-label="Next Page"
          className="text-xs disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </Button>
      </div>
    </div>
  );
}
