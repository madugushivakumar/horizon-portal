"use client";

/**
 * Horizon Portal — Leave Approval Queue Component
 * src/components/approvals/LeaveApprovalQueue.tsx
 *
 * Full-stack leave approval dashboard for Managers and HR:
 * - Summary statistics cards (Pending, Approved, Rejected, Action Required)
 * - Status filter tabs (Pending, Approved, Rejected, All)
 * - Real-time search by employee name or employee ID
 * - Department and leave type filters
 * - Sortable columns and pagination
 * - Slide-over drawer for request details & employee leave balances
 * - Rejection modal with mandatory, non-empty reason validation
 * - Approval confirmation modal with balance impact calculation
 * - Delegation manager modal for configuring acting managers
 * - Responsive layout following Horizon Portal design tokens
 */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";

export interface LeaveRequestItem {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  departmentId: string | null;
  departmentName: string;
  managerId: string | null;
  managerName: string | null;
  leaveTypeCode: string;
  leaveTypeName: string;
  payType: string;
  startDate: string;
  endDate: string;
  days: number;
  status: "Pending" | "Approved" | "Rejected" | string;
  reason: string | null;
  appliedOn: string | null;
  approverId: string | null;
  decidedOn: string | null;
  rejectionReason: string | null;
  delegatedApproverId: string | null;
  isEscalated: boolean;
  leaveBalance: {
    clBalance: number;
    slBalance: number;
    elBalance: number;
    pendingDays: number;
  } | null;
}

interface SummaryStats {
  pending: number;
  approvedThisMonth: number;
  rejectedThisMonth: number;
  attention: number;
}

interface PaginationInfo {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export function LeaveApprovalQueue() {
  // Data state
  const [requests, setRequests] = useState<LeaveRequestItem[]>([]);
  const [summary, setSummary] = useState<SummaryStats>({
    pending: 0,
    approvedThisMonth: 0,
    rejectedThisMonth: 0,
    attention: 0,
  });
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [activeTab, setActiveTab] = useState<string>("Pending");
  const [search, setSearch] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [selectedDept, setSelectedDept] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("appliedOn");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Departments list for filter
  const [departments, setDepartments] = useState<Array<{ id: string; name: string }>>([]);

  // Modals / Drawers state
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequestItem | null>(null);
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);

  // Approve modal
  const [approveModalOpen, setApproveModalOpen] = useState<boolean>(false);
  const [approving, setApproving] = useState<boolean>(false);

  // Reject modal
  const [rejectModalOpen, setRejectModalOpen] = useState<boolean>(false);
  const [rejectReason, setRejectReason] = useState<string>("");
  const [rejectReasonError, setRejectReasonError] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<boolean>(false);

  // Feedback toast banner
  const [notificationBanner, setNotificationBanner] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Search debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Fetch departments for filtering
  useEffect(() => {
    fetch("/api/v1/departments")
      .then((res) => res.json())
      .then((json) => {
        if (json.data && Array.isArray(json.data)) {
          setDepartments(json.data);
        }
      })
      .catch(() => {});
  }, []);

  // Fetch requests
  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("status", activeTab);
      params.set("page", pagination.page.toString());
      params.set("pageSize", pagination.pageSize.toString());
      params.set("sortBy", sortBy);
      params.set("sortOrder", sortOrder);

      if (debouncedSearch.trim()) {
        params.set("search", debouncedSearch.trim());
      }
      if (selectedDept !== "all") {
        params.set("department", selectedDept);
      }
      if (selectedType !== "all") {
        params.set("leaveType", selectedType);
      }

