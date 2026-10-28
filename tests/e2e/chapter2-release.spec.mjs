import { test, expect } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildWireSeedFromOwnerJson,
  encodeSeedToBase64Url,
} from "../../js/seed-link.js";
import { chapter1TestaSeedToken } from "./fixtures/chapter1-testa-seed.mjs";
import { completeEveMouse, releaseMainQuestForTest } from "./helpers/eve-path.mjs";
import {
  advanceSheetKeepingChapter1Class,
  reachDecreeMouse,
} from "./helpers/quest-path.mjs";

const workspace = join(dirname(fileURLToPath(import.meta.url)), "../..");
const ARTIFACT_DIR = join(workspace, "tests/e2e/artifacts/chapter2-release");

const SEED_FAKE = {
  name: "Seed Keeper",
  excitement: 3,
  packing: ["cloak"],
  horse: "grey",
  outcome: "yes",
  survey: {
    class: { id: "potato", label: "Pacifist potato farmer" },
    weapon: { id: "sword", label: "Sword" },
    companion: { id: "goose", label: "Goose (traitor — will betray you)" },
    tavern: { id: "mead", label: "Mead" },
    gerald: { value: 250, label: "250 potatoes" },
  },
};

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => {
    document.startViewTransition = undefined;
    globalThis.__ALLOW_LOCAL_FEEDBACK_TEST__ = true;
  });
});

async function assertNoToastOverlapsButtons(page, screenId) {
  const clear = await page.evaluate((id) => {
    const screen = document.querySelector(`section[data-screen="${id}"].screen--active`);
    const toast = document.querySelector("#achievementToasts .achievement-toast");
    if (!screen || !toast) return true;
    const t = toast.getBoundingClientRect();
    const buttons = [...screen.querySelectorAll("button, .chip-select, .menu-item, .journal-entry")];
    return !buttons.some((btn) => {
      const b = btn.getBoundingClientRect();
      return (
        t.left < b.right &&
        t.right > b.left &&
        t.top < b.bottom &&
        t.bottom > b.top
      );
    });
  }, screenId);
  expect(clear).toBe(true);
}

async function waitForDecreeSirBerke(page) {
  await page.waitForFunction(() => {
    const img = document.querySelector('section[data-screen="decree"] #sirBerkeImg');
    const cameo = document.querySelector('section[data-screen="decree"] #sirBerkeCameo');
    return (
      img &&
      cameo &&
      !cameo.classList.contains("hidden") &&
      img.complete &&
      img.naturalWidth > 0
    );
  });
}

async function assertScreenHeadingsClearOfToasts(page, screenId) {
  const clear = await page.evaluate((id) => {
    const screen = document.querySelector(`section[data-screen="${id}"].screen--active`);
    if (!screen) return false;
    const heading = screen.querySelector(".kicker, .title");
    const toast = document.querySelector("#achievementToasts .achievement-toast");
    if (!heading || !toast) return true;
    const h = heading.getBoundingClientRect();
    const t = toast.getBoundingClientRect();
    return h.bottom <= t.top || h.top >= t.bottom;
  }, screenId);
  expect(clear).toBe(true);
}

async function captureShot(page, testInfo, vp, name, { fullPage = true } = {}) {
  await mkdir(ARTIFACT_DIR, { recursive: true });
  const fileName = `${vp}-${name}.png`;
  const filePath = join(ARTIFACT_DIR, fileName);
  const buf = await page.screenshot({ fullPage });
  await writeFile(filePath, buf);
  await testInfo.attach(fileName, { body: buf, contentType: "image/png" });
  return filePath;
}

test("returning Chapter I player boots to chapter-two-start", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "questLady_v3",
      JSON.stringify({
        schemaVersion: 3,
        chapter: "chapter-one-complete",
        chapterOneComplete: true,
        chapterTwoStarted: false,
        eveAdventurerName: "Ayse",
        eveExcitement: 4,
        evePacking: ["boots"],
        horseId: "chestnut",
        chapter1Answers: { class: { id: "potato", label: "Potato" } },
        scheduledDate: "2026-10-28",
        timeZone: "Europe/Warsaw",
        lastScreen: "chapter-lock",
      })
    );
  });
  await page.goto("/");
  await expect(page.locator('section[data-screen="chapter-two-start"]')).toHaveClass(/screen--active/);
});

