"use client";

/**
 * Horizon Portal — Admin Invoices CSV Export Action Button
 * src/components/finance/InvoiceExportButton.tsx
 *
 * Initiates an unpaginated bulk CSV download from:
 * GET /api/v1/admin/finance/export/invoices
 *
 * Features:
 * - Passes all currently selected filters (search, status, ageing, open, date range, reportingDate)
 * - Retains browser session cookie authentication without token exposure
 * - Displays active loading spinner and progress state
 * - Provides user-friendly error feedback if export fails
 * - Automatically derives attachment filename from Content-Disposition header
 */

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { InvoiceFilterState } from "@/lib/finance/types";

export interface InvoiceExportButtonProps {
  filters: InvoiceFilterState;
  reportingDate?: string;
  totalRecords: number;
}

export function InvoiceExportButton({
  filters,
  reportingDate,
  totalRecords,
}: InvoiceExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const handleExport = async () => {
    if (isExporting || totalRecords === 0) return;

    try {
      setIsExporting(true);
      setExportError(null);

      const params = new URLSearchParams();

      if (filters.search && filters.search.trim() !== "") {
        params.set("search", filters.search.trim());
      }
      if (filters.status && filters.status !== "ALL") {
        params.set("status", filters.status);
      }
      if (filters.ageing && filters.ageing !== "ALL") {
        params.set("ageing", filters.ageing);
      }
      if (filters.open && filters.open !== "ALL") {
        params.set("open", filters.open);
      }
      if (filters.from && filters.from.trim() !== "") {
        params.set("from", filters.from.trim());
      }
      if (filters.to && filters.to.trim() !== "") {
        params.set("to", filters.to.trim());
      }
      if (reportingDate && reportingDate.trim() !== "") {
        params.set("reportingDate", reportingDate.trim());
      }

      const queryString = params.toString();
      const exportUrl = `/api/v1/admin/finance/export/invoices${queryString ? `?${queryString}` : ""}`;

      const res = await fetch(exportUrl, {
        method: "GET",
        headers: {
          Accept: "text/csv",
        },
      });

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("Session expired. Please sign in again to export data.");
        }
        if (res.status === 403) {
          throw new Error("Access restricted: Administrator role required for CSV export.");
        }
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Export failed with status HTTP ${res.status}`);
      }

      // Extract filename from Content-Disposition header if available
      const disposition = res.headers.get("content-disposition");
      let filename = `finance-invoices-${reportingDate || new Date().toISOString().split("T")[0]}.csv`;
      if (disposition && disposition.includes("filename=")) {
        const match = disposition.match(/filename="?([^"]+)"?/);
        if (match && match[1]) {
          filename = match[1];
        }
      }

      // Download blob via temporary DOM anchor
      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err: any) {
      console.error("Invoices CSV export error:", err);
      setExportError(err.message || "Failed to download invoices CSV.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="relative inline-flex flex-col items-end">
      <Button
        variant="secondary"
        size="sm"
        onClick={handleExport}
        disabled={isExporting || totalRecords === 0}
        aria-label="Export matching invoices to CSV"
        title={
          totalRecords === 0
            ? "No invoices match the current filters to export"
            : `Export all ${totalRecords.toLocaleString("en-IN")} matching invoices to CSV`
        }
        className={`flex items-center gap-1.5 text-xs font-medium transition-all ${
          totalRecords === 0 ? "opacity-60 cursor-not-allowed" : "hover:border-zinc-400 dark:hover:border-zinc-600"
        }`}
      >
        {isExporting ? (
          <>
            <svg
              className="w-3.5 h-3.5 animate-spin text-indigo-600 dark:text-indigo-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span>Exporting...</span>
          </>
        ) : (
          <>
            <svg
              className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <span>Export CSV</span>
          </>
        )}
      </Button>

      {/* Floating Error Notification */}
      {exportError && (
        <div
          role="alert"
          className="absolute right-0 top-full mt-1.5 z-20 w-72 p-2.5 rounded-xl border border-rose-300 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/80 shadow-lg text-[11px] text-rose-800 dark:text-rose-200 flex items-start gap-2 animate-in fade-in slide-in-from-top-1"
        >
          <svg className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex-1">
            <p className="font-semibold">Export Failed</p>
            <p className="text-[10px] text-rose-700 dark:text-rose-300">{exportError}</p>
          </div>
          <button
            type="button"
            onClick={() => setExportError(null)}
            className="text-rose-500 hover:text-rose-700 text-xs font-bold px-1"
            aria-label="Dismiss error"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
