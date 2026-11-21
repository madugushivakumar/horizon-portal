/**
 * HR Assistant — Intent Classifier
 * src/lib/assistant/intent-classifier.ts
 *
 * Deterministic intent classifier respecting strict precedence:
 * 1. Unauthorized sensitive data requests (salary_of_other) -> Immediate safe refusal
 * 2. Personal authenticated queries (leave_balance, payslip_status, my_manager, my_department)
 * 3. Conversational intents (greet, thanks, goodbye, help)
 * 4. General HR FAQ queries -> routed to FAQ matcher
 * 5. Out of scope / fallback
 */

import { normalizeText, tokenize, extractKeywords, containsAnyPhrase } from "./nlp";

export type AssistantIntent =
  | "salary_of_other"
  | "leave_balance"
  | "payslip_status"
  | "my_manager"
  | "my_department"
  | "greet"
  | "thanks"
  | "goodbye"
  | "help"
  | "faq"
  | "out_of_scope";

export interface IntentClassificationResult {
  intent: AssistantIntent;
  confidence: number;
  isPersonalData: boolean;
  isRefusal: boolean;
  refusalReason?: string;
  extractedKeywords: string[];
}

/**
 * Keywords indicating compensation or payroll queries
 */
const COMPENSATION_KEYWORDS = [
  "salary", "pay", "compensation", "payslip", "pay-slip", "pay slip",
  "wage", "wages", "remuneration", "ctc", "package", "earnings", "earn", "earns"
];

/**
 * Indicators referencing others (names, IDs, third-person pronouns, colleague references)
 */
const OTHER_PERSON_INDICATORS = [
  "colleague", "colleagues", "coworker", "coworkers", "peer", "peers",
  "another", "someone", "anyone", "other", "others", "boss", "manager",
  "teammate", "teammates", "employee", "emp", "worker", "rahul", "sanjay",
  "imran", "hemanth", "hemant", "sasi", "priya", "amit", "vikram", "ananya"
];

/**
 * Possessive self-ownership words (excludes 'me' which is an object pronoun used in 'tell me')
 */
const FIRST_PERSON_OWNERSHIP = [
  "my", "mine", "myself", "own"
];

/**
 * Detects whether a query seeks compensation or payroll details of someone else.
 */
