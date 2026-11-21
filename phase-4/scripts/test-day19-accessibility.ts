/**
 * Horizon Portal — Day 19 Automated Accessibility Audit Suite (axe-core)
 * scripts/test-day19-accessibility.ts
 *
 * Runs automated WCAG 2.2 AA accessibility evaluation across:
 * - /login
 * - /dashboard
 * - /employees
 * - /leave
 * - /payroll
 * - /capacity
 * - /task-board
 * - /admin/finance
 * - /team/attendance
 * - /approvals
 *
 * Checks:
 * - WCAG 2.0 Level A, AA
 * - WCAG 2.1 Level A, AA
 * - WCAG 2.2 Level AA
 * - Target: Zero Critical and Zero Serious violations.
 */

import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { SignJWT } from "jose";

const browserBinary = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const cdpPort = 9349;
const serverPort = 3009;
const tempProfile = path.join(process.cwd(), "reports", "temp_day19_a11y_profile");
const evidenceDir = path.join(process.cwd(), "docs", "phase-5", "day-19", "evidence", "accessibility");
const axeSourcePath = path.join(process.cwd(), "node_modules", "axe-core", "axe.min.js");

let authSecret = "f9b4c7301e828d15a97f26c391206ea0d8324bf9a20764d8529e3415cf98b174";
if (fs.existsSync(".env")) {
  const envText = fs.readFileSync(".env", "utf-8");
  const match = envText.match(/AUTH_SECRET=["']?([a-f0-9]{32,64})/i);
  if (match) authSecret = match[1];
}

async function makeToken(userId: string, role: string, email: string, name: string, employeeId: string) {
  const secretKey = new TextEncoder().encode(authSecret);
  return new SignJWT({ email, role, name, employeeId })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(secretKey);
}

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

export interface AxeAuditResult {
  route: string;
  title: string;
  role: string;
  timestamp: string;
  violations: Array<{
    id: string;
    impact: "minor" | "moderate" | "serious" | "critical";
    description: string;
    help: string;
    helpUrl: string;
    tags: string[];
    nodesCount: number;
    nodes: Array<{
      html: string;
      target: string[];
      failureSummary: string;
    }>;
  }>;
  passesCount: number;
  incompleteCount: number;
  inapplicableCount: number;
  criticalCount: number;
  seriousCount: number;
  moderateCount: number;
  minorCount: number;
}

async function runAxeSuite() {
  console.log("========================================================");
  console.log("   HORIZON PORTAL — DAY 19 AXE-CORE ACCESSIBILITY SUITE");
  console.log("========================================================");

  if (!fs.existsSync(evidenceDir)) fs.mkdirSync(evidenceDir, { recursive: true });
  if (!fs.existsSync(tempProfile)) fs.mkdirSync(tempProfile, { recursive: true });

  const axeSource = fs.readFileSync(axeSourcePath, "utf-8");

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
    } catch {}
  }

  if (!serverStarted) {
    server.kill();
    throw new Error(`Server failed to start on 127.0.0.1:${serverPort}`);
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

  const results: AxeAuditResult[] = [];
  let totalCritical = 0;
  let totalSerious = 0;

  try {
    for (const page of PAGES_TO_TEST) {
      console.log(`\n▶ Running Axe on: ${page.title} (${page.path}) [Role: ${page.role}]`);

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

      // Wait for hydration
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

      // Inject axe-core
      await send("Runtime.evaluate", {
        expression: axeSource,
      });

      // Run axe evaluation
      const axeEval = await send("Runtime.evaluate", {
        expression: `
          new Promise((resolve, reject) => {
            if (typeof axe === 'undefined') {
              reject(new Error('axe not defined'));
              return;
            }
            axe.run(document, {
              runOnly: {
                type: 'tag',
                values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']
              }
            }).then(results => resolve(JSON.stringify(results)))
              .catch(err => reject(err));
          })
        `,
        awaitPromise: true,
        returnByValue: true,
      });

      const axeRaw = JSON.parse(axeEval.result?.value || "{}");
      const rawViolations = axeRaw.violations || [];

      const critical = rawViolations.filter((v: any) => v.impact === "critical");
      const serious = rawViolations.filter((v: any) => v.impact === "serious");
      const moderate = rawViolations.filter((v: any) => v.impact === "moderate");
      const minor = rawViolations.filter((v: any) => v.impact === "minor");

      totalCritical += critical.length;
      totalSerious += serious.length;

      const pageResult: AxeAuditResult = {
        route: page.path,
        title: page.title,
        role: page.role,
        timestamp: new Date().toISOString(),
        violations: rawViolations.map((v: any) => ({
          id: v.id,
          impact: v.impact,
          description: v.description,
          help: v.help,
          helpUrl: v.helpUrl,
          tags: v.tags,
          nodesCount: v.nodes?.length || 0,
          nodes: (v.nodes || []).slice(0, 5).map((n: any) => ({
            html: n.html,
            target: n.target,
            failureSummary: n.failureSummary,
          })),
        })),
        passesCount: axeRaw.passes?.length || 0,
        incompleteCount: axeRaw.incomplete?.length || 0,
        inapplicableCount: axeRaw.inapplicable?.length || 0,
        criticalCount: critical.length,
        seriousCount: serious.length,
        moderateCount: moderate.length,
        minorCount: minor.length,
      };

      results.push(pageResult);

      const status = critical.length === 0 && serious.length === 0 ? "✅ PASS" : "⚠️ VIOLATIONS";
      console.log(`  ${status} — Passes: ${pageResult.passesCount}, Critical: ${critical.length}, Serious: ${serious.length}, Moderate: ${moderate.length}, Minor: ${minor.length}`);

      if (critical.length > 0 || serious.length > 0) {
        for (const v of [...critical, ...serious]) {
          console.log(`    [${v.impact.toUpperCase()}] ${v.id}: ${v.help} (${v.nodes.length} occurrences)`);
        }
      }
    }
  } finally {
    ws.close();
    browser.kill();
    server.kill();
  }

  // Save JSON report
  const reportPath = path.join(evidenceDir, "axe-results.json");
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2), "utf-8");
  console.log(`\n✓ Axe results saved to ${reportPath}`);

  console.log("\n========================================================");
  console.log(`AXE AUDIT SUMMARY: Critical: ${totalCritical}, Serious: ${totalSerious}`);
  console.log("========================================================\n");
}

runAxeSuite().catch((err) => {
  console.error("Axe suite failed:", err);
  process.exit(1);
});
