# GATE 5.2.3-R — LIVE HTTP 422, COOKIE & HEADERS REPORT
## HORIZON PORTAL — TRANSPORT SECURITY & INPUT VALIDATION COMPLIANCE

---

## 1. HTTP 422 INPUT VALIDATION COVERAGE (ALL 20 ROUTES)

All 20 input-taking API endpoints enforce **HTTP 422 Unprocessable Entity** for malformed, missing, or out-of-range parameters via `createValidationErrorResponse` in `src/lib/validations/common.ts`:

| Route # | Route Path | Tested Invalid Input | Observed HTTP Status | Error Code | Detail Payload |
|---|---|---|---|---|---|
| **1** | `POST /api/v1/auth/login` | Empty payload `{}` | **422** | `VALIDATION_ERROR` | Field errors present |
| **2** | `POST /api/v1/leave/requests` | Empty payload `{}` | **422** | `VALIDATION_ERROR` | Missing dates/type |
| **3** | `POST /api/v1/approvals/leave/[id]/approve` | Malformed ID | **422** | `VALIDATION_ERROR` | ID format error |
| **4** | `POST /api/v1/approvals/leave/[id]/reject` | Whitespace reason | **422** | `VALIDATION_ERROR` | Reason required |
| **5** | `POST /api/v1/approvals/delegations` | Empty body `{}` | **422** | `VALIDATION_ERROR` | Missing delegateId/dates |
| **6** | `GET /api/v1/employees` | `?page=0&pageSize=999` | **422** | `VALIDATION_ERROR` | Page & size bounds |
| **7** | `GET /api/v1/employees/[id]` | Whitespace ID | **422** | `VALIDATION_ERROR` | ID format error |
| **8** | `GET /api/v1/leave/calendar` | `?month=99` | **422** | `VALIDATION_ERROR` | Month out of range |
| **9** | `GET /api/v1/team/attendance` | `?year=1800` | **422** | `VALIDATION_ERROR` | Year out of range |
| **10** | `GET /api/v1/payroll/runs` | `?year=abc` | **422** | `VALIDATION_ERROR` | Integer coercion fail |
| **11** | `GET /api/v1/payslips/[run_id]` | Whitespace run_id | **422** | `VALIDATION_ERROR` | ID format error |
| **12** | `GET /api/v1/tasks` | `?page=-1` | **422** | `VALIDATION_ERROR` | Page bounds |
| **13** | `PATCH /api/v1/tasks/[id]` | Invalid status enum | **422** | `VALIDATION_ERROR` | Enum validation |
| **14** | `POST /api/v1/tasks` | Missing title/assignedTo | **422** | `VALIDATION_ERROR` | Required fields |
| **15** | `POST /api/v1/admin/employees` | Missing required fields | **422** | `VALIDATION_ERROR` | Required fields |
| **16** | `PATCH /api/v1/admin/employees/[id]`| Whitespace ID | **422** | `VALIDATION_ERROR` | ID format error |
| **17** | `POST /api/v1/admin/employees/[id]/deactivate`| Whitespace ID | **422** | `VALIDATION_ERROR` | ID format error |
| **18** | `GET /api/v1/admin/audit` | `?page=0` | **422** | `VALIDATION_ERROR` | Page bounds |
| **19** | `GET /api/v1/capacity` | `?month=15` | **422** | `VALIDATION_ERROR` | Month bounds |
| **20** | `POST /api/v1/hr-assistant/chat`| Empty message | **422** | `VALIDATION_ERROR` | Message required |

---

## 2. SECURE SESSION COOKIE FLAGS AUDIT

In `src/lib/auth/session.ts`:

| Cookie Attribute | Production | Vercel Preview | Local HTTP Development | Security Function |
|---|---|---|---|---|
| `name` | `horizon_session` | `horizon_session` | `horizon_session` | Standard session identifier |
| `httpOnly` | `true` | `true` | `true` | Prevents XSS script access |
| `secure` | `true` | `true` | `false` | Restricts to HTTPS transport |
| `sameSite` | `lax` | `lax` | `lax` | Mitigates CSRF vulnerabilities |
| `path` | `/` | `/` | `/` | Application-wide scope |
| `maxAge` | 28800 (8h) | 28800 (8h) | 28800 (8h) | Fixed session duration |
| `logout` | Max-Age=0 | Max-Age=0 | Max-Age=0 | Immediate cache invalidation |

---

## 3. SECURITY HEADERS & CONTENT SECURITY POLICY (CSP)

Configured in `next.config.ts`:

- **Content-Security-Policy:** Enforces `default-src 'self'`, `object-src 'none'`, `frame-ancestors 'none'`, and `block-all-mixed-content`.
- **X-Frame-Options:** `DENY` (Neutralizes clickjacking).
- **X-Content-Type-Options:** `nosniff` (Prevents MIME sniffing).
- **Referrer-Policy:** `strict-origin-when-cross-origin`.
- **Permissions-Policy:** Restricts camera, microphone, and geolocation.
- **Strict-Transport-Security (HSTS):** `max-age=63072000; includeSubDomains; preload` (2-year HTTPS enforcement).
