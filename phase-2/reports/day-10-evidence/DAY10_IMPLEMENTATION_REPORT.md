# HORIZON PORTAL — DAY 10 IMPLEMENTATION REPORT
## Permission-Aware Leave Approvals & Team Attendance Oversight

**Project:** Aura Workforce by Growmar — Horizon Portal
**Phase:** Phase 2 — Workforce Operations
**Task:** Day 10
**Stack:** Next.js App Router, TypeScript, Tailwind CSS v4, Prisma ORM, SQLite, jose JWT, bcryptjs
**Date:** October 30, 2026
**Status:** Complete & Fully Verified (100% of All 12 Test Suites Passing)

---

## 1. Executive Summary

On Day 10, we designed and implemented a production-grade, permission-aware leave approval and attendance oversight module. The system empowers managers to review and decide leave requests belonging to their authorized teams, while granting HR organization-wide oversight across all departments.

All approvals and rejections enforce strict server-side validation:
- Verifies that requests are in a pending state before modification.
- Enforces atomic conditional state transitions preventing race conditions or double decisions.
- Completely prevents self-approval across all roles (managers, HR, admins).
- Updates leave balances exactly once on approval, releasing pending locks without double deduction.
- Enforces mandatory, non-empty, non-whitespace decision reasons on rejections.
- Automatically dispatches personal notifications to employees using the existing Day 8 notification infrastructure.
- Records structured audit compliance records for all decisions and delegations using the existing Day 9 audit logger.
- Implements a manager absence rule with acting manager delegation and fallback to HR.
- Provides a team attendance oversight console with month/year filtering, distinguishing confirmed absences from approved leave and unrecorded periods.

---

## 2. Existing Architecture Reused

1. **Authentication & Session Management (`src/lib/auth/user.ts`, `src/lib/auth/token.ts`):**
   Session tokens are verified against current database records, enforcing active account status and authoritative role claims on every request.
2. **Notification Dispatcher (`src/lib/notifications/notify.ts`):**
   Day 8 notification system reused directly for both approval and rejection dispatches with deterministic event keys for deduplication.
3. **Audit Compliance System (`src/lib/audit/audit-logger.ts`):**
   Day 9 audit system extended to record `LEAVE_APPROVED`, `LEAVE_REJECTED`, `LEAVE_DELEGATED`, `LEAVE_ESCALATED`, and `ATTENDANCE_ACCESSED`.
4. **Leave Balance Accounting Model (`src/lib/leave/calculations.ts`):**
   Reused the existing leave balance model where `pendingDays` is locked upon application and deducted atomically upon approval alongside leave type buckets (`CL`, `SL`, `EL`).
5. **Role-Aware Navigation (`src/config/navigation.ts`):**
   Preserved existing navigation contracts where `/approvals` and `/team` serve Managers and Admins, while HR accesses workforce operations via `/leave-management`.
6. **Design System & Reusable Components (`src/components/ui/`):**
   Badge, Button, Avatar, Card, and EmptyState components utilized with Horizon design tokens and responsive CSS variables.

---

## 3. Files Created

| File | Purpose |
|------|---------|
| `src/lib/leave/approval-service.ts` | Core transactional engine for leave approvals, rejections, team authorization, delegation validation, and manager availability resolution. |
| `src/app/api/v1/approvals/leave/route.ts` | GET endpoint for scoped approval queues (Manager team scope, HR organization-wide scope). |
| `src/app/api/v1/approvals/leave/[id]/route.ts` | GET endpoint for detailed leave request inspection with employee balance breakdown and audit trail. |
| `src/app/api/v1/approvals/leave/[id]/approve/route.ts` | POST endpoint for atomic leave request approvals. |
| `src/app/api/v1/approvals/leave/[id]/reject/route.ts` | POST endpoint for atomic leave request rejections with mandatory reason validation. |
| `src/app/api/v1/approvals/delegations/route.ts` | GET & POST endpoints for manager delegation management with circular delegation prevention. |
| `src/app/api/v1/team/attendance/route.ts` | GET endpoint for team and organization-wide attendance oversight by month and year. |
| `src/components/approvals/LeaveApprovalQueue.tsx` | Full-stack interactive dashboard for reviewing and deciding pending requests. |
| `src/components/team/TeamAttendanceOverview.tsx` | Full-stack interactive dashboard for monthly team attendance oversight. |
| `src/app/team/attendance/page.tsx` | Route page for `/team/attendance`. |
| `scripts/test-day10-approvals.ts` | Comprehensive automated test suite for all Day 10 business logic and security boundaries. |
| `scripts/capture-day10-screenshots.mjs` | Automated Edge CDP script capturing live browser evidence screenshots. |

