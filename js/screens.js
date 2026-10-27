import { CONFIG, COPY, tarotForKey } from "./config.js";
import { unlock } from "./achievements.js";
import {
  duckMusic,
  isSoundOn,
  playHorn,
  playNeigh,
  playStamp,
  setSoundOn,
  startAmbience,
  unlockAudio,
  vibrate,
} from "./audio.js";
import { say, setSteedName, setPortrait, attachSteedDialogue } from "./dialogue.js";
import { hydrateLazyImages } from "./image-utils.js";
import { iconFood } from "./icons.js";
import { burstHearts, boostEmbers } from "./particles.js";
import { downloadCertificatePng } from "./certificate.js";
import {
  buildCompletionText,
  buildSummaryText,
  downloadDecreePng,
  shareDecree,
} from "./decree.js";
import {
  HORSE_BREEDS,
  horseById,
  horseImageUrl,
  horseHasArt,
  HORSE_PLACEHOLDER_SRC,
} from "./horses.js";
import { initEvePrelude, onEnterEve, syncEveHonestButton } from "./eve-prelude.js";
import { submitFeedback } from "./feedback.js";
import { RUNTIME_CONFIG } from "./runtime-config.js";
import { APP_CACHE_VERSION } from "./cache-version.js";
import { updateEpigraph } from "./epigraph.js";
import { syncContinueButton } from "./app-chrome.js";
import { showNewQuestConfirm, showUndoToast } from "./ui-feedback.js";
import { chapterTwoIsAvailable, formatQuestDate } from "./quest-date.js";
import { queueQuestSync } from "./sync.js";
import {
  guest,
  questOfTitle,
  letterSalutation,
  beginNewQuest,
  clearPendingUndo,
  hasQuestSave,
  saveState,
  state,
  undoLastNewQuest,
} from "./state.js";

const FOOD = [
  { id: "pizza", name: "Pizza", line: "A dependable classic with heroic cheese" },
  { id: "sushi", name: "Sushi", line: "Tiny provisions from a faraway kingdom" },
  { id: "burger", name: "Burgers & fries", line: "The traditional tavern feast" },
  { id: "pasta", name: "Pasta", line: "Comfort food with optional dramatic twirling" },
  { id: "taco", name: "Tacos", line: "Portable provisions for wandering" },
  { id: "brunch", name: "Brunch", line: "A respectable excuse for second breakfast" },
  { id: "street", name: "Street food", line: "Choose while exploring the market" },
  { id: "dessert", name: "Just dessert", line: "Skip directly to the useful part" },
  { id: "surprise", name: "Surprise me", line: "Trust the innkeeper within reason" },
];

const JOURNAL = [
  "A relaxed walk with good conversation",
  "A small adventure with a plot twist",
  "A cosy plan with excellent snacks",
  "Friendly chaos and questionable jokes",
  "A place neither of us has tried",
  "A simple plan with room to improvise",
];

const INGREDIENTS = [
  { label: "Mane of a galloping steed", act: "Horse riding" },
  { label: "Moss from the old forest", act: "Nature walk + picnic" },
  { label: "A banner from the castle fair", act: "Castle or museum visit" },
  { label: "A cosy controller rune", act: "Game night" },
  { label: "Popcorn of the silver screen", act: "Movie night" },
  { label: "A drop of sunset", act: "Sunset walk + coffee" },
  { label: "Clay from the potter's wheel", act: "Painting or pottery" },
  { label: "A brave bard's microphone", act: "Karaoke" },
  { label: "A blanket from the hearth", act: "Cosy night in" },
];

const BASES = [
  { name: "Hearth Ember", color: "#e8a04a" },
  { name: "Wild Rose", color: "#e88aa8" },
  { name: "Chaos Fizz", color: "#5ec4b8" },
  { name: "Moonlight Dew", color: "#b8a8e8" },
  { name: "Wild Sap", color: "#7cb86a" },
];

