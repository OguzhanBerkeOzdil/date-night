import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";

const store = new Map();
const listeners = new Map();

globalThis.localStorage = {
  getItem: (key) => store.get(key) || null,
  setItem: (key, value) => store.set(key, String(value)),
  removeItem: (key) => store.delete(key),
};
globalThis.location = { search: "", pathname: "/", href: "http://localhost/" };
globalThis.window = globalThis;
globalThis.document = { getElementById: () => null };
Object.defineProperty(globalThis, "navigator", { value: { onLine: true }, configurable: true });
globalThis.addEventListener = (type, handler) => listeners.set(type, handler);
globalThis.dispatchEvent = () => true;
globalThis.CustomEvent = class CustomEvent { constructor(type) { this.type = type; } };

const S = await import("../../js/state.js?v=20261214");
const Sync = await import("../../js/sync.js?v=20261214");

beforeEach(() => {
  store.clear();
  listeners.clear();
  S.__resetModuleForTest();
  Sync.__resetQuestSyncForTest();
  delete globalThis.__QUEST_API_URL__;
});

test("private invite load restores the server revision", async () => {
  const token = "abcdefghijklmnopqrstuvwxyzABCDEFGH12345678";
  globalThis.location.search = `?invite=${token}`;
  Sync.configureQuestSync({ token, apiUrl: "https://example.test/quest-state" });
  globalThis.fetch = async (_url, options) => {
    const body = JSON.parse(options.body);
    assert.equal(body.action, "load");
    return new Response(JSON.stringify({
      revision: 7,
      scheduledDate: "2026-10-28",
      timeZone: "Europe/Warsaw",
      state: { schemaVersion: 3, steedName: "Server Steed", lastScreen: "decree" },
    }), { status: 200, headers: { "content-type": "application/json" } });
  };
  const result = await Sync.initQuestSync();
  assert.equal(result.status, "ready");
  assert.equal(S.state.steedName, "Server Steed");
  assert.equal(S.state.serverRevision, 7);
});

test("invalid token never reaches the network", async () => {
  globalThis.location.search = "?invite=short";
  Sync.configureQuestSync({ token: "", apiUrl: "https://example.test/quest-state" });
  globalThis.fetch = async () => { throw new Error("network should not be called"); };
  const result = await Sync.initQuestSync();
  assert.equal(result.status, "invalid");
});
