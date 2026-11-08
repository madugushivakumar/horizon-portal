# Aura Workforce — Phase 1: Foundation (Days 1–5)

> **Repository:** [`horizon-portal`](https://github.com/madugushivakumar/horizon-portal)  
> **Phase Scope:** Days 1 to 5 — Foundation Architecture, Design System, Database, Auth & Directory  
> **Student / Lead Architect:** Madugu Shiva Kumar  
> **Release Tag:** `phase-1` (Commit: `c666991`) / Finalized: `bd27861`  
> **Status:** **COMPLETED** (100% Verified)

---

## 1. Overview & Objectives

Phase 1 established the enterprise foundation for the **Aura Workforce (Horizon Portal by Growmar)** platform. It implemented the initial core infrastructure required for secure, role-aware workforce operations:

- **Day 1: Horizon Design System & CSS Token Engine:** Mapped tokens from `design_tokens.json` to Tailwind CSS semantic variables without hard-coded color values. Created core component library (`Button`, `Input`, `Card`, `Badge`, `Modal`, `Tabs`, `Select`).
- **Day 2: Database Schema & Relational Modeling:** Built initial Prisma schema (`prisma/schema.prisma`) defining models for `User`, `Employee`, `Department`, `Role`, `Attendance`, `Leave`, `Payslip`, and `Announcement`.
- **Day 3: Authentication & Role-Based Access Control:** Implemented stateless JWT session handling using `jose` (HS256) and `bcryptjs` password hashing (10 rounds). Pre-configured 4 demo user roles (Admin, HR, Manager, Employee).
- **Day 4: Role-Aware Application Shell & Navigation:** Built responsive navigation sidebar, dynamic breadcrumbs, and route guards enforcing role permissions across client and server.
- **Day 5: Employee Profile & People Directory:** Implemented `/profile` and `/directory` with multi-field search, department filtering, 3-tier reporting hierarchy visualization, and PII privacy protection.

---

## 2. Directory Structure

```text
phase-1/
├── src/
│   ├── app/                    # Next.js App Router (pages & API routes)
│   │   ├── (auth)/login/       # Authentication page
│   │   ├── directory/          # People directory & employee profiles
│   │   ├── api/v1/auth/        # Login, logout, session verification
│   │   └── api/v1/employees/   # Employee query & profile APIs
│   ├── components/             # Reusable UI component library
│   │   ├── layout/AppShell.tsx # Role-aware application shell
│   │   └── ui/                 # Design token compliant primitives
│   └── lib/                    # Auth tokens, Prisma client, utilities
├── prisma/
│   └── schema.prisma           # Relational schema (23 models)
├── scripts/                    # Phase 1 test and verification scripts
├── design_tokens.json          # Master design tokens
├── demo_users.json             # Seed user accounts
├── FullStack_MaduguShivaKumar_Phase1_Report.pdf # Final Phase 1 Report
└── README.md
```

---

## 3. Verification & Automated Test Suites

Phase 1 was verified across 7 automated test suites:

| Test Command | Target Subsystem | Assertions | Status |
| :--- | :--- | :---: | :---: |
| `npm run test:db` | Prisma models, foreign keys, table counts | 23 Models | **PASS** |
| `npm run test:auth` | JWT issuance, password hashing, 4 demo roles | 4 Roles | **PASS** |
| `npm run test:nav` | Role-aware navigation links & access guards | Full Matrix | **PASS** |
| `npm run test:e2e` | End-to-end login, route transitions, logout | Multi-scenario | **PASS** |
| `npm run test:privacy` | PII leakage protection on employee payloads | Strict Check | **PASS** |
| `npm run test:hierarchy` | 3-tier manager & direct report traversal | Full Org Tree | **PASS** |
| `npm run test:benchmark` | Search query latency benchmark (< 50ms) | Optimized | **PASS** |

---

## 4. Setup & Execution

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env

# Run tests
npm run test:auth
npm run test:db
npm run test:nav
```
