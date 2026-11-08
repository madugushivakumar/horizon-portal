/**
 * Horizon Design System — ErrorState Component
 * src/components/ui/error-state.tsx
 *
 * Friendly, accessible error display with optional retry action.
 * Strictly avoids exposing database traces, secrets, or internal server errors.
 */

import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

export interface ErrorStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  icon?: React.ReactNode;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = "Unable to load content",
  description = "A problem occurred while retrieving this information. Please check your connection and try again.",
  onRetry,
  retryLabel = "Try Again",
  icon,
  className,
  ...props
}) => {
  return (
    <div
      role="alert"
      className={cn(
        "flex min-h-[260px] flex-col items-center justify-center rounded-2xl border border-[var(--hz-semantic-error-border)] bg-[var(--hz-semantic-error-bg)] p-8 text-center",
        className
      )}
      {...props}
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--hz-semantic-error-text)]/10 text-[var(--hz-semantic-error-text)] shadow-sm">
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
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        )}
      </div>

      <h3 className="text-base font-semibold text-[var(--hz-semantic-error-text)] tracking-tight">
        {title}
      </h3>

      <p className="mt-1 max-w-sm text-xs text-[var(--hz-semantic-error-text)]/85 leading-relaxed">
        {description}
      </p>

      {onRetry && (
        <div className="mt-5">
          <Button variant="danger" size="sm" onClick={onRetry}>
            {retryLabel}
          </Button>
        </div>
      )}
    </div>
  );
};

export default ErrorState;
