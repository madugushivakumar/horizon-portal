"use client";

/**
 * Horizon Portal — Safe Employee Deactivation Modal
 * src/components/admin/employees/DeactivateConfirmationModal.tsx
 *
 * Implements explicit confirmation dialog before deactivating employee records:
 * - Details exact consequences (status -> Inactive, login disabled, historical records preserved)
 * - Requires explicit confirmation action
 * - Prevents double-submission
 * - Records audit trail
 */

import React, { useState } from "react";
import { Button } from "@/components/ui/button";

export interface DeactivateModalEmployee {
  id: string;
  fullName: string;
  email: string;
  departmentName?: string | null;
  roleName?: string | null;
  status: string;
}

export interface DeactivateConfirmationModalProps {
  isOpen: boolean;
  employee: DeactivateModalEmployee | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function DeactivateConfirmationModal({
  isOpen,
  employee,
  onClose,
  onSuccess,
}: DeactivateConfirmationModalProps) {
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !employee) return null;

  const handleConfirm = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/v1/admin/employees/${encodeURIComponent(employee.id)}/deactivate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: reason.trim() || undefined }),
        }
      );

      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Failed to deactivate employee record.");
        setIsSubmitting(false);
        return;
      }

      setIsSubmitting(false);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "A network error occurred while deactivating employee.");
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="deactivate-dialog-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={() => !isSubmitting && onClose()}
      />

      {/* Modal Box */}
      <div className="relative w-full max-w-lg rounded-2xl bg-[var(--hz-neutral-0)] dark:bg-[var(--hz-neutral-900)] border border-[var(--hz-border)] shadow-2xl p-6 overflow-hidden">
        {/* Warning Icon & Title */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-[var(--hz-danger-bg,#fef2f2)] border border-[var(--hz-danger,#ef4444)] flex items-center justify-center shrink-0 text-[var(--hz-danger,#ef4444)]">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>

          <div className="flex-1">
            <h3
              id="deactivate-dialog-title"
              className="text-lg font-bold text-[var(--hz-text-primary)]"
            >
              Confirm Employee Deactivation
            </h3>
            <p className="text-xs text-[var(--hz-text-muted)] mt-1">
              You are about to change the employment status of this record. Please review the details below.
            </p>
          </div>
        </div>

        {/* Target Employee Summary Card */}
        <div className="mt-4 p-4 rounded-xl bg-[var(--hz-neutral-50)] dark:bg-[var(--hz-neutral-850)] border border-[var(--hz-border)] text-xs space-y-1.5">
          <div className="flex justify-between">
            <span className="text-[var(--hz-text-muted)]">Employee:</span>
            <span className="font-bold text-[var(--hz-text-primary)]">
              {employee.fullName} ({employee.id})
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--hz-text-muted)]">Work Email:</span>
            <span className="text-[var(--hz-text-secondary)]">{employee.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--hz-text-muted)]">Department & Role:</span>
            <span className="text-[var(--hz-text-secondary)]">
              {employee.departmentName || "General"} · {employee.roleName || "Staff"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--hz-text-muted)]">Current Status:</span>
            <span className="font-semibold text-[var(--hz-success,#16a34a)]">
              {employee.status}
            </span>
          </div>
        </div>

        {/* Explanation of Effects */}
        <div className="mt-4 p-3.5 rounded-xl bg-[var(--hz-primary-50,#eef2ff)] dark:bg-[var(--hz-neutral-800)] border border-[var(--hz-primary-200,#c7d2fe)] dark:border-[var(--hz-border)] text-xs text-[var(--hz-text-secondary)] space-y-1">
          <p className="font-semibold text-[var(--hz-primary-800,#3730a3)] dark:text-[var(--hz-primary-300)]">
            What will happen upon deactivation:
          </p>
          <ul className="list-disc list-inside space-y-0.5 text-[var(--hz-text-muted)]">
            <li>Employee status is set to <strong className="text-[var(--hz-text-primary)]">Inactive</strong>.</li>
            <li>All associated portal login accounts will be disabled.</li>
            <li>Historical leave requests, payslips, and attendance records <strong className="text-[var(--hz-text-primary)]">remain preserved</strong>.</li>
            <li>This action will be permanently recorded in the compliance audit trail.</li>
          </ul>
        </div>

        {/* Optional Deactivation Reason */}
        <div className="mt-4">
          <label
            htmlFor="deactivate-reason"
            className="block text-xs font-semibold text-[var(--hz-text-secondary)] mb-1"
          >
            Reason for Deactivation (Optional)
          </label>
          <input
            id="deactivate-reason"
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={isSubmitting}
            placeholder="e.g. Resignation, contract completion, sabbatical"
            className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--hz-border)] bg-[var(--hz-card-bg)] text-[var(--hz-text-primary)] focus:outline-hidden focus:ring-2 focus:ring-[var(--hz-danger,#ef4444)]"
          />
        </div>

        {/* Error Alert */}
        {error && (
          <div
            className="mt-4 p-3 rounded-lg bg-[var(--hz-danger-bg,#fef2f2)] border border-[var(--hz-danger,#ef4444)] text-[var(--hz-danger,#b91c1c)] text-xs font-medium"
            role="alert"
          >
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 flex items-center justify-end gap-3">
          <Button
            id="btn-cancel-deactivate"
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            id="btn-confirm-deactivate"
            type="button"
            variant="danger"
            onClick={handleConfirm}
            loading={isSubmitting}
            disabled={isSubmitting}
          >
            Confirm Deactivation
          </Button>
        </div>
      </div>
    </div>
  );
}
