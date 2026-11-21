# DAY 20 — STEP 8A: WORKTREE DEPENDENCY MATRIX
## Committed Baseline vs. Working Tree Modifications & Final Challenge Prerequisites

**Project:** Horizon Portal  
**Workspace:** `C:\Users\Madugu Shiva Kumar\OneDrive\图片\Desktop\horizon-portal`  
**Committed Baseline HEAD:** `05523215e92ebe58e7829253ea897822cfe205b8`  
**Date:** 2026-11-20  
**Phase:** Day 20 — Step 8A (Prerequisite Recovery)  
**Role:** Principal Software Architect & QA Automation Architect  

---

## 1. Overview & Objective

The Final Challenge requires building a Unified Multi-Domain Approval Center. Prior to implementing this capability on the isolated `day20-final-challenge` branch, an exhaustive dependency analysis between the committed baseline commit (`0552321`) and the current working-tree modifications (54 modified tracked files + critical untracked test fixtures and schemas) was conducted.

This matrix identifies:
1. Which working-tree modifications represent required application foundations vs. transient test scripts or historical documentation.
2. The exact dependencies needed for Phase Step 8B implementation (Authentication, AppShell, Prisma Client, Zod validations, Approval queues).
3. The strict exclusion boundary to prevent leaking sensitive files, environment secrets, or unreviewed databases.

---

## 2. Working Tree Dependency Classification Matrix

The 54 modified tracked files and critical untracked files are classified into functional categories:

| File Path | Status | Classification | Requisite for Final Challenge | Justification & Architectural Role |
|---|:---:|---|:---:|---|
| `src/components/layout/AppShell.tsx` | Modified | Required Application Foundation | **YES** | Top-level application shell providing global navigation, user profile context, and sidebar links. |
| `src/lib/prisma.ts` | Modified | Required Application Foundation | **YES** | Prisma client singleton instance with runtime connection pooling and development logging guards. |
| `src/lib/validations/leave.ts` | Modified | Required Application Foundation | **YES** | Zod schemas for leave application, leave approval, and query filtering. |
| `src/lib/validations/index.ts` | Modified | Required Application Foundation | **YES** | Root validation exports re-exporting leave, payroll, and finance validation schemas. |
| `src/lib/validations/finance.ts` | Untracked | Required Application Foundation | **YES** | Validation schemas for expense pagination, filters, categories, and financial data structures. |
| `src/app/api/v1/approvals/leave/route.ts` | Modified | Required Application Foundation | **YES** | Manager approval queue endpoint: filters leave requests by supervisory reporting hierarchy. |
| `src/app/api/v1/approvals/leave/[id]/route.ts` | Modified | Required Application Foundation | **YES** | Atomic approve/reject action handler with balance verification and audit recording. |
| `src/app/api/v1/admin/finance/expenses/route.ts`| Modified | Required Application Foundation | **YES** | Finance operational expense listing, filtering, and pagination API. |
| `src/app/api/v1/admin/finance/invoices/route.ts`| Modified | Required Application Foundation | **YES** | Finance accounts payable / accounts receivable invoice retrieval API. |
| `src/app/api/v1/payroll/runs/[runId]/approve/route.ts` | Modified | Required Application Foundation | **YES** | Executive payroll run approval action endpoint. |
| `src/components/approvals/LeaveApprovalQueue.tsx` | Modified | Required Application Foundation | **YES** | Existing UI component for leave approval listing, search, status badge rendering, and modal actions. |
| `src/components/finance/ExpenseTable.tsx` | Modified | Required Application Foundation | **YES** | Enterprise data table rendering expenses with status indicators (`PAID`, `UNPAID`). |
| `src/components/finance/InvoiceTable.tsx` | Modified | Required Application Foundation | **YES** | Enterprise invoice management table. |
| `src/components/payroll/AdminPayrollConsole.tsx` | Modified | Required Application Foundation | **YES** | Payroll management and approval UI. |
| `src/app/approvals/page.tsx` | Modified | Day 19 Frontend Work | **YES** | The existing Approvals view to be unified into the Multi-Domain Approval Center. |
| `src/app/globals.css` | Modified | Day 19 Frontend Work | **YES** | Base Tailwind styling, design tokens, responsive breakpoints, and accessibility contrast tokens. |
| `src/app/layout.tsx` | Modified | Day 19 Frontend Work | **YES** | Root Next.js layout providing fonts, theme providers, and Toast notifications. |
| `src/app/login/page.tsx` | Modified | Day 19 Frontend Work | **YES** | Responsive login view with demo-user quick-switch buttons. |
| `src/app/payroll/page.tsx` | Modified | Day 19 Frontend Work | **YES** | Payroll management dashboard view. |
| `src/app/team/attendance/page.tsx` | Modified | Day 19 Frontend Work | **YES** | Manager team attendance and leave tracking view. |
| `package.json` & `package-lock.json` | Modified | Required Infrastructure | **YES** | Defines `@playwright/test` and runtime dependencies. |
| `playwright.config.ts` | Untracked | Required Test Infrastructure | **YES** | Dual-mode Playwright test configuration with production guardrails. |
| `tests/e2e/**/*.ts` | Untracked | Required Test Infrastructure | **YES** | Day 20 E2E test suites (12 tests) and fixtures (`auth.fixture.ts`, `test-data.fixture.ts`). |
| `src/lib/security/rate-limit/config.ts` | Modified | Day 18 Security Work | **NO (Optional)** | Rate limiting configuration for API endpoints. |
| `scripts/test-day18-*.ts` | Modified | Day 18 Security Work | **NO** | Day 18 security verification and attack simulation scripts. |
| `scripts/test-reporting-hierarchy.ts` | Modified | Day 18 Security Work | **NO** | Reporting chain test script. |
| `scripts/test-search-performance.ts` | Modified | Day 18 Security Work | **NO** | Search indexing benchmark script. |
| `docs/phase-4/day-18/*` | Modified/Untracked | Documentation | **NO** | Historical Day 18 security audit reports. |
| `docs/phase-5/day-20/*` | Untracked | Documentation | **NO** | Day 20 test architecture, release checklists, demo script, and audit ledgers. |
| `prisma/dev.db` | Existing Local DB | Sensitive / Data | **NO (Transfer Guarded)**| Local SQLite database. Must NOT be copied blindly to prevent test artifact pollution. |
| `.env` / `.env.local` | Existing Config | Sensitive Configuration | **STRICT NO** | Contains local environment secrets. Never transferred across boundaries. |

---

## 3. Controlled Dependency Transfer Rules for Step 8B

When provisioning dependencies from the working tree to the isolated `day20-final-challenge` branch:

1. **Selective Synchronization:** Only transfer verified application foundations, test infrastructure, and core component files.
2. **Zero Secret Leakage:** `.env`, `.env.local`, `.env.production`, bearer tokens, and session cookies are strictly excluded.
3. **Database Isolation:** `prisma/dev.db` is NOT transferred. The independent repository will maintain its own clean SQLite instance seeded deterministically using standard fixtures.
4. **Git Verification:** File hashes and diffs must be validated post-transfer to ensure no regressions or unexpected alterations.
5. **Preservation of Original Tree:** No files in `C:\Users\Madugu Shiva Kumar\OneDrive\图片\Desktop\horizon-portal` shall be moved, deleted, renamed, or modified during or after the transfer process.
