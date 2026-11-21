"use client";

import React from "react";
import Link from "next/link";
import { TeamAttendanceOverview } from "@/components/team/TeamAttendanceOverview";

export default function TeamPage() {
  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl space-y-6">
      <div className="flex items-center justify-between border-b border-[var(--hz-border)] pb-3">
        <div>
          <h2 className="text-xl font-bold text-[var(--hz-text-primary)]">
            Team Management & Oversight
          </h2>
          <p className="text-xs text-[var(--hz-text-secondary)]">
            Overview of direct reports, monthly attendance distribution, and pending workflow approvals.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/approvals"
            className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-[var(--hz-primary)] text-white hover:opacity-90 transition-opacity"
          >
            Review Team Approvals →
          </Link>
        </div>
      </div>

      <TeamAttendanceOverview />
    </div>
  );
}
