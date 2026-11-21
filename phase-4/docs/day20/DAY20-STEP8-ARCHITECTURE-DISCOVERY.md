# DAY 20 — STEP 8: UNIFIED APPROVAL CENTER ARCHITECTURE DISCOVERY

**Project:** Horizon Portal  
**Document:** Product & Architecture Discovery for Multi-Domain Approval Center  
**Target Feature:** Unified Approval Center (`/approvals`)  
**Author:** Principal Software Architect & Senior Full-Stack Engineer  
**Date:** November 20, 2026  
**Status:** ARCHITECTURE DISCOVERY COMPLETE  

---

## 1. Executive Summary

This architecture discovery report examines the existing approval workflows, database models, API contracts, and user interface components within Horizon Portal. It defines the architectural foundation for evolving the current single-domain Leave Approval queue into a **Unified Multi-Domain Approval Center** that consolidates **Leave Requests** and **Expense Claims** under a unified, role-governed management interface.

---

## 2. Existing Approval Architecture & Workflows

### 2.1 Existing Leave Approval Workflow
- **Route:** `/approvals` ([src/app/approvals/page.tsx](file:///c:/Users/Madugu%20Shiva%20Kumar/OneDrive/图片/Desktop/horizon-portal/src/app/approvals/page.tsx))
- **Primary Component:** `LeaveApprovalQueue` ([src/components/approvals/LeaveApprovalQueue.tsx](file:///c:/Users/Madugu%20Shiva%20Kumar/OneDrive/图片/Desktop/horizon-portal/src/components/approvals/LeaveApprovalQueue.tsx))
- **API Endpoints:**
  - `GET /api/v1/approvals/leave`: Scoped approval queue with department, leave type, status, and pagination filters.
  - `GET /api/v1/approvals/leave/[id]`: Detail view returning applicant profile, leave balance, policy quota, and audit history.
  - `POST /api/v1/approvals/leave/[id]/approve`: Executes atomic state transition to "Approved", decrements leave balance quota, sends notification, and writes immutable audit log.
  - `POST /api/v1/approvals/leave/[id]/reject`: Transitions to "Rejected" with mandatory rejection remarks.
- **Service Layer:** `src/lib/leave/approval-service.ts` (Handles `verifyApproverAuthorization`, reporting hierarchies, circular delegation checks, and transactional updates).
- **Data Model:** `LeaveRequest`, `LeaveBalance`, `LeaveType`, `Employee`, `AuditLog`.

### 2.2 Existing Expense & Finance Workflow
- **Current Route:** `/admin/finance` ([src/app/admin/finance/page.tsx](file:///c:/Users/Madugu%20Shiva%20Kumar/OneDrive/图片/Desktop/horizon-portal/src/app/admin/finance/page.tsx))
- **Existing API:** `GET /api/v1/admin/finance/expenses` (Restricted strictly to Admin role).
- **Existing Database Model (`Expense`):**
  - Schema: `id`, `expenseDate`, `categoryAccount`, `vendorId`, `billReference`, `description`, `departmentId`, `amountExclGst`, `gstRatePercent`, `gstAmount`, `totalAmount`, `dueDate`, `paidDate`, `status`, `submittedBy` (`Employee`), `approvedBy` (`Employee`).
  - Existing Records in `dev.db`: **501 total expenses** (478 `PAID`, 23 `UNPAID`).
  - Analysis of Existing Model:
    The existing `Expense` model currently records corporate accounts payable bills associated with commercial vendors (e.g. Garden City Workspaces, Marina Business Park LLP). However, each record carries explicit employee relations: `submittedBy` (submitter employee) and `approvedBy` (approver employee).
    The 23 `UNPAID` records represent corporate or operational expenses awaiting payment disbursement or supervisory authorization.

---

## 3. Database Entities & Relational Map

```
┌─────────────────┐       ┌──────────────────────┐       ┌───────────────────┐
│    Employee     │◄──────┤     LeaveRequest     │       │     LeaveType     │
│                 │1     *│                      │*     1│                   │
│ - id (EMP-*)    ├───────┤ - employeeId         ├───────┤ - code (CL, SL)   │
│ - fullName      │       │ - leaveTypeCode      │       │ - annualQuotaDays │
│ - managerId     │       │ - days               │       └───────────────────┘
│ - departmentId  │       │ - status (Pending..) │
└────────┬────────┘       └──────────────────────┘
         │
         │1 (submitter)
         ├───────────────────────────────────────────────┐
         │                                               │
         ▼* (expensesSubmitted)                          ▼* (expensesApproved)
┌────────────────────────────────────────────────────────────────────────────┐
│                                  Expense                                   │
│ - id (EXP-*)                                                               │
│ - billReference (Claim / Invoice Ref)                                      │
│ - description                                                              │
│ - categoryAccount (5101 Travel, Rent, Office, Meals...)                    │
│ - totalAmount (Float)                                                      │
│ - status (UNPAID / PENDING / APPROVED / REJECTED / PAID)                   │
│ - submittedBy (Employee ID)                                                │
│ - approvedBy  (Employee ID)                                                │
│ - departmentId                                                             │
│ - vendorId                                                                 │
└────────────────────────────────────────────────────────────────────────────┘
         ▲
         │ (audit trail)
┌────────┴────────┐
│    AuditLog     │
│ - id            │
│ - actorId       │
│ - action        │ (LEAVE_APPROVED, EXPENSE_APPROVED, etc.)
│ - details       │ (JSON payload containing target ID and metadata)
└─────────────────┘
```

---

## 4. Authorization & Permission Architecture

The authorization model enforces strict defense-in-depth across both approval domains:

| Role | Leave Approval Permissions | Expense Approval Permissions | Self-Approval Policy |
|---|---|---|---|
| **Employee** | **DENIED** (`HTTP 403 Forbidden`) | **DENIED** (`HTTP 403 Forbidden`) | Strictly Blocked |
| **Manager** | **ALLOWED** for direct reports and active acting delegations | **ALLOWED** for direct reports within department | Strictly Blocked (`actor.employeeId === applicant.id`) |
| **HR Specialist** | **ALLOWED** organization-wide | **ALLOWED** organization-wide for HR cost centers | Strictly Blocked |
| **Admin** | **ALLOWED** organization-wide | **ALLOWED** organization-wide | Strictly Blocked |

---

## 5. Architectural Gaps for Unified Approvals

1. **Domain Fragmentation:**
   Approvals currently exist exclusively for leave (`/approvals`). Expense tracking is siloed in `/admin/finance` without a manager supervisory review interface.
2. **Missing Multi-Domain Query API:**
   `/api/v1/approvals/leave` only queries `LeaveRequest`. A unified endpoint (`GET /api/v1/approvals`) is required to aggregate both Leave Requests and Expense Claims into a unified response schema.
3. **Decision Endpoint Scoping:**
   Dedicated approval handlers are required for expenses (`POST /api/v1/approvals/expense/[id]/approve` and `POST /api/v1/approvals/expense/[id]/reject`), enforcing supervisory validation and audit logging.
4. **Unified UI Container:**
   The frontend requires a domain tab switcher (`All Approvals`, `Leave Requests`, `Expense Claims`) with unified KPI summary cards and polymorphic request detail dialogs.

---

## 6. Proposed Unified Multi-Domain Approval Architecture

```
[Browser: /approvals (Unified Approval Center)]
   │
   ├─► UnifiedSummaryCards (Total Pending, Pending Leave, Pending Expense, Completed)
   ├─► DomainFilters (Tabs: All | Leave Requests | Expense Claims)
   ├─► UnifiedApprovalQueueTable (Polymorphic rows: Leave vs Expense)
   └─► ApprovalDetailDialog (Context-aware: Leave dates vs Expense amount/category)
         │
         ▼
[Unified REST API: /api/v1/approvals]
   │
   ├─► GET  /api/v1/approvals?domain=all&status=pending
   ├─► GET  /api/v1/approvals/[domain]/[id]
   ├─► POST /api/v1/approvals/leave/[id]/approve (Existing service)
   ├─► POST /api/v1/approvals/leave/[id]/reject  (Existing service)
   ├─► POST /api/v1/approvals/expense/[id]/approve (New transactional service)
   └─► POST /api/v1/approvals/expense/[id]/reject  (New transactional service)
         │
         ▼
[Database Layer (Prisma Client)]
   ├─► LeaveRequest (atomic balance lock & status update)
   ├─► Expense (status: APPROVED/REJECTED, approver assignment)
   └─► AuditLog (immutable decision recording)
```

### Unified Item Representation Contract:
```typescript
interface UnifiedApprovalItem {
  id: string;
  domain: "leave" | "expense";
  reference: string;          // E.g., "LV-2026-088" or "EXP-00021"
  employeeId: string;
  employeeName: string;
  departmentId: string;
  departmentName: string;
  summary: string;            // E.g., "Casual Leave (2 days)" or "Client Dinner - Travel & Meals"
  amountOrDuration: string;   // E.g., "2 days" or "₹14,250.00"
  submittedDate: string;
  status: "Pending" | "Approved" | "Rejected";
  canApprove: boolean;
}
```

---

## 7. Risks & Backward Compatibility Safeguards

1. **Zero Disruption to Existing Leave Approvals:**
   Existing endpoints (`/api/v1/approvals/leave/*`) and existing Playwright tests (`tests/e2e/leave/approve-leave.spec.ts`) must continue to function with 100% backward compatibility.
2. **Strict Financial Disbursement Separation:**
   Approving an expense claim changes its approval status to `APPROVED`; it strictly **does NOT trigger automated bank payment, wire transfer, or ledger journal payout**.
3. **Safe Database Reuse:**
   Reuses existing `Expense` and `LeaveRequest` models without requiring destructive database schema alterations or migrations on live environments.