---

## 4. Files Modified

| File | Changes Made |
|------|--------------|
| `prisma/schema.prisma` | Added `rejectionReason`, `delegatedApproverId`, `isEscalated` to `LeaveRequest`. Added `ManagerDelegation` model. |
| `src/lib/audit/audit-logger.ts` | Added `LEAVE_APPROVED`, `LEAVE_REJECTED`, `LEAVE_DELEGATED`, `LEAVE_ESCALATED`, `ATTENDANCE_ACCESSED` audit actions and `logLeaveDecision()` helper. |
| `src/app/approvals/page.tsx` | Replaced placeholder view with full-featured `LeaveApprovalQueue` component. |
| `src/app/team/page.tsx` | Replaced placeholder view with team management view embedding `TeamAttendanceOverview` and approval links. |
| `src/app/leave-management/page.tsx` | Replaced placeholder view with HR tabbed console providing organization-wide Leave Approvals and Workforce Attendance Oversight. |
| `package.json` | Added `test:approvals` script and integrated into master `test` pipeline. |

---

## 5. Database Changes

Created Prisma migration `20261030040537_add_leave_approvals_and_delegations`:
- Extended `leave_requests` table with:
  - `rejection_reason TEXT`
  - `delegated_approver_id TEXT`
  - `is_escalated BOOLEAN NOT NULL DEFAULT false`
- Added index on `leave_requests(status)` for high-performance queue filtering.
- Created `manager_delegations` table with:
  - `id TEXT PRIMARY KEY`
  - `manager_id TEXT NOT NULL` (Foreign key to `employees(id)`)
  - `acting_manager_id TEXT NOT NULL` (Foreign key to `employees(id)`)
  - `start_date DATETIME NOT NULL`
  - `end_date DATETIME NOT NULL`
  - `status TEXT NOT NULL DEFAULT 'Active'`
  - `reason TEXT`
  - `created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP`
  - `updated_at DATETIME NOT NULL`
  - Indices on `manager_id`, `acting_manager_id`, and `status`.

Zero data loss: All 441 employee records, 2,183 historical leave requests, 2,469 payslips, and 441 leave balances were preserved intact.

---

## 6. Approval Workflow

```
[Employee Submits Request] (Status: Pending, pendingDays += days)
            │
            ▼
[Approver Opens Queue (/approvals)]
            │
    ┌───────┴───────┐
    ▼               ▼
[Manager View]    [HR View]
Direct Reports    All Org Departments
& Delegated
            │
            ▼
[Server-Side Permission & State Validation]
├── 1. Verify Session & Account Active Status
├── 2. Verify Approver Authority (Team or Org)
├── 3. Enforce Self-Approval Block (actor !== applicant)
├── 4. Verify Status === "Pending" (Concurrency Check)
└── 5. Check Available Leave Balance
            │
     ┌──────┴──────┐
     ▼             ▼
 [APPROVE]     [REJECT]
     │             ├── Validate Mandatory Non-Empty Reason (Min 3 chars)
     │             └── Atomic DB Transaction:
     │                 ├── status = "Rejected"
     │                 ├── approverId & decidedOn recorded
     │                 ├── rejectionReason recorded
     │                 ├── pendingDays -= days (Balance untouched)
     │                 └── AuditLog created
     │
     └── Atomic DB Transaction:
         ├── status = "Approved"
         ├── approverId & decidedOn recorded
         ├── pendingDays -= days
         ├── Balance deducted (clBalance -= days, clUsed += days)
         └── AuditLog created
            │
            ▼
 [Post-Transaction Notification]
 Dispatch personal notification to employee via notify() with idempotent eventKey
```

