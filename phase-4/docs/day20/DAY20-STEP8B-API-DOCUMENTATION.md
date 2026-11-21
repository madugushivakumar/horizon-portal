# DAY 20 — STEP 8B: API SPECIFICATION & REFERENCE
## Unified Multi-Domain Approval Center REST API Endpoints

**Project:** Horizon Portal  
**Branch:** `day20-final-challenge`  
**Date:** 2026-11-20  
**Phase:** Day 20 — Step 8B  
**Protocol:** HTTPS / JSON REST  

---

## 1. Endpoint Summary Table

| Method | Endpoint | Description | Role Scope |
|---|---|---|---|
| `GET` | `/api/v1/approvals` | Unified multi-domain approval queue & summary KPIs | Manager, HR, Admin |
| `GET` | `/api/v1/approvals/expense-authorizations` | Corporate expense authorization queue | Manager, HR, Admin, Employee (Self) |
| `POST` | `/api/v1/approvals/expense-authorizations` | Submit new corporate expense authorization | Authenticated Employees |
| `GET` | `/api/v1/approvals/expense-authorizations/[id]` | Detail view of single authorization & audit trail | Requester, Approver, HR, Admin |
| `POST` | `/api/v1/approvals/expense-authorizations/[id]/approve` | Approve expenditure authorization | Authorized Manager, HR, Admin (Self Forbidden) |
| `POST` | `/api/v1/approvals/expense-authorizations/[id]/reject` | Reject expenditure authorization (mandatory reason) | Authorized Manager, HR, Admin (Self Forbidden) |
| `GET` | `/api/v1/approvals/leave` | Existing Leave request queue | Manager, HR, Admin |
| `GET` | `/api/v1/approvals/leave/[id]` | Existing Leave request detail view | Requester, Approver, HR, Admin |
| `POST` | `/api/v1/approvals/leave/[id]/approve` | Approve leave request & deduct balance | Authorized Manager, HR, Admin |
| `POST` | `/api/v1/approvals/leave/[id]/reject` | Reject leave request & release pending balance | Authorized Manager, HR, Admin |

---

## 2. Endpoint Specifications

### 2.1 GET `/api/v1/approvals`
Unified multi-domain queue aggregating Leave Requests and Corporate Expense Authorizations.

#### Query Parameters:
- `domain` (optional): `all` (default) | `leave` | `corporate-expense`
- `status` (optional): `pending` (default) | `approved` | `rejected` | `all`
- `search` (optional): String matching requester name, title, reference number, or vendor
- `departmentId` (optional): Filter by department ID
- `page` (optional): Integer $\ge 1$ (default: `1`)
- `pageSize` (optional): Integer 1–100 (default: `20`)
- `sortBy` (optional): `date` (default) | `amount` | `requester` | `department` | `status`
- `sortOrder` (optional): `desc` (default) | `asc`

#### Success Response (`200 OK`):
```json
{
  "success": true,
  "data": [
    {
      "id": "cuid-expense-01",
      "domain": "corporate-expense",
      "domainLabel": "Corporate Expense",
      "referenceNumber": "CEA-2026-0001",
      "title": "AWS Cloud Infrastructure Expansion",
      "requester": {
        "id": "emp-sub-01",
        "name": "John Doe",
        "email": "john@horizon.internal",
        "departmentName": "Engineering"
      },
      "departmentName": "Engineering",
      "requestedDate": "2026-11-20",
      "amountOrDuration": "USD 14,500.00",
      "amount": 14500.0,
      "currency": "USD",
      "status": "PENDING_APPROVAL",
      "statusLabel": "Pending",
      "canApprove": true,
      "details": {
        "category": 5104,
        "description": "Scale Kubernetes cluster for Q4 platform load surge.",
        "vendorName": "Amazon Web Services"
      }
    },
    {
      "id": "lr-test-01",
      "domain": "leave",
      "domainLabel": "Leave Request",
      "referenceNumber": "LV-TEST01",
      "title": "Casual Leave (2 days)",
      "requester": {
        "id": "emp-sub-01",
        "name": "John Doe",
        "email": "john@horizon.internal",
        "departmentName": "Engineering"
      },
      "departmentName": "Engineering",
      "requestedDate": "2026-11-20",
      "amountOrDuration": "2 days",
      "durationDays": 2.0,
      "status": "PENDING_APPROVAL",
      "statusLabel": "Pending",
      "canApprove": true,
      "details": {
        "startDate": "2026-11-25",
        "endDate": "2026-11-26",
        "reason": "Personal errands"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 2,
    "totalPages": 1
  },
  "summary": {
    "totalPending": 2,
    "pendingLeave": 1,
    "pendingExpense": 1,
    "totalApproved": 0,
    "totalRejected": 0
  }
}
```

