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
  ".mjs": "text/javascript",
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

const errors = [];

function intersects(a, b) {
  return !(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom);
}

async function gotoDragonNoName(page, baseUrl) {
  await page.goto(baseUrl);
  await page.click("#btnNewGame");
  await page.waitForSelector('[data-screen="summons"].screen--active');
  await page.evaluate(() => document.getElementById("waxSealArt")?.click());
  await page.waitForSelector("#btnSummonBegin:not(.hidden)", { timeout: 15000 });
  await page.click("#btnSummonBegin");
  await page.waitForSelector('[data-screen="steed"].screen--active');
  for (let i = 0; i < 4; i++) {
    const box = page.locator("#dialogueBox:not(.hidden)");
    if (await box.count()) await box.click();
    await page.waitForTimeout(100);
  }
  await page.click("#btnSteedNext");
  await page.click("#btnRoll");
  await page.click('[data-class="Knight of the Wildflowers"]');
  await page.click("#btnSheetNext");
  await page.click("#btnRatingNext");
  await page.locator(".journal-entry").first().click();
  await page.waitForSelector('[data-screen="dragon"].screen--active', { timeout: 8000 });
}

async function tapNayCenter(page) {
  const nay = page.locator("#btnNo");
  await nay.scrollIntoViewIfNeeded();
  if (!(await nay.boundingBox())) throw new Error("Nay missing");
  await nay.dispatchEvent("pointerdown", { bubbles: true });
  await page.waitForTimeout(35);
  await nay.dispatchEvent("pointerup", { bubbles: true });
}

async function testNay25(page, baseUrl, viewport, label) {
  await page.setViewportSize(viewport);
  await gotoDragonNoName(page, baseUrl);
  let lastAttempts = 0;
  for (let i = 0; i < 25; i++) {
    await tapNayCenter(page);
    await page.waitForTimeout(50);
    const attempts = await page.evaluate(() => window.__questReadNoAttempts?.() ?? 0);
    if (attempts <= lastAttempts) {
      throw new Error(`${label}: Nay tap ${i + 1} did not advance counter (${lastAttempts} -> ${attempts})`);
    }
    lastAttempts = attempts;
    const inBounds = await page.evaluate(() => {
      const n = document.getElementById("btnNo");
      const arena = document.getElementById("dateButtons");
      if (!n || !arena) return false;
      const nr = n.getBoundingClientRect();
      const ar = arena.getBoundingClientRect();
      const vh = window.innerHeight;
      const inArena =
        nr.top >= ar.top - 2 &&
        nr.left >= ar.left - 2 &&
        nr.bottom <= ar.bottom + 2 &&
        nr.right <= ar.right + 2;
      const inView = nr.top >= 0 && nr.left >= 0 && nr.bottom <= vh && nr.right <= window.innerWidth;
      return inArena && inView;
    });
    if (!inBounds) throw new Error(`${label}: Nay out of arena/viewport after tap ${i + 1}`);
  }
  if (lastAttempts < 25) throw new Error(`${label}: expected 25 attempts, got ${lastAttempts}`);
  await page.waitForFunction(
    () => document.getElementById("realNoLink")?.classList.contains("honest-link--armed"),
    { timeout: 12000 }
  );
  await page.locator("#realNoLink").click();
  await page.waitForSelector('[data-screen="honest-no"].screen--active', { timeout: 5000 });
}

async function testDecreeTime(page, baseUrl) {
  await page.goto(baseUrl + "?name=Ayse");
  await page.evaluate(() => {
    const data = {
      steedName: "Clover",
      steedClass: "Knight",
      day: "This Saturday",
      time: "Morning ride",
      tarotKey: "golden",
      tarotCard: "The Golden Hour",
      lastScreen: "decree",
      secondDate: "yes",
      food: ["Pizza"],
      activities: ["Movie night"],
      potionName: "Elixir",
      todayVibe: "A rom-com",
      rating: 10,
    };
    localStorage.setItem("questLady_v2", JSON.stringify(data));
  });
  await page.reload();
  await page.click("#btnContinue");
  await page.waitForSelector('[data-screen="decree"].screen--active');
  const text = await page.locator("#decreePreview").innerText();
  const rideLine = text.split("\n").find((l) => l.startsWith("When we ride:"));
  if (!rideLine) throw new Error("decree missing When we ride line");
  if (/Morning ride.*Morning ride/.test(rideLine)) {
    throw new Error(`duplicated time in decree: ${rideLine}`);
  }
  const dup = await page.evaluate(async () => {
    const { buildSummaryText } = await import("./js/decree.js");
    const line = buildSummaryText().split("\n").find((l) => l.startsWith("When we ride:"));
    return line;
  });
  if (dup && /Morning ride.*Morning ride/.test(dup)) throw new Error(`PNG text dup: ${dup}`);
}

