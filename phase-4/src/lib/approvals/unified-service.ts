/**
 * Unified Multi-Domain Approvals Aggregation Service
 * src/lib/approvals/unified-service.ts
 *
 * Merges Domain 1 (Leave Requests) and Domain 2 (Corporate Expense Authorizations):
 * - Unified normalized query interface
 * - Role-based scoping (Manager hierarchy, HR/Admin org-wide)
 * - Cohesive summary KPI calculation across domains
 * - Server-side sort, filter, and pagination
 */

import { AuthenticatedUser } from "@/lib/auth/user";
import { getApprovalQueue } from "@/lib/leave/approval-service";
import { getExpenseAuthorizationQueue } from "@/lib/expense-authorization/service";
import { UnifiedApprovalsQueryInput } from "@/lib/validations/expense-authorization";

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

export interface UnifiedApprovalsResponse {
  items: UnifiedApprovalItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  summary: {
    totalPending: number;
    pendingLeave: number;
    pendingExpense: number;
    totalApproved: number;
    totalRejected: number;
  };
}

export async function getUnifiedApprovals(
  actor: AuthenticatedUser,
  query: UnifiedApprovalsQueryInput
): Promise<UnifiedApprovalsResponse> {
  const shouldFetchLeave = query.domain === "all" || query.domain === "leave";
  const shouldFetchExpense = query.domain === "all" || query.domain === "corporate-expense";

  let leaveItems: UnifiedApprovalItem[] = [];
  let expenseItems: UnifiedApprovalItem[] = [];

  let pendingLeaveCount = 0;
  let approvedLeaveCount = 0;
  let rejectedLeaveCount = 0;

  let pendingExpenseCount = 0;
  let approvedExpenseCount = 0;
  let rejectedExpenseCount = 0;

  // 1. Fetch Leave Requests
  if (shouldFetchLeave) {
    try {
      const leaveResult = await getApprovalQueue(actor, {
        status:
          query.status === "all"
            ? "All"
            : query.status === "pending"
            ? "Pending"
            : query.status === "approved"
            ? "Approved"
            : "Rejected",
        departmentId: query.departmentId,
        search: query.search,
        page: 1,
        pageSize: 100, // Fetch up to 100 for aggregation
      });

      pendingLeaveCount = leaveResult.summary.pending || 0;
      approvedLeaveCount = leaveResult.summary.approvedThisMonth || 0;
      rejectedLeaveCount = leaveResult.summary.rejectedThisMonth || 0;

      leaveItems = (leaveResult.data || []).map((item: any): UnifiedApprovalItem => {
        const isPending = (item.status || "").toLowerCase() === "pending";
        const normalizedStatus = isPending
          ? "PENDING_APPROVAL"
          : (item.status || "").toUpperCase() === "APPROVED"
          ? "APPROVED"
          : "REJECTED";

        const duration = `${item.days} ${item.days === 1 ? "day" : "days"}`;

        return {
          id: item.id,
          domain: "leave",
          domainLabel: "Leave Request",
          referenceNumber: `LV-${item.id.slice(-6).toUpperCase()}`,
          title: `${item.leaveTypeName || "Leave"} (${duration})`,
          requester: {
            id: item.employeeId,
            name: item.employeeName || "Employee",
            email: item.employeeEmail || "",
            departmentName: item.departmentName || "General",
          },
          departmentName: item.departmentName || "General",
          requestedDate: item.appliedOn || item.startDate || new Date().toISOString(),
          amountOrDuration: duration,
          durationDays: item.days,
          status: normalizedStatus,
          statusLabel: item.status || "Pending",
          canApprove: isPending && actor.role !== "Employee" && actor.employeeId !== item.employeeId,
          details: {
            ...item,
            startDate: item.startDate,
            endDate: item.endDate,
            reason: item.reason,
            payType: item.payType,
            leaveBalance: item.leaveBalance,
          },
        };
      });
    } catch (err) {
      console.error("Error retrieving leave approvals for unified center:", err);
    }
  }

  // 2. Fetch Corporate Expense Authorizations
  if (shouldFetchExpense) {
    try {
      const expenseResult = await getExpenseAuthorizationQueue(actor, {
        ...query,
        page: 1,
        pageSize: 100,
      });

      pendingExpenseCount = expenseResult.summary.pending || 0;
      approvedExpenseCount = expenseResult.summary.approved || 0;
      rejectedExpenseCount = expenseResult.summary.rejected || 0;

      expenseItems = (expenseResult.data || []).map((item: any): UnifiedApprovalItem => {
        const isPending = item.status === "PENDING_APPROVAL";
        const requesterName =
          item.requester.fullName ||
          `${item.requester.firstName} ${item.requester.lastName}`.trim();
        const formattedAmount = `${item.currency || "USD"} ${Number(item.requestedAmount).toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`;

        return {
          id: item.id,
          domain: "corporate-expense",
          domainLabel: "Corporate Expense",
          referenceNumber: item.referenceNumber,
          title: item.title,
          requester: {
            id: item.requester.id,
            name: requesterName,
            email: item.requester.email,
            departmentName: item.department?.name || "General",
          },
          departmentName: item.department?.name || "General",
          requestedDate: item.submittedAt
            ? new Date(item.submittedAt).toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0],
          amountOrDuration: formattedAmount,
          amount: item.requestedAmount,
          currency: item.currency || "USD",
          status: item.status,
          statusLabel:
            item.status === "PENDING_APPROVAL"
              ? "Pending"
              : item.status === "APPROVED"
              ? "Approved"
              : "Rejected",
          canApprove: isPending && actor.role !== "Employee" && actor.employeeId !== item.requestedById,
          details: {
            ...item,
            category: item.category,
            description: item.description,
            vendorName: item.vendorName,
            requiredByDate: item.requiredByDate,
            rejectionReason: item.rejectionReason,
            approvalNotes: item.approvalNotes,
          },
        };
      });
    } catch (err) {
      console.error("Error retrieving expense authorizations for unified center:", err);
    }
  }

  // 3. Combine and Sort Items
  let allItems = [...leaveItems, ...expenseItems];

  allItems.sort((a, b) => {
    const order = query.sortOrder === "asc" ? 1 : -1;
    if (query.sortBy === "amount") {
      const aVal = a.amount || a.durationDays || 0;
      const bVal = b.amount || b.durationDays || 0;
      return (aVal - bVal) * order;
    }
    if (query.sortBy === "status") {
      return a.status.localeCompare(b.status) * order;
    }
    if (query.sortBy === "requester") {
      return a.requester.name.localeCompare(b.requester.name) * order;
    }
    // Default by date
    const aDate = new Date(a.requestedDate).getTime();
    const bDate = new Date(b.requestedDate).getTime();
    return (aDate - bDate) * order;
  });

  // 4. Pagination
  const total = allItems.length;
  const page = query.page || 1;
  const pageSize = query.pageSize || 20;
  const startIndex = (page - 1) * pageSize;
  const paginatedItems = allItems.slice(startIndex, startIndex + pageSize);

  return {
    items: paginatedItems,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize) || 1,
    },
    summary: {
      totalPending: pendingLeaveCount + pendingExpenseCount,
      pendingLeave: pendingLeaveCount,
      pendingExpense: pendingExpenseCount,
      totalApproved: approvedLeaveCount + approvedExpenseCount,
      totalRejected: rejectedLeaveCount + rejectedExpenseCount,
    },
  };
}
