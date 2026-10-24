import { chromium, webkit, devices } from "playwright";
import { PNG } from "pngjs";

const URL = process.env.QUEST_URL || "http://127.0.0.1:8765/?name=Elif";
const waitMs = Number(process.env.WAIT_MS || 2500);
const tag = process.env.TAG || "local";

function samplePngCorners(buffer) {
  const png = PNG.sync.read(buffer);
  const { width, height, data } = png;
  const pts = [
    [2, 2],
    [width - 3, 2],
    [2, height - 3],
    [width - 3, height - 3],
    [width / 2, 2],
    [width / 2, height - 3],
    [2, height / 2],
    [width - 3, height / 2],
  ];
  return pts.map(([x, y]) => {
    const ix = Math.max(0, Math.min(width - 1, Math.round(x)));
    const iy = Math.max(0, Math.min(height - 1, Math.round(y)));
    const i = (width * iy + ix) << 2;
    return { x: ix, y: iy, r: data[i], g: data[i + 1], b: data[i + 2] };
  });
}

function isCreamBorder(px) {
  const { r, g, b } = px;
  return r > 228 && g > 218 && b > 195 && r - b < 40;
}

async function run(browserType, engine) {
  const browser = await browserType.launch();
  const page = await browser.newPage({ ...devices["iPhone 13"] });
  await page.goto(URL, { waitUntil: "networkidle" });
  await page.waitForTimeout(waitMs);

  const layout = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
    vp: { w: window.innerWidth, h: window.innerHeight },
  }));

  const shot = await page.screenshot({ fullPage: false });
  const corners = samplePngCorners(shot);
  const creamEdges = corners.filter(isCreamBorder);

  const path = `/opt/cursor/artifacts/screenshots/${tag}-live-title-${engine}.png`;
  await page.screenshot({ path, fullPage: false });
  console.log(engine, JSON.stringify({ layout, corners, creamEdges: creamEdges.length }, null, 2));
  await browser.close();
  return {
    ok: layout.scrollWidth === layout.innerWidth && creamEdges.length === 0,
  };
}

let ok = true;
ok = (await run(chromium, "chromium")).ok && ok;

try {
  ok = (await run(webkit, "webkit")).ok && ok;
} catch (e) {
  console.warn("webkit skipped:", e.message?.slice(0, 120));
}

process.exit(ok ? 0 : 2);