test("chapter lock opens Chapter II via Begin Chapter II", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => window.__questNavigate("chapter-lock"));
  await page.waitForSelector('section[data-screen="chapter-lock"].screen--active');
  await expect(page.locator("#chapterLockKicker")).toContainText(/seal broken/i);
  await expect(page.locator("#chapterLockTitle")).toContainText(/open/i);
  await expect(page.locator("#btnTryChapterTwo")).toHaveText("Begin Chapter II");
  await page.locator("#btnTryChapterTwo").click();
  await expect(page.locator('section[data-screen="chapter-two-start"]')).toHaveClass(/screen--active/);
});

test("seed link survives reload after cache bump", async ({ page }) => {
  const token = encodeSeedToBase64Url(buildWireSeedFromOwnerJson(SEED_FAKE));
  await page.goto(`/?seed=${token}`);
  await page.waitForFunction(() => !globalThis.location.search.includes("seed="));
  const before = await page.evaluate(() => JSON.parse(localStorage.getItem("questLady_v3")));
  expect(before.eveAdventurerName).toBe("Seed Keeper");
  expect(before.horseId).toBe("grey");
  await page.reload();
  const after = await page.evaluate(() => JSON.parse(localStorage.getItem("questLady_v3")));
  expect(after.eveAdventurerName).toBe("Seed Keeper");
  expect(after.chapter1Answers.class.id).toBe("potato");
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

test("FormSubmit decree payload is idempotent on reload", async ({ page }) => {
  const payloads = await stubFormSubmit(page);
  await reachDecreeMouse(page);
  await page.waitForTimeout(400);
  const decree = payloads.find((p) => p.part === "main");
  expect(decree).toBeTruthy();
  expect(decree.name).toBe("Ayse");
  expect(decree.idempotencyId).toMatch(/^ch2-decree-/);
  expect(decree.horse).toBeTruthy();
  expect(decree.steedName).toBeTruthy();
  const decreeChoices = JSON.parse(decree.choices);
  expect(decreeChoices.steed).toBeTruthy();
  expect(decreeChoices.tavern).toBeTruthy();
  expect(decreeChoices.potion).toBeTruthy();
  expect(decreeChoices.stars).toBeTruthy();
  expect(decreeChoices.oracle).toBeTruthy();
  expect(decreeChoices.rating).toBeTruthy();
  expect(decreeChoices.chapter1.survey).toBeTruthy();

  await page.reload();
  await page.waitForSelector('section[data-screen="decree"].screen--active', { timeout: 20000 });
  await page.waitForTimeout(400);
  expect(payloads.filter((p) => p.part === "main").length).toBe(1);
});

test("FormSubmit completion payload includes campfire debrief", async ({ page }) => {
  const payloads = await stubFormSubmit(page);
  await reachDecreeMouse(page);
  await page.locator("#btnDecreeToPause").click();
  await page.locator("#btnFinishQuest").click();
  await page.locator('[data-future="yes"]').click();
  await page.locator("#btnCompleteQuest").click();
  await page.waitForSelector('section[data-screen="quest-complete"].screen--active');
  await page.waitForTimeout(400);
  const complete = payloads.find((p) => p.part === "completion");
  expect(complete).toBeTruthy();
  expect(complete.idempotencyId).toMatch(/^ch2-complete-/);
  expect(complete.name).toBe("Ayse");
  const completeChoices = JSON.parse(complete.choices);
  expect(completeChoices.debrief.futureQuest).toBe("yes");
});

test("campfire finish never shows achievement toasts over choice buttons", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-390");
  const seed = chapter1TestaSeedToken();
  await page.goto(`/?seed=${seed}`);
  await page.waitForFunction(() => !globalThis.location.search.includes("seed="));
  await releaseMainQuestForTest(page);
  await page.evaluate(() => document.getElementById("waxSealBtn")?.click());
  await page.waitForSelector("#btnSummonBegin:not(.hidden)");
  await page.locator("#btnSummonBegin").click();
  await page.locator("#btnPayPotatoes").click();
  await page.waitForSelector('section[data-screen="steed"].screen--active');
  for (let i = 0; i < 4; i++) {
    const box = page.locator("#dialogueBox:not(.hidden)");
    if (await box.count()) await box.click();
  }
  await page.locator("#btnSteedNext").click();
  await advanceSheetKeepingChapter1Class(page);
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
  await page.locator("#btnDecreeToPause").click();
  await page.locator("#btnFinishQuest").click();
  await page.waitForSelector('section[data-screen="chapter-two-finish"].screen--active');
  await page.waitForTimeout(300);
  await assertNoToastOverlapsButtons(page, "chapter-two-finish");
  await expect(page.locator("#achievementToasts .achievement-toast")).toHaveCount(0);
  await expect(page.locator('[data-future="not-now"]')).toBeVisible();
});

test("Testa seed decree uses Chapter I class when sheet keeps prefill", async ({ page }) => {
  const seed = chapter1TestaSeedToken();
  await page.goto(`/?seed=${seed}`);
  await page.waitForFunction(() => !globalThis.location.search.includes("seed="));
  await releaseMainQuestForTest(page);
  await page.waitForSelector('section[data-screen="summons"].screen--active');
  await page.evaluate(() => document.getElementById("waxSealBtn")?.click());
  await page.waitForSelector("#btnSummonBegin:not(.hidden)");
  await page.locator("#btnSummonBegin").click();
  await page.locator("#btnPayPotatoes").click();
  await page.waitForSelector('section[data-screen="steed"].screen--active');
  for (let i = 0; i < 4; i++) {
    const box = page.locator("#dialogueBox:not(.hidden)");
    if (await box.count()) await box.click();
  }
  await page.locator("#btnSteedNext").click();
  await advanceSheetKeepingChapter1Class(page);
  const savedAfterSheet = await page.evaluate(() => JSON.parse(localStorage.getItem("questLady_v3")));
  expect(savedAfterSheet.steedClassPicked).toBe(false);
  expect(savedAfterSheet.steedClass).toMatch(/Pacifist potato farmer/i);
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
  await expect(page.locator("#decreePreview")).toContainText("Testa, Pacifist potato farmer");
});

test("explicit sheet class overrides Chapter I on the decree", async ({ page }) => {
  const seed = chapter1TestaSeedToken();
  await page.goto(`/?seed=${seed}`);
  await page.waitForFunction(() => !globalThis.location.search.includes("seed="));
  await releaseMainQuestForTest(page);
  await page.evaluate(() => document.getElementById("waxSealBtn")?.click());
  await page.waitForSelector("#btnSummonBegin:not(.hidden)");
  await page.locator("#btnSummonBegin").click();
  await page.locator("#btnPayPotatoes").click();
  await page.waitForSelector('section[data-screen="steed"].screen--active');
  for (let i = 0; i < 4; i++) {
    const box = page.locator("#dialogueBox:not(.hidden)");
    if (await box.count()) await box.click();
  }
  await page.locator("#btnSteedNext").click();
  await page.locator("#btnRoll").click();
  await page.locator('[data-class="Knight of the Wildflowers"]').click();
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
  await expect(page.locator("#decreePreview")).toContainText("Knight of the Wildflowers");
  await expect(page.locator("#decreePreview")).not.toContainText("Pacifist potato farmer");
});

test("FormSubmit honest dragon no includes Chapter I context", async ({ page }) => {
  const payloads = await stubFormSubmit(page);
  await page.goto("/?name=Decliner");
  await completeEveMouse(page, "Decliner");
  await page.waitForSelector('section[data-screen="summons"].screen--active');
  await page.evaluate(() => document.getElementById("waxSealBtn")?.click());
  await page.waitForSelector("#btnSummonBegin:not(.hidden)");
  await page.locator("#btnSummonBegin").click();
  await page.locator("#btnPayPotatoes").click();
  await page.waitForSelector('section[data-screen="steed"].screen--active');
  for (let i = 0; i < 4; i++) {
    const box = page.locator("#dialogueBox:not(.hidden)");
    if (await box.count()) await box.click();
  }
  await page.locator("#btnSteedNext").click();
  await advanceSheetKeepingChapter1Class(page);
  await page.locator(".journal-entry").first().click();
  await page.locator("#btnNo").click();
  await page.waitForSelector('section[data-screen="honest-no"].screen--active');
  await page.waitForTimeout(400);
  const honest = payloads.find((p) => p.part === "honest");
  expect(honest).toBeTruthy();
  expect(honest.idempotencyId).toBe("ch2-honest-decliner");
  expect(JSON.parse(honest.choices).dragon).toBe("no");
  expect(JSON.parse(honest.choices).chapter1).toBeTruthy();
});

for (const vp of ["mobile-390", "desktop-1440"]) {
  test(`Chapter II release screenshots @ ${vp}`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== vp);
    const paths = [];
    const seed = chapter1TestaSeedToken();
    await page.goto(`/?seed=${seed}`);
    await page.waitForFunction(() => !globalThis.location.search.includes("seed="));
    await page.waitForSelector('section[data-screen="chapter-two-start"].screen--active', {
      timeout: 15000,
    });
    await expect(page.locator("#questRecap")).toContainText("Testa");
    await page.evaluate(() => window.__questNavigate("chapter-lock"));
    await page.waitForSelector('[data-screen="chapter-lock"].screen--active');
    paths.push(await captureShot(page, testInfo, vp, "01-chapter-lock"));
    await page.locator("#btnTryChapterTwo").click();
    await page.waitForSelector('[data-screen="chapter-two-start"].screen--active');
    paths.push(await captureShot(page, testInfo, vp, "02-chapter-two-start"));
    await releaseMainQuestForTest(page);
    await page.waitForSelector('[data-screen="summons"].screen--active');
    await page.evaluate(() => document.getElementById("waxSealBtn")?.click());
    await page.waitForSelector("#btnSummonBegin:not(.hidden)");
    await page.locator("#btnSummonBegin").click();
    await page.locator("#btnPayPotatoes").click();
    await page.waitForSelector('section[data-screen="steed"].screen--active');
    const steedOverlap = await page.evaluate(() => {
      const grid = document.querySelector(
        '[data-screen="steed"].screen--active .horse-breed-grid'
      );
      const toast = document.querySelector("#achievementToasts .achievement-toast");
      if (!grid) return { ok: false, reason: "no-grid" };
      const g = grid.getBoundingClientRect();
      if (!toast) return { ok: true };
      const r = toast.getBoundingClientRect();
      const overlap =
        r.left < g.right && r.right > g.left && r.top < g.bottom && r.bottom > g.top;
      return { ok: !overlap, reason: overlap ? "toast-on-grid" : "ok" };
    });
    expect(steedOverlap.ok).toBe(true);
    paths.push(await captureShot(page, testInfo, vp, "03-steed", { fullPage: false }));
    for (let i = 0; i < 4; i++) {
      const box = page.locator("#dialogueBox:not(.hidden)");
      if (await box.count()) await box.click();
    }
    await page.locator("#btnSteedNext").click();
    await advanceSheetKeepingChapter1Class(page);
    await page.locator(".journal-entry").first().click();
    await page.locator("#btnYes").click();
    await page.waitForSelector('section[data-screen="tavern"].screen--active');
    await expect(page.locator("#tavernMartaLine")).toContainText("the mead first");
    const meadSelected = await page.locator('.menu-item--on strong:text("Mead")').count();
    expect(meadSelected).toBeGreaterThan(0);
    paths.push(await captureShot(page, testInfo, vp, "04-tavern"));
    await page.locator(".menu-item").first().click();
    await page.locator("#btnTavernNext").click();
    await page.locator(".potion-ing").first().click();
    await page.locator(".vial").first().click();
    for (let i = 0; i < 4; i++) await page.locator("#btnStir").click();
    await page.locator("#dayChips .chip-select").first().click();
    await page.locator("#btnSealDate").click();
    await page.waitForSelector('[data-screen="oracle"].screen--active');
    await page.locator(".tarot-card").first().click();
    await page.locator("#btnOpenLetter").click();
    await page.locator("#btnToDecree").click();
    await page.waitForSelector('[data-screen="rating"].screen--active');
    paths.push(await captureShot(page, testInfo, vp, "05-rating"));
    await page.locator("#btnRatingNext").click();
    await page.waitForSelector('section[data-screen="decree"].screen--active');
    await assertScreenHeadingsClearOfToasts(page, "decree");
    await waitForDecreeSirBerke(page);
    await expect(page.locator("#decreePreview")).toContainText("Testa, Pacifist potato farmer");
    paths.push(await captureShot(page, testInfo, vp, "06-decree"));
    await page.locator("#btnDecreeToPause").click();
    await page.waitForSelector('[data-screen="chapter-two-pause"].screen--active');
    paths.push(await captureShot(page, testInfo, vp, "07-pause"));
    await page.locator("#btnFinishQuest").click();
    await page.waitForSelector('section[data-screen="chapter-two-finish"].screen--active');
    await assertScreenHeadingsClearOfToasts(page, "chapter-two-finish");
    await assertNoToastOverlapsButtons(page, "chapter-two-finish");
    await expect(page.locator("#achievementToasts .achievement-toast")).toHaveCount(0);
    paths.push(await captureShot(page, testInfo, vp, "08-finish"));
    await page.locator('[data-future="yes"]').click();
    await page.locator("#btnCompleteQuest").click();
    await page.waitForSelector('section[data-screen="quest-complete"].screen--active');
    await assertScreenHeadingsClearOfToasts(page, "quest-complete");
    await expect(page.locator("#finalPreview")).toContainText("Testa, Pacifist potato farmer");
    paths.push(await captureShot(page, testInfo, vp, "09-quest-complete"));
    testInfo.annotations.push({ type: "artifact-paths", description: paths.join("\n") });
  });
}
