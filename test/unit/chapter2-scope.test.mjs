import { test } from "node:test";
import assert from "node:assert/strict";
import { execSync } from "node:child_process";

const FROZEN_PATHS = ["js/sync.js"];

test("Chapter II sync module unchanged vs origin/master", () => {
  for (const file of FROZEN_PATHS) {
    let diff = "";
    try {
      diff = execSync(`git diff origin/master -- ${file}`, { encoding: "utf8" });
    } catch {
      diff = "(git failed)";
    }
    assert.equal(diff, "", `Expected no diff for ${file}`);
  }
});
