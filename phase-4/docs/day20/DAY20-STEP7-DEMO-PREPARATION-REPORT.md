# DAY 20 — STEP 7: FIVE-MINUTE PRODUCT DEMO SCRIPT & RECORDING PREPARATION REPORT

**Project:** Horizon Portal  
**Workspace:** `C:\Users\Madugu Shiva Kumar\OneDrive\图片\Desktop\horizon-portal`  
**Git Branch:** `day18-preview-validation`  
**Git HEAD:** `05523215e92ebe58e7829253ea897822cfe205b8`  
**Date:** November 20, 2026  
**Phase Completed:** Day 20 — Step 7 (Demo Script & Recording Preparation)  

---

## 1. Executive Summary

This report establishes the complete preparation, spoken script, technical pre-flight verification, and recording quality gates for the official five-minute product demonstration of Horizon Portal.

- **Demo Script Status:** **COMPLETE** ([DAY20-FIVE-MINUTE-PRODUCT-DEMO-SCRIPT.md](file:///c:/Users/Madugu%20Shiva%20Kumar/OneDrive/图片/Desktop/horizon-portal/docs/day20/DAY20-FIVE-MINUTE-PRODUCT-DEMO-SCRIPT.md))
- **Recording Checklist Status:** **COMPLETE** ([DAY20-DEMO-RECORDING-CHECKLIST.md](file:///c:/Users/Madugu%20Shiva%20Kumar/OneDrive/图片/Desktop/horizon-portal/docs/day20/DAY20-DEMO-RECORDING-CHECKLIST.md))
- **Dry-Run Workflow Verification:** **PASS (100% of demonstrated workflows verified)**
- **Actual Video Recording Status:** **PENDING OPERATOR RECORDING**  
  *(In strict accordance with project safety guidelines, no automated or simulated video file was fabricated; recording is staged for human operator capture).*
- **Overall Readiness Rating:** **B — CONDITIONALLY READY (Script & technical prerequisites verified; recording awaits operator capture).**

---

## 2. Repository & Working-Tree Audit

- **Active Git Branch:** `day18-preview-validation`
- **Current HEAD Commit:** `05523215e92ebe58e7829253ea897822cfe205b8`
- **Working-Tree Integrity:** All 54 tracked modified files and untracked Phase 5 documentation remain intact. Zero destructive Git commands executed.
- **Authoritative Files Inspected:**
  - Route handlers: `src/app/login/page.tsx`, `src/app/dashboard/page.tsx`, `src/app/employees/page.tsx`, `src/app/leave/page.tsx`, `src/app/approvals/page.tsx`, `src/app/payslips/page.tsx`, `src/app/task-board/page.tsx`, `src/app/admin/finance/page.tsx`.
  - Reusable UI: `AppShell.tsx`, `EmployeeDrawer.tsx`, `LeaveApprovalQueue.tsx`, `TaskBoard.tsx`, `PayslipDetailView.tsx`, `HRAssistantWidget.tsx`.
  - Automated test reports: `DAY20-FIVE-E2E-JOURNEYS-REPORT.md`, `DAY20-LOCAL-E2E-STABILITY-REPORT.md`.

---

## 3. Verified Product Capabilities & Workflow Matrix

The demonstration script strictly features capabilities backed by verified source code and passing automated test suites:

| Capability / Route | User Role | Verified Business Action | Supporting Verification Evidence |
|---|:---:|---|---|
| **Authentication** (`/login`) | Public / All | Jose JWT authentication, session cookie issue | `login.spec.ts` (5 tests), `test:auth` (39 checks) |
| **Executive Dashboard** (`/dashboard`) | Employee | Real-time attendance KPIs, leave balances | `login.spec.ts`, Lighthouse audits |
| **Employee Directory** (`/employees`) | HR / Admin | Search, department filters, slide drawer | `test:employees` (43 checks), `test:security` |
| **Leave Self-Service** (`/leave`) | Employee | Submit Casual Leave, quota validation | `apply-leave.spec.ts` (2 tests), `test:leave` |
| **Team Approvals** (`/approvals`) | Manager | Review pending request, approve with remarks | `approve-leave.spec.ts` (2 tests), RBAC 403 checks |
| **Payslip Inspection** (`/payslips`) | Employee | Itemized statement, data masking, IDOR block | `view-payslip.spec.ts` (2 tests), `test:payslips` |
| **Kanban Task Board** (`/task-board`) | Employee | Drag card across columns, reload sync | `move-task-card.spec.ts`, `test:task-board-ui` |
| **Finance & AI Assistant** | Admin / Emp | Accounts aging cards, AI policy assistant | `test:finance-ui`, `test:assistant` |

---

## 4. Final Demonstration Timeline & Segment Structure

Total Duration: Exactly **300 seconds (5:00 minutes)**:

```
[00:00 - 00:25] Segment 1: Product Introduction & Problem Statement (25s)
[00:25 - 01:00] Segment 2: Authentication & Executive Dashboard (35s)
[01:00 - 01:40] Segment 3: Employee Directory & Detail Drawer (40s)
[01:40 - 02:35] Segment 4: End-to-End Leave Lifecycle & Manager Approval (55s)
[02:35 - 03:10] Segment 5: Confidential Payroll & Anti-IDOR Inspection (35s)
[03:10 - 03:45] Segment 6: Agile Kanban Task Board Drag-and-Drop (35s)
[03:45 - 04:20] Segment 7: Enterprise Finance & Conversational AI Assistant (35s)
[04:20 - 05:00] Segment 8: Engineering Quality, Rigor & v1.0.0 Baseline (40s)
```

---

## 5. Dry-Run Verification Results

A systematic local verification dry-run was executed against the local SQLite `dev.db` target environment to validate that all demonstrated steps succeed without visual defects or runtime errors:

| Demonstrated Workflow | Dry-Run Result | Evidence / Test Source | Operational Notes |
|---|:---:|---|---|
| **1. Login & Auth** | **PASS** | `auth/login.spec.ts` / `test-auth.ts` | Session cookie `horizon_session` issued; redirect to `/dashboard` instantaneous. |
| **2. Dashboard Load** | **PASS** | `auth/login.spec.ts` | Zero layout shift ($\text{CLS} \le 0.05$); KPI cards load cleanly. |
| **3. Employee Directory** | **PASS** | `test-day9-employee-management.ts` | Search filters react instantly; drawer focus trap and `Escape` key verified. |
| **4. Leave Submission** | **PASS** | `apply-leave.spec.ts` / `test-day6-leave.ts` | Casual Leave form validates dates; table registers "Pending Review" status. |
| **5. Manager Approval** | **PASS** | `approve-leave.spec.ts` | Manager locates subordinate request, adds remarks, confirms; badge updates to Approved. |
| **6. Payslip Viewing** | **PASS** | `view-payslip.spec.ts` / `test-day7-payslips.ts` | Itemized breakdown matches April 2026 record; bank account and PAN masked; IDOR blocked. |
| **7. Kanban Card Movement**| **PASS** | `move-task-card.spec.ts` / `test-day13-phase3-board-ui.ts` | Drag-and-drop moves card to "In Progress"; optimistic update; persists across reload. |
| **8. Additional Modules** | **PASS** | `test-day12-phase6b-summary-ui.ts`, `test-day16-hr-assistant.ts` | Finance summary cards render; floating AI assistant widget opens and responds. |
| **9. Account Switching** | **PASS** | `test-helpers.ts` (`loginAs`, `logout`) | Clean session clearance between Employee and Manager roles. |

---

## 6. Recording Configuration & Privacy Safeguards

- **Resolution:** Full HD ($1920 \times 1080$), $16:9$, 60 fps.
- **Browser:** Google Chrome dedicated demo profile with bookmarks, extensions, and password autofill disabled.
- **Privacy Assurance:** Zero real PII; all records originate from synthetic demonstration packs (`03_Data_Pack`). Bank accounts and PANs masked in the UI.
- **Target Safety:** Executed strictly against `http://localhost:3000` with zero interaction with production endpoints (`ep-broad-hall-b3dtqwdp` or `horizon-portal-sigma.vercel.app`).

---

## 7. Outstanding Blockers & Incomplete Items

1. **Physical Video Recording:** Requires human screen capture / voiceover recording using the authored script and checklist.
2. **Hosted Preview Deployment:** Pending project owner deployment trigger on Vercel Preview.
3. **Cloud Neon Preview Migrations:** Pending project owner execution of staged migration scripts.
4. **Day 20 Final Challenge:** Scoped for independent branch `day20-final-challenge`.

---

## 8. Final Readiness Decision

**READINESS RATING: B — CONDITIONALLY READY**

The five-minute demo script, timed walkthrough, browser checklist, and technical dry-runs are 100% complete and verified. Physical video recording can proceed immediately upon human operator execution.
