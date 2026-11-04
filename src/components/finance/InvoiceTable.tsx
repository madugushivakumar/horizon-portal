"use client";

/**
 * Horizon Portal — Client Invoices Table
 * src/components/finance/InvoiceTable.tsx
 *
 * Renders the 9 canonical columns for client invoices:
 * 1. Invoice Number
 * 2. Client Name
 * 3. Invoice Date
 * 4. Due Date
 * 5. Total Amount
 * 6. Amount Paid
 * 7. Balance Due
 * 8. Status
 * 9. Ageing (with "—" for closed records)
 *
 * Features:
 * - Responsive horizontal scrolling on small viewports
 * - Accessible table markup with semantic thead, tbody, th, and td
 * - Indian Rupee (INR) currency formatting
 * - Contextual badges for invoice statuses and dynamic ageing categories
 * - Visual distinction for overdue and open invoices without deceptive colors
 * - Empty state with clear-filters action when no records match
 */

import React from "react";
import { Badge, BadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatINR, formatStatusLabel } from "@/lib/finance/formatting";
import { EnrichedInvoiceItem, InvoiceFilterState } from "@/lib/finance/types";

export interface InvoiceTableProps {
  items: EnrichedInvoiceItem[];
  isLoading: boolean;
  filters: InvoiceFilterState;
  onResetFilters: () => void;
}

/**
 * Maps invoice operational and ledger statuses to Design System Badge variants.
 */
function getStatusBadgeVariant(status: string): BadgeVariant {
  switch (status.toUpperCase().trim()) {
    case "PAID":
      return "success";
    case "SENT":
      return "info";
    case "PARTIALLY_PAID":
      return "warning";
    case "OVERDUE":
      return "danger";
    case "DRAFT":
      return "secondary";
    case "CANCELLED":
    default:
      return "default";
  }
}

/**
 * Maps dynamic ageing buckets to Design System Badge variants.
 */
function getAgeingBadgeVariant(bucket: string | null): BadgeVariant {
  switch (bucket) {
    case "NOT_OVERDUE":
      return "secondary";
    case "0_30":
    case "31_60":
      return "warning";
    case "61_90":
    case "90_PLUS":
      return "danger";
    default:
      return "default";
  }
}

