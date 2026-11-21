"use client";

/**
 * Horizon Portal — Leave & Attendance Self-Service Page
 * src/app/leave/page.tsx
 *
 * Implements Phase 2 Day 6:
 * - Real-time leave balance cards (CL, SL, EL, etc.)
 * - Apply-for-leave interactive form with live validation
 * - Personal leave request history with status badges
 * - Monthly time-off calendar highlighting holidays & approved leaves
 * - Monthly timesheet attendance summary
 */

import React, { useEffect, useState, Suspense } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { TopBarUser } from "@/components/layout/TopBar";
import { LeaveSelfServiceDashboard } from "./LeaveSelfServiceDashboard";

function LeavePageContent() {
  const [currentUser, setCurrentUser] = useState<TopBarUser | null>(null);

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch("/api/v1/auth/me");
        if (res.ok) {
          const data = await res.json();
          setCurrentUser(data.user);
        }
      } catch {
        // Handled by AppShell fallback
      }
    }
    loadUser();
  }, []);

  return (
    <AppShell initialUser={currentUser}>
      <LeaveSelfServiceDashboard
        userName={
          currentUser?.employee?.firstName && currentUser?.employee?.lastName
            ? `${currentUser.employee.firstName} ${currentUser.employee.lastName}`
            : currentUser?.name || "Team Member"
        }
        employeeId={currentUser?.employeeId || ""}
      />
    </AppShell>
  );
}

export default function LeavePage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-xs font-semibold text-[var(--hz-text-muted)] animate-pulse">
          Loading Leave &amp; Attendance portal...
        </div>
      }
    >
      <LeavePageContent />
    </Suspense>
  );
}
