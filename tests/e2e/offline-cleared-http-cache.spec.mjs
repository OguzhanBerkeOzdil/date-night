import { test, expect } from "@playwright/test";

test("offline after one visit survives cleared HTTP cache (styled + progress)", async ({
  page,
  context,
}) => {
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

  const cdp = await context.newCDPSession(page);
  await cdp.send("Network.clearBrowserCache");

  await context.setOffline(true);
  await page.reload({ waitUntil: "domcontentloaded" });

  const styled = await page.evaluate(() => {
    const link = document.querySelector('link[href*="styles.css"]');
    const sheetOk = Boolean(link?.sheet);
    const titleFont = getComputedStyle(document.querySelector("h1") || document.body).fontFamily;
    return { sheetOk, titleFont };
  });
  expect(styled.sheetOk).toBe(true);
  expect(styled.titleFont.length).toBeGreaterThan(0);

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
