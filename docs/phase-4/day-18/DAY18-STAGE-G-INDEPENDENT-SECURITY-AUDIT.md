# HORIZON PORTAL — PHASE 4, DAY 18
# STAGE G: INDEPENDENT END-TO-END SECURITY AUDIT & PRODUCTION-READINESS VERIFICATION

**Document ID:** `DAY18-STAGE-G-INDEPENDENT-SECURITY-AUDIT`  
**System:** Horizon Portal — Enterprise HR Management Platform  
**Target Repository:** `horizon-portal` (`main`)  
**Baseline Commit:** `c6683d6054a5460fd36afbcc6e419c017894705e`  
**Hosting Environment:** Vercel Serverless  
**Databases:** SQLite Development (`prisma/dev.db`) / Neon PostgreSQL Production  
**Audit Role:** Independent Principal Application Security Engineer, Senior Backend Architect & QA Lead  
**Audit Date:** November 18, 2026  
**Final Audit Verdict:** **CONDITIONAL PASS — Remediation Required Prior to Production Release**  

---

## 1. Executive Summary

This document represents the independent, evidence-driven Phase 4, Day 18 Stage G security audit of Horizon Portal. The audit independently inspected source implementations, executed automated regression suites, conducted seven isolated attack simulations, verified route security coverage across all 46 API route files (52 HTTP method handlers), and evaluated production readiness.

### Key Conclusions:
1. **Critical Application Vulnerabilities Remediated:** The critical demo-session backdoor (`SEC-FIND-01`) is verifiably disabled in production (`NODE_ENV === "production"` guard returning HTTP 404 before DB or token operations). Handler-level authentication (`SEC-FIND-03`) is strictly enforced on `/api/v1/employees/[id]`, `/api/v1/departments`, and `/api/v1/roles`.
2. **Robust Input Validation:** Zod schemas (`SEC-FIND-04`) protect 10 previously untrusted endpoints against parameter tampering, out-of-bounds pagination, and malformed identifiers.
3. **Compatible Security Headers & CSP:** The accepted Option C CSP policy (`script-src 'self' 'unsafe-inline'`) successfully eliminates W3C CSP Level 3 hash suppression, permitting Next.js React Server Component flight chunks and theme initialization without browser hydration breakage.
4. **Distributed Login Rate Limiting:** Dual-dimension rate limiting (`SEC-FIND-02`) on `POST /api/v1/auth/login` enforces 10 attempts / 15 min per IP and 5 failed attempts / 15 min per targeted account using pseudonymous HMAC-SHA256 keys (zero plaintext email leakage) and zero-dependency Upstash Redis REST pipelining.
5. **Audit Findings Identified:**
   - `SEC-FIND-06` (Medium): Blocked login attempts during account lockout do not increment the IP throttle counter.
   - `SEC-FIND-07` (Low): Silent fallback to in-memory store in production when Upstash environment variables are omitted.
   - `SEC-FIND-08` (Low): Client IP extraction prioritizes `x-real-ip` over platform-authoritative `x-vercel-forwarded-for`.
   - `SEC-FIND-10` (Upstream Critical Advisory): Installed `next@16.4.2` is subject to upstream GHSA advisories requiring a framework upgrade to `16.4.5+`.

---

## 2. Repository Baseline & Git State

The repository state was captured prior to audit execution and verified again at conclusion:

| Baseline Attribute | Target Baseline | Actual Verified State | Audit Finding |
|---|---|---|---|
| **Git Branch** | `main` | `main` | ✅ MATCH |
| **HEAD Commit** | `c6683d6054a5460fd36afbcc6e419c017894705e` | `c6683d6054a5460fd36afbcc6e419c017894705e` | ✅ MATCH |
| **Staged Git Changes** | `0` files | `0` files (`git diff --cached` is empty) | ✅ VERIFIED |
| **Tracked Modified Files** | Pre-existing modifications | 44 files strictly controlled | ✅ PRESERVED |
| **Untracked Files** | Pre-existing untracked files | 182 files untouched | ✅ PRESERVED |
| **Development SQLite DB** | `prisma/dev.db` (3,637,248 bytes) | Exactly **3,637,248 bytes** | ✅ UNMUTATED |
| **Production Neon DB** | `neondb` (27 tables, 15,229 rows) | Read-only preserved | ✅ UNMUTATED |

