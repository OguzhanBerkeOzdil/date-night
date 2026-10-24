import { chromium, devices } from "playwright";

const base = process.env.QUEST_URL || "http://127.0.0.1:8765/?name=Elif";
const tag = process.env.TAG || "after-local";
const waitMs = Number(process.env.WAIT_MS || 2000);
const screens = ["title", "summons", "steed", "decree"];

const browser = await chromium.launch();
const page = await browser.newPage({ ...devices["iPhone 13"] });
await page.emulateMedia({ reducedMotion: "reduce" });
await page.goto(base, { waitUntil: "networkidle" });
await page.waitForTimeout(waitMs);

for (const s of screens) {
  if (s !== "title") await page.evaluate((id) => window.__questNavigate?.(id), s);
  await page.waitForTimeout(500);
  await page.screenshot({ path: `/opt/cursor/artifacts/screenshots/${tag}-${s}-iphone13.png` });
}
await browser.close();
console.log("saved", tag, screens.join(", "));
