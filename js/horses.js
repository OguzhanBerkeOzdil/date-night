/** Steed breeds — art at assets/horses/<id>.webp when available. */

export const HORSE_BREEDS = [
  {
    id: "chestnut",
    coat: "Chestnut",
    personality: "Enthusiastic. Neighs at butterflies. Apologises afterward.",
    defaultName: "Clover",
    placeholderClass: "horse-thumb--chestnut",
  },
  {
    id: "palomino",
    coat: "Palomino",
    personality: "Golden coat, flower-braided mane, main-character energy.",
    defaultName: "Sir Biscuit",
    placeholderClass: "horse-thumb--palomino",
  },
  {
    id: "dapple-grey",
    coat: "Dapple grey",
    personality: "Dapple spots plus the same braided mane — very coordinated.",
    defaultName: "Lady Hazelnut",
    placeholderClass: "horse-thumb--dapple",
  },
  {
    id: "friesian",
    coat: "Friesian",
    personality: "All black, all drama. Hair commercial in horse form.",
    defaultName: "Sir Neighs-a-Lot",
    placeholderClass: "horse-thumb--friesian",
  },
  {
    id: "appaloosa",
    coat: "Appaloosa",
    personality: "Leopard print without the fashion risk. Very smug about it.",
    defaultName: "Spotlight",
    placeholderClass: "horse-thumb--appaloosa",
  },
  {
    id: "pinto",
    coat: "Pinto",
    personality: "Two-tone paint, braided mane — the goblin calls it 'festive'.",
    defaultName: "Patches",
    placeholderClass: "horse-thumb--pinto",
  },
  {
    id: "buckskin",
    coat: "Buckskin",
    personality: "Sunny buckskin, braided mane, practical snack policy.",
    defaultName: "Honey",
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

export const HORSE_PLACEHOLDER_SRC = "assets/images/horse-idle.webp";
