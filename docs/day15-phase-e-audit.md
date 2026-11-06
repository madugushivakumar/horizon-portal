# Day 15 — Phase E: Navigation Integration, RBAC and Security Pre-Implementation Audit
## AI Insights Panel for HR Advanced — Aura Workforce by Growmar (Horizon Portal)

**Document Version:** 1.0.0
**Date:** 2026-11-06
**Status:** Audit Complete — Ready for Review & Implementation
**Auditor:** Senior Full-Stack Engineer, Software Architect, Security Engineer, UI/UX Engineer

---

## 1. Executive Summary & Objective

Phase D implemented the complete, production-quality frontend dashboard at route `/hr-insights`.
The objective of **Phase E** is to integrate `/hr-insights` into the application's central navigation and breadcrumb system with strict Role-Based Access Control (RBAC):

| Role | Navigation Visibility | Server Route Guard | API Access |
|---|---|---|---|
| **ADMIN** | **Visible** | Allowed (HTTP 200) | Allowed (HTTP 200) |
| **HR** | **Visible** | Allowed (HTTP 200) | Allowed (HTTP 200) |
| **MANAGER** | **Hidden** | Forbidden (HTTP 403) | Forbidden (HTTP 403) |
| **EMPLOYEE** | **Hidden** | Forbidden (HTTP 403) | Forbidden (HTTP 403) |

---

## 2. Existing Navigation Architecture Inspection

### 2.1 Central Navigation Registry (`src/config/navigation.ts`)
- **Structure:**
  - `Role = "Admin" | "HR" | "Manager" | "Employee"`.
  - `NavItem` interface:
    ```typescript
    export interface NavItem {
      id: string;
      title: string;
      href: string;
      icon: string;
      roles: Role[];
      badge?: string;
      description?: string;
    }
    ```
  - `NAVIGATION_REGISTRY`: Canonical array of `NavItem` objects.
  - Role scoping is defined directly on each item via `roles: Role[]`.
- **Role-based Grouping (`getNavigationForRole(userRole)`):**
  - Filters `NAVIGATION_REGISTRY` by `item.roles.includes(role)`.
  - Role-specific section mappings:
    - **Employee:** `"Overview"` + `"Self Service"` (`leave-my`, `payslips-my`)
    - **Manager:** `"Overview"` + `"Management"` (`approvals`, `team-overview`)
    - **HR:** `"Overview"` + `"People Operations"` (`leave-mgmt`, `payroll-ops`, `recruitment`, `admin-employees`)
    - **Admin:** `"Overview"` + `"Workforce & Operations"` (`approvals`, `team-overview`, `leave-mgmt`, `payroll-ops`, `recruitment`, `admin-employees`) + `"Administration"` (`admin-finance`, `admin-users`, `admin-settings`, `admin-audit`)
- **Route Authorization Check (`isRouteAllowedForRole(pathname, userRole)`):**
  - Matches `pathname` against `item.href` in `NAVIGATION_REGISTRY`.
  - If found, returns `item.roles.includes(role)`.
  - Admin routes prefix rule: `pathname.startsWith("/admin")` requires `role === "Admin"`.

### 2.2 Sidebar Component (`src/components/layout/Sidebar.tsx`)
- **Rendering Logic:**
  - Calls `getNavigationForRole(userRole as Role)` to retrieve navigation sections.
  - Renders section headings and navigation links with active state detection (`pathname === item.href`).
  - Supports desktop persistent `w-64` drawer and mobile sliding drawer with focus trapping and ESC key handling.
  - `renderNavIcon(name: string, active: boolean)`: Maps `item.icon` string identifier to clean SVG graphics.
  - Current icons: `scale`, `view-boards`, `dashboard`, `users`, `calendar`, `calendar-days`, `document`, `clipboard-check`, `chart-bar`, `currency-dollar`, `user-plus`, `shield-check`, `cog`.

### 2.3 Breadcrumbs Component (`src/components/layout/Breadcrumbs.tsx`)
- **Generation Logic:**
  - Computes path segments from `usePathname()`.
  - Maps route segments to human-readable titles using dictionary `ROUTE_LABELS: Record<string, string>`.
  - Current entries: `dashboard`, `people`, `employees`, `task-board`, `capacity`, `leave`, `payslips`, `approvals`, `team`, `leave-management`, `payroll`, `recruitment`, `admin`, `users`, `settings`, `audit`, `design`.
  - Omits `href` for the active (last) segment to indicate the current page with `aria-current="page"`.

### 2.4 Server Page Guard (`src/app/hr-insights/page.tsx`)
- **Current Guard:**
  - Calls `getCurrentUser()` from `@/lib/auth/server-session`.
  - Unauthenticated requests: `redirect("/login")`.
  - Role check: `if (role !== "ADMIN" && role !== "HR")` renders an accessible `403 Forbidden` unauthorized view inside `AppShell`.
  - Direct URL access by Manager or Employee is strictly halted at the server level.

