# Task 16: HR Assistant Chat Widget (Phase 4 — Day 16)
## Technical Architecture, Security Audit, and Verification Report
**Project:** Horizon Portal / Aura Workforce by Growmar  
**Lead Full-Stack Architect:** Madugu Shiva Kumar  
**Branch:** `main` | **Git Commit Baseline:** `725e47b`  
**Test Suite:** `npm run test:assistant` (37 / 37 PASSED, 100%)  
**Verification Date:** November 16, 2026  

---

## 1. Executive Summary & Objective

**Task 16** delivers an enterprise-grade, deterministic, role-aware **HR Assistant Chat Widget** integrated globally across Horizon Portal. The assistant serves two fundamental operational functions:
1. **General HR Policy Guidance:** Answers inquiries deterministically against the 30 authoritative HR FAQ records and 33 conversational intent templates established in the company handbook.
2. **Authenticated Self-Service Inquiries:** Retrieves personal leave balances, latest payslip status, reporting manager, and department assignments using cryptographic server-side session identity.
3. **Strict Salary Privacy Enforcement:** Immediately refuses unauthorized inquiries seeking compensation or payroll details of other employees without performing database queries or disclosing employee existence.
4. **Duplicate Employee Name Isolation:** Resolves all personal data exclusively through unique internal employee identifiers (`user.employeeId`), preventing cross-account leakage between employees sharing identical display names.

The entire implementation is **100% self-contained**: it introduces zero third-party ML, embedding, or paid LLM dependencies, requires zero database schema migrations, and preserves the active SQLite database (`prisma/dev.db`) perfectly intact.

---

## 2. Existing Architecture Reused

Rather than inventing disconnected components or duplicating business logic, Task 16 directly extends existing system assets:

| System Layer | Existing Asset Reused | Integration Method |
|---|---|---|
| **Data Models** | `HrFaq` & `ChatbotResponse` Prisma models | Queried directly via `prisma.hrFaq` (30 records) and `prisma.chatbotResponse` (33 records). |
| **Database Tables** | `hr_faqs` & `chatbot_responses` in SQLite (`dev.db`) | Zero schema alterations. Existing records preserved in their authoritative form. |
| **Authentication** | `getAuthenticatedUserFromToken` in `src/lib/auth/user.ts` | Validates signed `horizon_session` JWT cookie, verifies active status, and resolves `user.employeeId`. |
| **Leave Calculation** | `LeaveBalance` & `LeaveRequest` models | Reuses the exact entitlement and pending leave logic from `src/app/api/v1/leave/balances/route.ts`. |
| **Payroll Service** | `Payslip` model & `logPayslipAccess` in `audit.ts` | Queries the latest itemized payslip for `user.employeeId` and writes compliance audit records. |
| **Layout Container** | `src/components/layout/AppShell.tsx` | Mounts `<HRAssistantWidget />` globally on all authenticated views while omitting it from `/login` and `/design`. |

---

## 3. Backend NLP & Normalization Design

The deterministic NLP engine is implemented in `src/lib/assistant/nlp.ts`:
- **Text Normalization:** Lowercases all input, converts Unicode punctuation into normalized spacing, and collapses repeated whitespace.
- **Tokenization:** Breaks normalized strings into distinct tokens, stripping trailing and leading hyphens.
- **Domain-Tailored Stopword Filtering:** Filters generic English words (`"a"`, `"the"`, `"how"`, `"what"`, `"can"`, `"i"`) while retaining critical HR domain acronyms (`"cl"`, `"sl"`, `"el"`, `"pf"`, `"esi"`, `"lop"`, `"tds"`, `"wfh"`, `"hr"`).
- **Jaccard Similarity:** Computes token-set overlap between query keywords and authoritative FAQ terms to rank candidate answers without machine learning overhead.

---

## 4. Intent Classification & Security Precedence

The classifier in `src/lib/assistant/intent-classifier.ts` enforces a strict, deterministic evaluation hierarchy:

