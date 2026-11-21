"use client";

/**
 * Horizon Portal — HR Insights Error State
 * src/components/hr-insights/HRInsightsErrorState.tsx
 *
 * Accessible error display with retry action:
 * - Friendly message without exposing database errors or stack traces
 * - Retry button
 */

import React from "react";
import { ErrorState } from "@/components/ui/error-state";

export interface HRInsightsErrorStateProps {
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const HRInsightsErrorState: React.FC<HRInsightsErrorStateProps> = ({
  message = "Failed to load AI Workforce Insights",
  onRetry,
  className,
}) => {
  return (
    <ErrorState
      title="Unable to load workforce insights"
      description={
        message ||
        "A problem occurred while retrieving AI insights. Please check your network connection and try again."
      }
      onRetry={onRetry}
      retryLabel="Retry Loading Insights"
      className={className}
    />
  );
};
