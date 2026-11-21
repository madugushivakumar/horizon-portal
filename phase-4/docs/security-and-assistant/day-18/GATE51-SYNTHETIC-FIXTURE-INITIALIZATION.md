# GATE 5.1 — SYNTHETIC FIXTURE INITIALIZATION REPORT

**Project:** Horizon Portal  
**Date:** November 19, 2026  
**Auditor:** Principal Database Architect & Security QA Specialist  

---

## 1. Synthetic Test Persona Specifications

| Persona | Identifier | Synthetic Email | Role | Verification Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **Employee A** | `EMP-0188` | `employee@growmar.com` | `Employee` | Own leave submission, own payslip, task views |
| **Employee B** | `EMP-0042` | `employee.b@growmar.com` | `Employee` | Cross-employee IDOR access target |
| **Manager** | `EMP-0021` | `manager@growmar.com` | `Manager` | Direct report approval, self-approval prevention |
| **Admin** | `EMP-0001` | `admin@growmar.com` | `Admin` | Full administrative authorization & audit access |

---

## 2. Test Fixture Safety Invariants

1. **Zero Production Data Cloning:**
   No real employee names, personal emails, salaries, bank accounts, or government identification numbers (PAN) are used in synthetic fixtures.
2. **Deterministic Test Verification:**
   All synthetic relationships (Manager -> Employee A supervision, Team T01 membership, Leave request `lr_emp_001` ownership) are deterministically asserted in the test suites:
   - `scripts/test-day18-idor-attack.ts`
   - `scripts/test-day18-security.ts`
   - `scripts/test-day18-tasks-verification.ts`
3. **Database Write Containment:**
   Live seeding into hosted Neon PostgreSQL was held blocked to avoid populating fixtures into the shared Production database instance before dedicated branch isolation is provisioned.
