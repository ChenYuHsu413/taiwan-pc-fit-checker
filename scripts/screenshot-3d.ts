// 3D / 2D 截圖驗證：啟動 next start，用 URL query 預選零件，對 3D 與 2D 各截一張圖到 docs/screenshots/。
// 用法：npm run build && node scripts/screenshot-3d.ts
// Chromium 沒有 GPU 時以 SwiftShader（軟體 WebGL）繪製。

import { spawn, spawnSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { chromium } from "playwright";

const PORT = 3210;
const BASE = `http://localhost:${PORT}`;
const OUT = "docs/screenshots";

const BUILDS: { name: string; query: Record<string, string> }[] = [
  {
    name: "1-3500x-b850i-astral",
    query: {
      case: "corsair-3500x",
      mb: "asus-rog-strix-b850-i-gaming-wifi",
      gpu: "asus-rog-astral-rtx-5090-oc",
      ram: "corsair-dominator-titanium-rgb-cmp32gx5m2b6000z30w",
      air: "deepcool-ak620-digital",
    },
  },
  { name: "2-north-atx-astral", query: { case: "fractal-design-north", mb: "asus-tuf-gaming-b850-plus-wifi", gpu: "asus-rog-astral-rtx-5090-oc" } },
  {
    name: "3-north-front360-astral",
    query: {
      case: "fractal-design-north",
      mb: "asus-tuf-gaming-b850-plus-wifi",
      gpu: "asus-rog-astral-rtx-5090-oc",
      aio: "arctic-liquid-freezer-iii-pro-360",
      mount: "front",
    },
  },
  {
    name: "4-nr200p-itx-sfx-5050",
    query: {
      case: "cooler-master-masterbox-nr200p-v2",
      mb: "asus-rog-strix-b850-i-gaming-wifi",
      psu: "fsp-dagger-pro-atx31-850w",
      gpu: "asus-dual-rtx-5050-oc",
    },
  },
  { name: "5-y70-vertical-9070xt", query: { case: "hyte-y70", mb: "asus-tuf-gaming-b850-plus-wifi", gpu: "sapphire-nitro-plus-rx-9070-xt" } },
];

async function waitForServer(): Promise<void> {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`${BASE}/builder`);
      if (res.ok) return;
    } catch {
      // 尚未啟動
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error("next start 沒有在 60 秒內啟動");
}

async function main(): Promise<void> {
  mkdirSync(OUT, { recursive: true });
  try {
    await fetch(`${BASE}/builder`);
    throw new Error(`port ${PORT} 已被佔用，請先關掉舊的 next start`);
  } catch (e) {
    if (e instanceof Error && e.message.startsWith("port")) throw e;
  }
  const server = spawn("npx", ["next", "start", "-p", String(PORT)], { shell: true, stdio: "ignore" });
  try {
    await waitForServer();
    const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
    const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
    const webgl = await page.evaluate(() => {
      const c = document.createElement("canvas");
      return Boolean(c.getContext("webgl2") ?? c.getContext("webgl"));
    });
    console.log(`WebGL：${webgl ? "可用" : "不可用"}`);
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });

    for (const b of BUILDS) {
      for (const view of ["3d", "2d"] as const) {
        const qs = new URLSearchParams({ ...b.query, view }).toString();
        await page.goto(`${BASE}/builder?${qs}`, { waitUntil: "networkidle" });
        if (view === "3d") {
          await page.waitForSelector('[data-testid="fit-3d-canvas"] canvas', { timeout: 20000 });
          await page.waitForTimeout(2500);
        } else {
          await page.waitForSelector('[data-testid="fit-2d-svg"]', { timeout: 20000 });
        }
        const file = `${OUT}/${b.name}-${view}.png`;
        await page.screenshot({ path: file });
        console.log(`已截圖 ${file}`);
      }
    }
    if (errors.length) console.log(`頁面錯誤：\n${errors.join("\n")}`);
    await browser.close();
  } finally {
    // Windows 上 npx 透過 shell 啟動，要用 taskkill /T 連同子行程一起關掉
    if (process.platform === "win32" && server.pid) spawnSync("taskkill", ["/PID", String(server.pid), "/T", "/F"], { stdio: "ignore" });
    else server.kill();
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