---

## 7. Role Permissions

| Role | Approval Queue Scope | Action Authority | Attendance Scope | Self-Approval |
|------|----------------------|------------------|------------------|---------------|
| **Employee** | Denied (HTTP 403) | None | Self Only | N/A |
| **Manager** | Direct Reports + Active Delegations | Approve & Reject Team Requests | Direct Reports | Denied (HTTP 403) |
| **HR** | Organization-Wide (All Depts) | Approve & Reject All Requests | All Workforce | Denied (HTTP 403) |
| **Admin** | Organization-Wide (All Depts) | Approve & Reject All Requests | All Workforce | Denied (HTTP 403) |

---

## 8. Self-Approval Prevention

Implemented at both the API layer and the server-side service layer:
```typescript
if (actor.employeeId && actor.employeeId === applicantEmployeeId) {
  return {
    authorized: false,
    isSelf: true,
    reason: "Self-approval is strictly prohibited. You cannot approve or reject your own leave request.",
  };
}
```
Attempting to approve or reject one's own leave request returns HTTP 403 Forbidden with a clear security rejection message. This rule applies uniformly to Managers, HR Specialists, and System Administrators.

---

## 9. Leave Balance Accounting Behavior

- **Submission (Day 6):**
  `pendingDays` is incremented by requested days. Actual leave balances (`clBalance`, `slBalance`, `elBalance`) remain untouched.
- **Approval (Day 10):**
  Within an atomic Prisma transaction:
  - `pendingDays` is decremented by requested days.
  - Category balance is decremented (`clBalance -= days`, `clUsed += days`).
  - Total available balance decreases exactly once.
- **Rejection (Day 10):**
  Within an atomic Prisma transaction:
  - `pendingDays` is decremented by requested days.
  - Category balance is untouched, restoring full quota for future requests.
- **Concurrency & Double-Approval Protection:**
  The update condition requires `status: "Pending"`. If two approvers attempt simultaneous approval, only one succeeds; the second receives HTTP 409 Conflict with zero duplicate deductions.

---

## 10. Notification Integration

Leverages `@/lib/notifications/notify`:
- **Approval Notification:**
  - Title: `Leave Request Approved`
  - Message: `Your leave request from [start] to [end] ([N] days) has been approved by [Approver Name].`
  - EventKey: `leave_approved:[id]` (Prevents duplicate messages on network retries)
- **Rejection Notification:**
  - Title: `Leave Request Rejected`
  - Message: `Your leave request from [start] to [end] has been rejected.\n\nReason: [rejection reason]`
  - EventKey: `leave_rejected:[id]`

---

## 11. Delegation and HR Escalation

- **Absence Detection:**
  `resolveManagerAvailability(managerId)` evaluates whether a manager is active or currently on approved leave.
- **Acting Manager Routing:**
  If an active `ManagerDelegation` exists where the current date falls between `startDate` and `endDate`, the acting manager inherits approval authority for that team.
- **Circular Delegation Defense:**
  `validateDelegationChain(managerId, actingManagerId)` walks the outgoing delegation graph to prevent cycles (e.g. A → B → A). Self-delegation (A → A) is blocked immediately.
- **HR Fallback:**
  If a manager is unavailable and no acting manager is configured, requests are escalated to HR with an escalation flag.

---

## 12. Attendance Oversight

Accessible at `/team/attendance` and `/leave-management`:
- **Month Selector:** Displays historical cutoff dates (Sep 2026, Aug 2026, Jul 2026, Jun 2026, May 2026, Apr 2026).
- **Summary Metrics:** Total in scope, present count, approved leave count, unpaid absence count, and average attendance percentage.
- **Policy Compliance:**
  - Approved leave is recognized as authorized absence and never miscategorized as unexcused absence.
  - Employees without an attendance log for the selected period are marked "No Record" rather than assumed absent.
- **Permissions:** Managers are strictly limited to direct reports; HR and Admin can view all workforce members.

---

## 13. Security Controls

