# HORIZON PORTAL v1.0.0 — PHYSICAL DEVICE QA PROTOCOL & TEST MATRIX
## Hardware-Level Touch, Virtual Keyboard, Viewport & Cross-Platform Usability Assessment

**Project:** Horizon Portal  
**Target Release:** `v1.0.0`  
**Evaluation Date:** 2026-11-20  
**Phase:** Phase 3 — Physical Android and iOS Device Testing  
**Current Status:** **PENDING OWNER HARDWARE TESTING**  
**Lead Roles:** Mobile Responsive and Accessibility Tester, Senior QA Engineer  

---

## 1. PHYSICAL DEVICE TESTING MANDATE

In strict compliance with Section 7 of the Master Execution Prompt:
> *"Physical-device testing cannot be claimed from browser viewport simulation. If a physical device is unavailable, create a clear owner checklist and mark it BLOCKED / PENDING. Do not substitute emulator results for physical-device verification."*

While automated viewport simulation (375px mobile, 768px tablet, 1280px desktop) was successfully validated on Day 19 (`scripts/test-day19-responsive.ts`), physical touchscreen gestures, virtual keyboard window resizing, WebKit iOS rendering quirks, and haptic feedback require hands-on hardware testing.

---

## 2. PHYSICAL DEVICE TEST MATRIX

| Test Workflow | Android (Pixel / Galaxy on Chrome) | iPhone (Safari on iOS 17+) | Acceptance Criteria |
|---|:---:|:---:|---|
| **1. Authentication & Session** | **Pending Owner QA** | **Pending Owner QA** | Login form inputs legible, password toggle functional, session cookie preserved |
| **2. Executive Dashboard** | **Pending Owner QA** | **Pending Owner QA** | Metric cards stack cleanly; no horizontal overflow; quick action buttons touchable |
| **3. Employee Directory** | **Pending Owner QA** | **Pending Owner QA** | Search input responsive; employee cards or scrollable table render smoothly |
| **4. Leave Submission** | **Pending Owner QA** | **Pending Owner QA** | Datepicker opens native mobile date picker; balance preview card remains visible |
| **5. Unified Approval Center** | **Pending Owner QA** | **Pending Owner QA** | Summary KPI cards stack vertically; domain filter pills scroll horizontally; cards render |
| **6. Approval & Rejection Modals** | **Pending Owner QA** | **Pending Owner QA** | Modals fit viewport; backdrop blur renders cleanly; close button touchable |
| **7. Payslip Privacy** | **Pending Owner QA** | **Pending Owner QA** | Sensitive figures masked or legible; PDF download triggers native mobile save dialog |
| **8. Task Kanban Board** | **Pending Owner QA** | **Pending Owner QA** | Touch drag-and-drop or select-dropdown transitions task cards between columns |
| **9. Finance Operational Screens** | **Pending Owner QA** | **Pending Owner QA** | Horizontal scrolling enabled on wide data tables with visible touch scrollbar |
| **10. Navigation & Drawer Menu** | **Pending Owner QA** | **Pending Owner QA** | Hamburger menu triggers smooth slide-over; links have >= 44x44px touch targets |
| **11. Virtual Keyboard Viewport** | **Pending Owner QA** | **Pending Owner QA** | Focusing text areas (e.g. rejection reason) does not obscure input or submit button |
| **12. Form Validation Feedback** | **Pending Owner QA** | **Pending Owner QA** | Red error text displays directly beneath invalid fields without modal clipping |
| **13. Touch Targets (WCAG 2.5.5)** | **Pending Owner QA** | **Pending Owner QA** | Minimum 44x44 CSS pixels for all interactive icons, buttons, and dropdowns |
| **14. Scroll Behavior** | **Pending Owner QA** | **Pending Owner QA** | Smooth momentum scrolling (`-webkit-overflow-scrolling: touch`); zero scroll jumping |
| **15. Orientation Changes** | **Pending Owner QA** | **Pending Owner QA** | Seamless transition between portrait (375-430px) and landscape (667-932px) |
| **16. Screen Reader / VoiceOver** | **Pending Owner QA** | **Pending Owner QA** | TalkBack (Android) and VoiceOver (iOS) announce navigation landmarks and modal states |

---

## 3. OWNER EXECUTION INSTRUCTIONS (PHYSICAL TEST PROTOCOL)

The project owner should execute this protocol against the active Preview deployment URL (`https://horizon-portal-preview-xyz.vercel.app`) using their physical devices:

### 3.1 Device Matrix Required:
- **Device A (Android):** Google Pixel (7/8/9) or Samsung Galaxy (S22/S23/S24) running Google Chrome on Android 13/14.
- **Device B (iOS):** iPhone 12/13/14/15/16 running Apple Safari on iOS 16/17/18.

### 3.2 Execution Steps:
1. Open the preview URL on both devices.
2. Log in as Manager (`manager@horizon.internal`).
3. Tap the hamburger menu in the mobile header: verify it opens without stutter.
4. Navigate to `/approvals` (Unified Approval Center):
   - Tap between `All`, `Leave Requests`, and `Corporate Expenses`.
   - Tap an expense card to open the Detail Modal.
   - Tap **Reject**: verify the rejection reason modal opens.
   - Tap into the text area: **verify that the virtual keyboard does not push the submit button off-screen**.
   - Enter rejection reason *"Budget reallocated"* and submit. Verify toast notification and card removal.
5. Rotate device to landscape and verify table layouts adapt smoothly.
6. Take screenshots of any visual defects, touch lag, or text clipping.
7. Record findings in Section 4 below.

---

## 4. PHYSICAL TEST EVIDENCE RECORDING TEMPLATE

```text
Test Date: ____________________
Android Device Model: ____________________   OS: _________   Browser: _________
iPhone Device Model: ____________________    OS: _________   Browser: _________
Tester Name: ____________________
Overall Result: [ ] PASS   [ ] FAIL   [ ] CONDITIONALLY ACCEPTED
Defects Encountered:
  - Defect 1: __________________________________________________
  - Defect 2: __________________________________________________
```
