"use client";

/**
 * Horizon Portal — Unified Multi-Domain Approval Center Component
 * src/components/approvals/UnifiedApprovalCenter.tsx
 *
 * Full-stack unified approvals dashboard for Managers and HR:
 * - Domain 1: Leave Requests
 * - Domain 2: Corporate Expense Authorizations
 * - Executive summary KPI cards (Total Pending, Pending Leave, Pending Expenses, Approved, Rejected)
 * - Domain selector tabs (All Domains, Leave Requests, Corporate Expenses)
 * - Status filter tabs (Pending, Approved, Rejected, All)
 * - Real-time search by requester name, title, reference number, or vendor
 * - Detail inspection modal with domain-specific breakdowns and audit trails
 * - Rejection modal with mandatory non-empty reason validation (minimum 3 characters)
 * - Approval confirmation modal
 * - Server-side authorization verification with self-approval safeguards
 * - Mobile-first responsive layout (360px stacked cards, 768px tablet, desktop enterprise table)
 */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface UnifiedApprovalItem {
  id: string;
  domain: "leave" | "corporate-expense";
  domainLabel: string;
  referenceNumber: string;
  title: string;
  requester: {
    id: string;
    name: string;
    email: string;
    departmentName: string;
    avatarUrl?: string | null;
  };
  departmentName: string;
  requestedDate: string;
  amountOrDuration: string;
  amount?: number;
  currency?: string;
  durationDays?: number;
  status: "PENDING_APPROVAL" | "APPROVED" | "REJECTED";
  statusLabel: string;
  canApprove: boolean;
  details: Record<string, any>;
}

interface SummaryMetrics {
  totalPending: number;
  pendingLeave: number;
  pendingExpense: number;
  totalApproved: number;
  totalRejected: number;
}

