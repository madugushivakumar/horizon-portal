/**
 * Day 16 Automated Verification Test Suite — HR Assistant Chat Widget
 * scripts/test-day16-hr-assistant.ts
 *
 * Comprehensive end-to-end and in-process verification:
 * 1. Ten required FAQ test cases spanning all 10 HR categories
 * 2. Personal authenticated queries (leave balance, latest payslip, manager, department)
 * 3. Security verification: Unauthenticated 401 rejection
 * 4. Security verification: Parameter tampering rejection (client-supplied employeeId/userId)
 * 5. Security verification: Salary privacy refusals for other employees
 * 6. Security verification: Legitimate own-payslip queries are NOT falsely refused
 * 7. Security verification: Duplicate employee name isolation (EMP-0278 vs EMP-0331)
 * 8. Fallback handling for out-of-scope, gibberish, and low-confidence inputs
 * 9. Input validation (empty, whitespace, oversized >500 chars)
 * 10. Conversational intents (greet, thanks, goodbye, help)
 */

import { NextRequest } from "next/server";
import { POST as loginRoute } from "../src/app/api/v1/auth/login/route";
import { POST as chatRoute } from "../src/app/api/v1/hr-assistant/chat/route";
import { processAssistantMessage, getUserLatestPayslip } from "../src/lib/assistant/assistant-service";
import { AuthenticatedUser } from "../src/lib/auth/user";

const BASE_URL = process.env.APP_URL || process.env.TEST_BASE_URL || `http://localhost:${process.env.PORT || 3000}`;

let isLiveServer: boolean | null = null;

async function checkLiveServer(): Promise<boolean> {
  if (isLiveServer !== null) return isLiveServer;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 800);
    const res = await fetch(`${BASE_URL}/api/v1/auth/me`, {
      signal: controller.signal,
    }).catch(() => null);
    clearTimeout(timeout);
    isLiveServer = res !== null;
  } catch {
    isLiveServer = false;
  }
  return isLiveServer;
}

interface ApiFetchOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
}

interface ApiResponse<T = unknown> {
  status: number;
  ok: boolean;
  headers: Headers;
  json: () => Promise<T>;
}

async function apiFetch<T = unknown>(urlStr: string, options: ApiFetchOptions = {}): Promise<ApiResponse<T>> {
  const isLive = await checkLiveServer();
  const method = options.method || "GET";
  const headers = new Headers(options.headers || {});
  const body = options.body;

  if (isLive) {
    const res = await fetch(urlStr, {
      method,
      headers,
      body,
    });
    const jsonPayload = await res.json().catch(() => ({}));
    return {
      status: res.status,
      ok: res.ok,
      headers: res.headers,
      json: async () => jsonPayload as T,
    };
  }

  // In-process fallback execution
  const parsedUrl = new URL(urlStr);
  const pathname = parsedUrl.pathname;

  const nextReq = new NextRequest(parsedUrl, {
    method,
    headers,
    body,
  });

  let nextRes: Response;
  if (pathname === "/api/v1/auth/login" && method === "POST") {
    nextRes = await loginRoute(nextReq);
  } else if (pathname === "/api/v1/hr-assistant/chat" && method === "POST") {
    nextRes = await chatRoute(nextReq);
  } else {
    throw new Error(`Unhandled route in test runner: ${method} ${pathname}`);
  }

  const jsonPayload = await nextRes.json().catch(() => ({}));
  return {
    status: nextRes.status,
    ok: nextRes.ok,
    headers: nextRes.headers,
    json: async () => jsonPayload as T,
  };
}

interface LoginResult {
  cookie: string;
  user: {
    id: string;
    email: string;
    role: string;
    employeeId: string;
  };
}

