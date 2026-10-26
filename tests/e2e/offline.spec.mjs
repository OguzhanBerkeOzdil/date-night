import { test, expect } from "@playwright/test";

test("offline reload reaches decree after first visit", async ({ page, context }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => {
    document.startViewTransition = undefined;
  });
  await page.goto("/?name=Ayse");
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => {
    localStorage.setItem(
      "questLady_v2",
      JSON.stringify({
        steedName: "Clover",
        steedClass: "Knight of the Wildflowers",
        lastScreen: "decree",
        secondDate: "yes",
        rating: 10,
        todayVibe: "A rom-com, but medieval",
        food: ["Pizza"],
        potionName: "Elixir of Hearth Ember",
        day: "Saturday",
        time: "Morning ride",
        tarotCard: "The Golden Hour",
        tarotKey: "golden",
      })
    );
  });
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator("#btnContinue")).toBeVisible();
  await page.locator("#btnContinue").click();
  await page.waitForSelector('[data-screen="decree"].screen--active');
  await expect(page.locator("#decreePreview")).toContainText("ROYAL QUEST DECREE");
});
