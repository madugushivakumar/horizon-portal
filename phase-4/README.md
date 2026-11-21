# Horizon Portal — Phase 4: Enterprise Release & Governance

> **Aura Workforce by Growmar** — Phase 4 Final Delivery
> **Release Target:** `v1.0.0` (Production Release Candidate)
> **Programme Phase:** `phase-4` (Days 16–20 + Corporate Expense Authorization Final Challenge)
> **Lead Architect:** Madugu Shiva Kumar
> **Engineering Track:** Full Stack Development

---

## 1. Phase 4 Overview

Phase 4 represents the culminating production release milestone for Horizon Portal, extending the platform from operational team self-service into an enterprise-grade, security-hardened, multi-dialect PostgreSQL-ready production candidate.

### Core Milestones Delivered:
1. **Day 16 — HR Assistant Chatbot:**
   - Real-time conversational AI widget (`HRAssistantWidget`, `HRAssistantPanel`) with intent detection, contextual memory, and role-based data isolation.
   - Privacy-preserving small-cell suppression ($< 5$) preventing individual re-identification.
2. **Day 17 — Hosted Cloud PostgreSQL & Production Architecture:**
   - Dual-engine database dialect abstraction (`schema.prisma` for SQLite local dev; `schema.postgresql.prisma` for Neon Serverless PostgreSQL).
   - High-throughput PgBouncer connection pooling, SSL/TLS enforcement, and database migration automation.
3. **Day 18 — Security Hardening, API Defense & Rate Limiting:**
   - Distributed sliding-window rate limiting powered by Upstash Redis and in-memory fail-closed fallback.
   - Standardized HTTP 422 Unprocessable Entity Zod validation contract across all mutation APIs.
   - Strict Content Security Policy (CSP), anti-clickjacking headers, HTTP-only secure cookie enforcement, and IDOR prevention.
4. **Day 19 — Responsive Design, WCAG 2.1 AA Accessibility & Performance:**
   - Fluid responsive mobile layouts (320px–1920px), minimum 44×44px touch targets.
   - Full keyboard accessibility (Tab, Enter, Escape, arrow keys), visible focus rings, ARIA roles, and high-contrast color tokens.
5. **Day 20 — End-to-End Testing, Release Runbooks & Handover:**
   - Playwright E2E browser automation suite covering authentication, leave application, manager approvals, payroll, and tasks.
   - Production handover, rollback runbooks, and v1.0.0 release notes.
6. **Final Challenge — Corporate Expense Authorization & Unified Approvals:**
   - Dedicated `CorporateExpenseAuthorization` and `ExpenseAuthorizer` schema models.
   - Centralized `UnifiedApprovalCenter` handling simultaneous leave requests and corporate expense authorizations with OCC concurrency guards.

---

## 2. Directory Structure

This `phase-4/` directory contains the complete, self-contained Phase 4 application and deliverables:

