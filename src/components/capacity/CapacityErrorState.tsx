"use client";

/**
 * Horizon Portal — Capacity Error State
 * src/components/capacity/CapacityErrorState.tsx
 *
 * Displays a friendly error boundary card when capacity data fails to load,
 * providing a retry button and avoiding raw stack trace leaks.
 */

import React from "react";
import { ErrorState } from "@/components/ui/error-state";

export interface CapacityErrorStateProps {
  onRetry: () => void;
  errorMessage?: string;
  className?: string;
}

export const CapacityErrorState: React.FC<CapacityErrorStateProps> = ({
  onRetry,
  errorMessage,
  className,
}) => {
  return (
    <ErrorState
      title="Unable to Load Capacity Data"
      description={
        errorMessage ||
        "An unexpected error occurred while retrieving team workload and sprint capacity metrics. Please try again."
      }
      onRetry={onRetry}
      retryLabel="Retry Loading"
      className={className}
    />
  );
};