---

## 3. Stage C Audit: Authentication & Authorization

### 3.1 Demo-Session Production Guard (`SEC-FIND-01`)
- **File:** `src/app/api/v1/auth/demo-session/route.ts`
- **Implementation:** Line 8 explicitly evaluates `if (process.env.NODE_ENV === "production") return NextResponse.json({ error: "This endpoint is not available in production." }, { status: 404 });`.
- **Forensic Verification:** The guard executes prior to query parameter parsing, database lookup, token generation, or cookie issuance.
- **Evidence:** 17 automated tests in `scripts/test-day18-security.ts` confirm that requests with any combination of `role=Admin`, `role=HR`, `role=Manager`, `role=Employee`, explicit emails, or manipulated redirects return HTTP 404 with zero cookie headers.

### 3.2 Authentication vs. Authorization Boundaries (`SEC-FIND-03`)
- **Explicit Handler-Level Auth:** Verified on `/api/v1/employees/[id]`, `/api/v1/departments`, and `/api/v1/roles` via `getAuthenticatedUserFromToken(token)`. Unauthenticated requests return HTTP 401 with explicit error messaging.
- **Role-Based Access Control (RBAC):** Verified in `src/proxy.ts` and route handlers. Employee access to `/admin/finance`, `/admin/audit`, and administrative APIs is rejected with HTTP 403 or redirected with `error=unauthorized`.
- **Sensitive Field Masking:** Prisma queries for employee profiles explicitly exclude `salary`, `bankAccount`, `panNumber`, and `passwordHash`. Tested across 62 assertions in `scripts/test-privacy-leakage.ts`.

### 3.3 IDOR / BOLA Prevention
- **Payslip Ownership:** In `src/app/api/v1/payslips/[run_id]/route.ts`, the database query enforces `employeeId: currentEmployeeId`. If a user attempts to access a valid payslip ID belonging to another employee, the handler logs the breach attempt and returns `HTTP 403 Forbidden` with zero private data.
- **Leave Request Ownership & Self-Approval Prevention:** In `src/lib/leave/approval-service.ts`, self-approval is strictly forbidden (`isSelf: true` returns HTTP 403). Managers are bounded by direct reporting hierarchy and active delegation records.

---

## 4. Stage D Audit: Input Validation

- **Validation Library:** Zod (`zod@3.24.1`)
- **Schema Directory:** `src/lib/validations/` (`auth.ts`, `common.ts`, `directory.ts`, `leave.ts`, `attendance.ts`, `payroll.ts`, `audit.ts`, `employee.ts`, `task.ts`, `capacity.ts`).
- **Input Boundaries Verified:**
  - Length limits on email and password ($\le 255$ characters).
  - Identifier validation via `idParamSchema` ($\le 128$ characters, non-empty, trimmed).
  - Numeric boundary constraints on calendar queries (month 1–12, year 1900–2100).
  - Directory pagination limits (page $\ge 1$, pageSize 1–100).
  - Date format validation (strict `YYYY-MM-DD` ISO regex).
- **Separation of Duties:** Validation confirms structural correctness; authorization independently evaluates permissions, roles, and ownership.
- **Evidence:** 54 passing assertions in `scripts/test-day18-validation.ts`.

---

## 5. Stage E Audit: Security Headers & CSP

