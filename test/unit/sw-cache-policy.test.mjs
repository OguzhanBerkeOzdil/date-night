import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

test("sw.js activate only deletes quest-shell-* and quest-assets-* caches", async () => {
  const swSrc = await readFile(join(root, "sw.js"), "utf8");
  assert.match(swSrc, /function isQuestCacheName/);
  assert.match(swSrc, /quest-shell-/);
  assert.match(swSrc, /quest-assets-/);
  assert.doesNotMatch(
    swSrc,
    /keys\.filter\(\(k\) => k !== SHELL_CACHE && k !== ASSET_CACHE\)/,
    "must not delete every cache on the origin"
  );
});

test("sw.js precaches versioned index.html asset URLs", async () => {
  const swSrc = await readFile(join(root, "sw.js"), "utf8");
  const cacheVersionSrc = await readFile(join(root, "js/cache-version.js"), "utf8");
  const ver = cacheVersionSrc.match(/APP_CACHE_VERSION = "(\d+)"/)?.[1];
  assert.ok(ver);
  assert.match(swSrc, new RegExp(`css/styles\\.css\\?v=\\$\\{V\\}`));
  assert.match(swSrc, new RegExp(`js/main\\.js\\?v=\\$\\{V\\}`));
  assert.match(swSrc, /ignoreSearch: true/, "asset cache may fall back within current cache only");
  assert.match(swSrc, /matchInAssetCache/, "fallback must be scoped to asset cache");
});
