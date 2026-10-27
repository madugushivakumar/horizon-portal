"use client";

/**
 * Horizon Portal — My Payslips & Tax Documents Page
 * src/app/payslips/page.tsx
 *
 * Implements Phase 2 Day 7:
 * - Real-time chronological month list of payslips for authenticated employee
 * - Summary KPI cards (Latest Net Pay, Total Disbursed Net, Statements Count)
 * - Safe INR currency formatting with en-IN locale
 * - Protected routing and accessible controls
 */

import React, { useEffect, useState, Suspense } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { TopBarUser } from "@/components/layout/TopBar";
import { PayslipMonthList } from "@/components/payroll/PayslipMonthList";

function PayslipsPageContent() {
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
        // AppShell handles fallback loading
      }
    }
    loadUser();
  }, []);

  return (
    <AppShell initialUser={currentUser}>
      <PayslipMonthList />
    </AppShell>
  );
}

export default function PayslipsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-xs font-semibold text-[var(--hz-text-muted)] animate-pulse">
          Loading Payslips Portal...
        </div>
      }
    >
      <PayslipsPageContent />
    </Suspense>
  );
}
