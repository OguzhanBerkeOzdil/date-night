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
  S = await import("../../js/state.js");
  decree = await import("../../js/decree.js");
  S.__resetModuleForTest();
});

test("decree reflects honest decline", async () => {
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
  assert.match(text, /honesty/i);
  assert.match(whenWeRideLine(), /Saturday/);
});

test("decree yes path mentions flee attempts", async () => {
  const { __setStateForTest } = S;
  const { buildSummaryText } = decree;
  __setStateForTest({
    secondDate: "yes",
    noAttempts: 3,
    steedName: "Clover",
    steedClass: "Bard",
  });
  const text = buildSummaryText();
  assert.match(text, /3 attempts to flee/i);
});
