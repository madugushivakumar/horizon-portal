# HORIZON PORTAL — DEMO RECORDING & QUALITY ASSURANCE CHECKLIST

**Project:** Horizon Portal  
**Document:** Recording Environment, Browser Configuration & Quality Acceptance Checklist  
**Target Duration:** 5:00 Minutes (300 Seconds)  
**Author:** Senior Product Demo Engineer & QA Lead  
**Date:** November 20, 2026  
**Status:** RECORDING PREPARATION COMPLETE — READY FOR OPERATOR RECORDING  

---

## 1. Technical Recording Environment Specifications

| Parameter | Recommended Setting | Verification Standard |
|---|---|---|
| **Screen Resolution** | $1920 \times 1080$ ($1080\text{p}$) | Strictly $16:9$ native display scaling (100% DPI, no fractional scaling) |
| **Video Frame Rate** | $60\text{ fps}$ (or minimum $30\text{ fps}$) | Smooth pointer tracking and UI animation transitions |
| **Recording Software** | OBS Studio / ScreenFlow / Camtasia | Hardware-accelerated encoding (NVENC / Apple Silicon) |
| **Video Container / Codec** | MP4 or MKV (H.264 / AAC) | Universal playback compatibility across modern web players |
| **Audio Input** | Studio USB / XLR Microphone | Cardioid polar pattern, positioned 6–8 inches from speaker |
| **Audio Levels** | Peak between $-6\text{ dB}$ and $-3\text{ dB}$ | Zero clipping, ambient noise gate active ($\le -50\text{ dB}$ floor) |
| **Cursor Visibility** | Standard cursor, size $1\times$, visible | Highlight clicks optional; no distracting cursor trails |

---

## 2. Browser & Operating System Preparation

Before initiating video capture, verify each browser setting in the target environment:

- [ ] **Dedicated Clean Profile:** Use a dedicated Chrome profile with zero personal extensions, zero password manager autofill popups (e.g., 1Password, Bitwarden disabled).
- [ ] **Display Dimensions:** Browser window maximized to full $1920 \times 1080$ canvas with zoom strictly set to **100%**.
- [ ] **Bookmarks & Toolbars:** Bookmarks bar hidden (`Ctrl+Shift+B` or `Cmd+Shift+B`).
- [ ] **Developer Tools:** Chrome DevTools closed during recording unless explicitly demonstrating network/accessibility panels in Segment 8.
- [ ] **System Notifications:** OS "Do Not Disturb" / Focus Assist enabled to block incoming email, Slack, or system alerts.
- [ ] **URL Cleanliness:** Target URL is `http://localhost:3000`. No stray staging or production tabs open.
- [ ] **Autofill Sanitation:** Browser form autofill dropdowns cleared so no personal emails or addresses appear during typing.

---

## 3. Application State & Synthetic Data Pre-Flight Checklist

Verify the local application instance prior to pressing record:

- [ ] **Server Process:** Local Next.js server running stably on `http://localhost:3000` (`npm run dev`).
- [ ] **Database Target:** Verified pointing to local SQLite `dev.db` (zero connection to cloud Neon or production).
- [ ] **Employee Demo Account:**
  - Login credentials verified: `employee@growmar.com`
  - Casual Leave balance verified: $\ge 10$ days available for submission.
  - Profile verified: Sasi Shetty / Sophie Chen (`EMP-0188`).
- [ ] **Manager Demo Account:**
  - Login credentials verified: `manager@growmar.com`
  - Subordinate mapping verified: Manager oversees `EMP-0188`.
  - Approval queue verified: Can view and approve leave requests.
- [ ] **Payslips Record:**
  - April 2026 statement (`PR-2026-04`) accessible for `EMP-0188`.
  - Itemized earnings, allowances, and net pay display properly.
  - Masked bank account and PAN verified visible in DOM.
- [ ] **Kanban Task Board:**
  - Board loads sprint tasks under `/task-board`.
  - At least one test card positioned in "To Do" column ready for drag-and-drop.
- [ ] **AI Assistant Widget:**
  - Floating circular icon rendered in bottom-right corner.
  - Panel opens cleanly and responds to policy queries.

---

## 4. Audio-Visual & Delivery Quality Standards

- [ ] **Pacing:** Narration paced evenly at approximately $130$ to $150$ words per minute.
- [ ] **Cursor Navigation:** Mouse movements deliberate and steady; pointer rests on clicked elements for 1–2 seconds to allow the viewer to orient.
- [ ] **Zero Awkward Pauses:** Seamless transition between voiceover and on-screen clicks.
- [ ] **Zero Background Noise:** Recording space silent with zero fan noise, keyboard clatter, or echo.
- [ ] **No Visual Glitches:** No browser window resize jumps, unexpected console warnings, or broken image placeholders.

---

## 5. Post-Recording Quality Acceptance Checklist

Review the captured video file against the following gate criteria:

| Gate | Acceptance Criterion | Verified | Notes |
|:---:|---|:---:|---|
| **Gate 1** | **Exact Duration:** Total runtime is between 4:45 and 5:15 minutes ($300\text{s} \pm 15\text{s}$). | [ ] | |
| **Gate 2** | **Eight Segments Present:** Intro, Dashboard, Employees, Leave, Payroll, Tasks, Finance/AI, Quality. | [ ] | |
| **Gate 3** | **Zero Sensitive PII:** No actual banking, salary, or real individual data visible. | [ ] | |
| **Gate 4** | **Zero Exposed Secrets:** No passwords, JWT secrets, or connection strings shown in UI or dev tools. | [ ] | |
| **Gate 5** | **Audio Intelligibility:** Voiceover clear, audible, synchronized with screen actions. | [ ] | |
| **Gate 6** | **Accurate Claims:** Local verification cited accurately; no premature claims of v1.0.0 public release. | [ ] | |
| **Gate 7** | **Visual Resolution:** Output renders crisp 1080p text with zero pixelation or stutter. | [ ] | |
