import { chromium, devices } from "playwright";
import { createServer } from "http";
import { readFile } from "fs/promises";
import { join, extname } from "path";
import { fileURLToPath } from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const root = join(__dirname, "..");
const MIME = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
};

function server() {
  return new Promise((resolve) => {
    const s = createServer(async (req, res) => {
      let path = req.url.split("?")[0];
      if (path === "/") path = "/index.html";
      try {
        const file = join(root, path.replace(/^\//, ""));
        const data = await readFile(file);
        res.writeHead(200, { "Content-Type": MIME[extname(file)] || "application/octet-stream" });
        res.end(data);
      } catch {
        res.writeHead(404);
        res.end("not found");
      }
    });
    s.listen(0, () => resolve(s));
  });
}

function intersects(a, b) {
  return !(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom);
}

function blockersFor(screen) {
  const base =
    ".btn--primary, .btn--secondary, .name-chips button, .carrot-btn, #horseIdleImg, #btnSteedNext, .vial, .tarot-card";
  if (screen === "potion") {
    return `${base}, #potionIngredients .potion-ing:first-of-type`;
  }
  return `${base}, .potion-ing`;
}

const CASES = [
  { viewport: { width: 1920, height: 1080 }, screen: "potion", unlock: "alchemist", label: "desktop1920-potion" },
  { viewport: { width: 1366, height: 768 }, screen: "sheet", unlock: "charm", label: "desktop1366-sheet" },
  { viewport: { width: 1366, height: 768 }, screen: "rating", unlock: "charts", label: "desktop1366-rating" },
  { viewport: { width: 1366, height: 768 }, screen: "tavern", unlock: "fanum", label: "desktop1366-tavern" },
  { viewport: { width: 1366, height: 768 }, screen: "potion", unlock: "alchemist", label: "desktop1366-potion" },
  { viewport: { width: 1366, height: 768 }, screen: "stars", unlock: "fate", label: "desktop1366-stars" },
  { device: "iPhone 13", screen: "potion", unlock: "alchemist", label: "iphone-potion" },
  { device: null, viewport: { width: 360, height: 740 }, screen: "potion", unlock: "alchemist", label: "mobile360-potion" },
];

async function assertNoToastOverlap(page, label, screen) {
  const toast = page.locator(".achievement-toast").first();
  await toast.waitFor({ state: "visible", timeout: 3000 });
  const overlaps = await page.evaluate((sel) => {
    const t = document.querySelector(".achievement-toast");
    if (!t) return [];
    const tr = t.getBoundingClientRect();
    const bad = [];
    const scope = document.querySelector(".screen--active") || document;
    scope.querySelectorAll(sel).forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) return;
      const hit = !(tr.right <= r.left || tr.left >= r.right || tr.bottom <= r.top || tr.top >= r.bottom);
      if (hit) bad.push(el.className || el.id || el.tagName);
    });
    return bad;
  }, blockersFor(screen));
  if (overlaps.length) {
    throw new Error(`${label}: toast overlaps ${overlaps.join(", ")}`);
  }
}

async function assertSteedDialogueClear(page) {
  const box = page.locator("#dialogueBox:not(.hidden)");
  await box.waitFor({ state: "visible", timeout: 5000 });
  const hit = await page.evaluate(() => {
    const d = document.getElementById("dialogueBox");
    const horse = document.getElementById("horseIdleImg");
    if (!d || !horse) return false;
    const dr = d.getBoundingClientRect();
    const hr = horse.getBoundingClientRect();
    return !(dr.right <= hr.left || dr.left >= hr.right || dr.bottom <= hr.top || dr.top >= hr.bottom);
  });
  if (hit) throw new Error("steed dialogue overlaps horse image");
}

const s = await server();
const port = s.address().port;
const browser = await chromium.launch();

for (const c of CASES) {
  const ctx = c.device
    ? { ...devices[c.device], hasTouch: true }
    : { viewport: c.viewport, hasTouch: !!(c.viewport && c.viewport.width < 800) };
  const page = await browser.newPage(ctx);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => {
    document.startViewTransition = undefined;
  });
  await page.goto(`http://127.0.0.1:${port}/?name=Ayse`, { waitUntil: "networkidle" });
  await page.waitForFunction(() => typeof window.__questNavigate === "function");
  await page.evaluate((sid) => window.__questNavigate(sid), c.screen);
  await page.waitForSelector(`.screen--active[data-screen="${c.screen}"]`);
  if (c.screen === "potion") {
    await page.waitForSelector("#potionIngredients button");
    await page.evaluate(() => {
      document.getElementById("potionIngredients")?.querySelector("button")?.click();
    });
  }
  if (c.screen === "tavern") {
    await page.evaluate(() => document.getElementById("fanumTax")?.click());
  }
  await page.waitForFunction(() => typeof window.__questUnlock === "function");
  await page.evaluate((id) => window.__questUnlock(id), c.unlock);
  await page.waitForTimeout(80);
  await assertNoToastOverlap(page, c.label, c.screen);
  await page.close();
}

const steedPage = await browser.newPage({ ...devices["iPhone 13"], hasTouch: true });
await steedPage.goto(`http://127.0.0.1:${port}/?name=Ayse`, { waitUntil: "networkidle" });
await steedPage.waitForFunction(() => typeof window.__questNavigate === "function");
await steedPage.evaluate(() => window.__questNavigate("steed"));
await assertSteedDialogueClear(steedPage);
await steedPage.evaluate(() => window.__questUnlock("snack"));
await assertNoToastOverlap(steedPage, "iphone-steed-snack", "steed");
await assertSteedDialogueClear(steedPage);
await steedPage.close();

await browser.close();
s.close();
console.log("toast-overlap OK");
