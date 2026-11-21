/**
 * Horizon Portal — Day 11 Screenshot Evidence Capture Script
 * scripts/capture-day11-screenshots.mjs
 *
 * Captures 10 authentic running application screens using headless Microsoft Edge CDP:
 * 1. 01_payroll_master_list.png
 * 2. 02_payroll_status_chips.png
 * 3. 03_payroll_run_detail.png
 * 4. 04_payroll_item_search.png
 * 5. 05_reconciliation_result_pr_2026_09.png
 * 6. 06_reconciliation_result_pr_2026_08.png
 * 7. 07_older_run_missing_items.png
 * 8. 08_month_over_month_comparison.png
 * 9. 09_approval_confirmation_dialog.png
 * 10. 10_audit_log_entry.png
 */

import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { SignJWT } from "jose";

const prisma = new PrismaClient();

const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const evidenceDir = path.join(process.cwd(), "reports", "day-11-evidence");
const tempProfile = path.join(evidenceDir, "temp_edge_day11_profile");

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

  console.log("1. Fetching Admin & HR demo users...");
  const adminUser = await prisma.user.findFirst({ where: { role: "Admin", isActive: true } });
  if (!adminUser) throw new Error("Admin user not found in database.");

  const adminToken = await makeToken(adminUser);

  console.log("2. Launching headless Edge on port 9340...");
  const edge = spawn(edgePath, [
    "--headless=new",
    "--remote-debugging-port=9340",
    `--user-data-dir=${tempProfile}`,
    "--window-size=1440,950",
    "--hide-scrollbars",
    "about:blank",
  ]);

  await new Promise((r) => setTimeout(r, 2000));

  try {
    const listRes = await fetch("http://localhost:9340/json/list");
    const tabs = await listRes.json();
    const pageTab = tabs.find((t) => t.type === "page") || tabs[0];
    const wsUrl = pageTab?.webSocketDebuggerUrl;
    if (!wsUrl) throw new Error("No webSocketDebuggerUrl found on Edge CDP port 9340.");

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

    await setSessionCookie(adminToken);

    // ── 01. Payroll Master List ──
    console.log("4. Capturing 01_payroll_master_list.png...");
    await send("Page.navigate", { url: "http://localhost:3000/payroll" });
    await new Promise((r) => setTimeout(r, 3500));
    const shot01 = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(evidenceDir, "01_payroll_master_list.png"), Buffer.from(shot01.data, "base64"));
    console.log("✓ Saved 01_payroll_master_list.png");

    // ── 02. Payroll Status Chips ──
    console.log("5. Capturing 02_payroll_status_chips.png...");
    // Focus capture on the first few table rows showing POSTED - PAYMENT PENDING and PAID
    const shot02 = await send("Page.captureScreenshot", {
      format: "png",
      clip: { x: 50, y: 280, width: 1340, height: 420, scale: 1 },
    });
    fs.writeFileSync(path.join(evidenceDir, "02_payroll_status_chips.png"), Buffer.from(shot02.data, "base64"));
    console.log("✓ Saved 02_payroll_status_chips.png");

    // ── 03. Payroll Run Detail Screen (PR-2026-09) ──
    console.log("6. Capturing 03_payroll_run_detail.png (PR-2026-09)...");
    await send("Page.navigate", { url: "http://localhost:3000/payroll/PR-2026-09" });
    await new Promise((r) => setTimeout(r, 3500));
    const shot03 = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(evidenceDir, "03_payroll_run_detail.png"), Buffer.from(shot03.data, "base64"));
    console.log("✓ Saved 03_payroll_run_detail.png");

    // ── 04. Payroll Item Search ──
    console.log("7. Capturing 04_payroll_item_search.png (Filtering EMP-0002)...");
    await send("Runtime.evaluate", {
      expression: `
        const input = document.querySelector('input[placeholder*="Search by Employee"]');
        if (input) {
          input.value = "EMP-0002";
          input.dispatchEvent(new Event("input", { bubbles: true }));
          input.dispatchEvent(new Event("change", { bubbles: true }));
        }
      `,
    });
    await new Promise((r) => setTimeout(r, 1500));
    const shot04 = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(evidenceDir, "04_payroll_item_search.png"), Buffer.from(shot04.data, "base64"));
    console.log("✓ Saved 04_payroll_item_search.png");

    // Clear search
    await send("Runtime.evaluate", {
      expression: `
        const input = document.querySelector('input[placeholder*="Search by Employee"]');
        if (input) {
          input.value = "";
          input.dispatchEvent(new Event("input", { bubbles: true }));
        }
      `,
    });
    await new Promise((r) => setTimeout(r, 1000));

    // ── 05. Reconciliation Result PR-2026-09 ──
    console.log("8. Capturing 05_reconciliation_result_pr_2026_09.png...");
    // Scroll down to reconciliation panel
    await send("Runtime.evaluate", {
      expression: `
        window.scrollTo({ top: 380, behavior: "instant" });
      `,
    });
    await new Promise((r) => setTimeout(r, 1000));
    const shot05 = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(evidenceDir, "05_reconciliation_result_pr_2026_09.png"), Buffer.from(shot05.data, "base64"));
    console.log("✓ Saved 05_reconciliation_result_pr_2026_09.png");

    // ── 06. Reconciliation Result PR-2026-08 ──
    console.log("9. Capturing 06_reconciliation_result_pr_2026_08.png...");
    await send("Page.navigate", { url: "http://localhost:3000/payroll/PR-2026-08" });
    await new Promise((r) => setTimeout(r, 3500));
    await send("Runtime.evaluate", {
      expression: `
        window.scrollTo({ top: 350, behavior: "instant" });
      `,
    });
    await new Promise((r) => setTimeout(r, 1000));
    const shot06 = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(evidenceDir, "06_reconciliation_result_pr_2026_08.png"), Buffer.from(shot06.data, "base64"));
    console.log("✓ Saved 06_reconciliation_result_pr_2026_08.png");

    // ── 07. Older Run Missing Items (PR-2026-03) ──
    console.log("10. Capturing 07_older_run_missing_items.png (PR-2026-03)...");
    await send("Page.navigate", { url: "http://localhost:3000/payroll/PR-2026-03" });
    await new Promise((r) => setTimeout(r, 3500));
    const shot07 = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(evidenceDir, "07_older_run_missing_items.png"), Buffer.from(shot07.data, "base64"));
    console.log("✓ Saved 07_older_run_missing_items.png");

    // ── 08. Month-over-Month Comparison Card ──
    console.log("11. Capturing 08_month_over_month_comparison.png...");
    await send("Page.navigate", { url: "http://localhost:3000/payroll/PR-2026-09" });
    await new Promise((r) => setTimeout(r, 3500));
    const shot08 = await send("Page.captureScreenshot", {
      format: "png",
      clip: { x: 60, y: 190, width: 1320, height: 260, scale: 1 },
    });
    fs.writeFileSync(path.join(evidenceDir, "08_month_over_month_comparison.png"), Buffer.from(shot08.data, "base64"));
    console.log("✓ Saved 08_month_over_month_comparison.png");

    // ── 09. Approval Confirmation Dialog ──
    console.log("12. Capturing 09_approval_confirmation_dialog.png...");
    await send("Runtime.evaluate", {
      expression: `
        const btns = Array.from(document.querySelectorAll("button"));
        const approveBtn = btns.find(b => b.textContent && b.textContent.includes("Approve Payroll Run"));
        if (approveBtn) approveBtn.click();
      `,
    });
    await new Promise((r) => setTimeout(r, 1200));
    const shot09 = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(evidenceDir, "09_approval_confirmation_dialog.png"), Buffer.from(shot09.data, "base64"));
    console.log("✓ Saved 09_approval_confirmation_dialog.png");

    // Close modal
    await send("Runtime.evaluate", {
      expression: `
        const btns = Array.from(document.querySelectorAll("button"));
        const cancelBtn = btns.find(b => b.textContent && b.textContent.includes("Cancel"));
        if (cancelBtn) cancelBtn.click();
      `,
    });
    await new Promise((r) => setTimeout(r, 500));

    // ── 10. Audit Log Inspection ──
    console.log("13. Capturing 10_audit_log_entry.png (Admin Audit Console)...");
    await send("Page.navigate", { url: "http://localhost:3000/admin/audit" });
    await new Promise((r) => setTimeout(r, 3500));
    const shot10 = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(evidenceDir, "10_audit_log_entry.png"), Buffer.from(shot10.data, "base64"));
    console.log("✓ Saved 10_audit_log_entry.png");

    console.log("\n=======================================================");
    console.log(" ALL 10 DAY 11 EVIDENCE SCREENSHOTS CAPTURED CLEANLY!  ");
    console.log("=======================================================\n");

    ws.close();
  } finally {
    edge.kill();
    try {
      fs.rmSync(tempProfile, { recursive: true, force: true });
    } catch {}
  }
}

capture().catch((err) => {
  console.error("Screenshot capture error:", err);
  process.exit(1);
}).finally(() => prisma.$disconnect());

