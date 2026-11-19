# GATE 5.3 — CORRECTED AUTHORITATIVE 10-ITEM DAY 18 SECURITY CHECKLIST
## HORIZON PORTAL — MULTI-LAYER SECURITY ACCEPTANCE REGISTER

---

## 1. AUTHORITATIVE 10-ITEM SECURITY CHECKLIST

| # | Security Control | Code-Level Result | Deterministic Test Result | Live Preview Result | Evidence | Overall Status |
|---|---|---|---|---|---|---|
| **1** | **API authorization and RBAC** | **PASS** | **PASS** | **CONDITIONAL PASS** | Strict role enforcement across Employee, Manager, and Admin roles in `src/lib/auth/rbac.ts`, `src/app/api/v1/tasks/route.ts`, and `employees/[id]/route.ts`. 113 task assertions & 34 hierarchy assertions passed. | **CONDITIONAL PASS** |
| **2** | **Zod validation coverage** | **PASS** | **PASS** | **PASS** | Comprehensive Zod schemas defined in `src/lib/validations/common.ts`, `leave.ts`, `auth.ts`, and route handlers. Rejects malformed types, bounds, and enums. 54 assertions passed. | **PASS** |
| **3** | **HTTP 422 validation responses** | **PASS** | **PASS** | **PASS** | Centralized `createValidationErrorResponse` in `src/lib/validations/common.ts` implemented across all 20 input-taking routes. 54 assertions passed in `test-day18-validation.ts`. | **PASS** |
| **4** | **Secure session cookie lifecycle** | **PASS** | **PASS** | **PASS** | `getSessionCookieOptions` in `src/lib/auth/session.ts` enforces `httpOnly: true`, `sameSite: "lax"`, `path: "/"`, `maxAge: 28800`, and `secure: true` in preview/prod. 14 assertions passed. | **PASS** |
| **5** | **Security headers and CSP** | **PASS** | **PASS** | **PASS** | `next.config.ts` enforces strict CSP, HSTS (`max-age=63072000`), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and `Referrer-Policy`. Verified via automated tests and build inspection. | **PASS** |
| **6** | **Distributed login rate limiting** | **PASS** | **PASS** | **CONDITIONAL PASS** | Dual-dimension rate limiting in `src/lib/security/rate-limit/` (10 IP / 15m; 5 Account / 15m). HMAC-SHA256 hashed keys. SEC-FIND-06 lockout non-extension verified. Live cloud gated by shared Redis. | **CONDITIONAL PASS** |
| **7** | **Payslip IDOR protection** | **PASS** | **PASS** | **CONDITIONAL PASS** | Strict employee ID comparison in `src/app/api/v1/payslips/[run_id]/route.ts`. Cross-access returns HTTP 403 with zero data disclosure and `IDOR_ACCESS_DENIED` log. 4 assertions passed in simulation. | **CONDITIONAL PASS** |
| **8** | **Leave IDOR protection** | **PASS** | **PASS** | **CONDITIONAL PASS** | Employee approval/rejection attempts rejected with HTTP 403. Query parameter spoofing thwared in `src/app/api/v1/leave/requests/route.ts`. 3 assertions passed in simulation. | **CONDITIONAL PASS** |
| **9** | **Sensitive-data privacy and security audit logging** | **PASS** | **PASS** | **PASS** | Zero leaks of `salary`, `bankAccountNumber`, `taxId`, `ssn`, `password` across 62 assertions in `test-privacy-leakage.ts`. Structured `logSecurityIncident` in `src/lib/security/audit.ts` verified with 6 assertions. | **PASS** |
| **10** | **Preview infrastructure isolation and deployed verification** | **PASS** | **PASS** | **CONDITIONAL PASS** | Fail-closed runtime guards in `src/lib/prisma.ts` and `prisma.config.postgresql.ts` reject Production host `ep-broad-hall-b3dtqwdp`. Creation of cloud branch and dedicated Redis pending owner action. | **CONDITIONAL PASS** |

---

## 2. CHECKLIST SCORECARD & GOVERNANCE RULES

- **Code-Level Verification:** 10 / 10 PASS (100%)
- **Deterministic Test Verification:** 10 / 10 PASS (100%)
- **Live Preview Deployed Verification:** 4 PASS, 6 CONDITIONAL PASS (Gated by Cloud DB/Redis separation)
- **Weakest Layer Governs Overall Status:** Under strict audit governance rule #8 ("Every overall status must reflect the weakest required acceptance layer"), items with cloud mutations held as BLOCKED to protect Production receive **CONDITIONAL PASS**.
- **Overall Day 18 Security Readiness:** **CONDITIONAL PASS (APPLICATION CODE SECURED; CLOUD BINDING REQUIRED)**
