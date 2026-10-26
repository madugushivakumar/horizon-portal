"use client";

import React, { useState, useEffect } from "react";
import { LeaveBalanceItem, LeaveRequestItem, AttendanceSummary } from "@/types/leave";
import { LeaveBalanceCards } from "@/components/leave/LeaveBalanceCards";
import { ApplyLeaveForm } from "@/components/leave/ApplyLeaveForm";
import { LeaveRequestHistory } from "@/components/leave/LeaveRequestHistory";
import { LeaveMonthCalendar } from "@/components/leave/LeaveMonthCalendar";
import { AttendanceSummaryCard } from "@/components/leave/AttendanceSummaryCard";

interface LeaveSelfServiceDashboardProps {
  userName?: string;
  employeeId?: string;
}

export function LeaveSelfServiceDashboard({
  userName = "Employee",
  employeeId = "",
}: LeaveSelfServiceDashboardProps) {
  const [balances, setBalances] = useState<LeaveBalanceItem[]>([]);
  const [requests, setRequests] = useState<LeaveRequestItem[]>([]);
  const [attendance, setAttendance] = useState<AttendanceSummary | null>(null);
  const [financialYear, setFinancialYear] = useState<string>("FY2026-27");

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshCount, setRefreshCount] = useState<number>(0);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const [balRes, reqRes, attRes] = await Promise.all([
          fetch("/api/v1/leave/balances"),
          fetch("/api/v1/leave/requests"),
          fetch("/api/v1/attendance/summary"),
        ]);

        if (ignore) return;

        if (balRes.ok) {
          const balJson = await balRes.json();
          setBalances(balJson.data.balances || []);
          if (balJson.data.financialYear) {
            setFinancialYear(balJson.data.financialYear);
          }
        }

        if (reqRes.ok) {
          const reqJson = await reqRes.json();
          setRequests(reqJson.data || []);
        }

        if (attRes.ok) {
          const attJson = await attRes.json();
          setAttendance(attJson.data || null);
        }
      } catch (err) {
        console.error("Error loading leave dashboard data:", err);
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    load();
    return () => {
      ignore = true;
    };
  }, [refreshCount]);

  const handleLeaveSubmitted = () => {
    setRefreshCount((prev) => prev + 1);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-[var(--hz-border-subtle)]">
        <div>
          <h1 className="text-2xl font-extrabold text-[var(--hz-text-title)] tracking-tight">
            Leave &amp; Attendance Self-Service
          </h1>
          <p className="text-xs text-[var(--hz-text-muted)] mt-1">
            Welcome back, <span className="font-semibold text-[var(--hz-text-body)]">{userName}</span>
            {employeeId && ` (${employeeId})`}. View balances, apply for time-off, and track monthly attendance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-[var(--hz-primary-50)] dark:bg-[var(--hz-primary-950)] text-[var(--hz-primary-700)] dark:text-[var(--hz-primary-300)] border border-[var(--hz-primary-200)]">
            {financialYear}
          </span>
        </div>
      </div>

      {/* Section A: Leave Balance Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-[var(--hz-text-title)] uppercase tracking-wider">
            Available Time-Off Balances
          </h2>
          <span className="text-xs text-[var(--hz-text-muted)]">
            Accruals updated as of current period
          </span>
        </div>
        <LeaveBalanceCards balances={balances} loading={loading} />
      </div>

      {/* Two Column Workspace: Form on Left, Attendance on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-6">
          <ApplyLeaveForm balances={balances} onSuccess={handleLeaveSubmitted} />
        </div>
        <div className="lg:col-span-6">
          <AttendanceSummaryCard attendance={attendance} loading={loading} />
        </div>
      </div>

      {/* Section D: Monthly Calendar */}
      <div>
        <LeaveMonthCalendar refreshTrigger={refreshCount} />
      </div>

      {/* Section C: Leave Request History */}
      <div>
        <LeaveRequestHistory requests={requests} loading={loading} />
      </div>
    </div>
  );
}
