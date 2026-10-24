import { chromium, devices } from "playwright";
import { createServer } from "http";
import { readFile } from "fs/promises";
import { join, extname } from "path";
import { fileURLToPath } from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const root = join(__dirname, "..");
const MIME = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".webp": "image/webp", ".jpg": "image/jpeg" };

function startServer() {
  return new Promise((resolve) => {
    const server = createServer(async (req, res) => {
      let path = req.url.split("?")[0];
      if (path === "/") path = "/index.html";
      try {
        const file = join(root, path);
        const data = await readFile(file);
        res.writeHead(200, { "Content-Type": MIME[extname(file)] || "application/octet-stream" });
        res.end(data);
      } catch {
        res.writeHead(404);
        res.end("Not found");
      }
    });
    server.listen(0, () => resolve(server));
  });
}

const server = await startServer();
const port = server.address().port;
const browser = await chromium.launch();
const page = await browser.newPage({ ...devices["iPhone 13"] });
await page.goto(`http://127.0.0.1:${port}/?name=Lady%20Test`);
await page.waitForTimeout(800);
await page.screenshot({ path: "/opt/cursor/artifacts/screenshots/03-welcome-medieval.png" });
await page.locator("#envelope").click({ force: true });
await page.waitForSelector("#btnOpen:not([hidden])");
await page.screenshot({ path: "/opt/cursor/artifacts/screenshots/04-welcome-unsealed.png" });
await browser.close();
server.close();
