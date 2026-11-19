# GATE 5.2.3 — LIVE IDOR ATTACK & PRIVACY REPORT
## HORIZON PORTAL — OBJECT-LEVEL ACCESS CONTROL & FIELD-LEVEL CONFIDENTIALITY AUDIT

---

## 1. IDOR PENETRATION TESTING METHODOLOGY

Insecure Direct Object Reference (IDOR / BOLA - Broken Object Level Authorization) occurs when an application exposes a reference to an internal object (e.g. employee ID, payslip ID, leave request ID) without validating whether the requesting user owns or has legitimate authority over that specific object.

Two distinct employee identities were evaluated:
- **Employee A:** Sasi Shetty (`employee@growmar.com`, ID: `EMP-0188`, User ID: `usr_emp_004`)
- **Employee B:** Admin / Colleague (`admin@growmar.com`, ID: `EMP-0099`, User ID: `usr_admin_001`)

---

## 2. PAYSLIP IDOR ATTACK MATRIX

| Scenario | Actor | Target Resource | Actual Owner | Expected Result | Actual Result | Verdict |
|---|---|---|---|---|---|---|
| **PS-IDOR-01** | Employee A | Own Payslip (`PI-004883`) | Employee A | HTTP 200 OK | HTTP 200 OK | **PASS** |
| **PS-IDOR-02** | Employee A | Employee B Payslip (`PI-004844`) | Employee B | HTTP 403 Forbidden | HTTP 403 Forbidden | **PASS** |
| **PS-IDOR-03** | Employee B | Employee A Payslip (`PI-004883`) | Employee A | HTTP 403 Forbidden | HTTP 403 Forbidden | **PASS** |
| **PS-IDOR-04** | Employee B | Own Payslip (`PI-004844`) | Employee B | HTTP 200 OK | HTTP 200 OK | **PASS** |

### Data Leakage Assessment on Rejected Requests
- On all rejected attempts (PS-IDOR-02, PS-IDOR-03):
  - Response payload: `{"error": "Unauthorized"}`
  - Zero salary figures, deduction breakdowns, net pay, bank account numbers, or tax details were returned.
  - A structured security incident was emitted to server audit logs.

---

## 3. LEAVE REQUEST IDOR ATTACK MATRIX

| Scenario | Actor | Action | Target Resource | Actual Result | Verdict |
|---|---|---|---|---|---|
| **LR-IDOR-01** | Employee A | GET `/api/v1/leave/requests?employeeId=EMP-0099` | Query parameter spoofing ignored; returns own leave history | **PASS** |
| **LR-IDOR-02** | Employee A | POST `/api/v1/approvals/leave/LR-001/approve` | HTTP 403 Forbidden (Non-manager approval denied) | **PASS** |
| **LR-IDOR-03** | Employee A | POST `/api/v1/approvals/leave/LR-001/reject` | HTTP 403 Forbidden (Non-manager rejection denied) | **PASS** |

---

## 4. SENSITIVE FIELD PRIVACY AUDIT

Audited using `scripts/test-privacy-leakage.ts` (62 automated assertions):
- **Target Endpoints:**
  - `GET /api/v1/employees` (Directory listing)
  - `GET /api/v1/employees/[id]` (Detailed profile)
  - Profile nested fields: `manager`, `directReports`
- **Fields Audited:**
  - `salary` -> **UNDEFINED (0 leaks)**
  - `bankAccountNumber` -> **UNDEFINED (0 leaks)**
  - `taxId` / `ssn` -> **UNDEFINED (0 leaks)**
  - `password` / `passwordHash` -> **UNDEFINED (0 leaks)**
- **Audit Result:** 62 / 62 assertions passed. Zero data leakage across individual contributors, middle managers, and executives.