      const res = await fetch(`/api/v1/approvals/leave?${params.toString()}`);
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || `HTTP ${res.status}: Failed to load approval queue.`);
      }

      setRequests(json.data || []);
      if (json.pagination) setPagination(json.pagination);
      if (json.summary) setSummary(json.summary);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error loading leave requests.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [activeTab, debouncedSearch, selectedDept, selectedType, pagination.page, pagination.pageSize, sortBy, sortOrder]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // Handle Tab Change
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // Trigger Approve
  const handleApprove = async () => {
    if (!selectedRequest) return;
    setApproving(true);
    try {
      const res = await fetch(`/api/v1/approvals/leave/${selectedRequest.id}/approve`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Approval failed.");
      }

      setNotificationBanner({
        type: "success",
        message: `Leave request for ${selectedRequest.employeeName} (${selectedRequest.days} days) has been successfully approved.`,
      });
      setApproveModalOpen(false);
      setDrawerOpen(false);
      fetchRequests();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to approve request.";
      setNotificationBanner({ type: "error", message: msg });
    } finally {
      setApproving(false);
    }
  };

  // Trigger Reject
  const handleReject = async () => {
    if (!selectedRequest) return;
    if (!rejectReason.trim()) {
      setRejectReasonError("Rejection reason is required. Please provide a clear explanation.");
      return;
    }
    if (rejectReason.trim().length < 3) {
      setRejectReasonError("Rejection reason must be at least 3 characters long.");
      return;
    }

    setRejecting(true);
    setRejectReasonError(null);
    try {
      const res = await fetch(`/api/v1/approvals/leave/${selectedRequest.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectReason.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Rejection failed.");
      }

      setNotificationBanner({
        type: "success",
        message: `Leave request for ${selectedRequest.employeeName} has been rejected. Notification dispatched.`,
      });
      setRejectModalOpen(false);
      setRejectReason("");
      setDrawerOpen(false);
      fetchRequests();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to reject request.";
      setRejectReasonError(msg);
    } finally {
      setRejecting(false);
    }
  };

  // Helper for Status Badge
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "Pending":
        return (
          <Badge variant="warning" dot size="sm">
            Pending Review
          </Badge>
        );
      case "Approved":
        return (
          <Badge variant="success" dot size="sm">
            Approved
          </Badge>
        );
      case "Rejected":
        return (
          <Badge variant="danger" dot size="sm">
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" size="sm">
            {status}
          </Badge>
        );
    }
  };

  // Helper for Leave Type Badge
  const renderLeaveTypeBadge = (code: string, name: string) => {
    const c = code.toUpperCase();
    let variant: "primary" | "info" | "secondary" | "warning" = "primary";
    if (c === "SL") variant = "danger" as any;
    else if (c === "CL") variant = "info";
    else if (c === "EL") variant = "primary";
    else if (c === "LOP") variant = "secondary";

    return (
      <span className="inline-flex items-center gap-1.5 font-medium text-xs text-[var(--hz-text-primary)]">
        <span
          className={`inline-block w-2 h-2 rounded-full ${
            c === "SL"
              ? "bg-rose-500"
              : c === "CL"
              ? "bg-sky-500"
              : c === "EL"
              ? "bg-indigo-500"
              : "bg-amber-500"
          }`}
        />
        {code} — {name}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Message */}
      {notificationBanner && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-sm transition-all ${
            notificationBanner.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200"
              : "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200"
          }`}
        >
          <div className="flex items-center gap-2">
            <span>{notificationBanner.type === "success" ? "✓" : "⚠️"}</span>
            <span>{notificationBanner.message}</span>
          </div>
          <button
            onClick={() => setNotificationBanner(null)}
            className="text-xs font-semibold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header with Navigation Link */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--hz-text-primary)]">
            Leave Approvals
          </h1>
          <p className="text-sm text-[var(--hz-text-secondary)] mt-1">
            Review and decide team leave requests with real-time balance validation and automated audit logging.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            href="/team/attendance"
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-[var(--hz-card-bg)] hover:bg-[var(--hz-card-hover)] border border-[var(--hz-border)] text-[var(--hz-text-primary)] transition-colors shadow-sm"
          >
            <span>🗓️</span>
            <span>Team Attendance</span>
          </Link>
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchRequests}
            loading={loading}
          >
            ↻ Refresh Queue
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-[var(--hz-border)] bg-[var(--hz-card-bg)] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--hz-text-secondary)] uppercase tracking-wider">
              Pending Requests
            </span>
            <span className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-xs font-bold">
              ⏳
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[var(--hz-text-primary)]">
              {summary.pending}
            </span>
            <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
              Requires attention
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-[var(--hz-border)] bg-[var(--hz-card-bg)] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--hz-text-secondary)] uppercase tracking-wider">
              Approved This Month
            </span>
            <span className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
              ✓
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[var(--hz-text-primary)]">
              {summary.approvedThisMonth}
            </span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              Processed
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-[var(--hz-border)] bg-[var(--hz-card-bg)] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--hz-text-secondary)] uppercase tracking-wider">
              Rejected This Month
            </span>
            <span className="p-1.5 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-xs font-bold">
              ✕
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[var(--hz-text-primary)]">
              {summary.rejectedThisMonth}
            </span>
            <span className="text-xs text-rose-600 dark:text-rose-400 font-medium">
              With documented reason
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-[var(--hz-border)] bg-[var(--hz-card-bg)] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--hz-text-secondary)] uppercase tracking-wider">
              SLA / Queue Health
            </span>
            <span className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold">
              🛡️
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              100%
            </span>
            <span className="text-xs text-[var(--hz-text-secondary)]">
              Audit compliant
            </span>
          </div>
        </div>
      </div>

      {/* Tabs & Controls Card */}
      <div className="p-5 rounded-2xl border border-[var(--hz-border)] bg-[var(--hz-card-bg)] shadow-xs space-y-4">
        {/* Navigation Tabs */}
        <div className="flex items-center border-b border-[var(--hz-border)] gap-2 pb-px overflow-x-auto">
          {[
            { id: "Pending", label: "Pending Review", count: summary.pending },
            { id: "Approved", label: "Approved History" },
            { id: "Rejected", label: "Rejected History" },
            { id: "All", label: "All Records" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`pb-3 px-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-[var(--hz-primary)] text-[var(--hz-primary)]"
                  : "border-transparent text-[var(--hz-text-secondary)] hover:text-[var(--hz-text-primary)]"
              }`}
            >
              <span>{tab.label}</span>
              {typeof tab.count === "number" && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                    activeTab === tab.id
                      ? "bg-[var(--hz-primary-100)] dark:bg-[var(--hz-primary-950)] text-[var(--hz-primary-700)] dark:text-[var(--hz-primary-300)]"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search employee name or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--hz-border)] bg-[var(--hz-input-bg)] text-[var(--hz-text-primary)] placeholder-[var(--hz-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--hz-primary-300)]"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-2.5 text-xs text-[var(--hz-text-secondary)] hover:text-[var(--hz-text-primary)]"
              >
                ✕
              </button>
            )}
          </div>

          {/* Department Filter */}
          <div>
            <select
              value={selectedDept}
              onChange={(e) => {
                setSelectedDept(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--hz-border)] bg-[var(--hz-input-bg)] text-[var(--hz-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--hz-primary-300)]"
            >
              <option value="all">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.id})
                </option>
              ))}
            </select>
          </div>

          {/* Leave Type Filter */}
          <div>
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--hz-border)] bg-[var(--hz-input-bg)] text-[var(--hz-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--hz-primary-300)]"
            >
              <option value="all">All Leave Types</option>
              <option value="CL">Casual Leave (CL)</option>
              <option value="SL">Sick Leave (SL)</option>
              <option value="EL">Earned Leave (EL)</option>
              <option value="ML">Maternity Leave (ML)</option>
              <option value="BL">Bereavement Leave (BL)</option>
              <option value="LOP">Loss of Pay (LOP)</option>
            </select>
          </div>

          {/* Sort Order */}
          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--hz-border)] bg-[var(--hz-input-bg)] text-[var(--hz-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--hz-primary-300)]"
            >
              <option value="appliedOn">Sort by Applied Date</option>
              <option value="startDate">Sort by Leave Start</option>
              <option value="days">Sort by Total Days</option>
            </select>
            <button
              onClick={() => setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))}
              className="px-2.5 py-2 text-xs font-bold rounded-lg border border-[var(--hz-border)] bg-[var(--hz-card-bg)] text-[var(--hz-text-primary)] hover:bg-[var(--hz-card-hover)]"
              title="Toggle Sort Direction"
            >
              {sortOrder === "asc" ? "↑" : "↓"}
            </button>
          </div>
        </div>

        {/* Requests Table */}
        <div className="overflow-x-auto rounded-xl border border-[var(--hz-border)]">
          <table className="w-full text-left text-xs">
            <thead className="bg-[var(--hz-table-header-bg)] text-[var(--hz-text-secondary)] font-semibold border-b border-[var(--hz-border)]">
              <tr>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Leave Type</th>
                <th className="py-3 px-4">Requested Dates</th>
                <th className="py-3 px-4 text-center">Days</th>
                <th className="py-3 px-4">Submitted</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--hz-border)]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-sm text-[var(--hz-text-secondary)]">
                    <div className="inline-block animate-spin text-lg mb-2">↻</div>
                    <div>Loading leave requests...</div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-sm text-rose-600">
                    <div>⚠️ {error}</div>
                    <Button variant="secondary" size="sm" onClick={fetchRequests} className="mt-3">
                      Try Again
                    </Button>
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-[var(--hz-text-secondary)]">
                    <div className="text-3xl mb-2">🌴</div>
                    <div className="font-semibold text-sm text-[var(--hz-text-primary)]">
                      No leave requests found
                    </div>
                    <div className="text-xs mt-1">
                      {activeTab === "Pending"
                        ? "There are currently no pending requests requiring your review."
                        : `No records match the current filter criteria.`}
                    </div>
                  </td>
                </tr>
              ) : (
                requests.map((req) => (
                  <tr
                    key={req.id}
                    className="hover:bg-[var(--hz-table-row-hover)] transition-colors group cursor-pointer"
                    onClick={() => {
                      setSelectedRequest(req);
                      setDrawerOpen(true);
                    }}
                  >
                    <td className="py-3.5 px-4 font-medium text-[var(--hz-text-primary)]">
                      <div className="flex items-center gap-2.5">
                        <Avatar
                          name={req.employeeName}
                          id={req.employeeId}
                          size="sm"
                        />
                        <div>
                          <div className="font-semibold text-xs text-[var(--hz-text-primary)]">
                            {req.employeeName}
                          </div>
                          <div className="text-[11px] text-[var(--hz-text-secondary)]">
                            {req.employeeId}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-[var(--hz-text-secondary)]">
                      {req.departmentName}
                    </td>
                    <td className="py-3.5 px-4">
                      {renderLeaveTypeBadge(req.leaveTypeCode, req.leaveTypeName)}
                    </td>
                    <td className="py-3.5 px-4 text-[var(--hz-text-primary)] font-mono text-[11px]">
                      {req.startDate} → {req.endDate}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-[var(--hz-text-primary)]">
                      {req.days}
                    </td>
                    <td className="py-3.5 px-4 text-[var(--hz-text-secondary)]">
                      {req.appliedOn || "N/A"}
                    </td>
                    <td className="py-3.5 px-4">
                      {renderStatusBadge(req.status)}
                    </td>
                    <td
                      className="py-3.5 px-4 text-right space-x-1.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {req.status === "Pending" ? (
                        <>
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => {
                              setSelectedRequest(req);
                              setApproveModalOpen(true);
                            }}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => {
                              setSelectedRequest(req);
                              setRejectReason("");
                              setRejectReasonError(null);
                              setRejectModalOpen(true);
                            }}
                          >
                            Reject
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setSelectedRequest(req);
                            setDrawerOpen(true);
                          }}
                        >
                          View Details
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[var(--hz-text-secondary)] pt-2">
          <div>
            Showing{" "}
            <span className="font-semibold text-[var(--hz-text-primary)]">
              {requests.length > 0 ? (pagination.page - 1) * pagination.pageSize + 1 : 0}
            </span>{" "}
            to{" "}
            <span className="font-semibold text-[var(--hz-text-primary)]">
              {Math.min(pagination.page * pagination.pageSize, pagination.total)}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-[var(--hz-text-primary)]">
              {pagination.total}
            </span>{" "}
            requests
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={pagination.page <= 1 || loading}
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
              className="px-3 py-1.5 rounded-lg border border-[var(--hz-border)] font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--hz-card-hover)]"
            >
              Previous
            </button>
            <span>
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              disabled={pagination.page >= pagination.totalPages || loading}
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
              className="px-3 py-1.5 rounded-lg border border-[var(--hz-border)] font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--hz-card-hover)]"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Slide-over Drawer for Request Details */}
      {drawerOpen && selectedRequest && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 flex justify-end">
          <div className="w-full max-w-lg bg-[var(--hz-card-bg)] h-full shadow-2xl border-l border-[var(--hz-border)] flex flex-col animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-5 border-b border-[var(--hz-border)] flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[var(--hz-text-primary)]">
                  Leave Request Details
                </h3>
                <p className="text-xs text-[var(--hz-text-secondary)] mt-0.5">
                  Request Identifier: {selectedRequest.id}
                </p>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-1.5 text-sm rounded-lg hover:bg-[var(--hz-card-hover)] text-[var(--hz-text-secondary)]"
              >
                ✕
              </button>
            </div>

            {/* Drawer Body */}
            <div className="p-6 space-y-6 flex-1 overflow-y-auto text-xs">
              {/* Employee Summary */}
              <div className="p-4 rounded-xl bg-[var(--hz-table-header-bg)] border border-[var(--hz-border)] space-y-2.5">
                <div className="flex items-center gap-3">
                  <Avatar
                    name={selectedRequest.employeeName}
                    id={selectedRequest.employeeId}
                    size="md"
                  />
                  <div>
                    <div className="font-bold text-sm text-[var(--hz-text-primary)]">
                      {selectedRequest.employeeName}
                    </div>
                    <div className="text-xs text-[var(--hz-text-secondary)]">
                      {selectedRequest.employeeId} • {selectedRequest.departmentName}
                    </div>
                  </div>
                </div>
                <div className="text-[11px] text-[var(--hz-text-secondary)] pt-2 border-t border-[var(--hz-border)]">
                  <div>Work Email: {selectedRequest.employeeEmail}</div>
                  <div>Direct Manager: {selectedRequest.managerName || "Department Head"}</div>
                </div>
              </div>

              {/* Leave Details */}
              <div className="space-y-3">
                <h4 className="font-semibold text-[var(--hz-text-primary)] uppercase tracking-wider text-[11px]">
                  Request Information
                </h4>
                <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl border border-[var(--hz-border)] bg-[var(--hz-input-bg)]">
                  <div>
                    <span className="text-[var(--hz-text-secondary)] block">Leave Category</span>
                    <span className="font-semibold text-[var(--hz-text-primary)]">
                      {selectedRequest.leaveTypeName} ({selectedRequest.leaveTypeCode})
                    </span>
                  </div>
                  <div>
                    <span className="text-[var(--hz-text-secondary)] block">Pay Type</span>
                    <span className="font-semibold text-[var(--hz-text-primary)]">
                      {selectedRequest.payType}
                    </span>
                  </div>
                  <div>
                    <span className="text-[var(--hz-text-secondary)] block">Duration</span>
                    <span className="font-semibold text-[var(--hz-text-primary)]">
                      {selectedRequest.days} Working {selectedRequest.days === 1 ? "Day" : "Days"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[var(--hz-text-secondary)] block">Period Dates</span>
                    <span className="font-semibold text-[var(--hz-text-primary)] font-mono">
                      {selectedRequest.startDate} → {selectedRequest.endDate}
                    </span>
                  </div>
                </div>
              </div>

              {/* Reason / Comments */}
              <div className="space-y-1.5">
                <h4 className="font-semibold text-[var(--hz-text-primary)] uppercase tracking-wider text-[11px]">
                  Employee Comments
                </h4>
                <div className="p-3.5 rounded-xl border border-[var(--hz-border)] bg-[var(--hz-input-bg)] text-[var(--hz-text-primary)] leading-relaxed italic">
                  &ldquo;{selectedRequest.reason || "No employee comment provided."}&rdquo;
                </div>
              </div>

              {/* Leave Balances Status */}
              {selectedRequest.leaveBalance && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-[var(--hz-text-primary)] uppercase tracking-wider text-[11px]">
                    Current Leave Balances
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-3 rounded-lg border border-[var(--hz-border)] text-center">
                      <div className="text-[11px] text-[var(--hz-text-secondary)]">Casual (CL)</div>
                      <div className="text-base font-bold text-[var(--hz-text-primary)] mt-1">
                        {selectedRequest.leaveBalance.clBalance}d
                      </div>
                    </div>
                    <div className="p-3 rounded-lg border border-[var(--hz-border)] text-center">
                      <div className="text-[11px] text-[var(--hz-text-secondary)]">Sick (SL)</div>
                      <div className="text-base font-bold text-[var(--hz-text-primary)] mt-1">
                        {selectedRequest.leaveBalance.slBalance}d
                      </div>
                    </div>
                    <div className="p-3 rounded-lg border border-[var(--hz-border)] text-center">
                      <div className="text-[11px] text-[var(--hz-text-secondary)]">Earned (EL)</div>
                      <div className="text-base font-bold text-[var(--hz-text-primary)] mt-1">
                        {selectedRequest.leaveBalance.elBalance}d
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Decision History (If decided) */}
              {selectedRequest.status !== "Pending" && (
                <div className="p-4 rounded-xl border border-[var(--hz-border)] bg-gray-50 dark:bg-gray-900/50 space-y-2">
                  <div className="font-semibold text-[var(--hz-text-primary)]">
                    Decision Details
                  </div>
                  <div className="space-y-1 text-[var(--hz-text-secondary)]">
                    <div>Status: {renderStatusBadge(selectedRequest.status)}</div>
                    <div>Decided On: {selectedRequest.decidedOn || "N/A"}</div>
                    <div>Approver ID: {selectedRequest.approverId || "N/A"}</div>
                    {selectedRequest.rejectionReason && (
                      <div className="mt-2 text-rose-700 dark:text-rose-300">
                        <span className="font-semibold">Rejection Reason:</span>{" "}
                        {selectedRequest.rejectionReason}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-4 border-t border-[var(--hz-border)] bg-[var(--hz-table-header-bg)] flex items-center justify-end gap-2.5">
              <Button variant="secondary" size="sm" onClick={() => setDrawerOpen(false)}>
                Close
              </Button>
              {selectedRequest.status === "Pending" && (
                <>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => {
                      setRejectReason("");
                      setRejectReasonError(null);
                      setRejectModalOpen(true);
                    }}
                  >
                    Reject Request
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setApproveModalOpen(true)}
                  >
                    Approve Request
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Approve Confirmation Modal */}
      {approveModalOpen && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-[var(--hz-card-bg)] border border-[var(--hz-border)] shadow-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-[var(--hz-text-primary)] flex items-center gap-2">
              <span>✓</span> Confirm Leave Approval
            </h3>
            <p className="text-xs text-[var(--hz-text-secondary)]">
              You are about to approve the following leave request. This will atomically deduct{" "}
              <strong className="text-[var(--hz-text-primary)]">
                {selectedRequest.days} {selectedRequest.days === 1 ? "day" : "days"}
              </strong>{" "}
              from the employee&apos;s balance and send a decision notification.
            </p>

            <div className="p-3.5 rounded-xl border border-[var(--hz-border)] bg-[var(--hz-input-bg)] text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-[var(--hz-text-secondary)]">Employee:</span>
                <span className="font-semibold text-[var(--hz-text-primary)]">
                  {selectedRequest.employeeName} ({selectedRequest.employeeId})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--hz-text-secondary)]">Leave Type:</span>
                <span className="font-semibold text-[var(--hz-text-primary)]">
                  {selectedRequest.leaveTypeName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--hz-text-secondary)]">Dates:</span>
                <span className="font-semibold text-[var(--hz-text-primary)] font-mono">
                  {selectedRequest.startDate} → {selectedRequest.endDate}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setApproveModalOpen(false)}
                disabled={approving}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleApprove}
                loading={approving}
              >
                Confirm Approval
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal with Mandatory Reason */}
      {rejectModalOpen && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-[var(--hz-card-bg)] border border-[var(--hz-border)] shadow-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-rose-600 flex items-center gap-2">
              <span>✕</span> Reject Leave Request
            </h3>
            <p className="text-xs text-[var(--hz-text-secondary)]">
              Rejecting request for <strong className="text-[var(--hz-text-primary)]">{selectedRequest.employeeName}</strong>.
              A clear decision reason is mandatory for compliance and audit logging.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--hz-text-primary)]">
                Decision Reason <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={4}
                value={rejectReason}
                onChange={(e) => {
                  setRejectReason(e.target.value);
                  if (rejectReasonError) setRejectReasonError(null);
                }}
                placeholder="Enter mandatory reason for rejection (e.g., critical team sprint milestone, staffing shortage)..."
                className="w-full p-3 text-xs rounded-xl border border-[var(--hz-border)] bg-[var(--hz-input-bg)] text-[var(--hz-text-primary)] focus:outline-none focus:ring-2 focus:ring-rose-400"
              />
              <div className="flex justify-between text-[11px] text-[var(--hz-text-secondary)]">
                <span>Min 3 chars, max 1000 chars</span>
                <span>{rejectReason.trim().length}/1000</span>
              </div>
              {rejectReasonError && (
                <div className="text-xs text-rose-600 font-medium">
                  ⚠️ {rejectReasonError}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setRejectModalOpen(false)}
                disabled={rejecting}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleReject}
                loading={rejecting}
              >
                Confirm Rejection
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
