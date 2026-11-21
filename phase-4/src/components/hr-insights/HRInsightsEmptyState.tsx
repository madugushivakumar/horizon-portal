"use client";

/**
 * Horizon Portal — HR Insights Empty State
 * src/components/hr-insights/HRInsightsEmptyState.tsx
 *
 * Rendered when no records or anomalies exist for a selected department filter:
 * - Informative message without fabricating zero counts
 * - Action button to reset filter to organization-wide view
 */

import React from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

export interface HRInsightsEmptyStateProps {
  departmentName?: string | null;
  onResetFilter?: () => void;
  className?: string;
}

export const HRInsightsEmptyState: React.FC<HRInsightsEmptyStateProps> = ({
  departmentName,
  onResetFilter,
  className,
}) => {
  return (
    <EmptyState
      title={
        departmentName
          ? `No AI insights recorded for ${departmentName}`
          : "No AI insights recorded"
      }
      description={
        departmentName
          ? `The department "${departmentName}" does not contain any active attrition model records or flagged payroll anomalies.`
          : "There are currently no workforce attrition or payroll anomaly records available for evaluation."
      }
      action={
        onResetFilter && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onResetFilter}
          >
            View All Departments
          </Button>
        )
      }
      className={className}
    />
  );
};
