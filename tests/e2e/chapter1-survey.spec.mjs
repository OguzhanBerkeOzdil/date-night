import { test, expect } from "@playwright/test";
import { completeEveName } from "./helpers/eve-path.mjs";
import { CHAPTER1_QUESTIONS } from "../../js/chapter1-survey-data.js?v=20261212";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    globalThis.__CHAPTER_ONE_ARCHIVED_OVERRIDE__ = false;
    window.__ALLOW_LOCAL_FEEDBACK_TEST__ = true;
  });
  await page.route("**/docs.google.com/forms/**", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: '{"success":true}' })
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
});

test("herald name screen prefills and sanitizes ?name=", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-390");
  await page.goto("/?name=%20%20Lady%20ZeynepExtraLongNameThatGetsTrimmed");
  await page.locator("#btnNewGame").click();
  await page.waitForSelector('[data-screen="eve-name"].screen--active');
  const val = await page.locator("#heraldNameInput").inputValue();
  assertNameSanitized(val);
  await page.locator("#btnHeraldNameAdventurer").click();
  await page.waitForSelector('[data-screen="eve-excitement"].screen--active');
});

function assertNameSanitized(val) {
  expect(val.length).toBeLessThanOrEqual(24);
  expect(val.toLowerCase().startsWith("lady ")).toBe(false);
}

test("each survey step shows character and reaction", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-390");
  await page.goto("/");
  await page.locator("#btnNewGame").click();
  await completeEveName(page, "Mina");
  await page.locator("#btnExcitementNext").click();
  await page.locator("#btnPackingNext").click();

  for (let i = 0; i < CHAPTER1_QUESTIONS.length; i++) {
    const q = CHAPTER1_QUESTIONS[i];
    await page.waitForSelector('[data-screen="eve-survey"].screen--active');
    await expect(page.locator("#chapter1Progress")).toHaveText(`Question ${i + 1}/9`);
    await expect(page.locator("#surveyCharacter")).toHaveText(q.character);
    if (q.type === "slider") {
      await page.locator("#btnSurveySliderNext").click();
    } else if (q.type === "weapon-cards") {
      await page.locator(".weapon-card").first().click();
    } else {
      await page.locator("#surveyChoices button").first().click();
    }
    await expect(page.locator("#surveyReaction")).toBeVisible();
    await page.locator("#btnSurveyNext").click();
  }
  await page.waitForSelector('[data-screen="eve-pass"].screen--active');
});

test("census witch stores inside-joke label for feedback", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-390");
  await page.goto("/");
  await page.locator("#btnNewGame").click();
  await completeEveName(page, "Mina");
  await page.locator("#btnExcitementNext").click();
  await page.locator("#btnPackingNext").click();
  for (let i = 0; i < 4; i++) {
    await page.waitForSelector('[data-screen="eve-survey"].screen--active');
    await page.locator("#btnSurveySkip").click();
  }
  await page.waitForSelector("#surveyCharacter", { hasText: "Royal census" });
  await page.getByRole("button", { name: "A witch from the forestttt" }).click();
  await expect(page.locator("#surveyReaction")).toHaveText(
    "The forest has been notified. The mushrooms are nervous."
  );
  const census = await page.evaluate(() => {
    const raw = localStorage.getItem("questLady_v3");
    return raw ? JSON.parse(raw).chapter1Answers?.census : null;
  });
  expect(census?.label).toBe("A witch from the forestttt");
  expect(census?.id).toBe("witch");
});

test("weapon and portrait images return 200", async ({ page }) => {
  const urls = [
    "assets/characters/lucius-bard.webp",
    "assets/equipment/sword.webp",
    "assets/equipment/flower.webp",
  ];
  for (const path of urls) {
    const res = await page.goto(`/${path}`);
    expect(res?.status()).toBe(200);
  }
});
