"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { formatMoney, formatDisplayDate } from "@/lib/payroll/formatters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PayrollReconciliation, { ReconciliationData } from "./PayrollReconciliation";
import ApprovalConfirmationModal, { ApprovalModalRunInfo } from "./ApprovalConfirmationModal";

export interface PayslipItemRow {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  role: string;
  basic: number;
  hra: number;
  allowances: number;
  grossPay: number;
  pfEmployee: number;
  esiEmployee: number;
  professionalTax: number;
  tds: number;
  otherDeductions: number;
  totalDeductions: number;
  netPay: number;
  currency: string;
}

export interface PayrollRunDetailData {
  header: {
    id: string;
    periodStart: string;
    periodEnd: string;
    periodLabel: string;
    paymentDate: string | null;
    payDate: string | null;
    status: string;
    approvalStatus: string;
    employeesPaid: number;
    actualPayslipCount: number;
    preparerId: string | null;
    approvedById: string | null;
    approvedAt: string | null;
    approvalNotes: string | null;
  };
  financialSummary: {
    storedGross: number;
    storedNet: number;
    storedDeductions: number;
    calculatedGross: number;
    calculatedNet: number;
    calculatedDeductions: number;
  };
  reconciliation: ReconciliationData;
  monthOverMonth: {
    isAvailable: boolean;
    message?: string;
    currentPeriod: string;
    previousPeriod?: string;
    previousRunId?: string;
    currentNet: number;
    previousNet?: number;
    difference?: number;
    percentageChange?: number;
    direction?: "increase" | "decrease" | "neutral";
    basis: "stored" | "calculated";
  };
  items: {
    data: PayslipItemRow[];
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
  };
}

interface PayrollRunDetailsProps {
  runId: string;
  currentUser?: {
    id: string;
    role: string;
    employeeId?: string | null;
  };
}

