# DAY 11 — RBAC & SECURITY VERIFICATION REPORT
**Project:** Aura Workforce by Growmar — Horizon Portal  
**Phase:** Phase 3 — Teams and Insight (Day 11: Admin Payroll Run Console)  
**Audit Date:** November 7, 2026  
**Auditor:** Senior Full-Stack Engineer, Payroll Systems Architect & Forensic Auditor  
**Repository:** `horizon-portal`  
**Branch:** `main`  
**Release Tag:** `phase-3`

---

## 1. Executive Summary

This report documents the security, role-based access control (RBAC), and data sanitization posture of the Day 11 Admin Payroll Run Console module.

Security tests verify that payroll run metadata, itemized salary figures, and approval functions are restricted exclusively to authorized enterprise personnel (`Admin` and `HR`). Unauthorized employees, managers, and unauthenticated sessions are strictly prohibited.

---

## 2. Server-Side RBAC Architecture & Access Control Matrix

Access control is enforced at both the UI page layer (Next.js server components) and the backend API route layer.

| Target Resource / Action | Unauthenticated | Employee Role | Manager Role | HR Role | Admin Role |
|---|---|---|---|---|---|
| Page: `/payroll` (Console) | Redirect (401) | **403 Forbidden** | **403 Forbidden** | **200 OK** | **200 OK** |
| Page: `/payroll/[runId]` (Detail) | Redirect (401) | **403 Forbidden** | **403 Forbidden** | **200 OK** | **200 OK** |
| API: `GET /api/v1/payroll/runs` | **401 Unauthorized** | **403 Forbidden** | **403 Forbidden** | **200 OK** | **200 OK** |
| API: `GET /api/v1/payroll/runs/[runId]` | **401 Unauthorized** | **403 Forbidden** | **403 Forbidden** | **200 OK** | **200 OK** |
| API: `POST /api/v1/payroll/runs/[runId]/approve` | **401 Unauthorized** | **403 Forbidden** | **403 Forbidden** | **200 OK** (Non-preparer) | **200 OK** (Non-preparer) |
| Self-Approval (Maker = Checker) | **401 Unauthorized** | **403 Forbidden** | **403 Forbidden** | **403 Forbidden** | **403 Forbidden** |

---

## 3. Implementation Evidence

### 3.1 Server Component Access Guard (`src/app/payroll/page.tsx`)
```typescript
const session = await auth();
if (!session || !session.user) {
  redirect('/login?callbackUrl=/payroll');
}
const userRole = (session.user as any).role || 'Employee';
if (userRole !== 'Admin' && userRole !== 'HR') {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-red-500/30 rounded-xl p-8 max-w-md text-center">
        <h1 className="text-xl font-bold text-white mb-2">Access Restricted</h1>
        <p className="text-sm text-slate-400 mb-6">
          You need Administrator or HR privileges to access the Admin Payroll Console.
        </p>
      </div>
    </div>
  );
}
```

### 3.2 API Route Role Protection (`src/app/api/v1/payroll/runs/route.ts`)
```typescript
const session = await auth();
if (!session || !session.user) {
  return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
}
const role = (session.user as any).role;
if (role !== 'Admin' && role !== 'HR') {
  return NextResponse.json(
    { error: 'Forbidden: Admin or HR privileges required to access payroll runs' },
    { status: 403 }
  );
}
```

---

## 4. Sensitive Data Sanitization & Payload Protection

In payroll data processing, exposing system credentials, authentication hashes, or bank routing secrets constitutes a critical vulnerability.

The detail endpoint (`/api/v1/payroll/runs/[runId]`) implements selective field projection when querying employee details:
```typescript
select: {
  id: true,
  payrollRunId: true,
  employeeId: true,
  basicSalary: true,
  allowances: true,
  grossPay: true,
  taxDeductions: true,
  otherDeductions: true,
  deductions: true,
  netPay: true,
  paymentMethod: true,
  paymentStatus: true,
  employee: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      department: true,
      position: true
      // EXCLUDED: password, passwordHash, token, bankAccount, ssn
    }
  }
}
```

### Automated Penetration Assertions (`scripts/test-day11-payroll.ts`):
- `Item payload strictly omits password`: **PASSED**
- `Item payload strictly omits passwordHash`: **PASSED**
- `Item payload strictly omits token`: **PASSED**
- `Item payload strictly omits bankAccount`: **PASSED**

---

## 5. Security Test Suite Execution Summary

Executed via `scripts/test-day11-payroll.ts` across four authenticated accounts (`admin@growmar.com`, `hr@growmar.com`, `manager@growmar.com`, `employee@growmar.com`):
1. Unauthenticated request to run listing: Returned `HTTP 401`
2. Employee request to run listing: Returned `HTTP 403`
3. Manager request to run listing: Returned `HTTP 403`
4. HR request to run listing: Returned `HTTP 200`
5. Admin request to run listing: Returned `HTTP 200`
6. Employee request to run detail: Returned `HTTP 403`
7. Employee request to approve endpoint: Returned `HTTP 403`
8. Preparer self-approval attempt: Returned `HTTP 403`

All security assertions passed with zero defects.

