/** Data-driven Chapter I callbacks for Chapter II (no hardcoded guest answers). */

import { parseGuestName } from "./state.js";

const FALLBACK = {
  class: "an unclassified adventurer",
  weapon: "mysterious intent",
  horseColor: "any horse willing to negotiate",
  song: "ambient tavern noise",
  census: "person of interest",
  goose: "unclear bridge etiquette",
  geraldToll: "a reasonable number of potatoes",
  tavern: "tavern provisions",
  companion: "a licensed companion",
};

export function getChapter1Answer(answers, questionId) {
  const raw = answers?.[questionId];
  if (!raw || raw.skipped) return null;
  if (raw.label) return { id: raw.id, label: raw.label, value: raw.value, freeText: raw.freeText };
  if (typeof raw.value === "number") return { id: raw.id, label: raw.label, value: raw.value };
  return null;
}

export function chapter1Label(answers, questionId, fallbackKey) {
  const ans = getChapter1Answer(answers, questionId);
  return ans?.label || ans?.freeText || FALLBACK[fallbackKey] || "—";
}

export function chapter1Id(answers, questionId) {
  return getChapter1Answer(answers, questionId)?.id || "";
}

const CLASS_RECAP = {
  bard: "Bard — paperwork in verse, unfortunately.",
  paladin: "Paladin — shiny and morally loud.",
  ranger: "Ranger — forest-certified.",
  druid: "Druid — legally mossy.",
  potato: "Pacifist potato farmer",
};

const WEAPON_RECAP = {
  sword: "a Sword",
  bow: "a Longbow",
  lute: "a Lute (musical menace)",
  staff: "a Magic staff",
  pan: "a Cast-iron frying pan",
  pacifist: "pacifism (weapon slot empty)",
};

const GOOSE_VERDICT = {
  fight: "Goose verdict: you chose violence. The goose respects the honesty.",
  bribe: "Goose verdict: bribery accepted. The goose is corrupt now.",
  negotiate: "Goose verdict: talks stalled. Bread remains on the table.",
  run: "Goose verdict: tactical retreat. Respectable.",
  become: "Goose verdict: you became the goose. HR is confused.",
};

const COMPANION_RECAP = {
  horse: "Companion: Horse (approved by Gerald).",
  cat: "Companion: Cat (judgmental but present).",
  raven: "Companion: Raven (ominous, on schedule).",
  goose: "Companion: Goose (traitor — will betray you).",
};

export function adventurerDisplayName(state) {
  const fromSave = (state?.eveAdventurerName || "").trim();
  if (fromSave) return fromSave;
  const guest = parseGuestName();
  if (guest.formal && !/^adventurer$/i.test(guest.formal)) return guest.formal;
  return "Adventurer";
}

export function buildChapter2RecapLines(answers = {}) {
  const classId = chapter1Id(answers, "class");
  const classLine = CLASS_RECAP[classId] || chapter1Label(answers, "class", "class");
  const weaponLine = WEAPON_RECAP[chapter1Id(answers, "weapon")] || chapter1Label(answers, "weapon", "weapon");
  const armed =
    classId === "potato" && chapter1Id(answers, "weapon") === "sword"
      ? `${classLine}. Armed with: ${weaponLine}. For decoration, presumably.`
      : `${classLine}. Armed with: ${weaponLine}.`;
  const goose = GOOSE_VERDICT[chapter1Id(answers, "goose")] || `Goose verdict: ${chapter1Label(answers, "goose", "goose")}.`;
  const companion = COMPANION_RECAP[chapter1Id(answers, "companion")] || `Companion: ${chapter1Label(answers, "companion", "companion")}.`;
  return [armed, goose, companion];
}

export function geraldTollAmount(answers) {
  const ans = getChapter1Answer(answers, "gerald");
  if (ans?.value != null) return `${ans.value} potatoes`;
  return FALLBACK.geraldToll;
}

export function geraldPayableBy(answers) {
  const classId = chapter1Id(answers, "class");
  if (classId === "potato") return "the farmer, who conveniently has potatoes";
  const census = chapter1Label(answers, "census", "census");
  return `${census}, pending Gerald's approval`;
}

