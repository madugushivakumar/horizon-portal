import React from "react";
import { getCurrentUser } from "@/lib/auth/server-session";
import PayrollRunDetails from "@/components/payroll/PayrollRunDetails";

export const metadata = {
  title: "Payroll Run Details & Reconciliation | Horizon Portal",
  description: "Inspect payroll run header, itemized payslips, and financial reconciliation tie-out.",
};

interface PayrollRunDetailPageProps {
  params: Promise<{ runId: string }>;
}

export default async function PayrollRunDetailPage({ params }: PayrollRunDetailPageProps) {
  const { runId } = await params;
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="p-8 max-w-3xl mx-auto text-center">
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 shadow-xs">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Authentication Required
          </h2>
          <p className="text-xs text-zinc-500 mt-2">
            Please log in with an administrative or HR account to access payroll run details.
          </p>
        </div>
      </div>
    );
  }

  const role = (user.role || "").toUpperCase();
  if (role !== "ADMIN" && role !== "HR") {
    return (
      <div className="p-8 max-w-3xl mx-auto text-center">
        <div className="rounded-2xl border border-rose-200 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/20 p-8 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center mb-3">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-rose-900 dark:text-rose-200">
            Access Restricted — 403 Forbidden
          </h2>
          <p className="text-xs text-rose-700 dark:text-rose-300 mt-1.5 max-w-md mx-auto">
            Payroll details and itemized compensation statements are strictly restricted to HR and Admin roles. Your current role is <span className="font-semibold">{user.role}</span>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <PayrollRunDetails
      runId={runId}
      currentUser={{
        id: user.id,
        role: user.role,
        employeeId: user.employeeId,
      }}
    />
  );
}

