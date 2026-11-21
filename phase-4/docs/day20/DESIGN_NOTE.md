# HORIZON PORTAL — TECHNICAL DESIGN NOTE (v1.0.0)

**Document:** System Architecture & Technical Design Note  
**Project:** Horizon Portal (Aura Workforce by Growmar)  
**Repository:** `https://github.com/madugushivakumar/horizon-portal`  
**Target Version:** `v1.0.0`  
**Last Reviewed:** November 20, 2026  
**Status:** Approved Architectural Baseline  

---

## 1. Product Overview

Horizon Portal is an enterprise Human Resources Management and Workforce Operations platform designed for mid-to-large distributed organizations. It consolidates fragmented operational workflows into a unified, role-governed web portal serving four user tiers: Individual Contributors (Employees), People Managers, HR Specialists, and System Administrators.

The platform resolves critical enterprise friction points:
- **Employee Self-Service:** Personal leave requests, real-time balance tracking, and itemized payslip downloads.
- **Supervisory Governance:** Multi-department leave approval queues with atomic balance locking.
- **Payroll & Financial Reconciliation:** Six-month historical payroll runs, variance reconciliation, invoices, and expense claims.
- **Agile Task Execution:** Kanban task boards with drag-and-drop state transitions.
- **Conversational HR Assistance:** Context-aware internal policy support.

---

## 2. Layout & Responsive Design Decisions

The application interface utilizes a responsive AppShell layout ([AppShell.tsx](file:///c:/Users/Madugu%20Shiva%20Kumar/OneDrive/图片/Desktop/horizon-portal/src/components/layout/AppShell.tsx)):
- **Dual-Mode Navigation:** A persistent $256\text{px}$ sidebar on desktop ($\ge 1024\text{px}$) with semantic active-state indicators, collapsing into an accessible slide-over drawer with focus trapping on mobile and tablet viewports ($< 1024\text{px}$).
- **Accessibility & Skip Navigation:** Features a top-level skip link (`#main-content`) allowing keyboard and screen-reader users to bypass repetitive navigation directly to primary page content.
- **Responsive Viewport Density:** Content is containerized in fluid grids (`max-w-7xl mx-auto`) with responsive KPI card arrays (`grid-cols-1 md:grid-cols-2 lg:grid-cols-4`). Dense financial and payroll tables are wrapped in touch-scrolling containers with zero document-level horizontal overflow down to $360\text{px}$ viewports.
- **Modals & Drawers:** High-density forms (e.g. Employee editing, task details) render in right-anchored sliding drawers (`EmployeeDrawer.tsx`) rather than centered popups, preserving background context.

---

## 3. Reusable Component Architecture

| Component Module | File Path | Primary Responsibility & Design Pattern | Accessibility (WCAG 2.2 AA) |
|---|---|---|---|
| **AppShell** | `src/components/layout/AppShell.tsx` | Global layout frame, header, navigation gating, session status | `#main-content` skip link, `aria-expanded` drawer |
| **LeaveApprovalQueue** | `src/components/approvals/LeaveApprovalQueue.tsx` | Tabbed approval management (`Pending Review` vs `History`) | Accessible buttons, semantic status badges, keyboard dialogs |
| **AttendanceSummaryCard**| `src/components/leave/AttendanceSummaryCard.tsx` | Circular attendance metrics, KPI progress indicators | High-contrast text ($\ge 4.5:1$), semantic SVG aria attributes |
| **TaskBoard** | `src/components/task-board/TaskBoard.tsx` | Kanban board with column swimlanes and drag-and-drop cards | Pointer & keyboard drag handles, status live announcements |
| **EmployeeDrawer** | `src/components/admin/employees/EmployeeDrawer.tsx`| Slide-over form for employee creation, editing, and audits | Trapped keyboard tab order, `Escape` key close, focus restore |
| **PayslipDetailView** | `src/components/payroll/PayslipDetailView.tsx` | Itemized earnings/deductions breakdown and PDF view | Data masking (`**** 1234`), high-contrast tabular styling |

---

## 4. Application Architecture & Data Flow

```
[Browser Client]
   │
   ├─► Next.js App Router (16.4.6 / React 19.3.0)
   │     ├─ Server Components (Static Shell, Initial Metadata)
   │     └─ Client Components ("use client" for DND, Forms, Drawers)
   │
   ├─► HTTP-Only Session Cookie (`horizon_session`)
   │
[API Route Handlers (/api/v1/*)]
   │
   ├─► Jose JWT Verification & RBAC Authorization Gates
   ├─► Zod Input Validation (HTTP 422 on schema violation)
   ├─► Sliding-Window Rate Limiter (Upstash Redis / In-Memory Fallback)
   │
[Prisma ORM (6.19.3)] ── Multi-Environment Routing
   │
   ├─► Local Dev Mode: SQLite (`dev.db`)
   └─► Cloud Preview Mode: Neon PostgreSQL (Dual-role: migrator / app)
```

1. **Authentication:** Stateless compact JWTs signed via `jose`, stored in Secure, HTTP-only, SameSite cookies (`horizon_session`).
2. **Defense-in-Depth Authorization:** Role checks are enforced at three layers: (1) UI link hiding, (2) Route gate client redirection, and (3) Handler-level server validation returning `HTTP 403 Forbidden`.
3. **Anti-IDOR Protection:** Cross-employee access to sensitive endpoints (e.g. `/api/v1/payslips/[id]`) verifies resource ownership against `session.employeeId`. Unauthorized tenant requests trigger security audit logs and render dedicated 403 error boundaries.
4. **Input Sanitization:** All mutations pass through strict Zod schemas (`src/lib/validations/`) returning RFC-7807 compliant error bodies.

---

## 5. Key Architectural Decisions & Engineering Trade-offs

### Decision 1: Handler-Level Server Authorization vs Edge Middleware Exclusively
- **Problem:** Edge middleware cannot inspect incoming JSON request bodies or execute rich database queries without substantial latency and runtime bundle bloat.
- **Solution:** Enforce baseline route gating in middleware, but execute authoritative resource ownership and fine-grained RBAC checks inside individual route handlers ([src/app/api/v1/](file:///c:/Users/Madugu%20Shiva%20Kumar/OneDrive/图片/Desktop/horizon-portal/src/app/api/v1/)).
- **Trade-off:** Requires boilerplate authorization calls across API routes, but prevents IDOR vulnerabilities and maintains predictable execution boundaries.

### Decision 2: Dual-Engine Database Architecture (SQLite Local / Neon PostgreSQL Cloud)
- **Problem:** Developers need instantaneous, zero-configuration local onboarding without remote cloud dependencies, while cloud environments require robust multi-user PostgreSQL.
- **Solution:** Maintained parallel Prisma schemas (`schema.prisma` and `schema.postgresql.prisma`) orchestrated via runtime client routing in [src/lib/prisma.ts](file:///c:/Users/Madugu%20Shiva%20Kumar/OneDrive/图片/Desktop/horizon-portal/src/lib/prisma.ts).
- **Trade-off:** Requires synchronizing schema changes across two definition files, but guarantees frictionless local development and bulletproof production isolation.

### Decision 3: Optimistic UI Updates in Kanban Drag-and-Drop
- **Problem:** Network round-trip delays make Kanban card reordering feel sluggish.
- **Solution:** `@dnd-kit/core` immediately transitions card position in local state while dispatching `PATCH /api/v1/tasks/[id]` asynchronously. On server error, state automatically rolls back to original column.
- **Trade-off:** Increases client-side state complexity, but achieves $60\text{fps}$ responsive user experience.
