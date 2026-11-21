/**
 * Horizon Portal — Day 15 Screenshot Evidence Capture Script
 * scripts/capture-day15-screenshots.mjs
 *
 * Captures 5 authentic running application screens using headless Microsoft Edge CDP:
 * 1. 01_hr_insights_desktop_overview.png (1440x950 Desktop Overview)
 * 2. 02_hr_insights_mobile_view.png (390x844 Mobile Viewport)
 * 3. 03_department_suppression_display.png (Department Attrition Table with < 5 and Suppressed badges)
 * 4. 04_attrition_risk_distribution.png (Attrition Risk Distribution Meters & Contributing Factors)
 * 5. 05_payroll_anomaly_audit_panel.png (Ranked Payroll & Attendance Anomaly Stream)
 */

import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { SignJWT } from "jose";

const prisma = new PrismaClient();

const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const evidenceDir = path.join(process.cwd(), "reports", "day-15-evidence");
const tempProfile = path.join(evidenceDir, "temp_edge_day15_profile");

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

  console.log("1. Fetching HR user account from database...");
  const hrUser = await prisma.user.findFirst({ where: { role: "HR", isActive: true } });
  if (!hrUser) throw new Error("HR user not found in database.");

  const hrToken = await makeToken(hrUser);
  console.log(`✓ HR user verified: ${hrUser.email} (${hrUser.role})`);

  console.log("2. Starting local Next.js server on port 3000...");
  const server = spawn("cmd.exe", ["/c", "npx", "next", "start", "-p", "3000"], {
    cwd: process.cwd(),
    stdio: "ignore",
    detached: false,
  });

  // Wait for server to respond
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
      // Server not ready yet
    }
  }

  if (!serverReady) {
    server.kill();
    throw new Error("Next.js server failed to start on port 3000 within 20s.");
  }
  console.log("✓ Next.js server is active on http://localhost:3000");

  console.log("3. Launching headless Edge CDP on port 9346...");
  const edge = spawn(edgePath, [
    "--headless=new",
    "--remote-debugging-port=9346",
    `--user-data-dir=${tempProfile}`,
    "--window-size=1440,950",
    "--hide-scrollbars",
    "about:blank",
  ]);

  await new Promise((r) => setTimeout(r, 2000));

  try {
    const listRes = await fetch("http://localhost:9346/json/list");
    const tabs = await listRes.json();
    const pageTab = tabs.find((t) => t.type === "page") || tabs[0];
    const wsUrl = pageTab?.webSocketDebuggerUrl;
    if (!wsUrl) throw new Error("No webSocketDebuggerUrl found on Edge CDP port 9346.");

    console.log("4. Connecting WebSocket to Edge CDP...");
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

    await setSessionCookie(hrToken);

    // ── 01. Complete Desktop Overview (1440x950) ──
    console.log("5. Capturing 01_hr_insights_desktop_overview.png...");
    await setViewport(1440, 950);
    await send("Page.navigate", { url: "http://localhost:3000/hr-insights" });
    await new Promise((r) => setTimeout(r, 4000));

    const shot01 = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(evidenceDir, "01_hr_insights_desktop_overview.png"), Buffer.from(shot01.data, "base64"));
    console.log("✓ Saved 01_hr_insights_desktop_overview.png");

    // ── 02. Mobile Viewport (390x844) ──
    console.log("6. Capturing 02_hr_insights_mobile_view.png...");
    await setViewport(390, 844, true);
    await new Promise((r) => setTimeout(r, 1500));
    const shot02 = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(evidenceDir, "02_hr_insights_mobile_view.png"), Buffer.from(shot02.data, "base64"));
    console.log("✓ Saved 02_hr_insights_mobile_view.png");

    // Reset to desktop viewport for focused sections
    await setViewport(1440, 950, false);
    await new Promise((r) => setTimeout(r, 1000));

    // ── 03. Attrition Risk Distribution & Contributing Factors ──
    console.log("7. Capturing 04_attrition_risk_distribution.png...");
    // Scroll slightly to position distribution meters in frame
    await send("Runtime.evaluate", {
      expression: "window.scrollTo({ top: 180, behavior: 'instant' })",
    });
    await new Promise((r) => setTimeout(r, 1000));
    const shot04 = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(evidenceDir, "04_attrition_risk_distribution.png"), Buffer.from(shot04.data, "base64"));
    console.log("✓ Saved 04_attrition_risk_distribution.png");

    // ── 04. Department Attrition Table (Suppression Display) ──
    console.log("8. Capturing 03_department_suppression_display.png...");
    await send("Runtime.evaluate", {
      expression: "window.scrollTo({ top: 620, behavior: 'instant' })",
    });
    await new Promise((r) => setTimeout(r, 1000));
    const shot03 = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(evidenceDir, "03_department_suppression_display.png"), Buffer.from(shot03.data, "base64"));
    console.log("✓ Saved 03_department_suppression_display.png");

    // ── 05. Payroll & Attendance Anomaly Audit Panel ──
    console.log("9. Capturing 05_payroll_anomaly_audit_panel.png...");
    await send("Runtime.evaluate", {
      expression: "window.scrollTo({ top: 1100, behavior: 'instant' })",
    });
    await new Promise((r) => setTimeout(r, 1000));
    const shot05 = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(evidenceDir, "05_payroll_anomaly_audit_panel.png"), Buffer.from(shot05.data, "base64"));
    console.log("✓ Saved 05_payroll_anomaly_audit_panel.png");

    console.log("\n==================================================================");
    console.log("  ALL 5 DAY 15 EVIDENCE SCREENSHOTS SUCCESSFULLY CAPTURED!");
    console.log("==================================================================");

    ws.close();
  } finally {
    edge.kill();
    server.kill();
    try {
      fs.rmSync(tempProfile, { recursive: true, force: true });
    } catch {
      // Ignore profile cleanup
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