const CLASSES = [
  { title: "Ranger of the Wildwood", desc: "Finds hidden paths and befriends every animal." },
  { title: "Moonlit Healer", desc: "Fixes bad days with calm and excellent timing." },
  { title: "Wandering Bard", desc: "Carries the playlist and suspiciously specific jokes." },
  { title: "Knight of the Wildflowers", desc: "Defends the party and shares most of the fries." },
];

let navigate;
let stirCount = 0;
let potionBottled = false;
let letterStarted = false;
let sealing = false;
let pickSteedIx = 0;

const MAIN_QUEST_SCREENS = new Set([
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
]);

function $(id) {
  return document.getElementById(id);
}

function show(el) {
  if (!el) return;
  el.classList.remove("hidden");
  el.removeAttribute("hidden");
}

function hide(el) {
  if (!el) return;
  el.classList.add("hidden");
  el.setAttribute("hidden", "");
}

function selectChip(root, chosen) {
  root?.querySelectorAll(".chip-select").forEach((button) => {
    button.classList.toggle("chip-select--on", button === chosen);
    button.setAttribute("aria-pressed", String(button === chosen));
  });
}

function formatPickerDate(iso) {
  if (!iso) return "";
  try {
    return new Date(`${iso}T12:00:00`).toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  } catch {
    return iso;
  }
}

function resetQuestSessionFlags() {
  stirCount = 0;
  potionBottled = false;
  letterStarted = false;
  sealing = false;
  pickSteedIx = 0;
}

export function chapterTwoAvailable() {
  return chapterTwoIsAvailable({
    scheduledDate: state.scheduledDate,
    timeZone: state.timeZone,
  });
}

export function resumeTarget() {
  if (state.chapter === "declined" || state.honestNo) return "honest-no";
  if (state.chapterTwoComplete) return "decree";
  if (state.chapterTwoStarted) {
    return MAIN_QUEST_SCREENS.has(state.lastScreen) ? state.lastScreen : "summons";
  }
  if (state.chapterOneComplete) return chapterTwoAvailable() ? "chapter-two-start" : "chapter-lock";
  if (!state.eveComplete) {
    const eveScreens = ["eve-gate", "eve-excitement", "eve-herald", "eve-packing", "eve-pass"];
    if (eveScreens.includes(state.lastScreen)) return state.lastScreen;
    return "eve-gate";
  }
  return state.lastScreen && state.lastScreen !== "title" ? state.lastScreen : "summons";
}

function startFreshQuestWithUndo() {
  const hadSave = hasQuestSave();
  beginNewQuest();
  resetQuestSessionFlags();
  unlockAudio();
  if (isSoundOn()) {
    startAmbience();
    playHorn();
  }
  navigate("eve-gate");
  if (hadSave) {
    showUndoToast(
      "Quest reset — progress cleared.",
      () => {
        if (undoLastNewQuest()) {
          navigate(resumeTarget());
          syncContinueButton();
        }
      },
      { onExpire: clearPendingUndo }
    );
  } else {
    syncContinueButton();
  }
}

function requestFreshQuestStart() {
  if (hasQuestSave()) {
    showNewQuestConfirm({ onKeep: () => undefined, onStartOver: startFreshQuestWithUndo });
  } else {
    startFreshQuestWithUndo();
  }
}

function initTitle() {
  $("btnNewGame")?.addEventListener("click", requestFreshQuestStart);
  $("btnContinue")?.addEventListener("click", () => {
    unlockAudio();
    if (isSoundOn()) startAmbience();
    navigate(resumeTarget());
  });
  $("btnSoundTitle")?.addEventListener("click", () => {
    setSoundOn(!isSoundOn());
    $("btnSoundTitle").textContent = isSoundOn() ? "♪ Sound: On" : "♪ Sound: Off";
  });
}

