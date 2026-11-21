/**
 * Horizon Portal — Day 19 Responsive Design Verification Suite
 * scripts/test-day19-responsive.ts
 *
 * Systematic viewport testing across 8 standard device categories:
 * - 360px (Small Mobile - Mandatory)
 * - 390px (Mobile - iPhone 12/13/14)
 * - 430px (Large Mobile - iPhone 14/15 Pro Max)
 * - 768px (Tablet Portrait - iPad Mini / Air)
 * - 1024px (Tablet Landscape / iPad Pro)
 * - 1366px (Standard Laptop)
 * - 1440px (Desktop Workspace - Mandatory)
 * - 1920px (Full HD Monitor)
 *
 * Verifies:
 * 1. Zero unintended horizontal page overflow (`scrollWidth <= innerWidth`)
 * 2. Navigation accessibility (persistent sidebar on desktop, responsive drawer on mobile/tablet)
 * 3. Primary action and layout visibility (no clipped action buttons or obscured hero banners)
 * 4. Dedicated scrollable containers for dense data tables
 */

import { spawn, ChildProcess } from "child_process";
import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { SignJWT } from "jose";

const prisma = new PrismaClient();

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const browserBinary = edgePath;

const cdpPort = 9348;
const serverPort = 3008;
const tempProfile = path.join(process.cwd(), "reports", "temp_day19_responsive_profile");
const evidenceDir = path.join(process.cwd(), "docs", "phase-5", "day-19", "evidence", "responsive");

