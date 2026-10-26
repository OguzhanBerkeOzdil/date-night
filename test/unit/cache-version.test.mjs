import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

test("sw.js inline APP_CACHE_VERSION matches js/cache-version.js", async () => {
  const cacheVersionSrc = await readFile(join(root, "js/cache-version.js"), "utf8");
  const swSrc = await readFile(join(root, "sw.js"), "utf8");
  const match = cacheVersionSrc.match(/export const APP_CACHE_VERSION = "(\d+)"/);
  assert.ok(match, "cache-version.js exports APP_CACHE_VERSION");
  const version = match[1];
  assert.match(
    swSrc,
    new RegExp(`const APP_CACHE_VERSION = "${version}";`),
    "sw.js must inline the same version (classic worker, no import)"
  );
  assert.doesNotMatch(swSrc, /\bimport\b/, "sw.js must be a classic script");
  assert.doesNotMatch(swSrc, /\bexport\b/, "sw.js must be a classic script");
});
