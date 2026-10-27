import { test, expect } from "@playwright/test";

test("offline reload restores the completed first chapter after first visit", async ({ page, context }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => {
    document.startViewTransition = undefined;
  });
  await page.goto("/?name=Ayse");
  await page.waitForLoadState("networkidle");
  await page.waitForFunction(
    () => navigator.serviceWorker?.controller != null,
    null,
    { timeout: 15000 }
  );
  await page.reload({ waitUntil: "networkidle" });
  await page.evaluate(() => {
    localStorage.setItem(
      "questLady_v3",
      JSON.stringify({
        schemaVersion: 3,
        chapter: "chapter-one-complete",
        chapterOneComplete: true,
        steedName: "Clover",
        steedClass: "Knight of the Wildflowers",
        lastScreen: "decree",
        secondDate: "yes",
        rating: 3,
        todayVibe: "Friendly chaos and questionable jokes",
        food: ["Pizza"],
        potionName: "Elixir of Hearth Ember",
        day: "Saturday",
        time: "Morning ride",
        tarotCard: "The Golden Hour",
        tarotKey: "golden",
        achievements: [],
      })
    );
  });
  await context.setOffline(true);
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForFunction(
    () => ["chapter-lock", "chapter-two-start"].includes(document.body.dataset.screen),
    null,
    { timeout: 15000 }
  );
  await expect
    .poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("questLady_v3") || "{}").chapterOneComplete))
    .toBe(true);
});
