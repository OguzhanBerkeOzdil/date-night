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

async function gotoDragon(page, baseUrl) {
  await page.goto(baseUrl);
  await page.click("#btnNewGame");
  const confirmBtn = page.locator("#questConfirmStart");
  if (await confirmBtn.count()) {
    try {
      await confirmBtn.waitFor({ state: "visible", timeout: 2000 });
      await confirmBtn.click();
    } catch {
      /* no save — went straight to summons */
    }
  }
  await page.waitForSelector('[data-screen="summons"].screen--active');
  await page.evaluate(() => document.getElementById("waxSealBtn")?.click());
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

async function testGhostClick(page, baseUrl, viewport) {
  await page.setViewportSize(viewport);
  await gotoDragon(page, baseUrl);
  for (let i = 0; i < 7; i++) {
    await page.locator("#btnNo").dispatchEvent("pointerdown");
    await page.waitForTimeout(40);
    await page.locator("#btnNo").dispatchEvent("pointerup");
    await page.waitForTimeout(30);
  }
  await page.evaluate(() => {
    const el = document.getElementById("realNoLink");
    el?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
  });
  await page.waitForTimeout(150);
  const afterSynth = await page.evaluate(() => document.body.dataset.screen);
  if (afterSynth === "honest-no") {
    throw new Error(`synthetic click reached honest-no at ${viewport.width}x${viewport.height}`);
  }
}

async function testOracleRestore(page, baseUrl) {
  await page.goto(baseUrl);
  await page.evaluate(() => {
    const data = {
      steedName: "Clover",
      tarotKey: "golden",
      tarotCard: "The Golden Hour",
      lastScreen: "oracle",
      time: "Morning ride",
    };
    localStorage.setItem("questLady_v2", JSON.stringify(data));
  });
  await page.reload();
  await page.waitForSelector("#btnContinue:not(.hidden)");
  await page.click("#btnContinue");
  await page.waitForSelector('[data-screen="oracle"].screen--active');
  const fortune = await page.locator("#tarotFortune:not(.hidden)").textContent();
  if (!fortune || fortune.length < 8) throw new Error("oracle fortune not restored after continue");
  const open = await page.locator("#btnOpenLetter:not(.hidden)").count();
  if (!open) throw new Error("btnOpenLetter not shown after oracle restore");
  const flipped = await page.evaluate(
    () => document.querySelectorAll(".tarot-card.flipped").length >= 3
  );
  if (!flipped) throw new Error("tarot cards not flipped on restore");
}

async function testNewGameClears(page, baseUrl) {
  await page.goto(baseUrl);
  await page.evaluate(() => {
    localStorage.setItem(
      "questLady_v2",
      JSON.stringify({
        tarotKey: "hearth",
        honestNo: true,
        secondDate: "no",
        lastScreen: "decree",
        steedName: "Thunder",
      })
    );
  });
  await page.reload();
  await page.click("#btnNewGame");
  await page.waitForSelector("#questConfirmStart", { timeout: 3000 });
  await page.click("#questConfirmStart");
  await page.waitForSelector('[data-screen="summons"].screen--active');
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("questLady_v2") || "{}"));
  if (saved.tarotKey || saved.honestNo || saved.secondDate) {
    throw new Error("New Game did not clear quest fields");
  }
  await page.evaluate(() => document.getElementById("waxSealBtn")?.click());
  await page.waitForSelector("#btnSummonBegin:not(.hidden)", { timeout: 15000 });
  await page.click("#btnSummonBegin");
  await page.waitForSelector('[data-screen="steed"].screen--active');
}

async function runSuite(name, viewport, deviceOpts = {}) {
  const s = await server();
  const port = s.address().port;
  const baseUrl = `http://127.0.0.1:${port}/?name=Ayse`;
  const browser = await chromium.launch();
  const context = await browser.newContext({
    ...deviceOpts,
    viewport,
    hasTouch: true,
    baseURL: baseUrl,
  });
  const page = await context.newPage();
  page.on("console", (m) => m.type() === "error" && errors.push(`[${name}] ${m.text()}`));
  page.on("pageerror", (e) => errors.push(`[${name}] ${e}`));

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => {
    document.startViewTransition = undefined;
  });

  await testOracleRestore(page, baseUrl);
  await testNewGameClears(page, baseUrl);
  await testGhostClick(page, baseUrl, viewport);

  await context.close();
  await browser.close();
  s.close();
}

await runSuite("iPhone13", { width: 390, height: 844 }, devices["iPhone 13"]);
await runSuite("iPhone13-short", { width: 390, height: 664 }, devices["iPhone 13"]);
await runSuite("Android360", { width: 360, height: 740 }, devices["Pixel 5"]);
await runSuite("Desktop1080", { width: 1920, height: 1080 }, {});

if (errors.length) throw new Error("Console errors: " + errors.join("; "));
console.log("qa8 regression OK (ghost click, oracle restore, new game)");
