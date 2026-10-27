export { APP_CACHE_VERSION } from "./cache-version.js";

import {
  BARD_LINES,
  CLOVER_EPIGRAPH,
  DRAGON_FOOL_QUOTE,
  EPIGRAPHS,
  LOADING_STEPS,
  NO_LABELS,
  STEED_PICK_LINES,
  TAROT_FORTUNES,
  YES_TOASTS,
} from "./copy-data.js";

export const CONFIG = {
  fromName: "Oğuzhan",
  whatsappNumber: "",
  defaultTitle: "my lady",
  letter: [
    "Dear {name},",
    "Thanks for opening round two of this very extra scroll. A bit much? Yes. Still funny? I hope so.",
    "Today was a good quest. The horse has notes. The dragon lost an argument. I'd call that a win.",
    "Nothing in here comes with pressure — an honest \"nay\" is a valid ending, and the log still saves.",
    "If you're up for another ride, tavern stop, or potion-tasting experiment, I'm in.",
    "— {fromName}, part-time knight & snack carrier ({steedName} asked to be cc'd)",
  ],
};

export const COPY = {
  epigraphs: EPIGRAPHS,
  cloverEpigraph: CLOVER_EPIGRAPH,
  bardLines: BARD_LINES,
  tarotFortunes: TAROT_FORTUNES,
  noLabels: NO_LABELS,
  loadingSteps: LOADING_STEPS,
  yesToasts: YES_TOASTS,
  steedPickLines: STEED_PICK_LINES,
  dragonFoolQuote: DRAGON_FOOL_QUOTE,
  steedWhispererLine: "Okay, you're officially my favourite human. Don't tell him.",
  steedCarrotLine: "*crunch* …I would follow you into any forest now.",
  benedickQuip: "I would my horse had the speed of your tongue.",
};

export function tarotForKey(key) {
  return COPY.tarotFortunes[key] || null;
}

export const SCREENS = [
  "title",
  "summons",
  "steed",
  "sheet",
  "rating",
  "journal",
  "dragon",
  "tavern",
  "potion",
  "stars",
  "oracle",
  "decree",
];

export const MAP_NODE = {
  title: 0,
  summons: 0,
  steed: 1,
  sheet: 2,
  rating: 2,
  journal: 2,
  dragon: 3,
  tavern: 4,
  potion: 5,
  stars: 6,
  oracle: 7,
  decree: 8,
  "honest-no": 3,
};

export const BG_BY_SCREEN = {
  title: "bg-title",
  summons: "bg-forest",
  steed: "bg-meadow-stable",
  sheet: "bg-meadow-stable",
  rating: "bg-meadow-stable",
  journal: "bg-meadow-stable",
  dragon: "bg-meadow-stable",
  tavern: "bg-tavern",
  potion: "bg-cauldron",
  stars: "bg-starry-hill",
  oracle: "bg-starry-hill",
  decree: "bg-celebration",
  "honest-no": "bg-forest",
};
