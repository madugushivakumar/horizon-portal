"use client";

/**
 * Horizon Portal — Custom Error Boundary
 * src/app/error.tsx
 *
 * Catch-all React error boundary for runtime exceptions.
 * Features safe user-facing message, retry mechanism via reset(),
 * and zero exposure of internal database errors, secrets, or stack traces.
 */

import React, { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorBoundary({ error, reset }: ErrorBoundaryProps) {
  useEffect(() => {
    // Log sanitized error diagnostic to client console or monitoring service
    console.error("Horizon Portal application error caught:", {
      message: error?.message,
      digest: error?.digest,
    });
  }, [error]);

  return (
    <div
      role="alert"
      className="min-h-screen flex items-center justify-center bg-[var(--hz-bg-canvas)] px-4 py-16"
    >
      <div className="max-w-md w-full text-center space-y-6">
        {/* Error Icon */}
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-[var(--hz-semantic-error-bg)] text-[var(--hz-semantic-error-text)] border border-[var(--hz-semantic-error-border)] shadow-lg shadow-red-500/10">
          <svg
            className="h-10 w-10"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.75}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        {/* Status Pill */}
        <div className="inline-flex items-center rounded-full bg-[var(--hz-danger-100)] dark:bg-[var(--hz-danger-950)] px-3 py-1 text-xs font-bold uppercase tracking-wider text-[var(--hz-danger-700)] dark:text-[var(--hz-danger-300)]">
          Application Error
        </div>

        {/* Headings */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--hz-text-primary)]">
            Something went wrong
          </h1>
          <p className="text-sm text-[var(--hz-text-secondary)] leading-relaxed max-w-sm mx-auto">
            An unexpected error occurred while processing your request. We have logged this event and our team is looking into it.
          </p>
        </div>

        {/* Action Controls */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            variant="primary"
            onClick={() => reset()}
            className="w-full sm:w-auto"
          >
            <svg
              className="mr-2 h-4 w-4"
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
            Try Again
          </Button>

          <Link
            href="/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl border border-[var(--hz-border-default)] bg-[var(--hz-bg-surface)] px-5 py-2.5 text-xs font-semibold text-[var(--hz-text-secondary)] hover:bg-[var(--hz-bg-subtle)] hover:text-[var(--hz-text-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--hz-primary-500)] transition-all"
          >
            Back to Dashboard
          </Link>
        </div>

        {error?.digest && (
          <p className="text-[10px] text-[var(--hz-text-muted)] font-mono">
            Incident Reference: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
