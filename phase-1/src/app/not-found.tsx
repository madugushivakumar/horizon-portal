import React from "react";
import Link from "next/link";

/**
 * Horizon Portal — Custom 404 Not Found Page
 * src/app/not-found.tsx
 *
 * Rendered when a route or resource does not exist.
 * Styled with Horizon design system tokens and supports light/dark themes.
 */

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--hz-bg-canvas)] px-4 py-16">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Decorative Badge & Icon */}
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-[var(--hz-primary-50)] dark:bg-[var(--hz-primary-950)]/60 text-[var(--hz-primary-600)] dark:text-[var(--hz-primary-400)] shadow-lg shadow-[var(--hz-primary-500)]/10 border border-[var(--hz-primary-100)] dark:border-[var(--hz-primary-900)]">
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
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        {/* 404 Code Badge */}
        <div className="inline-flex items-center rounded-full bg-[var(--hz-primary-100)] dark:bg-[var(--hz-primary-900)]/60 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[var(--hz-primary-700)] dark:text-[var(--hz-primary-300)]">
          404 · Page Not Found
        </div>

        {/* Heading & Explanation */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--hz-text-primary)]">
            Lost in the Horizon?
          </h1>
          <p className="text-sm text-[var(--hz-text-secondary)] leading-relaxed max-w-sm mx-auto">
            The page you are looking for does not exist, has been relocated, or is temporarily inaccessible.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl bg-[var(--hz-primary-600)] px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-[var(--hz-primary-500)]/20 hover:bg-[var(--hz-primary-700)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--hz-primary-500)] transition-all"
          >
            <svg
              className="mr-2 h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Return to Dashboard
          </Link>

          <Link
            href="/login"
            className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl border border-[var(--hz-border-default)] bg-[var(--hz-bg-surface)] px-5 py-2.5 text-xs font-semibold text-[var(--hz-text-secondary)] hover:bg-[var(--hz-bg-subtle)] hover:text-[var(--hz-text-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--hz-primary-500)] transition-all"
          >
            Sign In Again
          </Link>
        </div>

        {/* Footnote */}
        <p className="text-[11px] text-[var(--hz-text-muted)]">
          Aura Workforce · Horizon Portal
        </p>
      </div>
    </div>
  );
}