function initSummons() {
  const sealBtn = $("waxSealBtn");
  const sealArt = $("waxSealArt");
  const breakSeal = () => {
    if (sealBtn?.classList.contains("cracked")) return;
    sealBtn?.classList.add("cracked");
    sealArt?.classList.add("cracked");
    unlock("seal");
    show($("loadingQuest"));
    const fill = $("loadingFill");
    const text = $("loadingText");
    let index = 0;
    const tick = () => {
      const step = COPY.loadingSteps[index++];
      if (!step) {
        show($("btnSummonBegin"));
        return;
      }
      if (fill) fill.style.width = `${step.p}%`;
      if (text) text.textContent = step.t;
      window.setTimeout(tick, 360);
    };
    tick();
  };
  sealBtn?.addEventListener("click", breakSeal);
  $("btnSummonBegin")?.addEventListener("click", () => navigate("steed"));
}

function renderAffection() {
  const el = $("affectionBar");
  if (el) el.textContent = "♡".repeat(5 - state.affection) + "♥".repeat(state.affection);
}

function applyHorseImg(img, horseId, { lazy = false, variant = "cutout" } = {}) {
  const breed = horseById(horseId);
  const useArt = horseHasArt(horseId);
  const isThumb = variant === "thumb";
  const thumbClass = "horse-breed-card__img";
  const setCutoutClass = () => {
    img.className = `horse-cutout ${breed.placeholderClass || ""}`.trim();
  };
  const setClass = () => {
    if (isThumb) img.className = thumbClass;
    else setCutoutClass();
  };
  if (lazy) {
    img.loading = "lazy";
    img.decoding = "async";
  } else {
    img.loading = "eager";
    img.decoding = "async";
  }
  img.onerror = () => {
    img.onerror = null;
    img.src = HORSE_PLACEHOLDER_SRC;
    setClass();
  };
  img.onload = () => {
    if (isThumb) {
      img.className = thumbClass;
      return;
    }
    if (img.src.includes("/horses/") && useArt) img.className = "horse-cutout";
    else setCutoutClass();
  };
  img.src = useArt ? horseImageUrl(horseId) : HORSE_PLACEHOLDER_SRC;
  if (!useArt) setClass();
}

function setHorsePreview(horseId) {
  const img = $("horseIdleImg");
  if (!img) return;
  applyHorseImg(img, horseId, { lazy: false });
  const pers = $("horsePersonality");
  if (pers) pers.textContent = horseById(horseId).personality;
}

function renderHorseBreedGrid() {
  const grid = $("horseBreedGrid");
  if (!grid || grid.dataset.rendered) return;
  grid.dataset.rendered = "1";
  HORSE_BREEDS.forEach((breed) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "horse-breed-card";
    btn.setAttribute("role", "option");
    btn.setAttribute("aria-selected", breed.id === state.horseId ? "true" : "false");
    btn.dataset.horseId = breed.id;
    const thumb = document.createElement("img");
    thumb.className = "horse-breed-card__img";
    thumb.alt = "";
    applyHorseImg(thumb, breed.id, { lazy: true, variant: "thumb" });
    const label = document.createElement("span");
    label.className = "horse-breed-card__label";
    label.textContent = breed.coat;
    btn.append(thumb, label);
    btn.addEventListener("click", () => pickHorseBreed(breed.id));
    grid.appendChild(btn);
  });
}

function pickHorseBreed(id) {
  state.horseId = id;
  saveState();
  setHorsePreview(id);
  document.querySelectorAll(".horse-breed-card").forEach((el) => {
    el.setAttribute("aria-selected", el.dataset.horseId === id ? "true" : "false");
  });
  const breed = horseById(id);
  if (state.steedName === "Clover" || HORSE_BREEDS.some((h) => h.defaultName === state.steedName)) {
    state.steedName = breed.defaultName;
    saveState();
    setSteedName(state.steedName);
  }
}

