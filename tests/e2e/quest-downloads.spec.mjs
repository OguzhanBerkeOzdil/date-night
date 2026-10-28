import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { PNG } from "pngjs";

test.beforeEach(async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-1440");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.evaluate(() => window.__questNavigate("decree"));
});

test("quest log and certificate save buttons download real PNG files", async ({ page }) => {
  const logDownload = page.waitForEvent("download");
  await page.locator("#btnSavePng").click();
  const log = await logDownload;
  expect(log.suggestedFilename()).toBe("full-quest-log.png");
  expect((await readFile(await log.path())).length).toBeGreaterThan(10_000);
  await expect(page.locator(".app-toast")).toContainText("download started");

  const certificateDownload = page.waitForEvent("download");
  await page.locator("#btnSaveCertificate").click();
  const certificate = await certificateDownload;
  expect(certificate.suggestedFilename()).toBe("quest-certificate.png");
  expect((await readFile(await certificate.path())).length).toBeGreaterThan(10_000);
});

test("downloaded quest-log frame stays safely inside the parchment", async ({ page }) => {
  const downloadPromise = page.waitForEvent("download");
  await page.locator("#btnSavePng").click();
  const download = await downloadPromise;
  const png = PNG.sync.read(await readFile(await download.path()));
  let minX = png.width;
  let minY = png.height;
  let maxX = 0;
  let maxY = 0;

  for (let y = 0; y < png.height; y += 1) {
    for (let x = 0; x < png.width; x += 1) {
      const index = (png.width * y + x) * 4;
      const [r, g, b] = png.data.subarray(index, index + 3);
      const burgundy = Math.abs(r - 107) <= 2 && Math.abs(g - 45) <= 2 && Math.abs(b - 58) <= 2;
      if (!burgundy) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }

  expect(minX).toBeGreaterThanOrEqual(95);
  expect(minY).toBeGreaterThanOrEqual(95);
  expect(maxX).toBeLessThanOrEqual(png.width - 95);
  expect(maxY).toBeLessThanOrEqual(png.height - 95);
});
