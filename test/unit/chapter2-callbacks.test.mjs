import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildChapter2RecapLines,
  buildChapter2RecapRows,
  chapter1Label,
  chapter1TavernDrinkItem,
  decreeCompanionLogLine,
  dragonGooseCheckpointLine,
  geraldTollInvoiceLine,
  geraldTollPayReaction,
  potionSongSideEffect,
  presetHorseIdFromChapter1,
  sheetClassPrefillLine,
  steedHorseColorNote,
  decreeSteedClassLine,
  provisionsForDecree,
  tavernMartaTestimonyLine,
  adventurerDisplayName,
  buildChapter2RecapRowsForState,
  chapter2BriefingLine,
  chapter2FieldQuestLine,
} from "../../js/chapter2-callbacks.js?v=20261211";

const SAMPLE = {
  class: { id: "potato", label: "Pacifist potato farmer" },
  weapon: { id: "sword", label: "Sword" },
  goose: { id: "become", label: "Become the goose" },
  companion: { id: "goose", label: "Goose (traitor — will betray you)" },
  gerald: { value: 1000, label: "1000 potatoes" },
  song: { id: "sad", label: "Sad elf ballad" },
  tavern: { id: "mead", label: "Mead" },
  horseColor: { id: "any", label: "Any horse that doesn't bite" },
};

test("recap uses stored labels for potato + sword", () => {
  const lines = buildChapter2RecapLines(SAMPLE);
  assert.ok(lines[0].includes("Pacifist potato farmer"));
  assert.ok(lines[0].includes("Sword"));
  assert.ok(lines[0].includes("decoration"));
});

test("recap rows use meaningful labels without duplicated goose prefix", () => {
  const rows = buildChapter2RecapRows(SAMPLE);
  assert.equal(rows[2].label, "Goose verdict");
  assert.ok(!rows[2].value.toLowerCase().startsWith("goose verdict:"));
  assert.equal(rows[3].label, "Companion");
  assert.ok(!rows[3].value.toLowerCase().startsWith("companion:"));
});

test("gerald toll invoice uses potato farmer payable line", () => {
  const line = geraldTollInvoiceLine(SAMPLE);
  assert.match(line, /1000 potatoes/);
  assert.match(line, /conveniently has potatoes/);
});

test("song side effect for sad elf ballad", () => {
  assert.match(potionSongSideEffect(SAMPLE), /sad elf ballad/);
});

test("goose companion dragon line", () => {
  assert.match(dragonGooseCheckpointLine(SAMPLE), /cannot be trusted/);
});

test("fallback when answers missing", () => {
  assert.ok(chapter1Label({}, "class", "class").length > 3);
  assert.equal(presetHorseIdFromChapter1({}), "chestnut");
  assert.ok(sheetClassPrefillLine({}).includes("Natural 20"));
  assert.match(geraldTollInvoiceLine({}), /reasonable number of potatoes/);
});

test("horse color any adds no-biting clause note", () => {
  assert.match(steedHorseColorNote(SAMPLE), /no-biting clause/);
});

test("decree companion log for goose traitor", () => {
  assert.equal(decreeCompanionLogLine(SAMPLE), "Companion: Goose (under investigation)");
});

test("tavern drink item from chapter I mead", () => {
  assert.equal(chapter1TavernDrinkItem(SAMPLE)?.name, "Mead");
});

test("tavern marta line uses the mead drink name", () => {
  assert.equal(
    tavernMartaTestimonyLine(SAMPLE),
    "Marta pours the mead first — per your Chapter I testimony."
  );
  assert.equal(tavernMartaTestimonyLine({}), "");
});

test("adventurer display name prefers Chapter I save", () => {
  assert.equal(adventurerDisplayName({ eveAdventurerName: "Testa" }), "Testa");
  assert.equal(adventurerDisplayName({ eveAdventurerName: "Berke" }), "Jonata");
  assert.equal(adventurerDisplayName({ eveAdventurerName: "Oğuzhan" }), "Jonata");
  assert.equal(adventurerDisplayName({}), "Jonata");
});

test("legacy Chapter I feedback drives the Chapter II recap", () => {
  const oldSave = {
    eveHeraldAnswers: {
      snacks: "essential",
      weather: "tavern",
      "quest-mood": "surprise",
    },
    evePacking: ["coin", "shoes"],
    horseId: "chestnut",
    chapter1Answers: {},
  };
  const rows = buildChapter2RecapRowsForState(oldSave);
  assert.deepEqual(rows.map((row) => row.label), [
    "Snack law",
    "Rain plan",
    "Quest mood",
    "Field kit",
    "Steed omen",
  ]);
  assert.match(rows[2].value, /within reason/i);
  assert.match(rows[3].value, /bard coin.*comfy shoes/i);
  assert.match(chapter2BriefingLine(oldSave), /tavern surprise/i);
  assert.match(chapter2FieldQuestLine(oldSave), /snacks remain legally protected/i);
});

test("potion song variants", () => {
  assert.match(
    potionSongSideEffect({ song: { id: "epic", label: "Epic battle anthem" } }),
    /epic humming/
  );
  assert.match(
    potionSongSideEffect({ song: { id: "tavern", label: "Rowdy tavern shanty" } }),
    /tavern chorus/
  );
});

test("gerald toll pay reactions", () => {
  assert.match(geraldTollPayReaction("potatoes"), /ROOT VEGETABLES/);
  assert.match(geraldTollPayReaction("goose"), /goose dispute/);
});

test("decree class prefers Chapter I label until sheet override", () => {
  const base = {
    chapter1Answers: SAMPLE,
    steedClass: "Knight of the Wildflowers",
    steedClassPicked: false,
  };
  assert.equal(decreeSteedClassLine(base), "Pacifist potato farmer");
  assert.equal(decreeSteedClassLine({ ...base, steedClassPicked: true }), "Knight of the Wildflowers");
});

test("provisions include Chapter I mead when menu untouched", () => {
  assert.deepEqual(provisionsForDecree({ chapter1Answers: SAMPLE, food: [] }), ["Mead"]);
});

test("non-goose companion dragon line", () => {
  assert.match(
    dragonGooseCheckpointLine({ companion: { id: "horse", label: "Horse" } }),
    /Paperwork continues/
  );
});
