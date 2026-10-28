import { test, expect } from "@playwright/test";

const NON_EVE_SCREENS = [
  "title",
  "eve-pass",
  "chapter-lock",
  "chapter-two-start",
  "chapter-two-pause",
  "chapter-two-finish",
  "quest-complete",
  "honest-no",
];

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => {
    document.startViewTransition = undefined;
  });
});

for (const screen of NON_EVE_SCREENS) {
  test(`Eve honest button hidden on ${screen}`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile-390");
    await page.goto("/?name=Ayse");
    await page.evaluate((id) => window.__questNavigate(id), screen);
    await page.waitForSelector(`section[data-screen="${screen}"].screen--active`);
    const button = page.locator("#btnEveHonest");
    await expect(button).toBeHidden();
    await expect(button).toHaveAttribute("aria-hidden", "true");
    await expect(button).toBeDisabled();
  });
}

test("accepted quest cannot be declined via Eve honest button", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-390");
  await page.addInitScript(() => {
    localStorage.setItem("questLady_v3", JSON.stringify({
      schemaVersion: 3,
      chapter: "chapter-one-complete",
      chapterOneComplete: true,
      eveComplete: true,
      honestNo: false,
      scheduledDate: "2099-01-01",
      timeZone: "Europe/Warsaw",
      lastScreen: "chapter-lock",
    }));
  });
  await page.goto("/");
  await page.evaluate(() => document.getElementById("btnEveHonest")?.click());
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("questLady_v3")));
  expect(saved.honestNo).toBe(false);
  expect(saved.chapter).not.toBe("declined");
  await expect(page.locator('section[data-screen="chapter-lock"].screen--active')).toBeVisible();
});
