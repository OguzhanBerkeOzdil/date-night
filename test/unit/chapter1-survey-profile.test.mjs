import { test } from "node:test";
import assert from "node:assert/strict";
import {
  adventurerProfileFromAnswers,
  CHAPTER1_QUESTIONS,
} from "../../js/chapter1-survey-data.js?v=20261212";

test("adventurerProfileFromAnswers picks class, weapon, companion labels", () => {
  const profile = adventurerProfileFromAnswers({
    class: { label: "Bard" },
    weapon: { label: "Sword" },
    companion: { label: "Goose (traitor — will betray you)" },
  });
  assert.deepEqual(profile, {
    class: "Bard",
    weapon: "Sword",
    companion: "Goose (traitor — will betray you)",
  });
});

test("census witch option uses inside-joke label", () => {
  const census = CHAPTER1_QUESTIONS.find((q) => q.id === "census");
  const witch = census.choices.find((c) => c.id === "witch");
  assert.equal(witch.label, "A witch from the forestttt");
  assert.match(witch.reaction, /mushrooms are nervous/);
});
