# DAY 18 — HTTP 422 INPUT VALIDATION REMEDIATION REPORT

**Project:** Horizon Portal  
**Branch:** `day18-preview-validation`  
**Date:** November 19, 2026  
**Auditor:** Senior Application Security Engineer & Next.js Backend Architect  

---

## 1. Executive Summary

The Day 18 security specification explicitly mandates:
> *"Add Zod validation to every route that takes input. Reject bad input with 422."*

Prior to this remediation, routes returned HTTP 400 Bad Request to maintain legacy frontend conventions. This report documents the systematic remediation of all input-taking API routes to return **HTTP 422 Unprocessable Entity** with standardized error payloads, safe field-level details, and full frontend compatibility.

---

## 2. Standardized Validation Response Architecture

The centralized helper `createValidationErrorResponse` was implemented in `src/lib/validations/common.ts`:

```typescript
export function createValidationErrorResponse(
  errorOrMessage: z.ZodError | string,
  details?: Record<string, unknown> | unknown[],
  customHeaders?: Record<string, string>
) {
  let message = "Request validation failed.";
  let fieldErrors: unknown = details ?? [];

  if (typeof errorOrMessage === "string") {
    message = errorOrMessage;
  } else if (errorOrMessage && "issues" in errorOrMessage) {
    message = errorOrMessage.issues[0]?.message || "Request validation failed.";
    fieldErrors = errorOrMessage.flatten().fieldErrors;
  }

  return NextResponse.json(
    {
      success: false,
      error: message,
      code: "VALIDATION_ERROR",
      details: fieldErrors,
    },
    {
      status: 422,
      headers: {
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
        ...(customHeaders || {}),
      },
    }
  );
}
```

### Key Security & Frontend Invariants:
1. **HTTP Status:** Strictly `422 Unprocessable Entity`.
2. **Frontend Compatibility:** `error` is returned as a user-displayable string message, preventing React runtime crashes (`Objects are not valid as a React child`).
3. **Structured Details:** `details` carries field-level validation errors for form highlight integration.
4. **Zero Secret Leakage:** Omits stack traces, internal database details, tokens, or schema internals.
5. **Cache Prevention:** Injects `Cache-Control: private, no-cache, no-store, must-revalidate`.

---

## 3. Audited & Remediated API Routes Matrix

| API Route | Method | Input Source | Zod Schema Applied | Invalid-Input Status | Automated Test |
| :--- | :---: | :--- | :--- | :---: | :---: |
| `/api/v1/auth/login` | POST | Request Body | `loginInputSchema` | **422** | `test-day18-validation.ts` |
| `/api/v1/leave/requests` | POST | Request Body | `leaveRequestInputSchema` | **422** | `test-day18-validation.ts` |
| `/api/v1/approvals/leave/[id]/reject` | POST | Body & URL Param | `leaveRejectionSchema`, `idParamSchema` | **422** | `test-day18-validation.ts` |
| `/api/v1/approvals/leave/[id]/approve`| POST | URL Param | `idParamSchema` | **422** | `test-day18-final-remediation.ts` |
| `/api/v1/approvals/delegations` | POST | Request Body | `managerDelegationSchema` | **422** | `test-day18-final-remediation.ts` |
| `/api/v1/employees` | GET | Query Params | `employeeDirectoryQuerySchema` | **422** | `test-day18-validation.ts` |
| `/api/v1/employees/[id]` | GET | URL Param | `idParamSchema` | **422** | `test-day18-security.ts` |
| `/api/v1/leave/calendar` | GET | Query Params | `leaveCalendarQuerySchema` | **422** | `test-day18-validation.ts` |
| `/api/v1/team/attendance` | GET | Query Params | `teamAttendanceQuerySchema` | **422** | `test-day18-final-remediation.ts` |
| `/api/v1/payroll/runs` | GET | Query Params | `payrollRunsQuerySchema` | **422** | `test-day18-final-remediation.ts` |
| `/api/v1/payslips/[run_id]` | GET | URL Param | `idParamSchema` | **422** | `test-day18-final-remediation.ts` |
| `/api/v1/tasks` | GET | Query Params | `taskQuerySchema` | **422** | `test-day18-tasks-verification.ts` |
| `/api/v1/tasks/[id]` | PATCH | URL & Body | `idParamSchema`, `taskStatusUpdateSchema` | **422** | `test-day18-final-remediation.ts` |
| `/api/v1/admin/employees` | POST | Request Body | `employeeCreateSchema` | **422** | `test-day18-final-remediation.ts` |
| `/api/v1/admin/employees/[id]` | PATCH | URL & Body | `idParamSchema`, `employeeUpdateSchema` | **422** | `test-day18-final-remediation.ts` |
| `/api/v1/admin/audit` | GET | Query Params | `auditLogsQuerySchema` | **422** | `test-day18-final-remediation.ts` |
| `/api/v1/capacity` | GET | Query Params | `capacityQuerySchema` | **422** | `test-day18-final-remediation.ts` |
| `/api/v1/hr-insights` | GET | Query Params | `hrInsightsQuerySchema` | **422** | `test-day18-final-remediation.ts` |
| `/api/v1/hr-assistant/chat` | POST | Request Body | `ChatRequestSchema` | **422** | `test-day18-final-remediation.ts` |
| `/api/v1/notifications/[id]/read` | POST | URL Param | `idParamSchema` | **422** | `test-day18-final-remediation.ts` |

---

## 4. Test Verification Evidence

All 54 assertions in `scripts/test-day18-validation.ts` and all 30 assertions in `scripts/test-day18-tasks-verification.ts` passed:
- `POST /api/v1/auth/login` empty body -> **HTTP 422** (PASS)
- `POST /api/v1/auth/login` malformed email -> **HTTP 422** (PASS)
- `POST /api/v1/leave/requests` empty body -> **HTTP 422** (PASS)
- `POST /api/v1/leave/requests` invalid date -> **HTTP 422** (PASS)
- `POST /api/v1/approvals/leave/[id]/reject` whitespace reason -> **HTTP 422** (PASS)
- `GET /api/v1/employees?page=0` -> **HTTP 422** (PASS)
- `GET /api/v1/employees?pageSize=999` -> **HTTP 422** (PASS)
- `GET /api/v1/leave/calendar?month=15` -> **HTTP 422** (PASS)
- `GET /api/v1/leave/calendar?year=1850` -> **HTTP 422** (PASS)
- `GET /api/v1/tasks?page=0` -> **HTTP 422** (PASS)
- `GET /api/v1/tasks?pageSize=999` -> **HTTP 422** (PASS)
- `GET /api/v1/tasks?page=abc` -> **HTTP 422** (PASS)

---

## 5. Frontend Compatibility Audit

Frontend fetch clients throughout `src/components/` evaluate HTTP status using `if (!res.ok)`. Since HTTP 422 satisfies `!res.ok === true`, error states are handled transparently. The error payload shape `{ success: false, error: string, details: ... }` matches frontend display components.
