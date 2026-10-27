/** Chapter I survey — tone: silly friends, zero pressure, skippable. */

export const CHAPTER1_SURVEY_STEPS = 9;

export const CHAPTER1_QUESTIONS = [
  {
    id: "class",
    character: "Lucius the Bard",
    portrait: "assets/characters/lucius-bard.webp",
    prompt: "Every adventurer needs a class. Lucius strikes a dramatic pose with a slightly out-of-tune lute. Pick yours:",
    type: "choices",
    choices: [
      { id: "bard", label: "Bard", reaction: "Lucius weeps with joy. The lute somehow sounds worse." },
      { id: "paladin", label: "Paladin", reaction: "Noble! Lucius writes a ballad about your posture immediately." },
      { id: "ranger", label: "Ranger", reaction: "Forest-approved. Lucius adds three unnecessary bird noises." },
      { id: "druid", label: "Druid", reaction: "Mossy respect. A fern applauds somewhere offstage." },
      {
        id: "potato",
        label: "Pacifist potato farmer",
        reaction: "Respect. The potatoes fear no one.",
      },
    ],
  },
  {
    id: "weapon",
    character: "Sir Reginald the Paladin",
    portrait: "assets/characters/reginald-paladin.webp",
    prompt: "Choose your weapon. Reginald insists.",
    type: "weapon-cards",
    choices: [
      { id: "sword", label: "Sword", image: "assets/equipment/sword.webp", reaction: "Reginald nods once. Very official." },
      { id: "bow", label: "Longbow", image: "assets/equipment/longbow.webp", reaction: "Elegant range. Reginald approves from a safe distance." },
      { id: "lute", label: "Lute", image: "assets/equipment/lute.webp", reaction: "Musical warfare. Lucius cheers; Reginald sighs, deeply." },
      { id: "staff", label: "Magic staff", image: "assets/equipment/staff.webp", reaction: "Sparkly bureaucracy. The staff hums in B-flat." },
      {
        id: "pan",
        label: "Cast-iron frying pan",
        image: "assets/equipment/frying-pan.webp",
        reaction: "Breakfast AND self-defense. Efficient.",
      },
      {
        id: "pacifist",
        label: "I'm a pacifist",
        image: "assets/equipment/flower.webp",
        reaction: "A paladin of peace. Reginald is weeping into his gauntlet.",
      },
    ],
  },
  {
    id: "horseColor",
    character: "Royal herald",
    portrait: "assets/characters/goblin-herald.webp",
    prompt: "The stables heard rumors about your favorite horse color. Confirm for the royal records?",
    type: "choices",
    choices: [
      { id: "chestnut", label: "Chestnut", reaction: "Logged. A chestnut horse somewhere feels seen." },
      { id: "black", label: "Black", reaction: "Mysterious. The herald adds extra glitter." },
      { id: "white", label: "White", reaction: "Classic. Someone says \"main character energy\" and gets shushed." },
      { id: "grey", label: "Dappled grey", reaction: "Spotted approval. Very fashionable." },
      { id: "any", label: "Any horse that doesn't bite", reaction: "Reasonable policy. The herald stamps APPROVED." },
      { id: "berke", label: "I already told Berke, keep up", reaction: "Fair. Berke has been notified (he was already nodding)." },
    ],
  },
  {
    id: "song",
    character: "Lucius the Bard",
    portrait: "assets/characters/lucius-bard.webp",
    prompt: "Which song should Lucius butcher on the lute?",
    type: "choices",
    choices: [
      { id: "epic", label: "Something epic", reaction: "Lucius cracks his knuckles. The epic survives, barely." },
      { id: "tavern", label: "Tavern song", reaction: "Crowd-pleaser. Three imaginary tankards raise." },
      { id: "sad", label: "Sad elf ballad", reaction: "Beautiful misery. A nearby elf is fine with it." },
      { id: "custom", label: "Free text request", reaction: "Bold. Lucius writes it down with too much drama.", freeText: true },
      { id: "no-lute", label: "Please, no lute", reaction: "Lucius clutches his lute like it owes him money. He'll behave." },
    ],
  },
  {
    id: "census",
    character: "Royal census",
    portrait: "assets/characters/gerald-accountant.webp",
    prompt: "The royal census lists you as…",
    type: "choices",
    choices: [
      { id: "knight", label: "Wandering knight", reaction: "Filed under \"polite chaos.\"" },
      { id: "witch", label: "Forest witch", reaction: "Herbs noted. One frog salutes." },
      { id: "whisperer", label: "Horse whisperer", reaction: "The horses have already gossiped about you." },
      { id: "legend", label: "Tavern legend", reaction: "Marta nods from offstage. No details requested." },
      { id: "mystery", label: "Mysterious stranger who refuses to explain", reaction: "Mystery kept. Gerald adds a question mark sticker." },
      { id: "custom", label: "Something else", reaction: "Custom title accepted. Spellcheck declined.", freeText: true },
    ],
  },
  {
    id: "goose",
    character: "The Royal Goose",
    portrait: "assets/characters/royal-goose.webp",
    prompt: "A goose blocks the bridge. What do you do?",
    type: "choices",
    choices: [
      { id: "fight", label: "Fight", reaction: "HONK (disappointed in your choices)." },
      { id: "bribe", label: "Bribe with bread", reaction: "HONK (transaction complete)." },
      { id: "negotiate", label: "Negotiate", reaction: "HONK (counter-offer: more bread)." },
      { id: "run", label: "Run", reaction: "HONK (chase scene implied)." },
      { id: "become", label: "Become the goose", reaction: "HONK (respectfully)." },
    ],
  },
  {
    id: "gerald",
    character: "Gerald the Dragon's accountant",
    portrait: "assets/characters/gerald-accountant.webp",
    prompt: "Fair toll to cross the dragon's mountain?",
    type: "slider",
    min: 0,
    max: 1000,
    unit: "potatoes",
    reactions: [
      { max: 0, text: "Gerald writes \"generous soul\" and looks suspicious." },
      { max: 50, text: "A modest toll. Gerald stamps twice for fun." },
      { max: 200, text: "The dragon's spreadsheet smiles." },
      { max: 500, text: "Gerald upgrades you to \"premium potato tier.\"" },
      { max: 999, text: "The mountain trembles with tax efficiency." },
      { max: 1000, text: "Gerald has fainted." },
    ],
  },
  {
    id: "tavern",
    character: "Marta the Tavern Keeper",
    portrait: "assets/characters/marta-tavern.webp",
    prompt: "Pick tomorrow's tavern fuel:",
    type: "choices",
    choices: [
      { id: "stew", label: "Mystery stew (don't ask)", reaction: "Marta slides it over. No questions were harmed." },
      { id: "cocoa", label: "Hot chocolate", reaction: "Cozy. Marshmallow diplomacy achieved." },
      { id: "mead", label: "Mead", reaction: "Classic. The goblet is suspiciously shiny." },
      {
        id: "berke",
        label: "Whatever Berke is paying for",
        reaction: "Bold. Marta approves.",
      },
    ],
  },
  {
    id: "companion",
    character: "Companion registry",
    portrait: "assets/characters/sir-hoots.webp",
    prompt: "Choose your travel companion for the quest:",
    type: "choices",
    choices: [
      { id: "horse", label: "Horse", reaction: "Gerald stamps it: APPROVED, one horse." },
      { id: "cat", label: "Cat", reaction: "Judges you silently. Still coming." },
      { id: "raven", label: "Raven", reaction: "One ominous caw. Very aesthetic." },
      { id: "goose", label: "Goose (traitor — will betray you)", reaction: "HONK (traitor energy detected)." },
    ],
  },
];

export function adventurerProfileFromAnswers(answers) {
  const a = answers || {};
  const pick = (key) => a[key]?.label || a[key]?.value || "—";
  return {
    class: pick("class"),
    weapon: pick("weapon"),
    companion: pick("companion"),
  };
}