function pickSteed(name) {
  state.steedName = name;
  saveState();
  setSteedName(name);
  updateEpigraph("steed");
  const line = COPY.steedPickLines[pickSteedIx++ % COPY.steedPickLines.length].replace(/\{name\}/g, name);
  say([line, COPY.benedickQuip]);
}

function initSteed() {
  renderHorseBreedGrid();
  setHorsePreview(state.horseId || "chestnut");
  renderAffection();
  $("horseIdle")?.addEventListener("click", () => {
    if (state.affection >= 5) return;
    state.affection += 1;
    saveState();
    renderAffection();
    const horse = $("horseIdle");
    horse?.classList.add("horse-pet");
    window.setTimeout(() => horse?.classList.remove("horse-pet"), 300);
    if (horse) burstHearts(horse.getBoundingClientRect().x + 80, horse.getBoundingClientRect().y + 40);
    if (state.affection >= 5) {
      unlock("whisperer");
      say([COPY.steedWhispererLine]);
    }
  });
  $("carrotBtn")?.addEventListener("click", () => {
    state.affection = 5;
    state.fed = true;
    saveState();
    renderAffection();
    $("horseIdleImg").src = "assets/images/horse-munch.webp";
    unlock("snack");
    playNeigh();
    say([COPY.steedCarrotLine]);
  });
  document.querySelectorAll("[data-steed-name]").forEach((button) => {
    button.addEventListener("click", () => {
      if (button.dataset.steedName === "custom") show($("customSteedWrap"));
      else pickSteed(button.dataset.steedName);
    });
  });
  $("customSteedInput")?.addEventListener("change", (event) => {
    const value = event.target.value.trim().slice(0, 16);
    if (value) pickSteed(value);
  });
  $("btnSteedNext")?.addEventListener("click", () => navigate("sheet"));
}

export function onEnterSteed() {
  attachSteedDialogue();
  const hid = state.horseId || "chestnut";
  setPortrait(horseHasArt(hid) ? horseImageUrl(hid) : HORSE_PLACEHOLDER_SRC);
  setHorsePreview(hid);
  setSteedName(state.steedName);
  say([
    `*soft neigh* Oh! You must be ${questOfTitle()}. I've heard a responsibly small amount about you.`,
    "I'm your steed for this quest. A head scratch is optional but politically wise.",
  ]);
}

function initSheet() {
  const grid = $("classPick");
  if (grid) {
    grid.innerHTML = CLASSES.map(
      (item) => `<button type="button" data-class="${item.title}"><strong>${item.title}</strong><em>${item.desc}</em></button>`
    ).join("");
  }
  $("btnRoll")?.addEventListener("click", () => {
    show($("d20Result"));
    $("d20Result").textContent = "Natural 20. The dice appear professionally biased.";
    unlock("charm");
    const stats = $("statList");
    if (stats && !stats.dataset.rolled) {
      stats.dataset.rolled = "1";
      const rows = [
        ["Curiosity", "98", "Opened a mysterious link."],
        ["Humour", "96", "Tolerates medieval paperwork."],
        ["Horse diplomacy", "S-rank", `Certified by ${state.steedName}.`],
        ["Courage", "95", "Still reading. Impressive."],
      ];
      stats.innerHTML = rows.map(([key, value, note]) => `<div class="stat-row"><span>${key}</span><strong>${value}</strong><em>${note}</em></div>`).join("");
    }
    show(grid);
  });
  grid?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-class]");
    if (!button) return;
    state.steedClass = button.dataset.class;
    saveState();
    selectChip(grid, button);
    $("classChosen").textContent = `Class chosen: ${state.steedClass}.`;
    show($("btnSheetNext"));
  });
  $("btnSheetNext")?.addEventListener("click", () => navigate("rating"));
}

