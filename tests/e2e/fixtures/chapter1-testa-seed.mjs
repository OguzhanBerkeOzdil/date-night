import {
  buildWireSeedFromOwnerJson,
  encodeSeedToBase64Url,
} from "../../../js/seed-link.js";

/** Complete Chapter I fixture for Chapter II callback screenshots (no real player data). */
export const CHAPTER_I_TESTA_OWNER = {
  name: "Testa",
  excitement: 3,
  packing: ["cloak"],
  horse: "chestnut",
  outcome: "yes",
  survey: {
    class: { id: "potato", label: "Pacifist potato farmer" },
    weapon: { id: "sword", label: "Sword" },
    horseColor: { id: "chestnut", label: "Chestnut" },
    song: { id: "sad", label: "Sad elf ballad" },
    census: { id: "mystery", label: "Mysterious stranger who refuses to explain" },
    goose: { id: "become", label: "Become the goose" },
    gerald: { value: 1000, label: "1000 potatoes" },
    tavern: { id: "mead", label: "Mead" },
    companion: { id: "goose", label: "Goose (traitor — will betray you)" },
  },
};

export function chapter1TestaSeedToken() {
  return encodeSeedToBase64Url(buildWireSeedFromOwnerJson(CHAPTER_I_TESTA_OWNER));
}
