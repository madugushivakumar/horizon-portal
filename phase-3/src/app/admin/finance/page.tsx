import React from "react";
import { getCurrentUser } from "@/lib/auth/server-session";
import { isAuthorizedAdmin } from "@/lib/finance/auth";
import { AppShell } from "@/components/layout/AppShell";
import AdminFinanceConsole from "@/components/finance/AdminFinanceConsole";

export const metadata = {
  title: "Finance Snapshot | Horizon Portal",
  description: "Read-only financial overview, invoice ageing, and expense monitoring.",
};

export default async function AdminFinancePage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="min-h-screen bg-[var(--hz-bg-canvas,#f8fafc)] flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 text-center shadow-xs">
          <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 mx-auto flex items-center justify-center mb-4">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            Authentication Required
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
            Please log in with an administrator account to access the Finance Snapshot.
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthorizedAdmin(user)) {
    return (
      <AppShell initialUser={user as any}>
        <div className="p-8 max-w-2xl mx-auto text-center my-12">
          <div className="rounded-2xl border border-rose-200 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/20 p-8 shadow-xs">
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center mb-3.5">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-rose-900 dark:text-rose-200">
              Access Restricted — 403 Forbidden
            </h2>
            <p className="text-xs text-rose-700 dark:text-rose-300 mt-2 max-w-md mx-auto leading-relaxed">
              The Admin Finance Snapshot contains sensitive organizational revenue and expenditure data
              and is strictly restricted to the Admin role. Your current role is{" "}
              <span className="font-semibold underline decoration-rose-400">{user.role}</span>.
            </p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell initialUser={user as any}>
      <AdminFinanceConsole initialUser={user as any} />
    </AppShell>
  );
}
