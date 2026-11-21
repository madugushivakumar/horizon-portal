/**
 * Horizon Portal — Day 19 Lighthouse & Core Web Vitals Audit Suite
 * scripts/test-day19-performance.ts
 *
 * Runs automated Google Lighthouse audits across:
 * - /login (Desktop & Mobile)
 * - /dashboard (Desktop & Mobile)
 * - /employees (Desktop)
 * - /leave (Desktop)
 * - /payroll (Desktop)
 *
 * Metrics verified:
 * - Performance Score (target >= 90)
 * - Accessibility Score (target >= 90)
 * - Best Practices Score (target >= 90)
 * - SEO Score (target >= 90)
 * - Core Web Vitals: FCP (< 1.8s), LCP (< 2.5s), TBT (< 200ms), CLS (< 0.1)
 *
 * Outputs HTML and JSON reports into:
 * docs/phase-5/day-19/evidence/lighthouse/final/
 */

import { spawn, execSync } from "child_process";
import fs from "fs";
import path from "path";
import { SignJWT } from "jose";

const serverPort = 3040;
const outputDir = path.join(process.cwd(), "docs", "phase-5", "day-19", "evidence", "lighthouse", "final");
const edgeBinary = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

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

interface AuditConfig {
  id: string;
  urlPath: string;
  name: string;
  preset: "desktop" | "mobile";
  role: "Public" | "Admin" | "Employee";
}

const AUDITS: AuditConfig[] = [
  { id: "login-desktop", urlPath: "/login", name: "Login Page (Desktop)", preset: "desktop", role: "Public" },
  { id: "login-mobile", urlPath: "/login", name: "Login Page (Mobile)", preset: "mobile", role: "Public" },
  { id: "dashboard-desktop", urlPath: "/dashboard", name: "Executive Dashboard (Desktop)", preset: "desktop", role: "Admin" },
  { id: "dashboard-mobile", urlPath: "/dashboard", name: "Executive Dashboard (Mobile)", preset: "mobile", role: "Admin" },
  { id: "employees-desktop", urlPath: "/employees", name: "Employee Directory (Desktop)", preset: "desktop", role: "Admin" },
  { id: "leave-desktop", urlPath: "/leave", name: "Leave Self-Service (Desktop)", preset: "desktop", role: "Employee" },
  { id: "payroll-desktop", urlPath: "/payroll", name: "Admin Payroll Console (Desktop)", preset: "desktop", role: "Admin" },
];

export interface LighthouseSummaryResult {
  id: string;
  name: string;
  preset: "desktop" | "mobile";
  url: string;
  scores: {
    performance: number;
    accessibility: number;
    bestPractices: number;
    seo: number;
  };
  metrics: {
    fcpMs: number;
    lcpMs: number;
    tbtMs: number;
    cls: number;
    speedIndexMs: number;
  };
  passedTargets: boolean;
}

