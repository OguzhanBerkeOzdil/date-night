export const CONFIG = {
  fromName: "Oğuzhan",
  whatsappNumber: "",
  defaultTitle: "my lady",
  letter: [
    "Dear {name},",
    "I built a whole kingdom just to ask you a few questions. Probably too much. Definitely worth it.",
    "Thank you for today — and for the smile that made the oracle's job very easy.",
    "Wherever the next trail goes, I'd like to ride it with you.",
    "— Yours, {fromName} (and {steedName}, who insisted on being mentioned)",
  ],
};

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

/** Map HUD landmark index (0–8) per screen id */
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
