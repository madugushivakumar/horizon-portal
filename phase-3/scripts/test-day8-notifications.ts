/**
 * Horizon Portal — Day 8 Notifications & Announcements Verification Test Suite
 * scripts/test-day8-notifications.ts
 *
 * Comprehensive Phase 2 Day 8 Automated Test Suite covering:
 * A. Announcement Seeding & Schema Integrity (Requirements 1-6)
 * B. Authentication, Authorization & Privacy Boundaries (Requirements 7-14)
 * C. Read / Unread Status & Persistent State (Requirements 15-23)
 * D. Reusable notify() Helper & Deduplication (Requirements 24-29)
 * E. Day 6 Leave Integration & Manager Resolution (Requirements 30-38)
 * F. UI Components, TopBar Bell & Regression Checks (Requirements 39-46)
 */

import { prisma } from "../src/lib/prisma";
import { createAuthToken } from "../src/lib/auth/token";
import { SESSION_COOKIE_NAME } from "../src/lib/auth/session";
import { notify } from "../src/lib/notifications/notify";
import {
  seedAnnouncements,
  validateAnnouncement,
  ANNOUNCEMENTS_SOURCE_PATH,
} from "../src/lib/announcements/seed";
import { GET as getNotifications } from "../src/app/api/v1/notifications/route";
import { POST as markNotificationRead } from "../src/app/api/v1/notifications/[id]/read/route";
import { POST as submitLeaveRequest } from "../src/app/api/v1/leave/requests/route";
import { NextRequest } from "next/server";
import fs from "fs";

// Ensure AUTH_SECRET is set for token signing
if (!process.env.AUTH_SECRET) {
  process.env.AUTH_SECRET = "test-jwt-secret-horizon-portal-phase-2-day-8-secure-key";
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
  }
  if (body) {
    headers.set("content-type", "application/json");
  }

  const init: any = {
    method,
    headers,
  };
  if (body) {
    init.body = JSON.stringify(body);
  }

  return new NextRequest(new URL(url, "http://localhost:3000"), init);
}