```text
phase-4/
├── src/                               # Complete application source code (Next.js 16 App Router)
│   ├── app/                           # Routes, API endpoints (v1), layout, pages
│   ├── components/                    # UI components (Assistant, Approvals, Leave, Payroll, etc.)
│   ├── config/                        # Navigation and runtime configurations
│   ├── lib/                           # Core utilities, validations (Zod), auth, security, OCC
│   └── types/                         # TypeScript interfaces and domain types
│
├── prisma/                            # Database schemas, migrations and fixtures
│   ├── schema.prisma                  # SQLite schema (27 models)
│   ├── schema.postgresql.prisma       # PostgreSQL schema (27 models)
│   ├── migrations/                    # SQLite Prisma migrations
│   ├── migrations_postgresql/         # PostgreSQL Prisma migrations
│   ├── seed.ts                        # Local SQLite seed script
│   └── seed.postgresql.ts             # Cloud PostgreSQL seed script
│
├── scripts/                           # Phase 4 verification test runners & report generators
│   ├── test-day16-hr-assistant.ts     # Day 16 Assistant verification
│   ├── test-day18-validation.ts       # Day 18 Zod 422 & security verification
│   ├── test-day18-stage-g-simulation.ts # IDOR attack & security headers verification
│   ├── test-day19-responsive.ts       # Day 19 responsive viewports verification
│   ├── test-day19-accessibility.ts    # Day 19 WCAG a11y & contrast verification
│   ├── test-unified-approvals.ts      # Unified approvals test suite
│   ├── test-concurrency-approvals.ts  # Concurrency stress tests
│   ├── generate-phase4-final-report.js # Phase 4 3-page report generator
│   └── generate-consolidated-report.js # Consolidated 10-page report generator
│
├── tests/                             # Playwright E2E test suites
│   └── e2e/                           # Approvals, auth, leave, payroll, tasks E2E specs
│
├── docs/                              # Engineering documentation
│   ├── day17-production-readiness/    # Day 17 cloud architecture & deployment docs
│   ├── day20/                         # Day 20 architecture discovery, handover & demo script
│   ├── release/                       # Release runbooks, rollback plans, verification matrices
│   └── security-and-assistant/        # Day 16 & Day 18 security checklists & API inventories
│
├── reports/                           # Official reports and visual evidence
│   ├── phase4/                        # 3-page Phase 4 final report PDF
│   ├── consolidated/                  # 10-page consolidated final report PDF
│   ├── day17-evidence/                # Day 17 cloud deployment screenshots
│   └── task-16/                       # Day 16 HR Assistant chat screenshots
│
├── playwright-report/                 # Playwright test execution HTML report
├── FullStack_MaduguShivaKumar_Phase4_Report.pdf # Final Phase 4 audit report
├── DESIGN_NOTE.md                     # Corporate Expense Authorization architectural design
├── RELEASE_NOTES.md                   # Formal v1.0.0 production release notes
├── package.json                       # Dependencies and scripts
├── package-lock.json                  # Deterministic dependency lockfile
├── tsconfig.json                      # TypeScript configuration
├── next.config.ts                     # Next.js build configuration
├── eslint.config.mjs                  # Linting rules
├── prisma.config.ts                   # SQLite Prisma configuration
├── prisma.config.postgresql.ts        # PostgreSQL Prisma configuration
└── playwright.config.ts               # Playwright test configuration
```

---

## 3. Running Phase 4 Independently

### Prerequisites
- Node.js 20.x or later
- npm 10.x or later

### Setup Instructions

1. **Navigate to the Phase 4 directory:**
   ```bash
   cd phase-4
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment:**
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Set `DATABASE_URL="file:./dev.db"` and a secure `AUTH_SECRET`.

4. **Initialize Database:**
   ```bash
   npx prisma generate --schema=prisma/schema.prisma
   npx prisma migrate deploy --schema=prisma/schema.prisma
   npm run db:seed
   ```

5. **Start Development Server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

---

## 4. Verification & Testing

Execute the Phase 4 automated verification suites:

```bash
# Day 16 HR Assistant Verification (37 assertions)
npx tsx scripts/test-day16-hr-assistant.ts

# Day 18 API Security & HTTP 422 Zod Validation
npx tsx scripts/test-day18-validation.ts

# Day 18 IDOR Security & Security Headers Simulation
npx tsx scripts/test-day18-stage-g-simulation.ts

# Day 19 Responsive Viewport Testing (Mobile, Tablet, Desktop)
npx tsx scripts/test-day19-responsive.ts

# Day 19 Accessibility & Keyboard Navigation
npx tsx scripts/test-day19-accessibility.ts

# Final Challenge: Unified Approval Center Verification
npx tsx scripts/test-unified-approvals.ts

# Final Challenge: Concurrency Stress Test (128 concurrent requests)
npx tsx scripts/test-concurrency-approvals.ts

# Playwright End-to-End Browser Automation
npx playwright test
```

---

## 5. Artifact Verification & Reports

- **Phase 4 Final Report:** [`FullStack_MaduguShivaKumar_Phase4_Report.pdf`](./FullStack_MaduguShivaKumar_Phase4_Report.pdf) *(3 pages, verified)*
- **Consolidated 10-Page Report:** [`reports/consolidated/Horizon_Portal_Consolidated_Project_Report.pdf`](./reports/consolidated/Horizon_Portal_Consolidated_Project_Report.pdf) *(10 pages, verified)*
- **Corporate Expense Authorization Design:** [`DESIGN_NOTE.md`](./DESIGN_NOTE.md)
- **Release Notes:** [`RELEASE_NOTES.md`](./RELEASE_NOTES.md)
