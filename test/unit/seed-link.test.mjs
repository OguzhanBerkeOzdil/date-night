import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildWireSeedFromOwnerJson,
  decodeSeedFromBase64Url,
  encodeSeedToBase64Url,
  mergeSeedIntoState,
  parseSeedFromSearch,
  validateSeedPayload,
} from "../../js/seed-link.js?v=20261213";

const FAKE_SURVEY = {
  class: { id: "potato", label: "Pacifist potato farmer" },
  weapon: { id: "sword", label: "Sword" },
  tavern: { id: "mead", label: "Mead" },
};

test("encode and decode round-trip", () => {
  const wire = buildWireSeedFromOwnerJson({
    name: "Seed Tester",
    excitement: 4,
    packing: ["cloak"],
    horse: "chestnut",
    outcome: "yes",
    survey: FAKE_SURVEY,
  });
  const token = encodeSeedToBase64Url(wire);
  const raw = decodeSeedFromBase64Url(token);
  const checked = validateSeedPayload(raw);
  assert.equal(checked.ok, true);
  assert.equal(checked.payload.n, "Seed Tester");
  assert.equal(checked.payload.answers.class.id, "potato");
});

test("merge does not overwrite existing local answers", () => {
  const seed = validateSeedPayload(
    decodeSeedFromBase64Url(
      encodeSeedToBase64Url(
        buildWireSeedFromOwnerJson({ name: "New", survey: { class: { id: "bard", label: "Bard" } } })
      )
    )
  ).payload;
  const merged = mergeSeedIntoState(
    {
      eveAdventurerName: "Local",
      chapter1Answers: { class: { id: "potato", label: "Pacifist potato farmer" } },
      chapterOneComplete: true,
    },
    seed
  );
  assert.equal(merged.eveAdventurerName, "Local");
  assert.equal(merged.chapter1Answers.class.id, "potato");
});

test("merge fills missing fields and marks chapter I complete", () => {
  const seed = validateSeedPayload(
    decodeSeedFromBase64Url(
      encodeSeedToBase64Url(buildWireSeedFromOwnerJson({ name: "Fresh", survey: FAKE_SURVEY }))
    )
  ).payload;
  const merged = mergeSeedIntoState({ chapter1Answers: {}, chapterOneComplete: false }, seed);
  assert.equal(merged.eveAdventurerName, "Fresh");
  assert.equal(merged.chapter1Answers.class.id, "potato");
  assert.equal(merged.chapterOneComplete, true);
});

test("parseSeedFromSearch rejects invalid token", () => {
  assert.equal(parseSeedFromSearch("?seed=not-valid-base64!!!"), null);
});
