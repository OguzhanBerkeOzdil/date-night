import { test, expect } from "@playwright/test";

const SAVE = {
  schemaVersion: 3,
  chapter: "chapter-one-complete",
  chapterOneComplete: true,
  chapterTwoStarted: false,
  chapterTwoComplete: false,
  chapter1Answers: {
    class: { id: "bard", label: "Bard" },
    tavern: { id: "mead", label: "Mead" },
    horseColor: { id: "gold", label: "Golden horse" },
  },
  eveAdventurerName: "Adventurer",
  scheduledDate: "2020-01-01",
  timeZone: "Europe/Warsaw",
  lastScreen: "chapter-lock",
};

for (const project of ["mobile-390", "desktop-1440"]) {
  test(`the restored full Chapter II reaches its debrief @ ${project}`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== project);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.addInitScript((save) => {
      document.startViewTransition = undefined;
      globalThis.__CHAPTER_TWO_RELEASED_OVERRIDE__ = true;
      globalThis.__ALLOW_LOCAL_FEEDBACK_TEST__ = true;
      localStorage.setItem("questLady_v3", JSON.stringify(save));
    }, SAVE);
    await page.route("**/formsubmit.co/**", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: '{"success":true}' })
    );

    await page.goto("/");
    await page.locator('[data-party-buff="Snack compass"]').click();
    await page.locator("#btnStartAdventure").click();
    await expect(page.locator('section[data-screen="summons"]')).toHaveClass(/screen--active/);

    await page.locator("#waxSealBtn").click();
    await expect(page.locator("#btnSummonBegin")).toBeVisible({ timeout: 10_000 });
    await page.locator("#btnSummonBegin").click();
    await page.locator("#btnPayPotatoes").click();
    await expect(page.locator('section[data-screen="steed"]')).toHaveClass(/screen--active/);

    await page.locator('[data-horse-id="palomino"]').click();
    await page.locator("#carrotBtn").click();
    await page.locator("#btnSteedNext").click();
    await page.locator("#btnRoll").click();
    await page.locator("#btnSheetNext").click();
    await page.locator(".journal-entry").first().click();
    await page.locator("#btnYes").click();

    await page.locator(".menu-item").first().click();
    await page.locator("#btnTavernNext").click();
    await page.locator(".potion-ing").first().click();
    await page.locator(".vial").first().click();
    for (let i = 0; i < 4; i += 1) await page.locator("#btnStir").click();

    await page.locator("#dayChips .chip-select").first().click();
    await page.locator("#btnSealDate").click();
    await expect(page.locator('section[data-screen="oracle"]')).toHaveClass(/screen--active/);
    await page.locator(".tarot-card").first().click();
    await page.locator("#btnOpenLetter").click();
    await expect(page.locator("#btnToDecree")).toBeVisible({ timeout: 10_000 });
    await page.locator("#btnToDecree").click();
    await page.locator("#btnRatingNext").click();
    await expect(page.locator('section[data-screen="decree"]')).toHaveClass(/screen--active/);

    await page.locator("#btnDecreeToPause").click();
    await page.locator("#btnFinishQuest").click();
    await page.locator("#favoriteMoment").fill("The horse paperwork");
    await page.locator('[data-badge="Best banter"]').click();
    await page.locator('[data-future="yes"]').click();
    await page.locator("#btnCompleteQuest").click();
    await expect(page.locator('section[data-screen="quest-complete"]')).toHaveClass(/screen--active/);

    const state = await page.evaluate(() => JSON.parse(localStorage.getItem("questLady_v3")));
    expect(state.horseId).toBe("palomino");
    expect(state.fed).toBe(true);
    expect(state.chapterTwoComplete).toBe(true);
    expect(state.futureQuest).toBe("yes");
  });
}
