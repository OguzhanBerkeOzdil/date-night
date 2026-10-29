import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";

const store = new Map();

beforeEach(async () => {
  store.clear();
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
  };
  globalThis.location = { search: "", pathname: "/", href: "http://localhost/" };
});

test("resetChapterOneProgress clears Chapter I but keeps Chapter II fields", async () => {
  const S = await import("../../js/state.js?v=20261213");
  S.__resetModuleForTest();
  S.__setStateForTest({
    chapterOneComplete: true,
    eveComplete: true,
    secondDate: "yes",
    eveAdventurerName: "Ayse",
    chapter1Answers: { class: { label: "Bard" } },
    chapterTwoStarted: true,
    horseId: "black",
    chapter1ReplayCount: 0,
  });
  S.resetChapterOneProgress();
  assert.equal(S.state.chapterOneComplete, false);
  assert.equal(S.state.secondDate, "");
  assert.equal(S.state.eveAdventurerName, "");
  assert.equal(S.state.chapter1Answers.class, undefined);
  assert.equal(S.state.chapterTwoStarted, true);
  assert.equal(S.state.horseId, "black");
  assert.equal(S.state.chapter1ReplayCount, 1);
});
