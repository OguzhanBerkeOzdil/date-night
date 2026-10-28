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
    globalThis.__CHAPTER_ONE_ARCHIVED_OVERRIDE__ = false;
    document.startViewTransition = undefined;
  });
  await page.goto("/?name=Ayse");
  await page.evaluate(() => window.__questNavigate("eve-name"));
  await page.waitForSelector('[data-screen="eve-name"].screen--active');
  await assertMinSize(page, "#btnEveHonest");

  await page.evaluate(() => window.__questNavigate("chapter-two-start"));
  await page.waitForSelector('[data-screen="chapter-two-start"].screen--active');
  await assertMinSize(page, "#partyBuffChoices .chip-select");
  await assertMinSize(page, "#btnStartAdventure");

  await page.evaluate(() => window.__questNavigate("chapter-two-finish"));
  await page.waitForSelector('[data-screen="chapter-two-finish"].screen--active');
  await assertMinSize(page, "#questBadges .chip-select");
  await assertMinSize(page, "#futureQuestChoices .chip-select");
});
