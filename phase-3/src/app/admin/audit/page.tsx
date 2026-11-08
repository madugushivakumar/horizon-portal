"use client";

/**
 * Horizon Portal — Compliance Audit Logs Page
 * src/app/admin/audit/page.tsx
 *
 * Provides a dedicated compliance view for inspecting immutable audit records across
 * workforce mutations, status changes, and administrative actions.
 */

import React, { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { TopBarUser } from "@/components/layout/TopBar";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface AuditLogRecord {
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

function AdminAuditPageContent() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<TopBarUser | null>(null);
  const [logs, setLogs] = useState<AuditLogRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/v1/auth/me");
        if (res.ok) {
          const data = await res.json();
          setCurrentUser(data.user);
          if (data.user.role !== "Admin" && data.user.role !== "HR") {
            router.push("/dashboard?error=unauthorized&denied=/admin/audit");
          }
        } else {
          router.push("/login?from=/admin/audit");
        }
      } catch {
        router.push("/login?from=/admin/audit");
      }
    }
    checkAuth();
  }, [router]);

  useEffect(() => {
    async function loadAuditLogs() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("pageSize", "20");
        if (actionFilter !== "all") {
          params.set("action", actionFilter);
        }

        const res = await fetch(`/api/v1/admin/audit?${params.toString()}`);
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Failed to load audit records.");
        }
        const json = await res.json();
        setLogs(json.data || []);
        setTotal(json.pagination?.total || 0);
        setTotalPages(json.pagination?.totalPages || 1);
      } catch (err: any) {
        setError(err.message || "Failed to load audit records.");
      } finally {
        setLoading(false);
      }
    }

    loadAuditLogs();
  }, [page, actionFilter]);

  return (
    <AppShell initialUser={currentUser}>
      <div className="space-y-6">
        <Breadcrumbs
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Administration", href: "/admin/audit" },
            { label: "Compliance Audit Logs" },
          ]}
        />

        {/* Page Title */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">📜</span>
              <h1 className="text-2xl font-black text-[var(--hz-text-primary)] tracking-tight">
                Compliance Audit Logs
              </h1>
              <Badge variant="default">System Activity</Badge>
            </div>
            <p className="text-xs text-[var(--hz-text-muted)] mt-1">
              Immutable compliance events recording who modified workforce data, when, and exact previous and new values.
            </p>
          </div>

          {/* Action Filter */}
          <div className="w-56">
            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--hz-border)] bg-[var(--hz-card-bg)] text-[var(--hz-text-primary)] focus:outline-hidden focus:ring-2 focus:ring-[var(--hz-primary-500)]"
            >
              <option value="all">All Audit Actions</option>
              <option value="EMPLOYEE_CREATED">EMPLOYEE_CREATED</option>
              <option value="EMPLOYEE_UPDATED">EMPLOYEE_UPDATED</option>
              <option value="EMPLOYEE_DEACTIVATED">EMPLOYEE_DEACTIVATED</option>
              <option value="EMPLOYEE_EXPORTED">EMPLOYEE_EXPORTED</option>
            </select>
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="rounded-2xl bg-[var(--hz-card-bg)] border border-[var(--hz-border)] shadow-xs overflow-hidden">
          {error && (
            <div className="p-6 text-center text-xs text-[var(--hz-danger,#b91c1c)] bg-[var(--hz-danger-bg,#fef2f2)]">
              {error}
            </div>
          )}

          {!error && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[var(--hz-neutral-50)] dark:bg-[var(--hz-neutral-850)] border-b border-[var(--hz-border)] text-[var(--hz-text-secondary)] font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3.5">Timestamp</th>
                    <th className="px-4 py-3.5">Actor</th>
                    <th className="px-4 py-3.5">Action</th>
                    <th className="px-4 py-3.5">Employee ID</th>
                    <th className="px-4 py-3.5">Field Changed</th>
                    <th className="px-4 py-3.5">Previous Value</th>
                    <th className="px-4 py-3.5">New Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--hz-border)]">
                  {loading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                      <tr key={`loading-${i}`} className="animate-pulse">
                        <td colSpan={7} className="px-4 py-3.5">
                          <div className="h-4 bg-[var(--hz-neutral-200)] dark:bg-[var(--hz-neutral-800)] rounded w-full" />
                        </td>
                      </tr>
                    ))
                  ) : logs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-16 text-center text-[var(--hz-text-muted)]">
                        No audit events recorded matching current filter.
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr
                        key={log.id}
                        className="hover:bg-[var(--hz-neutral-50)] dark:hover:bg-[var(--hz-neutral-850)] transition-colors"
                      >
                        <td className="px-4 py-3 font-mono text-[11px] text-[var(--hz-text-muted)] whitespace-nowrap">
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
                                : log.action === "EMPLOYEE_EXPORTED"
                                ? "secondary"
                                : "primary"
                            }
                          >
                            {log.action}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 font-mono font-medium text-[var(--hz-text-secondary)]">
                          {log.employeeId || "—"}
                        </td>
                        <td className="px-4 py-3 font-mono text-[var(--hz-text-secondary)]">
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
                          ) : log.details ? (
                            <span className="font-mono text-[11px] text-[var(--hz-text-muted)]">{log.details}</span>
                          ) : (
                            <span className="italic opacity-50">null</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer Pagination */}
          {!loading && logs.length > 0 && (
            <div className="px-6 py-4 border-t border-[var(--hz-border)] bg-[var(--hz-neutral-50)] dark:bg-[var(--hz-neutral-850)] flex items-center justify-between text-xs">
              <span className="text-[var(--hz-text-muted)]">
                Total events: <strong className="text-[var(--hz-text-primary)]">{total}</strong>
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page <= 1}
                >
                  Previous
                </Button>
                <span className="font-semibold text-[var(--hz-text-primary)]">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page >= totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

export default function AdminAuditPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-xs font-semibold text-[var(--hz-text-muted)] animate-pulse">
          Loading Audit Records...
        </div>
      }
    >
      <AdminAuditPageContent />
    </Suspense>
  );
}
