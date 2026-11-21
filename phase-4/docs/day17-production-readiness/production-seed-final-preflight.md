# Stage E: Production Seed Final Preflight
## Horizon Portal / Aura Workforce by Growmar — Phase 4, Day 17

> **Milestone:** Phase 4 — Day 17 (Task 17)  
> **Stage:** Stage E — Production Seed Final Preflight  
> **Status:** AUDITED & GATED FOR APPROVAL  
> **Target Database:** Neon Serverless PostgreSQL (`DATABASE_URL` via `@prisma/client`)  
> **Seed Script:** `prisma/seed.ts` (1,271 lines)

---

## 1. Authoritative Datasets & Record Inventory (23 Files)

Every file in `03_Data_Pack/` was verified and counted:

| # | Dataset File | Target Model / Table | Item Count | Key Constraints & Relations |
| :-: | :--- | :--- | :-: | :--- |
| 1 | `departments.json` | `departments` | **11** | Independent |
| 2 | `roles.json` | `roles` | **58** | Depends on `departments` |
| 3 | `employees.json` | `employees` | **441** | Depends on `departments`, `roles`, self `manager_id` |
| 4 | `demo_users.json` + 4 Demo Accounts | `users` | **8** | Depends on `employees` |
| 5 | `payroll_runs.json` | `payroll_runs` | **18** | Independent |
| 6 | `payslips.json` | `payslips` | **2,469** | Depends on `employees`, `payroll_runs` |
| 7 | `leave_types.json` | `leave_types` | **6** | Independent |
| 8 | `leave_balances.json` | `leave_balances` | **441** | Depends on `employees`, `leave_types` |
| 9 | `leave_requests.json` | `leave_requests` | **2,183** | Depends on `employees`, `leave_types` |
| 10 | `holidays.json` | `holidays` | **19** | Independent |
| 11 | `attendance_monthly.json` | `attendance_monthly` | **2,469** | Depends on `employees` |
| 12 | `teams.json` | `teams` | **16** | Depends on `departments`, `employees` |
| 13 | `sprints.json` | `sprints` | **38** | Independent |
| 14 | `tasks.json` | `tasks` | **4,844** | Depends on `teams`, `sprints`, `employees` |
| 15 | `clients.json` | `clients` | **28** | Independent |
| 16 | `vendors.json` | `vendors` | **30** | Independent |
| 17 | `invoices.json` | `invoices` | **743** | Depends on `clients` |
| 18 | `expenses.json` | `expenses` | **501** | Depends on `vendors`, `departments`, `employees` |
| 19 | `announcements.json` | `announcements` | **8** | Independent |
| 20 | `hr_faq.json` | `hr_faqs` | **30** | Independent |
| 21 | `chatbot_responses.json` | `chatbot_responses` | **33** | Independent |
| 22 | `ai_anomaly_results.json` | `ai_anomaly_results` | **405** | Independent |
| 23 | `ai_attrition_risk.json` | `ai_attrition_risk` | **430** | Depends on `employees`, `departments` |
| **TOTAL** | **23 Files** | **23 Tables** | **15,229 Records** | **100% Normalized & Integrity-Checked** |

---

## 2. In-Depth Audit of Seed `deleteMany` Operations

Lines 87–97 of `prisma/seed.ts` perform scoped cleanups:
```ts
await prisma.aiAttritionRisk.deleteMany();
await prisma.aiAnomalyResult.deleteMany();
await prisma.expense.deleteMany();
await prisma.invoice.deleteMany();
await prisma.task.deleteMany();
await prisma.attendanceMonthly.deleteMany();
await prisma.leaveRequest.deleteMany();
await prisma.leaveBalance.deleteMany();
await prisma.payslip.deleteMany();
await prisma.sprint.deleteMany();
await prisma.team.deleteMany();
```

### Safety Assessment:
1. **Target Tables:** These tables are child/leaf tables containing high-volume transactional or analytical records.
2. **Parent Protection:** Parent tables (`departments`, `roles`, `employees`, `users`, `payroll_runs`, `leave_types`, `clients`, `vendors`) are **never deleted**. They are inserted via `upsert`.
3. **Idempotency Guarantee:** If the seed script is interrupted or re-run, clearing child tables prevents duplicate key collisions (`unique constraint failed`) on payslips, leave balances, or attendance records.
4. **Clean Production Run:** On a newly migrated, empty database, these tables are completely empty, making the operations zero-impact no-ops.

---

## 3. Demo Account Security & Integrity

- **Demo User Emails:**
  - `admin@growmar.com` (Role: Admin, Linked Emp: `EMP-0099`)
  - `hr@growmar.com` (Role: HR, Linked Emp: `EMP-0011`)
  - `manager@growmar.com` (Role: Manager, Linked Emp: `EMP-0105`)
  - `employee@growmar.com` (Role: Employee, Linked Emp: `EMP-0188`)
- **Password Protection:** Encrypted with `bcrypt.hash(..., 10)`. No plaintext passwords are saved to the database.

---

## 4. Seed Execution Approval Gate (Gate 2)

| Parameter | Specification |
| :--- | :--- |
| **Command** | `npm run db:seed:pg` |
| **Underlying Command** | `tsx prisma/seed.ts` |
| **Target Database** | Neon Serverless PostgreSQL (`DATABASE_URL`, Port 6543) |
| **Expected Duration** | ~35–50 seconds for 15,229 records |
| **Expected Outcome** | Exit code 0, 15,229 records verified across all 23 tables |
| **SQLite Preservation** | `prisma/dev.db` untouched |
