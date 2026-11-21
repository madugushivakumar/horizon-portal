# GATE 5.2 — SEVEN BLOCKED LIVE PREVIEW TESTS STATUS REGISTER

**Project:** Horizon Portal  
**Branch:** `day18-preview-validation`  
**Date:** November 19, 2026  
**Auditor:** Principal Application Security Engineer & Penetration Tester  

---

## 1. Overview & Test Case Status Summary

In Gate 5 and Gate 5.1, seven live verification tests requiring state-changing operations or authenticated interaction against the deployed Preview environment were classified as **BLOCKED** to protect the shared Production Neon database.

In Gate 5.2, pending the manual provision of a dedicated Neon Preview branch and the update of Vercel Preview environment variables by the repository owner, these seven tests remain conservatively classified as **BLOCKED / PRESERVED FOR ISOLATED EXECUTION**.

---

## 2. Seven Blocked Test Cases Register

| Test Case ID | Test Objective & Verification Scope | Prerequisite Condition | Status in Gate 5.2 | Safety Justification |
| :--- | :--- | :--- | :--- | :--- |
| **G5-BLK-001** | Live Preview Login Auth & Session Token Issue (`POST /api/v1/auth/login`) | Isolated Preview DB with synthetic users | **BLOCKED (PRESERVED)** | Prevents auth failure accumulation on production accounts |
| **G5-BLK-002** | Live Preview Role-Based Access Control (`/admin/finance` RBAC redirection) | Valid synthetic admin/employee sessions | **BLOCKED (PRESERVED)** | Dependent on G5-BLK-001 authenticated sessions |
| **G5-BLK-003** | Live Preview Directory PII Filtering (`/api/v1/employees/[id]` salary exclusion) | Preview DB query against synthetic profile | **BLOCKED (PRESERVED)** | Prevents querying live production employee records |
| **G5-BLK-004** | Live Preview Payslip IDOR Defense (`/api/v1/payslips/[id]` cross-access 403) | 2 synthetic employee payslips in Preview DB | **BLOCKED (PRESERVED)** | Zero risk of probing production payroll data |
| **G5-BLK-005** | Live Preview Leave Approval IDOR (`/api/v1/approvals/leave/[id]/approve`) | Synthetic leave requests in Preview DB | **BLOCKED (PRESERVED)** | Strictly prevents mutating production leave records |
| **G5-BLK-006** | Live Preview Distributed Rate Limiter (`rl:preview:auth` 429 threshold) | Upstash Redis connection + Preview namespace | **BLOCKED (PRESERVED)** | Requires verified Preview deployment without Vercel SSO intercept |
| **G5-BLK-007** | Live Preview Security Headers & CSP (`Content-Security-Policy`, `nosniff`) | Public HTTP access without SSO challenge | **BLOCKED (PRESERVED)** | Public endpoint intercepted by Vercel Authentication |

---

## 3. Execution Readiness Criteria

These seven tests will be executed immediately when:
1. The repository owner creates the dedicated Neon preview branch `horizon-portal-preview-isolated`.
2. Vercel Preview environment variables (`DATABASE_URL`, `DIRECT_URL`) are scoped to the preview branch and redeployed.
3. The baseline migration and synthetic test fixtures are deployed to the preview branch.
4. Preview endpoint connectivity is verified to target the dedicated preview endpoint.