async function testToastNoControls(page, baseUrl, viewport) {
  await page.setViewportSize(viewport);
  await page.goto(baseUrl + "?name=Ayse");
  await page.waitForFunction(() => typeof window.__questNavigate === "function");
  await page.evaluate(() => window.__questNavigate("stars"));
  await page.waitForSelector('[data-screen="stars"].screen--active');
  await page.evaluate(() => {
    try {
      const raw = JSON.parse(localStorage.getItem("questLady_v2") || "{}");
      raw.achievements = (raw.achievements || []).filter((id) => id !== "fate");
      raw.lastScreen = "stars";
      localStorage.setItem("questLady_v2", JSON.stringify(raw));
    } catch (_) {}
  });
  await page.reload();
  await page.waitForFunction(() => typeof window.__questNavigate === "function");
  await page.waitForSelector('[data-screen="stars"].screen--active', { timeout: 8000 }).catch(async () => {
    await page.evaluate(() => window.__questNavigate("stars"));
    await page.waitForSelector('[data-screen="stars"].screen--active');
  });
  await page.evaluate(() => window.__questUnlock?.("fate"));
  const toast = page.locator(".achievement-toast").first();
  await toast.waitFor({ state: "visible", timeout: 12000 });
  const bad = await page.evaluate(() => {
    const t = document.querySelector(".achievement-toast");
    if (!t) return ["no toast"];
    const tr = t.getBoundingClientRect();
    const scope = document.querySelector(".screen--active");
    if (!scope) return [];
    const sel =
      "button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), .chip-select, .title, h2";
    const hits = [];
    scope.querySelectorAll(sel).forEach((el) => {
      if (el.closest(".top-bar")) return;
      const r = el.getBoundingClientRect();
      if (r.width < 8 || r.height < 8) return;
      const hit = !(tr.right <= r.left || tr.left >= r.right || tr.bottom <= r.top || tr.top >= r.bottom);
      if (hit) hits.push(el.id || el.className || el.tagName);
    });
    return hits;
  });
  if (bad.length) throw new Error(`toast overlaps controls at ${viewport.width}x${viewport.height}: ${bad.join(", ")}`);
}

async function runSuite(viewport, deviceOpts, label) {
  const s = await server();
  const port = s.address().port;
  const baseUrl = `http://127.0.0.1:${port}/`;
  const browser = await chromium.launch();
  const context = await browser.newContext({
    ...deviceOpts,
    viewport,
    hasTouch: true,
  });
  const page = await context.newPage();
  page.on("console", (m) => m.type() === "error" && errors.push(`[${label}] ${m.text()}`));
  page.on("pageerror", (e) => errors.push(`[${label}] ${e}`));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => {
    document.startViewTransition = undefined;
  });

  await testNay25(page, baseUrl, viewport, label);
  await context.close();
  await browser.close();
  s.close();
}

await runSuite({ width: 390, height: 664 }, devices["iPhone 13"], "iphone664");
await runSuite({ width: 360, height: 740 }, devices["Pixel 5"], "android360");

const s2 = await server();
const port2 = s2.address().port;
const browser2 = await chromium.launch();
const page2 = await browser2.newPage();
page2.on("console", (m) => m.type() === "error" && errors.push(m.text()));
page2.on("pageerror", (e) => errors.push(String(e)));
await page2.emulateMedia({ reducedMotion: "reduce" });
await page2.addInitScript(() => {
  document.startViewTransition = undefined;
});
await testDecreeTime(page2, `http://127.0.0.1:${port2}/`);
await testToastNoControls(page2, `http://127.0.0.1:${port2}/`, { width: 390, height: 664 });
await testToastNoControls(page2, `http://127.0.0.1:${port2}/`, { width: 1366, height: 768 });
await browser2.close();
s2.close();

if (errors.length) throw new Error("Console errors: " + errors.join("; "));
console.log("qa9 regression OK");
