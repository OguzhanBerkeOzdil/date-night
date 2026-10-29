import { test } from "node:test";
import assert from "node:assert/strict";
import { passSealRect, PASS_ROLL_REGION_TOP } from "../../js/quest-pass-layout.js?v=20261210";

test("pass seal sits above roll region", () => {
  const seal = passSealRect();
  assert.ok(seal.bottom < PASS_ROLL_REGION_TOP);
});
