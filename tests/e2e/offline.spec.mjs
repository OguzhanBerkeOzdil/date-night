import { test, expect } from "@playwright/test";

test("offline reload reaches decree after first visit", async ({ page, context }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => {
    document.startViewTransition = undefined;
  });
  await page.goto("/?name=Ayse");
  await page.waitForLoadState("networkidle");
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator("#btnNewGame")).toBeVisible();
  await page.locator("#btnNewGame").click();
  await page.waitForSelector('[data-screen="summons"].screen--active');
  await page.evaluate(() => document.getElementById("waxSealBtn")?.click());
  await page.waitForSelector("#btnSummonBegin:not(.hidden)", { timeout: 20000 });
});
