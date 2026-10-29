import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
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

async function listJsFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return listJsFiles(path);
    return entry.isFile() && entry.name.endsWith(".js") ? [path] : [];
  }));
  return nested.flat();
}

test("relative JavaScript imports share the deploy cache version", async () => {
  const cacheVersionSrc = await readFile(join(root, "js/cache-version.js"), "utf8");
  const version = cacheVersionSrc.match(/APP_CACHE_VERSION = "(\d+)"/)?.[1];
  assert.ok(version);

  for (const file of await listJsFiles(join(root, "js"))) {
    const source = await readFile(file, "utf8");
    const imports = source.matchAll(/(?:from\s+|import\s+)["'](\.\/[^"']+\.js)(?:\?v=(\d+))?["']/g);
    for (const match of imports) {
      assert.equal(match[2], version, `${file} must version ${match[1]}`);
    }
  }
});