### 5.1 Option C Content Security Policy Verification
- **Policy:** `script-src 'self' 'unsafe-inline'`
- **Forensic Hash Removal:** Confirmed that the inline theme script hash (`sha256-u/P+mH0lAjjBdDDWdyZ4AkPHaWjLh8LuvYG0f8MkXiE=`) is intentionally omitted from production `script-src` to avoid W3C CSP Level 3 suppression of `'unsafe-inline'`.
- **Hydration Compatibility:** Verified in headless Microsoft Edge via Chrome DevTools Protocol (CDP); zero CSP console errors, interactive React hydration verified on `/login` and `/dashboard`.
- **Residual XSS Risk Qualification:** Because `'unsafe-inline'` is enabled in `script-src`, CSP alone does not prevent inline script injection if user-supplied HTML is rendered unsanitized. React automatic string escaping mitigates standard reflected XSS, but `dangerouslySetInnerHTML` must remain strictly forbidden for untrusted inputs.

### 5.2 Header Duplication Assessment (`SEC-FIND-09`)
- Security headers are defined in both `next.config.ts` (applied by Next.js router) and `src/proxy.ts` (applied to middleware responses).
- **Impact:** While headers carry identical values and cause no browser conflicts, dual declaration can lead to duplicate HTTP response headers in specific Edge paths.

### 5.3 HSTS Subdomain Evaluation
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- **Assessment:** Safe for production on custom domains, but enterprise teams must ensure all subdomains support HTTPS before deploying to apex domains.

---

## 6. Stage F Audit: Distributed Login Rate Limiting

### 6.1 Shared Store & Upstash Redis REST
- **Transport:** Native HTTP `fetch()` using Upstash pipeline endpoint (`POST /pipeline`).
- **Timeout Protection:** 3,000ms deadline enforced via `AbortController`.
- **Finding `SEC-FIND-07`:** When `UPSTASH_REDIS_REST_URL` is omitted, the factory silently falls back to `MemoryDistributedStore` without warning. In multi-instance serverless deployments, missing environment variables could result in uncoordinated local counters.

### 6.2 Atomicity & Concurrency Analysis
- **Pipeline Structure:** `[["INCR", key], ["EXPIRE", key, windowSeconds, "NX"], ["PTTL", key]]`.
- **Race Condition Window:** `checkLoginRateLimit` evaluates counters before authentication; `recordFailedLoginAttempt` increments counters after authentication. Under high concurrency, simultaneous requests launched in the same microsecond can both pass the initial check before either registers a failure. However, subsequent bursts are strictly throttled once failures are recorded.
- **Finding `SEC-FIND-06`:** Blocked login requests during account lockout return HTTP 429 immediately without incrementing the IP counter, allowing an attacker to cycle through multiple employee accounts without tripping the IP threshold.

### 6.3 Pseudonymous HMAC-SHA256 Account Keys
- Formatted as `${prefix}:account:<64-char-hex>` using `RATE_LIMIT_SECRET` / `AUTH_SECRET`.
- Verified that raw employee emails never appear in Redis keys or access logs.

---

## 7. End-to-End Attack Simulations

Seven hostile scenarios were executed against isolated fixtures via `scripts/test-day18-stage-g-simulation.ts`:

