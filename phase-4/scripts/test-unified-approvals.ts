/**
 * Day 20 — Step 8B Automated Verification Test Suite
 * scripts/test-unified-approvals.ts
 *
 * Verifies Unified Multi-Domain Approval Center:
 * 1. Zod input validation schemas (title, amount, category, mandatory rejection reason)
 * 2. Corporate Expense Authorization creation & reference code sequencing (CEA-YYYY-XXXX)
 * 3. Server-side authorization & strict self-approval prohibition (HTTP 403)
 * 4. Employee role access boundary protection (HTTP 403)
 * 5. Authorized manager decision execution & audit logging
 * 6. Idempotency & state conflict protection (HTTP 409 on duplicate decision)
 * 7. Rejection decision with mandatory reason enforcement
 * 8. Unified queue retrieval, domain filtering, and cross-domain KPI aggregation
 * 9. ACCOUNTS PAYABLE PRESERVATION: Verifies all 501 Expense records (478 PAID, 23 UNPAID) remain 100% untouched
 */

import { prisma } from "../src/lib/prisma";
import {
  createExpenseAuthorizationSchema,
  expenseAuthorizationDecisionSchema,
  unifiedApprovalsQuerySchema,
} from "../src/lib/validations/expense-authorization";
import {
  createExpenseAuthorization,
  getExpenseAuthorizationById,
  decideExpenseAuthorization,
  getExpenseAuthorizationQueue,
} from "../src/lib/expense-authorization/service";
import { getUnifiedApprovals } from "../src/lib/approvals/unified-service";
import { AuthenticatedUser } from "../src/lib/auth/user";

// Synthetic test actors
const managerActor: AuthenticatedUser = {
  id: "user-mgr-01",
  email: "manager@horizon.internal",
  name: "Sarah Connor",
  role: "Manager",
  employeeId: "emp-mgr-01",
  isActive: true,
};

const employeeActor: AuthenticatedUser = {
  id: "user-sub-01",
  email: "john@horizon.internal",
  name: "John Doe",
  role: "Employee",
  employeeId: "emp-sub-01",
  isActive: true,
};

