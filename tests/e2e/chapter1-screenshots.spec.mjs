import { test, expect } from "@playwright/test";
import { CHAPTER1_QUESTIONS } from "../../js/chapter1-survey-data.js?v=20261211";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    globalThis.__CHAPTER_ONE_ARCHIVED_OVERRIDE__ = false;
  });
  await page.route("**/docs.google.com/forms/**", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: '{"success":true}' })
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
});

test("Chapter I new screens at 390px", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-390");
  await page.goto("/?name=Ayse");
  await page.locator("#btnNewGame").click();

  async function snap(name) {
    const buf = await page.screenshot({ fullPage: true });
    await testInfo.attach(name, { body: buf, contentType: "image/png" });
  }

  await page.waitForSelector('[data-screen="eve-name"].screen--active');
  await snap("ch1-eve-name-390.png");

  await page.locator("#btnHeraldNameConfirm").click();
  await page.waitForSelector('[data-screen="eve-excitement"].screen--active');
  await page.locator("#btnExcitementNext").click();
  await page.locator("#btnPackingNext").click();

  for (const q of CHAPTER1_QUESTIONS) {
    await page.waitForSelector('[data-screen="eve-survey"].screen--active');
    await snap(`ch1-survey-${q.id}-390.png`);
    if (q.type === "slider") {
      await page.locator("#btnSurveySliderNext").click();
    } else if (q.type === "weapon-cards") {
      await page.locator(".weapon-card").first().click();
    } else {
      await page.locator("#surveyChoices button").first().click();
    }
    await page.locator("#btnSurveyNext").click();
  }

  await page.waitForSelector('[data-screen="eve-pass"].screen--active');
  await snap("ch1-eve-pass-390.png");
  expect(testInfo.attachments.length).toBeGreaterThanOrEqual(11);
});