function initRating() {
  const slider = $("ratingSlider");
  const captions = {
    1: "Very calm: short plan, plenty of breathing room.",
    2: "Easy pace: one plan and a reliable snack.",
    3: "Balanced: room for fun and a snack break.",
    4: "Adventurous: a little surprise is welcome.",
    5: "Full quest energy: the horse packed extra courage.",
  };
  show($("ratingChipsField"));
  show($("ratingChipLead"));
  slider?.addEventListener("input", () => {
    state.rating = Number(slider.value);
    $("ratingValue").textContent = slider.value;
    $("ratingCaption").textContent = captions[slider.value];
    saveState();
  });
  $("ratingChips")?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-rating-chip]");
    if (!button) return;
    state.ratingChip = button.dataset.ratingChip;
    selectChip($("ratingChips"), button);
    saveState();
  });
  $("btnRatingNext")?.addEventListener("click", () => navigate("journal"));
}

function initJournal() {
  const list = $("journalList");
  JOURNAL.forEach((label) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "journal-entry";
    button.textContent = label;
    button.addEventListener("click", () => {
      state.todayVibe = label;
      saveState();
      button.classList.add("journal-entry--stamped");
      window.setTimeout(() => navigate("dragon"), 450);
    });
    list?.appendChild(button);
  });
}

function acceptQuest(answer) {
  state.dragonChoice = answer;
  state.consentShared = true;
  if (answer === "no") {
    state.honestNo = true;
    state.chapter = "declined";
    saveState();
    queueQuestSync({ immediate: true });
    navigate("honest-no");
    return;
  }
  state.chapter = "chapter-two-active";
  saveState();
  queueQuestSync({ immediate: true });
  $("dragonImg").src = "assets/images/dragon-befriended.webp";
  $("horseQuestImg").src = "assets/images/horse-rear.webp";
  unlock("dragon");
  vibrate([40, 30, 80]);
  show($("yesToast"));
  window.setTimeout(() => navigate("tavern"), 500);
}

function initDragon() {
  $("btnYes")?.addEventListener("click", () => acceptQuest("yes"));
  $("btnMaybe")?.addEventListener("click", () => acceptQuest("maybe"));
  $("btnNo")?.addEventListener("click", () => acceptQuest("no"));
}

function initHonest() {
  $("btnHonestContinue")?.addEventListener("click", () => navigate("title"));
}

function initTavern() {
  const menu = $("tavernMenu");
  FOOD.forEach((item) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "menu-item";
    button.innerHTML = `${iconFood(item.id)}<div><strong>${item.name}</strong><em>${item.line}</em></div>`;
    button.addEventListener("click", () => {
      button.classList.toggle("menu-item--on");
      state.food = state.food.includes(item.name)
        ? state.food.filter((name) => name !== item.name)
        : [...state.food, item.name];
      saveState();
    });
    menu?.appendChild(button);
  });
  $("fanumTax")?.addEventListener("change", () => {
    state.fanumTax = $("fanumTax").checked;
    saveState();
  });
  $("btnTavernNext")?.addEventListener("click", () => {
    if ($("fanumTax")?.checked) unlock("fanum");
    navigate("potion");
  });
}

function activityEssence(activity) {
  const words = activity.split(/[+ ]/).filter(Boolean);
  return words.slice(0, 2).join(" ") || "Adventure";
}

function buildPotionName() {
  const base = state.potionBase || "Moonlight Dew";
  const essences = state.activities.slice(0, 2).map(activityEssence);
  return essences.length ? `Elixir of ${base} & ${essences.join(" + ")}` : `Elixir of ${base}`;
}

