/**
 * Horizon Portal — AI Workforce Insights Route
 * src/app/hr-insights/page.tsx
 *
 * Primary server-rendered route for Day 15:
 * - Server-side authentication and session verification via getCurrentUser()
 * - Strict RBAC enforcement: Admin and HR allowed; Manager and Employee receive 403 Forbidden
 * - Persistent AppShell layout with active role awareness
 * - Renders interactive HRInsightsDashboard client component
 */

import React from "react";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/server-session";
import { AppShell } from "@/components/layout/AppShell";
import { TopBarUser } from "@/components/layout/TopBar";
import { HRInsightsDashboard } from "@/components/hr-insights/HRInsightsDashboard";

export const metadata: Metadata = {
  title: "AI Workforce Insights | Horizon Portal",
  description:
    "Workforce attrition risk patterns, contributing factors, and payroll anomaly intelligence with responsible AI governance.",
};

export default async function HRInsightsPage() {
  const user = await getCurrentUser();

  // 1. Unauthenticated users are redirected to login
  if (!user) {
    redirect("/login");
  }

  const topBarUser: TopBarUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  // 2. Strict Role-Based Access Control (Admin & HR only)
  const role = (user.role || "").toUpperCase();
  if (role !== "ADMIN" && role !== "HR") {
    return (
      <AppShell initialUser={topBarUser}>
        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="rounded-2xl border border-rose-200 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/20 p-8 text-center shadow-xs">
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center mb-3">
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-rose-900 dark:text-rose-200">
              Access Restricted — 403 Forbidden
            </h2>
            <p className="text-xs text-rose-700 dark:text-rose-300 mt-2 max-w-md mx-auto leading-relaxed">
              The AI Workforce Insights dashboard contains sensitive organization-wide attrition risk patterns and payroll anomaly intelligence. Access is strictly restricted to HR and Administrator roles. Your current role is <span className="font-semibold underline">{user.role}</span>.
            </p>
          </div>
        </main>
      </AppShell>
    );
  }

  // 3. Authorized View (HR and Admin)
  return (
    <AppShell initialUser={topBarUser}>
      <main className="container mx-auto px-4 py-6 max-w-7xl">
        <HRInsightsDashboard currentUserRole={user.role} />
      </main>
    </AppShell>
  );
}
