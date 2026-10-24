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

async function runViewport(name, viewport) {
  const s = await server();
  const port = s.address().port;
  const browser = await chromium.launch();
  const page = await browser.newPage({ ...devices[name], viewport, hasTouch: true });
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(String(e)));

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => {
    document.startViewTransition = undefined;
  });
  await page.goto(`http://127.0.0.1:${port}/?name=Ayse`);
  await page.click("#btnNewGame");
  await page.waitForSelector('[data-screen="summons"].screen--active');
  await page.evaluate(() => document.getElementById("waxSealArt")?.click());
  await page.waitForSelector("#btnSummonBegin:not(.hidden)", { timeout: 15000 });
  await page.click("#btnSummonBegin");
  await page.waitForSelector('[data-screen="steed"].screen--active');
  for (let i = 0; i < 4; i++) {
    const box = page.locator("#dialogueBox:not(.hidden)");
    if (await box.count()) await box.click();
    await page.waitForTimeout(120);
  }
  await page.click("#btnSteedNext");
  await page.click("#btnRoll");
  await page.click('[data-class="Knight of the Heart"]');
  await page.click("#btnSheetNext");
  const slider = page.locator("#ratingSlider");
  await slider.evaluate((el) => {
    el.value = "4";
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  });
  if ((await slider.inputValue()) !== "10") throw new Error("slider not 10");
  await page.click("#btnRatingNext");
  await page.locator(".journal-entry").first().click();
  const yesBox = await page.locator("#btnYes").boundingBox();
  for (let i = 0; i < 7; i++) {
    await page.locator("#btnNo").dispatchEvent("pointerdown");
    await page.waitForTimeout(60);
  }
  const noBox = await page.locator("#btnNo").boundingBox();
  if (yesBox && noBox) {
    const overlap =
      noBox.x < yesBox.x + yesBox.width &&
      noBox.x + noBox.width > yesBox.x &&
      noBox.y < yesBox.y + yesBox.height &&
      noBox.y + noBox.height > yesBox.y;
    if (overlap) throw new Error("No overlaps Yes");
    if (noBox.x < 0 || noBox.y < 0 || noBox.x > viewport.width) throw new Error("No off-screen");
  }
  await page.click("#btnYes");
  await page.waitForSelector('[data-screen="tavern"].screen--active', { timeout: 8000 });
  await page.locator(".menu-item").first().click();
  await page.click("#btnTavernNext");
  await page.locator(".potion-ing").first().click();
  await page.locator(".vial").first().click();
  for (let i = 0; i < 3; i++) await page.click("#btnStir");
  await page.locator("#dayChips .chip-select").first().click();
  await page.selectOption("#skyDial", { index: 2 });
  await page.click("#btnSealDate");
  await page.waitForSelector('[data-screen="oracle"].screen--active', { timeout: 12000 });
  await page.locator(".tarot-card").first().click();
  await page.click("#btnOpenLetter");
  await page.click("#btnToDecree");
  await page.waitForSelector('[data-screen="decree"].screen--active');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth === window.innerWidth);
  if (!overflow) throw new Error("horizontal overflow on decree");
  const text = await page.locator("#decreePreview").innerText();
  if (!text.includes("Ayşe") && !text.includes("Ayse")) throw new Error("name missing");
  if (!text.includes("Knight of the Heart")) throw new Error("class missing");
  await page.screenshot({ path: `/opt/cursor/artifacts/screenshots/v2-${name.replace(/\s/g, "")}-decree.png` });
  await browser.close();
  s.close();
}

function expect(cond) {
  if (!cond) throw new Error("assertion failed");
}

await runViewport("iPhone 13", { width: 390, height: 844 });
await runViewport("Pixel 5", { width: 360, height: 740 });

if (errors.length) throw new Error("Console: " + errors.join("; "));
console.log("v2 flow OK both viewports");
