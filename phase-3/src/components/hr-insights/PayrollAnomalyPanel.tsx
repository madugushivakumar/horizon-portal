"use client";

/**
 * Horizon Portal — Payroll & Attendance Anomaly Panel
 * src/components/hr-insights/PayrollAnomalyPanel.tsx
 *
 * Ranked anomaly review stream:
 * - Category filter tabs: All, Payroll, Attendance
 * - Search filter (reason text, period, reason code)
 * - Deterministic API ranking preservation
 * - Pagination controls (10 items per page)
 * - Mandatory AI disclosure tag
 */

import React, { useState, useMemo } from "react";
import { PayrollAnomalyInsightsData } from "@/lib/hr-insights/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PayrollAnomalyCard } from "./PayrollAnomalyCard";
import { AIReviewLabel } from "./AIReviewLabel";
import { cn } from "@/lib/utils";

export interface PayrollAnomalyPanelProps {
  data: PayrollAnomalyInsightsData;
  className?: string;
}

export const PayrollAnomalyPanel: React.FC<PayrollAnomalyPanelProps> = ({
  data,
  className,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<"ALL" | "PAYROLL" | "ATTENDANCE">("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10;

  // Filter items by category and search term
  const filteredItems = useMemo(() => {
    let items = data.items;

    if (selectedCategory !== "ALL") {
      items = items.filter((item) => item.category === selectedCategory);
    }

    if (searchTerm.trim() !== "") {
      const q = searchTerm.toLowerCase();
      items = items.filter(
        (item) =>
          item.reasonText.toLowerCase().includes(q) ||
          item.reasonCode.toLowerCase().includes(q) ||
          item.period.toLowerCase().includes(q) ||
          item.employeeMask.toLowerCase().includes(q) ||
          (item.departmentName && item.departmentName.toLowerCase().includes(q))
      );
    }

    return items;
  }, [data.items, selectedCategory, searchTerm]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, currentPage, pageSize]);

  // Reset page when filter or search changes
  const handleCategoryChange = (cat: "ALL" | "PAYROLL" | "ATTENDANCE") => {
    setSelectedCategory(cat);
    setCurrentPage(1);
  };

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    setCurrentPage(1);
  };

  return (
    <Card
      elevation="raised"
      padding="md"
      className={cn("border border-zinc-200 dark:border-zinc-800 space-y-4", className)}
    >
      {/* Panel Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Payroll &amp; Attendance Anomaly Audit Stream
            </h3>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              {data.totalAnomalies} Flagged Records
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Statistical divergence from monthly historical baselines. Prioritized by monetary exposure and anomaly score.
          </p>
        </div>

        <AIReviewLabel size="sm" variant="badge" />
      </div>

      {/* Controls: Category Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        {/* Category Pills */}
        <div className="inline-flex rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800 text-xs font-medium self-start">
          <button
            type="button"
            onClick={() => handleCategoryChange("ALL")}
            className={cn(
              "px-3 py-1.5 rounded-md transition-all",
              selectedCategory === "ALL"
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs font-semibold"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
            )}
          >
            All Anomalies ({data.totalAnomalies})
          </button>
          <button
            type="button"
            onClick={() => handleCategoryChange("PAYROLL")}
            className={cn(
              "px-3 py-1.5 rounded-md transition-all",
              selectedCategory === "PAYROLL"
                ? "bg-white dark:bg-zinc-900 text-emerald-700 dark:text-emerald-400 shadow-xs font-semibold"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
            )}
          >
            Payroll ({data.totalPayrollAnomalies})
          </button>
          <button
            type="button"
            onClick={() => handleCategoryChange("ATTENDANCE")}
            className={cn(
              "px-3 py-1.5 rounded-md transition-all",
              selectedCategory === "ATTENDANCE"
                ? "bg-white dark:bg-zinc-900 text-blue-700 dark:text-blue-400 shadow-xs font-semibold"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
            )}
          >
            Attendance ({data.totalAttendanceAnomalies})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search reasons, periods, codes..."
            className="w-full h-8 pl-8 pr-3 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
          <svg
            className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      {/* Anomaly Cards List */}
      <div className="space-y-2.5 pt-1">
        {paginatedItems.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 p-8 text-center">
            <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              No anomalies found matching the current filter criteria.
            </p>
          </div>
        ) : (
          paginatedItems.map((item) => (
            <PayrollAnomalyCard key={item.id} item={item} />
          ))
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 text-xs text-zinc-500 dark:text-zinc-400">
          <div>
            Showing {(currentPage - 1) * pageSize + 1} to{" "}
            {Math.min(currentPage * pageSize, filteredItems.length)} of{" "}
            {filteredItems.length} filtered items
          </div>

          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              aria-label="Previous anomaly page"
            >
              Previous
            </Button>
            <span className="px-2 py-1 text-xs font-medium">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              aria-label="Next anomaly page"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};