function isSalaryOfOtherQuery(normalized: string, tokens: string[]): boolean {
  const hasComp = tokens.some((t) => COMPENSATION_KEYWORDS.includes(t));
  if (!hasComp) {
    return false;
  }

  // Check for employee ID patterns like "emp-0099", "emp 102", "employee 102", "#102"
  const hasEmpIdRef = /\b(emp|employee)\s*[-#]?\s*\d+\b/i.test(normalized) || /\bemp-\w+\b/i.test(normalized);
  if (hasEmpIdRef) {
    if (!containsAnyPhrase(normalized, ["my employee id", "my employee number"])) {
      return true;
    }
  }

  // Check for possessive patterns: "word's salary", "word s salary", "word's compensation"
  const possessiveMatch = normalized.match(/(\w+)(?:'s|\s+s)\s+(salary|pay|payslip|compensation|ctc|package|earnings|wage|wages)/);
  if (possessiveMatch) {
    const owner = possessiveMatch[1].toLowerCase();
    if (!FIRST_PERSON_OWNERSHIP.includes(owner)) {
      return true;
    }
  }

  // Check "salary/payslip/compensation of <name/person>"
  const ofMatch = normalized.match(/(salary|pay|payslip|compensation|ctc|package|earnings|wage|wages)\s+of\s+(\w+)/);
  if (ofMatch) {
    const target = ofMatch[2].toLowerCase();
    if (!FIRST_PERSON_OWNERSHIP.includes(target) && target !== "mine") {
      return true;
    }
  }

  // Check "how much does <person> earn / make"
  const earnMatch = normalized.match(/how much does\s+(\w+)\s+(earn|make|get paid)/);
  if (earnMatch) {
    const person = earnMatch[1].toLowerCase();
    if (!FIRST_PERSON_OWNERSHIP.includes(person)) {
      return true;
    }
  }

  // Check combination of compensation keyword + other person indicator
  const hasOtherRef = tokens.some((t) => OTHER_PERSON_INDICATORS.includes(t));
  if (hasOtherRef) {
    // If referencing another entity, check if it's explicitly about user's own data or other's data
    const isExplicitOwnData = containsAnyPhrase(normalized, [
      "my payslip", "my latest payslip", "my last payslip", "my salary slip", "my own salary", "my own payslip"
    ]);

    if (!isExplicitOwnData) {
      return true;
    }
  }

  return false;
}

/**
 * Classifies an incoming user question into an AssistantIntent.
 */
export function classifyIntent(message: string): IntentClassificationResult {
  const normalized = normalizeText(message);
  const tokens = tokenize(normalized);
  const keywords = extractKeywords(normalized);

  // Default empty or whitespace input
  if (!normalized || tokens.length === 0) {
    return {
      intent: "out_of_scope",
      confidence: 0.0,
      isPersonalData: false,
      isRefusal: false,
      extractedKeywords: [],
    };
  }

  // ─────────────────────────────────────────────────────────────
  // 1. Critical Security Precedence: Refuse salary/payslip of other employees
  // ─────────────────────────────────────────────────────────────
  if (isSalaryOfOtherQuery(normalized, tokens)) {
    return {
      intent: "salary_of_other",
      confidence: 1.0,
      isPersonalData: false,
      isRefusal: true,
      refusalReason: "Salary or payslip information for other employees is private and confidential.",
      extractedKeywords: keywords,
    };
  }

  // ─────────────────────────────────────────────────────────────
  // 2. Personal Authenticated Queries
  // ─────────────────────────────────────────────────────────────

  // Leave balance queries: "my leave balance", "how many leaves do i have left", "my remaining leaves"
  const isPersonalLeaveBalance =
    containsAnyPhrase(normalized, [
      "my leave balance", "my leaves", "my remaining leave", "my remaining leaves",
      "how many leaves do i have", "how many days leave do i have", "available leave balance",
      "show my leave balance", "what is my leave balance", "my sick leave balance",
      "my casual leave balance", "my earned leave balance", "my available leaves"
    ]) || (
      tokens.includes("leave") &&
      (tokens.includes("balance") || tokens.includes("remaining") || tokens.includes("left")) &&
      tokens.some((t) => FIRST_PERSON_OWNERSHIP.includes(t))
    );

  if (isPersonalLeaveBalance) {
    return {
      intent: "leave_balance",
      confidence: 0.95,
      isPersonalData: true,
      isRefusal: false,
      extractedKeywords: keywords,
    };
  }

  // Personal payslip queries: "my payslip", "show my latest payslip", "where can i find my payslip", "my salary slip"
  const isPersonalPayslip =
    containsAnyPhrase(normalized, [
      "my payslip", "my latest payslip", "my last payslip", "my salary slip",
      "where can i find my payslip", "where can i view my latest payslip", "where is my payslip",
      "show my payslip", "show my latest payslip", "view my payslip", "download my payslip",
      "my pay slip", "my recent payslip"
    ]) || (
      (tokens.includes("payslip") || tokens.includes("salary slip") || (tokens.includes("pay") && tokens.includes("slip"))) &&
      (tokens.some((t) => FIRST_PERSON_OWNERSHIP.includes(t)) || containsAnyPhrase(normalized, ["latest", "last", "recent"]))
    );

  if (isPersonalPayslip) {
    return {
      intent: "payslip_status",
      confidence: 0.95,
      isPersonalData: true,
      isRefusal: false,
      extractedKeywords: keywords,
    };
  }

  // Manager query: "who is my manager", "my reporting manager"
  const isMyManager =
    containsAnyPhrase(normalized, [
      "who is my manager", "my manager", "my reporting manager", "who do i report to"
    ]);

  if (isMyManager) {
    return {
      intent: "my_manager",
      confidence: 0.95,
      isPersonalData: true,
      isRefusal: false,
      extractedKeywords: keywords,
    };
  }

  // Department query: "what is my department", "my department"
  const isMyDepartment =
    containsAnyPhrase(normalized, [
      "what is my department", "which department am i in", "my department"
    ]);

  if (isMyDepartment) {
    return {
      intent: "my_department",
      confidence: 0.95,
      isPersonalData: true,
      isRefusal: false,
      extractedKeywords: keywords,
    };
  }

  // ─────────────────────────────────────────────────────────────
  // 3. Conversational Intents
  // ─────────────────────────────────────────────────────────────

  // Greeting
  if (
    containsAnyPhrase(normalized, ["hello", "hi", "hey", "good morning", "good afternoon", "good evening", "greetings"]) &&
    tokens.length <= 4
  ) {
    return {
      intent: "greet",
      confidence: 0.95,
      isPersonalData: false,
      isRefusal: false,
      extractedKeywords: keywords,
    };
  }

  // Thanks
  if (
    containsAnyPhrase(normalized, ["thank you", "thanks", "thx", "appreciate it", "thank you very much"]) &&
    tokens.length <= 4
  ) {
    return {
      intent: "thanks",
      confidence: 0.95,
      isPersonalData: false,
      isRefusal: false,
      extractedKeywords: keywords,
    };
  }

  // Goodbye
  if (
    containsAnyPhrase(normalized, ["bye", "goodbye", "see you", "cya", "take care", "have a good day"]) &&
    tokens.length <= 4
  ) {
    return {
      intent: "goodbye",
      confidence: 0.95,
      isPersonalData: false,
      isRefusal: false,
      extractedKeywords: keywords,
    };
  }

  // Help
  if (
    (containsAnyPhrase(normalized, ["help", "what can you do", "commands", "menu", "assist me"]) && tokens.length <= 4) ||
    normalized === "help"
  ) {
    return {
      intent: "help",
      confidence: 0.95,
      isPersonalData: false,
      isRefusal: false,
      extractedKeywords: keywords,
    };
  }

  // ─────────────────────────────────────────────────────────────
  // 4. Fallback to General FAQ
  // ─────────────────────────────────────────────────────────────
  return {
    intent: "faq",
    confidence: 0.5,
    isPersonalData: false,
    isRefusal: false,
    extractedKeywords: keywords,
  };
}
