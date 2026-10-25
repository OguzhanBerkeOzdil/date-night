import { chromium } from "playwright";
import { createServer } from "http";
import { readFile, mkdir } from "fs/promises";
import { join, extname } from "path";

const root = join(process.cwd());
const outDir = `/opt/cursor/artifacts/screenshots/desktop-qa`;
const MIME = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
};

const SCREENS = ["title", "steed", "dragon", "tavern", "potion", "stars", "oracle", "decree"];

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
  { tag: "1920x1080", width: 1920, height: 1080 },
  { tag: "1440x900", width: 1440, height: 900 },
];

for (const vp of viewports) {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
  await page.addInitScript(() => {
    document.startViewTransition = undefined;
  });
  await page.goto(`http://127.0.0.1:${port}/?name=Elena`);
  await page.waitForTimeout(400);
  for (const screen of SCREENS) {
    await page.evaluate((id) => window.__questNavigate?.(id), screen);
    await page.waitForTimeout(450);
    if (screen === "dragon") await page.waitForTimeout(200);
    await page.screenshot({ path: `${outDir}/${vp.tag}-${screen}.png`, fullPage: false });
  }
  await browser.close();
}

server.close();
console.log("Saved desktop shots to", outDir);