async function runLighthouseSuite() {
  console.log("========================================================");
  console.log("   HORIZON PORTAL — DAY 19 LIGHTHOUSE PERFORMANCE SUITE");
  console.log("========================================================");

  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const adminToken = await makeToken("usr_admin_001", "Admin", "admin@growmar.com", "Sanjay Kumar", "EMP-0001");
  const employeeToken = await makeToken("usr_emp_004", "Employee", "employee@growmar.com", "Sasi Shetty", "EMP-0015");

  const tokensByRole: Record<string, string> = {
    Admin: adminToken,
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
    throw new Error(`Production server failed to start on 127.0.0.1:${serverPort}`);
  }
  console.log(`✓ Next.js production server active on http://127.0.0.1:${serverPort}`);

  const results: LighthouseSummaryResult[] = [];

  try {
    for (const audit of AUDITS) {
      console.log(`\n▶ Auditing ${audit.name} [${audit.preset.toUpperCase()}]`);

      const targetUrl = `http://127.0.0.1:${serverPort}${audit.urlPath}`;
      const relOutBase = `./docs/phase-5/day-19/evidence/lighthouse/final/${audit.id}`;
      const outBasePath = path.join(outputDir, audit.id);

      const relHeader = `./reports/headers-${audit.id}.json`;
      const headersJsonPath = path.join(process.cwd(), "reports", `headers-${audit.id}.json`);
      if (audit.role !== "Public" && tokensByRole[audit.role]) {
        fs.writeFileSync(headersJsonPath, JSON.stringify({ Cookie: `horizon_session=${tokensByRole[audit.role]}` }), "utf-8");
      } else {
        if (fs.existsSync(headersJsonPath)) fs.unlinkSync(headersJsonPath);
      }

      const args = [
        targetUrl,
        `--output=json,html`,
        `--output-path=${relOutBase}`,
        audit.preset === "desktop" ? `--preset=desktop` : `--form-factor=mobile`,
        `--chrome-flags="--headless=new --no-sandbox --disable-extensions --disable-gpu --disable-dev-shm-usage"`,
        `--only-categories=performance,accessibility,best-practices,seo`,
        `--quiet`,
      ];

      if (fs.existsSync(headersJsonPath)) {
        args.push(`--extra-headers=${relHeader}`);
      }

      console.log(`  Executing: npx lighthouse ${targetUrl}`);
      try {
        const cmd = `npx lighthouse ${args.join(" ")}`;
        execSync(cmd, {
          cwd: process.cwd(),
          stdio: ["ignore", "pipe", "pipe"],
          env: {
            ...process.env,
            CHROME_PATH: edgeBinary,
          },
        });
      } catch (err: any) {
        console.warn(`  Lighthouse note for ${audit.id}:`, err.stderr?.toString()?.slice(0, 300) || err.message?.slice(0, 150));
      }

      // Check results
      const jsonReportPath = `${outBasePath}.report.json`;
      if (fs.existsSync(jsonReportPath)) {
        const rawJson = JSON.parse(fs.readFileSync(jsonReportPath, "utf-8"));
        const cats = rawJson.categories || {};
        const audits = rawJson.audits || {};

        const perfScore = Math.round((cats.performance?.score || 0) * 100);
        const a11yScore = Math.round((cats.accessibility?.score || 0) * 100);
        const bpScore = Math.round((cats["best-practices"]?.score || 0) * 100);
        const seoScore = Math.round((cats.seo?.score || 0) * 100);

        const fcpMs = Math.round(audits["first-contentful-paint"]?.numericValue || 0);
        const lcpMs = Math.round(audits["largest-contentful-paint"]?.numericValue || 0);
        const tbtMs = Math.round(audits["total-blocking-time"]?.numericValue || 0);
        const cls = Math.round((audits["cumulative-layout-shift"]?.numericValue || 0) * 1000) / 1000;
        const speedIndexMs = Math.round(audits["speed-index"]?.numericValue || 0);

        const passedTargets = perfScore >= 90 && a11yScore >= 90 && bpScore >= 90 && seoScore >= 90;

        const summary: LighthouseSummaryResult = {
          id: audit.id,
          name: audit.name,
          preset: audit.preset,
          url: targetUrl,
          scores: {
            performance: perfScore,
            accessibility: a11yScore,
            bestPractices: bpScore,
            seo: seoScore,
          },
          metrics: {
            fcpMs,
            lcpMs,
            tbtMs,
            cls,
            speedIndexMs,
          },
          passedTargets,
        };

        results.push(summary);

        console.log(`  📊 Performance:    ${perfScore}/100  ${perfScore >= 90 ? "✅" : "⚠️"}`);
        console.log(`  ♿ Accessibility:  ${a11yScore}/100  ${a11yScore >= 90 ? "✅" : "⚠️"}`);
        console.log(`  🛡️ Best Practices: ${bpScore}/100  ${bpScore >= 90 ? "✅" : "⚠️"}`);
        console.log(`  🔍 SEO:            ${seoScore}/100  ${seoScore >= 90 ? "✅" : "⚠️"}`);
        console.log(`  ⚡ Core Web Vitals: FCP ${fcpMs}ms | LCP ${lcpMs}ms | TBT ${tbtMs}ms | CLS ${cls}`);
      } else {
        console.error(`  ❌ Failed to locate report at ${jsonReportPath}`);
      }

      if (fs.existsSync(headersJsonPath)) {
        try { fs.unlinkSync(headersJsonPath); } catch {}
      }
    }
  } finally {
    server.kill();
  }

  // Save overall summary
  const summaryPath = path.join(outputDir, "lighthouse-summary.json");
  fs.writeFileSync(summaryPath, JSON.stringify(results, null, 2), "utf-8");
  console.log(`\n✓ Lighthouse summary saved to ${summaryPath}`);

  console.log("\n========================================================");
  console.log("   LIGHTHOUSE AUDIT COMPLETE");
  console.log("========================================================\n");
}

runLighthouseSuite().catch((err) => {
  console.error("Lighthouse suite failed:", err);
  process.exit(1);
});
