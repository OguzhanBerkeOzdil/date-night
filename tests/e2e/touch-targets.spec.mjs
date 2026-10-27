import { test, expect } from "@playwright/test";

const MIN = 44;

async function assertMinSize(page, selector) {
  const box = await page.locator(selector).first().boundingBox();
  expect(box, `missing ${selector}`).not.toBeNull();
  expect(box.width, `${selector} width`).toBeGreaterThanOrEqual(MIN);
  expect(box.height, `${selector} height`).toBeGreaterThanOrEqual(MIN);
}

test("interactive targets meet 44px minimum", async ({ page }, testInfo) => {
  test.skip(!["mobile-320", "mobile-360", "mobile-390", "desktop-1440"].includes(testInfo.project.name));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => {
    document.startViewTransition = undefined;
  });
  await page.goto("/?name=Ayse");
  await page.evaluate(() => window.__questNavigate("steed"));
  await page.waitForSelector('[data-screen="steed"].screen--active');
  await assertMinSize(page, ".name-chips button");
  await assertMinSize(page, "#carrotBtn");

  await page.evaluate(() => window.__questNavigate("rating"));
  await page.waitForSelector('[data-screen="rating"].screen--active');
  await assertMinSize(page, "#ratingSlider");

  await page.evaluate(() => window.__questNavigate("dragon"));
  await page.waitForSelector('[data-screen="dragon"].screen--active');
  await page.evaluate(() => document.getElementById("realNoLink")?.classList.add("honest-link--armed"));
  await assertMinSize(page, "#realNoLink.honest-link--armed");

  await page.evaluate(() => window.__questNavigate("potion"));
  await page.waitForSelector('[data-screen="potion"].screen--active');
  await assertMinSize(page, ".vial");

  await page.evaluate(() => window.__questNavigate("stars"));
  await page.waitForSelector('[data-screen="stars"].screen--active');
  await page.waitForSelector("#dayChips .chip-select");
  await assertMinSize(page, "#dayChips .chip-select");
});
