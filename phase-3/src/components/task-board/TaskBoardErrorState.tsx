"use client";

/**
 * Horizon Portal — Task Board Error State
 * src/components/task-board/TaskBoardErrorState.tsx
 *
 * User-friendly, accessible error presentation with retry action.
 * Strictly avoids leaking internal server stack traces or database errors.
 */

import React from "react";
import { ErrorState } from "@/components/ui/error-state";

export interface TaskBoardErrorStateProps {
  message?: string;
  onRetry: () => void;
  className?: string;
}

export const TaskBoardErrorState: React.FC<TaskBoardErrorStateProps> = ({
  message = "Failed to load tasks from the server. Please check your network connection and try again.",
  onRetry,
  className,
}) => {
  return (
    <ErrorState
      title="Unable to load Task Board"
      description={message}
      onRetry={onRetry}
      retryLabel="Retry Loading"
      className={className}
    />
  );
};
