import { PACKING_REAL_TIP } from "../app-config.js";

export const OWL_INTRO = "Hoot! Who goes there? State your name for the night watch.";

export function owlWelcome(name) {
  return `Hoot hoot, ${name}. The scroll says you're cleared for tomorrow. Try not to wake the dragon early.`;
}

export const EXCITEMENT_TIERS = [
  { max: 1, text: "Mildly curious — respectable. The realm approves of pacing yourself." },
  { max: 2, text: "Interested — good. The horse has been notified (it asked)." },
  { max: 3, text: "Pretty excited — the goblin herald is already polishing his trumpet." },
  { max: 4, text: "Very excited — please don't sprint in the courtyard before noon." },
  { max: 5, text: "Already packed — legendary. Did you pack snacks? Always pack snacks." },
];

export const HERALD_QUESTIONS = [
  {
    id: "snacks",
    prompt: "Snacks for tomorrow:",
    choices: [
      { id: "essential", label: "Essential" },
      { id: "very", label: "Very essential" },
      { id: "triple", label: "I brought a spare snack for the snack" },
    ],
    reactions: {
      essential: "Correct. The council votes snack-positive.",
      very: "Correct, but louder. The goblin respects it.",
      triple: "You're hired as Chief Snack Officer. Unpaid.",
    },
  },
  {
    id: "weather",
    prompt: "If it rains tomorrow:",
    choices: [
      { id: "cloak", label: "Cloak and carry on" },
      { id: "tavern", label: "Tavern detour" },
      { id: "puddles", label: "Puddles are mini lakes" },
    ],
    reactions: {
      cloak: "Classic adventurer answer. Cloak salesmen cheer.",
      tavern: "The tavern sends its regards (and a menu).",
      puddles: "Hydrology is a mindset. Approved.",
    },
  },
  {
    id: "quest-mood",
    prompt: "Tomorrow's vibe should be:",
    choices: [
      { id: "laugh", label: "More laughing than looting" },
      { id: "walk", label: "Long walk, short agenda" },
      { id: "surprise", label: "Surprise me (within reason)" },
    ],
    reactions: {
      laugh: "Comedy guild stamps your pass. No fee.",
      walk: "The forest nods. So do the feet.",
      surprise: "Reason noted. The goblin writes that down twice.",
    },
  },
];

export const PACKING_ITEMS = [
  { id: "cloak", label: "A cloak (for drama)", joke: true },
  { id: "snacks", label: "Emergency snacks", joke: true },
  { id: "coin", label: "One gold coin for the bard (optional)", joke: true },
  { id: "smile", label: "A willingness to roll with the bit", joke: true },
  { id: "shoes", label: PACKING_REAL_TIP, joke: false },
];

export const PASS_TITLE = "Summoned for tomorrow's quest";
export const PASS_CLOSING = "See you tomorrow, adventurer.";

export const HONEST_EXIT_LABEL = "Not today / maybe another time";
export const HONEST_EXIT_BODY =
  "Totally fair. No guilt, no side-eye from the owl. The gate stays open if you change your mind.";
