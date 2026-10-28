import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";

const store = new Map();

function installMocks() {
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
  };
}

let feedback;
let chapter2;

beforeEach(async () => {
  store.clear();
  installMocks();
  feedback = await import("../../js/feedback.js");
  feedback.__resetFeedbackForTest();
  chapter2 = await import("../../js/chapter2-feedback.js");
});

function sampleState(overrides = {}) {
  return {
    eveAdventurerName: "Test Knight",
    eveExcitement: 4,
    evePacking: ["cloak"],
    horseId: "chestnut",
    chapter1Answers: { class: { id: "potato", label: "Potato" } },
    steedName: "Clover",
    steedClass: "Knight",
    steedClassPicked: true,
    todayVibe: "brave",
    dragonChoice: "yes",
    food: ["Stew"],
    activities: ["Dice"],
    potionBase: "Moon",
    potionName: "Glow",
    vibe: "mystic",
    notes: "none",
    day: "Friday",
    time: "Evening stars",
    fanumTax: true,
    tarotKey: "sun",
    tarotCard: "The Sun",
    rating: 5,
    ratingChip: "legendary",
    ratingBonus: true,
    achievements: ["seal"],
    favoriteMoment: "Tavern",
    questBadge: "hero",
    futureQuest: "yes",
    partyBuff: "Courage",
    feedbackDecreeSent: false,
    feedbackCompleteSent: false,
    feedbackHonestCh2Sent: false,
    chapter1ReplayCount: 0,
    ...overrides,
  };
}

test("buildChapter2ChoicesSnapshot includes steed, tavern, oracle, and rating", () => {
  const snap = chapter2.buildChapter2ChoicesSnapshot(sampleState());
  assert.equal(snap.steed.steedName, "Clover");
  assert.equal(snap.tavern.food[0], "Stew");
  assert.equal(snap.oracle.tarotKey, "sun");
  assert.equal(snap.rating.chip, "legendary");
  assert.equal(snap.chapter1.horsePreset, "chestnut");
});

test("decree feedback uses stable idempotency and marks state sent", () => {
  const state = sampleState();
  const posts = [];
  globalThis.fetch = async (_url, init) => {
    posts.push(JSON.parse(init.body));
    return { ok: true };
  };
  globalThis.location = { hostname: "example.com" };
  globalThis.__ALLOW_LOCAL_FEEDBACK_TEST__ = true;

  chapter2.reportChapter2DecreeFeedback(state, () => {});
  assert.equal(state.feedbackDecreeSent, true);
  assert.equal(posts.length, 1);
  assert.equal(posts[0].idempotencyId, "ch2-decree-test-knight");
  assert.equal(posts[0].part, "main");
  assert.equal(posts[0].name, "Test Knight");
  assert.match(posts[0].choices, /"steed"/);

  chapter2.reportChapter2DecreeFeedback(state, () => {});
  assert.equal(posts.length, 1);
});