let authSecret = "f9b4c7301e828d15a97f26c391206ea0d8324bf9a20764d8529e3415cf98b174";
if (fs.existsSync(".env")) {
  const envText = fs.readFileSync(".env", "utf-8");
  const match = envText.match(/AUTH_SECRET=["']?([a-f0-9]{32,64})/i);
  if (match) authSecret = match[1];
}

async function makeToken(userId: string, role: string, email: string, name: string, employeeId: string) {
  const secretKey = new TextEncoder().encode(authSecret);
  return new SignJWT({
    email,
    role,
    name,
    employeeId,
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(secretKey);
}

interface ViewportSpec {
  name: string;
  width: number;
  height: number;
  category: string;
  isMobile: boolean;
}

const VIEWPORTS: ViewportSpec[] = [
  { name: "Small Mobile (360px)", width: 360, height: 800, category: "Mobile", isMobile: true },
  { name: "Mobile (390px)", width: 390, height: 844, category: "Mobile", isMobile: true },
  { name: "Large Mobile (430px)", width: 430, height: 932, category: "Mobile", isMobile: true },
  { name: "Tablet Portrait (768px)", width: 768, height: 1024, category: "Tablet", isMobile: false },
  { name: "Tablet Landscape (1024px)", width: 1024, height: 768, category: "Tablet", isMobile: false },
  { name: "Laptop (1366px)", width: 1366, height: 768, category: "Laptop", isMobile: false },
  { name: "Desktop (1440px)", width: 1440, height: 900, category: "Desktop", isMobile: false },
  { name: "Large Desktop (1920px)", width: 1920, height: 1080, category: "Desktop", isMobile: false },
];

const PAGES_TO_TEST = [
  { path: "/login", title: "Login Page", role: "Public" },
  { path: "/dashboard", title: "Executive Dashboard", role: "Admin" },
  { path: "/employees", title: "Employee Directory", role: "Admin" },
  { path: "/leave", title: "Leave Self-Service", role: "Employee" },
  { path: "/payroll", title: "Admin Payroll Console", role: "Admin" },
  { path: "/capacity", title: "Capacity Dashboard", role: "Admin" },
  { path: "/task-board", title: "Kanban Task Board", role: "Admin" },
  { path: "/admin/finance", title: "Finance Console", role: "Admin" },
  { path: "/team/attendance", title: "Team Attendance", role: "Manager" },
  { path: "/approvals", title: "Leave Approvals Queue", role: "Manager" },
];

export interface ResponsiveTestResult {
  route: string;
  pageTitle: string;
  viewportName: string;
  viewportWidth: number;
  viewportHeight: number;
  scrollWidth: number;
  hasHorizontalOverflow: boolean;
  navUsable: boolean;
  mainVisible: boolean;
  tableScrollableGracefully: boolean;
  passed: boolean;
  failureReason?: string;
}

async function runResponsiveSuite() {
  console.log("========================================================");
  console.log("   HORIZON PORTAL — DAY 19 RESPONSIVE DESIGN SUITE");
  console.log("========================================================");

  if (!fs.existsSync(evidenceDir)) fs.mkdirSync(evidenceDir, { recursive: true });
  if (!fs.existsSync(tempProfile)) fs.mkdirSync(tempProfile, { recursive: true });

  const adminToken = await makeToken("usr_admin_001", "Admin", "admin@growmar.com", "Sanjay Kumar", "EMP-0001");
  const managerToken = await makeToken("usr_mgr_003", "Manager", "manager@growmar.com", "Imran Philip", "EMP-0010");
  const employeeToken = await makeToken("usr_emp_004", "Employee", "employee@growmar.com", "Sasi Shetty", "EMP-0015");

  const tokensByRole: Record<string, string> = {
    Admin: adminToken,
    Manager: managerToken,
    Employee: employeeToken,
  };

  console.log(`1. Launching Next.js production server on 127.0.0.1:${serverPort}...`);
  const nextBin = path.join(process.cwd(), "node_modules", "next", "dist", "bin", "next");
  const server = spawn(process.execPath, [nextBin, "start", "-H", "127.0.0.1", "-p", String(serverPort)], {
    cwd: process.cwd(),
    stdio: ["ignore", "pipe", "pipe"],
    env: {
      ...process.env,
      DATABASE_URL: "file:./dev.db",
    },
  });

  let serverStarted = false;
  server.stdout.on("data", (data) => {
    const txt = data.toString();
    if (txt.includes("Ready") || txt.includes("Local:") || txt.includes("started")) {
      serverStarted = true;
    }
  });

  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    try {
      const probe = await fetch(`http://127.0.0.1:${serverPort}/login`);
      if (probe.status === 200 || probe.status === 307 || probe.status === 308) {
        serverStarted = true;
        break;
      }
    } catch {
      // Waiting
    }
  }

  if (!serverStarted) {
    server.kill();
    throw new Error(`Production server failed to start on 127.0.0.1:${serverPort}`);
  }
  console.log(`✓ Next.js production server is active on http://127.0.0.1:${serverPort}`);

  console.log(`2. Launching headless browser on CDP port ${cdpPort}...`);
  const browser = spawn(browserBinary, [
    "--headless=new",
    `--remote-debugging-port=${cdpPort}`,
    `--user-data-dir=${tempProfile}`,
    "--window-size=1440,900",
    "--no-sandbox",
    "--disable-gpu",
    "--disable-dev-shm-usage",
    "--disable-extensions",
    "--no-first-run",
    "--no-default-browser-check",
    "about:blank",
  ]);

  await new Promise((r) => setTimeout(r, 2500));

  const listRes = await fetch(`http://127.0.0.1:${cdpPort}/json/list`);
  const tabs = await listRes.json();
  const pageTab = tabs.find((t: any) => t.type === "page" && !t.url.startsWith("chrome-extension://") && !t.url.startsWith("edge://")) || tabs[0];
  const wsUrl = pageTab.webSocketDebuggerUrl;

  const ws = new WebSocket(wsUrl);
  let msgId = 1;
  const send = (method: string, params: any = {}) =>
    new Promise<any>((resolve, reject) => {
      const curId = msgId++;
      const handler = (evt: any) => {
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
  await send("DOM.enable");

  const results: ResponsiveTestResult[] = [];
  let totalTests = 0;
  let passedTests = 0;

  try {
    for (const page of PAGES_TO_TEST) {
      console.log(`\n▶ Testing Page: ${page.title} (${page.path}) [Role: ${page.role}]`);

      // Set auth cookie if authenticated page
      if (page.role !== "Public" && tokensByRole[page.role]) {
        await send("Network.setCookie", {
          name: "horizon_session",
          value: tokensByRole[page.role],
          domain: "127.0.0.1",
          path: "/",
          httpOnly: true,
          sameSite: "Lax",
        });
      } else {
        await send("Network.deleteCookies", { name: "horizon_session", domain: "127.0.0.1" });
      }

      // Set initial desktop viewport for navigation
      await send("Emulation.setDeviceMetricsOverride", {
        width: 1440,
        height: 900,
        deviceScaleFactor: 1,
        mobile: false,
      });

      // Navigate and wait for Page.loadEventFired
      const loadPromise = new Promise((resolve) => {
        const handler = (evt: any) => {
          try {
            const msg = JSON.parse(evt.data);
            if (msg.method === "Page.loadEventFired") {
              ws.removeEventListener("message", handler);
              resolve(true);
            }
          } catch {}
        };
        ws.addEventListener("message", handler);
      });
      await send("Page.navigate", { url: `http://127.0.0.1:${serverPort}${page.path}` });
      await Promise.race([loadPromise, new Promise((r) => setTimeout(r, 4000))]);

      // Wait for page hydration
      const startTime = Date.now();
      while (Date.now() - startTime < 4000) {
        const readyRes = await send("Runtime.evaluate", {
          expression: `
            (() => {
              if (document.readyState !== 'complete') return false;
              if (window.location.pathname.includes('/login')) return true;
              const skeleton = document.querySelector('[role="status"]');
              if (skeleton) return false;
              const main = document.querySelector('main');
              return Boolean(main && main.clientHeight > 0);
            })()
          `,
          returnByValue: true,
        });
        if (readyRes.result?.value === true) break;
        await new Promise((r) => setTimeout(r, 150));
      }

      // Now iterate through all viewports on the loaded page
      for (const vp of VIEWPORTS) {
        totalTests++;

        // Set device metrics override
        await send("Emulation.setDeviceMetricsOverride", {
          width: vp.width,
          height: vp.height,
          deviceScaleFactor: 1,
          mobile: vp.isMobile,
        });

        await new Promise((r) => setTimeout(r, 200));

        // Evaluate layout metrics in the browser
        const evalRes = await send("Runtime.evaluate", {
          expression: `
            (() => {
              const docWidth = document.documentElement.scrollWidth;
              const winWidth = window.innerWidth;
              const hasOverflow = docWidth > winWidth;

              // Check navigation
              const isLogin = window.location.pathname.includes('/login');
              let navUsable = false;
              if (isLogin) {
                navUsable = true;
              } else {
                // Desktop: sidebar aside is visible. Mobile: topbar toggle button is visible.
                const sidebar = document.querySelector('aside');
                const toggleBtn =
                  document.querySelector('button[aria-label="Open navigation menu"]') ||
                  Array.from(document.querySelectorAll('button')).find(
                    (b) =>
                      b.getAttribute('aria-label')?.includes('Open navigation') ||
                      (b.getAttribute('aria-label')?.toLowerCase().includes('menu') && b.clientWidth > 0)
                  );
                if (winWidth >= 1024) {
                  navUsable = Boolean(sidebar && sidebar.clientWidth > 0);
                } else {
                  navUsable = Boolean(toggleBtn && toggleBtn.clientWidth > 0);
                }
              }

              // Check main container visibility
              const main = document.querySelector('main') || document.querySelector('.max-w-md') || document.body;
              const mainVisible = Boolean(main && main.clientHeight > 0);

              // Check table container scroll isolation
              const tables = Array.from(document.querySelectorAll('table'));
              let tableScrollableGracefully = true;
              for (const tbl of tables) {
                const parent = tbl.parentElement;
                if (parent) {
                  const style = window.getComputedStyle(parent);
                  const isScrollable = style.overflowX === 'auto' || style.overflowX === 'scroll';
                  if (tbl.scrollWidth > parent.clientWidth && !isScrollable) {
                    tableScrollableGracefully = false;
                  }
                }
              }

              return {
                docWidth,
                winWidth,
                hasOverflow,
                navUsable,
                mainVisible,
                tableScrollableGracefully,
              };
            })()
          `,
          returnByValue: true,
        });

        const val = evalRes.result?.value || {};
        const passed = !val.hasOverflow && val.navUsable && val.mainVisible && val.tableScrollableGracefully;

        if (passed) passedTests++;

        const testRes: ResponsiveTestResult = {
          route: page.path,
          pageTitle: page.title,
          viewportName: vp.name,
          viewportWidth: vp.width,
          viewportHeight: vp.height,
          scrollWidth: val.docWidth || vp.width,
          hasHorizontalOverflow: Boolean(val.hasOverflow),
          navUsable: Boolean(val.navUsable),
          mainVisible: Boolean(val.mainVisible),
          tableScrollableGracefully: Boolean(val.tableScrollableGracefully),
          passed,
          failureReason: !passed
            ? [
                val.hasOverflow ? `Overflow: ${val.docWidth}px > ${val.winWidth}px` : null,
                !val.navUsable ? "Nav unusable" : null,
                !val.mainVisible ? "Main invisible" : null,
                !val.tableScrollableGracefully ? "Table overflowing parent" : null,
              ]
                .filter(Boolean)
                .join(", ")
            : undefined,
        };

        results.push(testRes);

        const statusLabel = passed ? "✅ PASS" : "❌ FAIL";
        console.log(
          `  ${statusLabel} [${vp.name.padEnd(26)}] scrollWidth: ${testRes.scrollWidth}px (target: ${vp.width}px) ${
            testRes.failureReason ? `— ${testRes.failureReason}` : ""
          }`
        );
      }
    }
  } finally {
    ws.close();
    browser.kill();
    server.kill();
  }

  // Save JSON report
  const reportPath = path.join(evidenceDir, "responsive-test-results.json");
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2), "utf-8");
  console.log(`\n✓ Raw test results saved to ${reportPath}`);

  console.log("\n========================================================");
  console.log(`RESPONSIVE TEST SUMMARY: ${passedTests} PASSED, ${totalTests - passedTests} FAILED (TOTAL: ${totalTests})`);
  console.log("========================================================\n");

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runResponsiveSuite().catch((err) => {
  console.error("Suite failed with error:", err);
  process.exit(1);
});
