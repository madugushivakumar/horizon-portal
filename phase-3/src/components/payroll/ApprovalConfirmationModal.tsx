"use client";

import React, { useState } from "react";
import { formatMoney } from "@/lib/payroll/formatters";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface ApprovalModalRunInfo {
  id: string;
  periodLabel: string;
  employeesPaid: number;
  totalGross: number;
  totalNet: number;
  totalDeductions: number;
  reconciliationStatus: "MATCHED" | "MISMATCH" | "NO_ITEMS" | string;
  status: string;
  approvalStatus: string;
  preparerId?: string | null;
  isPreparerSelf?: boolean;
}

interface ApprovalConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (notes: string) => Promise<void>;
  run: ApprovalModalRunInfo | null;
  isSubmitting: boolean;
}

export default function ApprovalConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  run,
  isSubmitting,
}: ApprovalConfirmationModalProps) {
  const [notes, setNotes] = useState("");

  if (!isOpen || !run) return null;

  const isMatched = run.reconciliationStatus === "MATCHED";
  const isPaid = (run.status || "").toUpperCase().includes("PAID");
  const isAlreadyApproved = (run.approvalStatus || "").toLowerCase() === "approved";
  const isSelf = Boolean(run.isPreparerSelf);

  const canApprove = isMatched && !isPaid && !isAlreadyApproved && !isSelf;

  const handleConfirm = async () => {
    if (!canApprove || isSubmitting) return;
    await onConfirm(notes);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="approval-modal-title"
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 id="approval-modal-title" className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Approve Payroll Run
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Authorization & Audit Lock — {run.id}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors p-1"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Confirmation Text */}
          <div className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
            <p className="font-medium text-zinc-900 dark:text-zinc-100 mb-1">
              Are you sure you want to approve this payroll run?
            </p>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              You are approving payroll for <span className="font-semibold text-zinc-900 dark:text-zinc-100">{run.periodLabel}</span>, covering{" "}
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">{run.employeesPaid} employees</span>, with a total net payable of{" "}
              <span className="font-semibold text-emerald-700 dark:text-emerald-400">{formatMoney(run.totalNet)}</span>.
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-2 italic flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              This action will be recorded in the immutable audit log with your actor identity and timestamp.
            </p>
          </div>

          {/* Metric Breakdown Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800 text-center">
              <div className="text-[11px] text-zinc-500 font-medium uppercase">Gross Total</div>
              <div className="text-sm font-semibold font-mono text-zinc-900 dark:text-zinc-100 mt-0.5">
                {formatMoney(run.totalGross)}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800 text-center">
              <div className="text-[11px] text-zinc-500 font-medium uppercase">Deductions</div>
              <div className="text-sm font-semibold font-mono text-zinc-900 dark:text-zinc-100 mt-0.5">
                {formatMoney(run.totalDeductions)}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800 text-center">
              <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium uppercase">Net Payable</div>
              <div className="text-sm font-bold font-mono text-emerald-700 dark:text-emerald-400 mt-0.5">
                {formatMoney(run.totalNet)}
              </div>
            </div>
          </div>

          {/* Warnings & Invariants */}
          {!isMatched && (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-xs text-rose-800 dark:text-rose-300 space-y-1">
              <div className="font-semibold flex items-center gap-1.5 text-rose-900 dark:text-rose-200">
                <svg className="w-4 h-4 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Approval Locked: Reconciliation {run.reconciliationStatus}
              </div>
              <p>
                This payroll run has unresolved financial variances between stored header totals and payslip sums. Under enterprise compliance rules, approval is disabled.
              </p>
            </div>
          )}

          {isSelf && (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-xs text-amber-800 dark:text-amber-300 space-y-1">
              <div className="font-semibold flex items-center gap-1.5 text-amber-900 dark:text-amber-200">
                <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Separation of Duties Restriction
              </div>
              <p>
                You prepared this payroll run. You cannot approve your own payroll run; an independent HR or Admin reviewer is required.
              </p>
            </div>
          )}

          {isPaid && (
            <div className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-xs text-zinc-600 dark:text-zinc-400">
              This run is already marked as Paid and finalized. Further approvals are blocked.
            </div>
          )}

          {/* Optional Approval Notes */}
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Approval Notes / Compliance Reference <span className="text-zinc-400 font-normal">(Optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Verified by Internal Audit, ready for treasury dispatch..."
              rows={2}
              disabled={!canApprove || isSubmitting}
              className="w-full text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-2.5 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 resize-none"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/50 flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleConfirm}
            loading={isSubmitting}
            disabled={!canApprove || isSubmitting}
            className="bg-emerald-600 hover:bg-emerald-700 text-white focus:ring-emerald-500"
          >
            Confirm & Approve Payroll
          </Button>
        </div>
      </div>
    </div>
  );
}

