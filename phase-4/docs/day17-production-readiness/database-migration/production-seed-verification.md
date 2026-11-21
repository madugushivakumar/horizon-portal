# Stage 9: Production Seed Audit & Verification Report
## Horizon Portal / Aura Workforce by Growmar — Phase 4, Day 17

> **Milestone:** Phase 4 — Day 17 (Task 17)  
> **Stage:** Stage 9 — Production Seed Audit & Verification  
> **Status:** AUDITED & READY FOR GATED EXECUTION  
> **Target Cloud Host:** Neon Serverless PostgreSQL  
> **Authoritative Source:** `03_Data_Pack/` (23 Datasets)  
> **Database Isolation:** Local SQLite (`dev.db`) Untouched

---

## 1. Executive Summary & Seed Methodology

The Horizon Portal production database population uses the universal TypeScript seed script (`prisma/seed.ts`). This script was independently audited to verify that it meets enterprise production standards:

1. **Strict Idempotency:** The script cleans any temporary/mock records before inserting and uses `upsert` or deterministic key lookups for relational entities, ensuring multiple runs produce identical database states without duplicate records.
2. **Cryptographic Password Security:** All user accounts are hashed using `bcrypt` (10 rounds). Plaintext passwords are never persisted.
3. **Database Independence:** The seed script executes solely via `@prisma/client` standard methods (`upsert`, `deleteMany`, `createMany`). Zero SQLite-specific or proprietary SQL statements exist.
4. **Referential Integrity Ordering:** Inserts are sequenced in topological dependency order:
   - Level 0: Departments, Leave Types, Clients, Vendors, Holidays, Announcements, HR FAQs, Chatbot Responses.
   - Level 1: Roles, Sprints.
   - Level 2: Employees, Teams.
   - Level 3: Users (Auth), Tasks, Invoices, Expenses, Leave Balances.
   - Level 4: Payroll Runs, Leave Requests, Attendance Monthly, AI Attrition Risk, AI Anomaly Results.
   - Level 5: Payslips (linked to both Employees and Payroll Runs).

---

## 2. Inventory of Authoritative Datasets (23 Files)

The source files located in `03_Data_Pack/` were scanned and quantified:

| # | Dataset / Table Name | Source File in `03_Data_Pack/` | Authoritative Target Count | Key Foreign Relations |
| :-: | :--- | :--- | :-: | :--- |
| 1 | `departments` | `departments.json` | **11** | None |
| 2 | `roles` | `roles.json` | **58** | `departments` |
| 3 | `employees` | `employees.json` | **441** | `departments`, `roles`, self-referential `manager_id` |
| 4 | `users` (Auth accounts) | `demo_users.json` + canonical demo | **8** (4 data pack + 4 demo) | `employees` |
| 5 | `payroll_runs` | `payroll_runs.json` | **18** | None |
| 6 | `payslips` | `payslips.json` | **2,469** | `employees`, `payroll_runs` |
| 7 | `leave_types` | `leave_types.json` | **6** | None |
| 8 | `leave_balances` | `leave_balances.json` | **441** | `employees`, `leave_types` |
| 9 | `leave_requests` | `leave_requests.json` | **2,183** | `employees`, `leave_types` |
| 10 | `holidays` | `holidays.json` | **19** | None |
| 11 | `attendance_monthly` | `attendance_monthly.json` | **2,469** | `employees` |
| 12 | `teams` | `teams.json` | **16** | `departments`, `employees` (team lead) |
| 13 | `sprints` | `sprints.json` | **38** | None |
| 14 | `tasks` | `tasks.json` | **4,844** | `teams`, `sprints`, `employees` |
| 15 | `clients` | `clients.json` | **28** | None |
| 16 | `vendors` | `vendors.json` | **30** | None |
| 17 | `invoices` | `invoices.json` | **743** | `clients` |
| 18 | `expenses` | `expenses.json` | **501** | `vendors`, `departments`, `employees` |
| 19 | `announcements` | `announcements.json` | **8** | None |
| 20 | `hr_faqs` | `hr_faq.json` | **30** | None |
| 21 | `chatbot_responses` | `chatbot_responses.json` | **33** | None |
| 22 | `ai_anomaly_results` | `ai_anomaly_results.json` | **405** | None |
| 23 | `ai_attrition_risk` | `ai_attrition_risk.json` | **430** | `employees`, `departments` |
| **TOTAL** | **Enterprise Workforce Data** | **23 Files** | **15,229 Records** | **Fully Normalized & Linked** |

---

## 3. Four Demo Roles Authentication Specifications

The production database will contain the four verified enterprise demo accounts:

| Role | Email Address | Linked Employee ID | Linked Employee Name | Role Authority & Scope |
| :--- | :--- | :---: | :--- | :--- |
| **Admin** | `admin@growmar.com` | `EMP-0099` | Sanjay Kumar | Complete portal administration, finance snapshot, audit logs, employee master management |
| **HR** | `hr@growmar.com` | `EMP-0011` | Hemant Mathew | HR insights, workforce directory, leave approvals, attrition risk analytics |
| **Manager** | `manager@growmar.com` | `EMP-0105` | Marcus Brody | Team oversight, sprint management, leave approvals for direct reports, team attendance |
| **Employee** | `employee@growmar.com` | `EMP-0188` | Priya Sharma | Self-service portal, payslip access, leave balance, leave requests, HR Assistant chat |

*(All passwords are encrypted with bcrypt. Plaintext credentials are never committed or logged).*

---

## 4. Production Seed Execution Approval Gate

| Gate Parameter | Value / Detail |
| :--- | :--- |
| **Execution Command** | `npm run db:seed:pg` (`tsx prisma/seed.ts`) |
| **Target Database** | Neon Serverless PostgreSQL (`DATABASE_URL` via `@prisma/client`) |
| **Datasets to Seed** | All 23 authoritative JSON datasets from `03_Data_Pack/` |
| **Expected Record Count** | Exactly 15,229 records across 23 tables |
| **Operation Type** | **Additive & Idempotent** |
| **Prerequisites** | Stage 8 (PostgreSQL Baseline Migration) successfully applied |
| **Safety Guarantee** | Local SQLite `prisma/dev.db` is never referenced or accessed |
