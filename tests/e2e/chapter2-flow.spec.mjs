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
          scheduledDate: "2026-10-28",
          timeZone: "Europe/Warsaw",
          lastScreen: "chapter-lock",
        })
      );
    }, CH1_SAMPLE);
    await page.goto("/?name=Test");
    await page.evaluate(() => window.__questNavigate("chapter-two-start"));
    await page.waitForSelector('[data-screen="chapter-two-start"].screen--active');
    await expect(page.locator("#questRecap")).toContainText("Pacifist potato farmer");
    await page.locator("#btnStartAdventure").click();
    await page.waitForSelector('[data-screen="summons"].screen--active');
    await page.evaluate(() => document.getElementById("waxSealBtn")?.click());
    await page.waitForSelector("#btnSummonBegin:not(.hidden)");
    await page.locator("#btnSummonBegin").click();
    await expect(page.locator("#geraldTollInvoice")).toContainText("1000 potatoes");
    await page.locator("#btnPayPotatoes").click();
    await page.waitForSelector('[data-screen="steed"].screen--active');
    await expect(page.locator("#horsePersonality")).toBeVisible();
  });
}
