import { chromium, devices } from "playwright";
import { createServer } from "http";
import { readFile } from "fs/promises";
import { join, extname } from "path";

const root = join(process.cwd());
const MIME = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".webp": "image/webp", ".jpg": "image/jpeg" };

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
const browser = await chromium.launch();
const page = await browser.newPage({ ...devices["iPhone 13"] });
await page.emulateMedia({ reducedMotion: "reduce" });
await page.goto(`http://127.0.0.1:${port}/?name=Elena`);
await page.screenshot({ path: "/opt/cursor/artifacts/screenshots/v2-title.png" });
await page.click("#btnNewGame");
await page.waitForSelector('[data-screen="summons"].screen--active');
await page.screenshot({ path: "/opt/cursor/artifacts/screenshots/v2-summons.png" });
await page.evaluate(() => document.getElementById("waxSealArt")?.click());
await page.waitForSelector("#btnSummonBegin:not(.hidden)");
await page.click("#btnSummonBegin");
await page.screenshot({ path: "/opt/cursor/artifacts/screenshots/v2-steed.png" });
await browser.close();
server.close();
