# DAY 20 — STEP 8B: DEMONSTRATION SCRIPT
## Walkthrough & Presenter Guide for the Unified Multi-Domain Approval Center

**Project:** Horizon Portal  
**Document:** Live Demonstration Guide  
**Duration:** ~3 Minutes  
**Target View:** `/approvals`  
**Date:** 2026-11-20  

---

## Segment 1: Executive Overview & KPI Dashboard (0:00 - 0:45)

### Visual:
Presenter navigates to `http://localhost:3000/approvals` logged in as Engineering Manager Marcus Brody. The Unified Approval Center dashboard renders with summary KPI cards.

### Presenter Script:
> *"Welcome to the Horizon Portal Unified Approval Center. Historically, organizational approval workflows were siloed across disparate modules—leave requests were handled in one place, while operational budgets were handled elsewhere.*
>
> *Today, we present a unified, multi-domain governance experience. At the top of the dashboard, managers have immediate visibility into five real-time KPI metrics: Total Pending actions, Pending Leave Requests, Pending Corporate Expenses, and historical Approved and Rejected totals.*
>
> *Every count is strictly scoped by our server-side reporting hierarchy, ensuring managers only view requests from their authorized teams."*

---

## Segment 2: Multi-Domain Filtering & Visual Design (0:45 - 1:30)

### Visual:
Presenter clicks between "All Domains", "Leave Requests" (Blue), and "Corporate Expenses" (Purple). Then changes status filter from "Pending" to "Approved".

### Presenter Script:
> *"The unified queue brings together heterogeneous business workflows into a clean, normalized presentation.*
>
> *Notice our domain indicators: blue badges designate employee Leave Requests, while purple badges designate Corporate Expense Authorizations.*
>
> *With a single click on our domain filters, a manager can isolate planned expenditure commitments or switch to employee time-off requests. The status filter enables instant toggling between active pending requests and historical governance decisions."*

---

## Segment 3: Detailed Inspection & Domain Separation (1:30 - 2:15)

### Visual:
Presenter clicks "View Details" on a Corporate Expense Authorization (`CEA-2026-0001`). The detail modal opens displaying requested amount ($14,500), vendor (AWS), Chart of Accounts category (5104), business justification, and the governance compliance notice.

### Presenter Script:
> *"When we inspect a Corporate Expense Authorization, the system reveals domain-specific financial metadata: the proposed vendor, Chart of Accounts code, requested amount, and business justification.*
>
> *Crucially, we maintain a strict financial governance boundary: Corporate Expense Authorization is an approval to commit budgetary funds—it is completely decoupled from Accounts Payable cash settlement. Notice our compliance reminder: formal invoice processing and treasury disbursement remain isolated in the Finance Department."*

---

## Segment 4: Decision Execution & Governance Enforcement (2:15 - 3:00)

### Visual:
Presenter demonstrates:
1. Rejection modal: types less than 3 characters; shows "Confirm Rejection" button disabled. Then types full justification reason and confirms.
2. Approval modal: clicks "Approve", adds optional note, confirms approval. Shows status pill changing to emerald "Approved" and KPI cards updating.

### Presenter Script:
> *"Now let's observe our decision governance in action.*
>
> *If an approver attempts to reject a request, Horizon Portal enforces accountability: the confirmation button remains disabled until a mandatory, documented justification is provided.*
>
> *On approval, the state transition executes atomically within a database transaction, recording an immutable audit log and dispatching a real-time notification to the employee. Furthermore, self-approval is strictly blocked by our server-side security layer.*
>
> *This provides Horizon Portal with an enterprise-grade, multi-domain approval platform ready for production deployment."*
