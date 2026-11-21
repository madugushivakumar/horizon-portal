# DAY 20 — STEP 8B: USER OPERATIONAL GUIDE
## Unified Multi-Domain Approval Center User Manual for Managers & HR Administrators

**Project:** Horizon Portal  
**Document:** User Operational Guide  
**Audience:** People Managers, Department Leads, HR Administrators  
**Date:** 2026-11-20  

---

## 1. Overview of the Unified Approval Center

The **Unified Approval Center** (`/approvals`) consolidates all organizational approval workflows into a single dashboard. As a manager or HR administrator, you can review, inspect, approve, or reject:
1. **Leave Requests:** Employee applications for time off (Casual, Sick, Earned).
2. **Corporate Expense Authorizations:** Departmental budget requests for software licenses, cloud infrastructure, hardware, or operational expenses.

> [!IMPORTANT]
> **Key Governance Principle: Authorization vs. Payment Settlement**  
> Approving a Corporate Expense Authorization grants formal managerial and budgetary permission for a proposed purchase. It does **not** disburse cash or settle an invoice. Accounts Payable invoice processing and payment execution are managed separately by the Finance Department.

---

## 2. Dashboard Navigation & Summary Cards

When you open `/approvals`, you are presented with five summary metric cards:

- **Total Pending:** The combined number of pending requests across all domains requiring your attention.
- **Pending Leave:** Number of active leave requests submitted by your direct or indirect reports.
- **Pending Expenses:** Number of corporate expenditure authorizations awaiting budget sign-off.
- **Approved Total:** Total requests approved under your governance.
- **Rejected Total:** Total requests formally rejected with documented justification.

---

## 3. Working with Filters

### 3.1 Domain Filters
Click on the domain tabs to filter the queue:
- **All Domains:** View a combined chronological queue of both leave requests and expense authorizations.
- **Leave Requests (Blue Tab):** Focus solely on employee time-off requests.
- **Corporate Expenses (Purple Tab):** Focus solely on planned business expenditures.

### 3.2 Status Filters
Filter requests by their current state:
- **Pending (Default):** View only requests requiring active review.
- **Approved:** View historical approvals.
- **Rejected:** View historical rejections and reasons.
- **All:** View the entire submission history.

### 3.3 Search & Department Filters
Use the search bar in the top right to filter by employee name, reference code (e.g., `CEA-2026-0001` or `LV-TEST01`), expenditure title, or vendor name.

---

## 4. Reviewing & Acting on Requests

### 4.1 Viewing Request Details
Click **"View Details"** on any row to open the domain-aware inspection dialog:
- **For Leave Requests:** Displays start/end dates, total working days, leave type, employee's remaining leave balance quota (CL, SL, EL), applicant reason, and audit trail.
- **For Corporate Expense Authorizations:** Displays requested amount, currency, Chart of Accounts code, proposed vendor, required-by date, business justification, and compliance notice.

### 4.2 Approving a Request
1. Click the green **"Approve"** button.
2. In the confirmation dialog, review the summary details.
3. (Optional) Enter approval notes for the permanent audit trail.
4. Click **"Confirm Approval"**. The status updates to `Approved` immediately.

### 4.3 Rejecting a Request
1. Click the red **"Reject"** button.
2. In the rejection dialog, enter a **mandatory rejection reason** (minimum 3 characters). The confirmation button remains disabled until a valid reason is typed.
3. Click **"Confirm Rejection"**. The reason is permanently recorded in the audit trail, and the applicant is notified.

---

## 5. Security & Self-Approval Rules

- **Self-Approval is Prohibited:** You cannot approve your own leave requests or expense authorizations. Requests submitted by you will not display action buttons and must be approved by your manager or HR.
- **Team Boundaries:** Managers can only view and act on requests from employees within their reporting tree.
- **Idempotency Protection:** Double-clicking or submitting concurrent decisions on the same request is automatically prevented by the system.
