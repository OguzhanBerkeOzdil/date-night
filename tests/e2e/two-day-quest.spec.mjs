import { test, expect } from "@playwright/test";
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

test("chapter I becomes a pass, then early-open completes chapter II", async ({ page }) => {
  await reachDecreeMouse(page);
  await expect(page.locator("#decreePreview")).toContainText("ADVENTURER'S PASS");
  await page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem("questLady_v3"));
    state.scheduledDate = "2099-01-01";
    localStorage.setItem("questLady_v3", JSON.stringify(state));
  });
  await page.reload();
  await expect(page.locator('section[data-screen="chapter-lock"]')).toHaveClass(/screen--active/);
  await expectNoHorizontalOverflow(page);
  await page.locator("#btnOpenEarly").click();
  await expect(page.locator("#earlyOpenConfirm")).toBeVisible();
  await page.locator("#earlyOpenAccept").click();
  await expect(page.locator('section[data-screen="chapter-two-start"]')).toHaveClass(/screen--active/);
  await expectNoHorizontalOverflow(page);

  await page.locator('[data-buff="Snack compass"]').click();
  await page.locator("#btnStartAdventure").click();
  await expect(page.locator('section[data-screen="chapter-two-pause"]')).toContainText("Phones away");
  await page.locator("#btnFinishQuest").click();
  await page.locator("#favoriteMoment").fill("The joke about the very serious horse.");
  await page.locator('[data-badge="Best banter"]').click();
  await page.locator('[data-future="maybe"]').click();
  await page.locator("#btnCompleteQuest").click();

  await expect(page.locator('section[data-screen="quest-complete"]')).toHaveClass(/screen--active/);
  await expect(page.locator("#finalPreview")).toContainText("SECOND QUEST COMPLETE");
  await expectNoHorizontalOverflow(page);
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("questLady_v3")));
  expect(saved.chapterTwoComplete).toBe(true);
  expect(saved.futureQuest).toBe("maybe");
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
