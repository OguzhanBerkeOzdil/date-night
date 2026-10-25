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

const SCENARIOS = [
  { name: "iphone13", device: "iPhone 13", viewport: null, fullFlow: true },
  { name: "mobile360", device: null, viewport: { width: 360, height: 740 }, fullFlow: true },
  { name: "desktop1920", device: null, viewport: { width: 1920, height: 1080 }, fullFlow: true },
  {
    name: "desktop1440dpr2",
    device: null,
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    fullFlow: false,
  },
];

async function runScenario(scenario) {
  const s = await server();
  const port = s.address().port;
  const browser = await chromium.launch();
  const ctx = scenario.device
    ? { ...devices[scenario.device], hasTouch: true }
    : {
        viewport: scenario.viewport,
        deviceScaleFactor: scenario.deviceScaleFactor || 1,
        hasTouch: !!scenario.viewport && scenario.viewport.width < 800,
      };
  const page = await browser.newPage(ctx);
  const bytes = [];
  page.on("response", async (res) => {
    const url = res.url();
    if (!url.includes(`127.0.0.1:${port}`)) return;
    try {
      const body = await res.body();
      bytes.push({ url: url.split(port)[1], size: body.length });
    } catch {
      /* aborted */
    }
  });

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => {
    document.startViewTransition = undefined;
  });
  await page.goto(`http://127.0.0.1:${port}/?name=Ayse`, { waitUntil: "networkidle" });

  const firstScreen = bytes.reduce((a, b) => a + b.size, 0);
  let fullRun = firstScreen;

  if (scenario.fullFlow) {
    await page.locator("#btnNewGame").click();
    await page.waitForSelector('[data-screen="summons"].screen--active');
    await page.evaluate(() => {
      document.getElementById("waxSealArt")?.click();
    });
    await page.locator("#btnSummonBegin").click({ timeout: 15000 });
    // fast-path through flow via __questNavigate where taps are heavy
    const screens = [
      "sheet",
      "rating",
      "journal",
      "dragon",
      "tavern",
      "potion",
      "stars",
      "oracle",
      "decree",
    ];
    for (const id of screens) {
      await page.evaluate((sid) => window.__questNavigate(sid), id);
      await page.waitForTimeout(120);
    }
    await page.waitForLoadState("networkidle");
    fullRun = bytes.reduce((a, b) => a + b.size, 0);
  }

  await browser.close();
  s.close();

  return {
    scenario: scenario.name,
    firstScreenBytes: firstScreen,
    firstScreenMiB: (firstScreen / 1024 / 1024).toFixed(2),
    fullRunBytes: fullRun,
    fullRunMiB: (fullRun / 1024 / 1024).toFixed(2),
    requestCount: bytes.length,
  };
}

const results = [];
for (const sc of SCENARIOS) {
  results.push(await runScenario(sc));
}
console.log(JSON.stringify(results, null, 2));
