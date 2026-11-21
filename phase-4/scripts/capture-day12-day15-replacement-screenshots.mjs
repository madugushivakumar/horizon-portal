/**
 * Horizon Portal — Replacement Screenshot Capture for Day 12 & Day 15
 * scripts/capture-day12-day15-replacement-screenshots.mjs
 */

import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { SignJWT } from "jose";

const prisma = new PrismaClient();

const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const day12Dir = path.join(process.cwd(), "reports", "day-12-evidence");
const day15Dir = path.join(process.cwd(), "reports", "day-15-evidence");
const tempProfile = path.join(process.cwd(), "reports", "temp_edge_day12_15_profile");

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

async function captureReplacements() {
  if (!fs.existsSync(day12Dir)) fs.mkdirSync(day12Dir, { recursive: true });
  if (!fs.existsSync(day15Dir)) fs.mkdirSync(day15Dir, { recursive: true });
  if (!fs.existsSync(tempProfile)) fs.mkdirSync(tempProfile, { recursive: true });

  console.log("1. Fetching Admin and HR user accounts...");
  const adminUser = await prisma.user.findFirst({ where: { role: "Admin", isActive: true } });
  const hrUser = await prisma.user.findFirst({ where: { role: "HR", isActive: true } });
  if (!adminUser || !hrUser) throw new Error("Required demo users not found in database.");

  const adminToken = await makeToken(adminUser);
  const hrToken = await makeToken(hrUser);
  console.log(`✓ Admin token: ${adminUser.email}, HR token: ${hrUser.email}`);

  console.log("2. Launching Next.js dev server on 127.0.0.1:3000...");
  const server = spawn("cmd.exe", ["/c", "npx", "next", "dev", "-H", "127.0.0.1", "-p", "3000"], {
    cwd: process.cwd(),
    stdio: ["ignore", "pipe", "pipe"],
    detached: false,
  });

  server.stdout.on("data", (d) => {
    const s = d.toString();
    if (s.includes("Ready") || s.includes("started") || s.includes("Local:")) {
      console.log("   [Next.js]:", s.trim());
    }
  });

  let serverReady = false;
  for (let i = 0; i < 40; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    try {
      const probe = await fetch("http://127.0.0.1:3000/api/v1/tasks/filters", {
        headers: { Cookie: `horizon_session=${adminToken}` },
      });
      if (probe.status === 200 || probe.status === 401 || probe.status === 404) {
        serverReady = true;
        break;
      }
    } catch {}
  }

  if (!serverReady) {
    server.kill();
    throw new Error("Next.js dev server failed to start within 40s.");
  }
  console.log("✓ Next.js server ready at http://127.0.0.1:3000");

  console.log("3. Launching headless Edge CDP on port 9349...");
  const edge = spawn(edgePath, [
    "--headless=new",
    "--remote-debugging-port=9349",
    `--user-data-dir=${tempProfile}`,
    "--window-size=1440,950",
    "--hide-scrollbars",
    "about:blank",
  ]);

  await new Promise((r) => setTimeout(r, 2500));

  try {
    const listRes = await fetch("http://localhost:9349/json/list");
    const tabs = await listRes.json();
    const pageTab = tabs.find((t) => t.type === "page") || tabs[0];
    const wsUrl = pageTab?.webSocketDebuggerUrl;
    if (!wsUrl) throw new Error("No webSocketDebuggerUrl on port 9349.");

    const ws = new WebSocket(wsUrl);
    let msgId = 1;
    const send = (method, params = {}) =>
      new Promise((resolve, reject) => {
        const curId = msgId++;
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

    await new Promise((res) => ws.addEventListener("open", res, { once: true }));
    await send("Network.enable");
    await send("Page.enable");

    const setSessionCookie = async (token) => {
      await send("Network.setCookie", {
        name: "horizon_session",
        value: token,
        domain: "127.0.0.1",
        path: "/",
        httpOnly: true,
        sameSite: "Lax",
      });
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

    // =========================================================================
    // CAPTURE DAY 12: ADMIN FINANCE SNAPSHOT
    // =========================================================================
    console.log("\n--- CAPTURING GENUINE DAY 12 FINANCE SCREENSHOTS ---");
    await setSessionCookie(adminToken);
    await setViewport(1440, 950);

    console.log("Navigating to http://127.0.0.1:3000/admin/finance...");
    await send("Page.navigate", { url: "http://127.0.0.1:3000/admin/finance" });
    await new Promise((r) => setTimeout(r, 6000));

    // 01_finance_snapshot_desktop.png (1440x950 Desktop Overview)
    const shot12_01 = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(day12Dir, "01_finance_snapshot_desktop.png"), Buffer.from(shot12_01.data, "base64"));
    console.log(`✓ Saved ${day12Dir}/01_finance_snapshot_desktop.png (${shot12_01.data.length} chars base64)`);

    // 02_finance_summary_and_ageing_desktop.png (Clip showing 5 KPI summary cards & 5 ageing buckets)
    const shot12_02 = await send("Page.captureScreenshot", {
      format: "png",
      clip: { x: 50, y: 70, width: 1340, height: 600, scale: 1 },
    });
    fs.writeFileSync(path.join(day12Dir, "02_finance_summary_and_ageing_desktop.png"), Buffer.from(shot12_02.data, "base64"));
    console.log(`✓ Saved ${day12Dir}/02_finance_summary_and_ageing_desktop.png`);

    // =========================================================================
    // CAPTURE DAY 15: AI WORKFORCE INSIGHTS DASHBOARD
    // =========================================================================
    console.log("\n--- CAPTURING GENUINE DAY 15 HR INSIGHTS SCREENSHOTS ---");
    await setSessionCookie(hrToken);
    await setViewport(1440, 950);

    console.log("Navigating to http://127.0.0.1:3000/hr-insights...");
    await send("Page.navigate", { url: "http://127.0.0.1:3000/hr-insights" });
    await new Promise((r) => setTimeout(r, 6000));

    // 01_hr_insights_desktop_overview.png (1440x950 Desktop Overview)
    const shot15_01 = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(day15Dir, "01_hr_insights_desktop_overview.png"), Buffer.from(shot15_01.data, "base64"));
    console.log(`✓ Saved ${day15Dir}/01_hr_insights_desktop_overview.png (${shot15_01.data.length} chars base64)`);

    // 04_attrition_risk_distribution.png (Meters & Contributing Factors)
    const shot15_04 = await send("Page.captureScreenshot", {
      format: "png",
      clip: { x: 50, y: 120, width: 1340, height: 650, scale: 1 },
    });
    fs.writeFileSync(path.join(day15Dir, "04_attrition_risk_distribution.png"), Buffer.from(shot15_04.data, "base64"));
    console.log(`✓ Saved ${day15Dir}/04_attrition_risk_distribution.png`);

    console.log("\n==================================================================");
    console.log("   REPLACEMENT SCREENSHOTS CAPTURED AND PERSISTED SUCCESSFULLY!   ");
    console.log("==================================================================");
  } finally {
    try {
      if (edge && edge.pid) spawn("taskkill", ["/F", "/T", "/PID", String(edge.pid)]);
    } catch {}
    try {
      if (server && server.pid) spawn("taskkill", ["/F", "/T", "/PID", String(server.pid)]);
    } catch {}
  }
}

captureReplacements()
  .catch((err) => {
    console.error("Replacement capture failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
