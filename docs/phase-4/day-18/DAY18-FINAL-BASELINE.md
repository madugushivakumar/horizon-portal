# HORIZON PORTAL — PHASE 4, DAY 18
# FINAL REPOSITORY & ENVIRONMENT BASELINE REPORT

**Document ID:** `DAY18-FINAL-BASELINE`  
**Project:** Horizon Portal  
**Repository:** `https://github.com/madugushivakumar/horizon-portal`  
**Production URL:** `https://horizon-portal-sigma.vercel.app`  
**Execution Timestamp:** 2026-11-18T17:53:00+05:30  
**Auditor:** Senior Full-Stack Engineer, Next.js Security Engineer & DevOps Auditor  

---

## 1. Git Baseline

- **Current Git Branch:** `main`
- **Current HEAD Commit:** `c6683d6054a5460fd36afbcc6e419c017894705e`
- **Working Tree State:** 
  - Staged files (`git diff --cached`): **0 files** (clean)
  - Tracked modified files (`git diff --name-only`): **44 files** (Stage C–H security hardening, route handlers, components, headers, proxy)
  - Untracked files (`git ls-files --others --exclude-standard`): **183 files** (all historical documentation, audit artifacts, and test scripts preserved)
  - Total entries in `git status --short`: **227 entries**

### Tracked Modified Files Inventory (44 Files)
1. `.env.example`
2. `next.config.ts`
3. `package.json`
4. `scripts/test-day6-leave.ts`
5. `scripts/test-e2e-http.ts`
6. `scripts/test-privacy-leakage.ts`
7. `scripts/test-reporting-hierarchy.ts`
8. `scripts/test-search-performance.ts`
9. `src/app/admin/audit/page.tsx`
10. `src/app/admin/finance/page.tsx`
11. `src/app/api/v1/admin/audit/route.ts`
12. `src/app/api/v1/approvals/delegations/route.ts`
13. `src/app/api/v1/approvals/leave/[id]/approve/route.ts`
14. `src/app/api/v1/approvals/leave/[id]/reject/route.ts`
15. `src/app/api/v1/approvals/leave/route.ts`
16. `src/app/api/v1/auth/demo-session/route.ts`
17. `src/app/api/v1/auth/login/route.ts`
18. `src/app/api/v1/departments/route.ts`
19. `src/app/api/v1/employees/[id]/route.ts`
20. `src/app/api/v1/employees/route.ts`
21. `src/app/api/v1/leave/calendar/route.ts`
22. `src/app/api/v1/leave/requests/route.ts`
23. `src/app/api/v1/notifications/[id]/read/route.ts`
24. `src/app/api/v1/payroll/runs/route.ts`
25. `src/app/api/v1/payslips/[run_id]/route.ts`
26. `src/app/api/v1/roles/route.ts`
27. `src/app/api/v1/team/attendance/route.ts`
28. `src/components/admin/employees/DeactivateConfirmationModal.tsx`
29. `src/components/admin/employees/EmployeeAuditModal.tsx`
30. `src/components/admin/employees/EmployeeDrawer.tsx`
31. `src/components/admin/employees/EmployeeManagementConsole.tsx`
32. `src/components/approvals/LeaveApprovalQueue.tsx`
33. `src/components/finance/AdminFinanceConsole.tsx`
34. `src/components/finance/ExpenseExportButton.tsx`
35. `src/components/finance/ExpenseRegister.tsx`
36. `src/components/finance/InvoiceExportButton.tsx`
37. `src/components/finance/InvoiceRegister.tsx`
38. `src/components/layout/TopBar.tsx`
39. `src/components/notifications/NotificationsInbox.tsx`
40. `src/components/payroll/AdminPayrollConsole.tsx`
41. `src/components/payroll/PayrollRunDetails.tsx`
42. `src/components/team/TeamAttendanceOverview.tsx`
43. `src/lib/leave/approval-service.ts`
44. `src/proxy.ts`

---

## 2. Dependency Baseline

Direct dependency verification via `npm ls --depth=0`:
- **`next`:** `16.4.2`
- **`react`:** `19.3.0`
- **`react-dom`:** `19.3.0`
- **`prisma`:** `6.19.3`
- **`@prisma/client`:** `6.19.3`

---

## 3. Database Baseline

- **Database File:** `prisma/dev.db` (SQLite development store)
- **File Size:** Exactly **3,637,248 bytes**
- **Last Modified Timestamp:** 18-11-2026 05:08:30 PM
- **Integrity Status:** Strictly preserved (0 bytes delta; zero migrations, seeds, or writes executed)
- **Production Database:** Neon PostgreSQL (`prisma/schema.postgresql.prisma`, router `src/lib/prisma.ts`)

---

## 4. Existing Security Implementation Inventory

1. **Authentication (Stage C):**
   - Handler-level authentication implemented across all non-public endpoints (`getAuthenticatedUserFromToken`).
   - Production demo-session endpoint strictly guarded (`NODE_ENV === "production"` returns 404).
2. **Input Validation (Stage D):**
   - Centralized Zod schemas implemented in `src/lib/validations/`.
   - Unified HTTP 400 Bad Request error contract preserved.
3. **Security Headers & CSP (Stage E):**
   - Option C compatible CSP (`script-src 'self' 'unsafe-inline'`), HSTS, X-Frame-Options (`DENY`), X-Content-Type-Options (`nosniff`), Referrer-Policy, and Permissions-Policy delivered via `src/lib/security/headers.ts`, `next.config.ts`, and `src/proxy.ts`.
4. **Distributed Rate Limiting (Stage F/H):**
   - Dual-dimension login rate limiting (10 IP / 15m, 5 Account / 15m).
   - Upstash Redis REST support with pseudonymous HMAC-SHA256 account keys.
   - Account-lockout IP accumulation bypass resolved (`SEC-FIND-06`).
   - Production silent in-memory fallback disabled (`SEC-FIND-07`).
   - Platform-authoritative `x-vercel-forwarded-for` prioritized (`SEC-FIND-08`).

---

## 5. Known Pending Issues for Final Completion

1. **Next.js Upgrade Integration Decision (Phase B):** Resolution of whether to integrate `next@16.4.5` into the main workspace.
2. **Vercel Production Environment Variables (Phase D):** Verification of `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `AUTH_SECRET`, and `RATE_LIMIT_SECRET` in Vercel.
3. **Production Deployment & Live Verification (Phase H/I):** Execution of Employee IDOR, authentication, rate limiting, and security header tests against `https://horizon-portal-sigma.vercel.app`.

---
*Baseline verified and certified without repository mutations.*