---

### 2.2 POST `/api/v1/approvals/expense-authorizations`
Submit a new Corporate Expense Authorization request.

#### Request Body (`application/json`):
```json
{
  "title": "Datadog APM License Renewal",
  "description": "Annual renewal for production application monitoring and distributed tracing.",
  "category": 5105,
  "requestedAmount": 8200.00,
  "currency": "USD",
  "departmentId": "dept-eng",
  "requiredByDate": "2026-12-15",
  "vendorName": "Datadog Inc."
}
```

#### Success Response (`201 Created`):
```json
{
  "success": true,
  "message": "Corporate expense authorization CEA-2026-0002 created successfully.",
  "data": {
    "id": "cuid-expense-02",
    "referenceNumber": "CEA-2026-0002",
    "title": "Datadog APM License Renewal",
    "category": 5105,
    "requestedAmount": 8200.0,
    "currency": "USD",
    "status": "PENDING_APPROVAL",
    "submittedAt": "2026-11-20T12:00:00.000Z"
  }
}
```

---

### 2.3 POST `/api/v1/approvals/expense-authorizations/[id]/approve`
Approve a pending Corporate Expense Authorization request.

#### Request Body (`application/json`, optional):
```json
{
  "approvalNotes": "Approved under Q4 engineering operational infrastructure budget."
}
```

#### Success Response (`200 OK`):
```json
{
  "success": true,
  "message": "Corporate expense authorization CEA-2026-0002 has been successfully approved.",
  "data": {
    "id": "cuid-expense-02",
    "status": "APPROVED",
    "approverId": "emp-mgr-01",
    "decidedAt": "2026-11-20T12:05:00.000Z",
    "approvalNotes": "Approved under Q4 engineering operational infrastructure budget."
  }
}
```

#### Error Responses:
- `403 Forbidden`: Requester attempts self-approval or approver is outside reporting hierarchy.
  ```json
  { "error": "Self-approval is strictly prohibited: Requesters cannot approve their own expense authorizations." }
  ```
- `409 Conflict`: Request is already decided (`APPROVED` or `REJECTED`).
  ```json
  { "error": "Cannot decide request: Expense authorization is already APPROVED. Only pending requests can be decided." }
  ```

---

### 2.4 POST `/api/v1/approvals/expense-authorizations/[id]/reject`
Reject a pending Corporate Expense Authorization request. Requires a mandatory rejection reason.

#### Request Body (`application/json`):
```json
{
  "rejectionReason": "Cost exceeds department discretionary spending cap. Defer to Q1."
}
```

#### Success Response (`200 OK`):
```json
{
  "success": true,
  "message": "Corporate expense authorization CEA-2026-0003 has been successfully rejected.",
  "data": {
    "id": "cuid-expense-03",
    "status": "REJECTED",
    "approverId": "emp-mgr-01",
    "decidedAt": "2026-11-20T12:10:00.000Z",
    "rejectionReason": "Cost exceeds department discretionary spending cap. Defer to Q1."
  }
}
```

#### Error Response (`422 Unprocessable Entity`):
When rejection reason is missing or shorter than 3 characters:
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "rejectionReason",
      "message": "A mandatory rejection reason of at least 3 characters is required when rejecting a request."
    }
  ]
}
```
