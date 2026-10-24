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
};

function startServer() {
  return new Promise((resolve) => {
    const server = createServer(async (req, res) => {
      let path = req.url.split("?")[0];
      if (path === "/") path = "/index.html";
      try {
        const file = join(root, path);
        const data = await readFile(file);
        const ext = extname(file);
        res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
        res.end(data);
      } catch {
        res.writeHead(404);
        res.end("Not found");
      }
    });
    server.listen(0, () => resolve(server));
  });
}

const errors = [];

async function run() {
  const server = await startServer();
  const port = server.address().port;
  const base = `http://127.0.0.1:${port}/?name=TestGuest`;

  const browser = await chromium.launch();
  const context = await browser.newContext({
    ...devices["iPhone 13"],
    hasTouch: true,
  });
  const page = await context.newPage();

  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (err) => errors.push(String(err)));

  await page.goto(base);
  await page.screenshot({ path: "/opt/cursor/artifacts/screenshots/01-welcome.png" });

  await page.locator("#envelope").click({ force: true });
  await page.waitForSelector("#btnOpen:not([hidden])", { timeout: 8000 });
  await page.click("#btnOpen");
  await page.waitForSelector('[data-screen="rating"].screen--active');

  const slider = page.locator("#ratingSlider");
  await slider.evaluate((el) => {
    el.value = "5";
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  });
  const afterDrag = await slider.inputValue();
  if (afterDrag !== "10") {
    throw new Error(`Slider should spring to 10, got ${afterDrag}`);
  }
  await page.click("#btnRatingSubmit");

  await page.waitForSelector('[data-screen="vibe"].screen--active');
  await page.click(".option-btn");
  await page.waitForSelector('[data-screen="another-date"].screen--active');

  for (let i = 0; i < 7; i++) {
    await page.locator("#btnNo").dispatchEvent("pointerdown");
    await page.waitForTimeout(80);
  }
  await page.waitForSelector("#realNoLink:not([hidden])");

  await page.click("#btnYes");
  await page.waitForSelector('[data-screen="food"].screen--active', { timeout: 5000 });
  await page.locator(".card-option").first().click();
  await page.locator(".card-option").nth(1).click();
  await page.click("#btnFoodNext");

  await page.locator("#activityOptions .card-option").first().click();
  await page.locator("#vibeChips .chip-select").first().click();
  await page.fill("#notesInput", "you are paying");
  await page.click("#btnActivityNext");

  await page.locator("#dayChips .chip-select").first().click();
  await page.locator("#timeChips .chip-select").first().click();
  await page.click("#btnWhenFinish");
  await page.waitForSelector('[data-screen="celebration"].screen--active', { timeout: 8000 });

  const ticket = await page.locator("#dateTicket").innerText();
  if (!ticket.includes("TestGuest")) throw new Error("Ticket missing name");
  if (!ticket.includes("10/10") && !ticket.includes("11/10")) throw new Error("Ticket missing rating");
  if (!ticket.includes("ROYAL QUEST DECREE")) throw new Error("Ticket missing decree header");
  if (!ticket.includes("tried to say nay 7×")) throw new Error("Ticket missing no attempts");
  if (!ticket.includes("you are paying")) throw new Error("Ticket missing notes");

  await page.screenshot({ path: "/opt/cursor/artifacts/screenshots/02-celebration-ticket.png" });

  const waHref = await page.evaluate(() => {
    const text = document.querySelector("#dateTicket").innerText;
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  });
  if (!waHref.includes("TestGuest")) throw new Error("WA link missing name");

  if (errors.length) {
    throw new Error("Console errors: " + errors.join("; "));
  }

  console.log("All mobile flow checks passed.");
  await browser.close();
  server.close();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
