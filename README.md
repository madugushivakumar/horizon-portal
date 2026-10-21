# Horizon Portal

> **Aura Workforce by Growmar** — Phases 1: Foundation (Day 1, Day 2 & Day 3 Implementation)

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
- [Security Rationale: Browser vs Database](#security-rationale-why-the-browser-must-never-read-json-data-directly)
- [Verification & Quality Checks](#verification--quality-checks)
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

## Database & Seed System

### Schema Overview

The database is managed with Prisma and local SQLite (`dev.db`). The schema incorporates 10 relational models:

1. `users` — Authentication accounts (email, hashed password, role, active status, employee relation).
2. `departments` — Corporate departments (Administration, Human Resources, Engineering).
3. `roles` — Organizational roles (System Administrator, HR Lead, Engineering Manager, etc.).
4. `employees` — Workforce members with self-relation for managers (`manager_id` -> `Employee`).
5. `payroll_runs` — Payroll periods and processing status.
6. `payslips` — Employee salary, gross pay, deductions, and net pay.
7. `leave_types` — Leave categories (Annual, Sick, Parental, etc.).
8. `leave_balances` — Employee balances and allowances per leave type and year.
9. `leave_requests` — Employee leave submissions with start/end dates and review status.
10. `holidays` — Corporate holiday calendar records.

### Repeatable Seed Script

The seed script (`prisma/seed.ts`) reads `demo_users.json` and populates the database idempotently:

```bash
npm run db:seed
```

**Idempotency Guarantee:** Seeding uses `prisma.user.upsert()` and `prisma.employee.upsert()`. Running the seed script multiple times produces the exact same record counts without creating duplicate rows or orphaned foreign keys.

---

## Authentication Architecture

### The Four Demo Users

Four demo accounts are provided for Day 3 testing across the four required application roles:

| Role | Email | Password | Employee ID | Department |
|---|---|---|---|---|
| **Admin** | `admin@growmar.com` | `Admin@Horizon2026!` | `EMP-001` | Administration |
| **HR** | `hr@growmar.com` | `HR@Horizon2026!` | `EMP-002` | Human Resources |
| **Manager** | `manager@growmar.com` | `Manager@Horizon2026!` | `EMP-003` | Engineering |
| **Employee** | `employee@growmar.com` | `Employee@Horizon2026!` | `EMP-004` | Engineering |

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

