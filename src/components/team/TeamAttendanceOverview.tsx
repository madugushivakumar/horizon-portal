"use client";

/**
 * Horizon Portal — Team Attendance Oversight Component
 * src/components/team/TeamAttendanceOverview.tsx
 *
 * Full-stack team attendance oversight dashboard for Managers and HR:
 * - Month and year selector across historical attendance periods
 * - Scoped visibility: Managers only see authorized team members; HR/Admin see organization-wide
 * - Summary cards: Total Employees, Present, On Leave, Absence Recorded, Average Attendance Rate
 * - Employee search, department filter, and attendance status filter
 * - Detailed monthly breakdown: Scheduled, Present, WFH, Paid Leave, Unpaid Absence, Late Arrivals
 * - Explanatory legend: Approved leave recognized correctly; missing data distinguished from absences
 */

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";

export interface AttendanceRow {
  employeeId: string;
  employeeName: string;
  departmentId: string | null;
  departmentName: string;
  hasRecord: boolean;
  scheduledDays: number;
  presentDays: number;
  wfhDays: number;
  paidLeaveDays: number;
  unpaidAbsenceDays: number;
  lateArrivals: number;
  avgHoursWorked: number;
  attendanceRate: number;
  attendancePercentage: number;
  attendanceStatus: string;
}

interface PeriodOption {
  value: string;
  label: string;
  year: number;
  month: number;
}

interface AttendanceSummary {
  totalEmployees: number;
  recordedEmployees: number;
  presentCount: number;
  onLeaveCount: number;
  absentCount: number;
  avgAttendanceRate: number;
}

