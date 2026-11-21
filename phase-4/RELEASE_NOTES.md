# Horizon Portal — Release Notes

All notable changes to the Horizon Portal project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Pending Owner Actions (Pre-Production)
- **Hosted PostgreSQL Migration Execution:** Awaiting owner provisioning of isolated Neon Preview database branch (`preview-day20-final`) to execute `deploy-migrations.ps1`.
- **Remote Hosted Playwright E2E Suite:** Awaiting owner provisioning of Vercel Preview deployment bound to Preview database to run hosted Playwright test suite against live cloud URL.
- **Physical Device Touch QA:** Hands-on hardware touch/keyboard verification on physical Android and iOS devices.
- **Five-Minute Product Demo Recording:** Presenter webcam and screen walkthrough to be recorded by owner per script.

---

## [1.0.0] - 2026-11-20

### Added
- **Final Challenge — Unified Multi-Domain Approval Center:** Unified supervisory console (`/approvals`) consolidating Domain 1 (Leave Requests) and Domain 2 (Corporate Expense Authorizations, `CEA-YYYY-XXXX`) with real-time domain filtering, aggregated pending KPIs, and strict Accounts Payable preservation (all 501 historical expense records untouched).
- **Concurrency & TOCTOU Race Protection:** Implemented atomic database conditional state locking (`status: "PENDING_APPROVAL"`) returning HTTP 409 Conflict on concurrent review collisions; verified through 128/128-assertion stress test suite.
- **Authentication & RBAC:** Multi-tier authentication system supporting Employee, Manager, HR Specialist, and Admin roles using signed Jose JWTs stored in secure, HTTP-only cookies (`horizon_session`).
- **Interactive Executive Dashboard:** Role-tailored metrics, live attendance summary, active task overviews, and quick action shortcuts.
- **Employee Directory & Profile Management:** Searchable employee registry with department filtering, reporting hierarchy views, and focus-trapped slide-over detail drawers (`EmployeeDrawer`).
- **Leave & Attendance Self-Service:** Complete leave application lifecycle supporting 6 leave categories (Casual, Sick, Earned, Maternity, Paternity, Bereavement), automated calendar conflict detection, and real-time quota deduction.
- **Manager Approval Center:** Dedicated supervisory queue for reviewing, approving, and rejecting subordinate leave requests with atomic balance updates and audit trail remarks.
- **Payroll Reconciliation & Historic Runs:** Six-month historical payroll run records (November 2025 – April 2026), reconciliation variance previews, and administrative run approvals.
- **Itemized Payslip Viewer:** Employee portal for inspecting detailed compensation breakdowns (Basic, HRA, Allowances, PF, Tax, Net Pay) with strict anti-IDOR boundary protection.
- **Finance Module (Invoices & Expenses):** Aging analysis cards, vendor invoice tracking, and employee expense claim management.
- **Interactive Kanban Task Board:** Agile sprint task board with `@dnd-kit/core` drag-and-drop card movement across To Do, In Progress, Blocked, and Done columns, with optimistic UI updates and server synchronization.
- **Conversational AI HR Assistant:** Floating assistant widget providing deterministic FAQ matching across 30 company policies and authenticated personal leave/payslip queries with duplicate name isolation.
- **Automated End-to-End Test Suite:** Enterprise Playwright E2E journeys (17 unique test cases across 6 spec files) verifying login flows, leave submission, manager approval, payslip privacy, Kanban card drag-and-drop, and Unified Approvals.

### Changed
- **Responsive UI Architecture:** Audited and optimized layout across 8 viewport breakpoints ($360\text{px}$ to $1920\text{px}$) with zero document-level horizontal overflow at 360px.
- **WCAG 2.2 AA Accessibility:** Standardized accessible color contrast ratios ($\ge 4.5:1$ for normal text, $\ge 3:1$ for large text across 17 color pairs), added `#main-content` keyboard skip navigation, and established visible `:focus-visible` focus rings.
- **Core Web Vitals & Performance:** Optimized bundle sizes, image assets, and dynamic imports, achieving Lighthouse scores $\ge 90$ across all 4 categories (Performance, Accessibility, Best Practices, SEO) on core mobile and desktop routes.
- **Input Validation:** Enforced strict Zod schema validation across all API routes returning standardized HTTP 422 Unprocessable Entity error envelopes.

### Fixed
- **Leave Balance Exhaustion:** Fixed idempotency issue where successive leave approvals depleted employee quotas to zero by implementing baseline balance tracking and restoration in test fixtures.
- **Cross-Tenant IDOR Loopholes:** Hardened `/api/v1/payslips/[id]` and employee profile routes with strict handler-level ownership validation against session credentials.
- **Mobile Navigation Trapping:** Resolved mobile hamburger drawer dismissability by binding `Escape` key listeners and restoring focus to trigger elements.
- **Cumulative Layout Shift (CLS):** Reduced CLS on `/leave` and `/dashboard` to $\le 0.05$ through reserved skeleton containers and explicit image dimensions.

### Security
- **Defense-in-Depth Authorization:** Enforced authorization checks across navigation rendering, client-side route gates, and backend REST route handlers (returning HTTP 403 Forbidden).
- **Session Protection:** Configured secure, HTTP-only, SameSite session cookies (`horizon_session`) preventing script access.
- **Sliding-Window Rate Limiting:** Implemented Upstash Redis rate limiting protecting `/api/v1/auth/login` and sensitive mutation endpoints.
- **Strict Content Security Policy (CSP):** Implemented security headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Strict-Transport-Security).
- **Fail-Closed Database Isolation:** Hardened Prisma client initialization to reject any connection containing Production identifiers (`ep-broad-hall-b3dtqwdp`) or pointing to unauthorized cloud hosts.

### Known Limitations
- **Hosted Preview Deployment:** Local code and E2E suites are fully validated, but hosted Vercel Preview deployment remains pending project owner deployment trigger.
- **Cloud Neon Migration Execution:** Neon preview role provisioning (`horizon_preview_migrator` / `horizon_preview_app`) is authored and staged, but execution against cloud Neon awaits owner network execution.
- **Test Persona Scope:** Local E2E tests currently execute against pre-seeded demo accounts in `dev.db`; dedicated synthetic accounts (`*.test`) are recommended for dedicated CI pipelines.

### Not Included
- Multi-organization tenant switching (single-tenant architecture for Growmar enterprise).
- Biometric WebAuthn authentication (standard password & JWT authentication supported).
- Real-time WebSocket messaging for chat (stateless REST request-response architecture).
- Native iOS / Android mobile application binaries (fully responsive Progressive Web App architecture).

---

## Release Traceability

- **Release Version:** `v1.0.0`
- **Active Development Branch:** `day20-final-challenge`
- **Baseline Commit HEAD:** `05523215e92ebe58e7829253ea897822cfe205b8`
- **Target Release Tag:** `v1.0.0` *(Pending Owner Authorization)*
- **Programme Phase Tag:** `phase-4` *(Pending Owner Authorization)*
- **Local Test Status:** 17 Playwright E2E tests across 6 spec files; 30/30 Unified Approval verification tests; 128/128 concurrent approval assertions; 37/37 HR assistant verification tests; 46/46 security tests; 54/54 validation tests; 54/54 security headers tests; 61/61 rate limit tests; 41/41 final security remediation tests; `tsc --noEmit` clean (0 errors); `git diff --check` clean.
- **Database Status:** SQLite local schema & migrations up to date (9/9 applied); PostgreSQL schema validated (`npx prisma validate`), DDL reviewed, migration execution against hosted Preview pending owner-provisioned disposable database.
