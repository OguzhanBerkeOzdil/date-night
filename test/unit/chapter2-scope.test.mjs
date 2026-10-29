import { test } from "node:test";
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

const FROZEN_PATHS = ["js/sync.js"];

test("Chapter II sync module unchanged vs origin/master", () => {
  for (const file of FROZEN_PATHS) {
    let baseline = "";
    try {
      baseline = execSync(`git show origin/master:${file}`, { encoding: "utf8" });
    } catch {
      baseline = "(git failed)";
    }
    const normalizeCacheVersions = (source) => source
      .replace(/\?v=\d+/g, "")
      .replace(/\r\n/g, "\n");
    assert.equal(
      normalizeCacheVersions(readFileSync(file, "utf8")),
      normalizeCacheVersions(baseline),
      `Expected no functional diff for ${file}`
    );
  }
});