function initPotion() {
  const ingredients = $("potionIngredients");
  INGREDIENTS.forEach((item) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "potion-ing";
    button.innerHTML = `<strong>${item.label}</strong><em>${item.act}</em>`;
    button.addEventListener("click", () => {
      button.classList.toggle("potion-ing--on");
      state.activities = state.activities.includes(item.act)
        ? state.activities.filter((activity) => activity !== item.act)
        : [...state.activities, item.act];
      saveState();
    });
    ingredients?.appendChild(button);
  });
  const bases = $("potionBases");
  BASES.forEach((base) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "vial";
    button.style.setProperty("--vial-color", base.color);
    button.textContent = base.name;
    button.addEventListener("click", () => {
      state.potionBase = base.name;
      state.vibe = base.name;
      document.querySelectorAll(".vial").forEach((vial) => vial.classList.remove("vial--on"));
      button.classList.add("vial--on");
      $("cauldronGlow")?.style.setProperty("--glow-color", base.color);
      saveState();
    });
    bases?.appendChild(button);
  });
  $("notesInput")?.addEventListener("input", (event) => {
    state.notes = event.target.value.trim();
    saveState();
  });
  $("btnStir")?.addEventListener("click", () => {
    if (potionBottled) {
      navigate("stars");
      return;
    }
    stirCount += 1;
    if (stirCount < 3) {
      $("btnStir").textContent = `Stir (${stirCount}/3)`;
      return;
    }
    state.potionName = buildPotionName();
    potionBottled = true;
    unlock("alchemist");
    $("potionResult").textContent = `${state.potionName}. Possible side effects: giggling and stolen fries.`;
    show($("potionResult"));
    $("btnStir").textContent = "Bottle it and continue";
    saveState();
  });
}

function initStars() {
  const dateLabel = formatQuestDate(state.scheduledDate, state.timeZone);
  const days = [`Today — ${dateLabel}`, "Another day", "Consult the calendar"];
  const dayWrap = $("dayChips");
  days.forEach((label, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "chip-select";
    button.textContent = label;
    button.addEventListener("click", () => {
      if (index === 2) {
        show($("datePicker"));
        return;
      }
      state.day = label;
      selectChip(dayWrap, button);
      saveState();
    });
    dayWrap?.appendChild(button);
  });
  $("datePicker")?.addEventListener("change", (event) => {
    state.day = formatPickerDate(event.target.value);
    saveState();
  });
  const times = ["Afternoon", "Golden hour", "Evening stars", "Flexible — decide together"];
  const sky = $("skyDial");
  times.forEach((time) => {
    const option = document.createElement("option");
    option.value = time;
    option.textContent = time;
    sky?.appendChild(option);
  });
  if (sky) sky.value = times.includes(state.time) ? state.time : "Evening stars";
  sky?.addEventListener("input", () => {
    state.time = sky.value;
    saveState();
  });
  $("btnCoin")?.addEventListener("click", () => {
    unlock("fate");
    show($("coinMsg"));
  });
  $("btnSealDate")?.addEventListener("click", () => {
    if (sealing) return;
    sealing = true;
    if (!state.day) state.day = `Today — ${dateLabel}`;
    if (!state.time) state.time = sky?.value || "Evening stars";
    saveState();
    show($("bookingCountdown"));
    window.setTimeout(() => {
      sealing = false;
      navigate("oracle");
    }, 650);
  });
}

export function restoreOracleFromState() {
  if (!state.tarotKey) return;
  const meta = tarotForKey(state.tarotKey);
  document.querySelectorAll(".tarot-card").forEach((card) => card.classList.add("flipped"));
  document.querySelector(`.tarot-card[data-card="${state.tarotKey}"]`)?.classList.add("tarot-card--chosen");
  if (meta) {
    $("tarotFortune").textContent = meta.long;
    show($("tarotFortune"));
  }
  show($("btnOpenLetter"));
}

function typeLetter() {
  const el = $("letterBody");
  const full = CONFIG.letter
    .map((paragraph) => paragraph
      .replace(/^Dear \{name\},$/, letterSalutation())
      .replace("{name}", guest.isLady ? guest.formal : "my lady")
      .replace("{fromName}", CONFIG.fromName)
      .replace("{steedName}", state.steedName))
    .join("\n\n");
  let index = 0;
  el.textContent = "";
  const interval = window.setInterval(() => {
    el.textContent = full.slice(0, ++index);
    if (index >= full.length) window.clearInterval(interval);
  }, 18);
  el.addEventListener("click", () => {
    el.textContent = full;
    window.clearInterval(interval);
  }, { once: true });
}

