/**
 * HR Assistant — Central Orchestration Service
 * src/lib/assistant/assistant-service.ts
 *
 * Implements the core business logic and security policies for the HR assistant:
 * 1. Strictly enforces server-authenticated identity (`user.employeeId`).
 * 2. Refuses unauthorized salary inquiries without database lookups.
 * 3. Integrates personal leave balances and payslips using existing models and audit logging.
 * 4. Resolves duplicate employee name ambiguity by binding to unique internal employee IDs.
 * 5. Deterministically matches general HR policy queries against active `HrFaq` records.
 */

import { prisma } from "@/lib/prisma";
import { AuthenticatedUser } from "@/lib/auth/user";
import { logPayslipAccess } from "@/lib/payroll/audit";
import { classifyIntent } from "./intent-classifier";
import { matchFaq } from "./faq-matcher";

export interface AssistantResponse {
  answer: string;
  category: string;
  policySource?: string | null;
  suggestedQuestions?: string[];
  isRefusal?: boolean;
}

/**
 * Standard suggested question topics for follow-up
 */
export const DEFAULT_SUGGESTIONS = [
  "What is my leave balance?",
  "Where can I view my latest payslip?",
  "How many casual leaves do I get?",
  "What is the work from home policy?",
  "Who do I contact for payroll queries?",
];

/**
 * Reusable leave balance calculation for the authenticated employee.
 * Strictly binds to `employeeId` without trusting client-supplied identifiers.
 */
export async function getUserLeaveBalance(employeeId: string) {
  const [balanceRecord, pendingRequests] = await Promise.all([
    prisma.leaveBalance.findUnique({
      where: { employeeId },
    }),
    prisma.leaveRequest.findMany({
      where: {
        employeeId,
        status: "Pending",
      },
      select: {
        leaveTypeCode: true,
        days: true,
      },
    }),
  ]);

  const clEntitlement = balanceRecord?.clEntitlement ?? 12;
  const clUsed = balanceRecord?.clUsed ?? 0;
  const cl = balanceRecord?.clBalance ?? (clEntitlement - clUsed);

  const slEntitlement = balanceRecord?.slEntitlement ?? 12;
  const slUsed = balanceRecord?.slUsed ?? 0;
  const sl = balanceRecord?.slBalance ?? (slEntitlement - slUsed);

  const el = balanceRecord?.elBalance ?? 15;

  let totalPending = 0;
  for (const req of pendingRequests) {
    totalPending += req.days;
  }

  return { cl, sl, el, pending: totalPending };
}

/**
 * Retrieves the latest payslip summary for the authenticated user,
 * logging audit access in compliance with payroll security policies.
 */
export async function getUserLatestPayslip(user: AuthenticatedUser) {
  if (!user.employeeId) {
    return null;
  }

  const payslip = await prisma.payslip.findFirst({
    where: { employeeId: user.employeeId },
    include: {
      payrollRun: {
        select: {
          id: true,
          payDate: true,
          paymentDate: true,
          status: true,
        },
      },
    },
    orderBy: { periodStart: "desc" },
  });

  logPayslipAccess({
    userId: user.id,
    userEmail: user.email,
    employeeId: user.employeeId,
    recordIdentifier: payslip ? payslip.id : "LATEST_NONE",
    action: "VIEW_PAYSLIP_DETAIL",
    outcome: payslip ? "SUCCESS" : "NOT_FOUND",
  });

  if (!payslip) {
    return null;
  }

  // Format month from periodStart
  let monthStr = "recent period";
  if (payslip.periodStart) {
    const d = new Date(payslip.periodStart);
    monthStr = d.toLocaleString("en-US", { month: "long", year: "numeric" });
  }

  const status = payslip.payrollRun?.status || "Processed";
  const netFormatted = payslip.netPay
    ? new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(payslip.netPay)
    : "Available";

  return {
    id: payslip.id,
    month: monthStr,
    status,
    netFormatted,
  };
}

/**
 * Retrieves reporting manager name for the authenticated employee.
 */
export async function getUserManager(employeeId: string): Promise<string | null> {
  const emp = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: {
      manager: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  if (!emp || !emp.manager) {
    return null;
  }

  return `${emp.manager.firstName} ${emp.manager.lastName}`.trim();
}

/**
 * Retrieves department name for the authenticated employee.
 */
export async function getUserDepartment(employeeId: string): Promise<string | null> {
  const emp = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: {
      department: {
        select: {
          name: true,
        },
      },
    },
  });

  return emp?.department?.name ?? null;
}

/**
 * Main Assistant Orchestration Entrypoint.
 */
