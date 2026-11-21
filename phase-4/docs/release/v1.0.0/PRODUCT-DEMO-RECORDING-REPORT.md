# HORIZON PORTAL v1.0.0 — FIVE-MINUTE PRODUCT DEMO RECORDING REPORT
## Walkthrough Script Review, Scene Timing Architecture & Recording Execution Protocol

**Project:** Horizon Portal  
**Target Release:** `v1.0.0`  
**Evaluation Date:** 2026-11-20  
**Phase:** Phase 4 — Actual Five-Minute Product Demo Recording  
**Current Recording Status:** **PENDING — Actual recording not completed.**  
**Lead Roles:** UX Demonstration Specialist, Technical Product Manager, Release Manager  

---

## 1. RECORDING ENVIRONMENT AUDIT

In accordance with Section 8 of the Master Execution Prompt:
> *"If the coding environment cannot access screen-recording hardware, provide: a precise recording procedure, screen setup, narration script, scene checklist, suggested output format, final review checklist. Do not generate a fake video or placeholder recording. If no recording exists, mark: PENDING — Actual recording not completed."*

Because this execution runs inside an automated terminal sandbox without physical audio input, microphone access, display hardware, or screen capture drivers, an actual video recording cannot be fabricated. The comprehensive walkthrough script and production runbook are fully established.

---

## 2. FIVE-MINUTE DEMO SCENE ARCHITECTURE (TIMED SCRIPT)

Based on the approved script ([`DAY20-FIVE-MINUTE-PRODUCT-DEMO-SCRIPT.md`](file:///C:/HorizonPortal-Development/horizon-portal/docs/day20/DAY20-FIVE-MINUTE-PRODUCT-DEMO-SCRIPT.md)):

| Time Window | Scene Title | UI Screen & URL | Core Narration & Actions Demonstrated |
|---|---|---|---|
| **00:00–00:25** | **1. Platform Introduction** | Executive Dashboard (`/`) | Welcome, mission statement, modern HR operations tech stack (Next.js 16, TypeScript, Neon/PostgreSQL). |
| **00:25–01:00** | **2. Login & Executive Dashboard** | Login (`/login`) -> Dashboard | Demo session auth, role-based dashboard rendering, dynamic KPI cards, and responsive navigation. |
| **01:00–01:40** | **3. Employee Directory & Profile** | Employees (`/employees`) | Fast search, department filtering, employee slide-over drawer, and soft-deletion governance. |
| **01:40–02:35** | **4. Leave Operations & Approvals** | Leave (`/leave`) -> Approvals (`/approvals`) | Employee applies for annual leave; manager views Unified Approval Center; approves leave; balance updates. |
| **02:35–03:10** | **5. Payslip Privacy & IDOR Guard** | Payroll / Payslips (`/payroll`) | Employee views confidential payslip; demonstrate IDOR security blocking unauthorized access. |
| **03:10–03:45** | **6. Collaborative Task Board** | Task Board (`/tasks`) | Kanban drag-and-drop task card transition; version concurrency; real-time status update. |
| **03:45–04:20** | **7. Multi-Domain Spend Governance** | Approval Center (`/approvals`) | Corporate Expense Authorization (`CEA-2026-XXXX`); rejection modal enforcing mandatory justification; AP isolation. |
| **04:20–05:00** | **8. Engineering Rigor & Closing** | Terminal Test Logs | 30/30 unit tests passed; Playwright E2E suites; dual database migrations; v1.0.0 release readiness. |

---

## 3. DATA PRIVACY & SECRET MASKING AUDIT

Prior to recording, the presenter must verify strict privacy protection:
- **Zero Real Employee PII:** Only synthetic demonstration users (`john@horizon.internal`, `manager@horizon.internal`, `admin@horizon.internal`) are displayed.
- **Zero Real Financial Identifiers:** Payslip figures are synthetic fixtures; bank account numbers, PAN cards, and SSNs are fully masked.
- **Zero Credentials Exposed:** Browser password autofill disabled; `.env` files and database connection strings never shown on screen.
- **Accounts Payable Safety:** Point out that historical Accounts Payable records (501 expenses) remain completely untouched by spend authorizations.

---

## 4. PRESENTER RECORDING RUNBOOK

### 4.1 Technical Setup:
- **Software:** OBS Studio, Loom, or Camtasia.
- **Resolution:** 1920x1080 (Full HD, 1080p) at 60 fps.
- **Audio:** External USB/XLR microphone with noise cancellation filter.
- **Browser:** Google Chrome running at 100% zoom with clean profile (bookmarks bar hidden).

### 4.2 Post-Recording Checklist:
- [ ] Video file generated in MP4 format (H.264 video, AAC audio).
- [ ] Duration is between 4:45 and 5:15 minutes.
- [ ] Audio is crisp, clear, and synchronized with screen actions.
- [ ] No personal browser bookmarks, open tabs, or sensitive desktop notifications visible.
- [ ] Video saved to agreed project path: `recordings/v1.0.0-product-demo.mp4`.
- [ ] Document verified file path and duration in this report once completed.
