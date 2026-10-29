import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";

beforeEach(() => {
  globalThis.location = { search: "", pathname: "/", href: "http://localhost/" };
});

test("empty and reserved names resolve to Jonata for quest titles", async () => {
  const S = await import("../../js/state.js?v=20261213");
  S.__resetModuleForTest();
  S.__setStateForTest({ eveAdventurerName: "" });
  assert.equal(S.questOfTitle(), "Jonata");
  S.__setStateForTest({ eveAdventurerName: "Berke" });
  assert.equal(S.questOfTitle(), "Jonata");
  S.__setStateForTest({ eveAdventurerName: "Oğuzhan" });
  assert.equal(S.questOfTitle(), "Jonata");
  S.__setStateForTest({ eveAdventurerName: "Ayse" });
  assert.equal(S.questOfTitle(), "Ayse");
});

test("letter salutation uses Jonata when no saved name", async () => {
  const S = await import("../../js/state.js?v=20261213");
  S.__resetModuleForTest();
  S.__setStateForTest({ eveAdventurerName: "" });
  assert.equal(S.letterSalutation(), "Dear Jonata,");
});