```text
================================================================================
  HORIZON PORTAL — PHASE 4, DAY 18: STAGE G ATTACK SIMULATION SUITE
================================================================================

--- Scenario 1: Single-Origin Brute Force Simulation ---
  [PASS] Attempt 1 processed and rejected with 401
  [PASS] Attempt 2 processed and rejected with 401
  [PASS] Attempt 3 processed and rejected with 401
  [PASS] Attempt 4 processed and rejected with 401
  [PASS] Attempt 5 processed and rejected with 401
  [PASS] Attempt 6 blocked under account threshold with 429
  [PASS] Attempt 7 blocked under account threshold with 429
  [PASS] Attempt 8 blocked under account threshold with 429
  [PASS] Attempt 9 blocked under account threshold with 429
  [PASS] Attempt 10 blocked under account threshold with 429
  [PASS] [FINDING SEC-FIND-06 CONFIRMED] Blocked account requests do not increment IP counter; fresh account attempt returns 401 (evading IP threshold)

--- Scenario 2: Distributed Account Brute-Force (Botnet) ---
  [PASS] Bot 1 from IP 192.0.2.101 receives 401
  [PASS] Bot 2 from IP 192.0.2.102 receives 401
  [PASS] Bot 3 from IP 192.0.2.103 receives 401
  [PASS] Bot 4 from IP 192.0.2.104 receives 401
  [PASS] Bot 5 from IP 192.0.2.105 receives 401
  [PASS] 6th attempt against targeted account blocked despite fresh IP (429)
  [PASS] Zero session cookies set on account block
  [PASS] Fresh IP targeting unattacked account receives 401 (not false 429)

--- Scenario 3: Password Spray Simulation ---
  [PASS] Spray attempt 1 processed (401)
  [PASS] Spray attempt 2 processed (401)
  [PASS] Spray attempt 3 processed (401)
  [PASS] Spray attempt 4 processed (401)
  [PASS] Spray attempt 5 processed (401)
  [PASS] Spray attempt 6 processed (401)
  [PASS] Spray attempt 7 processed (401)
  [PASS] Spray attempt 8 processed (401)
  [PASS] Spray attempt 9 processed (401)
  [PASS] Spray attempt 10 processed (401)
  [PASS] 11th spray attempt blocked under IP threshold (429)

--- Scenario 4: Account Enumeration & Error Uniformity ---
  [PASS] Both existent and non-existent accounts return 429
  [PASS] Response error strings are identical (zero enumeration leakage)
  [PASS] Retry-After headers present on both responses

--- Scenario 5: Counter Reset Security Invariant ---
  [PASS] Account counter reset allows subsequent login attempts
  [PASS] IP counter is preserved at 3 (attacker cannot clear IP counter via valid login)

--- Scenario 6: High-Concurrency Burst Analysis ---
    Concurrent burst status distribution: { '401': 10 }
  [PASS] Initial concurrent attempts received 401 (Observed: 10)
  [PASS] Final recorded IP counter reflects all failed attempts (Got: 10)
  [PASS] Post-burst request is blocked with HTTP 429

--- Scenario 7: Store Outage Resilience ---
[RateLimit] Store failure in fail-open mode; permitting request: Connection timed out to Upstash Redis REST
  [PASS] Fail-open policy permits login attempt when Redis store is unreachable

================================================================================
  STAGE G SIMULATION EXECUTION COMPLETE: Passed: 39 | Failed: 0
================================================================================
```

---

## 8. Complete 46-Route Security Coverage Matrix

Direct inspection of all 46 API route files (52 HTTP method handlers):

