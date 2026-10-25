import { chromium } from "playwright";
import { createServer } from "http";
import { readFile } from "fs/promises";
import { join, extname } from "path";

const root = join(process.cwd());
const MIME = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
};

const errors = [];

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

async function smoke(label, viewport) {
  const s = await server();
  const port = s.address().port;
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport });
  page.on("console", (m) => m.type() === "error" && errors.push(`${label}: ${m.text()}`));
  page.on("pageerror", (e) => errors.push(`${label}: ${e}`));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(`http://127.0.0.1:${port}/?name=Ayse`, { waitUntil: "networkidle" });
  await page.waitForFunction(() => typeof window.__questNavigate === "function");
  for (const id of ["title", "potion", "steed", "decree"]) {
    await page.evaluate((sid) => window.__questNavigate(sid), id);
    await page.waitForSelector(`.screen--active[data-screen="${id}"]`);
  }
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth === window.innerWidth
  );
  if (!overflow) errors.push(`${label}: horizontal overflow`);
  await browser.close();
  s.close();
}

await smoke("1920x1080", { width: 1920, height: 1080 });
await smoke("1366x768", { width: 1366, height: 768 });

if (errors.length) throw new Error(errors.join("\n"));
console.log("desktop-viewports OK");
