/**
 * Horizon Portal — Day 15 Navigation Evidence Capture Script
 * scripts/capture-day15-navigation-screenshots.mjs
 *
 * Captures 7 authentic running application navigation screens using headless Microsoft Edge CDP:
 * 1. 06_nav_admin_sidebar.png (Admin view showing 'AI Workforce Insights' under 'Workforce & Operations')
 * 2. 07_nav_hr_sidebar.png (HR view showing 'AI Workforce Insights' under 'People Operations')
 * 3. 08_nav_manager_sidebar.png (Manager view: verified absence of AI Insights)
 * 4. 09_nav_employee_sidebar.png (Employee view: verified absence of AI Insights)
 * 5. 10_nav_breadcrumbs_desktop.png (Breadcrumb 'Horizon Portal > AI Workforce Insights' on /hr-insights)
 * 6. 11_nav_mobile_drawer_hr.png (Mobile responsive drawer showing AI Insights link)
 * 7. 12_page_forbidden_manager_403.png (Direct URL access to /hr-insights by Manager -> 403 Forbidden inside AppShell)
 */

import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { SignJWT } from "jose";

const prisma = new PrismaClient();

const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const evidenceDir = path.join(process.cwd(), "reports", "day-15-evidence");
const tempProfile = path.join(evidenceDir, "temp_edge_nav_profile");

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
  if (!fs.existsSync(evidenceDir)) {
    fs.mkdirSync(evidenceDir, { recursive: true });
  }
  if (!fs.existsSync(tempProfile)) {
    fs.mkdirSync(tempProfile, { recursive: true });
  }

  console.log("1. Fetching all 4 demo role users...");
  const [adminUser, hrUser, managerUser, employeeUser] = await Promise.all([
    prisma.user.findFirst({ where: { role: "Admin", isActive: true } }),
    prisma.user.findFirst({ where: { role: "HR", isActive: true } }),
    prisma.user.findFirst({ where: { role: "Manager", isActive: true } }),
    prisma.user.findFirst({ where: { role: "Employee", isActive: true } }),
  ]);

  if (!adminUser || !hrUser || !managerUser || !employeeUser) {
    throw new Error("Missing required demo accounts in SQLite database.");
  }

  const adminToken = await makeToken(adminUser);
  const hrToken = await makeToken(hrUser);
  const managerToken = await makeToken(managerUser);
  const employeeToken = await makeToken(employeeUser);

  console.log("2. Starting Next.js server on port 3000...");
  const server = spawn("cmd.exe", ["/c", "npx", "next", "start", "-p", "3000"], {
    cwd: process.cwd(),
    stdio: "ignore",
    detached: false,
  });

  let serverReady = false;
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    try {
      const probe = await fetch("http://localhost:3000/api/v1/auth/login", { method: "OPTIONS" });
      if (probe.status !== 404) {
        serverReady = true;
        break;
      }
    } catch {
      // Waiting
    }
  }

  if (!serverReady) {
    server.kill();
    throw new Error("Next.js server failed to start within 20s.");
  }
  console.log("✓ Next.js server active on http://localhost:3000");

  console.log("3. Launching headless Edge CDP on port 9347...");
  const edge = spawn(edgePath, [
    "--headless=new",
    "--remote-debugging-port=9347",
    `--user-data-dir=${tempProfile}`,
    "--window-size=1440,950",
    "--hide-scrollbars",
    "about:blank",
  ]);

  await new Promise((r) => setTimeout(r, 2000));

  try {
    const listRes = await fetch("http://localhost:9347/json/list");
    const tabs = await listRes.json();
    const pageTab = tabs.find((t) => t.type === "page") || tabs[0];
    const wsUrl = pageTab?.webSocketDebuggerUrl;
    if (!wsUrl) throw new Error("No webSocketDebuggerUrl found on Edge CDP port 9347.");

    console.log("4. Connecting WebSocket...");
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

    const setViewport = async (width, height, isMobile = false) => {
      await send("Emulation.setDeviceMetricsOverride", {
        width,
        height,
        deviceScaleFactor: 1,
        mobile: isMobile,
      });
    };

    // ── 06. Admin Sidebar with AI Workforce Insights ──
    console.log("5. Capturing 06_nav_admin_sidebar.png...");
    await setViewport(1440, 950);
    await setSessionCookie(adminToken);
    await send("Page.navigate", { url: "http://localhost:3000/hr-insights" });
    await new Promise((r) => setTimeout(r, 3500));
    // Clip left sidebar area (width 320, height 900)
    const shot06 = await send("Page.captureScreenshot", {
      format: "png",
      clip: { x: 0, y: 0, width: 320, height: 900, scale: 1 },
    });
    fs.writeFileSync(path.join(evidenceDir, "06_nav_admin_sidebar.png"), Buffer.from(shot06.data, "base64"));
    console.log("✓ Saved 06_nav_admin_sidebar.png");

    // ── 07. HR Sidebar with AI Workforce Insights ──
    console.log("6. Capturing 07_nav_hr_sidebar.png...");
    await setSessionCookie(hrToken);
    await send("Page.navigate", { url: "http://localhost:3000/hr-insights" });
    await new Promise((r) => setTimeout(r, 3000));
    const shot07 = await send("Page.captureScreenshot", {
      format: "png",
      clip: { x: 0, y: 0, width: 320, height: 900, scale: 1 },
    });
    fs.writeFileSync(path.join(evidenceDir, "07_nav_hr_sidebar.png"), Buffer.from(shot07.data, "base64"));
    console.log("✓ Saved 07_nav_hr_sidebar.png");

    // ── 08. Manager Sidebar (AI Insights Strictly Hidden) ──
    console.log("7. Capturing 08_nav_manager_sidebar.png...");
    await setSessionCookie(managerToken);
    await send("Page.navigate", { url: "http://localhost:3000/dashboard" });
    await new Promise((r) => setTimeout(r, 3000));
    const shot08 = await send("Page.captureScreenshot", {
      format: "png",
      clip: { x: 0, y: 0, width: 320, height: 900, scale: 1 },
    });
    fs.writeFileSync(path.join(evidenceDir, "08_nav_manager_sidebar.png"), Buffer.from(shot08.data, "base64"));
    console.log("✓ Saved 08_nav_manager_sidebar.png");

    // ── 09. Employee Sidebar (AI Insights Strictly Hidden) ──
    console.log("8. Capturing 09_nav_employee_sidebar.png...");
    await setSessionCookie(employeeToken);
    await send("Page.navigate", { url: "http://localhost:3000/dashboard" });
    await new Promise((r) => setTimeout(r, 3000));
    const shot09 = await send("Page.captureScreenshot", {
      format: "png",
      clip: { x: 0, y: 0, width: 320, height: 900, scale: 1 },
    });
    fs.writeFileSync(path.join(evidenceDir, "09_nav_employee_sidebar.png"), Buffer.from(shot09.data, "base64"));
    console.log("✓ Saved 09_nav_employee_sidebar.png");

    // ── 10. Breadcrumbs on /hr-insights ──
    console.log("9. Capturing 10_nav_breadcrumbs_desktop.png...");
    await setSessionCookie(hrToken);
    await send("Page.navigate", { url: "http://localhost:3000/hr-insights" });
    await new Promise((r) => setTimeout(r, 3000));
    // Clip top navigation bar showing breadcrumb: Horizon Portal > AI Workforce Insights
    const shot10 = await send("Page.captureScreenshot", {
      format: "png",
      clip: { x: 260, y: 0, width: 800, height: 120, scale: 1 },
    });
    fs.writeFileSync(path.join(evidenceDir, "10_nav_breadcrumbs_desktop.png"), Buffer.from(shot10.data, "base64"));
    console.log("✓ Saved 10_nav_breadcrumbs_desktop.png");

    // ── 11. Mobile Drawer Navigation for HR ──
    console.log("10. Capturing 11_nav_mobile_drawer_hr.png...");
    await setViewport(390, 844, true);
    await send("Page.navigate", { url: "http://localhost:3000/hr-insights" });
    await new Promise((r) => setTimeout(r, 2500));
    // Click the mobile menu hamburger button
    await send("Runtime.evaluate", {
      expression: `
        const btn = document.querySelector('button[aria-label="Open navigation menu"]');
        if (btn) btn.click();
      `,
    });
    await new Promise((r) => setTimeout(r, 1500));
    const shot11 = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(evidenceDir, "11_nav_mobile_drawer_hr.png"), Buffer.from(shot11.data, "base64"));
    console.log("✓ Saved 11_nav_mobile_drawer_hr.png");

    // ── 12. Direct Access to /hr-insights by Manager -> 403 Forbidden ──
    console.log("11. Capturing 12_page_forbidden_manager_403.png...");
    await setViewport(1440, 950, false);
    await setSessionCookie(managerToken);
    await send("Page.navigate", { url: "http://localhost:3000/hr-insights" });
    await new Promise((r) => setTimeout(r, 3000));
    const shot12 = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(evidenceDir, "12_page_forbidden_manager_403.png"), Buffer.from(shot12.data, "base64"));
    console.log("✓ Saved 12_page_forbidden_manager_403.png");

    console.log("\n==================================================================");
    console.log("  ALL 7 DAY 15 NAVIGATION EVIDENCE SCREENSHOTS CAPTURED!");
    console.log("==================================================================");

    ws.close();
  } finally {
    edge.kill();
    server.kill();
    try {
      fs.rmSync(tempProfile, { recursive: true, force: true });
    } catch {
      // Ignore
    }
  }
}

capture()
  .catch((err) => {
    console.error("Screenshot capture failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