```text
Incoming User Message
         |
         v
[Precedence 1: Security Check]  ----> Is query seeking another person's compensation/payslip?
         |                                  |
         | (No)                             v (Yes)
         |                             REFUSE IMMEDIATELY (salary_of_other)
         v                             - Do NOT query DB
[Precedence 2: Personal Queries]        - Do NOT confirm target employee exists
   - "my leave balance"                - Return canonical privacy refusal
   - "my latest payslip"
   - "who is my manager"
   - "what is my department"
         |
         | (No match)
         v
[Precedence 3: Conversational]
   - greet, thanks, goodbye, help
         |
         | (No match)
         v
[Precedence 4: FAQ Matcher]
   - Match against 30 HrFaq records (Threshold: 0.35)
         |
         | (Score < 0.35)
         v
[Precedence 5: Polite Fallback]
   - General HR guidance & suggested question chips
```

### Salary Privacy Refusal Rules
The classifier flags inquiries containing compensation terms (`"salary"`, `"pay"`, `"compensation"`, `"payslip"`, `"earnings"`, `"package"`) combined with other-person indicators (`"colleague"`, `"coworker"`, `"employee 102"`, `"Rahul"`, `"HR manager"`, etc.).
- **Canonical Response:** *"Sorry, I cannot share another person's pay. You can ask about your own payslip."*
- **Security Guarantee:** Legitimate first-person inquiries (`"Where can I view my latest payslip?"`) are preserved and routed to the authenticated payslip resolver.

---

## 5. Authoritative FAQ Matching Engine

The engine in `src/lib/assistant/faq-matcher.ts` matches queries against the 30 `HrFaq` records stored in SQLite:
- **Exact Match Bonus:** 1.0 score if the normalized question matches the canonical FAQ question.
- **Keyword Overlap:** Jaccard similarity and recall ratio over extracted keywords (up to 0.7 score).
- **Category Match:** +0.15 score if the query mentions the relevant category (`Leave`, `Payroll`, `Statutory`, etc.).
- **Domain Keyword Alignment:** Specific keyword boosts for high-signal terms (`"casual"`, `"sick"`, `"probation"`, `"notice"`, `"wfh"`, `"travel"`, `"dress"`).
- **Confidence Threshold:** `0.35`. Any score below 0.35 gracefully falls back to the polite fallback handler.

---

## 6. Personal API Integration & Server Identity

Personal self-service queries are resolved in `src/lib/assistant/assistant-service.ts`:
1. **Server-Side Identity Derivation:** Identity is extracted exclusively from `authResult.user.employeeId` after verifying the signed JWT `horizon_session` cookie against SQLite `User` and `Employee` tables.
2. **Client Parameter Tampering Immunity:** If a client injects `{ "employeeId": "EMP-0099" }` or `{ "userId": "admin" }` into the JSON payload, the chat API route ignores the parameters and binds strictly to the authenticated session.
3. **Leave Balances:** Concurrently calculates CL, SL, and EL entitlements and deductions using `prisma.leaveBalance` and sums pending days from `prisma.leaveRequest`.
4. **Latest Payslip:** Queries `prisma.payslip` ordered by `periodStart: desc` and logs audit access via `logPayslipAccess` in compliance with payroll security regulations.

---

## 7. Duplicate Employee Name Isolation

Forensic audit of `prisma/dev.db` revealed that **6 sets of active employees share identical names**. For example:
- `EMP-0278`: Balaji Annamalai (Department D01, 35.5 EL days, payslip PI-007021 with Net ₹49,318)
- `EMP-0331`: Balaji Annamalai (Department D01, 25.5 EL days, payslip PI-007051 with Net ₹174,312.68)

### Architectural Isolation Policy:
1. **Zero Name-Based Queries:** The database is never queried by employee name string for personal data retrieval.
2. **Strict Identity Binding:** The assistant binds directly to `user.employeeId`.
3. **Verified Result:** In automated verification, `EMP-0278` retrieves strictly `35.5 EL` and payslip `PI-007021`, while `EMP-0331` retrieves strictly `25.5 EL` and payslip `PI-007051`, guaranteeing 100% isolation with zero cross-account data leakage.

---

## 8. Frontend Implementation

