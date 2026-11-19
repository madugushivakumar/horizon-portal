# GATE 5 — REPORT EVIDENCE & TEST CLAIM REASSESSMENT

**Project:** Horizon Portal  
**Date:** November 19, 2026  
**Auditor:** Principal Software Architect & QA Automation Lead  

---

## 1. Executive Summary

This assessment independently reassesses the claims in the previous Gate 5 Conditional Pass report against physical artifacts, executable test harnesses, Vercel edge telemetry, and runtime boundaries.

---

## 2. Assertion Audit & Evidence Classification Matrix

| Security Domain | Claimed Assertions | Physical Test Artifact | Execution Status | Evidence Classification |
| :--- | :---: | :--- | :---: | :--- |
| **Demo Session Production Guard** | 17 | `scripts/test-day18-security.ts` | 17 Passed | **Independently Verified** via route mock & production env simulation |
| **Handler-Level Auth (Employees/Depts/Roles)** | 29 | `scripts/test-day18-security.ts` | 29 Passed | **Independently Verified** via handler invocation & token validation |
| **Payslip IDOR Protection** | 8 | `scripts/test-day18-idor-attack.ts` | 8 Passed | **Independently Verified** via cross-employee request simulation |
| **Leave Approval IDOR & Separation of Duties** | 7 | `scripts/test-day18-idor-attack.ts` | 7 Passed | **Independently Verified** via service layer & route handler checks |
| **Privileged Route RBAC** | 7 | `scripts/test-day18-idor-attack.ts` | 7 Passed | **Independently Verified** via role-scoped handler checks |
| **PII / Sensitive Field Stripping** | 6 | `scripts/test-day18-idor-attack.ts` | 6 Passed | **Independently Verified** (salary, bankAccount, panNumber stripped) |
| **Login Rate Limiting & Client IP** | 61 | `scripts/test-day18-login-rate-limit.ts`| 61 Passed | **Independently Verified** (dual-layer limits, HMAC keys, decoupled resets) |
| **HTTP Security Headers & CSP Option C** | 54 | `scripts/test-day18-security-headers.ts`| 54 Passed | **Independently Verified** (Option C CSP, no unsafe-eval in prod, HSTS) |
| **API Input Validation & Type Safety** | 54 | `scripts/test-day18-validation.ts` | 54 Passed | **Independently Verified** (Zod boundaries, type coercion, empty payload rejection) |
| **Tasks Verification & Role Scoping** | 30 | `scripts/test-day18-tasks-verification.ts`| 30 Passed | **Independently Verified** (sprint/team filtering, role access, dev.db size) |
| **Live Stateful Preview Approval Writes** | 7 | N/A (Blocked) | 7 Blocked | **Blocked / Outstanding** (Vercel SSO edge interception & shared DB protection) |

**Totals Reconciled:** 273 executed & passed; 7 blocked; 0 failed.

---

## 3. Critical Architectural Distinctions

1. **Local Route-Handler Tests vs. Live Network Traversal:**
   The 273 passing assertions execute the exact TypeScript source code and compiled Next.js handlers on the identical Git commit (`ab466e84e778cc20f1bb77b4c82e56967436c2c7`). However, they execute inside Node/TSX harnesses rather than traversing public internet edge hops.
2. **Vercel Deployment Protection Interception:**
   External HTTP probes to `https://horizon-portal-git-d-fa3be3-shivakumarmudiraj565-5361s-projects.vercel.app` return `HTTP/1.1 302 Found` to `vercel.com/sso-api` with response body `"Protected by Vercel Authentication"`. This edge proxy prevents unauthenticated automated agents from directly invoking live API routes over the public internet.
3. **Database Sharing Precaution:**
   Because Vercel environment variables assign the single Neon database instance to both Production and Preview scopes, executing state-changing write tests against Preview would violate Production database safety.
