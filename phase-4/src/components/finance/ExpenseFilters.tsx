"use client";

/**
 * Horizon Portal — Expense Register Filter & Search Bar
 * src/components/finance/ExpenseFilters.tsx
 *
 * Implements search with clear action, status filter (PAID / UNPAID),
 * category account code filter, expense date range selection with inline validation,
 * active filter chips, and CSV export trigger.
 */

import React from "react";
import { ExpenseFilterState } from "@/lib/finance/types";
import { EXPENSE_CATEGORY_MAP } from "@/lib/finance/formatting";
import { ExpenseExportButton } from "./ExpenseExportButton";

export interface ExpenseFiltersProps {
  filters: ExpenseFilterState;
  searchInput: string;
  onSearchInputChange: (val: string) => void;
  onClearSearch: () => void;
  onFilterChange: (key: keyof ExpenseFilterState, value: string) => void;
  onResetFilters: () => void;
  isLoading: boolean;
  totalRecords: number;
  dateRangeError: string | null;
}

export function ExpenseFilters({
  filters,
  searchInput,
  onSearchInputChange,
  onClearSearch,
  onFilterChange,
  onResetFilters,
  isLoading,
  totalRecords,
  dateRangeError,
}: ExpenseFiltersProps) {
  // Determine if any non-default filter is applied
  const hasActiveFilters =
    Boolean(filters.search.trim()) ||
    filters.status !== "ALL" ||
    filters.category !== "ALL" ||
    Boolean(filters.from) ||
    Boolean(filters.to);

  return (
    <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/60 space-y-3">
      {/* ── Top Row: Search & Dropdown Filters + Export Button ────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          {/* 1. Search input */}
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => onSearchInputChange(e.target.value)}
              placeholder="Search by vendor, reference, description..."
              aria-label="Search expenses by vendor, bill reference, or description"
              className="w-full text-xs px-3 py-2 pl-8 pr-7 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
            {/* Search Glass Icon */}
            <svg
              className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-zinc-400 pointer-events-none"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>

            {/* Clear Search Button or Search Spinner */}
            {isLoading && searchInput.trim() !== "" ? (
              <div className="absolute right-2.5 top-2.5">
                <svg
                  className="w-3.5 h-3.5 animate-spin text-indigo-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </div>
            ) : (
              searchInput && (
                <button
                  type="button"
                  onClick={onClearSearch}
                  className="absolute right-2 top-2 p-0.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                  aria-label="Clear search query"
                  title="Clear search"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )
            )}
          </div>

          {/* 2. Status Select (ALL, PAID, UNPAID) */}
          <select
            value={filters.status}
            onChange={(e) => onFilterChange("status", e.target.value)}
            aria-label="Filter by expense payment status"
            className="text-xs px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="PAID">Paid</option>
            <option value="UNPAID">Unpaid</option>
          </select>

          {/* 3. Category Select */}
          <select
            value={filters.category}
            onChange={(e) => onFilterChange("category", e.target.value)}
            aria-label="Filter by expense category account"
            className="text-xs px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer max-w-[200px]"
          >
            <option value="ALL">All Categories</option>
            {Object.entries(EXPENSE_CATEGORY_MAP).map(([code, name]) => (
              <option key={code} value={code}>
                {code} · {name}
              </option>
            ))}
          </select>

          {/* 4. Date Range Inputs */}
          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-zinc-400">From:</span>
              <input
                type="date"
                value={filters.from}
                onChange={(e) => onFilterChange("from", e.target.value)}
                aria-label="Filter from expense date"
                className="text-xs px-2.5 py-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-zinc-400">To:</span>
              <input
                type="date"
                value={filters.to}
                onChange={(e) => onFilterChange("to", e.target.value)}
                aria-label="Filter to expense date"
                className="text-xs px-2.5 py-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* 5. CSV Export Trigger */}
        <div className="shrink-0">
          <ExpenseExportButton
            filters={filters}
            totalRecords={totalRecords}
          />
        </div>
      </div>

      {/* ── Date Range Validation Error Notification ─────────────────────── */}
      {dateRangeError && (
        <div
          role="alert"
          className="flex items-center gap-2 p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-700 dark:text-rose-300"
        >
          <svg className="w-4 h-4 shrink-0 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{dateRangeError}</span>
        </div>
      )}

      {/* ── Bottom Row: Active Filter Pills & Reset Action ───────────────── */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-zinc-200/60 dark:border-zinc-800/60 text-xs">
          <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
            Active Filters:
          </span>

          {/* Search Chip */}
          {filters.search && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-[11px]">
              Search: &ldquo;{filters.search}&rdquo;
              <button
                type="button"
                onClick={onClearSearch}
                className="hover:text-indigo-900 dark:hover:text-indigo-100 cursor-pointer"
                aria-label="Remove search filter"
              >
                ×
              </button>
            </span>
          )}

          {/* Status Chip */}
          {filters.status !== "ALL" && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 text-[11px]">
              Status: {filters.status}
              <button
                type="button"
                onClick={() => onFilterChange("status", "ALL")}
                className="hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer"
                aria-label="Remove status filter"
              >
                ×
              </button>
            </span>
          )}

          {/* Category Chip */}
          {filters.category !== "ALL" && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-[11px]">
              Category: {EXPENSE_CATEGORY_MAP[Number(filters.category)] || filters.category}
              <button
                type="button"
                onClick={() => onFilterChange("category", "ALL")}
                className="hover:text-purple-900 dark:hover:text-purple-100 cursor-pointer"
                aria-label="Remove category filter"
              >
                ×
              </button>
            </span>
          )}

          {/* Date Range Chip */}
          {(filters.from || filters.to) && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 text-[11px]">
              Date: {filters.from || "Any"} → {filters.to || "Any"}
              <button
                type="button"
                onClick={() => {
                  onFilterChange("from", "");
                  onFilterChange("to", "");
                }}
                className="hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer"
                aria-label="Remove date range filter"
              >
                ×
              </button>
            </span>
          )}

          {/* Clear All Trigger */}
          <button
            type="button"
            onClick={onResetFilters}
            className="text-[11px] h-6 px-2 text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors font-medium cursor-pointer"
          >
            Clear All
          </button>
        </div>
      )}
    </div>
  );
}
