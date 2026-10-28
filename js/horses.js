/** Steed breeds — art at assets/horses/<id>.webp when available. */

export const HORSE_BREEDS = [
  {
    id: "chestnut",
    coat: "Chestnut",
    personality: "Enthusiastic. Neighs at butterflies. Apologises afterward.",
    defaultName: "Clover",
    selectionLines: [
      "Excellent choice. I have already befriended three butterflies and challenged a fourth.",
      "I brought courage, enthusiasm and absolutely no indoor voice.",
    ],
    carrotLine: "CRUNCH. I would now follow you into battle, or at least toward another carrot.",
    placeholderClass: "horse-thumb--chestnut",
  },
  {
    id: "palomino",
    coat: "Palomino",
    personality: "Golden coat, flower-braided mane, main-character energy.",
    defaultName: "Sir Biscuit",
    selectionLines: [
      "Naturally. The sunlight and I have a contractual arrangement.",
      "You may ride beside me. Try not to interrupt my entrance.",
    ],
    carrotLine: "Acceptable tribute. My good side is every side, but this one now has a carrot.",
    placeholderClass: "horse-thumb--palomino",
  },
  {
    id: "dapple-grey",
    coat: "Dapple grey",
    personality: "Dapple spots plus the same braided mane — very coordinated.",
    defaultName: "Lady Hazelnut",
    selectionLines: [
      "A tasteful decision. I had prepared a disappointed stare just in case.",
      "We shall proceed elegantly and pretend the paperwork was always organised.",
    ],
    carrotLine: "The carrot is adequate. Your performance review has improved to promising.",
    placeholderClass: "horse-thumb--dapple",
  },
  {
    id: "friesian",
    coat: "Friesian",
    personality: "All black, all drama. Hair commercial in horse form.",
    defaultName: "Sir Neighs-a-Lot",
    selectionLines: [
      "At last. Cue the wind machine and lower the drawbridge slowly.",
      "I do not trot. I arrive with consequences.",
    ],
    carrotLine: "A carrot in darkness. Powerful. Symbolic. Also delicious.",
    placeholderClass: "horse-thumb--friesian",
  },
  {
    id: "appaloosa",
    coat: "Appaloosa",
    personality: "Leopard print without the fashion risk. Very smug about it.",
    defaultName: "Spotlight",
    selectionLines: [
      "You recognised quality. I knew the spots would do the negotiating.",
      "Please stand slightly behind me so the compliments reach the correct horse.",
    ],
    carrotLine: "Good. The snack matches my extremely exclusive brand partnership.",
    placeholderClass: "horse-thumb--appaloosa",
  },
  {
    id: "pinto",
    coat: "Pinto",
    personality: "Two-tone paint, braided mane — the goblin calls it 'festive'.",
    defaultName: "Patches",
    selectionLines: [
      "I am two colours because one could not contain the nonsense.",
      "Do you know where we are going? Wonderful. Neither do I.",
    ],
    carrotLine: "CARROT! I mean… thank you. I remained dignified for almost four seconds.",
    placeholderClass: "horse-thumb--pinto",
  },
  {
    id: "buckskin",
    coat: "Buckskin",
    personality: "Sunny buckskin, braided mane, practical snack policy.",
    defaultName: "Honey",
    selectionLines: [
      "Before departure: route, weather, emergency snacks, backup emergency snacks.",
      "A sound choice. I have packed a spreadsheet and eaten half of it.",
    ],
    carrotLine: "Supplies received. Inventory updated. One carrot mysteriously missing.",
    placeholderClass: "horse-thumb--buckskin",
  },
  {
    id: "bay",
    coat: "Bay",
    personality: "Classic knight-horse vibes. Judgmental in a fond way.",
    defaultName: "Bramble",
    placeholderClass: "horse-thumb--bay",
  },
  {
    id: "roan",
    coat: "Blue roan",
    personality: "Mysterious flecks. Pretends not to love attention.",
    defaultName: "Mist",
    placeholderClass: "horse-thumb--roan",
  },
  {
    id: "definitely-a-horse",
    coat: "Definitely a horse",
    personality: "White coat, lilac mane, tiny horn. Certified 100% horse.",
    defaultName: "Definitely A Horse",
    selectionLines: [
      "Correct. A normal horse. Please ignore the horn-shaped administrative error.",
      "I possess no magic whatsoever. That sparkle was unrelated and legally ambiguous.",
    ],
    carrotLine: "The carrot has vanished through ordinary chewing. No enchantment occurred.",
    placeholderClass: "horse-thumb--unicorn",
  },
];

/** Breeds with dedicated art under assets/horses/<id>.webp */
export const HORSE_ART_IDS = new Set([
  "chestnut",
  "palomino",
  "dapple-grey",
  "friesian",
  "appaloosa",
  "pinto",
  "buckskin",
  "definitely-a-horse",
]);

/** Chapter II steed picker — breeds with art only (no Bay / Blue roan). */
export const HORSE_SELECTABLE_IDS = HORSE_ART_IDS;

export function selectableHorseBreeds() {
  return HORSE_BREEDS.filter((breed) => HORSE_SELECTABLE_IDS.has(breed.id));
}

export function horseHasArt(id) {
  return HORSE_ART_IDS.has(id);
}

export function horseById(id) {
  return HORSE_BREEDS.find((h) => h.id === id) || HORSE_BREEDS[0];
}

export function horseImageUrl(id) {
  return `assets/horses/${id}.webp`;
}

export function horseFedImageUrl(id) {
  return `assets/horses/fed/${id}.webp`;
}

export const HORSE_PLACEHOLDER_SRC = "assets/images/horse-idle.webp";
