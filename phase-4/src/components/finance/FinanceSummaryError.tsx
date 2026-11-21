"use client";

/**
 * Horizon Portal — Finance Summary Error Display
 * src/components/finance/FinanceSummaryError.tsx
 *
 * Accessible error presentation for financial snapshot failures.
 * Distinguishes 401 unauthenticated, 403 forbidden, and network/server failures
 * while strictly preventing sensitive server stack traces from leaking to users.
 */

import React from "react";
import { Button } from "@/components/ui/button";

export interface FinanceSummaryErrorProps {
  error: string;
  status?: number | null;
  onRetry?: () => void;
}

export function FinanceSummaryError({
  error,
  status,
  onRetry,
}: FinanceSummaryErrorProps) {
  const isAuthError = status === 401;
  const isForbiddenError = status === 403;

  let title = "Failed to Load Financial Snapshot";
  let description = error || "A network or server error occurred while retrieving finance metrics. Please try again.";

  if (isAuthError) {
    title = "Authentication Session Expired";
    description = "Your session has expired. Please log in again to continue viewing the finance snapshot.";
  } else if (isForbiddenError) {
    title = "Access Restricted — 403 Forbidden";
    description = "You do not have Administrator permissions to access enterprise revenue and expenditure figures.";
  }

  return (
    <div
      role="alert"
      className="p-6 sm:p-8 rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20 text-center space-y-4 my-4"
    >
      <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center">
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
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>

      <div className="max-w-md mx-auto space-y-1.5">
        <h3 className="text-base font-bold text-rose-900 dark:text-rose-200">
          {title}
        </h3>
        <p className="text-xs text-rose-700 dark:text-rose-300 leading-relaxed">
          {description}
        </p>
      </div>

      {onRetry && !isAuthError && !isForbiddenError && (
        <div className="pt-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={onRetry}
            className="cursor-pointer border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 hover:bg-rose-100/70"
          >
            <svg
              className="w-3.5 h-3.5 mr-1.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Retry Fetching Summary
          </Button>
        </div>
      )}

      {isAuthError && (
        <div className="pt-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              window.location.href = "/login?from=/admin/finance";
            }}
            className="cursor-pointer"
          >
            Sign In Again
          </Button>
        </div>
      )}
    </div>
  );
}

export default FinanceSummaryError;
