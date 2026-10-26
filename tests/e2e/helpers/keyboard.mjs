/** Tab / Shift+Tab / Enter / Space only — no mouse or touch. */

export async function tabTo(page, selector, { maxTabs = 80, reverse = false } = {}) {
  const loc = page.locator(selector).first();
  await loc.waitFor({ state: "attached", timeout: 15000 });
  for (let i = 0; i < maxTabs; i++) {
    const focused = await loc.evaluate((el) => el === document.activeElement);
    if (focused) return;
    await page.keyboard.press(reverse ? "Shift+Tab" : "Tab");
  }
  throw new Error(`Could not tab to ${selector}`);
}

export async function activate(page) {
  await page.keyboard.press("Enter");
}

export async function dismissSteedDialogue(page, maxLines = 8) {
  for (let i = 0; i < maxLines; i++) {
    const visible = await page.locator("#dialogueBox:not(.hidden)").count();
    if (!visible) return;
    await tabTo(page, "#dialogueBox");
    await activate(page);
    await page.waitForTimeout(120);
  }
}

export async function waitForScreen(page, screenId) {
  await page.waitForSelector(`[data-screen="${screenId}"].screen--active`, { timeout: 20000 });
}

export async function confirmNewQuestIfShown(page) {
  const btn = page.locator("#questConfirmStart");
  try {
    await btn.waitFor({ state: "visible", timeout: 1500 });
    await tabTo(page, "#questConfirmStart");
    await activate(page);
  } catch (_) {
    /* no confirm */
  }
}
