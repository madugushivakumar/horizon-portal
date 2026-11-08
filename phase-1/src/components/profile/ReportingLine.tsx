"use client";

/**
 * Horizon Portal — Organizational Reporting Line Component
 * src/components/profile/ReportingLine.tsx
 *
 * Implements the required 3-tier organizational hierarchy:
 * 1. Manager (Above the employee)
 * 2. Selected Employee (Center / Active focus)
 * 3. Direct Reports (Below the employee)
 *
 * Safe: Strictly excludes salary and private data.
 * Resilient: Handles employees without managers (executives) and without direct reports (ICs).
 */

import React from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { SafeManager, SafeDirectReport, SafeRole, SafeDepartment } from "@/types/employee";

export interface ReportingLineProps {
  currentEmployee: {
    id: string;
    name: string;
    role?: SafeRole | null;
    department?: SafeDepartment | null;
  };
  manager: SafeManager | null;
  directReports: SafeDirectReport[];
}

export const ReportingLine: React.FC<ReportingLineProps> = ({
  currentEmployee,
  manager,
  directReports = [],
}) => {
  return (
    <Card className="border-[var(--hz-border-default)]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base sm:text-lg">Organizational Reporting Line</CardTitle>
            <p className="mt-1 text-xs text-[var(--hz-text-muted)]">
              Official reporting structure established in the company personnel directory.
            </p>
          </div>
          <Badge variant="secondary" size="sm">
            {directReports.length} Direct Report{directReports.length === 1 ? "" : "s"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-2">
        {/* ── 1. Manager Section (Above) ────────────────────────── */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--hz-text-muted)]">
              Level 1 · Reports To (Direct Manager)
            </span>
          </div>

          {manager ? (
            <Link
              href={`/people/${manager.id}`}
              className="group block rounded-2xl border border-[var(--hz-border-default)] bg-[var(--hz-bg-surface)] p-4 shadow-sm hover:border-[var(--hz-primary-500)] hover:bg-[var(--hz-bg-subtle)] transition-all focus-visible:outline-2 focus-visible:outline-[var(--hz-primary-500)]"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <Avatar name={manager.name} id={manager.id} size="md" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-[var(--hz-text-primary)] group-hover:text-[var(--hz-primary-600)] transition-colors">
                        {manager.name}
                      </span>
                      <span className="text-xs font-mono text-[var(--hz-text-muted)]">
                        ({manager.id})
                      </span>
                    </div>
                    <p className="text-xs text-[var(--hz-text-muted)] mt-0.5">
                      {manager.role?.name || "Manager"} · {manager.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="primary" size="sm">
                    Manager
                  </Badge>
                  <svg className="h-4 w-4 text-[var(--hz-text-muted)] group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          ) : (
            <div className="flex items-center gap-3 rounded-2xl border border-dashed border-[var(--hz-border-default)] bg-[var(--hz-bg-subtle)]/40 p-4 text-xs text-[var(--hz-text-muted)]">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600">
                👑
              </div>
              <div>
                <span className="font-semibold text-[var(--hz-text-primary)]">
                  Executive Leadership (No Direct Manager)
                </span>
                <p className="mt-0.5">
                  This employee operates at the executive governance tier and reports directly to the Board of Directors.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── Hierarchy Downward Connector ─────────────────────── */}
        <div className="flex justify-center my-1" aria-hidden="true">
          <div className="flex flex-col items-center">
            <div className="h-4 w-0.5 bg-[var(--hz-primary-500)]/40" />
            <svg className="h-4 w-4 text-[var(--hz-primary-500)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>

        {/* ── 2. Selected Employee (Center / Focus) ──────────────── */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--hz-primary-600)] dark:text-[var(--hz-primary-400)]">
              Level 2 · Current Employee Profile
            </span>
          </div>

          <div className="rounded-2xl border-2 border-[var(--hz-primary-500)] bg-[var(--hz-primary-50)]/40 dark:bg-[var(--hz-primary-950)]/30 p-4 shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <Avatar name={currentEmployee.name} id={currentEmployee.id} size="md" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-extrabold text-[var(--hz-text-primary)]">
                      {currentEmployee.name}
                    </span>
                    <span className="text-xs font-mono font-semibold text-[var(--hz-primary-600)] dark:text-[var(--hz-primary-400)]">
                      ({currentEmployee.id})
                    </span>
                  </div>
                  <p className="text-xs text-[var(--hz-text-secondary)] mt-0.5 font-medium">
                    {currentEmployee.role?.name || "Staff"} · {currentEmployee.department?.name || "General"}
                  </p>
                </div>
              </div>

              <Badge variant="primary" size="sm">
                Selected
              </Badge>
            </div>
          </div>
        </div>

        {/* ── Hierarchy Downward Connector ─────────────────────── */}
        <div className="flex justify-center my-1" aria-hidden="true">
          <div className="flex flex-col items-center">
            <div className="h-4 w-0.5 bg-[var(--hz-primary-500)]/40" />
            <svg className="h-4 w-4 text-[var(--hz-primary-500)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>

        {/* ── 3. Direct Reports Section (Below) ────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--hz-text-muted)]">
              Level 3 · Direct Reports ({directReports.length})
            </span>
          </div>

          {directReports.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {directReports.map((report) => (
                <Link
                  key={report.id}
                  href={`/people/${report.id}`}
                  className="group rounded-xl border border-[var(--hz-border-default)] bg-[var(--hz-bg-surface)] p-3 hover:border-[var(--hz-primary-500)] hover:bg-[var(--hz-bg-subtle)] transition-all flex items-center justify-between focus-visible:outline-2 focus-visible:outline-[var(--hz-primary-500)]"
                >
                  <div className="flex items-center gap-3">
                    <Avatar name={report.name} id={report.id} size="sm" />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-[var(--hz-text-primary)] group-hover:text-[var(--hz-primary-600)] transition-colors">
                          {report.name}
                        </span>
                        <span className="text-[10px] font-mono text-[var(--hz-text-muted)]">
                          {report.id}
                        </span>
                      </div>
                      <p className="text-[11px] text-[var(--hz-text-muted)]">
                        {report.role?.name || "Direct Report"}
                      </p>
                    </div>
                  </div>

                  <svg className="h-4 w-4 text-[var(--hz-text-muted)] group-hover:translate-x-0.5 transition-transform shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-2xl border border-dashed border-[var(--hz-border-default)] bg-[var(--hz-bg-subtle)]/30 p-4 text-xs text-[var(--hz-text-muted)]">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500">
                👤
              </div>
              <div>
                <span className="font-semibold text-[var(--hz-text-primary)]">
                  Individual Contributor (No Direct Reports)
                </span>
                <p className="mt-0.5">
                  This employee focuses on core operational responsibilities with zero subordinate personnel assigned.
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ReportingLine;
