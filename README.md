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
