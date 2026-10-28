import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => {
    document.startViewTransition = undefined;
  });
  await page.goto("/");
  await page.evaluate(() => window.__questNavigate("steed"));
});

test("every horse keeps its own voice when the selection changes", async ({ page }) => {
  await page.locator('[data-horse-id="palomino"]').click();
  await expect(page.locator("#dialogueText")).toContainText("sunlight", { timeout: 8000 });
  await expect(page.locator("#dialogueName")).toHaveText("Sir Biscuit");

  await page.locator('[data-horse-id="friesian"]').click();
  await expect(page.locator("#dialogueText")).toContainText("wind machine", { timeout: 8000 });
  await expect(page.locator("#dialogueName")).toHaveText("Sir Neighs-a-Lot");
});

test("feeding uses the selected horse's dedicated carrot artwork", async ({ page }) => {
  await page.locator('[data-horse-id="friesian"]').click();
  await page.locator("#carrotBtn").click();
  await expect(page.locator("#horseIdleImg")).toHaveAttribute("src", /horses\/fed\/friesian\.webp/);
  await expect(page.locator("#dialogueText")).toContainText("carrot in darkness", { timeout: 8000 });

  await page.locator('[data-horse-id="pinto"]').click();
  await expect(page.locator("#horseIdleImg")).toHaveAttribute("src", /horses\/fed\/pinto\.webp/);

  const dimensions = await page.locator("#horseIdleImg").evaluate((image) => {
    const rect = image.getBoundingClientRect();
    return {
      loaded: image.complete && image.naturalWidth > 0,
      naturalRatio: image.naturalWidth / image.naturalHeight,
      renderedRatio: rect.width / rect.height,
      overflow: document.documentElement.scrollWidth > window.innerWidth,
    };
  });
  expect(dimensions.loaded).toBe(true);
  expect(Math.abs(dimensions.renderedRatio - dimensions.naturalRatio)).toBeLessThan(0.02);
  expect(dimensions.overflow).toBe(false);
});
