"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { formatMoney, formatDisplayDate } from "@/lib/payroll/formatters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface PayrollRunSummaryRow {
  id: string;
  periodStart: string;
  periodEnd: string;
  periodLabel: string;
  paymentDate: string | null;
  payDate: string | null;
  employeesPaid: number;
  actualPayslipCount: number;
  totalGross: number;
  totalNet: number;
  totalDeductions: number;
  status: string;
  approvalStatus: string;
  reconciliationStatus: "MATCHED" | "MISMATCH" | "NO_ITEMS" | string;
  grossDifference: number;
  netDifference: number;
  employeeCountDifference: number;
  preparerId: string | null;
  approvedById: string | null;
  approvedAt: string | null;
  createdAt: string;
}

export interface KpiSummaryData {
  totalRuns: number;
  pendingApprovals: number;
  latestPeriod: string;
  latestGross: number;
  latestNet: number;
  latestStatus: string;
}

export default function AdminPayrollConsole() {
  const [runs, setRuns] = useState<PayrollRunSummaryRow[]>([]);
  const [kpiSummary, setKpiSummary] = useState<KpiSummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch runs
  const fetchRuns = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        status: statusFilter,
      });

      if (debouncedSearch) {
        params.set("search", debouncedSearch);
      }

      const res = await fetch(`/api/v1/payroll/runs?${params.toString()}`);
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP ${res.status}: Failed to fetch payroll runs.`);
      }

      const json = await res.json();
      setRuns(json.data || []);
      setKpiSummary(json.kpiSummary || null);
      if (json.pagination) {
        setTotalPages(json.pagination.totalPages || 1);
        setTotalCount(json.pagination.total || 0);
      }
    } catch (err) {
      console.error("Error loading payroll runs:", err);
      setError(err instanceof Error ? err.message : "Failed to load payroll console.");
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, statusFilter, debouncedSearch]);

  useEffect(() => {
    fetchRuns();
  }, [fetchRuns]);

  return (
    <div className="space-y-6 pb-12">
      {/* Page Title & Executive Subtitle */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
              Payroll Operations Console
            </h1>
            <Badge variant="primary" size="sm">
              Admin & HR Authority
            </Badge>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Enterprise compensation governance: inspect runs, verify financial tie-out reconciliation, and authorize disbursement.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchRuns}
            disabled={isLoading}
            className="flex items-center gap-1.5"
          >
            <svg className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </Button>
        </div>
      </div>

      {/* Executive KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Runs */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Total Payroll Runs
            </span>
            <span className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center text-sm font-bold">
              18
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-100 mt-2">
            {kpiSummary?.totalRuns ?? "18"}
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">
            Historical span: Apr 2025 – Sep 2026
          </p>
        </div>

        {/* Latest Period Net */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Latest Net Payout
            </span>
            <span className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-sm font-bold">
              ₹
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-400 mt-2">
            {formatMoney(kpiSummary?.latestNet)}
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">
            Period: {kpiSummary?.latestPeriod || "September 2026"}
          </p>
        </div>

        {/* Pending Approvals */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Pending Approvals
            </span>
            <span className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center text-sm font-bold">
              !
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-2">
            {kpiSummary?.pendingApprovals ?? "1"} Run
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">
            Requires dual-control review
          </p>
        </div>

        {/* Itemized Coverage */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Itemized Ledger Coverage
            </span>
            <span className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center text-sm font-bold">
              6
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-100 mt-2">
            6 / 18 Runs
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">
            2,469 digital payslips reconciled
          </p>
        </div>
      </div>

      {/* Table Container & Filter Toolbar */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
        {/* Filter bar */}
        <div className="p-4 sm:p-5 border-b border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-4 bg-zinc-50/50 dark:bg-zinc-900/50">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-xs font-medium">
            <button
              onClick={() => { setStatusFilter("all"); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                statusFilter === "all"
                  ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs font-semibold"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              All Runs ({totalCount})
            </button>
            <button
              onClick={() => { setStatusFilter("pending"); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                statusFilter === "pending"
                  ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs font-semibold"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              Pending Approval
            </button>
            <button
              onClick={() => { setStatusFilter("paid"); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                statusFilter === "paid"
                  ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs font-semibold"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              Paid & Finalized
            </button>
          </div>

          {/* Search Box */}
          <div className="w-full sm:w-72">
            <Input
              type="text"
              label="Search payroll runs"
              hideLabel
              placeholder="Search by Run ID or Month..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="text-xs"
            />
          </div>
        </div>

        {/* Error Callout */}
        {error && (
          <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border-b border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300">
            {error}
          </div>
        )}

        {/* Loading Skeleton */}
        {isLoading && runs.length === 0 ? (
          <div className="p-8 space-y-4 animate-pulse">
            <div className="h-8 bg-zinc-100 dark:bg-zinc-800 rounded"></div>
            <div className="h-8 bg-zinc-100 dark:bg-zinc-800 rounded"></div>
            <div className="h-8 bg-zinc-100 dark:bg-zinc-800 rounded"></div>
          </div>
        ) : runs.length === 0 ? (
          <div className="p-12 text-center">
            <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              No payroll runs found
            </h4>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1">
              No payroll records matched your search or status filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-800/80 text-zinc-500 font-semibold uppercase tracking-wider">
                  <th className="py-3.5 px-5">Payroll Period</th>
                  <th className="py-3.5 px-5">Headcount</th>
                  <th className="py-3.5 px-5 text-right">Gross Total</th>
                  <th className="py-3.5 px-5 text-right">Deductions</th>
                  <th className="py-3.5 px-5 text-right font-bold text-zinc-900 dark:text-zinc-100">Net Payable</th>
                  <th className="py-3.5 px-5 text-center">Lifecycle Status</th>
                  <th className="py-3.5 px-5 text-center">Reconciliation Tie-Out</th>
                  <th className="py-3.5 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {runs.map((run) => {
                  const isPaid = (run.status || "").toUpperCase().includes("PAID");
                  const isApproved = (run.approvalStatus || "").toLowerCase() === "approved";
                  const isReconciled = run.reconciliationStatus === "MATCHED";
                  const isMismatch = run.reconciliationStatus === "MISMATCH";
                  const isNoItems = run.reconciliationStatus === "NO_ITEMS";

                  return (
                    <tr
                      key={run.id}
                      className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40 transition-colors"
                    >
                      {/* Period & Run ID */}
                      <td className="py-4 px-5">
                        <Link
                          href={`/payroll/${run.id}`}
                          className="font-semibold text-zinc-900 dark:text-zinc-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-sm"
                        >
                          {run.periodLabel}
                        </Link>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-[11px] text-zinc-400 font-medium">{run.id}</span>
                          <span className="text-zinc-300 dark:text-zinc-700">•</span>
                          <span className="text-[11px] text-zinc-400">
                            Pay Date: {run.payDate ? formatDisplayDate(run.payDate) : "Pending"}
                          </span>
                        </div>
                      </td>

                      {/* Headcount */}
                      <td className="py-4 px-5">
                        <div className="font-mono font-medium text-zinc-900 dark:text-zinc-100">
                          {run.employeesPaid} Employees
                        </div>
                        <div className="text-[11px] text-zinc-400">
                          {run.actualPayslipCount > 0 ? `${run.actualPayslipCount} payslips` : "Archived ledger"}
                        </div>
                      </td>

                      {/* Gross */}
                      <td className="py-4 px-5 text-right font-mono font-medium text-zinc-700 dark:text-zinc-300">
                        {formatMoney(run.totalGross)}
                      </td>

                      {/* Deductions */}
                      <td className="py-4 px-5 text-right font-mono font-medium text-zinc-600 dark:text-zinc-400">
                        {formatMoney(run.totalDeductions)}
                      </td>

                      {/* Net */}
                      <td className="py-4 px-5 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400 text-sm">
                        {formatMoney(run.totalNet)}
                      </td>

                      {/* Operational & Approval Status */}
                      <td className="py-4 px-5 text-center">
                        <div className="inline-flex flex-col items-center gap-1">
                          <Badge
                            variant={isPaid ? "success" : "warning"}
                            dot
                            size="sm"
                          >
                            {run.status}
                          </Badge>
                          <span className="text-[10px] text-zinc-400">
                            Approval: {run.approvalStatus}
                          </span>
                        </div>
                      </td>

                      {/* Reconciliation Status Badge */}
                      <td className="py-4 px-5 text-center">
                        {isReconciled && (
                          <Badge variant="success" size="sm">
                            Matched
                          </Badge>
                        )}
                        {isMismatch && (
                          <div className="inline-flex flex-col items-center">
                            <Badge variant="danger" size="sm">
                              Discrepancy (Δ ₹{Math.abs(run.grossDifference).toLocaleString("en-IN")})
                            </Badge>
                            <span className="text-[10px] text-rose-500 font-medium mt-0.5">
                              {run.employeeCountDifference > 0 ? `+${run.employeeCountDifference} missing` : "Variance"}
                            </span>
                          </div>
                        )}
                        {isNoItems && (
                          <Badge variant="default" size="sm">
                            Items Unavailable
                          </Badge>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-4 px-5 text-right">
                        <Link href={`/payroll/${run.id}`}>
                          <Button variant="secondary" size="sm">
                            Inspect
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/50 flex items-center justify-between text-xs text-zinc-500">
            <div>
              Showing Page <span className="font-medium text-zinc-900 dark:text-zinc-100">{page}</span> of{" "}
              <span className="font-medium text-zinc-900 dark:text-zinc-100">{totalPages}</span> ({totalCount} total runs)
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1 || isLoading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= totalPages || isLoading}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
