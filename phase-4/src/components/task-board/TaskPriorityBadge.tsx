"use client";

/**
 * Horizon Portal — Task Priority Badge
 * src/components/task-board/TaskPriorityBadge.tsx
 *
 * Renders standardized, accessible priority indicators:
 * - P1: Critical / Urgent (Rose / Danger)
 * - P2: High (Amber / Warning)
 * - P3: Medium (Sky / Info)
 * - P4: Low (Slate / Secondary)
 */

import React from "react";
import { Badge, BadgeVariant } from "@/components/ui/badge";
import { TaskPriority } from "@/types/task";

export interface TaskPriorityBadgeProps {
  priority: TaskPriority | string;
  className?: string;
}

const PRIORITY_CONFIG: Record<
  string,
  { label: string; variant: BadgeVariant; ariaLabel: string }
> = {
  P1: {
    label: "P1 Critical",
    variant: "danger",
    ariaLabel: "Priority 1 - Critical",
  },
  P2: {
    label: "P2 High",
    variant: "warning",
    ariaLabel: "Priority 2 - High",
  },
  P3: {
    label: "P3 Medium",
    variant: "info",
    ariaLabel: "Priority 3 - Medium",
  },
  P4: {
    label: "P4 Low",
    variant: "secondary",
    ariaLabel: "Priority 4 - Low",
  },
};

export const TaskPriorityBadge: React.FC<TaskPriorityBadgeProps> = ({
  priority,
  className,
}) => {
  const config = PRIORITY_CONFIG[priority] || {
    label: priority,
    variant: "default" as BadgeVariant,
    ariaLabel: `Priority ${priority}`,
  };

  return (
    <Badge
      variant={config.variant}
      size="sm"
      dot
      className={className}
      aria-label={config.ariaLabel}
    >
      {config.label}
    </Badge>
  );
};
