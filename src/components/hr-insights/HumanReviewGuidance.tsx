"use client";

/**
 * Horizon Portal — Human Review & Responsible AI Guidance
 * src/components/hr-insights/HumanReviewGuidance.tsx
 *
 * Authoritative guidance section for HR leaders:
 * - Emphasizes advisory nature and non-determinative bounds
 * - Prohibits automated adverse employment outcomes (termination, discipline, compensation)
 * - Highlights supportive review areas (workload, career growth, manager support)
 * - Details anti-bias and privacy safeguards
 */

import React from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface HumanReviewGuidanceProps {
  className?: string;
}

export const HumanReviewGuidance: React.FC<HumanReviewGuidanceProps> = ({
  className,
}) => {
  return (
    <Card
      elevation="raised"
      padding="md"
      className={cn(
        "border border-blue-200/80 bg-blue-50/30 dark:border-blue-900/40 dark:bg-blue-950/20 space-y-4",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
        </div>

        <div className="space-y-1">
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            How HR should use these insights
          </h3>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
            These analytics are machine-learning statistical estimates designed to help People teams identify systemic workforce risks. They must always be contextualized with human judgment.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1 text-xs">
        {/* Core Principles */}
        <div className="space-y-2 rounded-xl bg-white/70 dark:bg-zinc-900/70 p-4 border border-blue-100 dark:border-blue-900/30">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
            Core Governance Principles
          </h4>
          <ul className="space-y-1.5 text-zinc-600 dark:text-zinc-400 pl-4 list-disc leading-relaxed">
            <li>
              <strong>Advisory Nature:</strong> AI predictions represent likelihoods based on historical distributions, never verified facts.
            </li>
            <li>
              <strong>Mandatory Human Validation:</strong> Never take adverse personnel action (termination, PIP, discipline, or salary withholding) based on an AI score alone.
            </li>
            <li>
              <strong>No Individual Retaliation:</strong> Model outputs must never be used punitively or shared with colleagues.
            </li>
            <li>
              <strong>Privacy Integrity:</strong> Individual attrition scores remain suppressed to protect employee confidentiality.
            </li>
          </ul>
        </div>

        {/* Recommended Supportive Actions */}
        <div className="space-y-2 rounded-xl bg-white/70 dark:bg-zinc-900/70 p-4 border border-blue-100 dark:border-blue-900/30">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
            Recommended Supportive Interventions
          </h4>
          <ul className="space-y-1.5 text-zinc-600 dark:text-zinc-400 pl-4 list-disc leading-relaxed">
            <li>
              <strong>Workload &amp; Bandwidth:</strong> Review sprint velocity and overtime hours to mitigate burnout risks.
            </li>
            <li>
              <strong>Career Progression:</strong> Verify that employees in long-tenure brackets have active growth and compensation reviews.
            </li>
            <li>
              <strong>Manager Enablement:</strong> Partner with team leads to conduct empathetic, open-ended 1-on-1 check-ins.
            </li>
            <li>
              <strong>Payroll Reconciliation:</strong> Audit flagged attendance and overtime hours alongside timesheet records before approval.
            </li>
          </ul>
        </div>
      </div>
    </Card>
  );
};
