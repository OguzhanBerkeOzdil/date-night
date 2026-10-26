import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => {
    document.startViewTransition = undefined;
  });
});

test("after undo toast expires, undo restores latest quest B not A", async ({ page }) => {
  await page.goto("/?name=Ayse");
  await page.evaluate(() => {
    localStorage.setItem(
      "questLady_v2",
      JSON.stringify({
        lastScreen: "decree",
        steedName: "QuestA",
        steedClass: "Bard",
        secondDate: "yes",
        rating: 10,
        tarotKey: "golden",
      })
    );
  });
  await page.reload({ waitUntil: "networkidle" });

  await page.locator("#btnNewGame").click();
  await page.locator("#questConfirmStart").click();
  await page.waitForSelector('[data-screen="summons"].screen--active');
  await expect(page.locator(".app-toast__action")).toHaveCount(1);

  await page.waitForTimeout(6500);
  await expect(page.locator(".app-toast")).toHaveCount(0);

  await page.evaluate(() => {
    localStorage.setItem(
      "questLady_v2",
      JSON.stringify({
        lastScreen: "decree",
        steedName: "QuestB",
        steedClass: "Knight of the Wildflowers",
        secondDate: "yes",
        rating: 10,
        tarotKey: "moon",
        todayVibe: "A rom-com, but medieval",
      })
    );
  });
  await page.reload({ waitUntil: "networkidle" });
  await page.locator("#btnContinue").click();
  await page.waitForSelector('[data-screen="decree"].screen--active');

  await page.locator("#btnReplay").click();
  await page.locator("#questConfirmStart").click();
  await page.waitForSelector('[data-screen="summons"].screen--active');
  await page.locator(".app-toast__action").click();
  await page.waitForSelector('[data-screen="decree"].screen--active');

  await expect(page.locator("#decreePreview")).toContainText("QuestB");
  await expect(page.locator("#decreePreview")).not.toContainText("QuestA");
});