| # | Route Endpoint | Method | Authentication | Authorization | Input Validation | Resource Scope | Audit Result |
|---|---|---|---|---|---|---|---|
| 1 | `/api/v1/admin/audit` | GET | Handler | Admin only | Zod (`auditLogQuerySchema`) | Org-wide | ✅ SECURE |
| 2 | `/api/v1/admin/employees` | GET | Handler | Admin, HR | Query parsing | Org-wide | ✅ SECURE |
| 3 | `/api/v1/admin/employees` | POST | Handler | Admin, HR | Zod (`employeeCreateSchema`) | Org-wide | ✅ SECURE |
| 4 | `/api/v1/admin/employees/export` | GET | Handler | Admin, HR | Manual query parsing | Org-wide | ✅ SECURE |
| 5 | `/api/v1/admin/employees/[id]` | GET | Handler | Admin, HR | Zod (`idParamSchema`) | Org-wide | ✅ SECURE |
| 6 | `/api/v1/admin/employees/[id]` | PATCH | Handler | Admin, HR | Zod (`employeeUpdateSchema`) | Org-wide | ✅ SECURE |
| 7 | `/api/v1/admin/employees/[id]` | PUT | Handler | Admin, HR | Zod (`employeeUpdateSchema`) | Org-wide | ✅ SECURE |
| 8 | `/api/v1/admin/employees/[id]/deactivate` | POST | Handler | Admin, HR | Zod (`idParamSchema`) | Org-wide | ✅ SECURE |
| 9 | `/api/v1/admin/finance/expenses` | GET | Handler | Admin, Finance | Query parsing | Finance | ✅ SECURE |
| 10 | `/api/v1/admin/finance/export/expenses` | GET | Handler | Admin, Finance | Query parsing | Finance | ✅ SECURE |
| 11 | `/api/v1/admin/finance/export/invoices` | GET | Handler | Admin, Finance | Query parsing | Finance | ✅ SECURE |
| 12 | `/api/v1/admin/finance/invoices` | GET | Handler | Admin, Finance | Query parsing | Finance | ✅ SECURE |
| 13 | `/api/v1/admin/finance/summary` | GET | Handler | Admin, Finance | Query parsing | Finance | ✅ SECURE |
| 14 | `/api/v1/approvals/delegations` | GET | Handler | Manager, HR | Query parsing | User / Team | ✅ SECURE |
| 15 | `/api/v1/approvals/delegations` | POST | Handler | Manager, HR | Zod (`delegationCreateSchema`) | User / Team | ✅ SECURE |
| 16 | `/api/v1/approvals/leave` | GET | Handler | Manager, HR, Admin | Query parsing | Managed team | ✅ SECURE |
| 17 | `/api/v1/approvals/leave/[id]` | GET | Handler | Manager, HR, Admin | Zod (`idParamSchema`) | Managed team | ✅ SECURE |
| 18 | `/api/v1/approvals/leave/[id]/approve` | POST | Handler | Manager, HR, Admin | Zod (`idParamSchema`) | Non-self team | ✅ SECURE |
| 19 | `/api/v1/approvals/leave/[id]/reject` | POST | Handler | Manager, HR, Admin | Zod (`leaveRejectionSchema`) | Non-self team | ✅ SECURE |
| 20 | `/api/v1/attendance/summary` | GET | Handler | Authenticated | Query parsing | Self / Employee | ✅ SECURE |
| 21 | `/api/v1/auth/demo-session` | GET | Public (Dev) | Dev only (404 in Prod) | Query params | N/A | ✅ SECURE (`SEC-FIND-01`) |
| 22 | `/api/v1/auth/login` | POST | Public | Public / Rate Limited | Zod (`loginInputSchema`) | N/A | ✅ SECURE (`SEC-FIND-02`) |
| 23 | `/api/v1/auth/logout` | POST | Public | Public | N/A | Cookie | ✅ SECURE |
| 24 | `/api/v1/auth/me` | GET | Handler | Authenticated | N/A | Self | ✅ SECURE |
| 25 | `/api/v1/capacity` | GET | Handler | Authenticated | Zod (`capacityQuerySchema`) | Org-wide | ✅ SECURE |
| 26 | `/api/v1/capacity/filters` | GET | Handler | Authenticated | N/A | Org-wide | ✅ SECURE |
| 27 | `/api/v1/departments` | GET | Handler | Authenticated | N/A | Org-wide | ✅ SECURE (`SEC-FIND-03b`) |
| 28 | `/api/v1/employees` | GET | Handler | Authenticated | Zod (`employeeDirectoryQuerySchema`) | Directory | ✅ SECURE |
| 29 | `/api/v1/employees/[id]` | GET | Handler | Authenticated | Zod (`idParamSchema`) | Directory | ✅ SECURE (`SEC-FIND-03a`) |
| 30 | `/api/v1/employees/[id]` | PATCH | Re-export | Admin, HR | Zod (`employeeUpdateSchema`) | Org-wide | ✅ SECURE |
| 31 | `/api/v1/employees/[id]` | PUT | Re-export | Admin, HR | Zod (`employeeUpdateSchema`) | Org-wide | ✅ SECURE |
| 32 | `/api/v1/employees/[id]/deactivate` | POST | Re-export | Admin, HR | Zod (`idParamSchema`) | Org-wide | ✅ SECURE |
| 33 | `/api/v1/hr-assistant/chat` | POST | Handler | Authenticated | Zod / JSON parsing | Self | ✅ SECURE |
| 34 | `/api/v1/hr-insights` | GET | Handler | Admin, HR | Query parsing | Org-wide | ✅ SECURE |
| 35 | `/api/v1/hr-insights/filters` | GET | Handler | Admin, HR | N/A | Org-wide | ✅ SECURE |
| 36 | `/api/v1/leave/balances` | GET | Handler | Authenticated | N/A | Self | ✅ SECURE |
| 37 | `/api/v1/leave/calendar` | GET | Handler | Authenticated | Zod (`leaveCalendarQuerySchema`) | Org / Self | ✅ SECURE |
| 38 | `/api/v1/leave/requests` | GET | Handler | Authenticated | Query parsing | Self | ✅ SECURE |
| 39 | `/api/v1/leave/requests` | POST | Handler | Authenticated | Zod (`leaveRequestCreateSchema`) | Self | ✅ SECURE |
| 40 | `/api/v1/notifications` | GET | Handler | Authenticated | Query parsing | Self | ✅ SECURE |
| 41 | `/api/v1/notifications/[id]/read` | POST | Handler | Authenticated | Zod (`idParamSchema`) | Self | ✅ SECURE |
| 42 | `/api/v1/payroll/runs` | GET | Handler | Admin, HR | Zod (`payrollRunFilterSchema`) | Payroll | ✅ SECURE |
| 43 | `/api/v1/payroll/runs/[runId]` | GET | Handler | Admin, HR | Zod (`payrollRunIdParamSchema`) | Payroll | ✅ SECURE |
| 44 | `/api/v1/payroll/runs/[runId]/approve` | POST | Handler | Admin, HR | Zod (`payrollRunIdParamSchema`) | Payroll | ✅ SECURE |
| 45 | `/api/v1/payroll/runs/[runId]/reconciliation-preview` | GET | Handler | Admin, HR | Zod (`payrollRunIdParamSchema`) | Payroll | ✅ SECURE |
| 46 | `/api/v1/payslips` | GET | Handler | Authenticated | N/A | Self | ✅ SECURE |
| 47 | `/api/v1/payslips/[run_id]` | GET | Handler | Authenticated | Zod (`idParamSchema`) | Self only | ✅ SECURE |
| 48 | `/api/v1/roles` | GET | Handler | Authenticated | N/A | Org-wide | ✅ SECURE (`SEC-FIND-03c`) |
| 49 | `/api/v1/tasks` | GET | Handler | Authenticated | Zod (`taskFilterSchema`) | Org-wide | ✅ SECURE |
| 50 | `/api/v1/tasks/filters` | GET | Handler | Authenticated | N/A | Org-wide | ✅ SECURE |
| 51 | `/api/v1/tasks/[id]` | PATCH | Handler | Authenticated | Zod (`taskUpdateSchema`) | Org-wide | ✅ SECURE |
| 52 | `/api/v1/team/attendance` | GET | Handler | Manager, HR, Admin | Zod (`teamAttendanceQuerySchema`) | Managed team | ✅ SECURE |

