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
  S = await import("../../js/state.js?v=20261214");
  decree = await import("../../js/decree.js?v=20261214");
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

test("pass omits class suffix and empty placeholder lines when Chapter I is blank", async () => {
  const { __setStateForTest } = S;
  const { buildSummaryText } = decree;
  __setStateForTest({
    secondDate: "yes",
    steedName: "Clover",
    rating: 3,
    eveAdventurerName: "",
    chapter1Answers: {},
    todayVibe: "",
    notes: "",
    activities: [],
    food: [],
    potionName: "",
    day: "",
    time: "",
  });
  const text = buildSummaryText();
  assert.match(text, /^Issued to: Jonata$/m);
  assert.doesNotMatch(text, /Issued to: Jonata,/);
  assert.doesNotMatch(text, /Note for the quest:/);
  assert.doesNotMatch(text, /The quest could feel like: —/);
});

test("pass includes class after name when Chapter I class is on file", async () => {
  const { __setStateForTest } = S;
  const { buildSummaryText } = decree;
  __setStateForTest({
    secondDate: "yes",
    steedName: "Clover",
    rating: 3,
    eveAdventurerName: "Testa",
    chapter1Answers: {
      class: { id: "potato", label: "Pacifist potato farmer" },
    },
  });
  const text = buildSummaryText();
  assert.match(text, /Issued to: Testa, Pacifist potato farmer/);
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