1. **Server-Side Session Resolution:** Every API endpoint validates the `horizon_session` JWT against `dev.db`, ensuring deactivated accounts are denied immediately.
2. **Team Authorization Boundaries:** Managers requesting employees outside their reporting tree receive HTTP 403 Forbidden.
3. **Cache Invalidation:** All approval and attendance responses include `Cache-Control: private, no-cache, no-store, must-revalidate`.
4. **Input Sanitization:** Rejection reasons require a non-empty, non-whitespace string between 3 and 1,000 characters.
5. **Zero Credential Leakage:** Sensitive fields (`passwordHash`, `salary`) are strictly excluded from API responses.

---

## 14. Test Results

### Day 10 Dedicated Suite (`npm run test:approvals`)
- **Total Tests:** 56
- **Passed:** 56
- **Failed:** 0
- **Pass Rate:** 100%

### Master Test Suite (`npm test`)

```
▶ test:db             ✓ PASS (10/10 tables verified, 0 FK violations)
▶ test:auth           ✓ PASS (39/39 authentication & session tests)
▶ test:nav            ✓ PASS (107/107 role-based navigation tests)
▶ test:e2e            ✓ PASS (20/20 live HTTP E2E tests)
▶ test:privacy        ✓ PASS (62/62 privacy and data isolation tests)
▶ test:hierarchy      ✓ PASS (34/34 reporting hierarchy tests)
▶ test:benchmark      ✓ PASS (10/10 search latency benchmarks < 5ms)
▶ test:leave          ✓ PASS (43/43 self-service leave tests)
▶ test:payslips       ✓ PASS (67/67 payslip verification tests)
▶ test:notifications  ✓ PASS (64/64 notifications & announcements tests)
▶ test:employees      ✓ PASS (81/81 employee management console tests)
▶ test:approvals      ✓ PASS (56/56 leave approvals & oversight tests)
```

**Total Master Suite Tests:** 593 Passed | 0 Failed

---

## 15. Screenshots

Actual application screens captured via headless Microsoft Edge CDP on port 9339:

1. `01_leave_approval_queue.png`: Leave Approval Queue with KPI cards, pending review tab, and request table.
2. `02_leave_request_details.png`: Leave Request Details slide-over drawer showing employee metadata and leave balance breakdown.
3. `03_rejection_reason_validation.png`: Rejection modal displaying mandatory rejection reason validation.
4. `04_approval_notification.png`: Employee Personal Inbox showing the "Leave Request Approved" notification.
5. `05_team_attendance_overview.png`: Team Attendance Overview with month selector and attendance rate bars.
6. `06_manager_team_access.png`: Manager team dashboard scoped strictly to direct reports.
7. `07_hr_organization_wide_view.png`: HR organization-wide Leave Operations console across all departments.

Location: `reports/day-10-evidence/`

---

## 16. Known Limitations

1. **Multi-hop Escalation:** If an acting manager is also on leave, the system escalates directly to HR rather than supporting arbitrary multi-tier acting manager hops.
2. **Historical Attendance Grain:** The existing database stores attendance at a monthly aggregate grain (`attendance_monthly`). Daily punch-in/out records are not present in the current dataset.

---

## 17. Final Verification Checklist

- [x] Managers can view only their authorized team's requests.
- [x] HR can view organization-wide requests.
- [x] Authorized approvers can approve pending requests.
- [x] Authorized approvers can reject pending requests with a mandatory reason.
- [x] Users cannot approve or reject their own requests.
- [x] Leave balances are updated correctly and exactly once.
- [x] Employees receive correct notifications.
- [x] Audit history records decisions.
- [x] Manager absence routes to a designated acting manager or HR.
- [x] Circular delegation is prevented.
- [x] Team attendance is available for a selected month.
- [x] Attendance permissions are enforced server-side.
- [x] Automated tests cover all critical business rules (`npm run test:approvals`).
- [x] Existing Day 1–9 regression tests pass (`npm test`).
- [x] Production build succeeds (`npm run build`).
- [x] Evidence screenshots and implementation report are saved.
- [x] Git working tree reviewed with `git status` and `git diff --check`.
