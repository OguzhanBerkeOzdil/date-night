import { test, expect } from "@playwright/test";

test("offline after one visit survives cleared HTTP cache (styled + decree)", async ({
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
        achievements: [],
      })
    );
  });
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.locator("#btnContinue")).toBeVisible();
  await page.locator("#btnContinue").click();
  await page.waitForSelector('[data-screen="decree"].screen--active', { timeout: 15000 });
  await expect(page.locator("#decreePreview")).toContainText("ROYAL QUEST DECREE");
});