### 2.5 API Authorization (`src/lib/hr-insights/auth.ts`)
- **Current RBAC Enforcement:**
  - `verifyHRInsightsAccess(user)`:
    - `ADMIN` & `HR` -> `{ isAuthorized: true }`
    - `MANAGER` & `EMPLOYEE` -> `{ isAuthorized: false, statusCode: 403, errorMessage: "Access restricted. AI Insights require Admin or HR role." }`
  - Injected on both `GET /api/v1/hr-insights` and `GET /api/v1/hr-insights/filters`.
  - Strict `Cache-Control: no-store, no-cache, must-revalidate` (`NO_CACHE_HEADERS`) applied to all responses.

---

## 3. Proposed Minimal Navigation Changes

To integrate `/hr-insights` seamlessly and strictly adhere to existing conventions, only minimal targeted edits are required:

### 3.1 Update `src/config/navigation.ts`
1. **Register `hr-insights` in `NAVIGATION_REGISTRY`:**
   ```typescript
   {
     id: "hr-insights",
     title: "AI Workforce Insights",
     href: "/hr-insights",
     icon: "sparkles",
     roles: ["HR", "Admin"],
     description: "Workforce attrition risk patterns, contributing factors, and payroll anomaly intelligence",
   }
   ```
2. **Include in HR Navigation (`getNavigationForRole`):**
   - Place in the existing `"People Operations"` section alongside `leave-mgmt`, `payroll-ops`, `recruitment`, `admin-employees`.
3. **Include in Admin Navigation (`getNavigationForRole`):**
   - Place in the existing `"Workforce & Operations"` section alongside operational tools.
4. **Manager and Employee Behavior:**
   - Automatically excluded because neither has `"HR"` or `"Admin"` in `item.roles`.
   - `isRouteAllowedForRole("/hr-insights", "Manager")` returns `false`.
   - `isRouteAllowedForRole("/hr-insights", "Employee")` returns `false`.

### 3.2 Update `src/components/layout/Sidebar.tsx`
- Add `"sparkles"` icon handler in `renderNavIcon`:
  ```typescript
  case "sparkles":
    return (
      <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    );
  ```

### 3.3 Update `src/components/layout/Breadcrumbs.tsx`
- Add `"hr-insights"` mapping to `ROUTE_LABELS`:
  ```typescript
  "hr-insights": "AI Workforce Insights",
  ```
  Resulting breadcrumb: `Horizon Portal > AI Workforce Insights`.

---

## 4. Proposed Verification Test Plan

Create `scripts/test-day15-navigation.ts` covering:

1. **Central Registry Verification:**
   - Item `hr-insights` exists with title `"AI Workforce Insights"`.
   - Exact href is `"/hr-insights"`.
   - Permitted roles are strictly `["HR", "Admin"]`.
   - Icon is mapped.
2. **Menu Visibility Matrix:**
   - **Admin:** `"AI Workforce Insights"` present under `"Workforce & Operations"`.
   - **HR:** `"AI Workforce Insights"` present under `"People Operations"`.
   - **Manager:** `"AI Workforce Insights"` strictly absent from all sections.
   - **Employee:** `"AI Workforce Insights"` strictly absent from all sections.
3. **Server Route Authorization (`isRouteAllowedForRole`):**
   - `isRouteAllowedForRole("/hr-insights", "Admin") === true`
   - `isRouteAllowedForRole("/hr-insights", "HR") === true`
   - `isRouteAllowedForRole("/hr-insights", "Manager") === false`
   - `isRouteAllowedForRole("/hr-insights", "Employee") === false`
4. **Breadcrumb Mapping:**
   - `ROUTE_LABELS["hr-insights"] === "AI Workforce Insights"`
5. **Sidebar Icon Rendering:**
   - `"sparkles"` icon defined in `Sidebar.tsx`.
6. **Existing Navigation Regression:**
   - `npm run test:nav` (`scripts/test-day4-navigation.ts`) passes without disruption to existing routes.
7. **Quality Gates:**
   - `npx tsc --noEmit`
   - `npx eslint <modified files>`
   - `npm run test:hr-insights-ui`
   - `npm run test:hr-insights-api`
   - `npm run test:tasks-api`
   - `npm run test:capacity`

---

## 5. Audit Conclusion

The proposed navigation integration follows the existing architecture without modifying any authorization semantics or database models. All 4 application roles have strictly defined behavior, and breadcrumbs integrate seamlessly.

Awaiting confirmation to proceed with the minimal navigation edits and verification.