function initOracle() {
  document.querySelectorAll(".tarot-card").forEach((card) => {
    card.addEventListener("click", () => {
      if (state.tarotKey) return;
      const meta = tarotForKey(card.dataset.card);
      state.tarotKey = card.dataset.card;
      state.tarotCard = meta?.title || card.dataset.card;
      saveState();
      unlock("fortune");
      restoreOracleFromState();
    });
  });
  $("btnOpenLetter")?.addEventListener("click", () => {
    if (letterStarted) return;
    letterStarted = true;
    show($("letterPanel"));
    duckMusic(true);
    typeLetter();
    show($("btnToDecree"));
  });
  $("btnToDecree")?.addEventListener("click", () => {
    duckMusic(false);
    navigate("decree");
  });
}

async function copyText(text, preview, toast) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const range = document.createRange();
    range.selectNodeContents(preview);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  }
  show(toast);
  window.setTimeout(() => hide(toast), 1800);
}

function openChapterTwo() {
  navigate(chapterTwoAvailable() ? "chapter-two-start" : "chapter-lock");
}

function reportMainFeedback() {
  if (RUNTIME_CONFIG.questApiUrl) return;
  submitFeedback({
    _subject: "Quest answers",
    idempotencyId: `main-${guest.formal || "guest"}-decree-${APP_CACHE_VERSION}`,
    part: "main",
    name: guest.formal || guest.display,
    excitement: "",
    choices: JSON.stringify({
      rating: state.rating,
      food: state.food,
      activities: state.activities,
      tarot: state.tarotKey,
    }),
    horse: state.horseId || "",
    steedName: state.steedName || "",
    date: state.day || "",
    timestamp: new Date().toISOString(),
    outcome: "decree",
  });
}

function initDecree() {
  $("btnShare")?.addEventListener("click", () => shareDecree("pass"));
  $("btnSavePng")?.addEventListener("click", () => downloadDecreePng("pass"));
  $("btnSaveCertificate")?.addEventListener("click", () => downloadCertificatePng());
  $("btnCopy")?.addEventListener("click", async () => {
    const text = buildSummaryText("pass");
    const toast = $("copyToast");
    let copied = false;
    try {
      await navigator.clipboard.writeText(text);
      copied = true;
    } catch {
      const pre = $("decreePreview");
      if (pre) {
        const range = document.createRange();
        range.selectNodeContents(pre);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    }
    if (toast) {
      toast.textContent = copied ? "Copied!" : "Select the decree text and copy manually";
      show(toast);
      window.setTimeout(() => hide(toast), 2000);
    }
  });
  $("btnReplay")?.addEventListener("click", requestFreshQuestStart);
}

function initChapterLock() {
  $("btnTryChapterTwo")?.addEventListener("click", openChapterTwo);
  $("btnBackToPass")?.addEventListener("click", () => navigate("eve-pass"));
}

function renderRecap() {
  const rows = [
    ["Adventurer", state.eveAdventurerName || guest.formal || "Guest"],
    ["Excitement", `${state.eveExcitement || 3}/5`],
    ["Status", "Invitation accepted · horse notified"],
  ];
  $("questRecap").innerHTML = rows.map(([label, value]) => `<div class="quest-recap__item"><span>${label}</span><strong>${value}</strong></div>`).join("");
}

function initChapterTwo() {
  $("btnStartAdventure")?.addEventListener("click", () => {
    state.chapter = "chapter-two-active";
    state.chapterTwoStarted = true;
    saveState();
    queueQuestSync({ immediate: true });
    navigate("summons");
  });
  $("btnFinishQuest")?.addEventListener("click", () => navigate("chapter-two-finish"));
  $("favoriteMoment")?.addEventListener("input", (event) => {
    state.favoriteMoment = event.target.value.trim();
    saveState();
  });
  $("questBadges")?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-badge]");
    if (!button) return;
    state.questBadge = button.dataset.badge;
    selectChip($("questBadges"), button);
    saveState();
  });
  $("futureQuestChoices")?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-future]");
    if (!button) return;
    state.futureQuest = button.dataset.future;
    selectChip($("futureQuestChoices"), button);
    hide($("futureQuestError"));
    saveState();
  });
  $("btnCompleteQuest")?.addEventListener("click", () => {
    if (!state.futureQuest) {
      show($("futureQuestError"));
      $("futureQuestChoices")?.querySelector("button")?.focus();
      return;
    }
    state.chapter = "complete";
    state.chapterTwoComplete = true;
    saveState();
    queueQuestSync({ immediate: true });
    navigate("quest-complete");
  });
  $("btnShareFinal")?.addEventListener("click", () => shareDecree("completion"));
  $("btnSaveFinal")?.addEventListener("click", () => downloadDecreePng("completion"));
  $("btnCopyFinal")?.addEventListener("click", () => copyText(buildCompletionText(), $("finalPreview"), $("finalCopyToast")));
}

