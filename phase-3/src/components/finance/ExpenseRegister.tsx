"use client";

/**
 * Horizon Portal — Interactive Vendor Expenses Register
 * src/components/finance/ExpenseRegister.tsx
 *
 * Section 4 of the Admin Finance Snapshot Dashboard:
 * - Searchable by vendor name, bill reference, and description with 300ms debouncing and race-condition prevention
 * - Filterable by payment status (PAID / UNPAID), category account code, and expense date range
 * - Validated date range handling preventing inverted range submissions
 * - Server-side paginated table with 20 items per page
 * - Unpaginated CSV export consuming matching query filters
 * - Strictly read-only presentation without CRUD or mutation capabilities
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  EnrichedExpenseItem,
  FinancePaginationMetadata,
  ExpenseFilterState,
  ExpenseListResponse,
} from "@/lib/finance/types";
import { ExpenseFilters } from "./ExpenseFilters";
import { ExpensePagination } from "./ExpensePagination";
import { ExpenseTable } from "./ExpenseTable";
import { ExpenseTableSkeleton } from "./ExpenseTableSkeleton";

const DEFAULT_FILTERS: ExpenseFilterState = {
  search: "",
  status: "ALL",
  category: "ALL",
  from: "",
  to: "",
};

const DEFAULT_PAGINATION: FinancePaginationMetadata = {
  page: 1,
  pageSize: 20,
  totalRecords: 0,
  totalPages: 1,
  hasNextPage: false,
  hasPreviousPage: false,
};

export function ExpenseRegister() {
  // Query & Filter States
  const [filters, setFilters] = useState<ExpenseFilterState>(DEFAULT_FILTERS);
  const [searchInput, setSearchInput] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [dateRangeError, setDateRangeError] = useState<string | null>(null);

  // Data & Pagination States
  const [items, setItems] = useState<EnrichedExpenseItem[]>([]);
  const [pagination, setPagination] = useState<FinancePaginationMetadata>(DEFAULT_PAGINATION);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);

  // Request counter ref for race condition avoidance
  const requestIdRef = useRef<number>(0);

  // 1. Debounce Search Input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setFilters((prev) => ({ ...prev, search: searchInput }));
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // 2. Fetch Expenses Function
  const fetchExpenses = useCallback(
    async (pageToFetch: number) => {
      // Validate date range before dispatching
      if (filters.from && filters.to && filters.from > filters.to) {
        setDateRangeError(`Invalid range: 'From' date (${filters.from}) cannot be after 'To' date (${filters.to}).`);
        setIsLoading(false);
        return;
      }
      setDateRangeError(null);

      const currentReqId = ++requestIdRef.current;
      setIsLoading(true);
      setError(null);
      setErrorStatus(null);

      try {
        const params = new URLSearchParams();
        params.set("page", String(pageToFetch));
        params.set("pageSize", String(DEFAULT_PAGINATION.pageSize));

        if (debouncedSearch && debouncedSearch.trim() !== "") {
          params.set("search", debouncedSearch.trim());
        }
        if (filters.status && filters.status !== "ALL") {
          params.set("status", filters.status);
        }
        if (filters.category && filters.category !== "ALL") {
          params.set("category", filters.category);
        }
        if (filters.from && filters.from.trim() !== "") {
          params.set("from", filters.from.trim());
        }
        if (filters.to && filters.to.trim() !== "") {
          params.set("to", filters.to.trim());
        }

        const res = await fetch(`/api/v1/admin/finance/expenses?${params.toString()}`, {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        });

        // Drop stale response if a newer request was dispatched
        if (currentReqId !== requestIdRef.current) {
          return;
        }

        if (!res.ok) {
          setErrorStatus(res.status);
          if (res.status === 401) {
            throw new Error("Your session has expired. Please sign in again.");
          }
          if (res.status === 403) {
            throw new Error("Access Restricted: Administrator privileges are strictly required to view expenses.");
          }
          const errJson = await res.json().catch(() => ({}));
          throw new Error(errJson.error || `Failed to fetch expenses: HTTP ${res.status}`);
        }

        const json: ExpenseListResponse = await res.json();
        if (!json.success || !json.data) {
          throw new Error("Malformed API response: Expense payload is missing.");
        }

        setItems(json.data.items || []);
        setPagination(json.data.pagination || DEFAULT_PAGINATION);
      } catch (err: any) {
        if (currentReqId === requestIdRef.current) {
          console.error("Fetch expenses error:", err);
          setError(err.message || "Failed to retrieve expense records.");
        }
      } finally {
        if (currentReqId === requestIdRef.current) {
          setIsLoading(false);
        }
      }
    },
    [debouncedSearch, filters.status, filters.category, filters.from, filters.to]
  );

  // 3. Trigger fetch whenever filters, debounced search, or page changes
  useEffect(() => {
    fetchExpenses(pagination.page);
  }, [fetchExpenses, pagination.page]);

  // 4. Filter Handlers
  const handleFilterChange = (key: keyof ExpenseFilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setDebouncedSearch("");
    setFilters((prev) => ({ ...prev, search: "" }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleResetFilters = () => {
    setSearchInput("");
    setDebouncedSearch("");
    setFilters(DEFAULT_FILTERS);
    setDateRangeError(null);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  return (
    <section aria-labelledby="section-expenses-heading" className="space-y-4">
      {/* ── Section Title & Description ───────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2
            id="section-expenses-heading"
            className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight"
          >
            Vendor Expenses
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Paginated register of company expenditures, vendor accounts, and payment statuses with bulk CSV export.
          </p>
        </div>
        <span className="text-[11px] font-mono text-zinc-400 self-start sm:self-auto">
          Section 4 of 4
        </span>
      </div>

      {/* ── Main Expenses Card ────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs overflow-hidden">
        {/* Filter & Search Toolbar */}
        <ExpenseFilters
          filters={filters}
          searchInput={searchInput}
          onSearchInputChange={setSearchInput}
          onClearSearch={handleClearSearch}
          onFilterChange={handleFilterChange}
          onResetFilters={handleResetFilters}
          isLoading={isLoading}
          totalRecords={pagination.totalRecords}
          dateRangeError={dateRangeError}
        />

        {/* Error State Banner */}
        {error ? (
          <div className="p-8 text-center" role="alert">
            <div className="max-w-md mx-auto space-y-3">
              <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center text-lg font-bold">
                !
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {errorStatus === 401
                    ? "Session Expired"
                    : errorStatus === 403
                    ? "Access Restricted (403 Forbidden)"
                    : "Unable to Load Expenses"}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">{error}</p>
              </div>
              <div className="pt-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => fetchExpenses(pagination.page)}
                  className="text-xs"
                >
                  Retry
                </Button>
              </div>
            </div>
          </div>
        ) : isLoading ? (
          /* Table Skeleton while fetching */
          <ExpenseTableSkeleton rowCount={6} />
        ) : (
          /* Data Table */
          <ExpenseTable
            items={items}
            isLoading={isLoading}
            filters={filters}
            onResetFilters={handleResetFilters}
          />
        )}

        {/* Server-Side Pagination Footer (only when not in error state) */}
        {!error && (
          <ExpensePagination
            pagination={pagination}
            onPageChange={handlePageChange}
            isLoading={isLoading}
          />
        )}
      </div>
    </section>
  );
}
