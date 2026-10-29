import { test } from "node:test";
import assert from "node:assert/strict";
import { questProgressBlocksEveDecline } from "../../js/eve-prelude.js?v=20261210";
import { __setStateForTest } from "../../js/state.js?v=20261210";

test("questProgressBlocksEveDecline when chapter I complete", () => {
  __setStateForTest({ chapterOneComplete: true, honestNo: false });
  assert.equal(questProgressBlocksEveDecline(), true);
});

test("questProgressBlocksEveDecline during Chapter I replay", () => {
  __setStateForTest({
    chapterOneComplete: false,
    secondDate: "",
    chapter1ReplayCount: 1,
    honestNo: false,
  });
  assert.equal(questProgressBlocksEveDecline(), true);
});
