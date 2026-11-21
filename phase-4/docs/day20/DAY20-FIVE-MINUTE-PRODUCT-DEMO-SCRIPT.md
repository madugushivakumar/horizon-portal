# HORIZON PORTAL — FIVE-MINUTE PRODUCT DEMO SCRIPT (v1.0.0)

**Document:** Five-Minute Product Demonstration Speaking Script & Screen Walkthrough  
**Project:** Horizon Portal (Aura Workforce by Growmar)  
**Target Duration:** Exactly 5:00 Minutes (300 Seconds)  
**Author:** Senior Product Demo Engineer & Technical Product Manager  
**Date:** November 20, 2026  
**Demonstration Status:** SCRIPT COMPLETE — READY FOR RECORDING  

---

## 1. Demo Objective & Intended Audience

### Primary Objectives:
1. **Showcase Real Capabilities:** Demonstrate core enterprise HR operations using verified, functional application workflows rather than static mockups.
2. **Tell a Coherent Persona Story:** Walk through an authentic end-to-end journey bridging Individual Contributor self-service, Manager governance, and Administrative oversight.
3. **Prove Engineering Rigor:** Highlight security boundaries (RBAC, Anti-IDOR, Jose JWT), responsive AppShell design, WCAG 2.2 AA accessibility, and automated Playwright E2E verification.

### Target Audience:
- Technical Evaluators, Enterprise Stakeholders, System Architects, and Engineering Leadership.

---

## 2. Demonstration Prerequisites & Environment Setup

To ensure zero technical friction or unexpected data collisions during recording, the environment must be staged as follows:

- **Target URL:** `http://localhost:3000` (Local Next.js 16.4.6 Development Server running on SQLite `dev.db`).
- **Production Guard:** **NEVER target `https://horizon-portal-sigma.vercel.app` or cloud Neon endpoint `ep-broad-hall-b3dtqwdp`**.
- **Browser & Viewport:** Google Chrome Desktop, 100% Zoom, Viewport strictly set to $1920 \times 1080$ ($16:9$ Full HD).
- **Demo Personas (Pre-seeded in `dev.db`):**
  - **Employee:** `employee@growmar.com` (Sasi Shetty / Sophie Chen — `EMP-0188`)
  - **Manager:** `manager@growmar.com` (Imran Philip / Marcus Brody — `EMP-0547`)
  - **Admin / HR:** `admin@growmar.com` (`EMP-0099`) / `hr@growmar.com` (`EMP-0011`)
- **Pre-Recording State Check:**
  - Employee `EMP-0188` has $\ge 10$ Casual Leave balance days available.
  - Kanban board has at least 1 feature task in "To Do" column.
  - Browser profile is clean: no password manager prompts, bookmarks bar hidden, developer notifications silenced.

---

## 3. Five-Minute Timed Screen Walkthrough & Narration

| Timestamp | Segment Name | Primary Screen | Target Persona | Key Demonstrated Action |
|:---:|---|---|:---:|---|
| **00:00–00:25** | **1. Introduction** | `/login` | Public | Platform overview, problem statement & core roles |
| **00:25–01:00** | **2. Auth & Dashboard** | `/login` -> `/dashboard` | Employee | Jose JWT login, AppShell navigation & metrics cards |
| **01:00–01:40** | **3. Employee Directory** | `/employees` | HR / Admin | Search, department filters, and focus-trapped drawer |
| **01:40–02:35** | **4. Leave Lifecycle** | `/leave` -> `/approvals` | Employee & Manager | Leave submission, balance lock, and manager approval |
| **02:35–03:10** | **5. Confidential Payroll**| `/payslips` -> `[id]` | Employee | Itemized statement, data masking, and IDOR defense |
| **03:10–03:45** | **6. Kanban Task Board** | `/task-board` | Employee / Team | `@dnd-kit` drag-and-drop, optimistic UI & reload sync |
| **03:45–04:20** | **7. Finance & AI Assistant**| `/admin/finance` + Widget| Admin & Employee | Invoice aging cards and contextual AI policy support |
| **04:20–05:00** | **8. Engineering Rigor** | Terminal / Summary | Architect | Playwright E2E stability, Lighthouse $\ge 90$, status |

---

### Segment 1: Introduction & Operational Purpose (00:00 – 00:25 | 25s)

**Screen:** `/login` (Clean branded login portal, "Aura Workforce by Growmar / Horizon Portal").  
**User Action:** Mouse hovers smoothly over login branding; cursor rests on the sign-in card.  

