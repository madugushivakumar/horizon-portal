/**
 * Horizon Design System — EmptyState Component
 * src/components/ui/empty-state.tsx
 *
 * Renders user-friendly empty states when lists or tables contain no records.
 * Uses Horizon design tokens, accessible typography, and customizable action slot.
 */

import React from "react";
import { cn } from "@/lib/utils";

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  action,
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        "flex min-h-[260px] flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--hz-border-default)] bg-[var(--hz-bg-surface)] p-8 text-center transition-colors",
        className
      )}
      {...props}
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--hz-bg-subtle)] text-[var(--hz-primary-600)] dark:text-[var(--hz-primary-400)] shadow-sm">
        {icon || (
          <svg
            className="h-7 w-7"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.75}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
        )}
      </div>

      <h3 className="text-base font-semibold text-[var(--hz-text-primary)] tracking-tight">
        {title}
      </h3>

      <p className="mt-1 max-w-sm text-xs text-[var(--hz-text-muted)] leading-relaxed">
        {description}
      </p>

      {action && <div className="mt-5">{action}</div>}
    </div>
  );
};

export default EmptyState;