export function UnifiedApprovalCenter() {
  const [domainFilter, setDomainFilter] = useState<"all" | "leave" | "corporate-expense">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");

  const [items, setItems] = useState<UnifiedApprovalItem[]>([]);
  const [summary, setSummary] = useState<SummaryMetrics>({
    totalPending: 0,
    pendingLeave: 0,
    pendingExpense: 0,
    totalApproved: 0,
    totalRejected: 0,
  });

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Modals state
  const [detailItem, setDetailItem] = useState<UnifiedApprovalItem | null>(null);
  const [approveItem, setApproveItem] = useState<UnifiedApprovalItem | null>(null);
  const [approvalNotes, setApprovalNotes] = useState("");

  const [rejectItem, setRejectItem] = useState<UnifiedApprovalItem | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectionError, setRejectionError] = useState<string | null>(null);

  // Fetch unified approvals data
  const fetchData = useCallback(async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const params = new URLSearchParams();
      if (domainFilter !== "all") params.set("domain", domainFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (searchTerm.trim()) params.set("search", searchTerm.trim());
      if (departmentFilter.trim()) params.set("departmentId", departmentFilter.trim());

      const res = await fetch(`/api/v1/approvals?${params.toString()}`);
      const json = await res.json();

      if (res.ok && json.success) {
        setItems(json.data || []);
        if (json.summary) {
          setSummary(json.summary);
        }
      } else {
        setFeedback({
          type: "error",
          message: json.error || "Failed to load approval requests.",
        });
      }
    } catch (err: any) {
      console.error("Error fetching approvals:", err);
      setFeedback({
        type: "error",
        message: "Network or server error while retrieving approvals queue.",
      });
    } finally {
      setLoading(false);
    }
  }, [domainFilter, statusFilter, searchTerm, departmentFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle Approve action
  const handleApprove = async () => {
    if (!approveItem) return;
    setActionLoading(true);
    try {
      const url =
        approveItem.domain === "leave"
          ? `/api/v1/approvals/leave/${approveItem.id}/approve`
          : `/api/v1/approvals/expense-authorizations/${approveItem.id}/approve`;

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approvalNotes: approvalNotes.trim() || undefined }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setFeedback({
          type: "success",
          message: json.message || `${approveItem.domainLabel} ${approveItem.referenceNumber} approved successfully.`,
        });
        setApproveItem(null);
        setApprovalNotes("");
        fetchData();
      } else {
        setFeedback({
          type: "error",
          message: json.error || "Failed to approve request.",
        });
      }
    } catch (err) {
      console.error("Approve error:", err);
      setFeedback({ type: "error", message: "Unexpected error during approval action." });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Reject action
  const handleReject = async () => {
    if (!rejectItem) return;
    if (!rejectionReason.trim() || rejectionReason.trim().length < 3) {
      setRejectionError("Rejection reason must be at least 3 characters long.");
      return;
    }
    setRejectionError(null);
    setActionLoading(true);

    try {
      const url =
        rejectItem.domain === "leave"
          ? `/api/v1/approvals/leave/${rejectItem.id}/reject`
          : `/api/v1/approvals/expense-authorizations/${rejectItem.id}/reject`;

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rejectionReason: rejectionReason.trim(), reason: rejectionReason.trim() }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setFeedback({
          type: "success",
          message: json.message || `${rejectItem.domainLabel} ${rejectItem.referenceNumber} rejected successfully.`,
        });
        setRejectItem(null);
        setRejectionReason("");
        fetchData();
      } else {
        setFeedback({
          type: "error",
          message: json.error || "Failed to reject request.",
        });
      }
    } catch (err) {
      console.error("Reject error:", err);
      setFeedback({ type: "error", message: "Unexpected error during rejection action." });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">
            Unified Approval Center
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Unified multi-domain governance: Review, authorize, and audit employee Leave Requests and Corporate Expense Authorizations.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            onClick={fetchData}
            disabled={loading}
            aria-label="Refresh approval queue"
            className="flex items-center gap-2 text-sm"
          >
            <span>↻</span>
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Alert / Feedback Banner */}
      {feedback && (
        <div
          role="alert"
          className={`p-4 rounded-lg flex items-center justify-between text-sm ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="font-semibold">
              {feedback.type === "success" ? "✓ Success:" : "⚠ Notice:"}
            </span>
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-gray-500 hover:text-gray-700 font-bold ml-4"
            aria-label="Dismiss message"
          >
            ✕
          </button>
        </div>
      )}

      {/* 2. Summary KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
        {/* Total Pending */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
            Total Pending
          </div>
          <div className="mt-2 text-2xl md:text-3xl font-extrabold text-amber-900">
            {summary.totalPending}
          </div>
          <div className="mt-1 text-xs text-amber-600">Awaiting your review</div>
        </div>

        {/* Pending Leave Requests */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs font-semibold text-blue-700 uppercase tracking-wider">
            Pending Leave
          </div>
          <div className="mt-2 text-2xl md:text-3xl font-extrabold text-blue-900">
            {summary.pendingLeave}
          </div>
          <div className="mt-1 text-xs text-blue-600">Employee leave requests</div>
        </div>

        {/* Pending Corporate Expenses */}
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs font-semibold text-purple-700 uppercase tracking-wider">
            Pending Expenses
          </div>
          <div className="mt-2 text-2xl md:text-3xl font-extrabold text-purple-900">
            {summary.pendingExpense}
          </div>
          <div className="mt-1 text-xs text-purple-600">Budget commitments</div>
        </div>

        {/* Approved Total */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
            Approved Total
          </div>
          <div className="mt-2 text-2xl md:text-3xl font-extrabold text-emerald-900">
            {summary.totalApproved}
          </div>
          <div className="mt-1 text-xs text-emerald-600">Across all domains</div>
        </div>

        {/* Rejected Total */}
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 shadow-xs col-span-2 sm:col-span-1">
          <div className="text-xs font-semibold text-rose-700 uppercase tracking-wider">
            Rejected Total
          </div>
          <div className="mt-2 text-2xl md:text-3xl font-extrabold text-rose-900">
            {summary.totalRejected}
          </div>
          <div className="mt-1 text-xs text-rose-600">With documented reasons</div>
        </div>
      </div>

      {/* 3. Filters & Controls */}
      <div className="space-y-4 bg-white p-4 md:p-5 rounded-xl border border-gray-200 shadow-xs">
        {/* Domain Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 pb-3">
          <span className="text-xs font-medium text-gray-500 uppercase mr-2">Domain:</span>
          <button
            onClick={() => setDomainFilter("all")}
            className={`px-3 py-1.5 text-xs md:text-sm font-medium rounded-lg transition-colors ${
              domainFilter === "all"
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            All Domains ({summary.totalPending})
          </button>
          <button
            onClick={() => setDomainFilter("leave")}
            className={`px-3 py-1.5 text-xs md:text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
              domainFilter === "leave"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <span>Leave Requests</span>
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
              {summary.pendingLeave}
            </span>
          </button>
          <button
            onClick={() => setDomainFilter("corporate-expense")}
            className={`px-3 py-1.5 text-xs md:text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
              domainFilter === "corporate-expense"
                ? "bg-purple-600 text-white shadow-xs"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <span>Corporate Expenses</span>
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-800">
              {summary.pendingExpense}
            </span>
          </button>
        </div>

        {/* Status Tabs and Search */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-xs font-medium text-gray-500 uppercase mr-1">Status:</span>
            {(["pending", "approved", "rejected", "all"] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 text-xs md:text-sm font-medium rounded-md capitalize transition-colors ${
                  statusFilter === st
                    ? "bg-gray-900 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="w-full md:w-72">
            <input
              type="text"
              placeholder="Search by requester, title, ref..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs md:text-sm px-3 py-2 border border-gray-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* 4. Queue Items List / Table */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-gray-100 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <div className="text-4xl text-gray-400 mb-3">✓</div>
          <h3 className="text-lg font-medium text-gray-900">No requests found</h3>
          <p className="mt-1 text-sm text-gray-500">
            There are no approval requests matching your current domain and status filter criteria.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 font-medium text-xs uppercase tracking-wider">
                <tr>
                  <th scope="col" className="px-5 py-3">Domain</th>
                  <th scope="col" className="px-5 py-3">Reference</th>
                  <th scope="col" className="px-5 py-3">Title / Description</th>
                  <th scope="col" className="px-5 py-3">Requester & Dept</th>
                  <th scope="col" className="px-5 py-3">Amount / Duration</th>
                  <th scope="col" className="px-5 py-3">Submitted</th>
                  <th scope="col" className="px-5 py-3">Status</th>
                  <th scope="col" className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {items.map((item) => (
                  <tr key={`${item.domain}-${item.id}`} className="hover:bg-gray-50/80 transition-colors">
                    {/* Domain */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      {item.domain === "leave" ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          Leave Request
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                          Corporate Expense
                        </span>
                      )}
                    </td>

                    {/* Reference */}
                    <td className="px-5 py-4 whitespace-nowrap font-mono text-xs font-bold text-gray-700">
                      {item.referenceNumber}
                    </td>

                    {/* Title */}
                    <td className="px-5 py-4 max-w-xs truncate font-medium text-gray-900">
                      {item.title}
                    </td>

                    {/* Requester & Dept */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{item.requester.name}</div>
                      <div className="text-xs text-gray-500">{item.departmentName}</div>
                    </td>

                    {/* Amount / Duration */}
                    <td className="px-5 py-4 whitespace-nowrap font-semibold text-gray-900">
                      {item.amountOrDuration}
                    </td>

                    {/* Date */}
                    <td className="px-5 py-4 whitespace-nowrap text-xs text-gray-500">
                      {item.requestedDate}
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      {item.status === "PENDING_APPROVAL" ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          Pending
                        </span>
                      ) : item.status === "APPROVED" ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Approved
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          Rejected
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setDetailItem(item)}
                          className="text-xs font-medium text-indigo-600 hover:text-indigo-800 px-2 py-1 rounded-md hover:bg-indigo-50 transition-colors"
                        >
                          View Details
                        </button>
                        {item.canApprove && (
                          <>
                            <button
                              onClick={() => {
                                setApproveItem(item);
                                setApprovalNotes("");
                              }}
                              className="text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 px-2.5 py-1 rounded-md shadow-xs transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                setRejectItem(item);
                                setRejectionReason("");
                                setRejectionError(null);
                              }}
                              className="text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 px-2.5 py-1 rounded-md shadow-xs transition-colors"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile / Tablet Cards View */}
          <div className="lg:hidden divide-y divide-gray-200">
            {items.map((item) => (
              <div key={`${item.domain}-${item.id}`} className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-gray-500">
                    {item.referenceNumber}
                  </span>
                  {item.domain === "leave" ? (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                      Leave Request
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
                      Corporate Expense
                    </span>
                  )}
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 text-sm">{item.title}</h4>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {item.requester.name} • {item.departmentName}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <div>
                    <span className="text-gray-400">Amount / Duration: </span>
                    <span className="font-bold text-gray-900">{item.amountOrDuration}</span>
                  </div>
                  <div>
                    {item.status === "PENDING_APPROVAL" ? (
                      <span className="px-2 py-0.5 rounded-full font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                        Pending
                      </span>
                    ) : item.status === "APPROVED" ? (
                      <span className="px-2 py-0.5 rounded-full font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Approved
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                        Rejected
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                  <button
                    onClick={() => setDetailItem(item)}
                    className="text-xs font-medium text-gray-600 hover:text-gray-900 px-2 py-1"
                  >
                    Details
                  </button>
                  {item.canApprove && (
                    <>
                      <button
                        onClick={() => {
                          setApproveItem(item);
                          setApprovalNotes("");
                        }}
                        className="text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-md"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => {
                          setRejectItem(item);
                          setRejectionReason("");
                          setRejectionError(null);
                        }}
                        className="text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 px-3 py-1.5 rounded-md"
                      >
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Detail Modal */}
      {detailItem && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 overflow-y-auto bg-black/50 flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <span className="text-xs font-mono font-bold text-gray-400">
                  {detailItem.referenceNumber}
                </span>
                <h3 className="text-lg font-bold text-gray-900">{detailItem.title}</h3>
              </div>
              <button
                onClick={() => setDetailItem(null)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold"
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2 bg-gray-50 p-3 rounded-lg">
                <div>
                  <span className="text-xs text-gray-500">Requester</span>
                  <div className="font-semibold text-gray-900">{detailItem.requester.name}</div>
                  <div className="text-xs text-gray-500">{detailItem.requester.email}</div>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Department</span>
                  <div className="font-semibold text-gray-900">{detailItem.departmentName}</div>
                </div>
              </div>

              {detailItem.domain === "leave" ? (
                /* Domain 1: Leave Specifics */
                <div className="space-y-2 border-t pt-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Leave Dates:</span>
                    <span className="font-medium">
                      {detailItem.details.startDate} to {detailItem.details.endDate}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Duration:</span>
                    <span className="font-semibold">{detailItem.amountOrDuration}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Pay Type:</span>
                    <span className="font-medium">{detailItem.details.payType || "Paid"}</span>
                  </div>
                  {detailItem.details.reason && (
                    <div className="pt-1">
                      <span className="text-xs text-gray-500 block">Applicant Reason:</span>
                      <p className="text-gray-700 bg-gray-50 p-2 rounded-md text-xs mt-1">
                        {detailItem.details.reason}
                      </p>
                    </div>
                  )}
                  {detailItem.details.leaveBalance && (
                    <div className="bg-blue-50 p-3 rounded-lg text-xs space-y-1 mt-2">
                      <span className="font-bold text-blue-900 block">Remaining Balance Quota:</span>
                      <div className="grid grid-cols-3 gap-2 text-center pt-1">
                        <div className="bg-white p-1 rounded-sm">
                          <span className="text-gray-500 block">Casual</span>
                          <span className="font-bold text-blue-700">{detailItem.details.leaveBalance.clBalance}d</span>
                        </div>
                        <div className="bg-white p-1 rounded-sm">
                          <span className="text-gray-500 block">Sick</span>
                          <span className="font-bold text-blue-700">{detailItem.details.leaveBalance.slBalance}d</span>
                        </div>
                        <div className="bg-white p-1 rounded-sm">
                          <span className="text-gray-500 block">Earned</span>
                          <span className="font-bold text-blue-700">{detailItem.details.leaveBalance.elBalance}d</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Domain 2: Corporate Expense Specifics */
                <div className="space-y-2 border-t pt-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Requested Commitment:</span>
                    <span className="font-bold text-purple-900">{detailItem.amountOrDuration}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Chart of Accounts Category:</span>
                    <span className="font-mono text-xs font-semibold">{detailItem.details.category}</span>
                  </div>
                  {detailItem.details.vendorName && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Proposed Vendor:</span>
                      <span className="font-medium">{detailItem.details.vendorName}</span>
                    </div>
                  )}
                  {detailItem.details.description && (
                    <div className="pt-1">
                      <span className="text-xs text-gray-500 block">Business Justification:</span>
                      <p className="text-gray-700 bg-gray-50 p-2 rounded-md text-xs mt-1">
                        {detailItem.details.description}
                      </p>
                    </div>
                  )}
                  <div className="bg-purple-50 p-2.5 rounded-lg text-xs text-purple-800 border border-purple-200 mt-2">
                    <span className="font-bold">Governance Note:</span> Corporate Expense Authorizations establish authorized departmental budgetary commitments. Formal invoice settlement proceeds through Accounts Payable.
                  </div>
                </div>
              )}
            </div>

            <div className="border-t pt-4 flex justify-end">
              <Button variant="secondary" onClick={() => setDetailItem(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Approval Confirmation Modal */}
      {approveItem && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 overflow-y-auto bg-black/50 flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-gray-900">
              Confirm {approveItem.domainLabel} Approval
            </h3>
            <p className="text-sm text-gray-600">
              Are you sure you want to approve request{" "}
              <strong className="text-gray-900">{approveItem.referenceNumber}</strong> submitted by{" "}
              <strong className="text-gray-900">{approveItem.requester.name}</strong> for{" "}
              <strong className="text-gray-900">{approveItem.amountOrDuration}</strong>?
            </p>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Approval Notes (Optional):
              </label>
              <textarea
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                placeholder="Add optional notes for the audit trail..."
                rows={2}
                className="w-full text-xs p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t">
              <Button
                variant="secondary"
                onClick={() => setApproveItem(null)}
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleApprove}
                disabled={actionLoading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {actionLoading ? "Approving..." : "Confirm Approval"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Rejection Modal with Mandatory Reason */}
      {rejectItem && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 overflow-y-auto bg-black/50 flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2 text-rose-600">
              <span className="text-xl">⚠</span>
              <h3 className="text-lg font-bold text-gray-900">
                Reject {rejectItem.domainLabel}
              </h3>
            </div>
            <p className="text-sm text-gray-600">
              You are rejecting request{" "}
              <strong className="text-gray-900">{rejectItem.referenceNumber}</strong> from{" "}
              <strong className="text-gray-900">{rejectItem.requester.name}</strong>. A mandatory reason is required for governance and compliance.
            </p>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Rejection Reason (Mandatory, minimum 3 characters):
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => {
                  setRejectionReason(e.target.value);
                  if (rejectionError) setRejectionError(null);
                }}
                placeholder="State the formal business or policy justification for rejection..."
                rows={3}
                required
                className="w-full text-xs p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
              />
              {rejectionError && (
                <p className="text-xs text-rose-600 mt-1 font-medium">{rejectionError}</p>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t">
              <Button
                variant="secondary"
                onClick={() => setRejectItem(null)}
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleReject}
                disabled={actionLoading || rejectionReason.trim().length < 3}
                className="bg-rose-600 hover:bg-rose-700 text-white"
              >
                {actionLoading ? "Rejecting..." : "Confirm Rejection"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