**Spoken Narration:**  
> *"Welcome to Horizon Portal, a unified enterprise HR management and workforce operations platform engineered for modern, distributed teams. In complex organizations, critical operational workflows—from employee directory management and leave governance to payroll visibility and sprint execution—are often fragmented across disparate tools. Horizon Portal consolidates these operations into a single, high-performance web platform governed by multi-tier role-based access control for Employees, Managers, HR Specialists, and Administrators. Let's step through the platform in action."*

**Visual Confirmation:** Clean, accessible login card rendered with high-contrast text and responsive form inputs.  
**Transition:** Click email input and initiate employee authentication.

---

### Segment 2: Authentication & Executive Dashboard (00:25 – 01:00 | 35s)

**Screen:** `/login` -> redirects to `/dashboard`.  
**User Action:** Enter employee credentials, click **"Sign In"**, and land on the main dashboard.  

**Spoken Narration:**  
> *"We begin by signing in as an Individual Contributor. Authentication is powered by compact Jose JSON Web Tokens, transmitted via secure, HTTP-only SameSite session cookies. Upon authentication, we are welcomed by the Executive Dashboard.*  
> *Notice our global AppShell architecture: on desktop, a persistent, accessible sidebar provides instant role-filtered navigation, featuring an accessible top-level skip link for keyboard users. On the main canvas, the dashboard surfaces real-time personal metrics: monthly attendance rates, active leave balances, and sprint task assignments—all laid out in responsive KPI cards engineered with zero layout shift."*

**Visual Confirmation:** Dashboard loads cleanly; KPI cards render attendance percentage and leave balance badges.  
**Transition:** Navigate via sidebar to `/employees` (or switch to HR view).

---

### Segment 3: Employee Directory & Detail Drawer (01:00 – 01:40 | 40s)

**Screen:** `/employees`.  
**User Action:** Type in the live search bar (e.g., search for "Engineering"), filter by department, then click an employee row to trigger `EmployeeDrawer`.  

**Spoken Narration:**  
> *"Navigating to Employee Management, the directory provides instant search across hundreds of team records with real-time department filtering and reporting hierarchy indicators.*  
> *Selecting an employee opens our slide-over Employee Drawer. Notice that rather than using a disruptive modal dialog, this drawer preserves visual context while trapping keyboard focus and providing full Escape-key dismissal. It displays comprehensive profile data, cost center mappings, and employment history—strictly omitting sensitive compensation fields in accordance with least-privilege directory privacy rules."*

**Visual Confirmation:** Drawer slides smoothly from the right edge; pressing `Escape` closes the drawer and restores focus cleanly to the table row.  
**Transition:** Navigate via sidebar to `/leave`.

---

### Segment 4: End-to-End Leave Lifecycle (01:40 – 02:35 | 55s)

**Screen:** `/leave` (as Employee `EMP-0188`) -> switch session -> `/approvals` (as Manager `EMP-0547`).  
**User Action:**
1. On `/leave`, select "Casual Leave", select future dates (e.g. 2 days), enter reason `"Attending Technical Architecture Symposium"`, click **"Submit Application"**.
2. Show table updating with "Pending Review".
3. Sign in as Manager `manager@growmar.com`, navigate to `/approvals`, locate subordinate row (`EMP-0188`), click **"Approve"**, add remarks `"Approved. Have a great symposium!"`, confirm.

**Spoken Narration:**  
> *"Next, let's observe our end-to-end Leave Lifecycle. On the employee leave portal, our balance cards reflect live entitlements across 6 leave types. Let's submit a Casual Leave request for upcoming conference dates. Form submission validates working days, prevents backwards date ranges, and verifies balance availability. Upon submission, the request immediately appears in our history with an atomic Pending status.*  
> *Now, switching to the Manager's supervisory view at `/approvals`, our team approval queue automatically filters to subordinate requests. The manager reviews the dates, adds approval remarks, and confirms. The backend processes the state transition atomically, locking the approval and adjusting the employee quota in real time.*  
> *Crucially, defense-in-depth ensures that if an unauthorized employee attempts to navigate directly to `/approvals`, the sidebar conceals the link, the route gate redirects, and the REST API returns a strict HTTP 403 Forbidden."*

**Visual Confirmation:** Request row transitions to "Approved" with green badge; balance updates.  
**Transition:** Navigate to `/payslips`.

---

### Segment 5: Confidential Payroll & Anti-IDOR Inspection (02:35 – 03:10 | 35s)

**Screen:** `/payslips` -> click statement `PR-2026-04` -> `/payslips/PR-2026-04`.  
**User Action:** Click latest payslip statement row, view itemized breakdown, highlight data masking.  

