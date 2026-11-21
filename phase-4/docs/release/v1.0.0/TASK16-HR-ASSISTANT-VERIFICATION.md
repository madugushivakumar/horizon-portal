# TASK 16: HR ASSISTANT CHAT WIDGET VERIFICATION REPORT
## Deterministic NLP Matching, Cryptographic Session Authorization & Privacy Defense

**Project:** Horizon Portal — HR Operations & Enterprise Management Platform  
**Target Release:** `v1.0.0`  
**Phase:** Phase 4 — Day 16 (Task 16)  
**Workspace:** `C:\HorizonPortal-Development\horizon-portal`  
**Verification Script:** `scripts/test-day16-hr-assistant.ts`  
**Automated Test Result:** **37 / 37 PASSED (100%)**  
**Audit Date:** 2026-11-20  
**Lead Roles:** Principal Software Engineer, Application Security Engineer, Full-Stack Developer  

---

## 1. OBJECTIVE & ARCHITECTURAL OVERVIEW

Task 16 delivers a production-grade, globally accessible conversational **HR Assistant Chat Widget** for the Horizon Portal platform. The assistant satisfies two distinct business needs:
1. **General Company Policy & FAQ Guidance:** Resolves queries against 30 authoritative company handbook FAQ records and 33 conversational intent templates using a fast, deterministic keyword-scoring algorithm.
2. **Authenticated Employee Self-Service:** Answers personal compensation, leave balance, reporting manager, and department queries derived strictly from the server-validated session cookie (`horizon_session`).
3. **Strict Salary Privacy Defense:** Immediately refuses queries attempting to discover or extract other employees' salaries, payslips, or compensation metrics without performing database lookups or leaking employee existence.
4. **Duplicate Employee Name Isolation:** Eliminates cross-account data leakage by binding all personal queries to immutable employee identifiers (`user.employeeId`) rather than ambiguous display names.

The implementation is completely self-contained within Next.js and Prisma, requiring zero paid external AI, LLM API, or embedding vector service dependencies.

---

## 2. DATABASE MODELS & AUTHORITATIVE SEED INTEGRITY

### 2.1 Prisma Schema Models
Both SQLite (`prisma/schema.prisma`) and PostgreSQL (`prisma/schema.postgresql.prisma`) schemas define identical models:
```prisma
model HrFaq {
  id         String   @id @default(cuid())
  category   String   // Leave | Working Time | Pay | Statutory | Exit | Policy | Expenses | Benefits | Admin | Contacts
  question   String
  answer     String
  keywords   String   // Comma-separated keyword list for deterministic scoring
  orderIndex Int      @default(0) @map("order_index")
  createdAt  DateTime @default(now()) @map("created_at")
  updatedAt  DateTime @updatedAt @map("updated_at")

  @@index([category])
  @@map("hr_faqs")
}

model ChatbotResponse {
  id        String   @id @default(cuid())
  intent    String   @unique // greeting | thanks | goodbye | help | fallback | salary_refusal | ...
  response  String
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@map("chatbot_responses")
}
```

### 2.2 Seed Data Verification
Direct query of the active SQLite database (`prisma/dev.db`) confirms authoritative record counts:
- `SELECT COUNT(*) FROM hr_faqs`: **30 records** (3 per each of the 10 HR categories).
- `SELECT COUNT(*) FROM chatbot_responses`: **33 records** (covering conversational intents, help text, fallback, and privacy refusals).
- Zero duplicate records detected; all seed operations are idempotent.

---

## 3. DETERMINISTIC FAQ MATCHING ENGINE

The NLP matching algorithm (`src/lib/assistant/nlp.ts`) uses a deterministic, rule-based keyword scoring model:
1. **Case Normalization:** Converts incoming message text to lowercase.
2. **Punctuation Stripping:** Removes non-alphanumeric punctuation while preserving intra-word hyphens.
3. **Tokenization:** Splits normalized text into discrete word tokens.
4. **Stop-Word Filtering:** Filters out generic conversational stop words (`"the"`, `"is"`, `"at"`, `"which"`, `"on"`, etc.).
5. **Weighted Keyword Intersection:** Compares user tokens against candidate FAQ `keywords` and `question` tokens. Matches against exact keywords receive higher weight than partial substring matches.
6. **Confidence Threshold:** If the highest candidate score exceeds the confidence threshold ($\ge 0.35$), the matching FAQ answer is returned with structured category attribution and question chips.
7. **Polite Fallback:** If candidate scores fall below threshold or no tokens match, the assistant safely falls back to a helpful default response directing the employee to the HR Helpdesk.