export async function processAssistantMessage(
  user: AuthenticatedUser,
  message: string
): Promise<AssistantResponse> {
  // Step 1: Classify user intent
  const intentResult = classifyIntent(message);

  // ─────────────────────────────────────────────────────────────
  // Intent: Unauthorized salary inquiry for other employees (REFUSAL)
  // ─────────────────────────────────────────────────────────────
  if (intentResult.intent === "salary_of_other") {
    // Canonical refusal template from chatbot_responses
    return {
      answer: "Sorry, I cannot share another person's pay. You can ask about your own payslip.",
      category: "Privacy & Security",
      policySource: "Zenith Nova HR Data Governance Policy (Confidentiality & Role Isolation)",
      isRefusal: true,
      suggestedQuestions: [
        "Where can I view my latest payslip?",
        "When is salary paid?",
        "What is my leave balance?",
      ],
    };
  }

  // ─────────────────────────────────────────────────────────────
  // Intent: Conversational templates
  // ─────────────────────────────────────────────────────────────
  if (intentResult.intent === "greet") {
    return {
      answer: "Hello! I am the Zenith Nova HR assistant. Ask me about leave, payslips, attendance or policies.",
      category: "General",
      suggestedQuestions: DEFAULT_SUGGESTIONS,
    };
  }

  if (intentResult.intent === "goodbye") {
    return {
      answer: "Goodbye! Message me anytime.",
      category: "General",
    };
  }

  if (intentResult.intent === "thanks") {
    return {
      answer: "You are welcome!",
      category: "General",
    };
  }

  if (intentResult.intent === "help") {
    return {
      answer: 'Try: "leave balance", "payslip for March", "who is my manager", "work from home policy".',
      category: "Help",
      suggestedQuestions: DEFAULT_SUGGESTIONS,
    };
  }

  // ─────────────────────────────────────────────────────────────
  // Intent: Personal Authenticated Leave Balance
  // ─────────────────────────────────────────────────────────────
  if (intentResult.intent === "leave_balance") {
    if (!user.employeeId) {
      return {
        answer: "No employee profile is linked to your user account. Please contact HR.",
        category: "Leave",
      };
    }

    try {
      const { cl, sl, el, pending } = await getUserLeaveBalance(user.employeeId);
      // Canonical response template: "You have {cl} CL, {sl} SL and {el} EL days left."
      let answer = `You have ${cl} CL, ${sl} SL and ${el} EL days left.`;
      if (pending > 0) {
        answer += ` You also have ${pending} day${pending > 1 ? "s" : ""} pending approval.`;
      }

      return {
        answer,
        category: "Leave",
        policySource: "Zenith Nova HR Policy Handbook v3.2 — Leave Administration",
        suggestedQuestions: [
          "How do I apply for leave?",
          "What is the maternity leave policy?",
          "Is leave without pay allowed?",
        ],
      };
    } catch {
      return {
        answer: "Sorry, I could not fetch your leave balance right now. Please try again or contact HR.",
        category: "Leave",
      };
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Intent: Personal Authenticated Latest Payslip
  // ─────────────────────────────────────────────────────────────
  if (intentResult.intent === "payslip_status") {
    if (!user.employeeId) {
      return {
        answer: "No employee profile is linked to your user account. Please contact HR.",
        category: "Payroll",
      };
    }

    try {
      const payslipSummary = await getUserLatestPayslip(user);
      if (!payslipSummary) {
        return {
          answer: "No payslip records were found for your employee profile. Please contact the payroll department.",
          category: "Payroll",
          suggestedQuestions: [
            "When is salary paid?",
            "Who do I contact for payroll queries?",
          ],
        };
      }

      // Canonical response template: "Your payslip for {month} is {status}. You can download it from the Payslips screen."
      const answer = `Your payslip for ${payslipSummary.month} is ${payslipSummary.status}. You can view and download it from the Payslips screen.`;

      return {
        answer,
        category: "Payroll",
        policySource: "Zenith Nova Payroll Service v2.4",
        suggestedQuestions: [
          "When is salary paid?",
          "How is PF calculated?",
          "When do I get Form 16?",
        ],
      };
    } catch {
      return {
        answer: "Sorry, I could not fetch that right now. Please try again or contact HR.",
        category: "Payroll",
      };
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Intent: Reporting Manager
  // ─────────────────────────────────────────────────────────────
  if (intentResult.intent === "my_manager") {
    if (!user.employeeId) {
      return {
        answer: "No employee profile is linked to your user account. Please contact HR.",
        category: "Employee Profile",
      };
    }

    const managerName = await getUserManager(user.employeeId);
    if (!managerName) {
      return {
        answer: "No reporting manager is currently assigned to your profile in the system.",
        category: "Employee Profile",
      };
    }

    return {
      answer: `Your reporting manager is ${managerName}.`,
      category: "Employee Profile",
      suggestedQuestions: [
        "What is my department?",
        "How do I update my profile?",
      ],
    };
  }

  // ─────────────────────────────────────────────────────────────
  // Intent: Department
  // ─────────────────────────────────────────────────────────────
  if (intentResult.intent === "my_department") {
    if (!user.employeeId) {
      return {
        answer: "No employee profile is linked to your user account. Please contact HR.",
        category: "Employee Profile",
      };
    }

    const departmentName = await getUserDepartment(user.employeeId);
    if (!departmentName) {
      return {
        answer: "No department is currently assigned to your employee profile.",
        category: "Employee Profile",
      };
    }

    return {
      answer: `You belong to the ${departmentName} department.`,
      category: "Employee Profile",
      suggestedQuestions: [
        "Who is my manager?",
        "What are the office hours?",
      ],
    };
  }

  // ─────────────────────────────────────────────────────────────
  // Step 2: Deterministic FAQ Matching
  // ─────────────────────────────────────────────────────────────
  const faqMatch = await matchFaq(message);
  if (faqMatch.matched && faqMatch.faq) {
    const suggested: string[] = [];
    if (faqMatch.competingFaqs && faqMatch.competingFaqs.length > 0) {
      for (const comp of faqMatch.competingFaqs) {
        suggested.push(comp.question);
      }
    }

    return {
      answer: faqMatch.faq.answer,
      category: faqMatch.faq.category,
      policySource: faqMatch.faq.policySource,
      suggestedQuestions: suggested.length > 0 ? suggested : DEFAULT_SUGGESTIONS.slice(0, 3),
    };
  }

  // ─────────────────────────────────────────────────────────────
  // Step 3: Polite Fallback (Low-confidence or Unrecognized)
  // ─────────────────────────────────────────────────────────────
  return {
    answer: "I can help with HR topics such as leave, payslips, attendance and company policies. Please try rephrasing your question or select one of the suggested topics below.",
    category: "General HR",
    suggestedQuestions: DEFAULT_SUGGESTIONS,
  };
}

