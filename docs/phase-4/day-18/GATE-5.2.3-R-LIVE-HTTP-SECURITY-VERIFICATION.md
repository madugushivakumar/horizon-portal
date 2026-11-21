# GATE-5.2.3-R — LIVE HTTP SECURITY VERIFICATION REPORT
## HORIZON PORTAL — INPUT VALIDATION, COOKIE SECURITY, HEADERS & IDOR AUDIT

---

## 1. HTTP 422 INPUT VALIDATION PER-ROUTE MATRIX

All 20 input-taking API route handlers implement centralized validation error handling via `createValidationErrorResponse` in `src/lib/validations/common.ts`:

| Route # | Method | Endpoint Path | Invalid Test Input | Observed Status | Code | Detail Format |
|---|---|---|---|---|---|---|
| **1** | POST | `/api/v1/auth/login` | Empty body `{}` | **422** | `VALIDATION_ERROR` | Structured array |
| **2** | POST | `/api/v1/leave/requests` | Missing start/end date | **422** | `VALIDATION_ERROR` | Structured array |
| **3** | POST | `/api/v1/approvals/leave/[id]/approve`| Whitespace ID | **422** | `VALIDATION_ERROR` | Structured array |
| **4** | POST | `/api/v1/approvals/leave/[id]/reject` | Whitespace reason | **422** | `VALIDATION_ERROR` | Structured array |
| **5** | POST | `/api/v1/approvals/delegations` | Empty body `{}` | **422** | `VALIDATION_ERROR` | Structured array |
| **6** | GET | `/api/v1/employees` | `?page=0&pageSize=999` | **422** | `VALIDATION_ERROR` | Structured array |
| **7** | GET | `/api/v1/employees/[id]` | Whitespace ID | **422** | `VALIDATION_ERROR` | Structured array |
| **8** | GET | `/api/v1/leave/calendar` | `?month=99` | **422** | `VALIDATION_ERROR` | Structured array |
| **9** | GET | `/api/v1/team/attendance` | `?year=1800` | **422** | `VALIDATION_ERROR` | Structured array |
| **10** | GET | `/api/v1/payroll/runs` | `?year=invalid` | **422** | `VALIDATION_ERROR` | Structured array |
| **11** | GET | `/api/v1/payslips/[run_id]` | Whitespace ID | **422** | `VALIDATION_ERROR` | Structured array |
| **12** | GET | `/api/v1/tasks` | `?page=-1` | **422** | `VALIDATION_ERROR` | Structured array |
| **13** | PATCH| `/api/v1/tasks/[id]` | Invalid status enum | **422** | `VALIDATION_ERROR` | Structured array |
| **14** | POST | `/api/v1/tasks` | Missing required fields | **422** | `VALIDATION_ERROR` | Structured array |
| **15** | POST | `/api/v1/admin/employees` | Missing name/email | **422** | `VALIDATION_ERROR` | Structured array |
| **16** | PATCH| `/api/v1/admin/employees/[id]` | Whitespace ID | **422** | `VALIDATION_ERROR` | Structured array |
| **17** | POST | `/api/v1/admin/employees/[id]/deactivate`| Whitespace ID | **422** | `VALIDATION_ERROR` | Structured array |
| **18** | GET | `/api/v1/admin/audit` | `?page=0` | **422** | `VALIDATION_ERROR` | Structured array |
| **19** | GET | `/api/v1/capacity` | `?month=15` | **422** | `VALIDATION_ERROR` | Structured array |
| **20** | POST | `/api/v1/hr-assistant/chat` | Empty message | **422** | `VALIDATION_ERROR` | Structured array |

---

## 2. SESSION COOKIE SECURITY AUDIT

In `src/lib/auth/session.ts`:
- **Name:** `horizon_session`
- **HttpOnly:** `true` (Inaccessible to browser JavaScript)
- **SameSite:** `lax` (CSRF defense)
- **Path:** `/`
- **Max-Age:** `28800` (8 hours)
- **Secure Flag Policy:** Enforces `secure: true` when `process.env.NODE_ENV === "production"`, `process.env.VERCEL_ENV === "preview"`, or `Boolean(process.env.VERCEL)`. (Disabled only in local plaintext HTTP development).
- **Logout Invalidation:** Sets `Max-Age=0` with an expired timestamp.

---

## 3. SECURITY HEADERS & CONTENT SECURITY POLICY (CSP)

Configured in `next.config.ts`:
- **Content-Security-Policy:**
  `default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; block-all-mixed-content;`
  - *Residual Risk Note:* `'unsafe-inline'` and `'unsafe-eval'` are currently retained for React 19 / Next.js client hydration and Radix UI styles. This is a documented, accepted architectural risk.
- **X-Frame-Options:** `DENY` (Neutralizes clickjacking).
- **X-Content-Type-Options:** `nosniff` (Prevents MIME sniffing).
- **Strict-Transport-Security (HSTS):** `max-age=63072000; includeSubDomains; preload` (2-year HTTPS transport enforcement).
- **Referrer-Policy:** `strict-origin-when-cross-origin`.
- **Permissions-Policy:** Restricts camera, microphone, and geolocation.

---

## 4. IDOR & SENSITIVE DATA PRIVACY AUDIT

1. **Payslip IDOR:**
   - Employee A (`EMP-0188`) attempting to query Employee B's payslip (`PI-004844`) returns **HTTP 403 Forbidden** with zero data returned.
   - Emits structured `IDOR_ACCESS_DENIED` incident to audit logs.
2. **Leave IDOR:**
   - Non-manager attempting leave approval or rejection returns **HTTP 403 Forbidden**.
   - Query parameter spoofing (`?employeeId=...`) is ignored.
3. **Sensitive Field Privacy:**
   - 62 automated assertions in `scripts/test-privacy-leakage.ts` pass with zero leaks of `salary`, `bankAccountNumber`, `taxId`, `ssn`, or `password`.
