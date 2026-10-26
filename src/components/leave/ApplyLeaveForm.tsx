"use client";

import React, { useState, useMemo } from "react";
import { LeaveBalanceItem } from "@/types/leave";

interface ApplyLeaveFormProps {
  balances: LeaveBalanceItem[];
  onSuccess?: () => void;
}

export function ApplyLeaveForm({ balances, onSuccess }: ApplyLeaveFormProps) {
  const [leaveTypeCode, setLeaveTypeCode] = useState<string>("CL");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [reason, setReason] = useState<string>("");

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Selected leave type balance object
  const selectedBalance = useMemo(() => {
    return balances.find((b) => b.code === leaveTypeCode) || null;
  }, [balances, leaveTypeCode]);

  // Rough client estimation of working days (Mon-Fri) for instant feedback
  const estimatedDays = useMemo(() => {
    if (!startDate || !endDate) return null;
    const s = new Date(startDate);
    const e = new Date(endDate);
    if (isNaN(s.getTime()) || isNaN(e.getTime()) || s > e) return null;

    let count = 0;
    const curr = new Date(s);
    while (curr <= e) {
      const d = curr.getDay();
      if (d !== 0 && d !== 6) {
        count++;
      }
      curr.setDate(curr.getDate() + 1);
    }
    return count;
  }, [startDate, endDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!leaveTypeCode) {
      setErrorMsg("Please select a leave category.");
      return;
    }

    if (!startDate || !endDate) {
      setErrorMsg("Please specify both a start date and an end date.");
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      setErrorMsg("The leave start date cannot be later than the end date.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/v1/leave/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leaveTypeCode,
          startDate,
          endDate,
          reason,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setErrorMsg(json.error || "Failed to submit leave request.");
        setSubmitting(false);
        return;
      }

      setSuccessMsg(`Leave request submitted successfully (${json.data.days} working day${json.data.days > 1 ? "s" : ""}). It is now pending review.`);
      setStartDate("");
      setEndDate("");
      setReason("");

      if (onSuccess) {
        onSuccess();
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "A network error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-[var(--hz-surface-card)] rounded-xl border border-[var(--hz-border-subtle)] p-6 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-[var(--hz-text-title)]">
            Apply for Leave
          </h3>
          <p className="text-xs text-[var(--hz-text-muted)]">
            Submit a time-off request for manager approval.
          </p>
        </div>
        {selectedBalance && (
          <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-[var(--hz-primary-50)] dark:bg-[var(--hz-primary-950)] text-[var(--hz-primary-700)] dark:text-[var(--hz-primary-300)] border border-[var(--hz-primary-200)]">
            {selectedBalance.available} days remaining
          </span>
        )}
      </div>

      {errorMsg && (
        <div className="mb-4 p-3 rounded-lg bg-[var(--hz-danger-50)] dark:bg-[var(--hz-danger-950)] border border-[var(--hz-danger-200)] text-xs text-[var(--hz-danger-700)] flex items-start gap-2">
          <span className="font-bold">&times;</span>
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="mb-4 p-3 rounded-lg bg-[var(--hz-success-50)] dark:bg-[var(--hz-success-950)] border border-[var(--hz-success-200)] text-xs text-[var(--hz-success-700)] flex items-start gap-2">
          <span className="font-bold">&check;</span>
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Leave Type Select */}
        <div>
          <label
            htmlFor="leave-type-select"
            className="block text-xs font-semibold text-[var(--hz-text-body)] mb-1.5"
          >
            Leave Category <span className="text-[var(--hz-danger-500)]">*</span>
          </label>
          <select
            id="leave-type-select"
            value={leaveTypeCode}
            onChange={(e) => setLeaveTypeCode(e.target.value)}
            disabled={submitting}
            className="w-full px-3.5 py-2 text-xs rounded-lg border border-[var(--hz-border-subtle)] bg-[var(--hz-surface-elevated)] text-[var(--hz-text-body)] focus:outline-hidden focus:ring-2 focus:ring-[var(--hz-primary-500)] transition-colors"
          >
            {balances.map((b) => (
              <option key={b.code} value={b.code}>
                {b.name} ({b.code}) — {b.available} days available
              </option>
            ))}
          </select>
        </div>

        {/* Date Pickers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="leave-start-date"
              className="block text-xs font-semibold text-[var(--hz-text-body)] mb-1.5"
            >
              Start Date <span className="text-[var(--hz-danger-500)]">*</span>
            </label>
            <input
              id="leave-start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              disabled={submitting}
              className="w-full px-3.5 py-2 text-xs rounded-lg border border-[var(--hz-border-subtle)] bg-[var(--hz-surface-elevated)] text-[var(--hz-text-body)] focus:outline-hidden focus:ring-2 focus:ring-[var(--hz-primary-500)] transition-colors"
            />
          </div>

          <div>
            <label
              htmlFor="leave-end-date"
              className="block text-xs font-semibold text-[var(--hz-text-body)] mb-1.5"
            >
              End Date <span className="text-[var(--hz-danger-500)]">*</span>
            </label>
            <input
              id="leave-end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              disabled={submitting}
              className="w-full px-3.5 py-2 text-xs rounded-lg border border-[var(--hz-border-subtle)] bg-[var(--hz-surface-elevated)] text-[var(--hz-text-body)] focus:outline-hidden focus:ring-2 focus:ring-[var(--hz-primary-500)] transition-colors"
            />
          </div>
        </div>

        {/* Estimated Duration Banner */}
        {estimatedDays !== null && (
          <div className="text-xs p-2 rounded-md bg-[var(--hz-neutral-100)] dark:bg-[var(--hz-neutral-900)] text-[var(--hz-text-muted)] flex items-center justify-between">
            <span>Estimated Duration:</span>
            <span className="font-bold text-[var(--hz-text-title)]">
              {estimatedDays} working day{estimatedDays !== 1 ? "s" : ""}{" "}
              <span className="text-[10px] font-normal text-[var(--hz-text-muted)]">
                (excl. weekends &amp; statutory holidays)
              </span>
            </span>
          </div>
        )}

        {/* Reason Textarea */}
        <div>
          <label
            htmlFor="leave-reason"
            className="block text-xs font-semibold text-[var(--hz-text-body)] mb-1.5"
          >
            Reason / Notes (Optional)
          </label>
          <textarea
            id="leave-reason"
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={submitting}
            placeholder="Brief description of the reason for time-off..."
            className="w-full px-3.5 py-2 text-xs rounded-lg border border-[var(--hz-border-subtle)] bg-[var(--hz-surface-elevated)] text-[var(--hz-text-body)] focus:outline-hidden focus:ring-2 focus:ring-[var(--hz-primary-500)] transition-colors resize-none"
          />
        </div>

        {/* Action Button */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-2.5 px-4 rounded-lg bg-[var(--hz-primary-600)] hover:bg-[var(--hz-primary-700)] text-white font-semibold text-xs shadow-xs transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
        >
          {submitting ? (
            <>
              <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              <span>Submitting Leave Request...</span>
            </>
          ) : (
            <span>Submit Leave Request</span>
          )}
        </button>
      </form>
    </div>
  );
}
