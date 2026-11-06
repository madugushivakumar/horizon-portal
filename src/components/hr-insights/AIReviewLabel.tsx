"use client";

/**
 * Horizon Portal — AI Review Label
 * src/components/hr-insights/AIReviewLabel.tsx
 *
 * Mandatory transparency label rendered on every AI insight component:
 * - Exact required text: "AI-generated, for human review"
 * - Informational styling with Horizon warning/gold design tokens
 * - Supports compact badge and full banner variants
 */

import React from "react";
import { cn } from "@/lib/utils";

export interface AIReviewLabelProps {
  size?: "sm" | "md";
  variant?: "badge" | "subtle" | "banner";
  className?: string;
}

export const AIReviewLabel: React.FC<AIReviewLabelProps> = ({
  size = "sm",
  variant = "badge",
  className,
}) => {
  if (variant === "banner") {
    return (
      <div
        role="note"
        aria-label="AI Transparency Notice"
        className={cn(
          "flex items-center gap-2 rounded-lg border border-amber-200/80 bg-amber-50/70 px-3 py-2 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300",
          className
        )}
      >
        <svg
          className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span>
          <strong className="font-semibold">AI-generated, for human review</strong> — Model predictions are statistical estimates. Human validation is required.
        </span>
      </div>
    );
  }

  return (
    <span
      role="status"
      aria-label="AI-generated, for human review"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium transition-colors border",
        size === "sm" ? "px-2.5 py-0.5 text-[11px]" : "px-3 py-1 text-xs",
        variant === "subtle"
          ? "border-amber-200/50 bg-amber-50/40 text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-400"
          : "border-amber-300/80 bg-amber-100/70 text-amber-900 dark:border-amber-800/80 dark:bg-amber-950/50 dark:text-amber-300",
        className
      )}
    >
      <svg
        className={cn("shrink-0 text-amber-600 dark:text-amber-400", size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5")}
        fill="currentColor"
        viewBox="0 0 20 20"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.381z"
          clipRule="evenodd"
        />
      </svg>
      <span>AI-generated, for human review</span>
    </span>
  );
};
