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
    await page.waitForSelector('[data-screen="summons"].screen--active');
    await page.evaluate(() => window.__questNavigate("chapter-two-pause"));
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

test("completed Chapter II can restart without clearing Chapter I @ desktop-1440", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-1440");
  await page.addInitScript((sample) => {
    if (sessionStorage.getItem("chapter2-restart-fixture") === "ready") return;
    localStorage.setItem("questLady_v3", JSON.stringify({
      schemaVersion: 3,
      chapter: "complete",
      chapterOneComplete: true,
      chapterTwoStarted: true,
      chapterTwoComplete: true,
      consentShared: true,
      chapter1Answers: sample,
      eveComplete: true,
      eveAdventurerName: sample.eveAdventurerName,
      scheduledDate: "2020-01-01",
      timeZone: "Europe/Warsaw",
      horseId: "black-friesian",
      steedName: "Sir Biscuit",
      steedClass: "Wandering Bard",
      steedClassPicked: true,
      affection: 5,
      fed: true,
      food: ["Pizza"],
      activities: ["Horse riding"],
      potionBase: "Moonlight Dew",
      potionName: "Elixir of Moonlight Dew & Horse riding",
      tarotKey: "sun",
      tarotCard: "The Sun",
      partyBuff: "Snack compass",
      favoriteMoment: "The live restart test",
      questBadge: "Best banter",
      futureQuest: "yes",
      lastScreen: "quest-complete",
    }));
    sessionStorage.setItem("chapter2-restart-fixture", "ready");
  }, CH1_SAMPLE);

  await page.goto("/");
  await expect(page.locator('section[data-screen="quest-complete"]')).toHaveClass(/screen--active/);
  await page.locator("#btnRestartChapterTwo").click();
  await expect(page.locator("#questConfirmTitle")).toHaveText("Restart Chapter II?");
  await expect(page.locator("#questConfirmMessage")).toContainText("Chapter I answers stay sealed");
  await Promise.all([
    page.waitForNavigation({ waitUntil: "domcontentloaded" }),
    page.locator("#questConfirmStart").click(),
  ]);
  await expect(page.locator('section[data-screen="chapter-two-start"]')).toHaveClass(/screen--active/);

  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("questLady_v3")));
  expect(saved.chapterOneComplete).toBe(true);
  expect(saved.chapter1Answers.class.label).toBe("Pacifist potato farmer");
  expect(saved.eveAdventurerName).toBe("Test");
  expect(saved.consentShared).toBe(true);
  expect(saved.chapterTwoStarted).toBe(false);
  expect(saved.chapterTwoComplete).toBe(false);
  expect(saved.partyBuff).toBe("");
  expect(saved.favoriteMoment).toBe("");
  expect(saved.questBadge).toBe("");
  expect(saved.futureQuest).toBe("");
  expect(saved.steedName).toBe("Clover");
  expect(saved.horseId).toBe("");
  expect(saved.lastScreen).toBe("chapter-two-start");

  await page.evaluate(() => window.__questNavigate("steed"));
  await expect(page.locator("#affectionBar")).toHaveAttribute(
    "aria-label",
    "Horse bond: 0 of 5 carrots"
  );
});