function restoreSelections() {
  document.querySelectorAll("[data-rating-chip]").forEach((button) => {
    button.classList.toggle("chip-select--on", button.dataset.ratingChip === state.ratingChip);
  });
  document.querySelectorAll(".menu-item").forEach((button) => {
    button.classList.toggle("menu-item--on", state.food.includes(button.querySelector("strong")?.textContent));
  });
  document.querySelectorAll(".potion-ing").forEach((button) => {
    button.classList.toggle("potion-ing--on", state.activities.includes(button.querySelector("em")?.textContent));
  });
  document.querySelectorAll(".vial").forEach((button) => {
    button.classList.toggle("vial--on", button.textContent === state.potionBase);
  });
}

export function onScreenEnter(id) {
  hydrateLazyImages(document.querySelector(`[data-screen="${id}"]`));
  restoreSelections();
  syncEveHonestButton(id);
  if (id.startsWith("eve-")) onEnterEve(id);
  if (id === "steed") onEnterSteed();
  if (id === "oracle") restoreOracleFromState();
  if (id === "potion") {
    stirCount = state.potionName ? 3 : 0;
    potionBottled = Boolean(state.potionName);
    $("notesInput").value = state.notes || "";
    $("btnStir").textContent = potionBottled ? "Bottle it and continue" : "Stir the cauldron";
  }
  if (id === "decree") {
    state.chapter = "complete";
    state.chapterOneComplete = true;
    state.chapterTwoStarted = true;
    state.chapterTwoComplete = true;
    saveState();
    queueQuestSync({ immediate: true });
    reportMainFeedback();
    $("decreePreview").textContent = buildSummaryText("pass");
    boostEmbers();
    playStamp();
    $("waxStampAnim")?.classList.add("stamped");
  }
  if (id === "chapter-lock") {
    $("chapterLockDate").textContent = `Oğuzhan will unseal Chapter II on ${formatQuestDate(state.scheduledDate, state.timeZone)} morning.`;
  }
  if (id === "chapter-two-start") renderRecap();
  if (id === "chapter-two-pause") {
    $("activeBuffText").textContent = `${state.partyBuff || "Improvised courage"} is active.`;
  }
  if (id === "chapter-two-finish") {
    $("favoriteMoment").value = state.favoriteMoment || "";
  }
  if (id === "quest-complete") {
    $("finalPreview").textContent = buildCompletionText();
    boostEmbers();
  }
}

export function initScreens(nav) {
  navigate = nav;
  initEvePrelude(navigate);
  initTitle();
  initSummons();
  initSteed();
  initSheet();
  initRating();
  initJournal();
  initDragon();
  initHonest();
  initTavern();
  initPotion();
  initStars();
  initOracle();
  initDecree();
  initChapterLock();
  initChapterTwo();
}
