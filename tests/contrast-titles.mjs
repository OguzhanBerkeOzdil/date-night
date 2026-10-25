import { chromium } from "playwright";
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

function relLuminance([r, g, b]) {
  const f = (c) => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

function contrast(rgbA, rgbB) {
  const l1 = relLuminance(rgbA);
  const l2 = relLuminance(rgbB);
  const hi = Math.max(l1, l2);
  const lo = Math.min(l1, l2);
  return (hi + 0.05) / (lo + 0.05);
}

function parseRgb(str) {
  const m = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!m) return [0, 0, 0];
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

const VIEWPORTS = [
  { label: "mobile", width: 390, height: 844 },
  { label: "desktop", width: 1920, height: 1080 },
];

const SCREENS = [
  "title",
  "summons",
  "steed",
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

const s = await server();
const port = s.address().port;
const browser = await chromium.launch();
const failures = [];

for (const vp of VIEWPORTS) {
  const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
  await page.goto(`http://127.0.0.1:${port}/?name=Ayse`);
  for (const screen of SCREENS) {
    await page.evaluate((id) => window.__questNavigate(id), screen);
    const rows = await page.evaluate(() => {
      const inner = document.querySelector(".screen--active .screen__inner");
      if (!inner) return [];
      const bg = getComputedStyle(inner).backgroundColor;
      const out = [];
      inner.querySelectorAll(".title, .sub, .kicker, .title-lockup").forEach((el) => {
        const cs = getComputedStyle(el);
        out.push({
          tag: el.className,
          text: el.textContent?.slice(0, 40),
          color: cs.color,
          bg,
        });
      });
      return out;
    });
    for (const row of rows) {
      const ratio = contrast(parseRgb(row.color), parseRgb(row.bg));
      if (ratio < 4.5 && row.bg !== "rgba(0, 0, 0, 0)") {
        failures.push({ vp: vp.label, screen, ...row, ratio: ratio.toFixed(2) });
      }
    }
  }
  await page.close();
}

await browser.close();
s.close();

if (failures.length) {
  console.error(JSON.stringify(failures, null, 2));
  process.exit(1);
}
console.log("All sampled title/subtitle pairs >= 4.5:1 against panel background");
