import { test, expect } from "@playwright/test";

const CH1_SAMPLE = {
  class: { id: "potato", label: "Pacifist potato farmer" },
  weapon: { id: "sword", label: "Sword" },
  horseColor: { id: "any", label: "Any horse that doesn't bite" },
  song: { id: "sad", label: "Sad elf ballad" },
  census: { id: "mystery", label: "Mysterious stranger who refuses to explain" },
  goose: { id: "become", label: "Become the goose" },
  gerald: { value: 1000, label: "1000 potatoes" },
  tavern: { id: "mead", label: "Mead" },
  companion: { id: "goose", label: "Goose (traitor — will betray you)" },
  eveAdventurerName: "Test",
};

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => {
    document.startViewTransition = undefined;
    globalThis.__CHAPTER_TWO_RELEASED_OVERRIDE__ = true;
  });
});

for (const vp of ["mobile-390", "desktop-1440"]) {
  test(`Chapter II callbacks flow @ ${vp}`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== vp);
    await page.addInitScript((sample) => {
      localStorage.setItem(
        "questLady_v3",
        JSON.stringify({
          schemaVersion: 3,
          chapter: "chapter-one",
          chapterOneComplete: true,
          chapterTwoStarted: false,
          chapterTwoComplete: false,
          chapter1Answers: sample,
          eveAdventurerName: sample.eveAdventurerName,
          scheduledDate: "2020-01-01",
          timeZone: "Europe/Warsaw",
          lastScreen: "chapter-lock",
        })
      );
    }, CH1_SAMPLE);
    await page.goto("/?name=Test");
    await expect(page.locator('section[data-screen="chapter-two-start"]')).toHaveClass(/screen--active/);
    await expect(page.locator("#questRecap")).toContainText("Pacifist potato farmer");
    if (testInfo.project.name === "mobile-390") {
      const widthRatio = await page.evaluate(() => {
        const card = document.querySelector(
          '[data-screen="chapter-two-start"].screen--active .screen__inner.chapter-panel'
        );
        const recap = document.querySelector(
          '[data-screen="chapter-two-start"].screen--active #questRecap'
        );
        const btn = document.querySelector(
          '[data-screen="chapter-two-start"].screen--active #btnStartAdventure'
        );
        if (!card || !recap || !btn) return 0;
        const cardW = card.getBoundingClientRect().width;
        const minChild = Math.min(
          recap.getBoundingClientRect().width,
          btn.getBoundingClientRect().width
        );
        return cardW > 0 ? minChild / cardW : 0;
      });
      expect(widthRatio).toBeGreaterThanOrEqual(0.9);
    }
    await page.locator('[data-party-buff="Snack compass"]').click();
    await page.locator("#btnStartAdventure").click();
    await page.waitForSelector('[data-screen="chapter-two-pause"].screen--active');
    await expect(page.locator("#activeBuffText")).toContainText("Snack compass");
    await expect(page.locator("#fieldQuestText")).toContainText("precision trial");
  });
}

test("legacy feedback becomes the Chapter II briefing @ mobile-390", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-390");
  await page.addInitScript(() => localStorage.setItem("questLady_v3", JSON.stringify({
    schemaVersion: 3,
    chapter: "chapter-one-complete",
    chapterOneComplete: true,
    chapterTwoStarted: false,
    eveAdventurerName: "Berke",
    eveExcitement: 3,
    eveHeraldAnswers: { snacks: "essential", weather: "tavern", "quest-mood": "surprise" },
    evePacking: ["coin", "shoes"],
    horseId: "chestnut",
    scheduledDate: "2020-01-01",
    timeZone: "Europe/Warsaw",
    lastScreen: "chapter-lock",
  })));
  await page.goto("/");
  await expect(page.locator('section[data-screen="chapter-two-start"]')).toHaveClass(/screen--active/);
  await expect(page.locator("#questRecap")).toContainText("Tavern detour");
  await expect(page.locator("#questRecap")).toContainText("Surprise me — within reason");
  await expect(page.locator("#questRecap")).toContainText("one bard coin · comfy shoes");
  await expect(page.locator("#chapterTwoBriefing")).toContainText("tavern surprise");
  await expect(page.locator("#questRecap")).not.toContainText("unclassified adventurer");
});
