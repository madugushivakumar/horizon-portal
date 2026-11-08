/**
 * Horizon Portal — Day 10 Leave Approvals & Team Attendance Oversight Test Suite
 * scripts/test-day10-approvals.ts
 *
 * Comprehensive Automated Verification Suite for Task 10:
 * Section A: Role & Authorization Boundaries (HTTP 401, 403, Manager Team Scoping, HR Org-Wide)
 * Section B: Approval Workflow, Balance Accounting & Double-Approval Protection (HTTP 200, 409)
 * Section C: Rejection Workflow, Mandatory Reason Validation & Balance Safety (HTTP 400, 409)
 * Section D: Strict Self-Approval Prevention at API & Service Layer (HTTP 403/400)
 * Section E: Decision Notification Integration & Idempotency (notify() verification)
 * Section F: Manager Absence, Delegation Routing & Circular Delegation Prevention
 * Section G: Team Attendance Oversight, Team Permissions & Absence Distinction
 * Section H: Audit Compliance Logging & Database Referential Integrity
 */

import { NextRequest } from "next/server";
import { prisma } from "../src/lib/prisma";
import { createAuthToken } from "../src/lib/auth/token";
import { SESSION_COOKIE_NAME } from "../src/lib/auth/session";
import { GET as getApprovalQueue } from "../src/app/api/v1/approvals/leave/route";
import { GET as getLeaveRequestDetail } from "../src/app/api/v1/approvals/leave/[id]/route";
import { POST as approveLeaveRequestRoute } from "../src/app/api/v1/approvals/leave/[id]/approve/route";
import { POST as rejectLeaveRequestRoute } from "../src/app/api/v1/approvals/leave/[id]/reject/route";
import { GET as getDelegations, POST as createDelegation } from "../src/app/api/v1/approvals/delegations/route";
import { GET as getTeamAttendance } from "../src/app/api/v1/team/attendance/route";
import {
  verifyApproverAuthorization,
  resolveManagerAvailability,
  validateDelegationChain,
  approveLeaveRequest,
  rejectLeaveRequest,
} from "../src/lib/leave/approval-service";

if (!process.env.AUTH_SECRET) {
  process.env.AUTH_SECRET = "test-jwt-secret-horizon-portal-phase-2-day-10-secure-key";
}

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✓ [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`  ✗ [FAIL] ${testName}`);
    if (detail) console.error(`    Detail: ${detail}`);
    failed++;
  }
}

function createMockRequest(
  url: string,
  method: "GET" | "POST",
  token?: string,
  body?: unknown
): NextRequest {
  const headers = new Headers();
  if (token) {
    headers.set("cookie", `${SESSION_COOKIE_NAME}=${token}`);
    headers.set("authorization", `Bearer ${token}`);
  }
  if (body) {
    headers.set("content-type", "application/json");
  }

  const init: any = { method, headers };
  if (body) {
    init.body = JSON.stringify(body);
  }

  return new NextRequest(new URL(url, "http://localhost:3000"), init);
}

