import { test, expect } from "@playwright/test";
import { completeEveToLock, releaseMainQuestForTest } from "./helpers/eve-path.mjs";
import { reachDecreeMouse } from "./helpers/quest-path.mjs";

async function expectNoHorizontalOverflow(page) {
  const overflow = await page.evaluate(() => ({
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: document.documentElement.clientWidth,
  }));
  expect(overflow.documentWidth).toBeLessThanOrEqual(overflow.viewportWidth);
}

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => {
    document.startViewTransition = undefined;
  });
});

test("today ends at an owner-controlled lock and release starts the full quest", async ({ page }) => {
  await page.goto("/");
  await page.locator("#btnNewGame").click();
  await completeEveToLock(page);
  await expect(page.locator('section[data-screen="chapter-lock"]')).toHaveClass(/screen--active/);
  const afterToday = await page.evaluate(() => JSON.parse(localStorage.getItem("questLady_v3")));
  expect(afterToday.eveAdventurerName).toBe("Ayse");
  expect(afterToday.chapterOneComplete).toBe(true);
  expect(afterToday.chapterTwoStarted).toBe(false);
  await expect(page.locator("#btnOpenEarly")).toHaveCount(0);
  await expectNoHorizontalOverflow(page);
  await releaseMainQuestForTest(page);
  await expect(page.locator('section[data-screen="summons"]')).toHaveClass(/screen--active/);
  await expect(page.locator('section[data-screen="summons"]')).toContainText("Chapter II");
  await expectNoHorizontalOverflow(page);
  const afterOpening = await page.evaluate(() => JSON.parse(localStorage.getItem("questLady_v3")));
  expect(afterOpening.chapterTwoStarted).toBe(true);
  expect(afterOpening.lastScreen).toBe("summons");
});

test("the full quest ends with the final log", async ({ page }) => {
  await reachDecreeMouse(page);
  await expect(page.locator("#decreePreview")).toContainText("FULL QUEST COMPLETE");
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("questLady_v3")));
  expect(saved.chapterTwoComplete).toBe(true);
  expect(saved.chapter).toBe("complete");
});

test("a private invite restores chapter I progress on a clean device", async ({ page }) => {
  const apiUrl = "https://quest.test/functions/v1/quest-state";
  await page.addInitScript((url) => {
    window.__QUEST_API_URL__ = url;
  }, apiUrl);
  await page.route(apiUrl, async (route) => {
    const body = route.request().postDataJSON();
    expect(body.action).toBe("load");
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        revision: 4,
        scheduledDate: "2099-01-01",
        timeZone: "Europe/Warsaw",
        state: {
          schemaVersion: 3,
          chapter: "chapter-one-complete",
          chapterOneComplete: true,
          consentShared: true,
          lastScreen: "decree",
          steedName: "Sir Biscuit",
          food: ["Pizza"],
          activities: ["Game night"],
        },
      }),
    });
  });
  const token = "abcdefghijklmnopqrstuvwxyzABCDEFGH12345678";
  await page.goto(`/?name=Ayse&invite=${token}`);
  await expect(page.locator('section[data-screen="chapter-lock"]')).toHaveClass(/screen--active/);
  await expect(page.locator("#syncStatus")).toContainText("Private quest restored");
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("questLady_v3")));
  expect(saved.steedName).toBe("Sir Biscuit");
  expect(saved.serverRevision).toBe(4);
});
