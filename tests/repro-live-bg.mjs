import { chromium, webkit, devices } from "playwright";

const URL = process.env.QUEST_URL || "https://oguzhanberkeozdil.github.io/date-night/?name=Elif";
const waitMs = Number(process.env.WAIT_MS || 9000);
const tag = process.env.TAG || "before";

async function run(browserType, engine) {
  const browser = await browserType.launch();
  const page = await browser.newPage({ ...devices["iPhone 13"] });
  await page.goto(URL, { waitUntil: "networkidle" });
  await page.waitForTimeout(waitMs);

  const info = await page.evaluate(() => {
    const img = document.querySelector(".scene-bg__img");
    const bg = document.getElementById("bgLayer");
    const vp = { w: window.innerWidth, h: window.innerHeight };
    const r = img?.getBoundingClientRect();
    const cs = img ? getComputedStyle(img) : null;
    const corners = [
      [8, 80],
      [vp.w - 8, 80],
      [8, vp.h - 8],
      [vp.w - 8, vp.h - 8],
    ].map(([x, y]) => {
      const top = document.elementFromPoint(x, y);
      const covers =
        r && x >= r.left - 1 && x <= r.right + 1 && y >= r.top - 1 && y <= r.bottom + 1;
      return {
        x,
        y,
        topId: top?.id || "",
        topClass: (top?.className && String(top.className).slice(0, 50)) || top?.tagName,
        imgCoversPoint: covers,
      };
    });
    const fullBleed =
      r && r.left <= 1 && r.top <= 1 && r.width >= vp.w - 2 && r.height >= vp.h - 2;
    return {
      vp,
      bgSize: { w: bg?.offsetWidth, h: bg?.offsetHeight },
      imgRect: r && { x: r.x, y: r.y, w: r.width, h: r.height },
      transform: cs?.transform,
      fullBleed,
      corners,
    };
  });

  const path = `/opt/cursor/artifacts/screenshots/${tag}-live-title-${engine}.png`;
  await page.screenshot({ path, fullPage: false });
  console.log(engine, JSON.stringify(info, null, 2));
  await browser.close();
  return info;
}

let ok = true;
const c = await run(chromium, "chromium");
ok =
  ok &&
  c.fullBleed &&
  c.corners.every((p) => p.imgCoversPoint);

try {
  const w = await run(webkit, "webkit");
  ok = ok && w.fullBleed && w.corners.every((p) => p.imgCoversPoint);
} catch (e) {
  console.warn("webkit skipped:", e.message?.slice(0, 120));
}

process.exit(ok ? 0 : 2);