The frontend chat widget is built using accessible React components and pure inline SVG icons:
- `src/components/assistant/HRAssistantWidget.tsx`: Persistent floating action button positioned at `fixed bottom-6 right-6 z-50` with toggle animation.
- `src/components/assistant/HRAssistantPanel.tsx`: Accessible dialog (`role="dialog"`, `aria-modal="true"`) featuring:
  - Header with assistant avatar, status dot, reset conversation control, and close button.
  - Message scroll area with distinct user bubbles, assistant bubbles, category tags, and policy sources.
  - Salary privacy refusal badges with amber warning indicators.
  - Suggested follow-up chips under assistant messages.
  - Auto-scroll to bottom ref, loading indicator, and error banners.
  - Keyboard accessible: Enter to send, Escape to close.
- `src/components/assistant/SuggestedQuestionChips.tsx`: 5-category tabbed suggestion chips (`Leave`, `Attendance`, `Payroll`, `Profile`, `General HR`).
- `src/components/assistant/icons.tsx`: High-performance, zero-dependency inline SVG icon library matching Horizon Portal design tokens.
- `src/components/layout/AppShell.tsx`: Global mounting point ensuring widget availability across all authenticated views.

---

## 9. Automated Verification Test Results

Test suite: `scripts/test-day16-hr-assistant.ts`  
Command: `npm run test:assistant`  
Result: **37 / 37 PASSED (100% Pass Rate)**

```text
=========================================================================
   HORIZON PORTAL — DAY 16 HR ASSISTANT CHAT WIDGET VERIFICATION         
=========================================================================

▶ Authenticating test accounts...
  ✓ [PASS] Employee login succeeds and returns valid horizon_session cookie
  ✓ [PASS] Admin login succeeds and returns valid horizon_session cookie

▶ [1/6] Running 10 Authoritative FAQ Category Tests...
  ✓ [PASS] FAQ 1 [Leave]: Casual leave allowance answered correctly (FAQ-01)
  ✓ [PASS] FAQ 2 [Working time]: Office hours answered correctly (FAQ-06)
  ✓ [PASS] FAQ 3 [Pay]: Salary disbursement timing answered correctly (FAQ-09)
  ✓ [PASS] FAQ 4 [Statutory]: PF calculation policy answered correctly (FAQ-13)
  ✓ [PASS] FAQ 5 [Exit]: Notice period duration answered correctly (FAQ-18)
  ✓ [PASS] FAQ 6 [Policy]: Probation period answered correctly (FAQ-20)
  ✓ [PASS] FAQ 7 [Expenses]: Travel expenses claim procedure answered correctly (FAQ-22)
  ✓ [PASS] FAQ 8 [Benefits]: Group insurance coverage answered correctly (FAQ-24)
  ✓ [PASS] FAQ 9 [Admin]: Bank detail update guidance answered correctly (FAQ-27)
  ✓ [PASS] FAQ 10 [Contacts]: Payroll department contact answered correctly (FAQ-28)

▶ [2/6] Running Personal Authenticated Data Tests...
  ✓ [PASS] Personal Query: Employee retrieves their own CL, SL, and EL balances
  ✓ [PASS] Personal Query: Employee retrieves latest payslip summary and screen guidance
  ✓ [PASS] Personal Query: Employee queries reporting manager safely
  ✓ [PASS] Personal Query: Employee queries department assignment safely

▶ [3/6] Running Role Security & Safe Refusal Tests...
  ✓ [PASS] Security: Unauthenticated request returns HTTP 401 Unauthorized
  ✓ [PASS] Security: Injected employeeId does not crash server and is ignored in favor of session identity
  ✓ [PASS] Security: Injected userId does not elevate privileges or override session identity
  ✓ [PASS] Privacy Refusal: Inquiry for named colleague's salary refused with canonical response
  ✓ [PASS] Privacy Refusal: Inquiry for colleague's payslip refused with canonical response
  ✓ [PASS] Privacy Refusal: Inquiry for employee-ID compensation refused with canonical response
  ✓ [PASS] Privacy Refusal: Inquiry for HR manager salary refused with canonical response
  ✓ [PASS] Privacy Refusal: Inquiry for another employee's compensation refused with canonical response
  ✓ [PASS] Privacy Non-Refusal: Genuine first-person payslip inquiry is NOT falsely classified as refusal

▶ [4/6] Running Duplicate Employee Name Isolation Test...
  ✓ [PASS] Duplicate Name Isolation: Employee EMP-0278 (Balaji 1) receives strictly their own 35.5 EL balance
  ✓ [PASS] Duplicate Name Isolation: Employee EMP-0331 (Balaji 2) receives strictly their own 25.5 EL balance
  ✓ [PASS] Duplicate Name Isolation: Balaji 1 (PI-007021) and Balaji 2 (PI-007051) retrieve distinct payslip records

▶ [5/6] Running Fallback & Input Validation Tests...
  ✓ [PASS] Fallback: Out-of-scope query receives polite fallback response
  ✓ [PASS] Fallback: Gibberish text receives polite fallback response
  ✓ [PASS] Validation: Empty string input is rejected with HTTP 400
  ✓ [PASS] Validation: Whitespace-only string is rejected with HTTP 400
  ✓ [PASS] Validation: Oversized string (>500 chars) is rejected with HTTP 400

▶ [6/6] Running Conversational Intent Tests...
  ✓ [PASS] Conversational: Greeting matched with friendly introductory response
  ✓ [PASS] Conversational: Thanks matched with polite acknowledgement
  ✓ [PASS] Conversational: Goodbye matched with polite parting response
  ✓ [PASS] Conversational: Help matched with suggested example commands

=========================================================================
   DAY 16 HR ASSISTANT VERIFICATION SUMMARY: 37 PASSED, 0 FAILED
=========================================================================
```