---

## 9. Regression Test Results

All existing and newly added automated test suites were executed:

```powershell
npm run test:rate-limit
npm run test:security
npm run test:validation
npm run test:headers
npm run test:auth
npm run test:leave
npm run test:privacy
npm run test:payslips
npx tsx scripts/test-day18-stage-g-simulation.ts
```

| Test Suite File | Command | Assertions | Result | Status |
|---|---|---|---|---|
| `test-day18-login-rate-limit.ts` | `npm run test:rate-limit` | 51 assertions | 51 Passed, 0 Failed | ✅ PASS |
| `test-day18-security.ts` | `npm run test:security` | 46 assertions | 46 Passed, 0 Failed | ✅ PASS |
| `test-day18-validation.ts` | `npm run test:validation` | 54 assertions | 54 Passed, 0 Failed | ✅ PASS |
| `test-day18-security-headers.ts` | `npm run test:headers` | 63 assertions | 63 Passed, 0 Failed | ✅ PASS |
| `test-auth.ts` | `npm run test:auth` | 39 assertions | 39 Passed, 0 Failed | ✅ PASS |
| `test-day6-leave.ts` | `npm run test:leave` | 43 assertions | 43 Passed, 0 Failed | ✅ PASS |
| `test-privacy-leakage.ts` | `npm run test:privacy` | 62 assertions | 62 Passed, 0 Failed | ✅ PASS |
| `test-day7-payslips.ts` | `npm run test:payslips` | 67 assertions | 67 Passed, 0 Failed | ✅ PASS |
| `test-day18-stage-g-simulation.ts` | `npx tsx scripts/...` | 39 assertions | 39 Passed, 0 Failed | ✅ PASS |
| **Consolidated Total** | Full Automated Pipeline | **464 assertions** | **464 Passed, 0 Failed** | **100% PASS** |

