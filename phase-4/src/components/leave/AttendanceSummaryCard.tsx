"use client";

import React from "react";
import { AttendanceSummary } from "@/types/leave";

interface AttendanceSummaryCardProps {
  attendance: AttendanceSummary | null;
  loading?: boolean;
}

export function AttendanceSummaryCard({ attendance, loading }: AttendanceSummaryCardProps) {
  if (loading) {
    return (
      <div className="bg-[var(--hz-surface-card)] rounded-xl border border-[var(--hz-border-subtle)] p-6 space-y-4 animate-pulse">
        <div className="h-5 bg-[var(--hz-neutral-200)] rounded w-1/3"></div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-14 bg-[var(--hz-neutral-100)] rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!attendance) {
    return (
      <div className="bg-[var(--hz-surface-card)] rounded-xl border border-[var(--hz-border-subtle)] p-6 shadow-xs">
        <h3 className="text-base font-bold text-[var(--hz-text-title)] mb-1">
          Monthly Attendance Summary
        </h3>
        <p className="text-xs text-[var(--hz-text-muted)] mb-4">
          Verified timesheet metrics from Aura Attendance engine.
        </p>
        <div className="text-center py-6 border border-dashed border-[var(--hz-border-subtle)] rounded-lg">
          <p className="text-xs text-[var(--hz-text-muted)]">
            No monthly attendance records currently on file for your profile.
          </p>
        </div>
      </div>
    );
  }

  const ratePercent = Math.round(attendance.attendanceRate * 100);

  return (
    <div className="bg-[var(--hz-surface-card)] rounded-xl border border-[var(--hz-border-subtle)] p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
        <div>
          <h3 className="text-base font-bold text-[var(--hz-text-title)]">
            Latest Monthly Attendance Summary
          </h3>
          <p className="text-xs text-[var(--hz-text-muted)]">
            Period Ending: <span className="font-semibold text-[var(--hz-text-body)]">{attendance.periodEndDate}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[var(--hz-text-muted)]">
            Attendance Rate:
          </span>
          <span className="text-sm font-extrabold px-2.5 py-0.5 rounded-full bg-[var(--hz-success-50)] text-[var(--hz-success-700)] border border-[var(--hz-success-200)]">
            {ratePercent}%
          </span>
        </div>
      </div>

      {/* Grid of Key Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="bg-[var(--hz-surface-elevated)] p-3 rounded-lg border border-[var(--hz-border-subtle)]">
          <span className="block text-[10px] uppercase font-bold text-[var(--hz-text-muted)]">
            Scheduled Days
          </span>
          <span className="text-xl font-bold text-[var(--hz-text-title)]">
            {attendance.scheduledDays}
          </span>
        </div>

        <div className="bg-[var(--hz-surface-elevated)] p-3 rounded-lg border border-[var(--hz-border-subtle)]">
          <span className="block text-[10px] uppercase font-bold text-[var(--hz-text-muted)]">
            Present Days
          </span>
          <span className="text-xl font-bold text-[var(--hz-success-600)]">
            {attendance.presentDays}
          </span>
        </div>

        <div className="bg-[var(--hz-surface-elevated)] p-3 rounded-lg border border-[var(--hz-border-subtle)]">
          <span className="block text-[10px] uppercase font-bold text-[var(--hz-text-muted)]">
            WFH Days
          </span>
          <span className="text-xl font-bold text-[var(--hz-primary-600)]">
            {attendance.wfhDays}
          </span>
        </div>

        <div className="bg-[var(--hz-surface-elevated)] p-3 rounded-lg border border-[var(--hz-border-subtle)]">
          <span className="block text-[10px] uppercase font-bold text-[var(--hz-text-muted)]">
            Avg Daily Hours
          </span>
          <span className="text-xl font-bold text-[var(--hz-text-title)]">
            {attendance.avgHoursWorked} hrs
          </span>
        </div>
      </div>

      {/* Secondary Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-[var(--hz-text-muted)] pt-3 border-t border-[var(--hz-border-subtle)]">
        <div>
          <span>Paid Leaves:</span>{" "}
          <strong className="text-[var(--hz-text-body)]">{attendance.paidLeaveDays}d</strong>
        </div>
        <div>
          <span>Unpaid Absences:</span>{" "}
          <strong className="text-[var(--hz-text-body)]">{attendance.unpaidAbsenceDays}d</strong>
        </div>
        <div>
          <span>Late Arrivals:</span>{" "}
          <strong className="text-[var(--hz-text-body)]">{attendance.lateArrivals}</strong>
        </div>
        <div>
          <span>Overtime Hours:</span>{" "}
          <strong className="text-[var(--hz-text-body)]">{attendance.overtimeHours} hrs</strong>
        </div>
      </div>
    </div>
  );
}
