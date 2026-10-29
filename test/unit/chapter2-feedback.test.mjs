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
  globalThis.__FEEDBACK_PROVIDER_FOR_TEST__ = "https://docs.google.com/forms/d/e/test/formResponse";
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
    feedbackStartSent: false,
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

test("completion marks delivery after Google Forms accepts the network request", async () => {
  const state = sampleState();
  const posts = [];
  globalThis.fetch = async (_url, init) => {
    const params = new URLSearchParams(init.body);
    posts.push(JSON.parse(params.get("entry.698061730")));
    return { type: "opaque" };
  };
  globalThis.location = { hostname: "example.com" };
  globalThis.__ALLOW_LOCAL_FEEDBACK_TEST__ = true;

  const result = await chapter2.reportChapter2CompletionFeedback(state, () => {});
  assert.equal(result.status, "sent");
  assert.equal(state.feedbackCompleteSent, true);
  assert.equal(state.feedbackCompleteStatus, "sent");
  assert.equal(posts.length, 1);
  assert.equal(posts[0].part, "completion");
  assert.equal(JSON.parse(posts[0].choices).debrief.futureQuest, "yes");
});

test("rate-limited completion stays queued instead of pretending it was sent", async () => {
  const state = sampleState();
  globalThis.__FEEDBACK_PROVIDER_FOR_TEST__ = "formsubmit";
  globalThis.fetch = async () => ({ ok: false, status: 429 });
  globalThis.location = { hostname: "example.com" };
  globalThis.__ALLOW_LOCAL_FEEDBACK_TEST__ = true;

  const result = await chapter2.reportChapter2CompletionFeedback(state, () => {});
  assert.equal(result.status, "queued");
  assert.equal(result.httpStatus, 429);
  assert.equal(state.feedbackCompleteSent, false);
  assert.equal(state.feedbackCompleteStatus, "queued");
});
