import { tabTo, activate, dismissSteedDialogue, waitForScreen } from "./keyboard.mjs";
import { completeEveMouse } from "./eve-path.mjs";

/** Roll stats and keep Chapter I class prefill (do not pick a random sheet class). */
export async function advanceSheetKeepingChapter1Class(page) {
  await page.locator("#btnRoll").click();
  await page.locator("#btnSheetNext").click();
}

export async function breakSealKeyboard(page) {
  await tabTo(page, "#waxSealBtn");
  await activate(page);
  await page.waitForSelector("#btnSummonBegin:not(.hidden)", { timeout: 20000 });
}

export async function runQuestToDragonKeyboard(page) {
  await page.goto("/?name=Ayse");
  await completeEveMouse(page);
  await waitForScreen(page, "summons");
  await breakSealKeyboard(page);
  await tabTo(page, "#btnSummonBegin");
  await activate(page);
  await waitForScreen(page, "gerald-toll");
  await tabTo(page, "#btnPayPotatoes");
  await activate(page);
  await waitForScreen(page, "steed");
  await dismissSteedDialogue(page);
  await tabTo(page, "#btnSteedNext");
  await activate(page);
  await waitForScreen(page, "sheet");
  await tabTo(page, "#btnRoll");
  await activate(page);
  await tabTo(page, "#btnSheetNext");
  await activate(page);
  await waitForScreen(page, "journal");
  await tabTo(page, ".journal-entry");
  await activate(page);
  await waitForScreen(page, "dragon");
}

export async function runQuestToDecreeKeyboard(page) {
  await runQuestToDragonKeyboard(page);
  await tabTo(page, "#btnYes");
  await activate(page);
  await waitForScreen(page, "tavern");
  await tabTo(page, ".menu-item");
  await activate(page);
  await tabTo(page, "#btnTavernNext");
  await activate(page);
  await waitForScreen(page, "potion");
  await tabTo(page, ".potion-ing");
  await activate(page);
  await tabTo(page, ".vial");
  await activate(page);
  for (let i = 0; i < 4; i++) {
    await tabTo(page, "#btnStir");
    await activate(page);
    await page.waitForTimeout(80);
  }
  await waitForScreen(page, "stars");
  await tabTo(page, "#dayChips .chip-select");
  await activate(page);
  await tabTo(page, "#btnSealDate");
  await activate(page);
  await page.waitForSelector('[data-screen="oracle"].screen--active', { timeout: 15000 });
  await tabTo(page, ".tarot-card");
  await activate(page);
  await page.waitForSelector("#btnOpenLetter:not(.hidden)", { timeout: 8000 });
  await tabTo(page, "#btnOpenLetter");
  await activate(page);
  await page.waitForSelector("#btnToDecree:not(.hidden)", { timeout: 8000 });
  await tabTo(page, "#btnToDecree");
  await activate(page);
  await waitForScreen(page, "rating");
  await tabTo(page, "#btnRatingNext");
  await activate(page);
  await waitForScreen(page, "decree");
}

export async function reachDecreeMouse(page) {
  await page.goto("/?name=Ayse");
  await completeEveMouse(page);
  await page.waitForSelector('[data-screen="summons"].screen--active');
  await page.evaluate(() => document.getElementById("waxSealBtn")?.click());
  await page.waitForSelector("#btnSummonBegin:not(.hidden)", { timeout: 20000 });
  await page.locator("#btnSummonBegin").click();
  await page.waitForSelector('[data-screen="gerald-toll"].screen--active');
  await page.locator("#btnPayPotatoes").click();
  await page.waitForSelector('[data-screen="steed"].screen--active', { timeout: 15000 });
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
  await page.waitForSelector('[data-screen="oracle"].screen--active', { timeout: 15000 });
  await page.locator(".tarot-card").first().click();
  await page.locator("#btnOpenLetter").click();
  await page.locator("#btnToDecree").click();
  await page.waitForSelector('[data-screen="rating"].screen--active');
  await page.locator("#btnRatingNext").click();
  await page.waitForSelector('[data-screen="decree"].screen--active');
}
