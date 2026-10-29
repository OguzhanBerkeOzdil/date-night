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

test("realm certificate notes include data-driven potato + sword line", async () => {
  const stateMod = await import("../../js/state.js?v=20261212");
  stateMod.__resetModuleForTest();
  stateMod.__setStateForTest({
    chapter1Answers: {
      class: { id: "potato", label: "Pacifist potato farmer" },
      weapon: { id: "sword", label: "Sword" },
    },
    steedName: "Clover",
  });
  const { buildRealmCertificateNotes } = await import("../../js/certificate-notes.js?v=20261212");
  const notes = buildRealmCertificateNotes();
  assert.ok(notes.some((n) => n.includes("decorative sword")));
  assert.ok(notes.length >= 3 && notes.length <= 5);
});

test("buildCertificateLines includes official notes section", async () => {
  const stateMod = await import("../../js/state.js?v=20261212");
  stateMod.__resetModuleForTest();
  const { buildCertificateLines } = await import("../../js/certificate.js?v=20261212");
  const lines = buildCertificateLines();
  assert.ok(lines.some((l) => l.startsWith("Official notes from the realm")));
  assert.ok(lines.some((l) => l.includes("Gerald has filed")));
  assert.match(lines[1], /seal pending|officially unlocked/i);
});
