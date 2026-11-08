# Aura Workforce — Phase 2: Operations & Self-Service (Days 6–10)

> **Repository:** [`horizon-portal`](https://github.com/madugushivakumar/horizon-portal)  
> **Phase Scope:** Days 6 to 10 — Leave Self-Service, Payslips, Notifications, Admin Console & Approvals  
> **Student / Lead Architect:** Madugu Shiva Kumar  
> **Release Tag:** `phase-2` (Commit: `ac72469`) / Finalized: `bede48a`  
> **Status:** **COMPLETED** (100% Verified)

---

## 1. Overview & Objectives

Phase 2 expanded Aura Workforce from baseline identity and navigation into operational workforce self-service and management workflows:

- **Day 6: Leave & Attendance Self-Service:** Built `/leave` portal with live balance cards (Casual Leave, Sick Leave, Earned Leave, Maternity, Bereavement), application modal with real-time balance validation, and monthly attendance calendar with holiday markers.
- **Day 7: Secure Payslip Viewer & Download:** Implemented `/payslips` viewer with breakdown of earnings and statutory deductions (PF, Professional Tax, TDS), dynamic PDF export generation, and strict user-isolation route guards (HTTP 403 on foreign payslip access).
- **Day 8: Notifications & Announcements:** Engineered real-time topbar notification bell with unread badge counter, dedicated notification inbox with "mark as read", and organization-wide company broadcast announcements.
- **Day 9: Admin Employee Management Console:** Built `/admin/employees` workforce administration table with multi-column sorting, department filtering, safe reversible deactivation, immutable diff audit logging, and formula-injection-safe CSV export.
- **Day 10: Multi-Tier Approvals Workflow & Team Oversight:** Implemented `/approvals` manager dashboard with pending request review queue, mandatory rejection rationale modal, and team attendance calendar.

---

## 2. Directory Structure

```text
phase-2/
├── src/
│   ├── app/                    # Next.js App Router (pages & API routes)
│   │   ├── leave/              # Leave self-service portal
│   │   ├── payslips/           # Payslip viewer & PDF download
│   │   ├── notifications/      # Notifications inbox
│   │   ├── announcements/      # Company announcements
│   │   ├── admin/employees/    # Admin employee management console
│   │   ├── approvals/          # Manager leave approvals queue
│   │   └── api/v1/             # Phase 2 backend REST API endpoints
│   ├── components/             # Reusable UI component library
│   └── lib/                    # Security helpers, audit logging, Prisma
├── prisma/
│   └── schema.prisma           # Relational schema (23 models)
├── reports/                    # Phase 2 visual evidence screenshots
│   ├── day-6-evidence/         # Leave application & attendance cards
│   ├── day-7-evidence/         # Payslip listing & PDF download
│   ├── day-8-evidence/         # Bell counter & notifications inbox
│   ├── day-9-evidence/         # Admin employee console & audit log
│   └── day-10-evidence/        # Manager approval queue & attendance
├── scripts/                    # Phase 2 automated test suites
├── FullStack_MaduguShivaKumar_Phase2_Report.pdf # Final Phase 2 Report
└── README.md
```

---

## 3. Verification & Automated Test Suites

Phase 2 features were thoroughly verified across 5 dedicated test suites:

| Test Command | Target Subsystem | Assertions | Status |
| :--- | :--- | :---: | :---: |
| `npm run test:leave` | Leave balance checks, overlapping dates, weekend deductions | 45 | **PASS** |
| `npm run test:payslips` | Payslip retrieval, mathematical tie-out, 403 isolation | 38 | **PASS** |
| `npm run test:notifications` | Unread badge counts, mark-as-read state, tenant isolation | 32 | **PASS** |
| `npm run test:employees` | Search, filtering, reversible deactivation, audit logging | 55 | **PASS** |
| `npm run test:approvals` | Manager queue scoping, rejection reasons, team attendance | 48 | **PASS** |

---

## 4. Setup & Execution

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env

# Run Phase 2 tests
npm run test:leave
npm run test:payslips
npm run test:notifications
npm run test:employees
npm run test:approvals
```
