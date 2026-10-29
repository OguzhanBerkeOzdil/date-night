/** Data-driven Chapter I callbacks for Chapter II (no hardcoded guest answers). */

import { defaultPlayerDisplayName, resolvePlayerDisplayName } from "./state.js?v=20261213";

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

/** Saved Chapter I answer label only (no copy fallbacks or em dashes). */
export function chapter1AnswerLabel(answers, questionId) {
  const ans = getChapter1Answer(answers, questionId);
  return (ans?.label || ans?.freeText || "").trim();
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
  fight: "You chose violence. The goose respects the honesty.",
  bribe: "Bribery accepted. The goose is corrupt now.",
  negotiate: "Talks stalled. Bread remains on the table.",
  run: "Tactical retreat. Respectable.",
  become: "You became the goose. HR is confused.",
};

const COMPANION_RECAP = {
  horse: "Horse (approved by Gerald).",
  cat: "Cat (judgmental but present).",
  raven: "Raven (ominous, on schedule).",
  goose: "Goose (traitor — will betray you).",
};

export function adventurerDisplayName(state) {
  const fromSave = (state?.eveAdventurerName || state?.chapter1SealedName || "").trim();
  if (fromSave) return resolvePlayerDisplayName(fromSave);
  return defaultPlayerDisplayName();
}

const LEGACY_EVE_LABELS = {
  snacks: {
    essential: "Essential — the council agrees.",
    very: "Very essential — correctly louder.",
    triple: "Spare snack for the snack.",
  },
  weather: {
    cloak: "Cloak and carry on.",
    tavern: "Tavern detour.",
    puddles: "Puddles are mini lakes.",
  },
  "quest-mood": {
    laugh: "More laughing than looting.",
    walk: "Long walk, short agenda.",
    surprise: "Surprise me — within reason.",
  },
};

const PACKING_LABELS = {
  cloak: "dramatic cloak",
  snacks: "emergency snacks",
  coin: "one bard coin",
  smile: "willingness to roll with the bit",
  shoes: "comfy shoes",
};

const HORSE_LABELS = {
  chestnut: "Chestnut",
  palomino: "Palomino",
  "dapple-grey": "Dapple grey",
  friesian: "Friesian",
  appaloosa: "Appaloosa",
  pinto: "Pinto",
  buckskin: "Buckskin",
  bay: "Bay",
  roan: "Blue roan",
  "definitely-a-horse": "Definitely a horse",
};

function hasSurveyAnswers(answers) {
  return Boolean(answers && Object.values(answers).some((answer) => answer && !answer.skipped));
}

function legacyEveLabel(group, id) {
  return LEGACY_EVE_LABELS[group]?.[id] || "Not recorded";
}

/** Recap only facts the player actually supplied; old Chapter I saves stay useful. */
export function buildChapter2RecapRowsForState(questState = {}) {
  if (hasSurveyAnswers(questState.chapter1Answers)) {
    return buildChapter2RecapRows(questState.chapter1Answers);
  }

  const old = questState.eveHeraldAnswers || {};
  const packing = (questState.evePacking || [])
    .map((item) => PACKING_LABELS[item] || item)
    .filter(Boolean)
    .join(" · ");
  const rows = [];
  if (old.snacks) rows.push({ label: "Snack law", value: legacyEveLabel("snacks", old.snacks) });
  if (old.weather) rows.push({ label: "Rain plan", value: legacyEveLabel("weather", old.weather) });
  if (old["quest-mood"]) {
    rows.push({ label: "Quest mood", value: legacyEveLabel("quest-mood", old["quest-mood"]) });
  }
  if (packing) rows.push({ label: "Field kit", value: packing });
  if (questState.horseId) {
    rows.push({ label: "Steed omen", value: HORSE_LABELS[questState.horseId] || questState.horseId });
  }
  return rows;
}

export function chapter2BriefingLine(questState = {}) {
  const old = questState.eveHeraldAnswers || {};
  if (old.weather === "tavern" && old["quest-mood"] === "surprise") {
    return "The oracle kept its promise: a tavern surprise, safely within reason. Snack law remains in force.";
  }
  if (old["quest-mood"] === "laugh") {
    return "Tonight's official objective: more laughing than looting. Everything else is optional.";
  }
  return "Your old answers are clues, not obligations. Pick one party buff and let the real adventure do the rest.";
}