export function geraldTollInvoiceLine(answers) {
  return `Toll invoice No. 001: ${geraldTollAmount(answers)}. Payable by: ${geraldPayableBy(answers)}.`;
}

const HORSE_COLOR_TO_BREED = {
  chestnut: "chestnut",
  black: "friesian",
  white: "palomino",
  grey: "dapple-grey",
  any: "chestnut",
  berke: "definitely-a-horse",
};

export function presetHorseIdFromChapter1(answers) {
  const id = chapter1Id(answers, "horseColor");
  return HORSE_COLOR_TO_BREED[id] || "chestnut";
}

export function steedHorseColorNote(answers) {
  if (chapter1Id(answers, "horseColor") === "any") {
    return "All candidates have signed a no-biting clause.";
  }
  return "";
}

export function dragonGooseCheckpointLine(answers) {
  const id = chapter1Id(answers, "companion");
  if (id === "goose") return "The goose votes Charge onward. The goose cannot be trusted.";
  if (id === "cat") return "The cat votes Charge onward. The cat will not explain why.";
  if (id === "raven") return "The raven votes Charge onward. One ominous caw of approval.";
  return "Your companion votes Charge onward. Paperwork continues.";
}

export function decreeCompanionLogLine(answers) {
  const id = chapter1Id(answers, "companion");
  if (id === "goose") return "Companion: Goose (under investigation)";
  return `Companion: ${chapter1Label(answers, "companion", "companion")}`;
}

const TAVERN_DRINKS = {
  stew: { id: "stew-ch1", name: "Mystery stew (Chapter I order)", line: "Still mysterious. Still fine." },
  cocoa: { id: "cocoa-ch1", name: "Hot chocolate", line: "Marshmallow diplomacy, reprised." },
  mead: { id: "mead-ch1", name: "Mead", line: "Classic. The goblet remains suspiciously shiny." },
  berke: { id: "berke-round", name: "Whatever Berke is paying for", line: "Marta taps the tab to Berke." },
};

export function chapter1TavernDrinkItem(answers) {
  const id = chapter1Id(answers, "tavern");
  return TAVERN_DRINKS[id] || null;
}

export function tavernMartaTestimonyLine(answers) {
  const drink = chapter1Label(answers, "tavern", "tavern");
  return `Marta pours ${drink} first — per your Chapter I testimony.`;
}

export function fanumTaxExplanation() {
  return "Fanum tax: Berke's ancient right to one bite from your plate. The law is weird; the fries are shared.";
}

const SONG_SIDE_EFFECTS = {
  epic: "unexpected epic humming (one chorus, legally brief)",
  tavern: "spontaneous tavern chorus (clapping not included)",
  sad: "spontaneous sad elf ballad (one verse, the bard promises)",
  "no-lute": "blessed silence where a lute might have been",
  custom: "a custom song request echoing in your head",
};

export function potionSongSideEffect(answers) {
  const id = chapter1Id(answers, "song");
  const effect = SONG_SIDE_EFFECTS[id];
  if (effect) return effect;
  const label = chapter1Label(answers, "song", "song");
  return `faint ${label} energy`;
}

const SHEET_CLASS_PREFILL = {
  potato: "Natural 20 on Potato Diplomacy.",
  bard: "Natural 20 on Questionable Lute Solos.",
  paladin: "Natural 20 on Polite Intimidation.",
  ranger: "Natural 20 on Moss Identification.",
  druid: "Natural 20 on Fern Applause.",
};

export function sheetClassPrefillLine(answers) {
  const id = chapter1Id(answers, "class");
  return SHEET_CLASS_PREFILL[id] || `Natural 20 on ${chapter1Label(answers, "class", "class")}.`;
}

export function geraldTollPayReaction(kind) {
  if (kind === "potatoes") return "Gerald stamps PAID IN ROOT VEGETABLES. The mountain sighs with tax efficiency.";
  return "Gerald notes your goose dispute. The goose is unhelpful. Toll waived out of spite.";
}
