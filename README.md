# Horizon Portal

> **Aura Workforce by Growmar** — Phase 1: Foundation (Tasks 1–5: Complete Implementation)

Horizon Portal is the workforce-management platform for **Aura Workforce by Growmar**, built on Next.js 16 (App Router), TypeScript, Tailwind CSS, Prisma ORM, SQLite, and the **Horizon Design System**.

---

## Table of Contents

- [Technologies](#technologies)
- [Prerequisites](#prerequisites)
- [Installation & Quickstart](#installation--quickstart)
- [Environment Configuration](#environment-configuration)
- [Database & Seed System](#database--seed-system)
- [Authentication Architecture](#authentication-architecture)
  - [The Four Demo Users](#the-four-demo-users)
  - [Security Mechanisms: jose & bcryptjs](#security-mechanisms-jose--bcryptjs)
  - [HTTP-Only Session Cookies](#http-only-session-cookies)
  - [Route Protection (Next.js 16 Proxy)](#route-protection-nextjs-16-proxy)
  - [Policy: Deactivated Accounts & Role Changes](#policy-deactivated-accounts--role-changes)
- [API Endpoints Reference](#api-endpoints-reference)
- [Day 4: Role-Aware Application Shell](#day-4-role-aware-application-shell-navigation-by-role)
- [Day 5: My Profile and the People Directory](#day-5-my-profile-and-the-people-directory)
  - [Safe Employee Data Contract & Privacy Protection](#safe-employee-data-contract--privacy-protection)
  - [People Directory & Search Performance](#people-directory--search-performance)
  - [3-Tier Reporting Line Hierarchy](#3-tier-reporting-line-hierarchy)
  - [Avatar Initials & Deterministic Color Tokens](#avatar-initials--deterministic-color-tokens)
  - [Day 5 Verification Suites & Test Results](#day-5-verification-suites--test-results)
- [Phase 1 Summary & Verification Checklist](#phase-1-summary--verification-checklist)
- [Design System Showcase](#design-system-showcase)

---

## Technologies

| Component | Technology | Version | Purpose |
|---|---|---|---|
| **Framework** | Next.js (App Router) | 16.4.2 | Server Components, Route Handlers, Route Proxy |
| **Language** | TypeScript | 5.x (strict) | Complete end-to-end type safety |
| **Styling** | Tailwind CSS & CSS Tokens | 4.x | Design tokens without hard-coded hex colors |
| **Database ORM** | Prisma | 6.19.3 | Type-safe migrations, models, and client |
| **Database** | SQLite (`dev.db`) | 3 | Embedded local relational database |
| **Token Signing** | `jose` | 6.x | Cryptographic JWT signing (HS256) |
| **Password Hashing**| `bcryptjs` | 3.x | Salted password hashing (10 rounds) |
| **UI Library** | React | 19.3.0 | Modern interactive interfaces |

---

## Prerequisites

- **Node.js 20+** (verified with Node 20 / 24)
- **npm 10+**
- Modern web browser (Chrome, Edge, Firefox, Safari)

---

## Installation & Quickstart

```bash
# 1. Clone repository and install dependencies
git clone <repo-url> horizon-portal
cd horizon-portal
npm install

# 2. Configure environment
cp .env.example .env

# 3. Run Prisma database migration
npx prisma migrate dev --name init_horizon_portal

# 4. Seed the database with demo users
npm run db:seed

# 5. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Environment Configuration

Copy `.env.example` to `.env`:

```env
# Database connection for local SQLite
DATABASE_URL="file:./dev.db"

# 32+ byte cryptographic secret for signing authentication tokens
# Generate with: openssl rand -hex 32
AUTH_SECRET="f9b4c7301e828d15a97f26c391206ea0d8324bf9a20764d8529e3415cf98b174"
```

> [!CAUTION]
> Never commit `.env` or expose `AUTH_SECRET` through `NEXT_PUBLIC_` variables.

---

## Database & Complete Data Pack Integration

### Schema & Dataset Overview

The database is managed with Prisma ORM and local SQLite (`prisma/dev.db`). The schema incorporates **23 relational models** providing 100% coverage of the Horizon Data Pack (`03_Data_Pack/`):

1. `departments` (`departments.json`) — Corporate departments (11 records).
2. `roles` (`roles.json`) — Organizational roles and salary bands (58 records).
3. `employees` (`employees.json`) — Full workforce with self-referential reporting hierarchy (441 records).
4. `users` (`demo_users.json`) — Authentication accounts (4 Data Pack demo accounts + 4 legacy test accounts).
5. `payroll_runs` (`payroll_runs.json`) — Corporate payroll cycles and totals (18 records).
6. `payslips` (`payslips.json`) — Detailed employee earnings and deductions (2,469 records).
7. `leave_types` (`leave_types.json`) — Leave categories and allowances (6 records).
8. `leave_balances` (`leave_balances.json`) — Yearly employee leave balances (441 records).
9. `leave_requests` (`leave_requests.json`) — Employee leave submissions and approvals (2,183 records).
10. `holidays` (`holidays.json`) — Corporate holiday calendar (19 records).
11. `attendance_monthly` (`attendance_monthly.json`) — Monthly employee attendance & leave breakdowns (2,469 records).
12. `teams` (`teams.json`) — Project & departmental teams with team leads (16 records).
13. `sprints` (`sprints.json`) — Agile development sprints (38 records).
14. `tasks` (`tasks.json`) — Sprint tasks with assignees and story points (4,844 records).
15. `clients` (`clients.json`) — Enterprise customer directory (28 records).
16. `vendors` (`vendors.json`) — Corporate supplier and vendor directory (30 records).
17. `invoices` (`invoices.json`) — Client billing invoices and line items (743 records).
18. `expenses` (`expenses.json`) — Employee corporate expense claims (501 records).
19. `announcements` (`announcements.json`) — Company-wide announcements (8 records).
20. `hr_faq` (`hr_faq.json`) — HR policy knowledge base (30 records).
21. `chatbot_responses` (`chatbot_responses.json`) — Aura AI conversational intents and responses (33 records).
22. `ai_anomaly_results` (`ai_anomaly_results.json`) — AI-detected workforce anomalies (405 records).
23. `ai_attrition_risk` (`ai_attrition_risk.json`) — Machine-learning attrition risk evaluations (430 records).

**Total Source Records:** 14,226 records across all 23 files  
**Total Database Records:** 15,229 records (including 743 invoice line items and 256 attendance leave breakdown rows)  
**Foreign Key Violations (`PRAGMA foreign_key_check`):** **0**

### Repeatable Seed Script

The seed script (`prisma/seed.ts`) populates the database idempotently from the `03_Data_Pack/` folder:

```bash
npm run db:seed
```

**Idempotency Guarantee:** Clears child tables in reverse dependency order and uses batch insertions and unique upserts. Running the seed script multiple times produces the exact same record counts without creating duplicate rows or orphaned foreign keys.

### Automated Data Pack Verification

Run the comprehensive data verification script to validate all 23 datasets, counts, foreign keys, and reporting hierarchy:

```bash
npx tsx scripts/verify-data-pack.ts
```

Detailed verification report is available at [`reports/data-pack-verification.md`](reports/data-pack-verification.md).

---

## Authentication Architecture

### Demo Users & Credentials

Horizon Portal supports both the **Data Pack Demo Accounts** and the **Day 1–5 Legacy Test Accounts**:

#### 1. Data Pack Demo Users (`demo_users.json`)
Password for all 4 demo users: `Horizon@2026` (bcrypt-hashed with 10 salt rounds)

| Role | Email | Name | Linked Employee ID |
|---|---|---|---|
| **Admin** | `sanjay.kumar@znova-demo.example` | Sanjay Kumar | `EMP-0099` |
| **HR** | `hemant.mathew@znova-demo.example` | Hemant Mathew | `EMP-0011` |
| **Manager** | `imran.philip@znova-demo.example` | Imran Philip | `EMP-0547` |
| **Employee** | `sasi.shetty@znova-demo.example` | Sasi Shetty | `EMP-0188` |

#### 2. Legacy Test Accounts (Preserved for automated tests)

| Role | Email | Password | Linked Employee ID |
|---|---|---|---|
| **Admin** | `admin@growmar.com` | `Admin@Horizon2026!` | `EMP-0099` |
| **HR** | `hr@growmar.com` | `HR@Horizon2026!` | `EMP-0011` |
| **Manager** | `manager@growmar.com` | `Manager@Horizon2026!` | `EMP-0547` |
| **Employee** | `employee@growmar.com` | `Employee@Horizon2026!` | `EMP-0188` |

> [!NOTE]
> On the `/login` page, convenient single-click buttons are provided to instantly populate each demo user's credentials for fast evaluation.

### Security Mechanisms: `jose` & `bcryptjs`

1. **Password Hashing (`bcryptjs`):**
   - Plaintext passwords are never persisted to the database.
   - Salt rounds = `10`.
   - Passwords and password hashes are never included in API responses or logs.
   - Credential validation uses timing-safe bcrypt comparisons.

2. **Signed JWTs (`jose`):**
   - Issued upon successful authentication via `POST /api/v1/auth/login`.
   - Signed using `HS256` with the server-only `AUTH_SECRET`.
   - Contains minimal claims: `sub` (User ID), `email`, `role`, `iat`, and `exp` (8 hours).
   - Tampered tokens or tokens with altered signatures are automatically rejected.

### HTTP-Only Session Cookies

The authentication token is transmitted via an HTTP-only cookie named `horizon_session`:

- `httpOnly: true` — JavaScript running in the browser cannot read or extract the token (XSS protection).
- `sameSite: "lax"` — Protects against Cross-Site Request Forgery (CSRF).
- `secure: true` — Automatically enforced in production environments over HTTPS.
- `path: "/"` — Available across all application routes.
- `maxAge: 28800` — 8 hours expiration aligned with the token lifetime.

### Route Protection (Next.js 16 Proxy)

Next.js 16 deprecates the `middleware.ts` file convention in favor of `src/proxy.ts`. 

- **Unauthenticated Users:** Any request to private pages (e.g. `/employees`) is intercepted and redirected to `/login?from=<pathname>`.
- **Already Authenticated Users:** Visiting `/login` redirects back to the application entry page.
- **Public Routes:** `/login`, `/design`, `/api/v1/auth/login`, `/api/v1/auth/logout`, and static assets remain publicly accessible.
- **Protected APIs:** Return standard JSON `{ error: "Authentication required." }` with HTTP `401` rather than HTML redirects.

### Policy: Deactivated Accounts & Role Changes

> **Assessment Question:** *What should happen when a user is deactivated while holding a valid token?*

**Horizon Portal Implementation Policy:**
1. **Never Trust Stale Token Claims:** Even if a signed token has not yet reached its expiration timestamp, sensitive operations and the `/api/v1/auth/me` endpoint perform a live database lookup.
2. **Immediate Rejection:** If `isActive === false` in the database, the server immediately rejects the request with **HTTP 403 Forbidden** (`This account has been deactivated. Please contact support.`) and clears the session cookie.
3. **Live Role Determination:** If an administrator changes an employee's role in the database from `Employee` to `Manager`, subsequent authorization checks automatically use the updated database role on the very next request.

---

## API Endpoints Reference

### 1. `POST /api/v1/auth/login`
Authenticates user credentials and issues the HTTP-only session cookie.

- **Request Body:**
  ```json
  {
    "email": "admin@growmar.com",
    "password": "Admin@Horizon2026!"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "user": {
      "id": "usr_admin_001",
      "email": "admin@growmar.com",
      "name": "Alexander Wright",
      "role": "Admin",
      "employeeId": "EMP-001"
    }
  }
  ```
- **Error Responses:**
  - `400 Bad Request` — Missing or malformed email/password.
  - `401 Unauthorized` — Generic `"Invalid email or password."` (prevents user enumeration).
  - `403 Forbidden` — Account deactivated.

### 2. `POST /api/v1/auth/logout`
Clears the `horizon_session` cookie.

- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Logged out successfully."
  }
  ```

### 3. `GET /api/v1/auth/me`
Resolves the currently authenticated user from the HTTP-only cookie and verifies live database status.

- **Response (200 OK):**
  ```json
  {
    "success": true,
    "user": {
      "id": "usr_hr_002",
      "email": "hr@growmar.com",
      "name": "Eleanor Vance",
      "role": "HR",
      "employeeId": "EMP-002",
      "isActive": true
    }
  }
  ```
- **Error Response (401 Unauthorized):**
  ```json
  {
    "error": "Authentication required. No session found."
  }
  ```

### 4. `GET /api/v1/employees`
Returns public employee directory records with deterministic sorting.

- **Response (200 OK):**
  ```json
  {
    "data": [
      {
        "id": "EMP-001",
        "firstName": "Alexander",
        "lastName": "Wright",
        "email": "alexander.wright@growmar.com",
        "status": "Active",
        "department": { "id": "DEPT-ADM", "name": "Administration & Executive" },
        "role": { "id": "ROLE-ADM", "name": "System Administrator" }
      }
    ],
    "count": 4
  }
  ```
  *(Confidential fields such as salary and password hashes are strictly excluded.)*

---

## Security Rationale: Why the Browser Must Never Read JSON Data Directly

1. **Data Privacy & Confidentiality:**
   Workforce data packs contain sensitive PII (Personally Identifiable Information), including employee salaries, bank details, home addresses, phone numbers, and compensation history. Exposing raw JSON files to the browser allows any user to download and inspect confidential records of colleagues and executives via browser DevTools.

2. **Server-Side Access Control & Trust:**
   Client-side JavaScript runs in an untrusted environment completely controllable by the user. True role-based access control (RBAC) must occur on the server, where identity, active status, and permissions can be verified against the database before any record is queried or returned.

3. **Data Integrity & Consistency:**
   Static JSON files cannot enforce relational integrity, unique constraints, foreign keys, or concurrent update locking. A database with an ORM provides a single source of truth, automated validation, deterministic querying, and consistent schema migrations across the entire workforce platform.

---

## Verification & Quality Checks

Run the automated test suites:

```bash
# 1. Run Day 3 Authentication & Security Test Suite (39 Assertions)
npm run test:auth

# 2. Run Live HTTP API & Middleware Endpoint Tests
npx tsx scripts/test-endpoints.ts

# 3. TypeScript Compilation Check
npx tsc --noEmit

# 4. ESLint Check
npm run lint

# 5. Production Next.js Build
npm run build
```

---

## Design System Showcase

Visit [http://localhost:3000/design](http://localhost:3000/design) to inspect the Horizon Design System in light and dark modes:
- **Button:** Primary, Secondary, Danger, sizes `sm`/`md`/`lg`, loading spinners, icon slots.
- **Input:** Labeled inputs, helper text, error states, search/password icons.
- **Card:** Composable Header, Title, Description, Content, Footer, and interactive hover elevation.
- **Badge:** Default, Primary, Secondary, Success, Warning, Danger, with optional status dot indicators.
- **Typography & Spacing:** Complete design token scales.

---

## Day 4 — The App Shell & Role-Aware Navigation

### 1. Application Shell Architecture
The Horizon Portal application shell provides a responsive layout container (`AppShell`) across authenticated routes:
- **`Sidebar` (`src/components/layout/Sidebar.tsx`):**
  - **Desktop:** Persistent `w-64` navigation drawer with brand branding and active route indicators.
  - **Mobile:** Accessible slide-over drawer with backdrop overlay, focus-management, and Escape key dismissal.
- **`TopBar` (`src/components/layout/TopBar.tsx`):**
  - Hamburger toggle for mobile screens.
  - Hierarchical breadcrumb navigation trail.
  - Light/Dark theme toggle.
  - Current authenticated user display name, avatar initials, and role badge (`danger` for Admin, `warning` for HR, `primary` for Manager, `secondary` for Employee).
  - Sign Out button invoking `POST /api/v1/auth/logout` with spinner loading feedback.
- **`Breadcrumbs` (`src/components/layout/Breadcrumbs.tsx`):**
  - Renders ancestors as clickable links and marks the current terminal item with `aria-current="page"`.
- **`AppShell` (`src/components/layout/AppShell.tsx`):**
  - Zero-layout-shift hydration using structural skeletons while user identity loads.

---

### 2. Role-to-Menu Navigation Matrix
Navigation items are centrally defined in `src/config/navigation.ts` and filtered strictly by the user's role:

| Menu Item | Path | Permitted Roles | Category |
|---|---|---|---|
| **Dashboard** | `/dashboard` | All (Admin, HR, Manager, Employee) | Overview |
| **Directory** | `/employees` | All (Admin, HR, Manager, Employee) | Overview |
| **My Leave** | `/leave` | Employee | Self Service |
| **My Payslips** | `/payslips` | Employee | Self Service |
| **Team Approvals** | `/approvals` | Manager, Admin | Management / Workforce |
| **Team Performance**| `/team` | Manager, Admin | Management / Workforce |
| **Leave Operations**| `/leave-management` | HR, Admin | People Operations |
| **Payroll Operations**| `/payroll` | HR, Admin | People Operations |
| **Recruitment** | `/recruitment` | HR, Admin | People Operations |
| **User Management** | `/admin/users` | Admin | Administration |
| **System Settings** | `/admin/settings` | Admin | Administration |
| **Audit Logs** | `/admin/audit` | Admin | Administration |

---

### 3. Presentation vs. Authorization: Server-Side RBAC Enforcement
> [!IMPORTANT]
> **Hiding a menu item is not authorization.**
> Client menus only alter visual presentation. Route protection and sensitive server operations enforce role authorization on the server:

1. **Server Proxy Interception (`src/proxy.ts`):**
   - Cryptographically verifies the HTTP-only `horizon_session` JWT cookie using `jose`.
   - Resolves the authenticated user's role from the token payload.
   - Evaluates `isRouteAllowedForRole(pathname, role)`.
   - If an unauthorized role enters a restricted URL directly (e.g., an Employee attempting to load `/admin/users` or `/payroll`):
     - The request is intercepted before rendering.
     - The user is redirected to `/dashboard?error=unauthorized&denied=<pathname>`.
     - An accessible dismissible warning alert is displayed on the dashboard.
   - Unauthorized API requests receive HTTP `403 Forbidden` JSON responses.
2. **Current User Resolution (`src/lib/auth/server-session.ts`):**
   - Server components and layouts obtain the database-backed user identity using `getCurrentUser()` directly from secure cookies without network roundtrips.

---

### 4. Reusable State Components

#### A. `Skeleton` (`src/components/ui/skeleton.tsx`)
- Configurable variants: `"text"`, `"circular"`, `"rectangular"`.
- Token-aware styling with `animate-pulse`.
- Includes `motion-reduce:animate-none` for reduced-motion accessibility.
- Includes `role="status"` and `aria-busy="true"` for screen readers.

#### B. `EmptyState` (`src/components/ui/empty-state.tsx`)
- Standardized empty view displaying title, explanatory description, custom icon, and action button slot.
- Fully responsive and styled for light/dark themes.

#### C. `ErrorState` (`src/components/ui/error-state.tsx`)
- User-friendly error message container.
- Strictly withholds stack traces, database errors, or sensitive server details.
- Provides a functional retry button executing the caller's reload callback.

---

### 5. Custom 404 & Error Boundary Pages
- **`src/app/not-found.tsx`:** Custom 404 page featuring Horizon Portal branding, 404 badge, friendly explanation, and navigation buttons returning the user to `/dashboard` or `/login`.
- **`src/app/error.tsx`:** App Router error boundary component catching runtime exceptions. Displays a friendly error alert, sanitized incident reference digest, and a "Try Again" `reset()` button.

---

### 6. Loading States & The 3-Second Wait Question

> **Question:** *"A page needs 3 seconds to load. What do you show during the wait, and why?"*
>
> **Answer:**
> We display a **structural skeleton layout** matching the anticipated visual hierarchy of the page.
>
> **Why:**
> 1. **Perceived Performance & Cognitive Ease:** A skeleton informs the user immediately that their request was received and work is in progress, reducing perceived wait time.
> 2. **Cumulative Layout Shift (CLS) Prevention:** Pre-allocating the dimensional footprint of cards, avatars, headers, and tables prevents abrupt layout shifts when asynchronous content finishes loading.
> 3. **Accessibility:** Outfitting skeletons with `role="status"` and `aria-busy="true"` informs assistive technologies that content is actively loading, eliminating user uncertainty compared to a blank screen or isolated spinner.

---

### 7. Keyboard Navigation & Accessibility (a11y)
- **Tab Order:** Logical progression across navigation links, buttons, theme toggles, and shortcuts.
- **Drawer Focus Management:** When the mobile menu opens, focus is managed inside the drawer. Pressing `Escape` automatically dismisses the drawer and returns focus to the toggle button.
- **ARIA Semantics:**
  - Active routes indicate current position via `aria-current="page"`.
  - Icon-only buttons contain descriptive `aria-label` tags.
  - Skeletons use `role="status"` and `aria-busy="true"`.
  - Error banners use `role="alert"`.

---

### 8. Day 4 Verification Commands

```bash
# 1. Run Day 4 Role-Aware Navigation Test Suite (107 Assertions)
npx tsx scripts/test-day4-navigation.ts

# 2. Run Live E2E HTTP Verification Suite (20 Assertions)
npx tsx scripts/test-e2e-http.ts

# 3. Run Day 3 Authentication & Security Test Suite (39 Assertions)
npm run test:auth

# 4. Run TypeScript Compilation Check
npx tsc --noEmit

# 5. Run ESLint Code Quality Check
npm run lint

# 6. Production Next.js Build
npm run build
```

---

## Day 5: My Profile and the People Directory

Day 5 implements the **People Directory** and **Employee Profile** modules for Horizon Portal, enabling authenticated users to discover colleagues, inspect safe professional profiles, and navigate organizational reporting lines without exposing private compensation or personal banking information.

---

### Safe Employee Data Contract & Privacy Protection

Privacy is the most critical constraint of Day 5. Under no circumstances may sensitive compensation or credentials leak to the client.

#### 1. Prohibited Fields
The following fields are strictly excluded from all public employee directory and profile APIs:
- `salary` and compensation details
- `bankAccount`, `routingNumber`, or bank payment records
- `password`, `passwordHash`, and credentials
- `authTokens` and session secrets
- Internal identity provider metadata

#### 2. Explicit Prisma Select Clauses
The server never serializes raw Prisma employee models. Both `/api/v1/employees` and `/api/v1/employees/[id]` use explicit Prisma `select` projections:

```typescript
// Explicit Prisma Select — Zero Leakage
select: {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  status: true,
  hireDate: true,
  managerId: true,
  department: {
    select: { id: true, name: true, code: true, description: true }
  },
  role: {
    select: { id: true, name: true, description: true }
  },
  manager: {
    select: { id: true, firstName: true, lastName: true, email: true, role: true }
  }
}
```

#### 3. Strict Safe Data Contract (`src/types/employee.ts`)
```typescript
export interface SafeEmployeeSummary {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phone?: string | null;
  hireDate?: string | null;
  status: string;
  department: SafeDepartment | null;
  role: SafeRole | null;
  managerId?: string | null;
  manager: SafeManager | null;
}

export interface SafeEmployeeProfile extends SafeEmployeeSummary {
  directReports: SafeDirectReport[];
}
```

---

### People Directory & Search Performance

- **Route:** `/people` (aliased at `/employees`)
- **API Endpoint:** `GET /api/v1/employees`
- **Departments Endpoint:** `GET /api/v1/departments`

#### Features:
1. **Server-Side Debounced Search:** Searches across `firstName`, `lastName`, full name (`firstName + lastName`), employee `id`, and work `email` with safe Prisma parameterized filtering (no SQL injection).
2. **Department Filter:** Populated dynamically from SQLite database records with active employee counts.
3. **Responsive Grid & Table Views:** Users can toggle between visual card grid view and dense tabular view.
4. **Deterministic Pagination:** Database-backed `skip` and `take` queries with tie-breaking sorting (`lastName ASC, firstName ASC, id ASC`) and full pagination metadata (`page`, `pageSize`, `total`, `totalPages`).
5. **State Resilience:** Skeletons while loading, zero-state messaging when filters yield no matches, and safe error states with retry buttons.

#### Measured Search Latency Benchmark:
The assessment specifies that **search must find a person in under one second (< 1,000ms)**. Search latency was measured against the full 441-employee local database using high-resolution timers (`performance.now()`):

| Benchmark Case | Description | Measured Latency | Result (< 1,000ms) |
|---|---|---|---|
| Full Name Search | `"Tejas Chowdhury"` | **20.10 ms** | ✓ PASS |
| Partial First Name | `"Tej"` | **27.34 ms** | ✓ PASS |
| Partial Last Name | `"Chowdhury"` | **25.40 ms** | ✓ PASS |
| Exact Employee ID | `"EMP-0188"` | **23.70 ms** | ✓ PASS |
| Mixed-Case Search | `"iMrAn"` | **23.55 ms** | ✓ PASS |
| Whitespace Trim | `"   sasi   "` | **21.46 ms** | ✓ PASS |
| Search + Department | `Engineering` + `Shetty` | **26.55 ms** | ✓ PASS |
| Department Filter | `Human Resources` | **22.75 ms** | ✓ PASS |
| First Page Browse | Page 1, PageSize 12 | **22.60 ms** | ✓ PASS |

- **Average Search Latency:** **23.76 ms** (~42x faster than 1,000ms SLA)
- **Maximum Search Latency:** **27.34 ms** (100% under 1 second)

---

### 3-Tier Reporting Line Hierarchy

- **Component:** `src/components/profile/ReportingLine.tsx`
- **Route:** `/people/[id]` (aliased at `/employees/[id]`)

Displays a clean visual 3-tier hierarchy:
```
[ 1. Manager Above ] (Clickable profile link)
         ↓
[ 2. Selected Employee ] (Prominently highlighted card)
         ↓
[ 3. Direct Reports Below ] (Responsive grid of direct report cards)
```

#### Real Employee Relationships Verified:
Three real employees from the data pack were verified through automated tests (`npm run test:hierarchy`):

1. **Executive without Manager (`EMP-0006` — Tejas Chowdhury):**
   - Role: Executive
   - Manager: `null` (visually indicates "Top-level Executive — No direct manager")
   - Direct Reports: 12 verified direct reports (`EMP-0035`, `EMP-0048`, `EMP-0049`, `EMP-0051`, `EMP-0065`, `EMP-0072`, `EMP-0099`, `EMP-0107`, `EMP-0112`, `EMP-0121`, `EMP-0149`, `EMP-0157`)
2. **Middle Manager (`EMP-0547` — Imran Philip):**
   - Role: Engineering Manager
   - Manager: `EMP-0685` (Siddharth Rao)
   - Direct Reports: 17 verified direct reports (including `EMP-0188`)
3. **Individual Contributor (`EMP-0188` — Sasi Shetty):**
   - Role: Software Engineer
   - Manager: `EMP-0547` (Imran Philip)
   - Direct Reports: `0` (visually indicates "Individual Contributor — No direct reports")

---

### Avatar Initials & Deterministic Color Tokens

- **Component:** `src/components/ui/avatar.tsx`
- Extracts first letter of first name and last name (e.g. `Alexander Wright` → `AW`, `Sophie Chen` → `SC`).
- **Deterministic Color Assignment:** Maps the employee identifier via a stable hash function to approved Horizon design token palettes (`--hz-primary-100`, `--hz-secondary-100`, `--hz-info-100`, `--hz-accent-100`).
- The same employee receives the exact same avatar color across the directory, profile page, and shell navigation without random flicker.

---

### Automated Verification Suites

```bash
# 1. Master Data Pack Verification (100% of 23 datasets, records, and fields)
npx tsx scripts/verify-data-pack.ts

# 2. Database Integrity & Foreign Key Audit (PRAGMA foreign_key_check)
npm run test:db

# 3. Automated Privacy & Sensitive Field Leakage Audit (62 Assertions)
npm run test:privacy

# 4. Reporting Hierarchy & Real Employee Verification (34 Assertions)
npm run test:hierarchy

# 5. Search Performance Benchmark (< 1,000ms SLA, 10 Test Cases)
npm run test:benchmark

# 6. End-to-End HTTP Route Protection & Role-Aware Navigation
npm run test:e2e
npm run test:nav
npm run test:auth

# 7. Run Entire Automated Test Suite
npm test

# 8. Lint Code Quality
npm run lint

# 9. Optimized Production Build
npm run build
```

---

## Phase 1 Summary & Verification Checklist

| Task | Title | Key Deliverable | Automated Test Evidence | Status |
|---|---|---|---|---|
| **Task 1** | Workspace & Design System | Design tokens, button/card/badge components, `/design` showcase | CSS token contract, light/dark mode | **COMPLETE** |
| **Task 2** | Relational Database & Seed | SQLite DB, 23 Prisma models, all 23 datasets seeded, directory API | `npm run db:seed` | **COMPLETE** |
| **Task 3** | Login & Roles | `jose` JWT tokens, `bcryptjs` hashing, 4 demo users + legacy users, secure cookies | `npm run test:auth` (39/39 passed) | **COMPLETE** |
| **Task 4** | App Shell & Navigation | Role-aware sidebar, top bar, breadcrumbs, responsive drawer, 404/error | `npm run test:nav` + `test:e2e` (127/127 passed) | **COMPLETE** |
| **Task 5** | My Profile & Directory | Safe directory, 3-tier reporting line, deterministic avatars, privacy audit | `npm run test:privacy`, `test:hierarchy`, `test:benchmark` (106/106 passed) | **COMPLETE** |
| **Data Pack** | Complete Data Pack Integration | 100% of 23 datasets, 14,226 source records, 0 missing, 0 duplicates, 0 FK errors | `npx tsx scripts/verify-data-pack.ts` (23/23 passed) | **COMPLETE** |

**Total Automated Test Count:** **272+ assertions passed (0 failed)**
**Report Reference:** Full verification details available at [`reports/data-pack-verification.md`](reports/data-pack-verification.md)