export function InvoiceTable({
  items,
  isLoading,
  filters,
  onResetFilters,
}: InvoiceTableProps) {
  // Check if any filters are currently active to customize empty-state messaging
  const hasActiveFilters =
    Boolean(filters.search.trim()) ||
    filters.status !== "ALL" ||
    filters.ageing !== "ALL" ||
    filters.open !== "ALL" ||
    Boolean(filters.from) ||
    Boolean(filters.to);

  return (
    <div className="overflow-x-auto">
      <table
        className="w-full text-left text-xs text-zinc-600 dark:text-zinc-400 border-collapse"
        aria-label="Client Invoices Register"
      >
        <thead className="bg-zinc-100/70 dark:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300 font-semibold uppercase tracking-wider text-[11px] border-b border-zinc-200 dark:border-zinc-800">
          <tr>
            <th scope="col" className="px-4 py-3 min-w-[120px]">
              Invoice #
            </th>
            <th scope="col" className="px-4 py-3 min-w-[160px]">
              Client Name
            </th>
            <th scope="col" className="px-4 py-3 min-w-[100px]">
              Invoice Date
            </th>
            <th scope="col" className="px-4 py-3 min-w-[100px]">
              Due Date
            </th>
            <th scope="col" className="px-4 py-3 text-right min-w-[110px]">
              Total Amount
            </th>
            <th scope="col" className="px-4 py-3 text-right min-w-[110px]">
              Amount Paid
            </th>
            <th scope="col" className="px-4 py-3 text-right min-w-[110px]">
              Balance Due
            </th>
            <th scope="col" className="px-4 py-3 text-center min-w-[100px]">
              Status
            </th>
            <th scope="col" className="px-4 py-3 text-center min-w-[110px]">
              Ageing
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
                        ? "No invoices match the selected filters"
                        : "No invoice records found"}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {hasActiveFilters
                        ? "Try clearing your search query or broadening the filter parameters."
                        : "There are currently no invoice records recorded in the system."}
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
            items.map((inv) => {
              const isOverdue = inv.status === "OVERDUE" || (inv.isOpen && (inv.daysOverdue ?? 0) > 0);
              const isCancelled = inv.status === "CANCELLED";

              return (
                <tr
                  key={inv.id}
                  className={`hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors ${
                    inv.status === "OVERDUE"
                      ? "bg-rose-50/20 dark:bg-rose-950/10"
                      : isCancelled
                      ? "opacity-60 bg-zinc-50/40 dark:bg-zinc-900/30"
                      : ""
                  }`}
                >
                  {/* 1. Invoice Number */}
                  <td className="px-4 py-3 font-mono font-medium text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      {inv.status === "OVERDUE" && (
                        <span
                          className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"
                          title="Overdue Invoice"
                          aria-label="Overdue Invoice"
                        />
                      )}
                      <span>{inv.invoiceNumber}</span>
                    </div>
                  </td>

                  {/* 2. Client Name */}
                  <td className="px-4 py-3 font-medium text-zinc-800 dark:text-zinc-200">
                    <span className="truncate max-w-[200px] block" title={inv.clientName}>
                      {inv.clientName}
                    </span>
                  </td>

                  {/* 3. Invoice Date */}
                  <td className="px-4 py-3 font-mono text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                    {inv.invoiceDate}
                  </td>

                  {/* 4. Due Date */}
                  <td className="px-4 py-3 font-mono text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                    <span
                      className={
                        isOverdue && inv.isOpen
                          ? "text-rose-600 dark:text-rose-400 font-semibold"
                          : ""
                      }
                    >
                      {inv.dueDate}
                    </span>
                  </td>

                  {/* 5. Total Amount */}
                  <td className="px-4 py-3 font-mono text-right text-zinc-800 dark:text-zinc-200 whitespace-nowrap">
                    {formatINR(inv.totalAmount)}
                  </td>

                  {/* 6. Amount Paid */}
                  <td className="px-4 py-3 font-mono text-right text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                    <span className={inv.amountPaid > 0 ? "text-emerald-600 dark:text-emerald-400 font-medium" : ""}>
                      {formatINR(inv.amountPaid)}
                    </span>
                  </td>

                  {/* 7. Balance Due */}
                  <td className="px-4 py-3 font-mono text-right whitespace-nowrap">
                    <span
                      className={`font-semibold ${
                        inv.balanceDue > 0
                          ? isOverdue
                            ? "text-rose-600 dark:text-rose-400"
                            : "text-amber-600 dark:text-amber-400"
                          : "text-zinc-500 dark:text-zinc-400"
                      }`}
                    >
                      {formatINR(inv.balanceDue)}
                    </span>
                  </td>

                  {/* 8. Invoice Status Badge */}
                  <td className="px-4 py-3 text-center whitespace-nowrap">
                    <Badge variant={getStatusBadgeVariant(inv.status)} size="sm">
                      {formatStatusLabel(inv.status)}
                    </Badge>
                  </td>

                  {/* 9. Ageing Bucket (Em-dash "—" for closed/non-operational) */}
                  <td className="px-4 py-3 text-center whitespace-nowrap">
                    {inv.isOpen && inv.ageingBucket ? (
                      <Badge variant={getAgeingBadgeVariant(inv.ageingBucket)} size="sm">
                        {inv.ageingLabel || inv.ageingBucket}
                      </Badge>
                    ) : (
                      <span
                        className="text-zinc-400 dark:text-zinc-600 font-mono text-center inline-block"
                        title="Not applicable for closed or non-operational invoices"
                      >
                        —
                      </span>
                    )}
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
