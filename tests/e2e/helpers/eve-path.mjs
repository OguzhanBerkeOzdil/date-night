/** Advance through the 9-question Chapter I survey (skips each step). */
export async function skipChapter1Survey(page) {
  for (let i = 0; i < 9; i++) {
    await page.waitForSelector('[data-screen="eve-survey"].screen--active');
    const sliderNext = page.locator("#btnSurveySliderNext");
    if (await sliderNext.isVisible()) {
      await sliderNext.click();
      await page.locator("#btnSurveyNext").click();
      continue;
    }
    await page.locator("#btnSurveySkip").click();
  }
}

export async function completeEveName(page, name = "Ayse") {
  await page.waitForSelector('[data-screen="eve-name"].screen--active', { timeout: 15000 });
  await page.locator("#heraldNameInput").fill(name);
  await page.locator("#btnHeraldNameConfirm").click();
}

export async function reachEvePass(page, name = "Ayse") {
  await page.locator("#btnNewGame").click();
  await completeEveName(page, name);
  await page.waitForSelector('[data-screen="eve-excitement"].screen--active');
  await page.locator("#btnExcitementNext").click();
  await page.locator("#btnPackingNext").click();
  await skipChapter1Survey(page);
  await page.waitForSelector('[data-screen="eve-pass"].screen--active');
}

export async function completeEveToLock(page) {
  await reachEvePass(page, "Ayse");
  await page.locator("#btnEveContinue").click();
  await page.waitForSelector(
    '[data-screen="chapter-lock"].screen--active, [data-screen="chapter-two-start"].screen--active'
  );
}
