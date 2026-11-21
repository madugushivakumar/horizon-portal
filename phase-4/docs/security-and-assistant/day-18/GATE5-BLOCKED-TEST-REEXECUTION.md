# GATE 5 — BLOCKED TEST CASE RE-EXECUTION & PRESERVATION REPORT

**Project:** Horizon Portal  
**Date:** November 19, 2026  
**Auditor:** Principal Software Architect & QA Lead  

---

## 1. Executive Summary

The previous Gate 5 report identified seven test cases involving state-changing operations that were BLOCKED from live execution against the Vercel Preview deployment. This report assesses each case, documents the safety gating, and establishes the required conditions for re-execution.

---

## 2. Seven Blocked Cases Re-Assessment

| Test Case ID | Test Objective | Target Endpoint | Blocker Reason | Re-execution Status | Mandatory Safety Condition |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **G5-BLK-001** | Live leave request approval | `POST /api/v1/approvals/leave/[id]/approve` | Shared Neon DB / Edge SSO interception | **BLOCKED (Preserved)** | Dedicated Neon Preview Branch required |
| **G5-BLK-002** | Live leave request rejection | `POST /api/v1/approvals/leave/[id]/reject` | Shared Neon DB / Edge SSO interception | **BLOCKED (Preserved)** | Dedicated Neon Preview Branch required |
| **G5-BLK-003** | Live delegation creation | `POST /api/v1/approvals/delegations` | Shared Neon DB / Edge SSO interception | **BLOCKED (Preserved)** | Dedicated Neon Preview Branch required |
| **G5-BLK-004** | Live leave request submission | `POST /api/v1/leave/requests` | Shared Neon DB / Edge SSO interception | **BLOCKED (Preserved)** | Dedicated Neon Preview Branch required |
| **G5-BLK-005** | Live task status transition | `PATCH /api/v1/tasks/[id]` | Shared Neon DB / Edge SSO interception | **BLOCKED (Preserved)** | Dedicated Neon Preview Branch required |
| **G5-BLK-006** | Live employee deactivation | `POST /api/v1/admin/employees/[id]/deactivate` | Shared Neon DB / Edge SSO interception | **BLOCKED (Preserved)** | Dedicated Neon Preview Branch required |
| **G5-BLK-007** | Live Redis threshold lockout | `POST /api/v1/auth/login` | Shared Upstash Instance / Egress IP safety | **BLOCKED (Preserved)** | Isolated IP & dedicated rate-limit key required |

---

## 3. Preservation & Safety Enforcement

1. **Deterministic Test Coverage:**
   The underlying authorization and validation logic for every one of these seven operations was verified locally via `scripts/test-day18-idor-attack.ts`, `scripts/test-day18-security.ts`, and `scripts/test-day18-validation.ts`. In every case, unauthorized actions (e.g. employee self-approval, cross-team manager approval, invalid IDs) were rejected with `HTTP 403` or `HTTP 400` with 100% pass rates.
2. **Precautionary Principle:**
   Executing these tests against the live Preview deployment without an isolated database would write to the production Neon PostgreSQL database (`neondb`).
3. **Audit Verdict:**
   In strict compliance with Rules 1, 4, and Hard Stop Conditions 10–11, these seven state-changing cases **MUST REMAIN PRESERVED AS BLOCKED / OUTSTANDING** until a separate Neon branch is provisioned.
