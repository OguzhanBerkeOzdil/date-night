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
        const file = join(root, path);
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

async function assertScrollTop(page) {
  const y = await page.evaluate(() => window.scrollY || document.documentElement.scrollTop);
  if (y !== 0) throw new Error(`expected scrollY 0, got ${y}`);
}

async function assertNoOverflow(page) {
  const { scrollWidth, innerWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }));
  if (scrollWidth !== innerWidth) {
    throw new Error(`horizontal overflow ${scrollWidth} vs ${innerWidth}`);
  }
}

async function tapLocator(page, locator) {
  await locator.scrollIntoViewIfNeeded();
  await locator.tap({ timeout: 8000 });
}

async function runFlow(name, deviceKey, viewport, query = "?name=Ayse") {
  const s = await server();
  const port = s.address().port;
  const browser = await chromium.launch();
  const base = devices[deviceKey] || devices["iPhone 13"];
  const page = await browser.newPage({ ...base, viewport, hasTouch: true });
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(String(e)));

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => {
    document.startViewTransition = undefined;
  });
  await page.goto(`http://127.0.0.1:${port}/${query.replace(/^\?/, "?")}`);
  await assertNoOverflow(page);

  await tapLocator(page, page.locator("#btnNewGame"));
  await page.waitForSelector('[data-screen="summons"].screen--active');
  await assertNoOverflow(page);
  await page.evaluate(() => {
    document.getElementById("waxSealArt")?.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    document.getElementById("waxSealArt")?.click();
  });
  await page.waitForSelector("#btnSummonBegin:not(.hidden)", { timeout: 15000 });
  await tapLocator(page, page.locator("#btnSummonBegin"));
  await page.waitForSelector('[data-screen="steed"].screen--active');
  for (let i = 0; i < 4; i++) {
    const box = page.locator("#dialogueBox:not(.hidden)");
    if (await box.count()) await tapLocator(page, box);
    await page.waitForTimeout(120);
  }
  await tapLocator(page, page.locator("#btnSteedNext"));
  await tapLocator(page, page.locator("#btnRoll"));
  await tapLocator(page, page.locator('[data-class="Knight of the Heart"]'));
  await tapLocator(page, page.locator("#btnSheetNext"));

  const slider = page.locator("#ratingSlider");
  await slider.evaluate((el) => {
    el.value = "4";
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  });
  if ((await slider.inputValue()) !== "10") throw new Error("slider not 10");
  await tapLocator(page, page.locator("#btnRatingNext"));
  await tapLocator(page, page.locator(".journal-entry").first());
  await page.waitForSelector('[data-screen="dragon"].screen--active');
  await assertNoOverflow(page);

  for (let i = 0; i < 7; i++) {
    await tapLocator(page, page.locator("#btnNo"));
    await page.waitForTimeout(80);
    await assertNoOverflow(page);
  }
  const yesBox = await page.locator("#btnYes").boundingBox();
  const noBox = await page.locator("#btnNo").boundingBox();
  if (yesBox && noBox) {
    const overlap =
      noBox.x < yesBox.x + yesBox.width &&
      noBox.x + noBox.width > yesBox.x &&
      noBox.y < yesBox.y + yesBox.height &&
      noBox.y + noBox.height > yesBox.y;
    if (overlap) throw new Error("No overlaps Yes");
    if (
      noBox.x < -2 ||
      noBox.y < 0 ||
      noBox.x + noBox.width > viewport.width + 2 ||
      noBox.y + noBox.height > viewport.height - 40
    ) {
      throw new Error("No off-screen or below fold");
    }
    if (yesBox.x < -4 || yesBox.x + yesBox.width > viewport.width + 4) {
      throw new Error("Yes overflows viewport");
    }
  }

  await tapLocator(page, page.locator("#realNoLink"));
  await page.waitForSelector('[data-screen="honest-no"].screen--active');
  await assertNoOverflow(page);
  await tapLocator(page, page.locator("#btnHonestContinue"));
  await page.waitForSelector('[data-screen="tavern"].screen--active');
  await assertScrollTop(page);
  await tapLocator(page, page.locator(".menu-item").first());
  await tapLocator(page, page.locator("#fanumTaxLabel"));
  await tapLocator(page, page.locator("#btnTavernNext"));
  await tapLocator(page, page.locator(".potion-ing").first());
  await tapLocator(page, page.locator(".vial").first());
  for (let i = 0; i < 3; i++) await tapLocator(page, page.locator("#btnStir"));
  await tapLocator(page, page.locator("#dayChips .chip-select").first());
  const sky = await page.locator("#skyDial").inputValue();
  if (sky !== "Morning ride") throw new Error(`expected Morning ride default, got ${sky}`);
  await tapLocator(page, page.locator("#btnSealDate"));
  await page.waitForSelector('[data-screen="oracle"].screen--active', { timeout: 12000 });
  await assertScrollTop(page);
  await tapLocator(page, page.locator(".tarot-card").first());
  await tapLocator(page, page.locator("#btnOpenLetter"));
  await tapLocator(page, page.locator("#btnToDecree"));
  await page.waitForSelector('[data-screen="decree"].screen--active');
  await assertScrollTop(page);
  const text = await page.locator("#decreePreview").innerText();
  if (!text.includes("declined") && !text.includes("honesty")) {
    throw new Error("honest-no path not reflected in decree");
  }
  await page.screenshot({
    path: `/opt/cursor/artifacts/screenshots/touch-${name.replace(/\s/g, "")}-decree.png`,
  });
  await browser.close();
  s.close();
}

async function runNoName(deviceKey, viewport) {
  const s = await server();
  const port = s.address().port;
  const browser = await chromium.launch();
  const page = await browser.newPage({ ...devices[deviceKey], viewport, hasTouch: true });
  await page.goto(`http://127.0.0.1:${port}/`);
  const title = await page.title();
  if (title.includes("…")) throw new Error("bad document title");
  const quest = await page.locator("[data-lady]").first().innerText();
  if (quest !== "My Lady") throw new Error(`quest name ${quest}`);
  await browser.close();
  s.close();
}

await runFlow("iPhone13", "iPhone 13", { width: 390, height: 844 });
await runFlow("Android360", "Pixel 5", { width: 360, height: 740 });
await runNoName("iPhone 13", { width: 390, height: 844 });

if (errors.length) throw new Error("Console: " + errors.join("; "));
console.log("touch flow OK");
