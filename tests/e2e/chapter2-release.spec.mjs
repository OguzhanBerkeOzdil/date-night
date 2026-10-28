import { test, expect } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const workspace = join(dirname(fileURLToPath(import.meta.url)), "../..");
const ARTIFACT_DIR = join(workspace, "tests/e2e/artifacts/chapter2-release");

const LEGACY_FEEDBACK_SAVE = {
  schemaVersion: 3,
  chapter: "chapter-one-complete",
  chapterOneComplete: true,
  chapterTwoStarted: false,
  chapterTwoComplete: false,
  eveAdventurerName: "Berke",
  eveExcitement: 3,
  eveHeraldAnswers: {
    snacks: "essential",
    weather: "tavern",
    "quest-mood": "surprise",
  },
  evePacking: ["coin", "shoes"],
  horseId: "chestnut",
  scheduledDate: "2020-01-01",
  timeZone: "Europe/Warsaw",
  lastScreen: "chapter-lock",
};

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript((saved) => {
    document.startViewTransition = undefined;
    globalThis.__ALLOW_LOCAL_FEEDBACK_TEST__ = true;
    globalThis.__CHAPTER_TWO_RELEASED_OVERRIDE__ = true;
    if (!localStorage.getItem("questLady_v3")) {
      localStorage.setItem("questLady_v3", JSON.stringify(saved));
    }
  }, LEGACY_FEEDBACK_SAVE);
});

async function stubFormSubmit(page) {
  const payloads = [];
  await page.route("**/formsubmit.co/**", async (route) => {
    payloads.push(route.request().postDataJSON());
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: '{"success":true}',
    });
  });
  return payloads;
}

async function startFullQuest(page, buff = "Snack compass") {
  await page.goto("/");
  await expect(page.locator('section[data-screen="chapter-two-start"]')).toHaveClass(/screen--active/);
  await page.locator(`[data-party-buff="${buff}"]`).click();
  await page.locator("#btnStartAdventure").click();
  await expect(page.locator('section[data-screen="summons"]')).toHaveClass(/screen--active/);
}

async function captureShot(page, testInfo, name) {
  await mkdir(ARTIFACT_DIR, { recursive: true });
  const fileName = `${testInfo.project.name}-${name}.png`;
  const filePath = join(ARTIFACT_DIR, fileName);
  const image = await page.screenshot({ fullPage: true });
  await writeFile(filePath, image);
  await testInfo.attach(fileName, { body: image, contentType: "image/png" });
}

test("real Chapter I feedback drives the Chapter II briefing", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#questRecap")).toContainText("Tavern detour");
  await expect(page.locator("#questRecap")).toContainText("Surprise me — within reason");
  await expect(page.locator("#questRecap")).toContainText("one bard coin · comfy shoes");
  await expect(page.locator("#chapterTwoBriefing")).toContainText("tavern surprise");
  await expect(page.locator("#questRecap")).not.toContainText("Berke");
});

test("a party buff is required before the real-world quest starts", async ({ page }) => {
  await page.goto("/");
  await page.locator("#btnStartAdventure").click();
  await expect(page.locator("#partyBuffError")).toBeVisible();
  await expect(page.locator('section[data-screen="chapter-two-start"]')).toHaveClass(/screen--active/);
});

test("start and completion feedback are sent once with the real context", async ({ page }) => {
  const payloads = await stubFormSubmit(page);
  await startFullQuest(page);
  await page.waitForTimeout(250);

  const start = payloads.find((payload) => payload.part === "chapter-two-start");
  expect(start).toBeTruthy();
  const startChoices = JSON.parse(start.choices);
  expect(startChoices.partyBuff).toBe("Snack compass");
  expect(startChoices.chapter1.legacyChoices.weather).toBe("tavern");

  await page.evaluate(() => window.__questNavigate("chapter-two-pause"));
  await page.reload();
  await expect(page.locator('section[data-screen="chapter-two-pause"]')).toHaveClass(/screen--active/);
  await page.locator("#btnFinishQuest").click();
  await page.locator("#favoriteMoment").fill("The precision trial");
  await page.locator('[data-badge="Best banter"]').click();
  await page.locator('[data-future="yes"]').click();
  await page.locator("#btnCompleteQuest").click();
  await expect(page.locator('section[data-screen="quest-complete"]')).toHaveClass(/screen--active/);
  await page.waitForTimeout(250);

  const completion = payloads.find((payload) => payload.part === "completion");
  expect(completion).toBeTruthy();
  const completionChoices = JSON.parse(completion.choices);
  expect(completionChoices.debrief.favoriteMoment).toBe("The precision trial");
  expect(completionChoices.debrief.futureQuest).toBe("yes");
  expect(payloads.filter((payload) => payload.part === "chapter-two-start")).toHaveLength(1);
});

test("legacy mid-game saves resume at their exact full-quest screen", async ({ page }) => {
  await page.addInitScript(() => {
    const saved = JSON.parse(localStorage.getItem("questLady_v3"));
    saved.chapter = "chapter-two-active";
    saved.chapterTwoStarted = false;
    saved.eveComplete = true;
    saved.lastScreen = "sheet";
    saved.partyBuff = "";
    localStorage.setItem("questLady_v3", JSON.stringify(saved));
  });
  await page.goto("/");
  await expect(page.locator('section[data-screen="sheet"]')).toHaveClass(/screen--active/);
});

for (const project of ["mobile-390", "desktop-1440"]) {
  test(`Chapter II full flow visual review @ ${project}`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== project);
    await page.goto("/");
    await captureShot(page, testInfo, "01-briefing");

    await page.locator('[data-party-buff="Surprise-within-reason ward"]').click();
    await page.locator("#btnStartAdventure").click();
    await expect(page.locator('section[data-screen="summons"]')).toHaveClass(/screen--active/);
    await captureShot(page, testInfo, "02-summons");

    await page.evaluate(() => window.__questNavigate("steed"));
    await page.waitForFunction(() =>
      [...document.querySelectorAll(".horse-breed-card__img, #horseIdleImg")].every(
        (image) => image.complete && image.naturalWidth > 0
      )
    );
    await captureShot(page, testInfo, "03-steed");

    await page.evaluate(() => window.__questNavigate("decree"));
    await captureShot(page, testInfo, "04-decree");

    await page.locator("#btnDecreeToPause").click();
    await page.locator("#btnFinishQuest").click();
    await expect(page.locator('section[data-screen="chapter-two-finish"]')).toHaveClass(/screen--active/);
    await captureShot(page, testInfo, "05-debrief");

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflow).toBe(false);
  });
}