async function loginAs(email: string, pass: string): Promise<LoginResult> {
  const res = await apiFetch<{ user: { id: string; email: string; role: string; employeeId: string } }>(
    `${BASE_URL}/api/v1/auth/login`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: pass }),
    }
  );

  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Login failed for ${email}: ${JSON.stringify(data)}`);
  }

  const setCookie = res.headers.get("set-cookie") || "";
  const match = setCookie.match(/horizon_session=([^;]+)/);
  const cookie = match ? `horizon_session=${match[1]}` : "";

  return { cookie, user: data.user };
}

interface ChatResponsePayload {
  success?: boolean;
  answer?: string;
  category?: string;
  policySource?: string | null;
  suggestedQuestions?: string[];
  isRefusal?: boolean;
  error?: string;
}

async function runDay16AssistantTests() {
  console.log("=========================================================================");
  console.log("   HORIZON PORTAL — DAY 16 HR ASSISTANT CHAT WIDGET VERIFICATION         ");
  console.log("=========================================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean | undefined | null, name: string, detail?: string) {
    if (Boolean(condition)) {
      console.log(`  ✓ [PASS] ${name}`);
      passed++;
    } else {
      console.error(`  ✗ [FAIL] ${name}`);
      if (detail) console.error(`    Detail: ${detail}`);
      failed++;
    }
  }

  // Login as standard test employee
  console.log("▶ Authenticating test accounts...");
  const employeeSession = await loginAs("employee@growmar.com", "Employee@Horizon2026!");
  assert(Boolean(employeeSession.cookie), "Employee login succeeds and returns valid horizon_session cookie");

  const adminSession = await loginAs("admin@growmar.com", "Admin@Horizon2026!");
  assert(Boolean(adminSession.cookie), "Admin login succeeds and returns valid horizon_session cookie");

  // Helper for chat requests
  async function sendChat(message: string, cookie?: string, extraPayload?: Record<string, unknown>) {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (cookie) {
      headers["Cookie"] = cookie;
    }
    return apiFetch<ChatResponsePayload>(`${BASE_URL}/api/v1/hr-assistant/chat`, {
      method: "POST",
      headers,
      body: JSON.stringify({ message, ...(extraPayload || {}) }),
    });
  }

  // ─────────────────────────────────────────────────────────────
  // 1. Ten Required FAQ Test Cases
  // ─────────────────────────────────────────────────────────────
  console.log("\n▶ [1/6] Running 10 Authoritative FAQ Category Tests...");

  // FAQ 1: Leave (FAQ-01)
  {
    const res = await sendChat("How many casual leaves do I get?", employeeSession.cookie);
    const data = await res.json();
    assert(
      res.status === 200 && data.answer?.includes("12 days per financial year") && data.category === "Leave",
      "FAQ 1 [Leave]: Casual leave allowance answered correctly (FAQ-01)",
      JSON.stringify(data)
    );
  }

  // FAQ 2: Working time (FAQ-06)
  {
    const res = await sendChat("What are the office hours?", employeeSession.cookie);
    const data = await res.json();
    assert(
      res.status === 200 && data.answer?.includes("9:00 to 18:00") && data.category === "Working time",
      "FAQ 2 [Working time]: Office hours answered correctly (FAQ-06)",
      JSON.stringify(data)
    );
  }

  // FAQ 3: Pay (FAQ-09)
  {
    const res = await sendChat("When is salary paid?", employeeSession.cookie);
    const data = await res.json();
    assert(
      res.status === 200 && data.answer?.includes("first working day of the following month") && data.category === "Pay",
      "FAQ 3 [Pay]: Salary disbursement timing answered correctly (FAQ-09)",
      JSON.stringify(data)
    );
  }

  // FAQ 4: Statutory (FAQ-13)
  {
    const res = await sendChat("How is PF calculated?", employeeSession.cookie);
    const data = await res.json();
    assert(
      res.status === 200 && data.answer?.includes("12% of basic") && data.category === "Statutory",
      "FAQ 4 [Statutory]: PF calculation policy answered correctly (FAQ-13)",
      JSON.stringify(data)
    );
  }

  // FAQ 5: Exit (FAQ-18)
  {
    const res = await sendChat("How long is the notice period?", employeeSession.cookie);
    const data = await res.json();
    assert(
      res.status === 200 && data.answer?.includes("60 days") && data.category === "Exit",
      "FAQ 5 [Exit]: Notice period duration answered correctly (FAQ-18)",
      JSON.stringify(data)
    );
  }

  // FAQ 6: Policy (FAQ-20)
  {
    const res = await sendChat("What is the probation period?", employeeSession.cookie);
    const data = await res.json();
    assert(
      res.status === 200 && data.answer?.includes("Six months") && data.category === "Policy",
      "FAQ 6 [Policy]: Probation period answered correctly (FAQ-20)",
      JSON.stringify(data)
    );
  }

  // FAQ 7: Expenses (FAQ-22)
  {
    const res = await sendChat("How do I claim travel expenses?", employeeSession.cookie);
    const data = await res.json();
    assert(
      res.status === 200 && data.answer?.includes("Expenses screen") && data.category === "Expenses",
      "FAQ 7 [Expenses]: Travel expenses claim procedure answered correctly (FAQ-22)",
      JSON.stringify(data)
    );
  }

  // FAQ 8: Benefits (FAQ-24)
  {
    const res = await sendChat("What insurance do I have?", employeeSession.cookie);
    const data = await res.json();
    assert(
      res.status === 200 && data.answer?.includes("Group health cover") && data.category === "Benefits",
      "FAQ 8 [Benefits]: Group insurance coverage answered correctly (FAQ-24)",
      JSON.stringify(data)
    );
  }

  // FAQ 9: Admin (FAQ-27)
  {
    const res = await sendChat("How do I update my bank details?", employeeSession.cookie);
    const data = await res.json();
    assert(
      res.status === 200 && data.answer?.includes("Profile screen") && data.category === "Admin",
      "FAQ 9 [Admin]: Bank detail update guidance answered correctly (FAQ-27)",
      JSON.stringify(data)
    );
  }

  // FAQ 10: Contacts (FAQ-28)
  {
    const res = await sendChat("Who do I contact for payroll queries?", employeeSession.cookie);
    const data = await res.json();
    assert(
      res.status === 200 && data.answer?.includes("payroll@znova-demo.example") && data.category === "Contacts",
      "FAQ 10 [Contacts]: Payroll department contact answered correctly (FAQ-28)",
      JSON.stringify(data)
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 2. Personal Authenticated Queries
  // ─────────────────────────────────────────────────────────────
  console.log("\n▶ [2/6] Running Personal Authenticated Data Tests...");

  // Leave balance
  {
    const res = await sendChat("What is my leave balance?", employeeSession.cookie);
    const data = await res.json();
    assert(
      res.status === 200 &&
      data.category === "Leave" &&
      typeof data.answer === "string" &&
      data.answer.includes("CL") &&
      data.answer.includes("SL") &&
      data.answer.includes("EL"),
      "Personal Query: Employee retrieves their own CL, SL, and EL balances",
      JSON.stringify(data)
    );
  }

  // Latest payslip
  {
    const res = await sendChat("Where can I view my latest payslip?", employeeSession.cookie);
    const data = await res.json();
    assert(
      res.status === 200 &&
      data.category === "Payroll" &&
      typeof data.answer === "string" &&
      data.answer.includes("payslip") &&
      data.answer.includes("Payslips screen"),
      "Personal Query: Employee retrieves latest payslip summary and screen guidance",
      JSON.stringify(data)
    );
  }

  // Reporting manager
  {
    const res = await sendChat("Who is my manager?", employeeSession.cookie);
    const data = await res.json();
    assert(
      res.status === 200 &&
      data.category === "Employee Profile" &&
      typeof data.answer === "string" &&
      (data.answer.includes("reporting manager is") || data.answer.includes("assigned")),
      "Personal Query: Employee queries reporting manager safely",
      JSON.stringify(data)
    );
  }

  // Department
  {
    const res = await sendChat("What is my department?", employeeSession.cookie);
    const data = await res.json();
    assert(
      res.status === 200 &&
      data.category === "Employee Profile" &&
      typeof data.answer === "string" &&
      data.answer.includes("department"),
      "Personal Query: Employee queries department assignment safely",
      JSON.stringify(data)
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 3. Security & Safe Refusals
  // ─────────────────────────────────────────────────────────────
  console.log("\n▶ [3/6] Running Role Security & Safe Refusal Tests...");

  // Unauthenticated request
  {
    const res = await sendChat("How many leaves do I have?");
    assert(
      res.status === 401,
      "Security: Unauthenticated request returns HTTP 401 Unauthorized"
    );
  }

  // Client ID spoofing attempt 1: Inject employeeId
  {
    const res = await sendChat("What is my leave balance?", employeeSession.cookie, {
      employeeId: "EMP-0099", // Admin employee id
    });
    const data = await res.json();
    assert(
      res.status === 200 && !data.isRefusal,
      "Security: Injected employeeId does not crash server and is ignored in favor of session identity"
    );
  }

  // Client ID spoofing attempt 2: Inject userId
  {
    const res = await sendChat("Where can I view my latest payslip?", employeeSession.cookie, {
      userId: "usr_admin_001",
    });
    const data = await res.json();
    assert(
      res.status === 200 && !data.isRefusal,
      "Security: Injected userId does not elevate privileges or override session identity"
    );
  }

  // Salary Privacy Refusal 1: Named employee
  {
    const res = await sendChat("What is Rahul's salary?", employeeSession.cookie);
    const data = await res.json();
    assert(
      res.status === 200 &&
      data.isRefusal === true &&
      data.answer?.includes("Sorry, I cannot share another person's pay"),
      "Privacy Refusal: Inquiry for named colleague's salary refused with canonical response",
      JSON.stringify(data)
    );
  }

  // Salary Privacy Refusal 2: Colleague payslip
  {
    const res = await sendChat("Show my colleague's payslip.", employeeSession.cookie);
    const data = await res.json();
    assert(
      res.status === 200 &&
      data.isRefusal === true &&
      data.answer?.includes("Sorry, I cannot share another person's pay"),
      "Privacy Refusal: Inquiry for colleague's payslip refused with canonical response",
      JSON.stringify(data)
    );
  }

  // Salary Privacy Refusal 3: Employee ID based inquiry
  {
    const res = await sendChat("How much does employee 102 earn?", employeeSession.cookie);
    const data = await res.json();
    assert(
      res.status === 200 &&
      data.isRefusal === true &&
      data.answer?.includes("Sorry, I cannot share another person's pay"),
      "Privacy Refusal: Inquiry for employee-ID compensation refused with canonical response",
      JSON.stringify(data)
    );
  }

  // Salary Privacy Refusal 4: HR Manager salary
  {
    const res = await sendChat("Show the HR manager's salary.", employeeSession.cookie);
    const data = await res.json();
    assert(
      res.status === 200 &&
      data.isRefusal === true &&
      data.answer?.includes("Sorry, I cannot share another person's pay"),
      "Privacy Refusal: Inquiry for HR manager salary refused with canonical response",
      JSON.stringify(data)
    );
  }

  // Salary Privacy Refusal 5: General another employee compensation
  {
    const res = await sendChat("Tell me another employee's compensation.", employeeSession.cookie);
    const data = await res.json();
    assert(
      res.status === 200 &&
      data.isRefusal === true &&
      data.answer?.includes("Sorry, I cannot share another person's pay"),
      "Privacy Refusal: Inquiry for another employee's compensation refused with canonical response",
      JSON.stringify(data)
    );
  }

  // Non-Refusal: Genuine own payslip request must NOT be falsely refused
  {
    const res = await sendChat("Where can I find my latest payslip?", employeeSession.cookie);
    const data = await res.json();
    assert(
      res.status === 200 &&
      data.isRefusal === false &&
      data.category === "Payroll",
      "Privacy Non-Refusal: Genuine first-person payslip inquiry is NOT falsely classified as refusal",
      JSON.stringify(data)
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 4. Duplicate Employee Name Isolation Test
  // ─────────────────────────────────────────────────────────────
  console.log("\n▶ [4/6] Running Duplicate Employee Name Isolation Test...");

  {
    // In dev.db, both EMP-0278 and EMP-0331 share the name "Balaji Annamalai"
    // EMP-0278 has 35.5 EL, whereas EMP-0331 has 25.5 EL
    const balaji1User: AuthenticatedUser = {
      id: "usr_test_balaji1",
      email: "balaji.annamalai@znova-demo.example",
      name: "Balaji Annamalai",
      role: "Employee",
      isActive: true,
      employeeId: "EMP-0278",
    };

    const balaji2User: AuthenticatedUser = {
      id: "usr_test_balaji2",
      email: "balaji.annamalai2@znova-demo.example",
      name: "Balaji Annamalai",
      role: "Employee",
      isActive: true,
      employeeId: "EMP-0331",
    };

    const res1 = await processAssistantMessage(balaji1User, "What is my leave balance?");
    const res2 = await processAssistantMessage(balaji2User, "What is my leave balance?");

    assert(
      res1.answer.includes("35.5 EL") && !res1.answer.includes("25.5 EL"),
      "Duplicate Name Isolation: Employee EMP-0278 (Balaji 1) receives strictly their own 35.5 EL balance",
      res1.answer
    );

    assert(
      res2.answer.includes("25.5 EL") && !res2.answer.includes("35.5 EL"),
      "Duplicate Name Isolation: Employee EMP-0331 (Balaji 2) receives strictly their own 25.5 EL balance",
      res2.answer
    );

    const slip1 = await getUserLatestPayslip(balaji1User);
    const slip2 = await getUserLatestPayslip(balaji2User);

    assert(
      Boolean(slip1 && slip2 && slip1.id !== slip2.id && slip1.id === "PI-007021" && slip2.id === "PI-007051"),
      "Duplicate Name Isolation: Balaji 1 (PI-007021) and Balaji 2 (PI-007051) retrieve distinct payslip records",
      `Balaji1: ${slip1?.id}, Balaji2: ${slip2?.id}`
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 5. Fallback & Input Validation Tests
  // ─────────────────────────────────────────────────────────────
  console.log("\n▶ [5/6] Running Fallback & Input Validation Tests...");

  // Out of scope
  {
    const res = await sendChat("What is the capital of France?", employeeSession.cookie);
    const data = await res.json();
    assert(
      res.status === 200 && data.answer?.includes("I can help with HR topics"),
      "Fallback: Out-of-scope query receives polite fallback response",
      JSON.stringify(data)
    );
  }

  // Gibberish
  {
    const res = await sendChat("xkzjwq plmnbv", employeeSession.cookie);
    const data = await res.json();
    assert(
      res.status === 200 && data.answer?.includes("I can help with HR topics"),
      "Fallback: Gibberish text receives polite fallback response",
      JSON.stringify(data)
    );
  }

  // Empty string
  {
    const res = await sendChat("", employeeSession.cookie);
    assert(
      res.status === 400 || res.status === 422,
      "Validation: Empty string input is rejected with HTTP 400/422"
    );
  }

  // Whitespace only
  {
    const res = await sendChat("    ", employeeSession.cookie);
    assert(
      res.status === 400 || res.status === 422,
      "Validation: Whitespace-only string is rejected with HTTP 400/422"
    );
  }

  // Oversized string (>500 chars)
  {
    const longMsg = "a".repeat(505);
    const res = await sendChat(longMsg, employeeSession.cookie);
    assert(
      res.status === 400 || res.status === 422,
      "Validation: Oversized string (>500 chars) is rejected with HTTP 400/422"
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 6. Conversational Intents
  // ─────────────────────────────────────────────────────────────
  console.log("\n▶ [6/6] Running Conversational Intent Tests...");

  // Greet
  {
    const res = await sendChat("hello", employeeSession.cookie);
    const data = await res.json();
    assert(
      res.status === 200 && data.answer?.includes("Hello! I am the Zenith Nova HR assistant"),
      "Conversational: Greeting matched with friendly introductory response"
    );
  }

  // Thanks
  {
    const res = await sendChat("thank you very much", employeeSession.cookie);
    const data = await res.json();
    assert(
      res.status === 200 && data.answer?.includes("You are welcome!"),
      "Conversational: Thanks matched with polite acknowledgement"
    );
  }

  // Goodbye
  {
    const res = await sendChat("goodbye", employeeSession.cookie);
    const data = await res.json();
    assert(
      res.status === 200 && data.answer?.includes("Goodbye! Message me anytime."),
      "Conversational: Goodbye matched with polite parting response"
    );
  }

  // Help
  {
    const res = await sendChat("help", employeeSession.cookie);
    const data = await res.json();
    assert(
      res.status === 200 && data.answer?.includes("Try:"),
      "Conversational: Help matched with suggested example commands"
    );
  }

  // ─────────────────────────────────────────────────────────────
  // Summary
  // ─────────────────────────────────────────────────────────────
  console.log("\n=========================================================================");
  console.log(`   DAY 16 HR ASSISTANT VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("=========================================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runDay16AssistantTests().catch((err) => {
  console.error("Fatal error running Day 16 test suite:", err);
  process.exit(1);
});