export default function PayrollRunDetails({ runId, currentUser }: PayrollRunDetailsProps) {
  const [data, setData] = useState<PayrollRunDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Pagination states
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 25;

  // Approval Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [approvalFeedback, setApprovalFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch Run Details
  const fetchRunDetails = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });
      if (debouncedSearch) {
        params.set("search", debouncedSearch);
      }

      const res = await fetch(`/api/v1/payroll/runs/${runId}?${params.toString()}`);
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP ${res.status}: Failed to fetch payroll run details.`);
      }

      const json = await res.json();
      setData(json.data);
    } catch (err) {
      console.error("Error fetching payroll run detail:", err);
      setError(err instanceof Error ? err.message : "Failed to load payroll details.");
    } finally {
      setIsLoading(false);
    }
  }, [runId, page, pageSize, debouncedSearch]);

  useEffect(() => {
    fetchRunDetails();
  }, [fetchRunDetails]);

  // Handle Approval Action
  const handleApproveConfirm = async (notes: string) => {
    try {
      setIsApproving(true);
      setApprovalFeedback(null);

      const res = await fetch(`/api/v1/payroll/runs/${runId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });

      const result = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(result.error || `HTTP ${res.status}: Approval failed.`);
      }

      setApprovalFeedback({
        type: "success",
        message: result.message || "Payroll run approved successfully.",
      });
      setIsModalOpen(false);
      await fetchRunDetails();
    } catch (err) {
      console.error("Approval error:", err);
      setApprovalFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to approve payroll run.",
      });
    } finally {
      setIsApproving(false);
    }
  };

  if (isLoading && !data) {
    return (
      <div className="space-y-6 animate-pulse p-6">
        <div className="h-6 w-48 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
        <div className="h-32 bg-zinc-200 dark:bg-zinc-800 rounded-2xl"></div>
        <div className="h-64 bg-zinc-200 dark:bg-zinc-800 rounded-2xl"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="rounded-2xl border border-rose-200 bg-rose-50 dark:bg-rose-950/30 p-6 text-center">
          <h3 className="text-base font-semibold text-rose-900 dark:text-rose-200 mb-1">
            Unable to load payroll run
          </h3>
          <p className="text-xs text-rose-700 dark:text-rose-300 mb-4">{error || "Run not found."}</p>
          <Link href="/payroll">
            <Button variant="secondary" size="sm">
              Back to Payroll Console
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const { header, financialSummary, reconciliation, monthOverMonth, items } = data;
  const isPaid = (header.status || "").toUpperCase().includes("PAID");
  const isApproved = (header.approvalStatus || "").toLowerCase() === "approved";
  const isPreparerSelf = Boolean(
    currentUser &&
      header.preparerId &&
      (currentUser.id === header.preparerId || currentUser.employeeId === header.preparerId)
  );

  const modalRunInfo: ApprovalModalRunInfo = {
    id: header.id,
    periodLabel: header.periodLabel,
    employeesPaid: header.employeesPaid,
    totalGross: financialSummary.storedGross,
    totalNet: financialSummary.storedNet,
    totalDeductions: financialSummary.storedDeductions,
    reconciliationStatus: reconciliation.reconciliationStatus,
    status: header.status,
    approvalStatus: header.approvalStatus,
    preparerId: header.preparerId,
    isPreparerSelf,
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
        <Link href="/payroll" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
          Payroll Operations
        </Link>
        <span>/</span>
        <span className="font-semibold text-zinc-900 dark:text-zinc-100">{header.id}</span>
      </nav>

      {/* Feedback Alert */}
      {approvalFeedback && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-center justify-between ${
            approvalFeedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
              : "bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800"
          }`}
        >
          <span>{approvalFeedback.message}</span>
          <button onClick={() => setApprovalFeedback(null)} className="p-1 hover:opacity-75">
            ✕
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                {header.periodLabel}
              </h1>
              <span className="font-mono text-sm px-2.5 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-semibold">
                {header.id}
              </span>
              {/* Operational Status */}
              <Badge
                variant={isPaid ? "success" : "warning"}
                dot
                size="sm"
              >
                {header.status}
              </Badge>
              {/* Approval Status */}
              <Badge
                variant={isApproved ? "primary" : "secondary"}
                size="sm"
              >
                Approval: {header.approvalStatus}
              </Badge>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 flex items-center gap-3">
              <span>Period: {header.periodStart} to {header.periodEnd}</span>
              <span>•</span>
              <span>Pay Date: {header.payDate ? formatDisplayDate(header.payDate) : "Pending"}</span>
              <span>•</span>
              <span>Headcount: {header.employeesPaid} Stored / {header.actualPayslipCount} Payslips</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/payroll">
              <Button variant="secondary" size="sm">
                Back to Console
              </Button>
            </Link>
            <Button
              variant="primary"
              size="sm"
              disabled={isPaid || isApproved}
              onClick={() => setIsModalOpen(true)}
              className={isApproved ? "opacity-60 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-700 text-white"}
            >
              {isApproved ? "Payroll Approved" : isPaid ? "Paid & Finalized" : "Approve Payroll Run"}
            </Button>
          </div>
        </div>

        {/* Governance & Approver Metadata Bar */}
        <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800/80 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <span className="text-zinc-400 font-medium">Prepared By:</span>{" "}
            <span className="text-zinc-700 dark:text-zinc-300 font-mono">
              {header.preparerId || "Preparer not recorded (Historical Seed)"}
            </span>
          </div>
          <div>
            <span className="text-zinc-400 font-medium">Approved By:</span>{" "}
            <span className="text-zinc-700 dark:text-zinc-300 font-mono">
              {header.approvedById || (isPaid ? "System Root / Finance" : "Pending Authorization")}
            </span>
          </div>
          <div>
            <span className="text-zinc-400 font-medium">Approval Timestamp:</span>{" "}
            <span className="text-zinc-700 dark:text-zinc-300">
              {header.approvedAt ? formatDisplayDate(header.approvedAt) : isPaid ? "Pre-approved on Pay Date" : "Awaiting Decision"}
            </span>
          </div>
        </div>
      </div>

      {/* Month-over-Month Comparison Card */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <span>Month-over-Month (MoM) Payroll Variance</span>
              <span className="text-[11px] font-normal text-zinc-500">
                (Comparative period: {monthOverMonth.previousPeriod || "N/A"})
              </span>
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Net payable trend comparison against the immediately preceding consecutive month.
            </p>
          </div>
        </div>

        {monthOverMonth.isAvailable ? (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-800">
              <div className="text-[11px] font-medium text-zinc-500 uppercase">Current Month Net</div>
              <div className="text-base font-bold font-mono text-zinc-900 dark:text-zinc-100 mt-1">
                {formatMoney(monthOverMonth.currentNet)}
              </div>
              <div className="text-[10px] text-zinc-400 mt-0.5">{monthOverMonth.currentPeriod}</div>
            </div>

            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-800">
              <div className="text-[11px] font-medium text-zinc-500 uppercase">Previous Month Net</div>
              <div className="text-base font-bold font-mono text-zinc-900 dark:text-zinc-100 mt-1">
                {formatMoney(monthOverMonth.previousNet)}
              </div>
              <div className="text-[10px] text-zinc-400 mt-0.5">{monthOverMonth.previousPeriod}</div>
            </div>

            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-800">
              <div className="text-[11px] font-medium text-zinc-500 uppercase">Absolute Variance (Δ)</div>
              <div className={`text-base font-bold font-mono mt-1 ${
                (monthOverMonth.difference || 0) > 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : (monthOverMonth.difference || 0) < 0
                  ? "text-rose-600 dark:text-rose-400"
                  : "text-zinc-600"
              }`}>
                {(monthOverMonth.difference || 0) > 0 ? `+${formatMoney(monthOverMonth.difference)}` : formatMoney(monthOverMonth.difference)}
              </div>
              <div className="text-[10px] text-zinc-400 mt-0.5">Disbursement shift</div>
            </div>

            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-800">
              <div className="text-[11px] font-medium text-zinc-500 uppercase">Percentage Change</div>
              <div className={`text-base font-bold font-mono mt-1 flex items-center gap-1.5 ${
                (monthOverMonth.percentageChange || 0) > 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : (monthOverMonth.percentageChange || 0) < 0
                  ? "text-rose-600 dark:text-rose-400"
                  : "text-zinc-600"
              }`}>
                {monthOverMonth.direction === "increase" && (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                )}
                {monthOverMonth.direction === "decrease" && (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                  </svg>
                )}
                <span>
                  {(monthOverMonth.percentageChange || 0) > 0
                    ? `+${monthOverMonth.percentageChange}%`
                    : `${monthOverMonth.percentageChange}%`}
                </span>
              </div>
              <div className="text-[10px] text-zinc-400 mt-0.5">
                {monthOverMonth.direction === "increase" ? "Workforce Expansion" : monthOverMonth.direction === "decrease" ? "Workforce Contraction" : "Stable"}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-dashed border-zinc-300 dark:border-zinc-700 text-xs text-zinc-500 text-center">
            {monthOverMonth.message || "Previous-period comparison unavailable."}
          </div>
        )}
      </div>

      {/* Financial Reconciliation Panel */}
      <PayrollReconciliation reconciliation={reconciliation} />

      {/* Itemized Payslips Table */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <span>Itemized Payslip Ledger</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-medium font-mono">
                {items.pagination.total} Records
              </span>
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Inspect employee-level compensation, deductions, and net payouts.
            </p>
          </div>

          <div className="w-full sm:w-72">
            <Input
              type="text"
              label="Search employee payslips"
              hideLabel
              placeholder="Search by Employee ID or Name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="text-xs"
            />
          </div>
        </div>

        {items.data.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400 flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {header.actualPayslipCount === 0
                ? "No Itemized Payslips Available"
                : "No matching employee payslips found"}
            </h4>
            <p className="text-xs text-zinc-500 max-w-md mx-auto mt-1">
              {header.actualPayslipCount === 0
                ? "This historical payroll run does not contain itemized payslip records in the available data pack. Financial totals shown here are the stored run-header figures and have not been independently reconciled against payslips."
                : `No payslips match "${search}". Try searching for another employee name or identifier.`}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-800/80 text-zinc-500 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Department / Role</th>
                  <th className="py-3 px-4 text-right">Basic</th>
                  <th className="py-3 px-4 text-right">HRA</th>
                  <th className="py-3 px-4 text-right">Allowances</th>
                  <th className="py-3 px-4 text-right font-bold text-zinc-900 dark:text-zinc-100">Gross Pay</th>
                  <th className="py-3 px-4 text-right text-rose-600 dark:text-rose-400">Total Deductions</th>
                  <th className="py-3 px-4 text-right font-bold text-emerald-700 dark:text-emerald-400">Net Pay</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {items.data.map((row) => (
                  <tr key={row.id} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {row.employeeName}
                      </div>
                      <div className="text-[11px] font-mono text-zinc-400">{row.employeeId}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-zinc-700 dark:text-zinc-300 font-medium">{row.department}</div>
                      <div className="text-[11px] text-zinc-400">{row.role}</div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-zinc-600 dark:text-zinc-400">
                      {formatMoney(row.basic)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-zinc-600 dark:text-zinc-400">
                      {formatMoney(row.hra)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-zinc-600 dark:text-zinc-400">
                      {formatMoney(row.allowances)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-zinc-900 dark:text-zinc-100">
                      {formatMoney(row.grossPay)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-rose-600 dark:text-rose-400 font-medium">
                      -{formatMoney(row.totalDeductions)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400">
                      {formatMoney(row.netPay)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {items.pagination.totalPages > 1 && (
          <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/50 flex items-center justify-between text-xs text-zinc-500">
            <div>
              Showing Page <span className="font-medium text-zinc-900 dark:text-zinc-100">{items.pagination.page}</span> of{" "}
              <span className="font-medium text-zinc-900 dark:text-zinc-100">{items.pagination.totalPages}</span> ({items.pagination.total} employees)
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={items.pagination.page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={items.pagination.page >= items.pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Approval Confirmation Modal */}
      <ApprovalConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleApproveConfirm}
        run={modalRunInfo}
        isSubmitting={isApproving}
      />
    </div>
  );
}
