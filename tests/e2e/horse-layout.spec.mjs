import { test, expect } from "@playwright/test";

test("steed artwork keeps its natural aspect ratio", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/?name=Ayse");
  await page.waitForFunction(() => typeof window.__questNavigate === "function");
  await page.evaluate(() => window.__questNavigate("steed"));

  const dimensions = await page.locator("#horseIdleImg").evaluate((image) => {
    const rect = image.getBoundingClientRect();
    return {
      naturalRatio: image.naturalWidth / image.naturalHeight,
      renderedRatio: rect.width / rect.height,
    };
  });

  expect(Math.abs(dimensions.renderedRatio - dimensions.naturalRatio)).toBeLessThan(0.01);
});