---

## 10. Static Verification & Production Build

1. **TypeScript Typecheck (`npx tsc --noEmit`):** Clean exit code 0; zero type errors across the entire codebase.
2. **ESLint Static Code Quality (`npm run lint`):** Clean exit code 0; 0 errors, 108 non-blocking warnings (consistent with baseline).
3. **Next.js Production Build (`npm run build` / `next build --webpack`):** Clean compilation across all **63 static, partial prerender, and dynamic routes**.

---

## 11. Security Findings Register

| Finding ID | Severity | Category | Target / Scope | Description & Technical Impact | Remediation Proposal | Mandatory Release Blocker? |
|---|---|---|---|---|---|---|
| **SEC-FIND-01** | **CRITICAL** | Authentication | `/api/v1/auth/demo-session` | Demo session backdoor allowed unauthenticated administrative session generation. | **REMEDIATED (Stage C):** Production `NODE_ENV` guard returns HTTP 404. | NO (Resolved) |
| **SEC-FIND-02** | **MEDIUM** | Rate Limiting | `POST /api/v1/auth/login` | Lack of request throttling permitted password brute forcing and credential stuffing. | **REMEDIATED (Stage F):** Dual-dimension distributed rate limiting with HMAC keys. | NO (Resolved) |
| **SEC-FIND-03** | **HIGH** | Authorization | `/api/v1/employees/[id]`, `/departments`, `/roles` | Endpoints lacked handler-level authentication. | **REMEDIATED (Stage C):** Explicit token verification added. | NO (Resolved) |
| **SEC-FIND-04** | **LOW** | Input Validation | 10 API route handlers | Untrusted inputs lacked strict schema enforcement. | **REMEDIATED (Stage D):** Zod schema validation applied. | NO (Resolved) |
| **SEC-FIND-05** | **LOW** | Headers & CSP | `next.config.ts`, `src/proxy.ts` | Missing HTTP security response headers and CSP. | **REMEDIATED (Stage E):** Option C compatible CSP & security headers added. | NO (Resolved) |
| **SEC-FIND-06** | **MEDIUM** | Rate Limiting | `POST /api/v1/auth/login` | Blocked login attempts during account lockout return 429 early without incrementing the IP counter, allowing an attacker to cycle through multiple employee accounts without tripping the IP threshold. | Call `recordFailedLoginAttempt(request)` when `!rateLimitDecision.allowed` before returning 429. | YES (Recommended Fix) |
| **SEC-FIND-07** | **LOW** | Rate Limiting | `src/lib/security/rate-limit/store.ts` | Silent fallback to `MemoryDistributedStore` when Upstash Redis credentials are unset in production. | Emit `console.error` warning when `NODE_ENV === "production"` and Upstash credentials are absent. | NO (Operational) |
| **SEC-FIND-08** | **LOW** | Rate Limiting | `src/lib/security/rate-limit/client-ip.ts` | Client IP extraction evaluates `x-real-ip` before platform-authoritative `x-vercel-forwarded-for`. | Prioritize `x-vercel-forwarded-for` on Vercel deployments. | NO (Defense-in-depth) |
| **SEC-FIND-09** | **INFORMATIONAL** | Headers | `next.config.ts` vs `src/proxy.ts` | Security headers defined in both configuration layers may cause duplicate headers on certain Edge routes. | Harmonize header injection layers. | NO |
| **SEC-FIND-10** | **CRITICAL (Upstream)** | Framework | `next@16.4.2` | Upstream Next.js vulnerabilities (`GHSA-673q-mjm6-r5xr`, `GHSA-2464-fhr4-w9xw`, `GHSA-p3m5-59mp-jv5r`). | Upgrade `next` to `16.4.5+` in an isolated branch/worktree. | YES (Pre-release Upgrade) |

