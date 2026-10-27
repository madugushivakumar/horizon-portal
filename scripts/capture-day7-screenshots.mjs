import { spawn } from "child_process";
import fs from "fs";
import path from "path";

const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const artifactDir = "C:\\Users\\Madugu Shiva Kumar\\.gemini\\antigravity-ide\\brain\\dcb021e3-ef09-4c0f-a4fd-768a2b20955c";
const scratchDir = path.join(artifactDir, "scratch");
const tempProfile = path.join(scratchDir, "temp_edge_day7_profile");

const shotList = path.join(artifactDir, "screenshot_payslip_month_list.png");
const shotDetail = path.join(artifactDir, "screenshot_payslip_detail.png");
const shotForbidden = path.join(artifactDir, "screenshot_payslip_forbidden_403.png");

async function capture() {
  console.log("1. Authenticating as employee (employee@growmar.com)...");
  const loginRes = await fetch("http://localhost:3000/api/v1/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "employee@growmar.com",
      password: "Employee@Horizon2026!",
    }),
  });

  const cookieHeader = loginRes.headers.get("set-cookie");
  console.log("Login status:", loginRes.status);
  if (!cookieHeader) {
    throw new Error("No set-cookie returned from login endpoint.");
  }

  const match = cookieHeader.match(/horizon_session=([^;]+)/);
  if (!match) {
    throw new Error("horizon_session not found in cookie header.");
  }
  const token = match[1];
  console.log("Obtained session token successfully.");

  if (!fs.existsSync(tempProfile)) {
    fs.mkdirSync(tempProfile, { recursive: true });
  }

  console.log("2. Launching Edge headless with CDP on port 9222...");
  const edge = spawn(edgePath, [
    "--headless=new",
    "--remote-debugging-port=9222",
    `--user-data-dir=${tempProfile}`,
    "--window-size=1280,1024",
    "--hide-scrollbars",
    "about:blank",
  ]);

  // Give Edge time to start up
  await new Promise((r) => setTimeout(r, 2000));

  try {
    const listRes = await fetch("http://localhost:9222/json/list");
    const tabs = await listRes.json();
    const wsUrl = tabs[0]?.webSocketDebuggerUrl;
    if (!wsUrl) throw new Error("No webSocketDebuggerUrl found.");

    console.log("3. Connecting to Edge via CDP WebSocket...");
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

    console.log("4. Setting horizon_session cookie...");
    await send("Network.enable");
    await send("Network.setCookie", {
      name: "horizon_session",
      value: token,
      domain: "localhost",
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
    });

    await send("Page.enable");

    // ── Capture 1: /payslips Month List ──
    console.log("5. Navigating to http://localhost:3000/payslips...");
    await send("Page.navigate", { url: "http://localhost:3000/payslips" });
    await new Promise((r) => setTimeout(r, 3500));

    console.log("6. Capturing screenshot of Payslip Month List...");
    const capList = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(shotList, Buffer.from(capList.data, "base64"));
    console.log("✓ Saved Payslip Month List screenshot:", shotList);

    // ── Capture 2: /payslips/PR-2026-04 Detail View ──
    console.log("7. Navigating to http://localhost:3000/payslips/PR-2026-04...");
    await send("Page.navigate", { url: "http://localhost:3000/payslips/PR-2026-04" });
    await new Promise((r) => setTimeout(r, 3500));

    console.log("8. Capturing screenshot of Payslip Detail View...");
    const capDetail = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(shotDetail, Buffer.from(capDetail.data, "base64"));
    console.log("✓ Saved Payslip Detail screenshot:", shotDetail);

    // ── Capture 3: /payslips/PI-005076 Cross-Employee Access Attempt (403 Forbidden) ──
    console.log("9. Navigating to http://localhost:3000/payslips/PI-005076 (Foreign Employee Payslip)...");
    await send("Page.navigate", { url: "http://localhost:3000/payslips/PI-005076" });
    await new Promise((r) => setTimeout(r, 3500));

    console.log("10. Capturing screenshot of 403 Forbidden Protection View...");
    const capForbidden = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(shotForbidden, Buffer.from(capForbidden.data, "base64"));
    console.log("✓ Saved 403 Forbidden screenshot:", shotForbidden);

    ws.close();
    console.log("\nAll browser screenshots captured successfully!");
  } finally {
    edge.kill();
  }
}

capture().catch((err) => {
  console.error("Error capturing screenshots:", err);
  process.exit(1);
});
