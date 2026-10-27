export async function completeEveToLock(page) {
  await page.waitForSelector('[data-screen="eve-gate"].screen--active', { timeout: 15000 });
  await page.locator("#guestNameInput").fill("Ayse");
  await page.locator("#btnGateNext").click();
  await page.waitForSelector('[data-screen="eve-excitement"].screen--active');
  await page.locator("#btnExcitementNext").click();
  for (let i = 0; i < 3; i++) {
    await page.locator("#heraldChoices button").first().click();
    await page.waitForTimeout(700);
  }
  await page.locator("#btnHeraldNext").click();
  await page.locator("#btnPackingNext").click();
  await page.waitForSelector('[data-screen="eve-pass"].screen--active');
  await page.locator("#btnEveContinue").click();
  await page.waitForSelector('[data-screen="chapter-lock"].screen--active');
}

export async function releaseMainQuestForTest(page) {
  await page.evaluate(() => window.__questNavigate("chapter-two-start"));
  await page.waitForSelector('[data-screen="chapter-two-start"].screen--active');
  await page.locator("#btnStartAdventure").click();
  await page.waitForSelector('[data-screen="summons"].screen--active');
}

export async function completeEveMouse(page) {
  await completeEveToLock(page);
  await releaseMainQuestForTest(page);
}