---

## 10. Genuine Screenshot Evidence

Three high-resolution application screenshots (1440x950) were captured using the native Microsoft Edge headless engine and are persisted in `reports/phase-4/task-16/`:

1. **General FAQ Conversation:**  
   Path: [reports/phase-4/task-16/general-faq-conversation.png](file:///c:/Users/Madugu%20Shiva%20Kumar/OneDrive/图片/Desktop/horizon-portal/reports/phase-4/task-16/general-faq-conversation.png)  
   Shows employee asking *"How many casual leaves do I get?"* and receiving the handbook answer with policy source badge and follow-up chips.

2. **Personal Leave & Payslip Query:**  
   Path: [reports/phase-4/task-16/personal-leave-payslip-conversation.png](file:///c:/Users/Madugu%20Shiva%20Kumar/OneDrive/图片/Desktop/horizon-portal/reports/phase-4/task-16/personal-leave-payslip-conversation.png)  
   Shows authenticated employee Sasi Shetty querying *"What is my leave balance?"* (CL, SL, EL) and *"Where can I view my latest payslip?"* (March 2026 Processed).

3. **Unauthorized Salary Privacy Refusal:**  
   Path: [reports/phase-4/task-16/unauthorized-salary-refusal.png](file:///c:/Users/Madugu%20Shiva%20Kumar/OneDrive/图片/Desktop/horizon-portal/reports/phase-4/task-16/unauthorized-salary-refusal.png)  
   Shows employee asking *"What is Rahul's salary?"* and receiving the canonical privacy refusal with the `ShieldAlert` security badge.

---

## 11. Database Integrity Verification

| Metric | Before Task 16 | After Task 16 | Status |
|---|---|---|---|
| `hr_faqs` | 30 | 30 | Preserved |
| `chatbot_responses` | 33 | 33 | Preserved |
| `leave_types` | 6 | 6 | Preserved |
| `leave_balances` | 441 | 441 | Preserved |
| `payslips` | 2,469 | 2,469 | Preserved |
| `employees` | 441 | 441 | Preserved |
| `users` | 8 | 8 | Preserved |
| Schema migrations generated/applied | 0 | 0 | Zero changes |
| Database resets / seed runs | 0 | 0 | Zero mutations |

---

## 12. Known Limitations & Scope Boundary

- **Deterministic Scope:** The assistant matches against the 30 active FAQ entries and 33 predefined intents. It does not fabricate policies or improvise answers outside the approved handbook.
- **Strict Scope Boundary:** In adherence with user instructions, work is limited strictly to Phase 4 — Day 16. Day 17 (production deployment), Day 18 (security hardening), Day 19 (Lighthouse optimization), and Day 20 (final release) remain untouched.