---

## 12. Production Readiness Matrix

| Functional & Security Dimension | Verification Status | Residual Gap / Finding | Production Blocker? |
|---|---|---|---|
| **Authentication Enforcement** | ✅ Verified | None. Demo-session safely blocked in production. | NO |
| **Authorization & RBAC** | ✅ Verified | None. Handler checks and role boundaries active. | NO |
| **IDOR & BOLA Protection** | ✅ Verified | None. Payslips and leave bounded by identity. | NO |
| **Input Validation (Zod)** | ✅ Verified | None. Strict schemas across 10 sensitive endpoints. | NO |
| **Security Headers & CSP** | ✅ Verified | Residual XSS risk if unescaped HTML rendered. | NO |
| **Login Rate Limiting** | ⚠️ Conditionally Verified | `SEC-FIND-06` (IP counter bypass on locked accounts). | YES (Recommended) |
| **Distributed Store Architecture** | ⚠️ Conditionally Verified | `UPSTASH_REDIS_REST_URL` must be set in Vercel. | YES (Operational) |
| **Database State Preservation** | ✅ Verified | SQLite dev.db (3,637,248 bytes) unmutated. | NO |
| **Static Code Quality** | ✅ Verified | TypeScript (0 errors), ESLint (0 errors). | NO |
| **Production Build** | ✅ Verified | Webpack production compilation succeeded (63 routes). | NO |
| **Upstream Framework Patch Level** | ⚠️ Advisory Documented | `next@16.4.2` requires upgrade to `16.4.5+`. | YES (Upstream) |

---

## 13. Upstream Next.js Advisory Summary

Next.js `16.4.2` is subject to GitHub Security Advisories `GHSA-673q-mjm6-r5xr` (Critical RCE in Cache Components), `GHSA-2464-fhr4-w9xw` (Critical RCE in Image Optimization via SVG), and `GHSA-p3m5-59mp-jv5r` (High DoS in Server Actions).

A dedicated assessment report has been authored at:  
[DAY18-NEXTJS-SECURITY-ADVISORY-REVIEW.md](file:///c:/Users/Madugu%20Shiva%20Kumar/OneDrive/图片/Desktop/horizon-portal/docs/phase-4/day-18/DAY18-NEXTJS-SECURITY-ADVISORY-REVIEW.md)

**Mandatory Upgrade Recommendation:** Perform `npm install next@16.4.5` in an isolated Git worktree or branch as an approved operational step prior to public deployment.

---

## 14. Database and Git Integrity Certification

Throughout Stage G execution:
- **No Git commits, pushes, or branch mutations were executed.**
- **No Git reset, clean, stash, or file restorations were performed.**
- **Pre-existing tracked modifications and untracked files were preserved.**
- **The SQLite database (`prisma/dev.db`) remains exactly 3,637,248 bytes.**
- **Neon PostgreSQL was not connected to or modified.**

---

## 15. Final Verdict & Sign-Off

### Audit Verdict: **CONDITIONAL PASS — Remediation Required**

### Rationale:
1. **Application Logic Security:** Horizon Portal's custom application code satisfies all critical security requirements established for Day 18. The demo backdoor is eliminated, authorization boundaries are enforced, inputs are bounded by Zod, CSP protects client navigation, and dual-dimension rate limiting mitigates automated attacks.
2. **Release Prerequisites:** Two specific operational prerequisites must be executed before final public traffic cutover:
   - **Prerequisite 1:** Resolve `SEC-FIND-06` by ensuring blocked login requests increment the IP counter before returning HTTP 429.
   - **Prerequisite 2:** Upgrade `next` from `16.4.2` to `16.4.5+` in a dedicated branch to patch upstream GHSA vulnerabilities.
   - **Prerequisite 3:** Configure `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` in the production Vercel project environment variables.

Execution has halted in compliance with Stage G stop conditions.
