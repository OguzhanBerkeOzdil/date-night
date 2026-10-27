import { test } from "node:test";
import assert from "node:assert/strict";
import { questProgressBlocksEveDecline } from "../../js/eve-prelude.js";
import { __setStateForTest } from "../../js/state.js";

test("questProgressBlocksEveDecline when chapter I complete", () => {
  __setStateForTest({ chapterOneComplete: true, honestNo: false });
  assert.equal(questProgressBlocksEveDecline(), true);
});
