import { test, expect } from "@playwright/test";
import { reachDecreeMouse } from "./helpers/quest-path.mjs";

test.beforeEach(async ({ page }) => {
  await page.route("**/formsubmit.co/**", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: '{"success":true}' })
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => {
    document.startViewTransition = undefined;
    window.__ALLOW_LOCAL_FEEDBACK_TEST__ = true;
  });
});

test("main quest feedback uses mocked endpoint at decree", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-1440");
  const posts = [];
  await page.route("**/formsubmit.co/**", (route) => {
    posts.push(route.request().postDataJSON());
    return route.fulfill({ status: 200, body: "{}" });
  });
  await reachDecreeMouse(page);
  await page.waitForTimeout(500);
  const mainPosts = posts.filter((p) => p.part === "main");
  expect(mainPosts.length).toBeGreaterThan(0);
});
