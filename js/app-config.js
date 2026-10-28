/** Shared app constants (main quest + Eve of the Quest). */

/** After FormSubmit email activation, swap to the random alias URL FormSubmit provides. */
export const FORM_SUBMIT_ENDPOINT =
  "https://formsubmit.co/ajax/2ee0a4c67c7dbdb0028492bf48d9df9a";

/** Shown on the Quest Pass and certificate. */
export const QUEST_DATE_LABEL = "Wednesday 28 October 2026";
export const QUEST_DATE_ISO = "2026-10-28";

/** Owner-controlled release switch for Chapter II (flip to false to re-seal). */
export const CHAPTER_TWO_RELEASED = true;

/** Chapter I is finished in production; keep its screens only for archived QA/replay fixtures. */
export const CHAPTER_ONE_ARCHIVED = true;

/**
 * Background music MP3 (lazy-loaded when user enables sound).
 * Leave empty to use the built-in procedural ambience until the new track lands.
 */
export const MUSIC_SRC = "../assets/audio/quest-theme.mp3";

/** Real packing tip (edit here). */
export const PACKING_REAL_TIP =
  "Comfy shoes — the cobbles are rude to ankles and the tavern floor is sticky.";

export const FEEDBACK_HONESTY_NOTE =
  "Your answers get sent to Berke by carrier pigeon. (Fine print: it's email.)";