export function chapter2FieldQuestLine(questState = {}) {
  const snacksMatter = ["essential", "very", "triple"].includes(
    questState.eveHeraldAnswers?.snacks
  );
  return snacksMatter
    ? "Choose any two together: one precision trial, one strange potion, or one round of strategy. Emergency snacks remain legally protected."
    : "Choose any two together: one precision trial, one strange potion, or one round of strategy. Laughter counts as a critical hit.";
}

export function buildChapter2RecapRows(answers = {}) {
  const classId = chapter1Id(answers, "class");
  const classLine = CLASS_RECAP[classId] || chapter1Label(answers, "class", "class");
  const weaponLine = WEAPON_RECAP[chapter1Id(answers, "weapon")] || chapter1Label(answers, "weapon", "weapon");
  const armed =
    classId === "potato" && chapter1Id(answers, "weapon") === "sword"
      ? `${classLine}. Armed with: ${weaponLine}. For decoration, presumably.`
      : `${classLine}. Armed with: ${weaponLine}.`;
  const gooseId = chapter1Id(answers, "goose");
  const goose =
    GOOSE_VERDICT[gooseId] || `${chapter1Label(answers, "goose", "goose")}.`;
  const companionId = chapter1Id(answers, "companion");
  const companion =
    COMPANION_RECAP[companionId] || chapter1Label(answers, "companion", "companion");
  return [
    { label: "Class & arms", value: armed },
    { label: "Census record", value: chapter1Label(answers, "census", "census") },
    { label: "Goose verdict", value: goose },
    { label: "Companion", value: companion },
  ];
}

/** @deprecated Use buildChapter2RecapRows */
export function buildChapter2RecapLines(answers = {}) {
  return buildChapter2RecapRows(answers).map((row) => row.value);
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
  const ch1 = chapter1TavernDrinkItem(answers);
  if (!ch1?.name) return "";
  const lower = ch1.name.trim().toLowerCase();
  if (!lower) return "";
  const phrase = /^[aeiou]/.test(lower) ? `an ${lower}` : `the ${lower}`;
  return `Marta pours ${phrase} first — per your Chapter I testimony.`;
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

/** Class suffix for decree / pass (empty when unknown — do not emit "—" or generic Adventurer). */
export function decreeSteedClassLine(questState) {
  if (questState.steedClassPicked && (questState.steedClass || "").trim()) {
    return questState.steedClass.trim();
  }
  const ans = getChapter1Answer(questState.chapter1Answers, "class");
  const chapterClass = (ans?.label || ans?.freeText || "").trim();
  if (chapterClass && chapterClass !== "—") return chapterClass;
  const rolled = (questState.steedClass || "").trim();
  if (rolled && !/^adventurer$/i.test(rolled) && rolled !== "—") return rolled;
  return "";
}

/** e.g. "Issued to: Jonata" or "Issued to: Jonata, Pacifist potato farmer". */
export function adventurerLineWithOptionalClass(prefix, displayName, questState) {
  const name = (displayName || "").trim();
  const cls = decreeSteedClassLine(questState);
  if (!cls) return `${prefix}: ${name}`;
  return `${prefix}: ${name}, ${cls}`;
}

/** Provisions including Chapter I tavern preselect even if the guest never tapped the menu. */
export function provisionsForDecree(questState) {
  const names = [...(questState.food || [])];
  const ch1 = chapter1TavernDrinkItem(questState.chapter1Answers);
  if (ch1?.name && !names.includes(ch1.name)) names.unshift(ch1.name);
  return names;
}

export function ensureChapter1TavernPreselect(questState) {
  const ch1 = chapter1TavernDrinkItem(questState.chapter1Answers);
  if (!ch1?.name) return questState.food || [];
  if ((questState.food || []).includes(ch1.name)) return questState.food;
  return [ch1.name, ...(questState.food || [])];
}

export function geraldTollPayReaction(kind) {
  if (kind === "potatoes") return "Gerald stamps PAID IN ROOT VEGETABLES. The mountain sighs with tax efficiency.";
  return "Gerald notes your goose dispute. The goose is unhelpful. Toll waived out of spite.";
}
