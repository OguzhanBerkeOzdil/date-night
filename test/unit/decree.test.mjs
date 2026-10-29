import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";

const store = new Map();

let S;
let decree;

beforeEach(async () => {
  store.clear();
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
  };
  globalThis.location = { search: "?name=Elif", pathname: "/", href: "http://localhost/" };
  S = await import("../../js/state.js?v=20261211");
  decree = await import("../../js/decree.js?v=20261211");
  S.__resetModuleForTest();
});

test("adventurer pass reflects a pressure-free decline", async () => {
  const { __setStateForTest } = S;
  const { buildSummaryText, whenWeRideLine } = decree;
  __setStateForTest({
    honestNo: true,
    secondDate: "no",
    steedName: "Clover",
    steedClass: "Knight",
    day: "Saturday · Morning ride",
    time: "Morning ride",
  });
  const text = buildSummaryText();
  assert.match(text, /declined/i);
  assert.doesNotMatch(text, /flee|shame|try again/i);
  assert.match(whenWeRideLine(), /Saturday/);
});

test("adventurer pass records acceptance and adventure energy", async () => {
  const { __setStateForTest } = S;
  const { buildSummaryText } = decree;
  __setStateForTest({
    secondDate: "yes",
    steedName: "Clover",
    steedClass: "Bard",
    rating: 4,
    ratingChip: "leave room for snacks",
  });
  const text = buildSummaryText();
  assert.match(text, /accepted/i);
  assert.match(text, /4\/5/i);
  assert.match(text, /leave room for snacks/i);
});

test("completion certificate keeps the future-quest answer explicit", async () => {
  const { __setStateForTest } = S;
  const { buildCompletionText } = decree;
  __setStateForTest({
    chapterTwoComplete: true,
    partyBuff: "Snack compass",
    questBadge: "Best banter",
    futureQuest: "not-now",
  });
  const text = buildCompletionText();
  assert.match(text, /Snack compass/);
  assert.match(text, /Best banter/);
  assert.match(text, /not right now/i);
});