export function TeamAttendanceOverview() {
  const [rows, setRows] = useState<AttendanceRow[]>([]);
  const [summary, setSummary] = useState<AttendanceSummary>({
    totalEmployees: 0,
    recordedEmployees: 0,
    presentCount: 0,
    onLeaveCount: 0,
    absentCount: 0,
    avgAttendanceRate: 0,
  });
  const [availablePeriods, setAvailablePeriods] = useState<PeriodOption[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>("2026-09-30");

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [selectedDept, setSelectedDept] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [departments, setDepartments] = useState<Array<{ id: string; name: string }>>([]);

  // Search debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Load departments
  useEffect(() => {
    fetch("/api/v1/departments")
      .then((res) => res.json())
      .then((json) => {
        if (json.data && Array.isArray(json.data)) {
          setDepartments(json.data);
        }
      })
      .catch(() => { });
  }, []);

  // Fetch Attendance
  const fetchAttendance = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (selectedPeriod) {
        params.set("month", selectedPeriod);
      }
      if (selectedDept !== "all") {
        params.set("department", selectedDept);
      }
      if (debouncedSearch.trim()) {
        params.set("search", debouncedSearch.trim());
      }
      if (statusFilter !== "All") {
        params.set("status", statusFilter);
      }

      const res = await fetch(`/api/v1/team/attendance?${params.toString()}`);
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || `HTTP ${res.status}: Failed to load team attendance.`);
      }

      setRows(json.data || []);
      if (json.summary) setSummary(json.summary);
      if (json.availablePeriods && json.availablePeriods.length > 0) {
        setAvailablePeriods(json.availablePeriods);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error loading attendance data.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod, selectedDept, debouncedSearch, statusFilter]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  // Render status badge
  const renderAttendanceStatus = (status: string) => {
    switch (status) {
      case "Excellent":
        return (
          <Badge variant="success" dot size="sm">
            Excellent (≥95%)
          </Badge>
        );
      case "On Leave":
        return (
          <Badge variant="info" dot size="sm">
            On Leave
          </Badge>
        );
      case "Absence Recorded":
        return (
          <Badge variant="danger" dot size="sm">
            Absence Recorded
          </Badge>
        );
      case "Low Attendance":
        return (
          <Badge variant="warning" dot size="sm">
            Low Attendance
          </Badge>
        );
      case "No Record":
        return (
          <Badge variant="secondary" size="sm">
            No Record
          </Badge>
        );
      default:
        return (
          <Badge variant="default" size="sm">
            {status}
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--hz-text-primary)]">
            Team Attendance Oversight
          </h1>
          <p className="text-sm text-[var(--hz-text-secondary)] mt-1">
            Monitor monthly team attendance, verified working days, and approved leave distributions.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            href="/approvals"
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-[var(--hz-card-bg)] hover:bg-[var(--hz-card-hover)] border border-[var(--hz-border)] text-[var(--hz-text-primary)] transition-colors shadow-sm"
          >
            <span>✓</span>
            <span>Leave Approvals</span>
          </Link>
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchAttendance}
            loading={loading}
          >
            ↻ Refresh
          </Button>
        </div>
      </div>

      {/* Summary Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="p-4 rounded-xl border border-[var(--hz-border)] bg-[var(--hz-card-bg)] shadow-xs">
          <div className="text-xs font-medium text-[var(--hz-text-secondary)] uppercase tracking-wider">
            Total In Scope
          </div>
          <div className="mt-2 text-2xl font-bold text-[var(--hz-text-primary)]">
            {summary.totalEmployees}
          </div>
          <div className="text-[11px] text-[var(--hz-text-secondary)] mt-1">
            {summary.recordedEmployees} with records
          </div>
        </div>

        <div className="p-4 rounded-xl border border-[var(--hz-border)] bg-[var(--hz-card-bg)] shadow-xs">
          <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            Present
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {summary.presentCount}
          </div>
          <div className="text-[11px] text-[var(--hz-text-secondary)] mt-1">
            Full or hybrid attendance
          </div>
        </div>

        <div className="p-4 rounded-xl border border-[var(--hz-border)] bg-[var(--hz-card-bg)] shadow-xs">
          <div className="text-xs font-medium text-sky-600 dark:text-sky-400 uppercase tracking-wider">
            On Leave
          </div>
          <div className="mt-2 text-2xl font-bold text-sky-600 dark:text-sky-400">
            {summary.onLeaveCount}
          </div>
          <div className="text-[11px] text-[var(--hz-text-secondary)] mt-1">
            Approved statutory leave
          </div>
        </div>

        <div className="p-4 rounded-xl border border-[var(--hz-border)] bg-[var(--hz-card-bg)] shadow-xs">
          <div className="text-xs font-medium text-rose-600 dark:text-rose-400 uppercase tracking-wider">
            Absence Recorded
          </div>
          <div className="mt-2 text-2xl font-bold text-rose-600 dark:text-rose-400">
            {summary.absentCount}
          </div>
          <div className="text-[11px] text-[var(--hz-text-secondary)] mt-1">
            Unpaid absence days
          </div>
        </div>

        <div className="p-4 rounded-xl border border-[var(--hz-border)] bg-[var(--hz-card-bg)] shadow-xs">
          <div className="text-xs font-medium text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
            Avg Attendance Rate
          </div>
          <div className="mt-2 text-2xl font-bold text-indigo-600 dark:text-indigo-400">
            {summary.avgAttendanceRate}%
          </div>
          <div className="text-[11px] text-[var(--hz-text-secondary)] mt-1">
            Across team roster
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="p-5 rounded-2xl border border-[var(--hz-border)] bg-[var(--hz-card-bg)] shadow-xs space-y-4">
        {/* Controls Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Month Selector */}
          <div>
            <label className="block text-[11px] font-semibold text-[var(--hz-text-secondary)] uppercase tracking-wider mb-1">
              Attendance Period
            </label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--hz-border)] bg-[var(--hz-input-bg)] text-[var(--hz-text-primary)] font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--hz-primary-300)]"
            >
              {availablePeriods.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label} (Cutoff: {p.value})
                </option>
              ))}
              {availablePeriods.length === 0 && (
                <option value="2026-09-30">Sep 2026 (2026-09-30)</option>
              )}
            </select>
          </div>

          {/* Search */}
          <div>
            <label className="block text-[11px] font-semibold text-[var(--hz-text-secondary)] uppercase tracking-wider mb-1">
              Search Employee
            </label>
            <input
              type="text"
              placeholder="Name or Employee ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--hz-border)] bg-[var(--hz-input-bg)] text-[var(--hz-text-primary)] placeholder-[var(--hz-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--hz-primary-300)]"
            />
          </div>

          {/* Department Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-[var(--hz-text-secondary)] uppercase tracking-wider mb-1">
              Department
            </label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--hz-border)] bg-[var(--hz-input-bg)] text-[var(--hz-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--hz-primary-300)]"
            >
              <option value="all">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.id})
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-[var(--hz-text-secondary)] uppercase tracking-wider mb-1">
              Attendance Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--hz-border)] bg-[var(--hz-input-bg)] text-[var(--hz-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--hz-primary-300)]"
            >
              <option value="All">All Statuses</option>
              <option value="Excellent">Excellent (≥95%)</option>
              <option value="On Leave">On Leave</option>
              <option value="Absence Recorded">Absence Recorded</option>
              <option value="Low Attendance">Low Attendance (&lt;80%)</option>
              <option value="No Record">No Record</option>
            </select>
          </div>
        </div>

        {/* Attendance Table */}
        <div className="overflow-x-auto rounded-xl border border-[var(--hz-border)]">
          <table className="w-full text-left text-xs">
            <thead className="bg-[var(--hz-table-header-bg)] text-[var(--hz-text-secondary)] font-semibold border-b border-[var(--hz-border)]">
              <tr>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-3 text-center">Scheduled</th>
                <th className="py-3 px-3 text-center">Present</th>
                <th className="py-3 px-3 text-center">WFH</th>
                <th className="py-3 px-3 text-center">Paid Leave</th>
                <th className="py-3 px-3 text-center">Late</th>
                <th className="py-3 px-3 text-center">Absence</th>
                <th className="py-3 px-4 text-center">Rate</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--hz-border)]">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-sm text-[var(--hz-text-secondary)]">
                    <div className="inline-block animate-spin text-lg mb-2">↻</div>
                    <div>Loading attendance data...</div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-sm text-rose-600">
                    <div>⚠️ {error}</div>
                    <Button variant="secondary" size="sm" onClick={fetchAttendance} className="mt-3">
                      Try Again
                    </Button>
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-16 text-center text-[var(--hz-text-secondary)]">
                    <div className="text-3xl mb-2">📊</div>
                    <div className="font-semibold text-sm text-[var(--hz-text-primary)]">
                      No attendance records found
                    </div>
                    <div className="text-xs mt-1">
                      No employees match the selected month and filter criteria.
                    </div>
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr
                    key={row.employeeId}
                    className="hover:bg-[var(--hz-table-row-hover)] transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <Avatar
                          name={row.employeeName}
                          id={row.employeeId}
                          size="sm"
                        />
                        <div>
                          <div className="font-semibold text-xs text-[var(--hz-text-primary)]">
                            {row.employeeName}
                          </div>
                          <div className="text-[11px] text-[var(--hz-text-secondary)] font-mono">
                            {row.employeeId}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-[var(--hz-text-secondary)]">
                      {row.departmentName}
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-[var(--hz-text-primary)]">
                      {row.hasRecord ? row.scheduledDays : "—"}
                    </td>
                    <td className="py-3 px-3 text-center text-emerald-600 dark:text-emerald-400 font-semibold">
                      {row.hasRecord ? row.presentDays : "—"}
                    </td>
                    <td className="py-3 px-3 text-center text-indigo-600 dark:text-indigo-400">
                      {row.hasRecord ? row.wfhDays : "—"}
                    </td>
                    <td className="py-3 px-3 text-center text-sky-600 dark:text-sky-400 font-semibold">
                      {row.hasRecord ? row.paidLeaveDays : "—"}
                    </td>
                    <td className="py-3 px-3 text-center text-amber-600 dark:text-amber-400">
                      {row.hasRecord ? row.lateArrivals : "—"}
                    </td>
                    <td className="py-3 px-3 text-center text-rose-600 dark:text-rose-400 font-semibold">
                      {row.hasRecord ? row.unpaidAbsenceDays : "—"}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {row.hasRecord ? (
                        <div className="inline-flex items-center gap-2">
                          <div className="w-16 bg-gray-200 dark:bg-gray-800 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${row.attendancePercentage >= 95
                                  ? "bg-emerald-500"
                                  : row.attendancePercentage >= 80
                                    ? "bg-sky-500"
                                    : "bg-rose-500"
                                }`}
                              style={{ width: `${Math.min(row.attendancePercentage, 100)}%` }}
                            />
                          </div>
                          <span className="font-mono text-xs font-semibold text-[var(--hz-text-primary)]">
                            {row.attendancePercentage}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-[var(--hz-text-secondary)]">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {renderAttendanceStatus(row.attendanceStatus)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Explanatory Policy Callout */}
        <div className="p-3.5 rounded-xl border border-[var(--hz-border)] bg-[var(--hz-table-header-bg)] text-[11px] text-[var(--hz-text-secondary)] space-y-1">
          <div className="font-semibold text-[var(--hz-text-primary)] flex items-center gap-1.5">
            <span>ℹ️</span> Attendance Policy & Calculation Integrity
          </div>
          <div>
            • <strong>Approved Leave:</strong> Statutory paid leave is recognized as authorized time-off and is never marked as an unexcused absence.
          </div>
          <div>
            • <strong>Missing Data Integrity:</strong> Employees without an active attendance log for the selected month are labeled &ldquo;No Record&rdquo; rather than falsely presumed absent.
          </div>
        </div>
      </div>
    </div>
  );
}
