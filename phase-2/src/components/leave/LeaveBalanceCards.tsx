"use client";

import React from "react";
import { LeaveBalanceItem } from "@/types/leave";

interface LeaveBalanceCardsProps {
  balances: LeaveBalanceItem[];
  loading?: boolean;
}

export function LeaveBalanceCards({ balances, loading }: LeaveBalanceCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((n) => (
          <div
            key={n}
            className="animate-pulse bg-[var(--hz-surface-card)] p-5 rounded-xl border border-[var(--hz-border-subtle)] space-y-3"
          >
            <div className="h-4 bg-[var(--hz-neutral-200)] rounded w-1/3"></div>
            <div className="h-8 bg-[var(--hz-neutral-200)] rounded w-1/2"></div>
            <div className="h-2 bg-[var(--hz-neutral-200)] rounded w-full"></div>
          </div>
        ))}
      </div>
    );
  }

  // Filter to primary balance cards: CL, SL, EL (and others with quota > 0)
  const displayBalances = balances.filter(
    (b) => ["CL", "SL", "EL"].includes(b.code) || b.entitlement > 0
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {displayBalances.map((bal) => {
        const percentUsed =
          bal.entitlement > 0
            ? Math.min(100, Math.round((bal.used / bal.entitlement) * 100))
            : 0;
        const percentPending =
          bal.entitlement > 0
            ? Math.min(100 - percentUsed, Math.round((bal.pending / bal.entitlement) * 100))
            : 0;

        return (
          <div
            key={bal.code}
            className="bg-[var(--hz-surface-card)] rounded-xl p-5 border border-[var(--hz-border-subtle)] shadow-xs transition-all hover:border-[var(--hz-primary-300)] hover:shadow-sm relative overflow-hidden"
          >
            {/* Top row: Name & Code */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--hz-text-muted)]">
                {bal.code} &bull; {bal.payType}
              </span>
              {bal.pending > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--hz-warning-50)] text-[var(--hz-warning-700)] border border-[var(--hz-warning-200)]">
                  {bal.pending}d Pending
                </span>
              )}
            </div>

            <h3 className="text-base font-bold text-[var(--hz-text-title)] mb-3">
              {bal.name}
            </h3>

            {/* Middle row: Big Available number */}
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-3xl font-extrabold text-[var(--hz-primary-600)]">
                {bal.available}
              </span>
              <span className="text-sm font-medium text-[var(--hz-text-muted)]">
                Days Available
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 bg-[var(--hz-neutral-100)] dark:bg-[var(--hz-neutral-800)] rounded-full overflow-hidden flex mb-3">
              <div
                style={{ width: `${percentUsed}%` }}
                className="bg-[var(--hz-primary-500)] h-full transition-all duration-300"
                title={`${percentUsed}% Used (${bal.used}d)`}
              />
              <div
                style={{ width: `${percentPending}%` }}
                className="bg-[var(--hz-warning-400)] h-full transition-all duration-300"
                title={`${percentPending}% Pending (${bal.pending}d)`}
              />
            </div>

            {/* Bottom Row: Breakdown stats */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs border-t border-[var(--hz-border-subtle)] pt-3 text-[var(--hz-text-muted)]">
              <div>
                <span className="block text-[10px] uppercase font-semibold text-[var(--hz-text-muted)]">
                  Allocated
                </span>
                <span className="font-bold text-[var(--hz-text-body)]">
                  {bal.entitlement}d
                </span>
              </div>
              <div>
                <span className="block text-[10px] uppercase font-semibold text-[var(--hz-text-muted)]">
                  Used
                </span>
                <span className="font-bold text-[var(--hz-text-body)]">
                  {bal.used}d
                </span>
              </div>
              <div>
                <span className="block text-[10px] uppercase font-semibold text-[var(--hz-text-muted)]">
                  Locked
                </span>
                <span className="font-bold text-[var(--hz-text-body)]">
                  {bal.pending}d
                </span>
              </div>
            </div>

            {bal.policyNote && (
              <p className="mt-3 text-[11px] text-[var(--hz-text-muted)] line-clamp-1 italic">
                &ldquo;{bal.policyNote}&rdquo;
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
