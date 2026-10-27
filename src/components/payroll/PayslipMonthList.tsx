"use client";

/**
 * Horizon Portal — Payslip Month List Component
 * src/components/payroll/PayslipMonthList.tsx
 *
 * Displays all historical pay periods for the authenticated employee.
 * Features:
 * - Real-time client fetch from /api/v1/payslips
 * - Summary KPI cards (Latest Net Pay, Total Disbursed, Statement Count)
 * - Chronological month listing with exact en-IN INR formatting
 * - Search & Filter controls
 * - Accessible loading skeletons, error states, and empty states
 */

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { formatMoney, formatDisplayDate, formatPayPeriodLabel } from "@/lib/payroll/formatters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "@/components/ui/empty-state";
import ErrorState from "@/components/ui/error-state";

export interface PayslipSummary {
  id: string;
  payrollRunId: string;
  periodStart: string | null;
  periodEnd: string | null;
  paymentDate: string | null;
  grossPay: number;
  totalDeductions: number;
  netPay: number;
  currency: string;
  status: string;
}

export const PayslipMonthList: React.FC = () => {
  const [payslips, setPayslips] = useState<PayslipSummary[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  const handleRefresh = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/v1/payslips", { cache: "no-store" });
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("Authentication required. Please sign in again.");
        }
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || `Failed to fetch payslips (${res.status})`);
      }
      const json = await res.json();
      setPayslips(json.data || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred.";
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    async function loadPayslips() {
      try {
        const res = await fetch("/api/v1/payslips", { cache: "no-store" });
        if (ignore) return;
        if (!res.ok) {
          if (res.status === 401) {
            throw new Error("Authentication required. Please sign in again.");
          }
          const errData = await res.json().catch(() => null);
          throw new Error(errData?.error || `Failed to fetch payslips (${res.status})`);
        }
        const json = await res.json();
        if (!ignore) {
          setPayslips(json.data || []);
        }
      } catch (err: unknown) {
        if (!ignore) {
          const msg = err instanceof Error ? err.message : "An unexpected error occurred.";
          setErrorMessage(msg);
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    loadPayslips();
    return () => {
      ignore = true;
    };
  }, []);

  // Filter & Sort
  const filteredPayslips = useMemo(() => {
    let result = [...payslips];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.payrollRunId.toLowerCase().includes(query) ||
          (p.periodStart && formatPayPeriodLabel(p.periodStart).toLowerCase().includes(query)) ||
          p.status.toLowerCase().includes(query)
      );
    }

    result.sort((a, b) => {
      const timeA = a.periodStart ? new Date(a.periodStart).getTime() : 0;
      const timeB = b.periodStart ? new Date(b.periodStart).getTime() : 0;
      return sortOrder === "desc" ? timeB - timeA : timeA - timeB;
    });

    return result;
  }, [payslips, searchQuery, sortOrder]);

  // Aggregate stats
  const stats = useMemo(() => {
    if (payslips.length === 0) return { latestNet: 0, totalNet: 0, count: 0 };
    const latest = payslips[0];
    const totalNet = payslips.reduce((acc, curr) => acc + curr.netPay, 0);
    return {
      latestNet: latest ? latest.netPay : 0,
      totalNet,
      count: payslips.length,
    };
  }, [payslips]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--hz-text-primary)]">
            My Payslips & Tax Documents
          </h1>
          <p className="text-sm text-[var(--hz-text-secondary)] mt-1">
            Access official earnings statements, itemized withholdings, and salary payment records.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRefresh}
            loading={isLoading}
            id="refresh-payslips-btn"
          >
            ↻ Refresh
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl border border-[var(--hz-border)] bg-[var(--hz-bg-surface)] shadow-xs transition-shadow hover:shadow-md">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--hz-text-muted)]">
            Latest Take-Home Pay
          </p>
          <p className="text-2xl font-bold text-[var(--hz-primary-600)] dark:text-[var(--hz-primary-400)] mt-2">
            {isLoading ? <Skeleton width="8rem" height="1.75rem" /> : formatMoney(stats.latestNet)}
          </p>
          <p className="text-xs text-[var(--hz-text-secondary)] mt-1">
            Most recent disbursed pay period
          </p>
        </div>

        <div className="p-5 rounded-xl border border-[var(--hz-border)] bg-[var(--hz-bg-surface)] shadow-xs transition-shadow hover:shadow-md">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--hz-text-muted)]">
            Total Net Disbursed
          </p>
          <p className="text-2xl font-bold text-[var(--hz-text-primary)] mt-2">
            {isLoading ? <Skeleton width="9rem" height="1.75rem" /> : formatMoney(stats.totalNet)}
          </p>
          <p className="text-xs text-[var(--hz-text-secondary)] mt-1">
            Cumulative net earnings across records
          </p>
        </div>

        <div className="p-5 rounded-xl border border-[var(--hz-border)] bg-[var(--hz-bg-surface)] shadow-xs transition-shadow hover:shadow-md">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--hz-text-muted)]">
            Available Statements
          </p>
          <p className="text-2xl font-bold text-[var(--hz-text-primary)] mt-2">
            {isLoading ? <Skeleton width="4rem" height="1.75rem" /> : `${stats.count} Months`}
          </p>
          <p className="text-xs text-[var(--hz-text-secondary)] mt-1">
            Official A4 statements ready for download
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-xl border border-[var(--hz-border)] bg-[var(--hz-bg-surface)]">
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="Search by month or run ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            id="payslip-search-input"
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-[var(--hz-border)] bg-[var(--hz-bg-base)] text-[var(--hz-text-primary)] placeholder-[var(--hz-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--hz-primary-500)]"
          />
          <span className="absolute left-3 top-2.5 text-xs text-[var(--hz-text-muted)]">🔍</span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <label htmlFor="payslip-sort-select" className="text-xs font-medium text-[var(--hz-text-secondary)]">
            Sort:
          </label>
          <select
            id="payslip-sort-select"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as "desc" | "asc")}
            className="text-xs px-3 py-1.5 rounded-lg border border-[var(--hz-border)] bg-[var(--hz-bg-base)] text-[var(--hz-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--hz-primary-500)]"
          >
            <option value="desc">Newest First</option>
            <option value="asc">Oldest First</option>
          </select>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton variant="rectangular" height="3.5rem" className="rounded-xl" />
          <Skeleton variant="rectangular" height="3.5rem" className="rounded-xl" />
          <Skeleton variant="rectangular" height="3.5rem" className="rounded-xl" />
          <Skeleton variant="rectangular" height="3.5rem" className="rounded-xl" />
        </div>
      ) : errorMessage ? (
        <ErrorState
          title="Could Not Load Payslips"
          description={errorMessage}
          onRetry={handleRefresh}
        />
      ) : filteredPayslips.length === 0 ? (
        <EmptyState
          title="No Payslips Found"
          description={
            searchQuery
              ? `No pay periods matched "${searchQuery}". Clear your search query to see all records.`
              : "No payroll statements are currently available for your employee profile."
          }
          icon="📄"
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-[var(--hz-border)] bg-[var(--hz-bg-surface)] shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm" id="payslip-month-list-table">
              <thead className="border-b border-[var(--hz-border)] bg-[var(--hz-bg-subtle)] text-xs font-semibold uppercase tracking-wider text-[var(--hz-text-muted)]">
                <tr>
                  <th scope="col" className="px-3.5 sm:px-4 py-3">
                    Pay Period
                  </th>
                  <th scope="col" className="px-3 py-3 hidden md:table-cell">
                    Run ID
                  </th>
                  <th scope="col" className="px-3 py-3 hidden lg:table-cell">
                    Payment Date
                  </th>
                  <th scope="col" className="px-3 py-3 text-right hidden xl:table-cell">
                    Gross Earnings
                  </th>
                  <th scope="col" className="px-3 py-3 text-right hidden xl:table-cell">
                    Deductions
                  </th>
                  <th scope="col" className="px-3.5 sm:px-4 py-3 text-right font-bold">
                    Net Take-Home
                  </th>
                  <th scope="col" className="px-3 py-3 text-center">
                    Status
                  </th>
                  <th scope="col" className="px-3.5 sm:px-4 py-3 text-right">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--hz-border)]">
                {filteredPayslips.map((slip) => {
                  const periodLabel = slip.periodStart
                    ? formatPayPeriodLabel(slip.periodStart, slip.payrollRunId)
                    : slip.payrollRunId;
                  const isPaid = slip.status.toUpperCase().includes("PAID");

                  return (
                    <tr
                      key={slip.id}
                      className="transition-colors hover:bg-[var(--hz-bg-subtle)] group"
                    >
                      <td className="px-3.5 sm:px-4 py-3.5">
                        <div className="font-semibold text-[var(--hz-text-primary)]">
                          {periodLabel}
                        </div>
                        <div className="text-xs text-[var(--hz-text-secondary)] md:hidden mt-0.5">
                          {slip.payrollRunId} • {formatDisplayDate(slip.paymentDate)}
                        </div>
                      </td>
                      <td className="px-3 py-3.5 font-mono text-xs text-[var(--hz-text-secondary)] hidden md:table-cell">
                        {slip.payrollRunId}
                      </td>
                      <td className="px-3 py-3.5 text-xs text-[var(--hz-text-secondary)] hidden lg:table-cell">
                        {formatDisplayDate(slip.paymentDate)}
                      </td>
                      <td className="px-3 py-3.5 text-right font-mono text-xs text-[var(--hz-text-secondary)] hidden xl:table-cell">
                        {formatMoney(slip.grossPay, slip.currency)}
                      </td>
                      <td className="px-3 py-3.5 text-right font-mono text-xs text-[var(--hz-danger)] hidden xl:table-cell">
                        -{formatMoney(slip.totalDeductions, slip.currency)}
                      </td>
                      <td className="px-3.5 sm:px-4 py-3.5 text-right font-mono font-bold text-sm text-[var(--hz-primary-700)] dark:text-[var(--hz-primary-300)]">
                        {formatMoney(slip.netPay, slip.currency)}
                      </td>
                      <td className="px-3 py-3.5 text-center">
                        <Badge
                          variant={isPaid ? "success" : "warning"}
                          size="sm"
                          dot
                        >
                          {slip.status}
                        </Badge>
                      </td>
                      <td className="px-3.5 sm:px-4 py-3.5 text-right">
                        <Link
                          href={`/payslips/${slip.payrollRunId}`}
                          id={`view-payslip-${slip.payrollRunId}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-[var(--hz-primary-700)] bg-[var(--hz-primary-100)] dark:bg-[var(--hz-primary-950)] dark:text-[var(--hz-primary-300)] hover:bg-[var(--hz-primary-200)] transition-colors focus:ring-2 focus:ring-[var(--hz-primary-500)] outline-none"
                        >
                          View Statement ↗
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayslipMonthList;
