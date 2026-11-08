import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const evidenceDir = path.join(process.cwd(), "reports", "day-8-evidence");
const tempProfile = path.join(evidenceDir, "temp_edge_day8_profile");

const shotTopBar = path.join(evidenceDir, "01_topbar_bell_unread_count.png");
const shotInbox = path.join(evidenceDir, "02_notifications_inbox_unread_read.png");
const shotAnnouncements = path.join(evidenceDir, "03_company_announcements.png");
const shotMarkRead = path.join(evidenceDir, "04_inbox_after_mark_as_read.png");
const shotIsolation = path.join(evidenceDir, "05_isolation_second_user_inbox.png");

async function seedScreenshotData() {
  console.log("Preparing database state for screenshots...");

  const userEmp = await prisma.user.findFirst({ where: { email: "employee@growmar.com" } });
  const userMgr = await prisma.user.findFirst({ where: { email: "manager@growmar.com" } });

  if (!userEmp || !userMgr) {
    throw new Error("Required demo users not found in database.");
  }

  // Clear previous demo notifications for these users
  await prisma.notification.deleteMany({
    where: { userId: { in: [userEmp.id, userMgr.id] } },
  });

  // Create notifications for employee (2 unread, 1 read)
  await prisma.notification.createMany({
    data: [
      {
        userId: userEmp.id,
        title: "Q4 Performance Objectives Submitted",
        message: "Your Q4 goal plan has been forwarded to Marcus Brody for review.",
        isRead: false,
        createdAt: new Date(Date.now() - 3600000 * 2),
      },
      {
        userId: userEmp.id,
        title: "Company Holiday Declaration Notice",
        message: "Office will remain closed on Friday for the declared annual celebration.",
        isRead: false,
        createdAt: new Date(Date.now() - 3600000 * 5),
      },
      {
        userId: userEmp.id,
        title: "September Payslip Available",
        message: "Your electronic payslip for September 2026 is now available for download.",
        isRead: true,
        createdAt: new Date(Date.now() - 86400000 * 2),
      },
    ],
  });

  // Create notification for manager (strictly isolated)
  await prisma.notification.create({
    data: {
      userId: userMgr.id,
      title: "Direct Report Leave Request Pending",
      message: "Sophie Chen submitted a Casual Leave request awaiting your review.",
      isRead: false,
      createdAt: new Date(Date.now() - 1800000),
    },
  });

  console.log("✓ Test notifications seeded successfully.");
}

import { SignJWT } from "jose";

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

async function capture() {
  await seedScreenshotData();

  if (!fs.existsSync(evidenceDir)) {
    fs.mkdirSync(evidenceDir, { recursive: true });
  }
  if (!fs.existsSync(tempProfile)) {
    fs.mkdirSync(tempProfile, { recursive: true });
  }

  console.log("1. Generating session token for employee (employee@growmar.com)...");
  const userEmp = await prisma.user.findFirst({ where: { email: "employee@growmar.com" } });
  const userMgr = await prisma.user.findFirst({ where: { email: "manager@growmar.com" } });
  if (!userEmp || !userMgr) throw new Error("Users not found in database.");

  const empToken = await makeToken(userEmp);

  console.log("2. Launching headless Edge on port 9333...");
  const edge = spawn(edgePath, [
    "--headless=new",
    "--remote-debugging-port=9333",
    `--user-data-dir=${tempProfile}`,
    "--window-size=1366,900",
    "--hide-scrollbars",
    "about:blank",
  ]);

  await new Promise((r) => setTimeout(r, 2000));

  try {
    const listRes = await fetch("http://localhost:9333/json/list");
    const tabs = await listRes.json();
    const pageTab = tabs.find((t) => t.type === "page") || tabs[0];
    const wsUrl = pageTab?.webSocketDebuggerUrl;
    if (!wsUrl) throw new Error("No webSocketDebuggerUrl found.");

    console.log("3. Connecting via WebSocket to:", wsUrl);
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

    // Set employee cookie
    await setSessionCookie(empToken);

    // ── Capture 1: Authenticated TopBar showing bell with non-zero unread badge ──
    console.log("4. Navigating to /dashboard...");
    await send("Page.navigate", { url: "http://localhost:3000/dashboard" });
    await new Promise((r) => setTimeout(r, 3500));

    console.log("5. Capturing TopBar with Bell and unread badge...");
    const capTopBar = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(shotTopBar, Buffer.from(capTopBar.data, "base64"));
    console.log("✓ Saved:", shotTopBar);

    // ── Capture 2: Notifications inbox with unread and read items ──
    console.log("6. Navigating to /notifications...");
    await send("Page.navigate", { url: "http://localhost:3000/notifications" });
    await new Promise((r) => setTimeout(r, 3500));

    console.log("7. Capturing notifications inbox view...");
    const capInbox = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(shotInbox, Buffer.from(capInbox.data, "base64"));
    console.log("✓ Saved:", shotInbox);

    // ── Capture 3: Company announcements in the inbox ──
    console.log("8. Scrolling to Company Announcements...");
    await send("Runtime.evaluate", {
      expression: `document.getElementById('company-announcements-heading')?.scrollIntoView({ behavior: 'instant' });`,
    });
    await new Promise((r) => setTimeout(r, 1000));

    console.log("9. Capturing company announcements section...");
    const capAnnouncements = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(shotAnnouncements, Buffer.from(capAnnouncements.data, "base64"));
    console.log("✓ Saved:", shotAnnouncements);

    // Scroll back to top
    await send("Runtime.evaluate", {
      expression: `window.scrollTo(0, 0);`,
    });
    await new Promise((r) => setTimeout(r, 500));

    // ── Capture 4: Mark notification as read and show updated count ──
    console.log("10. Clicking Mark as Read button on first unread notification...");
    await send("Runtime.evaluate", {
      expression: `
        const btn = document.querySelector('button[id^="mark-read-btn-"]');
        if (btn) btn.click();
      `,
    });
    await new Promise((r) => setTimeout(r, 2000));

    console.log("11. Capturing inbox after mark-as-read...");
    const capMarkRead = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(shotMarkRead, Buffer.from(capMarkRead.data, "base64"));
    console.log("✓ Saved:", shotMarkRead);

    // ── Capture 5: Second authenticated user (manager) demonstrating isolation ──
    console.log("12. Generating session token for manager (manager@growmar.com)...");
    const mgrToken = await makeToken(userMgr);
    await setSessionCookie(mgrToken);

    console.log("13. Navigating to /notifications as manager...");
    await send("Page.navigate", { url: "http://localhost:3000/notifications" });
    await new Promise((r) => setTimeout(r, 5500));

    console.log("14. Capturing second user's isolated inbox...");
    const capIsolation = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(shotIsolation, Buffer.from(capIsolation.data, "base64"));
    console.log("✓ Saved:", shotIsolation);

    ws.close();
    console.log("\nAll 5 browser screenshots captured successfully!");
  } finally {
    edge.kill();
    await prisma.$disconnect();
  }
}

capture().catch((err) => {
  console.error("Screenshot capture failed:", err);
  process.exit(1);
});
