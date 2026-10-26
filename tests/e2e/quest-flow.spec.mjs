import { test, expect } from "@playwright/test";
import { reachDecreeMouse } from "./helpers/quest-path.mjs";

async function breakSeal(page) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.evaluate(() => document.getElementById("waxSealBtn")?.click());
  await page.waitForSelector("#btnSummonBegin:not(.hidden)", { timeout: 15000 });
}

async function reachDragon(page) {
  await page.goto("/?name=Ayse");
  await page.locator("#btnNewGame").click();
  await page.waitForSelector('[data-screen="summons"].screen--active');
  await breakSeal(page);
  await page.locator("#btnSummonBegin").click();
  await page.waitForSelector('[data-screen="steed"].screen--active');
  for (let i = 0; i < 4; i++) {
    const box = page.locator("#dialogueBox:not(.hidden)");
    if (await box.count()) await box.click();
  }
  await page.locator("#btnSteedNext").click();
  await page.locator("#btnRoll").click();
  await page.locator('[data-class="Knight of the Wildflowers"]').click();
  await page.locator("#btnSheetNext").click();
  await page.locator("#btnRatingNext").click();
  await page.locator(".journal-entry").first().click();
  await page.waitForSelector('[data-screen="dragon"].screen--active');
}

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => {
    document.startViewTransition = undefined;
  });
});

test("honest decline visible from first moment", async ({ page }) => {
  await reachDragon(page);
  const link = page.locator("#realNoLink");
  await expect(link).toBeVisible();
  await link.click();
  await page.waitForSelector('[data-screen="honest-no"].screen--active');
});

test("new game confirm when save exists", async ({ page }) => {
  await page.goto("/?name=Ayse");
  await page.evaluate(() => {
    localStorage.setItem("questLady_v2", JSON.stringify({ lastScreen: "decree", steedName: "Thunder" }));
  });
  await page.reload();
  await page.locator("#btnNewGame").click();
  await expect(page.locator("#questConfirm")).toBeVisible();
  await page.locator("#questConfirmStart").click();
  await page.waitForSelector('[data-screen="summons"].screen--active');
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("questLady_v2") || "{}"));
  expect(saved.steedName).toBe("Clover");
});

test("begin anew uses confirm when save exists", async ({ page }) => {
  await reachDecreeMouse(page);
  await page.locator("#btnReplay").click();
  await expect(page.locator("#questConfirm")).toBeVisible();
  await page.locator("#questConfirmStart").click();
  await page.waitForSelector('[data-screen="summons"].screen--active');
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("questLady_v2") || "{}"));
  expect(saved.lastScreen).toBe("summons");
});

test("wax seal keyboard activation", async ({ page }) => {
  await page.goto("/?name=Ayse");
  await page.locator("#btnNewGame").click();
  await page.locator("#waxSealBtn").focus();
  await page.keyboard.press("Enter");
  await page.waitForSelector("#loadingQuest:not([hidden])", { timeout: 5000 });
});
