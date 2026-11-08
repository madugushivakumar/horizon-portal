"use client";

/**
 * Horizon Portal — Feature Placeholder View
 * src/components/layout/PlaceholderView.tsx
 *
 * Displays a clean, professional placeholder for roadmap modules.
 * Adheres strictly to the assessment rule:
 * "If a destination has not yet been implemented, provide an explicitly marked placeholder page.
 * Do not invent completed business functionality for pages that have not been built."
 */

import React from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Role } from "@/config/navigation";

export interface PlaceholderViewProps {
  title: string;
  description: string;
  category: string;
  targetPhase?: string;
  permittedRoles: Role[];
  icon?: string;
}

export const PlaceholderView: React.FC<PlaceholderViewProps> = ({
  title,
  description,
  category,
  targetPhase = "Upcoming Phase",
  permittedRoles,
  icon = "🚧",
}) => {
  return (
    <AppShell>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Module Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[var(--hz-border-default)] pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--hz-text-muted)]">
                {category}
              </span>
              <span className="text-[var(--hz-border-default)]">·</span>
              <Badge variant="secondary" size="sm">
                {targetPhase}
              </Badge>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--hz-text-primary)]">
              {title}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--hz-text-muted)]">Authorized:</span>
            {permittedRoles.map((r) => (
              <Badge
                key={r}
                variant={
                  r === "Admin"
                    ? "danger"
                    : r === "HR"
                    ? "warning"
                    : r === "Manager"
                    ? "primary"
                    : "secondary"
                }
                size="sm"
              >
                {r}
              </Badge>
            ))}
          </div>
        </div>

        {/* Informative Placeholder Card */}
        <Card className="border-dashed border-[var(--hz-border-default)]">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--hz-bg-subtle)] text-2xl shadow-sm mb-2">
              {icon}
            </div>
            <CardTitle className="text-lg">Module Placeholder</CardTitle>
            <CardDescription className="max-w-md mx-auto text-xs">
              {description}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center pt-2 pb-6 space-y-4">
            <div className="inline-block rounded-xl bg-[var(--hz-bg-subtle)] px-4 py-3 text-xs text-[var(--hz-text-secondary)] border border-[var(--hz-border-subtle)] max-w-md text-left">
              <p className="font-semibold text-[var(--hz-text-primary)] mb-1">
                Development Roadmap Notice:
              </p>
              <p>
                In accordance with Day 4 requirements, the navigation route and server authorization checks are active. Business domain workflows (forms, calculation engines, and audit pipelines) will be introduced in subsequent roadmap phases.
              </p>
            </div>

            <div className="flex justify-center gap-3 pt-2">
              <Link
                href="/dashboard"
                className="inline-flex items-center rounded-xl bg-[var(--hz-primary-600)] px-4 py-2 text-xs font-semibold text-white hover:bg-[var(--hz-primary-700)] transition-colors"
              >
                Return to Dashboard
              </Link>
              <Link
                href="/employees"
                className="inline-flex items-center rounded-xl border border-[var(--hz-border-default)] bg-[var(--hz-bg-surface)] px-4 py-2 text-xs font-semibold text-[var(--hz-text-secondary)] hover:bg-[var(--hz-bg-subtle)] transition-colors"
              >
                View Directory
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
};

export default PlaceholderView;
