import { test, expect } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const workspace = join(dirname(fileURLToPath(import.meta.url)), "../..");
const ARTIFACT_DIR = join(workspace, "tests/e2e/artifacts/jonata-fallback");

import { CHAPTER_I_TESTA_OWNER } from "./fixtures/chapter1-testa-seed.mjs";

const DECREE_SEED_SAVE = {
  schemaVersion: 3,
  chapter: "chapter-two-active",
  chapterOneComplete: true,
  chapterTwoStarted: true,
  chapterTwoComplete: false,
  chapter1Answers: CHAPTER_I_TESTA_OWNER.survey,
  eveAdventurerName: "Testa",
  steedName: "Clover",
  secondDate: "yes",
  rating: 4,
  steedClass: "Knight of the Wildflowers",
  steedClassPicked: false,
  scheduledDate: "2020-01-01",
  timeZone: "Europe/Warsaw",
  lastScreen: "decree",
};

const PLAIN_CH2_SAVE = {
  schemaVersion: 3,
  chapter: "chapter-one-complete",
  chapterOneComplete: true,
  chapterTwoStarted: false,
  chapterTwoComplete: false,
  eveAdventurerName: "",
  chapter1SealedName: "",
  eveExcitement: 3,
  scheduledDate: "2020-01-01",
  timeZone: "Europe/Warsaw",
  lastScreen: "chapter-lock",
};

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => {
    document.startViewTransition = undefined;
    globalThis.__CHAPTER_TWO_RELEASED_OVERRIDE__ = true;
  });
});

async function captureShot(page, testInfo, vp, name) {
  await mkdir(ARTIFACT_DIR, { recursive: true });
  const fileName = `${vp}-${name}.png`;
  const filePath = join(ARTIFACT_DIR, fileName);
  const buf = await page.screenshot({ fullPage: true });
  await writeFile(filePath, buf);
  await testInfo.attach(fileName, { body: buf, contentType: "image/png" });
  return filePath;
}

async function bootPlainChapterTwo(page) {
  await page.addInitScript((save) => {
    localStorage.setItem("questLady_v3", JSON.stringify(save));
  }, PLAIN_CH2_SAVE);
  await page.goto("/");
  await page.waitForSelector('section[data-screen="chapter-two-start"].screen--active', {
    timeout: 15000,
  });
}

for (const vp of ["mobile-390", "desktop-1440"]) {
  test(`plain link shows Jonata on Chapter II screens @ ${vp}`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== vp);
    await bootPlainChapterTwo(page);
    await expect(page.locator("#questRecap")).toContainText("Jonata");
    await expect(page.locator("#questRecap")).not.toContainText("Oğuzhan");
    await captureShot(page, testInfo, vp, "01-chapter-two-start");
    await page.locator('[data-party-buff="Snack compass"]').click();
    await page.locator("#btnStartAdventure").click();
    await page.waitForSelector('section[data-screen="summons"].screen--active');
    await expect(page.locator("#summonsTitle")).toContainText("Jonata");
    await captureShot(page, testInfo, vp, "02-summons");
    await page.evaluate(() => document.getElementById("waxSealBtn")?.click());
    await page.waitForSelector("#btnSummonBegin:not(.hidden)");
    await page.locator("#btnSummonBegin").click();
    await page.locator("#btnPayPotatoes").click();
    await page.waitForSelector('section[data-screen="steed"].screen--active');
    for (let i = 0; i < 4; i++) {
      const box = page.locator("#dialogueBox:not(.hidden)");
      if (await box.count()) await box.click();
    }
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
    for (let i = 0; i < 4; i++) await page.locator("#btnStir").click();
    await page.locator("#dayChips .chip-select").first().click();
    await page.locator("#btnSealDate").click();
    await page.waitForSelector('section[data-screen="oracle"].screen--active');
    await page.locator(".tarot-card").first().click();
    await page.locator("#btnOpenLetter").click();
    await page.locator("#btnToDecree").click();
    await page.locator("#btnRatingNext").click();
    await page.waitForSelector('section[data-screen="decree"].screen--active');
    await expect(page.locator("#decreePreview")).toContainText("Issued to: Jonata");
    await expect(page.locator("#decreePreview")).not.toContainText(", —");
    await expect(page.locator("#decreePreview")).not.toContainText("Oğuzhan");
    await captureShot(page, testInfo, vp, "03-decree-plain");
  });
}

for (const vp of ["mobile-390", "desktop-1440"]) {
  test(`seed class appears on decree Issued to line @ ${vp}`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== vp);
    await page.addInitScript((save) => {
      localStorage.setItem("questLady_v3", JSON.stringify(save));
    }, DECREE_SEED_SAVE);
    await page.goto("/");
    await page.evaluate(() => window.__questNavigate("decree"));
    await page.waitForSelector('section[data-screen="decree"].screen--active');
    await expect(page.locator("#decreePreview")).toContainText(
      "Issued to: Testa, Pacifist potato farmer"
    );
    await captureShot(page, testInfo, vp, "04-decree-with-class");
  });
}

test("saved Berke name is shown as Jonata in recap", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "questLady_v3",
      JSON.stringify({ ...PLAIN_CH2_SAVE, eveAdventurerName: "Berke" })
    );
  });
  await page.goto("/");
  await page.waitForSelector('section[data-screen="chapter-two-start"].screen--active');
  await expect(page.locator("#questRecap")).toContainText("Jonata");
  await expect(page.locator("#questRecap")).not.toContainText("Berke");
});
