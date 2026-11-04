"use client";

/**
 * Horizon Portal — Live Executive Finance Summary KPI Cards
 * src/components/finance/FinanceSummaryCards.tsx
 *
 * Renders the 5 core financial KPI metric cards from the live API response:
 * 1. Total Billed
 * 2. Total Collected
 * 3. Total Outstanding
 * 4. Total Overdue
 * 5. Total Expenses
 *
 * Uses standardized Indian Rupee (INR) formatting via formatINR.
 * Correctly displays zero (₹0), negative balances, and precision amounts.
 */

import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { formatINR } from "@/lib/finance/formatting";
import { FinanceSummary } from "@/lib/finance/types";

export interface FinanceSummaryCardsProps {
  summary: FinanceSummary;
}

export function FinanceSummaryCards({ summary }: FinanceSummaryCardsProps) {
  // Collection rate calculation for contextual executive insight
  const collectionRate =
    summary.billedAmount > 0
      ? ((summary.collectedAmount / summary.billedAmount) * 100).toFixed(1)
      : "0.0";

  return (
    <div className="space-y-4" aria-label="Executive Financial Summary">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
        <div>
          <h2
            id="section-summary-heading"
            className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight"
          >
            Executive Financial Summary
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            High-level balances across customer billing, collections, outstanding receivables, and organizational expenses.
          </p>
        </div>
        <span className="text-[11px] font-mono text-zinc-400 self-start sm:self-auto">
          Section 1 of 4
        </span>
      </div>

      {/* 5 KPI Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* KPI 1: Total Billed */}
        <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Total Billed
              </CardDescription>
              <div
                className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 flex items-center justify-center"
                aria-hidden="true"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
            </div>
            <CardTitle
              className="text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-100 mt-2 truncate"
              title={formatINR(summary.billedAmount)}
            >
              {formatINR(summary.billedAmount)}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-[11px] text-zinc-500 dark:text-zinc-400">
            {summary.invoiceCount.toLocaleString("en-IN")} total issued invoices
          </CardContent>
        </Card>

        {/* KPI 2: Total Collected */}
        <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Total Collected
              </CardDescription>
              <div
                className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center"
                aria-hidden="true"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
            <CardTitle
              className="text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-400 mt-2 truncate"
              title={formatINR(summary.collectedAmount)}
            >
              {formatINR(summary.collectedAmount)}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-[11px] text-zinc-500 dark:text-zinc-400">
            {collectionRate}% collection rate
          </CardContent>
        </Card>

        {/* KPI 3: Total Outstanding */}
        <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Total Outstanding
              </CardDescription>
              <div
                className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center"
                aria-hidden="true"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
            <CardTitle
              className="text-2xl font-bold font-mono text-indigo-600 dark:text-indigo-400 mt-2 truncate"
              title={formatINR(summary.outstandingAmount)}
            >
              {formatINR(summary.outstandingAmount)}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-[11px] text-zinc-500 dark:text-zinc-400">
            {summary.openInvoiceCount.toLocaleString("en-IN")} open balance invoices
          </CardContent>
        </Card>

        {/* KPI 4: Total Overdue */}
        <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                Total Overdue
              </CardDescription>
              <div
                className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 flex items-center justify-center"
                aria-hidden="true"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
            </div>
            <CardTitle
              className="text-2xl font-bold font-mono text-rose-600 dark:text-rose-400 mt-2 truncate"
              title={formatINR(summary.overdueAmount)}
            >
              {formatINR(summary.overdueAmount)}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-[11px] text-zinc-500 dark:text-zinc-400">
            {summary.overdueInvoiceCount.toLocaleString("en-IN")} invoices past due date
          </CardContent>
        </Card>

        {/* KPI 5: Total Expenses */}
        <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Total Expenses
              </CardDescription>
              <div
                className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 flex items-center justify-center"
                aria-hidden="true"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
            </div>
            <CardTitle
              className="text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-100 mt-2 truncate"
              title={formatINR(summary.totalExpenses)}
            >
              {formatINR(summary.totalExpenses)}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-[11px] text-zinc-500 dark:text-zinc-400">
            {summary.expenseCount.toLocaleString("en-IN")} vendor bills recorded
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default FinanceSummaryCards;