**Spoken Narration:**  
> *"Financial confidentiality is paramount in Horizon Portal. In the Payslips module, employees can review their historical earnings statements across past payroll runs. Selecting April 2026 displays an itemized breakdown: Basic Salary, House Rent Allowance, statutory Provident Fund deductions, and Net Take-Home Pay.*  
> *Notice our privacy safeguards: sensitive bank account numbers and PAN identifiers are dynamically masked in the interface.*  
> *Furthermore, our API route handlers enforce strict resource ownership. If an authenticated user attempts to tamper with the URL parameter to inspect a colleague's compensation, the system rejects the request with HTTP 403 Forbidden, emits a security audit event, and renders a dedicated Access Denied error boundary without leaking a single byte of private payroll data."*

**Visual Confirmation:** Clean tabular breakdown of earnings and deductions; masked bank details visible.  
**Transition:** Navigate via sidebar to `/task-board`.

---

### Segment 6: Agile Kanban Task Board & Drag-and-Drop (03:10 – 03:45 | 35s)

**Screen:** `/task-board`.  
**User Action:** Locate a task card in "To Do", drag it smoothly across the canvas, and drop it into the "In Progress" column container. Refresh the page to demonstrate persistence.  

**Spoken Narration:**  
> *"Operational execution requires agile task coordination. Our Team Task Board provides a full Kanban interface categorized into To Do, In Progress, Blocked, and Done swimlanes.*  
> *Powered by `@dnd-kit/core`, card movements are silky smooth and accessible via mouse pointer or keyboard navigation. Watch as we transition this sprint feature card from 'To Do' to 'In Progress'. The interface executes an optimistic UI update for instant feedback while dispatching an asynchronous PATCH request to the server.*  
> *Refreshing the browser confirms the task status is durably persisted in the database."*

**Visual Confirmation:** Card drops cleanly into "In Progress"; page reload verifies card remains persisted in the target column.  
**Transition:** Navigate via sidebar to `/admin/finance` and click the floating AI assistant widget.

---

### Segment 7: Enterprise Finance & Conversational AI Assistant (03:45 – 04:20 | 35s)

**Screen:** `/admin/finance` -> Click floating AI widget in bottom-right corner.  
**User Action:** Show aging cards on finance summary, click the floating circular AI icon to open `HRAssistantPanel`, enter `"What is the annual Casual Leave policy?"`.  

**Spoken Narration:**  
> *"Beyond core HR workflows, Horizon Portal incorporates executive finance management and conversational AI. The Finance module provides accounts receivable aging cards, vendor invoice registers, and expense tracking.*  
> *And for instant employee support, our floating AI HR Assistant is available across the portal. Clicking the assistant opens an accessible slide panel where employees can ask natural language policy questions—such as leave rollover rules, health benefits, or expense guidelines—receiving accurate, context-aware answers derived from internal policy records."*

**Visual Confirmation:** Finance metrics render; AI assistant panel slides up and generates a clean, helpful answer.  
**Transition:** Switch to terminal or executive slide for conclusion.

---

### Segment 8: Engineering Rigor, Security & Release Baseline (04:20 – 05:00 | 40s)

**Screen:** Architecture diagram, terminal verification summary, or Release Notes document.  
**User Action:** Display terminal showing clean test suites or scroll through root `RELEASE_NOTES.md`.  

**Spoken Narration:**  
> *"Underpinning this entire platform is rigorous engineering discipline. Horizon Portal is built on Next.js 16 and React 19, adhering strictly to WCAG 2.2 AA accessibility standards with zero critical Axe-core violations and verified color contrast. Core Web Vitals achieve Google Lighthouse scores of 90 and above across all categories on mobile and desktop.*  
> *Our test automation includes 12 comprehensive Playwright end-to-end tests across all core business journeys—validated through three consecutive zero-flakiness stability runs—alongside 241 unit and integration regression assertions.*  
> *Version 1.0.0 is fully documented, verified locally, and prepared for release governance.*  
> *Thank you for watching this demonstration of Horizon Portal."*

**Visual Confirmation:** Test summaries show 100% pass rates; clean v1.0.0 release notes visible.  
**Total Video Duration:** 05:00 (300 Seconds).

---

## 4. Reset & Cleanup Procedure Post-Demonstration

To ensure the local database remains pristine after recording:
1. Delete the synthetic leave request created during the demo (`E2E-LV-*`).
2. Restore employee `EMP-0188` leave balance (`clBalance: 12`).
3. Move the demo task card back to "To Do" column.
4. Clear browser session cookies and close the tab.
