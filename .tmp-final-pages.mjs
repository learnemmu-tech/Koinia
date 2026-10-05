import { createRequire } from "module";
import { spawn } from "child_process";
import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";

const require = createRequire("D:/repo/Koinia/package.json");
const WebSocket = require("ws");

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const outDir = "D:/repo/Koinia/.tmp-heritage-shots/final";
const port = 9334;
const pages = [
  { name: "sermons", path: "/c/church-of-the-holy/sermons" },
  { name: "articles", path: "/c/church-of-the-holy/articles" },
  { name: "songs", path: "/c/church-of-the-holy/songs" },
  { name: "community", path: "/c/church-of-the-holy/community" },
  { name: "prayer", path: "/c/church-of-the-holy/prayer" },
  { name: "login", path: "/c/church-of-the-holy/login" },
  { name: "signup", path: "/c/church-of-the-holy/signup" },
];
const viewports = [
  { name: "1440", width: 1440, height: 900 },
  { name: "1024", width: 1024, height: 768 },
  { name: "768", width: 768, height: 1024 },
  { name: "390", width: 390, height: 844 },
  { name: "360", width: 360, height: 800 },
];

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
    "--no-default-browser-check",
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

  for (const pageInfo of pages) {
    const url = `http://localhost:3000${pageInfo.path}`;
    for (const vp of viewports) {
      await browser.send("Emulation.setDeviceMetricsOverride", {
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: 1,
        mobile: vp.width <= 390,
      });
      await browser.send("Page.navigate", { url });
      let ready = false;
      for (let i = 0; i < 40; i += 1) {
        await sleep(500);
        const check = await browser.send("Runtime.evaluate", {
          expression:
            "document.readyState === 'complete' && !document.body.innerText.includes('Preparing FaithConnectHub') && !!document.querySelector('h1')",
          returnByValue: true,
        });
        if (check.result?.value) {
          ready = true;
          break;
        }
      }
      if (!ready) await sleep(2000);
      const metrics = await browser.send("Runtime.evaluate", {
        expression: `({
          title: document.querySelector('h1')?.textContent?.trim() || '',
          authBar: !!document.querySelector('.heritage-auth-bar'),
          confirm: !!document.querySelector('#confirmPassword'),
          overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
          intro: !!document.querySelector('.heritage-page-intro, .heritage-content-system'),
        })`,
        returnByValue: true,
      });
      console.log(pageInfo.name, vp.name, JSON.stringify(metrics.result?.value));
      const shot = await browser.send("Page.captureScreenshot", { format: "png" });
      const dest = join(outDir, `${pageInfo.name}-${vp.name}.png`);
      writeFileSync(dest, Buffer.from(shot.data, "base64"));
      console.log("wrote", dest, Buffer.from(shot.data, "base64").length);
    }
  }
  browser.close();
} finally {
  chrome.kill();
}
