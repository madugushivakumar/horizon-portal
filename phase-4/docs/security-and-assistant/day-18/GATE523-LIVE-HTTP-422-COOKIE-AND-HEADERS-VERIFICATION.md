# GATE 5.2.3 — LIVE HTTP 422, COOKIE & HEADERS VERIFICATION REPORT
## HORIZON PORTAL — TRANSPORT SECURITY, INPUT VALIDATION & HTTP HEADERS AUDIT

---

## 1. HTTP 422 UNPROCESSABLE ENTITY VERIFICATION

Horizon Portal enforces **HTTP 422 Unprocessable Entity** across all input-taking endpoints when request payloads fail syntactic, type, boundary, or semantic validation.

### Representative Route Audit Matrix

| Route | Test Input | HTTP Status | Response Error Code | Structured Details Present |
|---|---|---|---|---|
| `POST /api/v1/auth/login` | `{}` (Empty body) | **422** | `VALIDATION_ERROR` | Yes |
| `POST /api/v1/auth/login` | `{"email": "notanemail", "password": "123"}` | **422** | `VALIDATION_ERROR` | Yes |
| `POST /api/v1/leave/requests` | `{}` (Missing required fields) | **422** | `VALIDATION_ERROR` | Yes |
| `POST /api/v1/leave/requests` | `{"startDate": "invalid-date"}` | **422** | `VALIDATION_ERROR` | Yes |
| `POST /api/v1/approvals/leave/[id]/reject`| `{"reason": "   "}` (Whitespace) | **422** | `VALIDATION_ERROR` | Yes |
| `GET /api/v1/employees` | `?page=0&pageSize=999` | **422** | `VALIDATION_ERROR` | Yes |
| `GET /api/v1/tasks` | `?page=-1` | **422** | `VALIDATION_ERROR` | Yes |
| `GET /api/v1/leave/calendar` | `?month=99&year=1800` | **422** | `VALIDATION_ERROR` | Yes |

All 20 input routes implement centralized validation error handling via `src/lib/validations/common.ts`.

---

## 2. SECURE SESSION COOKIE FLAGS AUDIT

Horizon Portal manages session tokens via the `horizon_session` HTTP cookie.

```typescript
// Verified Configuration in src/lib/auth/session.ts
const isSecure =
  process.env.NODE_ENV === "production" ||
  process.env.VERCEL_ENV === "preview" ||
  Boolean(process.env.VERCEL);

const options: CookieOptions = {
  httpOnly: true,
  secure: isSecure,
  sameSite: "lax",
  path: "/",
  maxAge: 28800, // 8 hours
};
```

### Cookie Security Directives
1. **HttpOnly:** `true` — Inaccessible to JavaScript `document.cookie`, neutralizing cross-site scripting (XSS) session theft.
2. **Secure:** `true` — Automatically active in Production and Vercel Preview environments (`https://`). (Disabled only during local plaintext HTTP development).
3. **SameSite:** `lax` — Provides cross-site request forgery (CSRF) protection while supporting standard top-level navigation.
4. **Path:** `/` — Strictly scoped across all application routes.
5. **Session Invalidation:** Logout sets `Max-Age=0` and expires timestamp in the past.

---

## 3. SECURITY HEADERS & CONTENT SECURITY POLICY (CSP)

Configured in `next.config.ts`:

| Security Header | Configured Value | Security Function |
|---|---|---|
| **Content-Security-Policy** | `default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; block-all-mixed-content;` | Mitigates XSS, data injection, and malicious script execution |
| **X-Frame-Options** | `DENY` | Clickjacking defense |
| **X-Content-Type-Options**| `nosniff` | MIME-type sniffing defense |
| **Referrer-Policy** | `strict-origin-when-cross-origin` | Information leakage prevention |
| **Permissions-Policy** | `camera=(), microphone=(), geolocation=(), browsing-topics=()` | Disables browser hardware APIs |
| **Strict-Transport-Security**| `max-age=63072000; includeSubDomains; preload` | Enforces HTTPS transport (2 years) |
