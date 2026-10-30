"use client";

import React, { useState } from "react";
import { LeaveApprovalQueue } from "@/components/approvals/LeaveApprovalQueue";
import { TeamAttendanceOverview } from "@/components/team/TeamAttendanceOverview";

export default function LeaveManagementPage() {
  const [activeTab, setActiveTab] = useState<"approvals" | "attendance">("approvals");

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl space-y-6">
      {/* Top Selector for HR */}
      <div className="flex items-center gap-3 border-b border-[var(--hz-border)] pb-3">
        <button
          onClick={() => setActiveTab("approvals")}
          className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${
            activeTab === "approvals"
              ? "bg-[var(--hz-primary)] text-white shadow-xs"
              : "bg-[var(--hz-card-bg)] text-[var(--hz-text-secondary)] hover:text-[var(--hz-text-primary)] border border-[var(--hz-border)]"
          }`}
        >
          ✓ Leave Approvals & Workflow Queue
        </button>
        <button
          onClick={() => setActiveTab("attendance")}
          className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${
            activeTab === "attendance"
              ? "bg-[var(--hz-primary)] text-white shadow-xs"
              : "bg-[var(--hz-card-bg)] text-[var(--hz-text-secondary)] hover:text-[var(--hz-text-primary)] border border-[var(--hz-border)]"
          }`}
        >
          📊 Organization Attendance Oversight
        </button>
      </div>

      {activeTab === "approvals" ? (
        <LeaveApprovalQueue />
      ) : (
        <TeamAttendanceOverview />
      )}
    </div>
  );
}