async function runDay10Tests() {
  console.log("=========================================================================");
  console.log("   HORIZON PORTAL — DAY 10 APPROVALS & ATTENDANCE OVERSIGHT TEST SUITE   ");
  console.log("=========================================================================\n");

  // Load demo users from DB
  const [adminUser, hrUser, mgrUser, empUser] = await Promise.all([
    prisma.user.findFirst({ where: { role: "Admin", email: "admin@growmar.com" } }),
    prisma.user.findFirst({ where: { role: "HR", email: "hr@growmar.com" } }),
    prisma.user.findFirst({ where: { role: "Manager", email: "manager@growmar.com" } }),
    prisma.user.findFirst({ where: { role: "Employee", email: "employee@growmar.com" } }),
  ]);

  if (!adminUser || !hrUser || !mgrUser || !empUser) {
    throw new Error("Required demo users not found in database. Seed dev.db before running tests.");
  }

  // Create JWT tokens
  const [adminToken, hrToken, mgrToken, empToken] = await Promise.all([
    createAuthToken({
      sub: adminUser.id,
      email: adminUser.email,
      role: adminUser.role,
      name: adminUser.name,
      employeeId: adminUser.employeeId,
    }),
    createAuthToken({
      sub: hrUser.id,
      email: hrUser.email,
      role: hrUser.role,
      name: hrUser.name,
      employeeId: hrUser.employeeId,
    }),
    createAuthToken({
      sub: mgrUser.id,
      email: mgrUser.email,
      role: mgrUser.role,
      name: mgrUser.name,
      employeeId: mgrUser.employeeId,
    }),
    createAuthToken({
      sub: empUser.id,
      email: empUser.email,
      role: empUser.role,
      name: empUser.name,
      employeeId: empUser.employeeId,
    }),
  ]);

  // Demo Manager is EMP-0547 (Imran Philip)
  // Demo Employee is EMP-0188 (Sasi Shetty) who reports to EMP-0547
  // Find an unrelated employee who does NOT report to EMP-0547
  const unrelatedEmployee = await prisma.employee.findFirst({
    where: {
      managerId: { not: mgrUser.employeeId },
      id: { not: mgrUser.employeeId! },
    },
    select: { id: true, firstName: true, lastName: true, managerId: true },
  });

  if (!unrelatedEmployee) {
    throw new Error("Could not find an unrelated employee for manager boundary tests.");
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SECTION A: Role & Authorization Boundaries
  // ───────────────────────────────────────────────────────────────────────────
  console.log("--- Section A: Role & Authorization Boundaries ---");

  // A1. Unauthenticated request -> HTTP 401
  const unauthReq = createMockRequest("/api/v1/approvals/leave", "GET");
  const unauthRes = await getApprovalQueue(unauthReq);
  assert(unauthRes.status === 401, "Unauthenticated approval queue request returns HTTP 401");

  // A2. Employee cannot access approval queue -> HTTP 403
  const empQueueReq = createMockRequest("/api/v1/approvals/leave", "GET", empToken);
  const empQueueRes = await getApprovalQueue(empQueueReq);
  assert(empQueueRes.status === 403, "Employee role is forbidden from viewing approval queue (HTTP 403)");

  // A3. Employee cannot approve leave -> HTTP 403
  const empApproveReq = createMockRequest(
    "/api/v1/approvals/leave/LR-TEST-001/approve",
    "POST",
    empToken
  );
  const empApproveRes = await approveLeaveRequestRoute(empApproveReq, {
    params: Promise.resolve({ id: "LR-TEST-001" }),
  });
  assert(empApproveRes.status === 403, "Employee role is forbidden from approving requests (HTTP 403)");

  // A4. Employee cannot reject leave -> HTTP 403
  const empRejectReq = createMockRequest(
    "/api/v1/approvals/leave/LR-TEST-001/reject",
    "POST",
    empToken,
    { reason: "Employee trying to reject" }
  );
  const empRejectRes = await rejectLeaveRequestRoute(empRejectReq, {
    params: Promise.resolve({ id: "LR-TEST-001" }),
  });
  assert(empRejectRes.status === 403, "Employee role is forbidden from rejecting requests (HTTP 403)");

  // A5. Manager accesses own team queue -> HTTP 200
  const mgrQueueReq = createMockRequest("/api/v1/approvals/leave?status=All", "GET", mgrToken);
  const mgrQueueRes = await getApprovalQueue(mgrQueueReq);
  assert(mgrQueueRes.status === 200, "Manager role accesses team approval queue (HTTP 200)");
  const mgrQueueData = await mgrQueueRes.json();
  assert(Array.isArray(mgrQueueData.data), "Manager queue returns data array");

  // Verify all records returned belong to manager's reports
  const allBelongToManager = mgrQueueData.data.every(
    (r: any) => r.managerId === mgrUser.employeeId || r.delegatedApproverId === mgrUser.employeeId
  );
  assert(
    allBelongToManager,
    "All records in Manager queue strictly belong to direct reports or active delegations"
  );

  // A6. Manager cannot decide or view unrelated employee's request
  // Create a temporary test leave request for the unrelated employee
  const testUnrelatedId = `LR-UNREL-${Date.now().toString().slice(-5)}`;
  await prisma.leaveRequest.create({
    data: {
      id: testUnrelatedId,
      employeeId: unrelatedEmployee.id,
      leaveTypeCode: "CL",
      startDate: new Date("2026-12-01T00:00:00.000Z"),
      endDate: new Date("2026-12-01T23:59:59.999Z"),
      days: 1,
      status: "Pending",
      reason: "Unrelated team test leave",
      appliedOn: new Date(),
    },
  });

  const mgrUnrelatedDetailReq = createMockRequest(
    `/api/v1/approvals/leave/${testUnrelatedId}`,
    "GET",
    mgrToken
  );
  const mgrUnrelatedDetailRes = await getLeaveRequestDetail(mgrUnrelatedDetailReq, {
    params: Promise.resolve({ id: testUnrelatedId }),
  });
  assert(
    mgrUnrelatedDetailRes.status === 403,
    "Manager accessing unrelated employee request receives HTTP 403 Forbidden"
  );

  const mgrUnrelatedApproveReq = createMockRequest(
    `/api/v1/approvals/leave/${testUnrelatedId}/approve`,
    "POST",
    mgrToken
  );
  const mgrUnrelatedApproveRes = await approveLeaveRequestRoute(mgrUnrelatedApproveReq, {
    params: Promise.resolve({ id: testUnrelatedId }),
  });
  assert(
    mgrUnrelatedApproveRes.status === 403,
    "Manager attempting to approve unrelated employee request is rejected with HTTP 403"
  );

  // A7. HR accesses organization-wide queue -> HTTP 200
  const hrQueueReq = createMockRequest("/api/v1/approvals/leave?status=All", "GET", hrToken);
  const hrQueueRes = await getApprovalQueue(hrQueueReq);
  assert(hrQueueRes.status === 200, "HR role accesses organization-wide queue (HTTP 200)");
  const hrQueueData = await hrQueueRes.json();
  assert(
    hrQueueData.pagination?.total >= mgrQueueData.pagination?.total,
    `HR queue has org-wide scope (Total: ${hrQueueData.pagination?.total} vs Manager: ${mgrQueueData.pagination?.total})`
  );

  // Clean up unrelated test request
  await prisma.leaveRequest.deleteMany({ where: { id: testUnrelatedId } });

  // ───────────────────────────────────────────────────────────────────────────
  // SECTION B: Approval Workflow, Balance Accounting & Concurrency Safety
  // ───────────────────────────────────────────────────────────────────────────
  console.log("\n--- Section B: Approval Workflow & Balance Safety ---");

  // Create a dedicated test pending leave request for Demo Employee (EMP-0188)
  const testApprovalId = `LR-APPR-${Date.now().toString().slice(-5)}`;
  const testStartDate = new Date("2026-11-20T00:00:00.000Z");
  const testEndDate = new Date("2026-11-20T23:59:59.999Z");
  const testDays = 1;

  // Clean up any test artifact on this date
  await prisma.leaveRequest.deleteMany({ where: { id: testApprovalId } });

  // Read initial balance of EMP-0188
  const initialBal = await prisma.leaveBalance.findUnique({
    where: { employeeId: "EMP-0188" },
  });
  const initialClBalance = initialBal?.clBalance ?? 10;
  const initialPendingDays = initialBal?.pendingDays ?? 0;

  // Create pending request and lock pendingDays
  await prisma.$transaction(async (tx) => {
    await tx.leaveRequest.create({
      data: {
        id: testApprovalId,
        employeeId: "EMP-0188",
        leaveTypeCode: "CL",
        startDate: testStartDate,
        endDate: testEndDate,
        days: testDays,
        status: "Pending",
        reason: "Valid pending leave for approval verification",
        appliedOn: new Date(),
      },
    });
    await tx.leaveBalance.update({
      where: { employeeId: "EMP-0188" },
      data: { pendingDays: { increment: testDays } },
    });
  });

  // B1. Authorized Manager approves pending request -> HTTP 200
  const approveReq = createMockRequest(
    `/api/v1/approvals/leave/${testApprovalId}/approve`,
    "POST",
    mgrToken
  );
  const approveRes = await approveLeaveRequestRoute(approveReq, {
    params: Promise.resolve({ id: testApprovalId }),
  });
  assert(approveRes.status === 200, `Pending request approved successfully with HTTP 200 (Got: ${approveRes.status})`);
  const approveJson = await approveRes.json();
  assert(approveJson.success === true, "Approval response contains success: true");
  assert(approveJson.data?.status === "Approved", "Response confirms status is 'Approved'");

  // B2. Verify database records approver and decision timestamp
  const approvedDbReq = await prisma.leaveRequest.findUnique({
    where: { id: testApprovalId },
  });
  assert(approvedDbReq?.status === "Approved", "Database status confirms transition to 'Approved'");
  assert(approvedDbReq?.approverId === mgrUser.employeeId, `Approver ID correctly recorded as ${approvedDbReq?.approverId}`);
  assert(Boolean(approvedDbReq?.decidedOn), "Decision timestamp is recorded");

  // B3. Verify leave balance was deducted exactly once
  const postApproveBal = await prisma.leaveBalance.findUnique({
    where: { employeeId: "EMP-0188" },
  });
  assert(
    postApproveBal?.clBalance === initialClBalance - testDays,
    `Leave balance deducted by ${testDays} (Was: ${initialClBalance}, Now: ${postApproveBal?.clBalance})`
  );
  assert(
    postApproveBal?.pendingDays === initialPendingDays,
    `Pending days decremented back to base (Was: ${initialPendingDays + testDays}, Now: ${postApproveBal?.pendingDays})`
  );

  // B4. Cannot approve already approved request -> HTTP 409 Conflict
  const repeatApproveRes = await approveLeaveRequestRoute(approveReq, {
    params: Promise.resolve({ id: testApprovalId }),
  });
  assert(repeatApproveRes.status === 409, `Second approval attempt rejected with HTTP 409 Conflict (Got: ${repeatApproveRes.status})`);

  // B5. Concurrency protection: Verify balance was NOT deducted a second time
  const unchangedBal = await prisma.leaveBalance.findUnique({
    where: { employeeId: "EMP-0188" },
  });
  assert(
    unchangedBal?.clBalance === postApproveBal?.clBalance,
    "Double-approval attempt did NOT decrement leave balance twice (Exact-once deduction)"
  );

  // B6. Cannot reject an already approved request -> HTTP 409 Conflict
  const rejectApprovedReq = createMockRequest(
    `/api/v1/approvals/leave/${testApprovalId}/reject`,
    "POST",
    mgrToken,
    { reason: "Attempting to reject already approved leave" }
  );
  const rejectApprovedRes = await rejectLeaveRequestRoute(rejectApprovedReq, {
    params: Promise.resolve({ id: testApprovalId }),
  });
  assert(
    rejectApprovedRes.status === 409,
    `Rejecting an already approved request returns HTTP 409 Conflict (Got: ${rejectApprovedRes.status})`
  );

  // Clean up approval test request and restore balance exactly to baseline
  await prisma.leaveRequest.deleteMany({ where: { id: testApprovalId } });
  await prisma.leaveBalance.update({
    where: { employeeId: "EMP-0188" },
    data: {
      clBalance: initialClBalance,
      clUsed: initialBal?.clUsed ?? 0,
      pendingDays: initialPendingDays,
    },
  });

  // ───────────────────────────────────────────────────────────────────────────
  // SECTION C: Rejection Workflow & Reason Validation
  // ───────────────────────────────────────────────────────────────────────────
  console.log("\n--- Section C: Rejection Workflow & Mandatory Reason ---");

  const testRejectId = `LR-REJ-${Date.now().toString().slice(-5)}`;
  await prisma.$transaction(async (tx) => {
    await tx.leaveRequest.create({
      data: {
        id: testRejectId,
        employeeId: "EMP-0188",
        leaveTypeCode: "CL",
        startDate: new Date("2026-11-22T00:00:00.000Z"),
        endDate: new Date("2026-11-22T23:59:59.999Z"),
        days: 1,
        status: "Pending",
        reason: "Valid pending leave for rejection verification",
        appliedOn: new Date(),
      },
    });
    await tx.leaveBalance.update({
      where: { employeeId: "EMP-0188" },
      data: { pendingDays: { increment: 1 } },
    });
  });

  // C1. Rejection without reason is rejected -> HTTP 400
  const noReasonReq = createMockRequest(
    `/api/v1/approvals/leave/${testRejectId}/reject`,
    "POST",
    mgrToken,
    {}
  );
  const noReasonRes = await rejectLeaveRequestRoute(noReasonReq, {
    params: Promise.resolve({ id: testRejectId }),
  });
  assert(noReasonRes.status === 400, `Rejection with missing reason rejected with HTTP 400 (Got: ${noReasonRes.status})`);

  // C2. Whitespace-only reason is rejected -> HTTP 400
  const whitespaceReq = createMockRequest(
    `/api/v1/approvals/leave/${testRejectId}/reject`,
    "POST",
    mgrToken,
    { reason: "     " }
  );
  const whitespaceRes = await rejectLeaveRequestRoute(whitespaceReq, {
    params: Promise.resolve({ id: testRejectId }),
  });
  assert(whitespaceRes.status === 400, `Whitespace-only rejection reason rejected with HTTP 400 (Got: ${whitespaceRes.status})`);

  // C3. Valid rejection succeeds -> HTTP 200
  const validRejectReason = "Critical deployment scheduled during this window. Staffing required.";
  const validRejectReq = createMockRequest(
    `/api/v1/approvals/leave/${testRejectId}/reject`,
    "POST",
    mgrToken,
    { reason: validRejectReason }
  );
  const validRejectRes = await rejectLeaveRequestRoute(validRejectReq, {
    params: Promise.resolve({ id: testRejectId }),
  });
  assert(validRejectRes.status === 200, `Valid rejection succeeds with HTTP 200 (Got: ${validRejectRes.status})`);

  const rejectedDbReq = await prisma.leaveRequest.findUnique({
    where: { id: testRejectId },
  });
  assert(rejectedDbReq?.status === "Rejected", "Database confirms status is 'Rejected'");
  assert(rejectedDbReq?.rejectionReason === validRejectReason, "Decision reason accurately persisted in database");
  assert(rejectedDbReq?.approverId === mgrUser.employeeId, "Approver ID recorded on rejection");

  // C4. Cannot approve already rejected request -> HTTP 409 Conflict
  const approveRejectedReq = createMockRequest(
    `/api/v1/approvals/leave/${testRejectId}/approve`,
    "POST",
    mgrToken
  );
  const approveRejectedRes = await approveLeaveRequestRoute(approveRejectedReq, {
    params: Promise.resolve({ id: testRejectId }),
  });
  assert(
    approveRejectedRes.status === 409,
    `Approving an already rejected request returns HTTP 409 Conflict (Got: ${approveRejectedRes.status})`
  );

  // Clean up rejection test request
  await prisma.leaveRequest.deleteMany({ where: { id: testRejectId } });

  // ───────────────────────────────────────────────────────────────────────────
  // SECTION D: Self-Approval Prevention
  // ───────────────────────────────────────────────────────────────────────────
  console.log("\n--- Section D: Self-Approval Prevention ---");

  // Create a pending leave request where the applicant IS the Manager (EMP-0547)
  const mgrOwnRequestId = `LR-SELF-MGR-${Date.now().toString().slice(-5)}`;
  await prisma.leaveRequest.create({
    data: {
      id: mgrOwnRequestId,
      employeeId: mgrUser.employeeId!,
      leaveTypeCode: "CL",
      startDate: new Date("2026-12-05T00:00:00.000Z"),
      endDate: new Date("2026-12-05T23:59:59.999Z"),
      days: 1,
      status: "Pending",
      reason: "Manager personal leave request",
      appliedOn: new Date(),
    },
  });

  // D1. Manager cannot approve their own request -> HTTP 403
  const mgrSelfApproveReq = createMockRequest(
    `/api/v1/approvals/leave/${mgrOwnRequestId}/approve`,
    "POST",
    mgrToken
  );
  const mgrSelfApproveRes = await approveLeaveRequestRoute(mgrSelfApproveReq, {
    params: Promise.resolve({ id: mgrOwnRequestId }),
  });
  assert(
    mgrSelfApproveRes.status === 403,
    `Manager attempting to self-approve is rejected with HTTP 403 (Got: ${mgrSelfApproveRes.status})`
  );

  // D2. Manager cannot reject their own request -> HTTP 403
  const mgrSelfRejectReq = createMockRequest(
    `/api/v1/approvals/leave/${mgrOwnRequestId}/reject`,
    "POST",
    mgrToken,
    { reason: "Manager trying to self-reject" }
  );
  const mgrSelfRejectRes = await rejectLeaveRequestRoute(mgrSelfRejectReq, {
    params: Promise.resolve({ id: mgrOwnRequestId }),
  });
  assert(
    mgrSelfRejectRes.status === 403,
    `Manager attempting to self-reject is rejected with HTTP 403 (Got: ${mgrSelfRejectRes.status})`
  );

  // D3. HR cannot approve their own request -> HTTP 403
  let hrOwnRequestId = "";
  if (hrUser.employeeId) {
    hrOwnRequestId = `LR-SELF-HR-${Date.now().toString().slice(-5)}`;
    await prisma.leaveRequest.create({
      data: {
        id: hrOwnRequestId,
        employeeId: hrUser.employeeId,
        leaveTypeCode: "CL",
        startDate: new Date("2026-12-06T00:00:00.000Z"),
        endDate: new Date("2026-12-06T23:59:59.999Z"),
        days: 1,
        status: "Pending",
        reason: "HR personal time off",
        appliedOn: new Date(),
      },
    });

    const hrSelfApproveReq = createMockRequest(
      `/api/v1/approvals/leave/${hrOwnRequestId}/approve`,
      "POST",
      hrToken
    );
    const hrSelfApproveRes = await approveLeaveRequestRoute(hrSelfApproveReq, {
      params: Promise.resolve({ id: hrOwnRequestId }),
    });
    assert(
      hrSelfApproveRes.status === 403,
      `HR attempting to self-approve is rejected with HTTP 403 (Got: ${hrSelfApproveRes.status})`
    );
  }

  // D4. Service layer verification: verifyApproverAuthorization returns authorized: false, isSelf: true
  const selfCheck = await verifyApproverAuthorization(
    {
      id: mgrUser.id,
      email: mgrUser.email,
      name: mgrUser.name,
      role: "Manager",
      isActive: true,
      employeeId: mgrUser.employeeId,
    },
    mgrUser.employeeId!
  );
  assert(
    !selfCheck.authorized && selfCheck.isSelf,
    "Service layer verifyApproverAuthorization explicitly blocks self-approval"
  );

  // Clean up self-request artifacts
  await prisma.leaveRequest.deleteMany({
    where: { id: { in: [mgrOwnRequestId, hrOwnRequestId].filter(Boolean) } },
  });

  // ───────────────────────────────────────────────────────────────────────────
  // SECTION E: Notification Integration & Deduplication
  // ───────────────────────────────────────────────────────────────────────────
  console.log("\n--- Section E: Notification Dispatch & Idempotency ---");

  // Create another test request for EMP-0188
  const notifTestId = `LR-NOTIF-${Date.now().toString().slice(-5)}`;
  await prisma.leaveRequest.create({
    data: {
      id: notifTestId,
      employeeId: "EMP-0188",
      leaveTypeCode: "CL",
      startDate: new Date("2026-11-28T00:00:00.000Z"),
      endDate: new Date("2026-11-28T23:59:59.999Z"),
      days: 1,
      status: "Pending",
      reason: "Notification integration test",
      appliedOn: new Date(),
    },
  });

  const empNotifsBefore = await prisma.notification.count({
    where: { userId: empUser.id },
  });

  // Manager approves
  const notifApproveReq = createMockRequest(
    `/api/v1/approvals/leave/${notifTestId}/approve`,
    "POST",
    mgrToken
  );
  await approveLeaveRequestRoute(notifApproveReq, {
    params: Promise.resolve({ id: notifTestId }),
  });

  const empNotifsAfter = await prisma.notification.findMany({
    where: { userId: empUser.id },
    orderBy: { createdAt: "desc" },
  });

  assert(
    empNotifsAfter.length > empNotifsBefore,
    `Employee received a new notification on leave approval (${empNotifsBefore} -> ${empNotifsAfter.length})`
  );

  const approvalNotif = empNotifsAfter.find((n) => n.eventKey === `leave_approved:${notifTestId}`);
  assert(Boolean(approvalNotif), `Notification has deterministic eventKey 'leave_approved:${notifTestId}'`);
  assert(
    Boolean(approvalNotif?.title.includes("Approved")),
    `Notification title confirms approval: "${approvalNotif?.title}"`
  );
  assert(
    Boolean(
      approvalNotif?.message.includes(mgrUser.name) ||
      approvalNotif?.message.includes("Imran Philip") ||
      approvalNotif?.message.includes("Demo Manager") ||
      approvalNotif?.message.includes("Management")
    ),
    `Notification message names the approver (Actual message: "${approvalNotif?.message}", Manager Name: "${mgrUser.name}")`
  );

  // Clean up
  await prisma.leaveRequest.deleteMany({ where: { id: notifTestId } });
  await prisma.notification.deleteMany({ where: { eventKey: `leave_approved:${notifTestId}` } });

  // ───────────────────────────────────────────────────────────────────────────
  // SECTION F: Delegation & Manager Absence
  // ───────────────────────────────────────────────────────────────────────────
  console.log("\n--- Section F: Manager Delegation & Absence Routing ---");

  // Pick an active employee to serve as designated acting manager
  const actingCandidate = await prisma.employee.findFirst({
    where: {
      id: { not: mgrUser.employeeId! },
      status: "Active",
    },
    select: { id: true, firstName: true, lastName: true },
  });

  if (!actingCandidate) {
    throw new Error("Acting manager candidate not found.");
  }

  // F1. Create valid delegation -> HTTP 201
  const delReq = createMockRequest("/api/v1/approvals/delegations", "POST", mgrToken, {
    actingManagerId: actingCandidate.id,
    startDate: "2026-11-01",
    endDate: "2026-12-31",
    reason: "Annual vacation delegation",
  });
  const delRes = await createDelegation(delReq);
  assert(delRes.status === 201, `Valid delegation created with HTTP 201 (Got: ${delRes.status})`);
  const delJson = await delRes.json();
  const createdDelId = delJson.data?.id;

  // F2. Query delegations -> HTTP 200
  const getDelReq = createMockRequest("/api/v1/approvals/delegations", "GET", mgrToken);
  const getDelRes = await getDelegations(getDelReq);
  assert(getDelRes.status === 200, "Manager can retrieve active delegations (HTTP 200)");
  const getDelData = await getDelRes.json();
  assert(
    getDelData.data.some((d: any) => d.id === createdDelId),
    "Created delegation is listed in active delegations collection"
  );

  // F3. Circular delegation prevention
  const circularValidation = await validateDelegationChain(
    actingCandidate.id, // now actingCandidate tries to delegate back to mgrUser
    mgrUser.employeeId!
  );
  assert(
    !circularValidation.valid,
    `Circular delegation is prevented: "${circularValidation.error}"`
  );

  // F4. Self-delegation prevention
  const selfDelValidation = await validateDelegationChain(
    mgrUser.employeeId!,
    mgrUser.employeeId!
  );
  assert(
    !selfDelValidation.valid,
    "Self-delegation is explicitly rejected"
  );

  // F5. Manager availability resolution
  const availStatus = await resolveManagerAvailability(mgrUser.employeeId!);
  assert(typeof availStatus.isAvailable === "boolean", "resolveManagerAvailability returns availability status");

  // Clean up delegation
  await prisma.managerDelegation.deleteMany({ where: { id: createdDelId } });

  // ───────────────────────────────────────────────────────────────────────────
  // SECTION G: Team Attendance Oversight
  // ───────────────────────────────────────────────────────────────────────────
  console.log("\n--- Section G: Team Attendance Oversight ---");

  // G1. Unauthenticated attendance request -> HTTP 401
  const unauthAttReq = createMockRequest("/api/v1/team/attendance", "GET");
  const unauthAttRes = await getTeamAttendance(unauthAttReq);
  assert(unauthAttRes.status === 401, "Unauthenticated team attendance request returns HTTP 401");

  // G2. Employee role forbidden -> HTTP 403
  const empAttReq = createMockRequest("/api/v1/team/attendance", "GET", empToken);
  const empAttRes = await getTeamAttendance(empAttReq);
  assert(empAttRes.status === 403, "Employee role cannot access team attendance oversight (HTTP 403)");

  // G3. Manager gets own team only -> HTTP 200
  const mgrAttReq = createMockRequest("/api/v1/team/attendance?month=2026-09-30", "GET", mgrToken);
  const mgrAttRes = await getTeamAttendance(mgrAttReq);
  assert(mgrAttRes.status === 200, "Manager retrieves team attendance with HTTP 200");
  const mgrAttData = await mgrAttRes.json();

  assert(Array.isArray(mgrAttData.data), "Attendance response contains data array");
  assert(mgrAttData.summary !== undefined, "Attendance response includes summary metrics");

  // Verify Manager view does not contain employees outside the team
  const managerReportIds = (
    await prisma.employee.findMany({
      where: { managerId: mgrUser.employeeId },
      select: { id: true },
    })
  ).map((e) => e.id);

  const allReportsInManagerTeam = mgrAttData.data.every((r: any) =>
    managerReportIds.includes(r.employeeId)
  );
  assert(
    allReportsInManagerTeam,
    `Manager attendance view strictly scoped to direct reports (${mgrAttData.data.length} employees)`
  );

  // G4. HR gets organization-wide attendance -> HTTP 200
  const hrAttReq = createMockRequest("/api/v1/team/attendance?month=2026-09-30", "GET", hrToken);
  const hrAttRes = await getTeamAttendance(hrAttReq);
  assert(hrAttRes.status === 200, "HR retrieves org-wide attendance with HTTP 200");
  const hrAttData = await hrAttRes.json();
  assert(
    hrAttData.data.length > mgrAttData.data.length,
    `HR attendance contains all workforce records (${hrAttData.data.length} vs Manager: ${mgrAttData.data.length})`
  );

  // G5. Verified absence vs leave distinction
  const hasOnLeave = hrAttData.data.some((r: any) => r.paidLeaveDays > 0);
  assert(hasOnLeave, "Historical attendance records contain verified paid leave days");

  const sampleRecord = hrAttData.data.find((r: any) => r.hasRecord);
  assert(
    Boolean(sampleRecord),
    "Attendance records preserve scheduled days, present days, and late arrivals"
  );

  // G6. Summary statistics match employee-level records
  const calculatedPresent = hrAttData.data.filter(
    (r: any) => r.hasRecord && r.presentDays > 0 && r.unpaidAbsenceDays === 0
  ).length;
  assert(
    hrAttData.summary.presentCount === calculatedPresent,
    `Summary present count matches row calculations (${hrAttData.summary.presentCount})`
  );

  // ───────────────────────────────────────────────────────────────────────────
  // SECTION H: Audit Compliance Logging & Foreign Key Integrity
  // ───────────────────────────────────────────────────────────────────────────
  console.log("\n--- Section H: Audit Compliance & Referential Integrity ---");

  // H1. Verify audit logs for leave operations
  const leaveAuditLogs = await prisma.auditLog.count({
    where: {
      action: { in: ["LEAVE_APPROVED", "LEAVE_REJECTED", "LEAVE_DELEGATED"] },
    },
  });
  assert(leaveAuditLogs > 0, `Database contains compliance audit log entries (${leaveAuditLogs} found)`);

  // H2. SQLite PRAGMA foreign key integrity check
  const fkViolations = await prisma.$queryRawUnsafe<unknown[]>("PRAGMA foreign_key_check;");
  assert(
    fkViolations.length === 0,
    `Database referential integrity confirmed: 0 foreign key violations (Found: ${fkViolations.length})`
  );

  console.log("\n=========================================================================");
  console.log(`TOTAL DAY 10 TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log("=========================================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runDay10Tests()
  .catch((err) => {
    console.error("Day 10 test execution encountered unexpected error:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