---

## 4. AUTHENTICATION & PERSONAL DATA SECURITY

### 4.1 Server-Derived Identity
- All personal data endpoints derive employee identity strictly from `getAuthenticatedUserFromToken(token)`.
- Client-supplied identifiers in query parameters or JSON request bodies (`employeeId`, `userId`, `targetEmp`) are strictly ignored.
- Requests with missing or tampered cookies return HTTP 401 Unauthorized immediately.

### 4.2 Sensitive Salary Inquiries & Refusal Logic
The system intercepts privacy-violating questions using deterministic regex and intent classifiers prior to database querying:
- Triggers: Patterns matching inquiries about third-party compensation (e.g. *"What is John's salary?"*, *"Show me manager's payslip"*, *"How much does EMP-0042 earn?"*).
- Response: Returns a canonical privacy refusal:
  > *"I cannot share confidential compensation, payslip, or salary information for other employees. You can view your own payslip on the Payroll screen."*
- Non-Disclosure: The assistant does not confirm or deny whether the target employee exists in the directory.
- First-Person Safe Exemption: Legitimate queries for the signed-in user's own data (*"What was my last payslip?"*, *"Show my leave balance"*) are correctly exempted and serviced.

### 4.3 Duplicate Employee Name Isolation
- Scenario: Two employees in the enterprise share identical display names (e.g., Balaji Annamalai `EMP-0278` and Balaji Annamalai `EMP-0331`).
- Isolation Invariant: When either employee queries their leave balance or payslip, the assistant queries the database using `user.employeeId` bound cryptographically in their JWT session.
- Result:
  - Balaji 1 (`EMP-0278`) receives strictly their own 35.5 EL balance and payslip `PI-007021`.
  - Balaji 2 (`EMP-0331`) receives strictly their own 25.5 EL balance and payslip `PI-007051`.
  - Zero cross-user data leakage occurs.

---

## 5. TEST SUITE RESULTS (37 / 37 PASSED)

The automated verification script `scripts/test-day16-hr-assistant.ts` executed with 100% success:

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
  ✓ [PASS] Validation: Empty string input is rejected with HTTP 400/422
  ✓ [PASS] Validation: Whitespace-only string is rejected with HTTP 400/422
  ✓ [PASS] Validation: Oversized string (>500 chars) is rejected with HTTP 400/422

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

## 6. VISUAL SCREENSHOT EVIDENCE

Three visual proof screenshots are saved in `docs/release/v1.0.0/evidence/task-16/`:
1. **General FAQ Guidance:** [`general-faq-conversation.png`](file:///C:/HorizonPortal-Development/horizon-portal/docs/release/v1.0.0/evidence/task-16/general-faq-conversation.png) — Demonstrates answering casual leave rules and office hours with suggested chips.
2. **Personal Data Query:** [`personal-leave-payslip-conversation.png`](file:///C:/HorizonPortal-Development/horizon-portal/docs/release/v1.0.0/evidence/task-16/personal-leave-payslip-conversation.png) — Demonstrates real-time personal leave quota breakdown and payslip summary retrieval.
3. **Salary Privacy Refusal:** [`unauthorized-salary-refusal.png`](file:///C:/HorizonPortal-Development/horizon-portal/docs/release/v1.0.0/evidence/task-16/unauthorized-salary-refusal.png) — Demonstrates refusal of inquiries seeking a colleague's salary with canonical security banner.

---

## 7. TASK 16 ACCEPTANCE SIGN-OFF

| Acceptance Item | Status | Verification Evidence |
|---|:---:|---|
| Floating chat bubble globally mounted in AppShell | **PASS** | `src/components/layout/AppShell.tsx` mounting `<HRAssistantWidget />` |
| Deterministic matching across 30 FAQs | **PASS** | 10 category tests passed in Section 1 |
| Personal leave & payslip data access | **PASS** | 4 personal data queries passed in Section 2 |
| Safe refusal for unauthorized salary queries | **PASS** | 5 third-party compensation probes rejected in Section 3 |
| Duplicate employee name isolation | **PASS** | Distinct balances and payslips verified for Balaji 1 & 2 in Section 4 |
| Input validation and polite fallback | **PASS** | Malformed input rejected; out-of-scope query triggers fallback in Section 5 |
| 3 visual screenshot artifacts saved | **PASS** | Saved in `docs/release/v1.0.0/evidence/task-16/` |

**Final Task 16 Status:** **COMPLETE & VERIFIED (PASS)**.
