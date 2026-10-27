import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";

const store = new Map();

function installMocks() {
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
  };
  globalThis.location = { search: "?name=Test", pathname: "/", href: "http://localhost/" };
}

let S;

beforeEach(async () => {
  store.clear();
  installMocks();
  S = await import("../../js/state.js");
  S.__resetModuleForTest();
});

test("hasQuestSave detects progressed screens", async () => {
  const { hasQuestSave, saveState, __setStateForTest } = S;
  __setStateForTest({ lastScreen: "title" });
  assert.equal(hasQuestSave(), false);
  __setStateForTest({ lastScreen: "rating" });
  saveState();
  assert.equal(hasQuestSave(), true);
});

test("migrates a legacy v2 save into schema v3", async () => {
  localStorage.setItem("questLady_v2", JSON.stringify({ lastScreen: "oracle", steedName: "Legacy" }));
  const loaded = S.loadState();
  assert.equal(loaded.schemaVersion, 3);
  assert.equal(loaded.steedName, "Legacy");
  assert.equal(loaded.chapter, "chapter-one");
});

test("beginNewQuest and undo restore prior save", async () => {
  const { beginNewQuest, undoLastNewQuest, saveState, __setStateForTest } = S;
  __setStateForTest({ lastScreen: "dragon", steedName: "Thunder", noAttempts: 2 });
  saveState();
  beginNewQuest();
  assert.equal(S.state.lastScreen, "title");
  assert.equal(S.state.steedName, "Clover");
  assert.ok(undoLastNewQuest());
  assert.equal(S.state.steedName, "Thunder");
  assert.equal(S.state.lastScreen, "dragon");
  assert.equal(S.state.noAttempts, 2);
});

test("undo restores latest quest after toast expired and new progress", async () => {
  const { beginNewQuest, undoLastNewQuest, saveState, clearPendingUndo, __setStateForTest } = S;
  __setStateForTest({ lastScreen: "decree", steedName: "QuestA", secondDate: "yes" });
  saveState();
  beginNewQuest();
  clearPendingUndo();
  __setStateForTest({ lastScreen: "decree", steedName: "QuestB", secondDate: "yes", tarotKey: "golden" });
  saveState();
  beginNewQuest();
  assert.ok(undoLastNewQuest());
  assert.equal(S.state.steedName, "QuestB");
  assert.equal(S.state.tarotKey, "golden");
});

test("second beginNewQuest does not overwrite undo snapshot with empty save", async () => {
  const { beginNewQuest, undoLastNewQuest, saveState, __setStateForTest, __getPendingUndoSnapshot } = S;
  __setStateForTest({ lastScreen: "oracle", steedName: "Thunder", tarotKey: "golden" });
  saveState();
  beginNewQuest();
  beginNewQuest();
  assert.ok(undoLastNewQuest());
  assert.equal(S.state.steedName, "Thunder");
  assert.equal(S.state.tarotKey, "golden");
  assert.equal(S.state.lastScreen, "oracle");
  assert.equal(__getPendingUndoSnapshot(), null);
});
