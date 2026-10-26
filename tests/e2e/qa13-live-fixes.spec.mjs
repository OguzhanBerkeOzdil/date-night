import { test, expect } from "@playwright/test";

const JOURNAL_COUNT = 8;

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => {
    document.startViewTransition = undefined;
  });
});

test("undo does not double-boot main.js or duplicate journal", async ({ page }) => {
  const mainLoads = [];
  await page.route(/\/js\/main\.js/, (route) => {
    mainLoads.push(route.request().url());
    route.continue();
  });

  await page.goto("/?name=Ayse");
  await page.evaluate(() => {
    localStorage.setItem(
      "questLady_v2",
      JSON.stringify({
        lastScreen: "journal",
        steedName: "Thunder",
        todayVibe: "A rom-com, but medieval",
      })
    );
  });
  await page.reload();
  const loadsAfterBoot = mainLoads.length;
  await page.locator("#btnNewGame").click();
  await page.locator("#questConfirmStart").click();
  await page.waitForSelector('[data-screen="summons"].screen--active');
  await expect(page.locator(".app-toast__action")).toHaveCount(1);
  await page.locator(".app-toast__action").click();
  await page.waitForSelector('[data-screen="journal"].screen--active');
  expect(await page.locator(".journal-entry").count()).toBe(JOURNAL_COUNT);

  await page.evaluate(() => window.__questNavigate("title"));
  await expect(page.locator("#btnContinue")).toBeVisible();
  const continueBox = await page.locator("#btnContinue").boundingBox();
  expect(continueBox?.width).toBeGreaterThan(8);
  await page.locator("#btnNewGame").click({ trial: true });
  expect(mainLoads.length).toBe(loadsAfterBoot);
  expect(await page.evaluate(() => document.body.dataset.screen)).toBe("title");
});

test("confirm dialog: keep/escape then single reset with working undo", async ({ page }) => {
  await page.goto("/?name=Ayse");
  await page.evaluate(() => {
    localStorage.setItem(
      "questLady_v2",
      JSON.stringify({
        lastScreen: "decree",
        steedName: "Thunder",
        steedClass: "Bard",
        tarotKey: "golden",
        secondDate: "yes",
      })
    );
  });
  await page.reload();

  const openConfirm = async () => {
    await page.locator("#btnNewGame").click();
    await expect(page.locator("#questConfirm")).toBeVisible();
  };

  await openConfirm();
  await page.locator("#questConfirmKeep").click();
  await openConfirm();
  await page.keyboard.press("Escape");
  await openConfirm();
  await page.locator("#questConfirmKeep").click();
  await openConfirm();
  await page.locator("#questConfirmStart").click();
  await page.waitForSelector('[data-screen="summons"].screen--active');

  await expect(page.locator(".app-toast")).toHaveCount(1);
  await page.locator(".app-toast__action").click();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("questLady_v2") || "{}"));
  expect(saved.steedName).toBe("Thunder");
  expect(saved.tarotKey).toBe("golden");
  expect(saved.lastScreen).toBe("decree");
});

test("first new game without save shows no undo toast", async ({ page }) => {
  await page.goto("/?name=Ayse");
  await page.evaluate(() => localStorage.removeItem("questLady_v2"));
  await page.reload();
  await page.locator("#btnNewGame").click();
  await page.waitForSelector('[data-screen="summons"].screen--active');
  await expect(page.locator(".app-toast")).toHaveCount(0);
});

async function gotoDragon(page) {
  await page.goto("/?name=Ayse");
  await page.locator("#btnNewGame").click();
  await page.waitForSelector('[data-screen="summons"].screen--active');
  await page.evaluate(() => document.getElementById("waxSealBtn")?.click());
  await page.waitForSelector("#btnSummonBegin:not(.hidden)", { timeout: 20000 });
  await page.locator("#btnSummonBegin").click();
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

for (const { name, width, height } of [
  { name: "320", width: 320, height: 640 },
  { name: "360", width: 360, height: 740 },
  { name: "390", width: 390, height: 844 },
]) {
  test(`Nay stays inside viewport on ${name}px after dodge`, async ({ page }, testInfo) => {
    if (!testInfo.project.name.startsWith("mobile")) test.skip();
    await page.setViewportSize({ width, height });
    await gotoDragon(page);
    await page.locator("#btnNo").tap();
    for (let i = 0; i < 4; i++) {
      await page.locator("#btnNo").tap({ force: true });
      await page.waitForTimeout(60);
    }
    const box = await page.locator("#btnNo").boundingBox();
    const arena = await page.locator("#dateButtons").boundingBox();
    expect(box).toBeTruthy();
    expect(arena).toBeTruthy();
    expect(box.x).toBeGreaterThanOrEqual(-2);
    expect(box.x + box.width).toBeLessThanOrEqual(width + 2);
    expect(box.x).toBeGreaterThanOrEqual(arena.x - 2);
    expect(box.x + box.width).toBeLessThanOrEqual(arena.x + arena.width + 2);
  });
}
