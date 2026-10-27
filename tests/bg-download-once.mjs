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

function bgKey(url) {
  const m = url.match(/\/assets\/images\/(bg-[^.?]+)\.(webp|jpg)/);
  return m ? m[1] : null;
}

async function run(deviceLabel, ctx) {
  const s = await server();
  const port = s.address().port;
  const counts = new Map();
  const bytesByKey = new Map();

  const browser = await chromium.launch();
  const page = await browser.newPage(ctx);
  page.on("response", async (res) => {
    const url = res.url();
    if (!url.includes(`127.0.0.1:${port}`)) return;
    const key = bgKey(url);
    if (!key) return;
    try {
      const body = await res.body();
      counts.set(key, (counts.get(key) || 0) + 1);
      const prev = bytesByKey.get(key);
      if (!prev || prev.size !== body.length) {
        bytesByKey.set(key, { size: body.length, url: url.split(port)[1] });
      }
    } catch {
      /* aborted */
    }
  });

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => {
    document.startViewTransition = undefined;
  });
  await page.goto(`http://127.0.0.1:${port}/?name=Ayse`, { waitUntil: "networkidle" });

  const screens = [
    "title",
    "summons",
    "steed",
    "sheet",
    "journal",
    "dragon",
    "tavern",
    "potion",
    "stars",
    "oracle",
    "rating",
    "decree",
  ];
  for (const id of screens) {
    await page.evaluate((sid) => window.__questNavigate(sid), id);
    await page.waitForTimeout(150);
  }
  await page.waitForLoadState("networkidle");

  const dupes = [...counts.entries()].filter(([, n]) => n > 1);
  await browser.close();
  s.close();

  if (dupes.length) {
    throw new Error(
      `${deviceLabel}: duplicate bg downloads: ${dupes.map(([k, n]) => `${k}×${n}`).join(", ")}`
    );
  }

  return { device: deviceLabel, backgrounds: Object.fromEntries(bytesByKey) };
}

const iphone = await run("iPhone 13", { ...devices["iPhone 13"], hasTouch: true });
const desktop = await run("1920×1080", {
  viewport: { width: 1920, height: 1080 },
  deviceScaleFactor: 1,
});

console.log(JSON.stringify({ iphone, desktop }, null, 2));
console.log("bg-download-once OK");