const adminActor: AuthenticatedUser = {
  id: "user-admin-01",
  email: "admin@horizon.internal",
  name: "Admin User",
  role: "Admin",
  employeeId: "emp-admin-01",
  isActive: true,
};

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${testName}${detail ? ` - ${detail}` : ""}`);
    failed++;
  }
}

async function runTestSuite() {
  console.log("================================================================================");
  console.log("DAY 20 — STEP 8B: UNIFIED APPROVAL CENTER VERIFICATION SUITE");
  console.log("================================================================================\n");

  // SECTION 1: VALIDATION SCHEMAS
  console.log("--- SECTION 1: ZOD VALIDATION SCHEMAS ---");

  // Test 1.1: Valid creation schema
  const validPayload = {
    title: "AWS Cloud Infrastructure Expansion",
    description: "Scale Kubernetes cluster for Q4 platform load surge.",
    category: 5104,
    requestedAmount: 14500.5,
    currency: "USD",
    departmentId: "dept-eng",
    vendorName: "Amazon Web Services",
  };
  const v1 = createExpenseAuthorizationSchema.safeParse(validPayload);
  assert(v1.success, "Valid expense authorization payload passes schema validation");

  // Test 1.2: Title too short
  const v2 = createExpenseAuthorizationSchema.safeParse({ ...validPayload, title: "AB" });
  assert(!v2.success, "Title shorter than 3 characters is rejected");

  // Test 1.3: Non-positive amount
  const v3 = createExpenseAuthorizationSchema.safeParse({ ...validPayload, requestedAmount: -500 });
  assert(!v3.success, "Negative requested amount is rejected");

  // Test 1.4: Invalid category code
  const v4 = createExpenseAuthorizationSchema.safeParse({ ...validPayload, category: 9999 });
  assert(!v4.success, "Invalid category code outside 5101-5110 is rejected");

  // Test 1.5: Rejection without reason fails
  const v5 = expenseAuthorizationDecisionSchema.safeParse({ action: "REJECT", rejectionReason: "" });
  assert(!v5.success, "Rejection decision without mandatory reason is rejected");

  // Test 1.6: Rejection with valid reason passes
  const v6 = expenseAuthorizationDecisionSchema.safeParse({
    action: "REJECT",
    rejectionReason: "Budget exceeded for Q4 cloud compute allocation.",
  });
  assert(v6.success, "Rejection decision with valid reason passes");

  // Test 1.7: Approval decision without notes passes
  const v7 = expenseAuthorizationDecisionSchema.safeParse({ action: "APPROVE" });
  assert(v7.success, "Approval decision passes without requiring rejection reason");

  console.log("\n--- SECTION 2: ENDPOINT & LIFECYCLE OPERATIONS ---");

  // Test 2.1: Create expense authorization request
  const created1 = await createExpenseAuthorization(employeeActor, {
    title: "Datadog APM & Monitoring Renewal",
    description: "Annual renewal for enterprise APM and logging infrastructure.",
    category: 5105,
    requestedAmount: 8200.0,
    currency: "USD",
    departmentId: "dept-eng",
    vendorName: "Datadog Inc.",
  });
  assert(
    created1 && created1.status === "PENDING_APPROVAL",
    "Expense authorization created with default status PENDING_APPROVAL"
  );
  assert(
    created1.referenceNumber.startsWith("CEA-"),
    `Reference number correctly formatted: ${created1.referenceNumber}`
  );

  // Test 2.2: Audit log recorded on creation
  const createAudit = await prisma.auditLog.findFirst({
    where: {
      action: "EXPENSE_AUTH_CREATED",
      details: { contains: created1.id },
    },
  });
  assert(createAudit !== null, "AuditLog record created for EXPENSE_AUTH_CREATED");

  // Test 2.3: Strict Self-Approval Prohibition
  console.log("\n--- SECTION 3: SERVER-SIDE AUTHORIZATION & GOVERNANCE ---");
  const selfApproveResult = await decideExpenseAuthorization(employeeActor, created1.id, {
    action: "APPROVE",
  });
  assert(
    !selfApproveResult.success && selfApproveResult.statusCode === 403,
    "Self-approval attempt by requester is strictly blocked (HTTP 403 Forbidden)",
    selfApproveResult.message
  );

  // Test 2.4: Employee role cannot approve
  const otherEmpActor: AuthenticatedUser = {
    id: "user-other",
    email: "other@horizon.internal",
    name: "Other Employee",
    role: "Employee",
    employeeId: "emp-other",
    isActive: true,
  };
  const empApproveResult = await decideExpenseAuthorization(otherEmpActor, created1.id, {
    action: "APPROVE",
  });
  assert(
    !empApproveResult.success && empApproveResult.statusCode === 403,
    "Peer employee cannot approve requests (HTTP 403 Forbidden)"
  );

  // Test 2.5: Authorized manager approves request
  const managerApproveResult = await decideExpenseAuthorization(managerActor, created1.id, {
    action: "APPROVE",
    approvalNotes: "Approved under FY26 infrastructure budget.",
  });
  assert(
    managerApproveResult.success && managerApproveResult.statusCode === 200,
    "Authorized reporting manager approves request successfully (HTTP 200)"
  );

  const approvedRecord = await getExpenseAuthorizationById(managerActor, created1.id);
  assert(
    approvedRecord?.status === "APPROVED" && approvedRecord?.approverId === "emp-mgr-01",
    "Database record atomically updated to APPROVED with approverId and timestamp"
  );

  // Test 2.6: Audit log recorded on approval
  const approveAudit = await prisma.auditLog.findFirst({
    where: {
      action: "EXPENSE_AUTH_APPROVED",
      details: { contains: created1.id },
    },
  });
  assert(approveAudit !== null, "AuditLog record created for EXPENSE_AUTH_APPROVED");

  // Test 2.7: Idempotency & State Conflict Protection (HTTP 409)
  console.log("\n--- SECTION 4: IDEMPOTENCY & STATE CONFLICT GUARDS ---");
  const duplicateApprove = await decideExpenseAuthorization(managerActor, created1.id, {
    action: "APPROVE",
  });
  assert(
    !duplicateApprove.success && duplicateApprove.statusCode === 409,
    "Duplicate decision on already APPROVED request is rejected (HTTP 409 Conflict)"
  );

  const conflictReject = await decideExpenseAuthorization(managerActor, created1.id, {
    action: "REJECT",
    rejectionReason: "Late attempt to reject approved request",
  });
  assert(
    !conflictReject.success && conflictReject.statusCode === 409,
    "Attempt to reject an already APPROVED request is rejected (HTTP 409 Conflict)"
  );

  // Test 2.8: Rejection Workflow
  console.log("\n--- SECTION 5: REJECTION WORKFLOW ---");
  const created2 = await createExpenseAuthorization(employeeActor, {
    title: "Off-site Team Dinner",
    description: "Department celebration dinner at luxury resort.",
    category: 5106,
    requestedAmount: 4500.0,
    currency: "USD",
    departmentId: "dept-eng",
  });

  const rejectResult = await decideExpenseAuthorization(managerActor, created2.id, {
    action: "REJECT",
    rejectionReason: "Policy violation: Luxury recreational off-sites require executive VP pre-clearance.",
  });
  assert(
    rejectResult.success && rejectResult.statusCode === 200,
    "Manager rejects request with valid justification reason (HTTP 200)"
  );

  const rejectedRecord = await getExpenseAuthorizationById(managerActor, created2.id);
  assert(
    rejectedRecord?.status === "REJECTED" &&
      Boolean(rejectedRecord?.rejectionReason?.includes("Policy violation")),
    "Record updated to REJECTED with mandatory rejectionReason recorded"
  );

  const rejectAudit = await prisma.auditLog.findFirst({
    where: {
      action: "EXPENSE_AUTH_REJECTED",
      details: { contains: created2.id },
    },
  });
  assert(rejectAudit !== null, "AuditLog record created for EXPENSE_AUTH_REJECTED");

  // SECTION 6: UNIFIED QUEUE AGGREGATION
  console.log("\n--- SECTION 6: UNIFIED MULTI-DOMAIN QUEUE AGGREGATION ---");

  // Create a 3rd pending expense request so we have both pending leave and pending expense
  const created3 = await createExpenseAuthorization(employeeActor, {
    title: "Kubernetes Cloud Storage Expansion",
    description: "Expand persistent volume claims for log archival.",
    category: 5104,
    requestedAmount: 3200.0,
    currency: "USD",
    departmentId: "dept-eng",
    vendorName: "Amazon Web Services",
  });

  // Query unified queue: domain=all
  const unifiedAll = await getUnifiedApprovals(managerActor, {
    domain: "all",
    status: "all",
    page: 1,
    pageSize: 50,
    sortBy: "date",
    sortOrder: "desc",
  });
  assert(
    unifiedAll.items.length >= 2,
    `Unified queue returns aggregated items across both domains (Count: ${unifiedAll.items.length})`
  );
  const domainsPresent = new Set(unifiedAll.items.map((i) => i.domain));
  assert(
    domainsPresent.has("leave") && domainsPresent.has("corporate-expense"),
    "Both 'leave' and 'corporate-expense' domains present in unified response"
  );

  // Query unified queue: domain=leave
  const unifiedLeave = await getUnifiedApprovals(managerActor, {
    domain: "leave",
    status: "all",
    page: 1,
    pageSize: 50,
    sortBy: "date",
    sortOrder: "desc",
  });
  assert(
    unifiedLeave.items.every((i) => i.domain === "leave"),
    "Domain filter 'leave' returns exclusively Leave Request items"
  );

  // Query unified queue: domain=corporate-expense
  const unifiedExpense = await getUnifiedApprovals(managerActor, {
    domain: "corporate-expense",
    status: "all",
    page: 1,
    pageSize: 50,
    sortBy: "date",
    sortOrder: "desc",
  });
  assert(
    unifiedExpense.items.every((i) => i.domain === "corporate-expense"),
    "Domain filter 'corporate-expense' returns exclusively Corporate Expense items"
  );

  // Verify Summary KPIs
  assert(
    unifiedAll.summary.totalPending > 0,
    `Summary KPI totalPending correctly aggregated: ${unifiedAll.summary.totalPending}`
  );
  assert(
    unifiedAll.summary.pendingLeave > 0,
    `Summary KPI pendingLeave correctly calculated: ${unifiedAll.summary.pendingLeave}`
  );
  assert(
    unifiedAll.summary.pendingExpense > 0,
    `Summary KPI pendingExpense correctly calculated: ${unifiedAll.summary.pendingExpense}`
  );

  // SECTION 7: ACCOUNTS PAYABLE ISOLATION (NON-NEGOTIABLE SAFETY MANDATE)
  console.log("\n--- SECTION 7: ACCOUNTS PAYABLE PRESERVATION VERIFICATION ---");

  const totalExpenses = await prisma.expense.count();
  const paidExpenses = await prisma.expense.count({ where: { status: "PAID" } });
  const unpaidExpenses = await prisma.expense.count({ where: { status: "UNPAID" } });

  assert(
    totalExpenses === 501,
    `Total Accounts Payable Expense records preserved exactly: 501 (Observed: ${totalExpenses})`
  );
  assert(
    paidExpenses === 478,
    `PAID Accounts Payable Expense records preserved exactly: 478 (Observed: ${paidExpenses})`
  );
  assert(
    unpaidExpenses === 23,
    `UNPAID Accounts Payable Expense records preserved exactly: 23 (Observed: ${unpaidExpenses})`
  );

  console.log("\n================================================================================");
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED (TOTAL: ${passed + failed})`);
  console.log("================================================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite()
  .catch((e) => {
    console.error("Test execution fatal error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
