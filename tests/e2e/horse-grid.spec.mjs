import { test, expect } from "@playwright/test";

const VIEWPORTS = ["mobile-320", "mobile-360", "mobile-390", "desktop-1440"];

test("horse breed grid fits viewport and targets 44px", async ({ page }, testInfo) => {
  test.skip(!VIEWPORTS.includes(testInfo.project.name));
  await page.goto('/?name=Ayse');
  await page.evaluate(() => window.__questNavigate("steed"));
  await page.waitForSelector('[data-screen="steed"].screen--active');
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth
  );
  expect(overflow).toBe(false);
  const box = await page.locator(".horse-breed-card").first().boundingBox();
  expect(box?.height).toBeGreaterThanOrEqual(44);
  expect(await page.locator(".horse-breed-card").count()).toBe(10);
});
