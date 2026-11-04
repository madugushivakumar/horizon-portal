"use client";

/**
 * Horizon Portal — Admin Expenses Table
 * src/components/finance/ExpenseTable.tsx
 *
 * Renders the canonical fields for company expenditures:
 * 1. Date (expenseDate)
 * 2. Bill Reference (billReference)
 * 3. Vendor (vendorName)
 * 4. Category (categoryAccount formatted)
 * 5. Department (departmentName)
 * 6. Description (description)
 * 7. Due Date (dueDate)
 * 8. Amount (totalAmount formatted via formatINR)
 * 9. Status (PAID / UNPAID badge)
 *
 * Features:
 * - Responsive horizontal scrolling on small viewports
 * - Accessible table markup with semantic thead, tbody, th, and td
 * - Indian Rupee (INR) currency formatting
 * - Contextual badges for PAID (success) and UNPAID (warning) statuses
 * - Visual distinction for unpaid expenditures without misleading colors
 * - Clean "—" fallback for any missing optional data
 * - Empty state with clear-filters action when no records match
 */

import React from "react";
import { Badge, BadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatINR, formatExpenseCategory, formatStatusLabel } from "@/lib/finance/formatting";
import { EnrichedExpenseItem, ExpenseFilterState } from "@/lib/finance/types";

export interface ExpenseTableProps {
  items: EnrichedExpenseItem[];
  isLoading: boolean;
  filters: ExpenseFilterState;
  onResetFilters: () => void;
}

/**
 * Maps expense payment status to Design System Badge variants.
 */
function getExpenseStatusBadgeVariant(status: string): BadgeVariant {
  switch (status.toUpperCase().trim()) {
    case "PAID":
      return "success";
    case "UNPAID":
      return "warning";
    default:
      return "default";
  }
}

export function ExpenseTable({
  items,
  isLoading,
  filters,
  onResetFilters,
}: ExpenseTableProps) {
  // Check if any filters are currently active to customize empty-state messaging
  const hasActiveFilters =
    Boolean(filters.search.trim()) ||
    filters.status !== "ALL" ||
    filters.category !== "ALL" ||
    Boolean(filters.from) ||
    Boolean(filters.to);

  return (
    <div className="overflow-x-auto">
      <table
        className="w-full text-left text-xs text-zinc-600 dark:text-zinc-400 border-collapse"
        aria-label="Vendor Expenses Register"
      >
        <thead className="bg-zinc-100/70 dark:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300 font-semibold uppercase tracking-wider text-[11px] border-b border-zinc-200 dark:border-zinc-800">
          <tr>
            <th scope="col" className="px-4 py-3 min-w-[100px]">
              Expense Date
            </th>
            <th scope="col" className="px-4 py-3 min-w-[130px]">
              Bill Reference
            </th>
            <th scope="col" className="px-4 py-3 min-w-[150px]">
              Vendor
            </th>
            <th scope="col" className="px-4 py-3 min-w-[160px]">
              Category
            </th>
            <th scope="col" className="px-4 py-3 min-w-[120px]">
              Department
            </th>
            <th scope="col" className="px-4 py-3 min-w-[180px]">
              Description
            </th>
            <th scope="col" className="px-4 py-3 min-w-[100px]">
              Due Date
            </th>
            <th scope="col" className="px-4 py-3 text-right min-w-[110px]">
              Total Amount
            </th>
            <th scope="col" className="px-4 py-3 text-center min-w-[90px]">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {items.length === 0 ? (
            <tr>
              <td colSpan={9} className="px-6 py-12 text-center text-zinc-400">
                <div className="max-w-md mx-auto space-y-3">
                  <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400 mx-auto flex items-center justify-center">
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                      {hasActiveFilters
                        ? "No expenses match the selected filters"
                        : "No expense records found"}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {hasActiveFilters
                        ? "Try clearing your search query or broadening the filter parameters."
                        : "There are currently no company expense records recorded in the system."}
                    </p>
                  </div>
                  {hasActiveFilters && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={onResetFilters}
                      className="text-xs mt-2"
                    >
                      Clear All Filters
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ) : (
            items.map((exp) => {
              const isUnpaid = exp.status === "UNPAID";

              return (
                <tr
                  key={exp.id}
                  className={`hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors ${
                    isUnpaid ? "bg-amber-50/20 dark:bg-amber-950/10" : ""
                  }`}
                >
                  {/* 1. Expense Date */}
                  <td className="px-4 py-3 font-mono text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                    {exp.expenseDate}
                  </td>

                  {/* 2. Bill Reference */}
                  <td className="px-4 py-3 font-mono font-medium text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      {isUnpaid && (
                        <span
                          className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"
                          title="Unpaid Expense"
                          aria-label="Unpaid Expense"
                        />
                      )}
                      <span>{exp.billReference || "—"}</span>
                    </div>
                  </td>

                  {/* 3. Vendor */}
                  <td className="px-4 py-3 font-medium text-zinc-800 dark:text-zinc-200">
                    <span className="truncate max-w-[180px] block" title={exp.vendorName}>
                      {exp.vendorName}
                    </span>
                  </td>

                  {/* 4. Category */}
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                    <span
                      className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-[11px] font-mono text-zinc-700 dark:text-zinc-300"
                      title={`Account Code: ${exp.categoryAccount}`}
                    >
                      {formatExpenseCategory(exp.categoryAccount)}
                    </span>
                  </td>

                  {/* 5. Department */}
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                    {exp.departmentName || "—"}
                  </td>

                  {/* 6. Description */}
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    <span
                      className="truncate max-w-[220px] block"
                      title={exp.description}
                    >
                      {exp.description || "—"}
                    </span>
                  </td>

                  {/* 7. Due Date */}
                  <td className="px-4 py-3 font-mono text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                    <span className={isUnpaid ? "text-amber-600 dark:text-amber-400 font-semibold" : ""}>
                      {exp.dueDate}
                    </span>
                  </td>

                  {/* 8. Total Amount */}
                  <td className="px-4 py-3 font-mono text-right text-zinc-800 dark:text-zinc-200 whitespace-nowrap">
                    <span className="font-semibold">
                      {formatINR(exp.totalAmount)}
                    </span>
                  </td>

                  {/* 9. Payment Status Badge */}
                  <td className="px-4 py-3 text-center whitespace-nowrap">
                    <Badge variant={getExpenseStatusBadgeVariant(exp.status)} size="sm">
                      {formatStatusLabel(exp.status)}
                    </Badge>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
