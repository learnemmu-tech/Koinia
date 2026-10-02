import { createRequire } from "module";
import { spawn } from "child_process";
import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";

const require = createRequire("D:/repo/Koinia/package.json");
const WebSocket = require("ws");

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const outDir = "D:/repo/Koinia/.tmp-heritage-shots";
const port = 9333;
const url = "http://localhost:3000/c/church-of-the-holy";
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
    "--headless",
    "--disable-gpu",
    "--hide-scrollbars",
    "--no-first-run",
    "--no-default-browser-check",
    url,
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
  const client = connect(page.webSocketDebuggerUrl);
  await client.ready;
  await client.send("Page.enable");
  await client.send("Runtime.enable");

  for (const vp of viewports) {
    await client.send("Emulation.setDeviceMetricsOverride", {
      width: vp.width,
      height: vp.height,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await client.send("Page.navigate", { url });
    await sleep(8000);
    const ready = await client.send("Runtime.evaluate", {
      expression: "!!document.querySelector('.heritage-hero') && document.readyState === 'complete'",
      returnByValue: true,
    });
    console.log(vp.name, "ready", ready.result?.value);
    const shot = await client.send("Page.captureScreenshot", {
      format: "png",
    });
    if (!shot?.data) throw new Error(`No screenshot data for ${vp.name}: ${JSON.stringify(shot)}`);
    const dest = join(outDir, `${vp.name}.png`);
    writeFileSync(dest, Buffer.from(shot.data, "base64"));
    console.log("wrote", dest, Buffer.from(shot.data, "base64").length);
    if (vp.width <= 768) {
      await client.send("Runtime.evaluate", {
        expression: "document.querySelector('.heritage-header-toggle')?.click(); true",
        returnByValue: true,
      });
      await sleep(900);
      const click = await client.send("Runtime.evaluate", {
        expression: `(() => {
          const drawer = document.querySelector('.heritage-nav-drawer');
          const layer = document.querySelector('.heritage-nav-layer');
          const copy = document.querySelector('.heritage-hero-copy');
          const cs = drawer ? getComputedStyle(drawer) : null;
          const layerCs = layer ? getComputedStyle(layer) : null;
          const cscopy = copy ? getComputedStyle(copy) : null;
          return {
            open: drawer?.classList.contains('is-open') ?? false,
            drawerBg: cs?.backgroundColor ?? null,
            layerBg: layerCs?.backgroundColor ?? null,
            width: cs?.width ?? null,
            transform: cs?.transform ?? null,
            right: cs?.right ?? null,
            zIndex: layerCs?.zIndex ?? null,
            textAlign: cscopy?.textAlign ?? null,
            nameHidden: getComputedStyle(document.querySelector('.heritage-brand-name') || document.body).display,
            heroVisible: !!document.querySelector('.heritage-hero-title')?.textContent,
          };
        })()`,
        returnByValue: true,
      });
      console.log(vp.name, "menu", JSON.stringify(click.result?.value));
      const menu = await client.send("Page.captureScreenshot", {
        format: "png",
      });
      writeFileSync(join(outDir, `${vp.name}-menu.png`), Buffer.from(menu.data, "base64"));
      console.log("wrote menu", Buffer.from(menu.data, "base64").length);
      await client.send("Runtime.evaluate", {
        expression: "document.querySelector('.heritage-nav-drawer-close')?.click(); true",
        returnByValue: true,
      });
      await sleep(400);
    }
  }

  client.close();
} finally {
  chrome.kill();
}
