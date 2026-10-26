"use client";

import React, { useState } from "react";
import { LeaveRequestItem } from "@/types/leave";

interface LeaveRequestHistoryProps {
  requests: LeaveRequestItem[];
  loading?: boolean;
}

export function LeaveRequestHistory({ requests, loading }: LeaveRequestHistoryProps) {
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  if (loading) {
    return (
      <div className="bg-[var(--hz-surface-card)] rounded-xl border border-[var(--hz-border-subtle)] p-6 space-y-4">
        <div className="h-5 bg-[var(--hz-neutral-200)] rounded w-1/4 animate-pulse"></div>
        <div className="space-y-2">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-12 bg-[var(--hz-neutral-100)] rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  const filtered = requests.filter((r) => {
    if (filterStatus === "ALL") return true;
    return r.status.toLowerCase() === filterStatus.toLowerCase();
  });

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s === "approved") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[var(--hz-success-50)] text-[var(--hz-success-700)] border border-[var(--hz-success-200)]">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--hz-success-500)]"></span>
          Approved
        </span>
      );
    }
    if (s === "pending") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[var(--hz-warning-50)] text-[var(--hz-warning-700)] border border-[var(--hz-warning-200)]">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--hz-warning-500)]"></span>
          Pending
        </span>
      );
    }
    if (s === "rejected") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[var(--hz-danger-50)] text-[var(--hz-danger-700)] border border-[var(--hz-danger-200)]">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--hz-danger-500)]"></span>
          Rejected
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[var(--hz-neutral-100)] text-[var(--hz-neutral-700)] border border-[var(--hz-neutral-200)]">
        {status}
      </span>
    );
  };

  return (
    <div className="bg-[var(--hz-surface-card)] rounded-xl border border-[var(--hz-border-subtle)] p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base font-bold text-[var(--hz-text-title)]">
            Leave Request History
          </h3>
          <p className="text-xs text-[var(--hz-text-muted)]">
            Review past submissions and pending manager decisions.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 bg-[var(--hz-neutral-100)] dark:bg-[var(--hz-neutral-900)] p-1 rounded-lg">
          {["ALL", "Pending", "Approved", "Rejected"].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                filterStatus === s
                  ? "bg-[var(--hz-surface-card)] text-[var(--hz-primary-600)] shadow-xs"
                  : "text-[var(--hz-text-muted)] hover:text-[var(--hz-text-body)]"
              }`}
            >
              {s === "ALL" ? "All Requests" : s}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-10 border border-dashed border-[var(--hz-border-subtle)] rounded-lg">
          <span className="text-3xl mb-2 block">📋</span>
          <p className="text-xs font-medium text-[var(--hz-text-muted)]">
            No leave requests found for the selected filter.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[var(--hz-border-subtle)] text-[var(--hz-text-muted)] font-semibold">
                <th className="pb-3 pr-4">Category</th>
                <th className="pb-3 px-4">Date Range</th>
                <th className="pb-3 px-4">Duration</th>
                <th className="pb-3 px-4">Reason</th>
                <th className="pb-3 px-4">Applied On</th>
                <th className="pb-3 pl-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--hz-border-subtle)]">
              {filtered.map((req) => (
                <tr key={req.id} className="hover:bg-[var(--hz-surface-elevated)] transition-colors">
                  <td className="py-3 pr-4 font-semibold text-[var(--hz-text-title)]">
                    <span className="mr-2 inline-block px-1.5 py-0.5 rounded text-[10px] bg-[var(--hz-primary-50)] dark:bg-[var(--hz-primary-950)] text-[var(--hz-primary-700)] border border-[var(--hz-primary-200)]">
                      {req.leaveTypeCode}
                    </span>
                    {req.leaveTypeName}
                  </td>
                  <td className="py-3 px-4 text-[var(--hz-text-body)] font-medium">
                    {req.startDate} <span className="text-[var(--hz-text-muted)]">&rarr;</span> {req.endDate}
                  </td>
                  <td className="py-3 px-4 text-[var(--hz-text-body)] font-semibold">
                    {req.days} day{req.days !== 1 ? "s" : ""}
                  </td>
                  <td className="py-3 px-4 text-[var(--hz-text-muted)] max-w-xs truncate" title={req.reason || ""}>
                    {req.reason || "—"}
                  </td>
                  <td className="py-3 px-4 text-[var(--hz-text-muted)]">
                    {req.appliedOn || "—"}
                  </td>
                  <td className="py-3 pl-4 text-right">
                    {getStatusBadge(req.status)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
