/**
 * Horizon Portal — Day 10 Screenshot Evidence Capture Script
 * scripts/capture-day10-screenshots.mjs
 *
 * Captures 7 actual running application screens using headless Microsoft Edge CDP:
 * 1. 01_leave_approval_queue.png
 * 2. 02_leave_request_details.png
 * 3. 03_rejection_reason_validation.png
 * 4. 04_approval_notification.png
 * 5. 05_team_attendance_overview.png
 * 6. 06_manager_team_access.png
 * 7. 07_hr_organization_wide_view.png
 */

import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { SignJWT } from "jose";

const prisma = new PrismaClient();

const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const evidenceDir = path.join(process.cwd(), "reports", "day-10-evidence");
const tempProfile = path.join(evidenceDir, "temp_edge_day10_profile");

let authSecret = process.env.AUTH_SECRET;
if (!authSecret && fs.existsSync(".env")) {
  const envText = fs.readFileSync(".env", "utf-8");
  const match = envText.match(/AUTH_SECRET=["']?([^"'\r\n]+)/);
  if (match) authSecret = match[1];
}
if (!authSecret) authSecret = "horizon_portal_jwt_secret_phase_2_dev_environment_key_2026";

async function makeToken(user) {
  const secretKey = new TextEncoder().encode(authSecret);
  return new SignJWT({
    email: user.email,
    role: user.role,
    name: user.name,
    employeeId: user.employeeId,
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(secretKey);
}

async function prepareTestData() {
  console.log("Preparing representative pending leave request for screenshots...");
  // Ensure EMP-0188 has a clean pending request visible in Manager (EMP-0547) queue
  const existing = await prisma.leaveRequest.findFirst({
    where: {
      employeeId: "EMP-0188",
      status: "Pending",
    },
  });

  if (!existing) {
    const testId = `LR-DEMO-${Date.now().toString().slice(-5)}`;
    await prisma.leaveRequest.create({
      data: {
        id: testId,
        employeeId: "EMP-0188",
        leaveTypeCode: "CL",
        leaveTypeId: "CL",
        startDate: new Date("2026-11-15T00:00:00.000Z"),
        endDate: new Date("2026-11-16T23:59:59.999Z"),
        days: 2,
        status: "Pending",
        reason: "Family wedding event in hometown. Staff coverage arranged with team.",
        appliedOn: new Date(),
      },
    });
    console.log("✓ Created representative pending leave request:", testId);
  }

  // Ensure EMP-0188 has a recent approval notification
  const empUser = await prisma.user.findFirst({ where: { email: "employee@growmar.com" } });
  if (empUser) {
    const notifCount = await prisma.notification.count({
      where: { userId: empUser.id, eventKey: { startsWith: "leave_approved" } },
    });
    if (notifCount === 0) {
      await prisma.notification.create({
        data: {
          userId: empUser.id,
          title: "Leave Request Approved",
          message: "Your leave request from 2026-10-15 to 2026-10-16 (2 days) has been approved by Imran Philip.",
          eventKey: "leave_approved:demo_evidence_01",
          isRead: false,
        },
      });
      console.log("✓ Created sample approval notification for employee");
    }
  }
}

async function capture() {
  await prepareTestData();

  if (!fs.existsSync(evidenceDir)) {
    fs.mkdirSync(evidenceDir, { recursive: true });
  }
  if (!fs.existsSync(tempProfile)) {
    fs.mkdirSync(tempProfile, { recursive: true });
  }

  console.log("1. Fetching demo users...");
  const [managerUser, hrUser, employeeUser] = await Promise.all([
    prisma.user.findFirst({ where: { email: "manager@growmar.com" } }),
    prisma.user.findFirst({ where: { email: "hr@growmar.com" } }),
    prisma.user.findFirst({ where: { email: "employee@growmar.com" } }),
  ]);

  if (!managerUser || !hrUser || !employeeUser) {
    throw new Error("Demo users not found in dev.db.");
  }

  const managerToken = await makeToken(managerUser);
  const hrToken = await makeToken(hrUser);
  const employeeToken = await makeToken(employeeUser);

  console.log("2. Launching headless Edge on port 9339...");
  const edge = spawn(edgePath, [
    "--headless=new",
    "--remote-debugging-port=9339",
    `--user-data-dir=${tempProfile}`,
    "--window-size=1440,950",
    "--hide-scrollbars",
    "about:blank",
  ]);

  await new Promise((r) => setTimeout(r, 2000));

  try {
    const listRes = await fetch("http://localhost:9339/json/list");
    const tabs = await listRes.json();
    const pageTab = tabs.find((t) => t.type === "page") || tabs[0];
    const wsUrl = pageTab?.webSocketDebuggerUrl;
    if (!wsUrl) throw new Error("No webSocketDebuggerUrl found on Edge CDP port 9339.");

    console.log("3. Connecting via WebSocket...");
    const ws = new WebSocket(wsUrl);

    let id = 1;
    const send = (method, params = {}) =>
      new Promise((resolve, reject) => {
        const curId = id++;
        const handler = (evt) => {
          const msg = JSON.parse(evt.data);
          if (msg.id === curId) {
            ws.removeEventListener("message", handler);
            if (msg.error) reject(msg.error);
            else resolve(msg.result);
          }
        };
        ws.addEventListener("message", handler);
        ws.send(JSON.stringify({ id: curId, method, params }));
      });

    await new Promise((resolve) => ws.addEventListener("open", resolve, { once: true }));

    await send("Network.enable");
    await send("Page.enable");

    const setSessionCookie = async (token) => {
      await send("Network.setCookie", {
        name: "horizon_session",
        value: token,
        domain: "localhost",
        path: "/",
        httpOnly: true,
        sameSite: "Lax",
      });
    };

    // ── 01. Leave Approval Queue ──
    console.log("4. Capturing 01_leave_approval_queue.png (Manager view of queue)...");
    await setSessionCookie(managerToken);
    await send("Page.navigate", { url: "http://localhost:3000/approvals" });
    await new Promise((r) => setTimeout(r, 4000));
    const shot01 = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(evidenceDir, "01_leave_approval_queue.png"), Buffer.from(shot01.data, "base64"));
    console.log("✓ Saved 01_leave_approval_queue.png");

    // ── 02. Leave Request Details Drawer ──
    console.log("5. Opening request details drawer...");
    await send("Runtime.evaluate", {
      expression: `
        const firstRow = document.querySelector("tbody tr");
        if (firstRow) firstRow.click();
      `,
    });
    await new Promise((r) => setTimeout(r, 1500));
    const shot02 = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(evidenceDir, "02_leave_request_details.png"), Buffer.from(shot02.data, "base64"));
    console.log("✓ Saved 02_leave_request_details.png");

    // ── 03. Rejection Reason Validation Modal ──
    console.log("6. Opening rejection modal and triggering validation...");
    await send("Runtime.evaluate", {
      expression: `
        // Click Reject button inside the drawer
        const buttons = Array.from(document.querySelectorAll("button"));
        const rejectBtn = buttons.find(b => b.textContent && b.textContent.includes("Reject Request"));
        if (rejectBtn) rejectBtn.click();
      `,
    });
    await new Promise((r) => setTimeout(r, 1000));
    // Click Confirm Rejection with empty reason to show validation error
    await send("Runtime.evaluate", {
      expression: `
        const buttons = Array.from(document.querySelectorAll("button"));
        const confirmRejectBtn = buttons.find(b => b.textContent && b.textContent.includes("Confirm Rejection"));
        if (confirmRejectBtn) confirmRejectBtn.click();
      `,
    });
    await new Promise((r) => setTimeout(r, 1000));
    const shot03 = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(evidenceDir, "03_rejection_reason_validation.png"), Buffer.from(shot03.data, "base64"));
    console.log("✓ Saved 03_rejection_reason_validation.png");

    // Close modal
    await send("Runtime.evaluate", {
      expression: `
        const buttons = Array.from(document.querySelectorAll("button"));
        const cancelBtn = buttons.find(b => b.textContent && b.textContent.includes("Cancel"));
        if (cancelBtn) cancelBtn.click();
      `,
    });
    await new Promise((r) => setTimeout(r, 500));

    // ── 04. Approval Notification in Employee Inbox ──
    console.log("7. Capturing 04_approval_notification.png (Employee inbox notification)...");
    await setSessionCookie(employeeToken);
    await send("Page.navigate", { url: "http://localhost:3000/notifications" });
    await new Promise((r) => setTimeout(r, 3500));
    const shot04 = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(evidenceDir, "04_approval_notification.png"), Buffer.from(shot04.data, "base64"));
    console.log("✓ Saved 04_approval_notification.png");

    // ── 05. Team Attendance Overview ──
    console.log("8. Capturing 05_team_attendance_overview.png...");
    await setSessionCookie(managerToken);
    await send("Page.navigate", { url: "http://localhost:3000/team/attendance" });
    await new Promise((r) => setTimeout(r, 4000));
    const shot05 = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(evidenceDir, "05_team_attendance_overview.png"), Buffer.from(shot05.data, "base64"));
    console.log("✓ Saved 05_team_attendance_overview.png");

    // ── 06. Manager Team Access Scoping ──
    console.log("9. Capturing 06_manager_team_access.png (/team dashboard with direct reports)...");
    await setSessionCookie(managerToken);
    await send("Page.navigate", { url: "http://localhost:3000/team" });
    await new Promise((r) => setTimeout(r, 3500));
    const shot06 = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(evidenceDir, "06_manager_team_access.png"), Buffer.from(shot06.data, "base64"));
    console.log("✓ Saved 06_manager_team_access.png");

    // ── 07. HR Organization-Wide View ──
    console.log("10. Capturing 07_hr_organization_wide_view.png (/leave-management HR view)...");
    await setSessionCookie(hrToken);
    await send("Page.navigate", { url: "http://localhost:3000/leave-management" });
    await new Promise((r) => setTimeout(r, 4000));
    const shot07 = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(evidenceDir, "07_hr_organization_wide_view.png"), Buffer.from(shot07.data, "base64"));
    console.log("✓ Saved 07_hr_organization_wide_view.png");

    ws.close();
    edge.kill();
    console.log("\n=======================================================");
    console.log("ALL 7 EVIDENCE SCREENSHOTS SUCCESSFULLY CAPTURED!");
    console.log("Directory: reports/day-10-evidence/");
    console.log("=======================================================");
  } catch (err) {
    console.error("Screenshot capture failed:", err);
    edge.kill();
    process.exit(1);
  }
}

capture().finally(() => prisma.$disconnect());
