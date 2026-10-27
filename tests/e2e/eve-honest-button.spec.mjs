import { test, expect } from "@playwright/test";
import { reachDecreeMouse } from "./helpers/quest-path.mjs";

const NON_EVE_SCREENS = [
  "title",
  "summons",
  "steed",
  "sheet",
  "journal",
  "dragon",
  "tavern",
  "potion",
  "stars",
  "oracle",
  "rating",
  "decree",
  "chapter-lock",
  "honest-no",
  "eve-pass",
  "eve-honest",
];

test.beforeEach(async ({ page }) => {
  await page.route("**/formsubmit.co/**", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: '{"success":true}' })
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => {
    document.startViewTransition = undefined;
  });
});

for (const screen of NON_EVE_SCREENS) {
  test(`Eve honest button hidden on ${screen}`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile-390");
    await page.goto("/?name=Ayse");
    await page.evaluate((id) => window.__questNavigate(id), screen);
    await page.waitForSelector(`.screen[data-screen="${screen}"].screen--active`);
    const btn = page.locator("#btnEveHonest");
    await expect(btn).toBeHidden();
    await expect(btn).toHaveAttribute("aria-hidden", "true");
    await expect(btn).toBeDisabled();
  });
}

test("accepted quest cannot be declined via Eve honest button", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-390");
  await reachDecreeMouse(page);
  const before = await page.evaluate(() => JSON.parse(localStorage.getItem("questLady_v3")));
  expect(before.chapterOneComplete).toBe(true);
  expect(before.honestNo).toBe(false);

  await page.evaluate(() => document.getElementById("btnEveHonest")?.click());
  const after = await page.evaluate(() => JSON.parse(localStorage.getItem("questLady_v3")));
  expect(after.honestNo).toBe(false);
  expect(after.chapter).not.toBe("declined");
  await expect(page.locator('section[data-screen="decree"].screen--active')).toBeVisible();
});
