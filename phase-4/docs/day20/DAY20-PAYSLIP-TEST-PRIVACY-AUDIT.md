# DAY 20 — PAYSLIP TEST DATA PRIVACY & ARTIFACT EXPOSURE AUDIT

**Project:** Horizon Portal  
**Workspace:** `C:\Users\Madugu Shiva Kumar\OneDrive\图片\Desktop\horizon-portal`  
**Git Branch:** `day18-preview-validation`  
**Git HEAD:** `05523215e92ebe58e7829253ea897822cfe205b8`  
**Date:** 2026-11-20  
**Phase:** Day 20 — Review Point A2 Resolution

---

## 1. Executive Summary

This audit evaluates the data privacy, confidentiality risks, and artifact exposure potential in Journey 4 (`tests/e2e/payroll/view-payslip.spec.ts`). It reviews the data origin of payslip records inspected during testing, identifies sensitive fields displayed in the UI, and assesses whether automated test artifacts (screenshots, videos, traces, logs) could expose confidential payroll details.

---

## 2. Test Data Origin & Identity Analysis

### 2.1 Target Employee Identity
- **Test Employee ID:** `EMP-0188`
- **Associated Persona:** `employee@growmar.com` (Sasi Shetty / Sophie Chen)
- **Role:** Individual Contributor (Employee)
- **Reporting Manager:** `EMP-0547` (Imran Philip / Marcus Brody)

### 2.2 Payslip Data Provenance
- In `tests/e2e/payroll/view-payslip.spec.ts`, the test invokes `getEmployeePayslip("EMP-0188")`.
- The queried record is `PI-004883` associated with payroll run `PR-2026-04` (April 2026).
- **Synthetic Origin Verification:** The record originates from the local development seed pack (`03_Data_Pack/payslips.json`). It represents synthetic demonstration data generated for the fictional enterprise "Growmar Solutions Private Limited" / "Aura Workforce".
- **Real PII Exposure:** 0% real PII in local SQLite `dev.db`. No actual living individuals' banking, tax, or compensation data is stored or accessed.

---

## 3. Sensitive Fields Displayed & UI Rendering

When navigating to `/payslips/PR-2026-04`, the application renders an itemized payroll statement containing:

1. **Compensation & Financial Numbers:**
   - Basic Salary (e.g. ₹36,870.00)
   - House Rent Allowance (HRA) (e.g. ₹18,435.00)
   - Special & Other Allowances
   - Gross Pay (e.g. ₹1,41,947.96)
   - Provident Fund (PF) & Statutory Deductions (e.g. ₹7,700.00)
   - Net Take-Home Pay (e.g. ₹1,34,247.96)
2. **Identification & Banking Information:**
   - Employee ID (`EMP-0188`)
   - Bank Account Number (Masked in UI as `**** **** 1234`)
   - Permanent Account Number (PAN) (Masked in UI as `ABCDE****F`)
3. **Anti-IDOR Access Control Boundary:**
   - In test case `4.2`, accessing another employee's payslip (`EMP-0547`) is rejected with `HTTP 403 Forbidden`.
   - The UI renders `#forbidden-heading` (`403 Forbidden — Access Denied`).
   - The test explicitly verifies that foreign compensation numbers (`Total Gross Pay`, salary breakdown) are strictly omitted from the DOM.

---

## 4. Test Artifact Exposure Assessment

Playwright is configured with automated debugging artifact capture on test failure:

```typescript
// playwright.config.ts
use: {
  screenshot: "only-on-failure",
  video: "retain-on-failure",
  trace: "retain-on-failure",
}
```

### 4.1 Risk Assessment Across Artifact Types

| Artifact Type | Failure Capture Mechanism | Potential Sensitive Content Exposed | Risk Severity |
|---|---|---|:---:|
| **Screenshots (`.png`)** | Captured immediately on test assertion failure | Visible DOM rendering of payslip statement, employee names, salary figures | **Medium** (Synthetic in Dev; High if Real Data) |
| **Videos (`.webm`)** | Recorded across entire test lifecycle | Full interaction sequence showing navigation and payroll breakdowns | **Medium** (Synthetic in Dev; High if Real Data) |
| **Playwright Traces (`.zip`)** | Captures DOM snapshots, action logs & network payloads | Contains full JSON response payloads of `GET /api/v1/payslips/[id]`, including unmasked backend fields | **High** (If deployed in shared CI) |
| **HTML Reports (`playwright-report/`)** | Bundles screenshots and trace download links | Aggregate test summary linking to captured media | **Medium** |
| **Console / Audit Logs** | Standard server stdout | Emits audit logs: `[AUDIT] VIEW_PAYSLIP_DETAIL by employee@growmar.com -> Outcome: SUCCESS`. Excludes monetary figures. | **Low** |

---

## 5. Privacy Mitigation Strategy & Recommendations

To guarantee that automated testing remains compliant with data protection standards (GDPR, ISO 27001, SOC 2):

1. **Synthetic-Only Policy:**
   Testing must never run against production or staging databases populated with real employee compensation. Only synthetic or anonymized datasets are permitted.
2. **CI Artifact Retention Restrictions:**
   In CI/CD environments (GitHub Actions, Vercel CI), Playwright artifact retention must be limited to a maximum of 7 days and restricted to authorized security/engineering personnel.
3. **Client-Side Data Masking:**
   The application already masks sensitive bank account and PAN details (`src/components/payroll/PayslipDetailView.tsx`). Maintain this masking in all UI views.
4. **Dedicated Test Payroll Run:**
   In future testing milestones, seed an explicit synthetic payroll run (e.g. `PR-TEST-ISOLATED`) with clearly fictitious figures (e.g., Net Pay = ₹10,000.00) dedicated solely to automated test validation.