async function runDay8Tests() {
  console.log("=========================================================================");
  console.log("   HORIZON PORTAL — DAY 8 NOTIFICATIONS & ANNOUNCEMENTS TEST SUITE       ");
  console.log("=========================================================================\n");

  // Lookup demo test users
  const userEmp = await prisma.user.findFirst({
    where: { email: "employee@growmar.com" },
  });
  const userMgr = await prisma.user.findFirst({
    where: { email: "manager@growmar.com" },
  });
  const userHR = await prisma.user.findFirst({
    where: { email: "hr@growmar.com" },
  });

  if (!userEmp || !userMgr || !userHR) {
    throw new Error("Required demo users (employee, manager, hr) not found in dev.db.");
  }

  const tokenEmp = await createAuthToken({
    sub: userEmp.id,
    email: userEmp.email,
    role: userEmp.role,
    name: userEmp.name,
    employeeId: userEmp.employeeId,
  });

  const tokenMgr = await createAuthToken({
    sub: userMgr.id,
    email: userMgr.email,
    role: userMgr.role,
    name: userMgr.name,
    employeeId: userMgr.employeeId,
  });

  const tokenHR = await createAuthToken({
    sub: userHR.id,
    email: userHR.email,
    role: userHR.role,
    name: userHR.name,
    employeeId: userHR.employeeId,
  });

  // ─────────────────────────────────────────────────────────────────────────
  // A. Announcement Seeding & Schema Integrity
  // ─────────────────────────────────────────────────────────────────────────
  console.log("--- A. Announcement Seeding & Schema Integrity ---");

  assert(fs.existsSync(ANNOUNCEMENTS_SOURCE_PATH), `Source announcements.json exists at ${ANNOUNCEMENTS_SOURCE_PATH}`);

  const rawAnnouncements = JSON.parse(fs.readFileSync(ANNOUNCEMENTS_SOURCE_PATH, "utf-8"));
  assert(Array.isArray(rawAnnouncements), "Source file contains an array of announcements");
  assert(rawAnnouncements.length === 8, `Source file contains exactly 8 announcements (Got: ${rawAnnouncements.length})`);

  // Schema validation checks
  const sampleValid = validateAnnouncement(rawAnnouncements[0], 0);
  assert(sampleValid !== null, "First source record passes schema validation");
  assert(sampleValid?.id === "AN-001", `Sample announcement ID mapped correctly: ${sampleValid?.id}`);
  assert(sampleValid?.category === "General", `Sample announcement category mapped: ${sampleValid?.category}`);

  // Test malformed record rejection
  const malformedRecord = validateAnnouncement({ announcement_id: "AN-BAD" }, 99);
  assert(malformedRecord === null, "Malformed record missing required fields is rejected");

  // Seed execution & idempotency
  const seedResult1 = await seedAnnouncements(prisma);
  assert(seedResult1.upsertedCount === 8, `Seed execution upserted all 8 announcements (Got: ${seedResult1.upsertedCount})`);
  assert(seedResult1.rejectedCount === 0, `Zero announcements rejected during seeding (Got: ${seedResult1.rejectedCount})`);

  // Run seed a second time to verify idempotency
  const seedResult2 = await seedAnnouncements(prisma);
  assert(seedResult2.upsertedCount === 8, "Running seed twice completes successfully");

  const totalInDb = await prisma.announcement.count();
  assert(totalInDb === 8, `Database announcement count strictly equals 8 after double seed (Got: ${totalInDb})`);

  // Verify fields in database
  const an002 = await prisma.announcement.findUnique({ where: { id: "AN-002" } });
  assert(an002?.title === "Q3 Payroll Calendar", `AN-002 title in DB matches source: "${an002?.title}"`);
  assert(an002?.category === "Payroll", `AN-002 category in DB matches: "${an002?.category}"`);

  // ─────────────────────────────────────────────────────────────────────────
  // B. Authentication, Authorization & Privacy Boundaries
  // ─────────────────────────────────────────────────────────────────────────
  console.log("\n--- B. Authentication & Privacy Boundaries ---");

  // 1. Unauthenticated GET /api/v1/notifications
  const unauthGetReq = createMockRequest("http://localhost:3000/api/v1/notifications", "GET");
  const unauthGetRes = await getNotifications(unauthGetReq);
  assert(unauthGetRes.status === 401, `Unauthenticated GET returns HTTP 401 (Got: ${unauthGetRes.status})`);

  // 2. Unauthenticated POST mark as read
  const unauthPostReq = createMockRequest("http://localhost:3000/api/v1/notifications/dummy-id/read", "POST");
  const unauthPostRes = await markNotificationRead(unauthPostReq, { params: Promise.resolve({ id: "dummy-id" }) });
  assert(unauthPostRes.status === 401, `Unauthenticated mark-as-read returns HTTP 401 (Got: ${unauthPostRes.status})`);

  // 3. Cache control headers
  const cacheControl = unauthGetRes.headers.get("Cache-Control") || "";
  assert(cacheControl.includes("private") && cacheControl.includes("no-store"), `Cache-Control includes private and no-store: "${cacheControl}"`);

  // Clean slate for test notifications
  await prisma.notification.deleteMany({
    where: { userId: { in: [userEmp.id, userMgr.id, userHR.id] } },
  });

  // Create private notification for userEmp and userMgr
  const notifEmp = await prisma.notification.create({
    data: {
      userId: userEmp.id,
      title: "Employee Secret Alert",
      message: "Personal notification strictly for employee.",
      isRead: false,
    },
  });

  const notifMgr = await prisma.notification.create({
    data: {
      userId: userMgr.id,
      title: "Manager Confidential Briefing",
      message: "Private update strictly for manager.",
      isRead: false,
    },
  });

  // Authenticated GET for userEmp
  const empGetReq = createMockRequest("http://localhost:3000/api/v1/notifications", "GET", tokenEmp);
  const empGetRes = await getNotifications(empGetReq);
  assert(empGetRes.status === 200, `Authenticated GET returns HTTP 200 (Got: ${empGetRes.status})`);

  const empData = await empGetRes.json();
  const empNotifs: Array<{ id: string; title: string }> = empData.notifications || [];

  assert(empNotifs.some((n) => n.id === notifEmp.id), "User A receives their own personal notification");
  assert(!empNotifs.some((n) => n.id === notifMgr.id), "User A CANNOT see User B's notification (Strict isolation)");

  // Verify company announcements are included and isolated from unread count
  assert(Array.isArray(empData.announcements), "Announcements are returned in separate collection");
  assert(empData.announcements.length === 8, `Announcements count equals 8 (Got: ${empData.announcements.length})`);
  assert(empData.unreadCount === 1, `Personal unread count is 1 (excludes announcements) (Got: ${empData.unreadCount})`);

  // Check no sensitive fields leaked (announcement AN-005 legitimately contains "Never share your password")
  const serialized = JSON.stringify(empData);
  assert(
    !serialized.includes("passwordHash") &&
      !serialized.includes("password_hash") &&
      !serialized.includes("$2a$") &&
      !serialized.includes("$2b$"),
    "Response does not leak password hashes or bcrypt credentials"
  );
  assert(!serialized.includes("salary"), "Response does not leak salary information");
  assert(
    !empNotifs.some((n: any) => n.password || n.passwordHash || n.password_hash),
    "Notification objects contain no credential fields"
  );

  // 4. Cross-User Mark As Read Protection
  const crossUserReq = createMockRequest(
    `http://localhost:3000/api/v1/notifications/${notifMgr.id}/read`,
    "POST",
    tokenEmp
  );
  const crossUserRes = await markNotificationRead(crossUserReq, {
    params: Promise.resolve({ id: notifMgr.id }),
  });
  assert(crossUserRes.status === 404, `User A attempting to mark User B's notification returns HTTP 404 (Got: ${crossUserRes.status})`);

  // Verify target notification remained unread
  const targetCheck = await prisma.notification.findUnique({ where: { id: notifMgr.id } });
  assert(targetCheck?.isRead === false, "Cross-user attempt did NOT modify target notification's read status");

  const crossUserJson = await crossUserRes.json();
  assert(!JSON.stringify(crossUserJson).includes("Manager Confidential Briefing"), "404 error response does not leak foreign title or message");

  // ─────────────────────────────────────────────────────────────────────────
  // C. Read / Unread Behavior & State Persistence
  // ─────────────────────────────────────────────────────────────────────────
  console.log("\n--- C. Read / Unread Behavior & Persistence ---");

  assert(notifEmp.isRead === false, "Newly created notification defaults to isRead: false");

  // Mark personal notification as read
  const markReq = createMockRequest(
    `http://localhost:3000/api/v1/notifications/${notifEmp.id}/read`,
    "POST",
    tokenEmp
  );
  const markRes = await markNotificationRead(markReq, {
    params: Promise.resolve({ id: notifEmp.id }),
  });
  assert(markRes.status === 200, `Mark as read succeeds with HTTP 200 (Got: ${markRes.status})`);

  const markData = await markRes.json();
  assert(markData.notification?.isRead === true, "Returned notification state is isRead: true");
  assert(markData.unreadCount === 0, `Unread count decremented to 0 (Got: ${markData.unreadCount})`);

  // Verify persistence in DB
  const persistedEmp = await prisma.notification.findUnique({ where: { id: notifEmp.id } });
  assert(persistedEmp?.isRead === true, "Database confirms persisted isRead: true");

  // Idempotency: Mark as read again
  const repeatMarkRes = await markNotificationRead(markReq, {
    params: Promise.resolve({ id: notifEmp.id }),
  });
  assert(repeatMarkRes.status === 200, `Second mark as read is idempotent and returns HTTP 200 (Got: ${repeatMarkRes.status})`);
  const repeatMarkData = await repeatMarkRes.json();
  assert(repeatMarkData.unreadCount === 0, `Unread count remains 0, never negative (Got: ${repeatMarkData.unreadCount})`);

  // Nonexistent ID handling
  const nonexistentReq = createMockRequest(
    "http://localhost:3000/api/v1/notifications/nonexistent-id-9999/read",
    "POST",
    tokenEmp
  );
  const nonexistentRes = await markNotificationRead(nonexistentReq, {
    params: Promise.resolve({ id: "nonexistent-id-9999" }),
  });
  assert(nonexistentRes.status === 404, `Nonexistent notification ID returns HTTP 404 (Got: ${nonexistentRes.status})`);

  // ─────────────────────────────────────────────────────────────────────────
  // D. Reusable notify() Helper & Deduplication
  // ─────────────────────────────────────────────────────────────────────────
  console.log("\n--- D. Reusable notify() Helper & Deduplication ---");

  const notifyRes = await notify({
    userId: userEmp.id,
    title: "System Update Complete",
    message: "Your profile preferences have been successfully synchronized.",
    eventKey: "sync_event_001",
  });

  assert(notifyRes.success === true, "notify() succeeds for valid recipient");
  assert(notifyRes.deduplicated === false, "First dispatch has deduplicated: false");
  assert(Boolean(notifyRes.notification?.id), "Returned notification has generated ID");
  assert(notifyRes.notification?.title === "System Update Complete", "Title persisted correctly");

  // Deduplication check: call with same eventKey
  const duplicateRes = await notify({
    userId: userEmp.id,
    title: "System Update Complete (Retry)",
    message: "Duplicate sync attempt.",
    eventKey: "sync_event_001",
  });
  assert(duplicateRes.success === true, "Duplicate call succeeds safely");
  assert(duplicateRes.deduplicated === true, "Duplicate call identified with deduplicated: true");
  assert(duplicateRes.notification?.id === notifyRes.notification?.id, "Returned notification ID matches original record");

  // Title length validation
  const longTitle = "A".repeat(201);
  const invalidTitleRes = await notify(userEmp.id, longTitle, "Valid message");
  assert(invalidTitleRes.success === false, "Title exceeding 200 characters is rejected");

  // Message length validation
  const emptyMsgRes = await notify(userEmp.id, "Valid Title", "");
  assert(emptyMsgRes.success === false, "Empty message is rejected");

  // Nonexistent recipient check
  const nonExistentUserRes = await notify("non_existent_usr_xyz", "Title", "Message");
  assert(nonExistentUserRes.success === false, "Non-existent recipient returns success: false");

  // ─────────────────────────────────────────────────────────────────────────
  // E. Leave Integration & Manager Resolution
  // ─────────────────────────────────────────────────────────────────────────
  console.log("\n--- E. Leave Integration & Manager Resolution ---");

  // Clean prior test leave requests and manager notifications
  const testStartDate = "2026-11-25";
  const testEndDate = "2026-11-25";

  await prisma.leaveRequest.deleteMany({
    where: {
      employeeId: "EMP-0188",
      startDate: new Date(`${testStartDate}T00:00:00.000Z`),
    },
  });

  const priorManagerNotifs = await prisma.notification.count({
    where: { userId: userMgr.id },
  });

  // Submit valid leave request as employee EMP-0188 (manager is EMP-0547 / userMgr)
  const leaveReq = createMockRequest(
    "http://localhost:3000/api/v1/leave/requests",
    "POST",
    tokenEmp,
    {
      leaveTypeCode: "CL",
      startDate: testStartDate,
      endDate: testEndDate,
      reason: "Automated Day 8 Leave Notification Test",
    }
  );

  const leaveRes = await submitLeaveRequest(leaveReq);
  assert(leaveRes.status === 201, `Valid leave request succeeds with HTTP 201 (Got: ${leaveRes.status})`);

  const leaveData = await leaveRes.json();
  const createdLeaveId = leaveData.data?.id;
  assert(Boolean(createdLeaveId), `Leave request created with ID: ${createdLeaveId}`);

  // Verify manager received the notification
  const currentManagerNotifs = await prisma.notification.findMany({
    where: { userId: userMgr.id },
    orderBy: { createdAt: "desc" },
  });

  assert(
    currentManagerNotifs.length > priorManagerNotifs,
    `Manager received a new notification (Previous: ${priorManagerNotifs}, Now: ${currentManagerNotifs.length})`
  );

  const leaveNotif = currentManagerNotifs.find((n) =>
    n.eventKey === `leave_request:${createdLeaveId}`
  );
  assert(Boolean(leaveNotif), `Manager notification exists with eventKey 'leave_request:${createdLeaveId}'`);
  assert(
    Boolean(leaveNotif?.title.includes("Leave Request")),
    `Notification title relates to leave: "${leaveNotif?.title}"`
  );
  assert(
    Boolean(leaveNotif?.message.includes("2026-11-25")),
    `Notification message mentions requested date: "${leaveNotif?.message}"`
  );

  // Negative validation: Invalid date should NOT trigger notifications
  const badDateReq = createMockRequest(
    "http://localhost:3000/api/v1/leave/requests",
    "POST",
    tokenEmp,
    {
      leaveTypeCode: "CL",
      startDate: "2026-11-28",
      endDate: "2026-11-25", // Backwards date
    }
  );
  const managerCountBefore = await prisma.notification.count({ where: { userId: userMgr.id } });
  const badDateRes = await submitLeaveRequest(badDateReq);
  assert(badDateRes.status === 400, "Backwards date is rejected with HTTP 400");
  const managerCountAfter = await prisma.notification.count({ where: { userId: userMgr.id } });
  assert(managerCountBefore === managerCountAfter, "Failed validation attempt did NOT create any notification");

  // Clean up created leave request
  await prisma.leaveRequest.deleteMany({
    where: { id: createdLeaveId },
  });
  await prisma.leaveBalance.update({
    where: { employeeId: "EMP-0188" },
    data: { pendingDays: { decrement: 1 } },
  });

  // ─────────────────────────────────────────────────────────────────────────
  // F. UI Components, TopBar Bell & Regression Checks
  // ─────────────────────────────────────────────────────────────────────────
  console.log("\n--- F. UI Components, TopBar Bell & Regression Checks ---");

  // Verify Notifications page and inbox component exist
  assert(fs.existsSync("src/app/notifications/page.tsx"), "src/app/notifications/page.tsx exists");
  assert(fs.existsSync("src/components/notifications/NotificationsInbox.tsx"), "src/components/notifications/NotificationsInbox.tsx exists");

  // Inspect TopBar.tsx has notifications bell and badge
  const topBarContent = fs.readFileSync("src/components/layout/TopBar.tsx", "utf-8");
  assert(topBarContent.includes('href="/notifications"'), "TopBar contains Link to /notifications");
  assert(topBarContent.includes("topbar-notifications-bell"), "TopBar bell element has stable identifier 'topbar-notifications-bell'");
  assert(topBarContent.includes("topbar-unread-badge"), "TopBar includes unread badge element 'topbar-unread-badge'");
  assert(topBarContent.includes("horizon:notifications-updated"), "TopBar listens for 'horizon:notifications-updated' real-time event");

  // Inspect NotificationsInbox.tsx
  const inboxContent = fs.readFileSync("src/components/notifications/NotificationsInbox.tsx", "utf-8");
  assert(inboxContent.includes("Personal Inbox"), "Inbox renders Personal Inbox section");
  assert(inboxContent.includes("Company Announcements"), "Inbox renders Company Announcements section");
  assert(inboxContent.includes("handleMarkAsRead"), "Inbox implements handleMarkAsRead handler");

  // Database audit check
  const fkViolations = await prisma.$queryRawUnsafe<unknown[]>("PRAGMA foreign_key_check;");
  assert(fkViolations.length === 0, `Database referential integrity: 0 foreign key violations (Got: ${fkViolations.length})`);

  console.log("\n=========================================================================");
  console.log(`TOTAL DAY 8 TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log("=========================================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runDay8Tests()
  .catch((err) => {
    console.error("Day 8 test suite execution failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
