# FINAL PRODUCT DEMO VERIFICATION REPORT
## Official Five-Minute Demonstration Architecture, Scene Timing & Presenter Runbook

**Project:** Horizon Portal — HR Operations & Enterprise Management Platform  
**Target Release:** `v1.0.0`  
**Phase:** Phase 4 — Day 20 (Five-Minute Product Demonstration)  
**Workspace:** `C:\HorizonPortal-Development\horizon-portal`  
**Official Recording Script:** `docs/day20/DAY20-FIVE-MINUTE-PRODUCT-DEMO-SCRIPT.md`  
**Evaluation Date:** 2026-11-20  
**Current Recording Status:** **BLOCKED — PENDING OWNER CAMERA & SCREEN RECORDING**  
**Lead Roles:** UX Demonstration Specialist, Technical Documentation Specialist, Release Manager  

---

## 1. OFFICIAL PROGRAMME DEMONSTRATION STRUCTURE

In accordance with official programme guidelines, the demonstration is structured into two mandatory segments totaling exactly five minutes:

### 1.1 Segment 1: Presenter Face on Camera (0:00 – 1:00)
- **Format:** Presenter (Madugu Shiva Kumar) appears directly on camera with clear audio.
- **Key Talking Points:**
  - Who you are and your role as Lead Architect of Horizon Portal.
  - The business problem Horizon Portal solves: eliminating administrative drag, siloed HR data, and opaque operational approvals in distributed enterprises.
  - Who the target users are: Individual contributors, frontline people managers, HR operations specialists, and corporate administrators.
  - High-level architecture: Next.js 16, React 19, TypeScript, PostgreSQL (Neon), Prisma, Upstash Redis, and Tailwind CSS.
  - Transition to live screen demonstration.

### 1.2 Segment 2: Live Screen Walkthrough (1:00 – 5:00)
- **Format:** High-definition 1080p screen recording of the live hosted application in a desktop browser.
- **Mandatory Visual Requirement:** The real deployed URL (`https://*.vercel.app`) must be clearly visible in the browser address bar (never `localhost:3000`).
- **Required 7-Scene Narrative Flow:**
  1. **Scene 1 (1:00–1:30): Employee Login & Self-Service Dashboard**
     - Employee logs in with demo credentials.
     - Demonstrates responsive AppShell, attendance circular progress ring, and leave balance summary cards.
  2. **Scene 2 (1:30–2:10): Employee Leave Application**
     - Navigates to `/leave`.
     - Submits a valid Casual Leave (CL) request with date picker and business justification.
     - Shows instant quota reservation (`pendingDays` increments) and leave request card in `Pending` state.
  3. **Scene 3 (2:10–2:50): Manager Approval Workflow**
     - Manager logs in via separate private window.
     - Navigates to `/approvals` (Unified Approval Center).
     - Reviews the pending leave request, checks subordinate details, and clicks **Approve**.
     - Status updates atomically; toast notification confirms approval.
  4. **Scene 4 (2:50–3:20): Real-Time Employee Notification**
     - Switches back to Employee window.
     - Top bar notification bell indicates unread count (`+1`).
     - Employee opens notification tray: *"Your Casual Leave request has been approved."*
  5. **Scene 5 (3:20–3:55): HR Payroll & Payslip Console**
     - HR specialist logs in.
     - Opens `/payroll` to view six-month payroll runs and variance reconciliation summaries.
     - Opens an individual itemized payslip: Demonstrates net pay calculations, allowances, statutory PF/tax deductions, and confidential masking.
  6. **Scene 6 (3:55–4:30): Security & Privacy Proof (Anti-IDOR)**
     - Employee attempts to access another employee's payslip statement by tampering with the URL.
     - Demonstrates instant **HTTP 403 Forbidden** security rejection and privacy non-disclosure.
     - Demonstrates HR Assistant chat widget: Refuses third-party salary queries with canonical security message.
  7. **Scene 7 (4:30–5:00): Engineering Rigor, Lighthouse Proof & Wrap-up**
     - Shows live Lighthouse audit report: **>= 90 scores across Performance, Accessibility, Best Practices, and SEO**.
     - Shows terminal test logs: 30/30 domain tests passed, 128/128 concurrency assertions passed.
     - Concludes the official demonstration.

---

## 2. DATA PRIVACY & CREDENTIAL MASKING AUDIT

Prior to recording, the presenter must verify:
- **Zero Real Employee PII:** Only synthetic accounts (`employee@growmar.com`, `manager@growmar.com`, `admin@growmar.com`) are displayed.
- **Zero Secret Exposure:** Browser autofill disabled; `.env` files, API keys, and database connection strings are never shown on screen.
- **Accounts Payable Safety:** Emphasize that all 501 historical accounts payable records remain completely untouched by spend authorizations.

---

## 3. RECORDING VERIFICATION CHECKLIST (POST-RECORDING)

Once recorded by the owner, the video must pass all verification checks before submission:

| Check # | Verification Requirement | Pass Criteria |
|---|---|:---:|
| 1 | **Video Duration** | Exactly 5 minutes (04:55 to 05:05 accepted). |
| 2 | **Face-on-Camera Segment** | Presenter on camera from 0:00 to 1:00 with natural delivery. |
| 3 | **Screen Recording Quality** | 1080p resolution, crisp text, smooth cursor movements. |
| 4 | **Address Bar Visibility** | Live hosted HTTPS preview URL visible throughout 1:00–5:00. |
| 5 | **Audio Clarity** | Crisp voice recording; zero background noise or echo. |
| 6 | **Unlisted YouTube Link** | Uploaded as **Unlisted** (not Private, not Public). |
| 7 | **Incognito Playback Test** | Link plays smoothly in a private browser window without Google login. |
| 8 | **Zero Leaks** | Verified no passwords, JWTs, or real personal information visible. |

---

## 4. CURRENT STATUS & OWNER ACTION

### Official Status: **BLOCKED — PENDING OWNER RECORDING**

Because the automated development environment has no physical camera, microphone, or display monitor, the actual recording cannot be manufactured. The project owner must record the video following the script in `docs/day20/DAY20-FIVE-MINUTE-PRODUCT-DEMO-SCRIPT.md` once the Vercel Preview deployment is live.
