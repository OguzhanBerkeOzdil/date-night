import { test } from "node:test";
import assert from "node:assert/strict";
import { adventurerProfileFromAnswers } from "../../js/chapter1-survey-data.js";

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
