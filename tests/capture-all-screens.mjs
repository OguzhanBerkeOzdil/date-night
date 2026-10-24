import { chromium, devices } from "playwright";
import { createServer } from "http";
import { readFile, mkdir } from "fs/promises";
import { join, extname } from "path";

const root = join(process.cwd());
const folder = process.argv[2] || "after";
const outDir = `/opt/cursor/artifacts/screenshots/${folder}`;
const MIME = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
};

const SCREENS = [
  "title",
  "summons",
  "steed",
  "sheet",
  "rating",
  "journal",
  "dragon",
  "honest-no",
  "tavern",
  "potion",
  "stars",
  "oracle",
  "decree",
];

await mkdir(outDir, { recursive: true });

const server = await new Promise((resolve) => {
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
      res.end();
    }
  });
  s.listen(0, () => resolve(s));
});

const port = server.address().port;
const viewports = [
  { tag: "iphone13", ...devices["iPhone 13"], viewport: { width: 390, height: 844 } },
  { tag: "pixel5", ...devices["Pixel 5"], viewport: { width: 360, height: 740 } },
];

for (const vp of viewports) {
  const browser = await chromium.launch();
  const page = await browser.newPage({ ...vp, hasTouch: true });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(`http://127.0.0.1:${port}/?name=Elena`);
  await page.waitForTimeout(400);

  for (const screen of SCREENS) {
    await page.evaluate((id) => window.__questNavigate?.(id), screen);
    await page.waitForTimeout(350);
    if (screen === "decree") await page.waitForTimeout(600);
    await page.screenshot({
      path: `${outDir}/${vp.tag}-${screen}.png`,
      fullPage: false,
    });
  }
  await browser.close();
}

server.close();
console.log("Saved to", outDir);
