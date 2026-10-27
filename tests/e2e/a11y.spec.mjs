import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const ALL_SCREENS = [
  "title",
  "eve-name",
  "eve-excitement",
  "eve-packing",
  "eve-survey",
  "eve-pass",
  "summons",
  "steed",
  "sheet",
  "rating",
  "journal",
  "dragon",
  "honest-no",
  "tavern",
  "potion",
  "stars",
  "oracle",
  "decree",
];

async function assertNoSeriousViolations(page, label) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  const bad = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  expect(bad, `${label}: ${JSON.stringify(bad, null, 2)}`).toHaveLength(0);
}

for (const screen of ALL_SCREENS) {
  test(`axe: ${screen} @ mobile-390`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile-390");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/?name=Ayse");
    await page.evaluate((id) => window.__questNavigate(id), screen);
    await page.waitForSelector(`.screen[data-screen="${screen}"].screen--active`);
    await assertNoSeriousViolations(page, screen);
  });

  test(`axe: ${screen} @ desktop-1440`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-1440");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/?name=Ayse");
    await page.evaluate((id) => window.__questNavigate(id), screen);
    await page.waitForSelector(`.screen[data-screen="${screen}"].screen--active`);
    await assertNoSeriousViolations(page, screen);
  });
}

test("chapter II controls have no serious or critical axe violations", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/?name=Ayse");
  await page.evaluate(() => window.__questNavigate("chapter-two-finish"));
  const results = await new AxeBuilder({ page })
    .include('section[data-screen="chapter-two-finish"]')
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  const bad = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  expect(bad, JSON.stringify(bad, null, 2)).toHaveLength(0);
});
