# PostgreSQL Schema Design & Model Specifications
## Horizon Portal / Aura Workforce by Growmar — Phase 4, Day 17

---

## 1. Datasource Definition (`prisma/schema.postgresql.prisma`)

```prisma
// Horizon Portal Prisma Schema (Production PostgreSQL)
// Aura Workforce by Growmar
// Database: PostgreSQL 16+ (Hosted on Neon Serverless)

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL") // Neon Connection Pooler (PgBouncer, Port 6543)
  directUrl = env("DIRECT_URL")   // Neon Direct Postgres (Port 5432, for migrations)
}
```

---

## 2. Model Translation & Type Mapping

Each of the 27 models maps cleanly to PostgreSQL native relational structures:

| Prisma Type | SQLite Storage | PostgreSQL Native Type | Compatibility Analysis |
| :--- | :--- | :--- | :--- |
| `String` (`@id`) | `TEXT` | `TEXT` | Exact match. Supports CUID and custom IDs (`EMP-0188`, `DEPT-01`). |
| `String` | `TEXT` | `TEXT` | Exact match. |
| `Int` | `INTEGER` | `INTEGER` | 32-bit signed integer. Identical semantics. |
| `BigInt` | `INTEGER` (64-bit) | `BIGINT` | Native 64-bit integer. Exact paise conversion without float drift. |
| `Float` | `REAL` | `DOUBLE PRECISION` | 64-bit IEEE 754 float. Identical precision. |
| `Boolean` | `INTEGER` (`0`/`1`) | `BOOLEAN` (`true`/`false`) | Native boolean type in PostgreSQL. |
| `DateTime` | `NUMERIC`/`TEXT` | `TIMESTAMP(3)` | Millisecond-precision UTC timestamp. |

---

## 3. Referential Actions & Constraints Audit

Across all 27 models, relational constraints and cascading behaviors are preserved exactly:

1. **Self-Referential Manager Hierarchy (`Employee` &rarr; `Employee`):**
   - Field: `managerId String?`
   - Relation: `manager Employee? @relation("EmployeeManager", fields: [managerId], references: [id], onDelete: SetNull)`
   - Behavioral Safety: Deleting an executive or manager sets `manager_id = NULL` for direct reports, avoiding cascading employee deletion.
2. **User to Employee Link (`User` &rarr; `Employee`):**
   - Relation: `employee Employee? @relation(fields: [employeeId], references: [id], onDelete: SetNull)`
3. **Payroll Adjustments to Payroll Run (`PayrollAdjustment` &rarr; `PayrollRun`):**
   - Relation: `payrollRun PayrollRun @relation(fields: [payrollRunId], references: [id], onDelete: Restrict)`
   - Behavioral Safety: Restricts deletion of any historical payroll run that contains active or proposed audit adjustment ledger entries.
4. **Idempotency Keys:**
   - Field: `idempotencyKey String @unique` on `PayrollAdjustment`.
   - Generates a native unique B-tree index in PostgreSQL.

---

## 4. Complete 27-Model Checklist for PostgreSQL

- [x] 1. `User` (Authentication, roles, active status, bcrypt hashes)
- [x] 2. `Department` (11 departments, cost centers)
- [x] 3. `Role` (58 organizational roles, levels, grades)
- [x] 4. `Employee` (441 employee profiles, contact, reporting hierarchy)
- [x] 5. `PayrollRun` (18 historical & active payroll runs, approval status)
- [x] 6. `PayrollAdjustment` (SOX-compliant BigInt paise correction ledger)
- [x] 7. `Payslip` (2,469 itemized payslip records)
- [x] 8. `LeaveType` (6 leave types: CL, SL, EL, ML, PL, BL)
- [x] 9. `LeaveBalance` (441 employee balance quotas)
- [x] 10. `LeaveRequest` (2,183 historical leave records)
- [x] 11. `Holiday` (19 statutory corporate holidays)
- [x] 12. `AttendanceMonthly` (2,469 monthly attendance summaries)
- [x] 13. `Team` (16 operational teams)
- [x] 14. `Sprint` (38 development sprints)
- [x] 15. `Task` (4,844 Kanban tasks with OCC versioning)
- [x] 16. `Client` (28 corporate clients)
- [x] 17. `Vendor` (30 verified vendors)
- [x] 18. `Invoice` (743 accounts receivable invoices)
- [x] 19. `Expense` (501 accounts payable expenses)
- [x] 20. `Announcement` (8 company announcements)
- [x] 21. `HrFaq` (30 authoritative HR policy FAQs)
- [x] 22. `ChatbotResponse` (33 conversational intent templates)
- [x] 23. `AiAnomalyResult` (405 payroll anomaly detection records)
- [x] 24. `AiAttritionRisk` (430 workforce attrition risk records)
- [x] 25. `Notification` (In-app notifications and read statuses)
- [x] 26. `AuditLog` (Immutable administrative audit trail)
- [x] 27. `ManagerDelegation` (Manager absence approval delegations)
