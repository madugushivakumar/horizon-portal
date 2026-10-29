"use client";

/**
 * Horizon Portal — Employee Audit Trail Modal
 * src/components/admin/employees/EmployeeAuditModal.tsx
 *
 * Renders verified audit history for a specific employee:
 * - Shows actor, action, timestamp, changed field name, previous value, and new value
 * - Filterable by action type
 */

import React, { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface AuditRecord {
  id: string;
  eventId: string | null;
  actorId: string;
  actorEmail: string | null;
  actorRole: string | null;
  action: string;
  employeeId: string | null;
  fieldName: string | null;
  oldValue: string | null;
  newValue: string | null;
  details: string | null;
  createdAt: string;
}

export interface EmployeeAuditModalProps {
  isOpen: boolean;
  employeeId: string | null;
  employeeName?: string | null;
  onClose: () => void;
}

export function EmployeeAuditModal({
  isOpen,
  employeeId,
  employeeName,
  onClose,
}: EmployeeAuditModalProps) {
  const [logs, setLogs] = useState<AuditRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAuditTrail() {
      if (!isOpen || !employeeId) return;

      setLoading(true);
      setError(null);

      try {
        const res = await fetch(
          `/api/v1/admin/audit?employeeId=${encodeURIComponent(employeeId)}&pageSize=50`
        );
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Failed to load audit history.");
        }
        const json = await res.json();
        setLogs(json.data || []);
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    }

    fetchAuditTrail();
  }, [isOpen, employeeId]);

  if (!isOpen || !employeeId) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="audit-modal-title"
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={onClose} />

      {/* Modal Content */}
      <div className="relative w-full max-w-4xl max-h-[85vh] rounded-2xl bg-[var(--hz-neutral-0)] dark:bg-[var(--hz-neutral-900)] border border-[var(--hz-border)] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--hz-border)] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">📜</span>
              <h3 id="audit-modal-title" className="text-base font-bold text-[var(--hz-text-primary)]">
                Audit Trail — {employeeName || employeeId}
              </h3>
              <Badge variant="default">{employeeId}</Badge>
            </div>
            <p className="text-xs text-[var(--hz-text-muted)] mt-0.5">
              Immutable compliance event log detailing who modified this workforce profile, when, and exact field values.
            </p>
          </div>
          <button
            id="btn-close-audit-modal"
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--hz-text-muted)] hover:text-[var(--hz-text-primary)] hover:bg-[var(--hz-neutral-100)] dark:hover:bg-[var(--hz-neutral-800)]"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && (
            <div className="py-12 text-center text-xs text-[var(--hz-text-muted)] animate-pulse">
              Loading audit compliance records...
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-[var(--hz-danger-bg,#fef2f2)] text-[var(--hz-danger,#b91c1c)] text-xs font-medium">
              {error}
            </div>
          )}

          {!loading && !error && logs.length === 0 && (
            <div className="py-12 text-center text-xs text-[var(--hz-text-muted)]">
              No audit entries recorded for this employee yet.
            </div>
          )}

          {!loading && !error && logs.length > 0 && (
            <div className="overflow-x-auto rounded-xl border border-[var(--hz-border)]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[var(--hz-neutral-50)] dark:bg-[var(--hz-neutral-850)] border-b border-[var(--hz-border)] text-[var(--hz-text-secondary)] font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">Actor</th>
                    <th className="px-4 py-3">Action</th>
                    <th className="px-4 py-3">Field</th>
                    <th className="px-4 py-3">Previous Value</th>
                    <th className="px-4 py-3">New Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--hz-border)] bg-[var(--hz-card-bg)]">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-[var(--hz-neutral-50)] dark:hover:bg-[var(--hz-neutral-850)] transition-colors">
                      <td className="px-4 py-3 text-[var(--hz-text-muted)] whitespace-nowrap font-mono text-[11px]">
                        {new Date(log.createdAt).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-[var(--hz-text-primary)]">
                          {log.actorEmail || log.actorId}
                        </div>
                        {log.actorRole && (
                          <span className="text-[10px] text-[var(--hz-primary-600)] dark:text-[var(--hz-primary-400)] font-medium">
                            Role: {log.actorRole}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge
                          variant={
                            log.action === "EMPLOYEE_CREATED"
                              ? "success"
                              : log.action === "EMPLOYEE_DEACTIVATED"
                              ? "danger"
                              : "primary"
                          }
                        >
                          {log.action}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 font-mono font-medium text-[var(--hz-text-secondary)]">
                        {log.fieldName || "—"}
                      </td>
                      <td className="px-4 py-3 text-[var(--hz-text-muted)] max-w-xs truncate">
                        {log.oldValue !== null ? (
                          <span className="line-through opacity-80">{log.oldValue}</span>
                        ) : (
                          <span className="italic opacity-50">null</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[var(--hz-text-primary)] font-semibold max-w-xs truncate">
                        {log.newValue !== null ? (
                          <span className="text-[var(--hz-success,#16a34a)]">{log.newValue}</span>
                        ) : (
                          <span className="italic opacity-50">null</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[var(--hz-border)] bg-[var(--hz-neutral-50)] dark:bg-[var(--hz-neutral-850)] flex justify-end">
          <Button id="btn-footer-close-audit-modal" variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
