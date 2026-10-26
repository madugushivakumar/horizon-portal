import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const scratchDir = 'C:\\Users\\Madugu Shiva Kumar\\.gemini\\antigravity-ide\\brain\\e034056e-d8a5-4818-89fd-76783faa40d1\\scratch';
const tempProfile = path.join(scratchDir, 'temp_edge_profile');
const targetScreenshot = path.join(scratchDir, 'shot_leave.png');

async function main() {
  console.log('1. Authenticating as employee...');
  const loginRes = await fetch('http://localhost:3000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'employee@growmar.com',
      password: 'Employee@Horizon2026!',
    }),
  });

  const cookieHeader = loginRes.headers.get('set-cookie');
  console.log('Login status:', loginRes.status);
  if (!cookieHeader) {
    throw new Error('No set-cookie returned from login endpoint.');
  }

  const match = cookieHeader.match(/horizon_session=([^;]+)/);
  if (!match) {
    throw new Error('horizon_session not found in cookie header.');
  }
  const token = match[1];
  console.log('Obtained session token:', token.substring(0, 20) + '...');

  if (!fs.existsSync(tempProfile)) {
    fs.mkdirSync(tempProfile, { recursive: true });
  }

  console.log('2. Launching Edge headless with CDP on port 9222...');
  const edge = spawn(edgePath, [
    '--headless=new',
    '--remote-debugging-port=9222',
    `--user-data-dir=${tempProfile}`,
    '--window-size=1280,1024',
    '--hide-scrollbars',
    'about:blank',
  ]);

  // Give Edge 1.5 seconds to open port
  await new Promise((r) => setTimeout(r, 1500));

  try {
    const listRes = await fetch('http://localhost:9222/json/list');
    const tabs = await listRes.json();
    const wsUrl = tabs[0]?.webSocketDebuggerUrl;
    if (!wsUrl) throw new Error('No webSocketDebuggerUrl found.');

    console.log('3. Connecting to CDP WebSocket...');
    const ws = new WebSocket(wsUrl);

    let id = 1;
    const send = (method, params = {}) =>
      new Promise((resolve, reject) => {
        const curId = id++;
        const handler = (evt) => {
          const msg = JSON.parse(evt.data);
          if (msg.id === curId) {
            ws.removeEventListener('message', handler);
            if (msg.error) reject(msg.error);
            else resolve(msg.result);
          }
        };
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify({ id: curId, method, params }));
      });

    await new Promise((resolve) => ws.addEventListener('open', resolve, { once: true }));

    console.log('4. Setting horizon_session cookie...');
    await send('Network.enable');
    await send('Network.setCookie', {
      name: 'horizon_session',
      value: token,
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
    });

    console.log('5. Navigating to http://localhost:3000/leave...');
    await send('Page.enable');
    await send('Page.navigate', { url: 'http://localhost:3000/leave' });

    // Wait for network idle and React hydration
    console.log('6. Waiting for page hydration and data loading...');
    await new Promise((r) => setTimeout(r, 3000));

    console.log('7. Capturing screenshot...');
    const capture = await send('Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: false,
    });

    fs.writeFileSync(targetScreenshot, Buffer.from(capture.data, 'base64'));
    console.log('Saved screenshot to:', targetScreenshot);

    ws.close();
  } finally {
    edge.kill();
  }
}

main().catch((err) => {
  console.error('Error during capture:', err);
  process.exit(1);
});
