import { createRequire } from "module";
import { spawn } from "child_process";
import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";

const require = createRequire("D:/repo/Koinia/package.json");
const WebSocket = require("ws");

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const outDir = "D:/repo/Koinia/.tmp-heritage-shots/community";
const port = 9336;
const viewports = [1440, 1024, 768, 390, 360];

mkdirSync(outDir, { recursive: true });

const chrome = spawn(
  chromePath,
  [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${join(outDir, "profile")}`,
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    "--no-first-run",
    "about:blank",
  ],
  { stdio: "ignore" }
);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForPage() {
  for (let i = 0; i < 50; i += 1) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/list`);
      if (res.ok) {
        const list = await res.json();
        const page = list.find((t) => t.type === "page" && t.webSocketDebuggerUrl);
        if (page) return page;
      }
    } catch {
      // retry
    }
    await sleep(250);
  }
  throw new Error("Chrome page did not start");
}

function connect(wsUrl) {
  const ws = new WebSocket(wsUrl);
  let id = 0;
  const pending = new Map();
  ws.on("message", (raw) => {
    const msg = JSON.parse(raw.toString());
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(JSON.stringify(msg.error)));
      else resolve(msg.result);
    }
  });
  const ready = new Promise((resolve, reject) => {
    ws.once("open", resolve);
    ws.once("error", reject);
  });
  return {
    ready,
    send(method, params = {}) {
      id += 1;
      return new Promise((resolve, reject) => {
        pending.set(id, { resolve, reject });
        ws.send(JSON.stringify({ id, method, params }));
      });
    },
    close() {
      ws.close();
    },
  };
}

try {
  const page = await waitForPage();
  const browser = connect(page.webSocketDebuggerUrl);
  await browser.ready;
  await browser.send("Page.enable");
  await browser.send("Runtime.enable");

  for (const width of viewports) {
    await browser.send("Emulation.setDeviceMetricsOverride", {
      width,
      height: 1100,
      deviceScaleFactor: 1,
      mobile: width < 768,
    });
    await browser.send("Page.navigate", { url: "http://localhost:3000/c/church-of-the-holy" });
    let ready = false;
    for (let i = 0; i < 80; i += 1) {
      await sleep(750);
      const check = await browser.send("Runtime.evaluate", {
        expression:
          "document.readyState === 'complete' && !!document.querySelector('.heritage-community-wall img') && [...document.querySelectorAll('.heritage-community-band img')].every((img) => img.complete && img.naturalWidth > 0)",
        returnByValue: true,
      });
      if (check.result?.value) {
        ready = true;
        break;
      }
    }
    if (!ready) throw new Error(`community missing at ${width}`);
    const metrics = await browser.send("Runtime.evaluate", {
      expression: `(() => {
        const el = document.querySelector('.heritage-community-band');
        el.scrollIntoView({ block: 'start' });
        const rect = el.getBoundingClientRect();
        const links = [...el.querySelectorAll('a')].map((a) => a.getAttribute('href'));
        return {
          overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
          x: Math.max(0, Math.floor(rect.left + window.scrollX)),
          y: Math.max(0, Math.floor(rect.top + window.scrollY)),
          height: Math.ceil(rect.height),
          links,
          cards: el.querySelectorAll('.heritage-community-card').length,
          wall: !!el.querySelector('.heritage-community-wall'),
          features: el.querySelectorAll('.heritage-community-feature').length,
        };
      })()`,
      returnByValue: true,
    });
    console.log(width, JSON.stringify(metrics.result?.value));
    const box = metrics.result?.value || { x: 0, y: 0, height: 900 };
    const shot = await browser.send("Page.captureScreenshot", {
      format: "png",
      captureBeyondViewport: true,
      clip: {
        x: box.x,
        y: box.y,
        width,
        height: Math.ceil(box.height),
        scale: 1,
      },
    });
    const dest = join(outDir, `community-${width}.png`);
    writeFileSync(dest, Buffer.from(shot.data, "base64"));
    console.log("wrote", dest);
  }
  browser.close();
} finally {
  chrome.kill();
}
