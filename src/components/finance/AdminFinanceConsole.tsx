"use client";

/**
 * Horizon Portal — Admin Finance Snapshot Console
 * src/components/finance/AdminFinanceConsole.tsx
 *
 * Day 12 — Phase 6B: Live Finance Summary KPIs & Dynamic Ageing Distribution
 * Connects the Admin Finance Snapshot to the Phase 4 summary API (/api/v1/admin/finance/summary):
 * - Live 5 Executive Financial Summary KPI cards (Billed, Collected, Outstanding, Overdue, Expenses)
 * - Live 5 Dynamic Invoice Ageing Distribution cards (Not Overdue, 0-30, 31-60, 61-90, 90+ days)
 * - Dynamic reporting date display directly from API response
 * - Interactive Refresh action with loading indicator and last-updated timestamp
 * - Full loading (Skeletons), error, and empty-state handling
 * - Client Invoices & Vendor Expenses registers (ready for Phase 6C & 6D)
 * - Strictly read-only enterprise layout with zero layout shifts
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TopBarUser } from "@/components/layout/TopBar";
import { FinanceSummary } from "@/lib/finance/types";
import { FinanceSummaryCards } from "./FinanceSummaryCards";
import { FinanceAgeingCards } from "./FinanceAgeingCards";
import { FinanceSummarySkeleton } from "./FinanceSummarySkeleton";
import { FinanceSummaryError } from "./FinanceSummaryError";
import { InvoiceRegister } from "./InvoiceRegister";
import { ExpenseRegister } from "./ExpenseRegister";

export interface AdminFinanceConsoleProps {
  initialUser?: TopBarUser | null;
  initialReportingDate?: string;
}

export default function AdminFinanceConsole({
  initialReportingDate,
}: AdminFinanceConsoleProps) {
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Request counter to avoid stale out-of-order race conditions
  const requestIdRef = useRef<number>(0);

  const fetchSummary = useCallback(async (isManualRefresh = false) => {
    const currentReqId = ++requestIdRef.current;

    if (isManualRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);
    setErrorStatus(null);

    try {
      const url = initialReportingDate
        ? `/api/v1/admin/finance/summary?reportingDate=${encodeURIComponent(initialReportingDate)}`
        : "/api/v1/admin/finance/summary";

      const res = await fetch(url, {
        method: "GET",
        headers: {
          "Accept": "application/json",
        },
      });

      // Discard stale responses if a newer request was dispatched
      if (currentReqId !== requestIdRef.current) {
        return;
      }

      if (!res.ok) {
        setErrorStatus(res.status);
        if (res.status === 401) {
          throw new Error("Your session has expired. Please sign in again.");
        }
        if (res.status === 403) {
          throw new Error("Access Restricted: Administrator privileges are strictly required to view financial metrics.");
        }
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Server responded with HTTP ${res.status}`);
      }

      const json = await res.json();
      if (!json.success || !json.data) {
        throw new Error("Malformed API response: Summary data is missing.");
      }

      setSummary(json.data as FinanceSummary);
      setLastUpdated(new Date());
    } catch (err: any) {
      if (currentReqId === requestIdRef.current) {
        console.error("Finance summary fetch error:", err);
        setError(err.message || "Failed to load financial summary.");
      }
    } finally {
      if (currentReqId === requestIdRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [initialReportingDate]);

  useEffect(() => {
    fetchSummary(false);
  }, [fetchSummary]);

  const activeReportingDate = summary?.reportingDate || initialReportingDate || "Loading...";

  return (
    <div className="space-y-8 pb-16">
      {/* ── Breadcrumb Navigation ────────────────────────────────────────── */}
      <nav aria-label="Breadcrumb">
        <Breadcrumbs
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Administration" },
            { label: "Finance Snapshot" },
          ]}
        />
      </nav>

      {/* ── Header Area ─────────────────────────────────────────────────── */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[var(--hz-border-default,#e2e8f0)] dark:border-zinc-800 pb-6">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              Finance Snapshot
            </h1>
            <Badge variant="primary" size="sm">
              Admin Only
            </Badge>
            <Badge variant="secondary" size="sm">
              Read-Only Overview
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-3xl">
            Read-only financial overview, invoice ageing, and expense monitoring.
            Tracks billing, collections, outstanding receivables tie-out, dynamic ageing buckets, and organizational vendor expenditures.
          </p>
        </div>

        {/* Header Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Dynamic Reporting Date Badge */}
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/60 text-xs text-zinc-700 dark:text-zinc-300"
            title="Snapshot reporting cutoff date for dynamic ageing calculation"
          >
            <svg
              className="w-3.5 h-3.5 text-zinc-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span>
              Reporting Date: <strong className="font-mono font-semibold">{activeReportingDate}</strong>
            </span>
          </div>

          {/* Refresh Action Button */}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => fetchSummary(true)}
            disabled={isLoading || isRefreshing}
            className="flex items-center gap-1.5 text-xs font-medium cursor-pointer"
            aria-label="Refresh financial snapshot data"
          >
            <svg
              className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-indigo-600" : "text-zinc-500"}`}
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
            <span>{isRefreshing ? "Refreshing..." : "Refresh"}</span>
          </Button>

          {/* Last Updated Timestamp */}
          {lastUpdated && (
            <span className="text-[11px] text-zinc-400 hidden xl:inline" title={lastUpdated.toISOString()}>
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>
      </header>

      {/* ── Error State Display ──────────────────────────────────────────── */}
      {error && (
        <FinanceSummaryError
          error={error}
          status={errorStatus}
          onRetry={() => fetchSummary(true)}
        />
      )}

      {/* ── Loading Skeleton State (No Layout Shift) ─────────────────────── */}
      {isLoading && !summary && !error && <FinanceSummarySkeleton />}

      {/* ── Live KPI Summary & Dynamic Ageing Cards ──────────────────────── */}
      {summary && (
        <>
          {/* Section 1: Executive Financial Summary */}
          <section aria-labelledby="section-summary-heading">
            <FinanceSummaryCards summary={summary} />
          </section>

          {/* Section 2: Invoice Ageing Distribution */}
          <section aria-labelledby="section-ageing-heading">
            <FinanceAgeingCards summary={summary} />
          </section>
        </>
      )}

      {/* ── 3. Client Invoices Section (Phase 6C Live Interactive Register) ─ */}
      <InvoiceRegister
        reportingDate={summary?.reportingDate || initialReportingDate || "2026-11-03"}
      />

      {/* ── 4. Vendor Expenses Section (Phase 6D Live Interactive Register) ─ */}
      <ExpenseRegister />
    </div>
  );
}
