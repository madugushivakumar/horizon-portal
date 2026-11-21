"use client";

/**
 * Horizon Portal — Task Board Empty State
 * src/components/task-board/TaskBoardEmptyState.tsx
 *
 * Rendered when no tasks match the selected Team / Sprint filters or scope.
 */

import React from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

export interface TaskBoardEmptyStateProps {
  hasActiveFilters: boolean;
  onClearFilters?: () => void;
  className?: string;
}

export const TaskBoardEmptyState: React.FC<TaskBoardEmptyStateProps> = ({
  hasActiveFilters,
  onClearFilters,
  className,
}) => {
  return (
    <EmptyState
      title="No tasks found"
      description={
        hasActiveFilters
          ? "No tasks match your selected team and sprint filter criteria. Try adjusting or clearing your filters."
          : "There are currently no tasks available in your authorized scope."
      }
      action={
        hasActiveFilters && onClearFilters ? (
          <Button
            variant="secondary"
            size="sm"
            onClick={onClearFilters}
            className="mt-2"
          >
            Clear Active Filters
          </Button>
        ) : undefined
      }
      className={className}
    />
  );
};
