import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";

beforeEach(async () => {
  globalThis.localStorage = {
    _m: new Map(),
    getItem(k) {
      return this._m.has(k) ? this._m.get(k) : null;
    },
    setItem(k, v) {
      this._m.set(k, String(v));
    },
    removeItem(k) {
      this._m.delete(k);
    },
  };
  globalThis.location = { search: "", pathname: "/", href: "http://localhost/" };
});

test("certificate omits Chapter I profile block when answers are missing", async () => {
  const stateMod = await import("../../js/state.js?v=20261213");
  stateMod.__resetModuleForTest();
  stateMod.__setStateForTest({ chapter1Answers: {}, steedName: "Clover" });
  const { buildCertificateLines } = await import("../../js/certificate.js?v=20261213");
  const lines = buildCertificateLines("pass");
  assert.doesNotMatch(lines.join("\n"), /Class:/);
  assert.doesNotMatch(lines.join("\n"), /Weapon:/);
  assert.doesNotMatch(lines.join("\n"), /Adventurer profile \(Chapter I\)/);
});

test("certificate keeps profile lines when Chapter I class is on file", async () => {
  const stateMod = await import("../../js/state.js?v=20261213");
  stateMod.__resetModuleForTest();
  stateMod.__setStateForTest({
    chapter1Answers: {
      class: { id: "potato", label: "Pacifist potato farmer" },
      weapon: { id: "sword", label: "Sword" },
      companion: { id: "goose", label: "Goose (traitor — will betray you)" },
    },
    steedName: "Clover",
  });
  const { buildCertificateLines } = await import("../../js/certificate.js?v=20261213");
  const text = buildCertificateLines("completion").join("\n");
  assert.match(text, /Class: Pacifist potato farmer/);
  assert.match(text, /Weapon: Sword/);
  assert.match(text, /Companion: Goose/);
});
