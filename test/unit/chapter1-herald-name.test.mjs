import { test } from "node:test";
import assert from "node:assert/strict";
import { sanitizeHeraldName } from "../../js/state.js?v=20261210";

test("sanitizeHeraldName trims and strips Lady prefix", () => {
  assert.equal(sanitizeHeraldName("   Lady Ayse  "), "Ayse");
});

test("sanitizeHeraldName caps at 24 characters", () => {
  const long = "abcdefghijklmnopqrstuvwxyz";
  assert.equal(sanitizeHeraldName(long).length, 24);
});
