import { CONFIG, COPY, tarotForKey } from "./config.js";
import { unlock } from "./achievements.js";

// bonus achievements use same unlock()
import { playNeigh, playStamp, playHorn, duckMusic, vibrate, unlockAudio, startAmbience, setSoundOn, isSoundOn } from "./audio.js";
import { say, setSteedName, setPortrait, hideDialogue, attachSteedDialogue } from "./dialogue.js";
import { hydrateLazyImages } from "./image-utils.js";
import { iconFood, icons } from "./icons.js";
import { burstHearts, boostEmbers } from "./particles.js";
import { buildSummaryText, downloadDecreePng, shareDecree } from "./decree.js";
import {
  disarmHonestLink,
  honestDeclineClickAllowed,
  scheduleHonestLinkArm,
  setPointerOnNay,
  showHonestDeclineLink,
  swallowGhostClick,
} from "./dragon-guards.js";
import { updateEpigraph } from "./epigraph.js";
import { syncContinueButton } from "./app-chrome.js";
import { showNewQuestConfirm, showUndoToast } from "./ui-feedback.js";
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
  { id: "pizza", name: "Pizza", line: "A peasant classic with a royal taste" },
  { id: "sushi", name: "Sushi", line: "Delicacies from a faraway kingdom" },
  { id: "burger", name: "Burgers & fries", line: "The traditional tavern feast" },
  { id: "pasta", name: "Pasta", line: "Shared spaghetti. One noodle. No promises." },
  { id: "taco", name: "Tacos", line: "Let's taco 'bout our next quest" },
  { id: "brunch", name: "Brunch", line: "Sweet rolls and a second breakfast" },
  { id: "street", name: "Street food", line: "Market provisions, eaten while wandering" },
  { id: "dessert", name: "Just dessert", line: "Skip to the good part" },
  { id: "surprise", name: "Surprise me", line: "Trust the innkeeper" },
];

const JOURNAL = [
  "An enchanted forest stroll",
  "A main-character montage",
  "A rom-com, but medieval",
  "Monster-hunting banter (we won)",
  "A surprisingly legendary feast",
  "A fairy tale that might be real",
  "A side quest I didn't want to end",
  "A tavern scene with great banter",
];

const INGREDIENTS = [
  { label: "Mane of a galloping steed", act: "Horse riding (your favourite)" },
  { label: "Moss from the old forest", act: "Nature hike + forest picnic" },
  { label: "A banner from the castle fair", act: "Medieval fair or castle visit" },
  { label: "A cosy controller rune", act: "Fantasy game night together" },
  { label: "Popcorn of the silver screen", act: "Movie night" },
  { label: "A drop of sunset", act: "Sunset walk + coffee" },
  { label: "A woven picnic basket", act: "Picnic among the trees" },
  { label: "Clay from the potter's wheel", act: "Painting / pottery date" },
  { label: "A brave bard's microphone", act: "Karaoke" },
  { label: "A blanket from the hearth", act: "Cosy night in" },
];

const BASES = [
  { id: "hearth", name: "Hearth Ember", color: "#e8a04a" },
  { id: "rose", name: "Wild Rose", color: "#e88aa8" },
  { id: "fizz", name: "Chaos Fizz", color: "#5ec4b8" },
  { id: "dew", name: "Moonlight Dew", color: "#b8a8e8" },
  { id: "sap", name: "Wild Sap", color: "#7cb86a" },
];

const CLASSES = [
  { id: "ranger", title: "Ranger of the Wildwood", desc: "Rides fast, finds hidden paths, befriends every animal." },
  { id: "healer", title: "Moonlit Healer", desc: "Fixes bad days with one smile. Passive aura: calm." },
  { id: "bard", title: "Wandering Bard", desc: "Main-character playlist. Inspires the whole party." },
  { id: "knight", title: "Knight of the Wildflowers", desc: "Defends the realm and steals all the fries." },
];

let navigate;
let yesScale = 1;
let noScale = 1;
let stirCount = 0;
let potionBottled = false;
let letterStarted = false;
let sealing = false;
let pickSteedIx = 0;

export function initScreens(nav) {
  navigate = nav;
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
}

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
}

function formatPickerDate(iso) {
  if (!iso) return "";
  try {
    return new Date(`${iso}T12:00:00`).toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  } catch (_) {
    return iso;
  }
}

function selectChip(row, chosen) {
  row?.querySelectorAll(".chip-select").forEach((c) => c.classList.remove("chip-select--on"));
  chosen?.classList.add("chip-select--on");
}

function resetQuestSessionFlags() {
  stirCount = 0;
  potionBottled = false;
  letterStarted = false;
  sealing = false;
  pickSteedIx = 0;
  yesScale = 1;
  noScale = 1;
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
  navigate("summons");
  if (hadSave) {
    showUndoToast(
      "Quest reset — progress cleared.",
      () => {
        if (undoLastNewQuest()) {
          const target = state.lastScreen && state.lastScreen !== "title" ? state.lastScreen : "title";
          navigate(target);
          syncContinueButton();
        }
      },
      { onExpire: clearPendingUndo }
    );
  } else {
    syncContinueButton();
  }
}

/** New Game / Begin anew — confirm when a quest save exists, then optional undo toast. */
function requestFreshQuestStart() {
  if (hasQuestSave()) {
    showNewQuestConfirm({ onKeep: () => {}, onStartOver: startFreshQuestWithUndo });
  } else {
    startFreshQuestWithUndo();
  }
}

function initTitle() {
  document.querySelectorAll("[data-lady]").forEach((el) => {
    el.textContent = questOfTitle();
  });

  $("btnNewGame")?.addEventListener("click", () => {
    requestFreshQuestStart();
  });

  $("btnContinue")?.addEventListener("click", () => {
    unlockAudio();
    if (isSoundOn()) startAmbience();
    const target = state.lastScreen && state.lastScreen !== "title" ? state.lastScreen : "summons";
    navigate(target);
  });

  $("btnSoundTitle")?.addEventListener("click", () => {
    setSoundOn(!isSoundOn());
    $("btnSoundTitle").textContent = isSoundOn() ? "♪ Sound: On" : "♪ Sound: Off";
  });
}

function initSummons() {
  const sealBtn = $("waxSealBtn");
  const sealArt = $("waxSealArt");
  const breakSeal = (e) => {
    if (e?.type === "keydown" && e.key !== "Enter" && e.key !== " ") return;
    if (e?.type === "keydown") e.preventDefault();
    if (sealBtn?.classList.contains("cracked") || sealArt?.classList.contains("cracked")) return;
    sealBtn?.classList.add("cracked");
    sealArt?.classList.add("cracked");
    unlock("seal");
    show($("loadingQuest"));
    runOracleLoad();
  };
  sealBtn?.addEventListener("click", breakSeal);
  sealBtn?.addEventListener("keydown", breakSeal);
  $("btnSummonBegin")?.addEventListener("click", () => navigate("steed"));
}

function runOracleLoad() {
  const fill = $("loadingFill");
  const text = $("loadingText");
  const steps = COPY.loadingSteps;
  let i = 0;
  const tick = () => {
    if (i >= steps.length) {
      show($("btnSummonBegin"));
      return;
    }
    fill.style.width = `${steps[i].p}%`;
    text.textContent = steps[i].t;
    i++;
    setTimeout(tick, 520);
  };
  tick();
}

function initSteed() {
  const horse = $("horseIdle");
  const aff = $("affectionBar");
  const carrot = $("carrotBtn");

  function renderAff() {
    if (!aff) return;
    aff.innerHTML = "♡".repeat(5 - state.affection) + "♥".repeat(state.affection);
  }
  renderAff();

  horse?.addEventListener("click", () => {
    if (state.affection >= 5) return;
    state.affection++;
    saveState();
    renderAff();
    horse.classList.add("horse-pet");
    setTimeout(() => horse.classList.remove("horse-pet"), 300);
    burstHearts(horse.getBoundingClientRect().x + 80, horse.getBoundingClientRect().y + 40);
    if (state.affection >= 5) {
      unlock("whisperer");
      say([COPY.steedWhispererLine]);
    }
  });

  carrot?.addEventListener("click", () => {
    state.affection = 5;
    state.fed = true;
    saveState();
    renderAff();
    $("horseIdleImg").src = "assets/images/horse-munch.webp";
    unlock("snack");
    playNeigh();
    say([COPY.steedCarrotLine]);
  });

  document.querySelectorAll("[data-steed-name]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const v = btn.dataset.steedName;
      if (v === "custom") {
        $("customSteedWrap")?.classList.remove("hidden");
        return;
      }
      pickSteed(v);
    });
  });

  $("customSteedInput")?.addEventListener("change", (e) => {
    const v = e.target.value.trim().slice(0, 16);
    if (v) pickSteed(v);
  });

  $("btnSteedNext")?.addEventListener("click", () => navigate("sheet"));
}

function pickSteed(name) {
  state.steedName = name;
  saveState();
  setSteedName(name);
  updateEpigraph("steed");
  const templates = COPY.steedPickLines;
  const line = templates[pickSteedIx % templates.length].replace(/\{name\}/g, name);
  pickSteedIx++;
  const lines = [line, COPY.benedickQuip];
  say(lines);
}

export function onEnterSteed() {
  attachSteedDialogue();
  setPortrait("assets/images/horse-idle.webp");
  setSteedName(state.steedName);
  say([
    `*soft neigh* Oh! You must be ${questOfTitle()}. I've heard SO much about you.`,
    `I'm your steed for this quest. Before we ride… may I have a head scratch? It's tradition.`,
  ]);
}

function renderClassPick() {
  const grid = $("classPick");
  if (!grid || grid.dataset.rendered) return;
  grid.dataset.rendered = "1";
  grid.innerHTML = CLASSES
    .map(
      (c) =>
        `<button type="button" data-class="${c.title}"><strong>${c.title}</strong><em>${c.desc}</em></button>`
    )
    .join("");
}

function initSheet() {
  renderClassPick();
  $("btnRoll")?.addEventListener("click", () => {
    $("d20Result")?.classList.remove("hidden");
    $("d20Result").textContent = "Natural 20! (The dice are biased. Towards you.)";
    unlock("charm");
    const stats = $("statList");
    if (stats && !stats.dataset.rolled) {
      stats.dataset.rolled = "1";
      const rows = [
        ["Charm", "100", "Had to recalibrate the scale."],
        ["Kindness", "100", "Max level. Unpatched."],
        ["Beauty", "∞", "Error: value too high to display."],
        ["Humour", "97", "Laughs at his jokes: +3 bonus."],
        ["Horse Bond", "S-rank", `Certified by ${state.steedName}.`],
        ["Patience", "100", "Required for his puns."],
        ["Courage", "95", "Opened this link. Brave."],
      ];
      stats.innerHTML = rows
        .map(
          ([k, v, c]) =>
            `<div class="stat-row"><span>${k}</span><strong>${v}</strong><em>${c}</em></div>`
        )
        .join("");
    }
    $("classPick")?.classList.remove("hidden");
  });

  $("classPick")?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-class]");
    if (!btn) return;
    state.steedClass = btn.dataset.class;
    saveState();
    const meta = CLASSES.find((c) => c.title === state.steedClass);
    $("classChosen").textContent = meta
      ? `Class chosen: ${meta.title} — ${meta.desc}`
      : `Class chosen: ${state.steedClass}. Title added to your decree.`;
    $("classPick")?.querySelectorAll("[data-class]").forEach((b) => b.classList.remove("class-pick--on"));
    btn.classList.add("class-pick--on");
    show($("btnSheetNext"));
  });
  $("btnSheetNext")?.addEventListener("click", () => navigate("rating"));
}

function initRating() {
  const slider = $("ratingSlider");
  const cap = $("ratingCaption");
  const chip11 = $("chipEleven");
  let last = 10;
  let bonusShown = false;

  function caption(n) {
    if (n >= 10) return "Verdict: flawless. +1000 aura.";
    if (n === 9) return "So close. The court rounds up for you.";
    if (n === 8) return "8? The court is offended on your behalf.";
    if (n === 6 || n === 7) return "6-7?? Not in this kingdom.";
    if (n >= 4) return "The dragon is laughing. Try again.";
    return "Error 404: that number has been banished.";
  }

  slider?.addEventListener("input", () => {
    last = +slider.value;
    $("ratingValue").textContent = slider.value;
    if (!state.ratingBonus) cap.textContent = caption(last);
  });

  const spring = () => {
    slider.value = "10";
    $("ratingValue").textContent = "10";
    if (!state.ratingBonus) cap.textContent = caption(10);
    slider.classList.add("boing");
    setTimeout(() => slider.classList.remove("boing"), 500);
    if (!bonusShown) {
      bonusShown = true;
      show(chip11);
      show($("ratingChips"));
      show($("ratingChipsField"));
      show($("ratingChipLead"));
    }
  };
  slider?.addEventListener("change", spring);
  slider?.addEventListener("pointerup", spring);

  chip11?.addEventListener("click", () => {
    state.ratingBonus = true;
    state.rating = 11;
    unlock("charts");
    $("ratingValue").textContent = "11";
    cap.textContent = "Legendary rating unlocked. The scale has been broken. Respectfully.";
    saveState();
  });

  document.querySelectorAll("[data-rating-chip]").forEach((c) => {
    c.addEventListener("click", () => {
      state.ratingChip = c.dataset.ratingChip;
      if (!state.ratingBonus) cap.textContent = "Re-rated: still a 10.";
      selectChip($("ratingChips"), c);
      saveState();
    });
  });

  $("btnRatingNext")?.addEventListener("click", () => {
    state.rating = state.ratingBonus ? 11 : 10;
    saveState();
    navigate("journal");
  });
}

function initJournal() {
  const list = $("journalList");
  JOURNAL.forEach((label) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "journal-entry";
    b.textContent = label;
    b.addEventListener("click", () => {
      state.todayVibe = label;
      saveState();
      b.classList.add("journal-entry--stamped");
      setTimeout(() => navigate("dragon"), 900);
    });
    list?.appendChild(b);
  });
}

const YES_SCALE_MAX = 1.3;
let syncDragonLayout = () => {};
let enterDragonScreen = () => {};

const HONEST_LINK_SLOT_PX = 48;

export function fitDragonArena() {
  const arena = $("dateButtons");
  const btnYes = $("btnYes");
  const btnNo = $("btnNo");
  const honestWrap = document.querySelector(".dragon-honest-wrap");
  if (!arena) return;
  const top = arena.getBoundingClientRect().top;
  const safeBottom = 12;
  const honestReserve = Math.max(honestWrap?.offsetHeight || 0, HONEST_LINK_SLOT_PX) + 8;
  const maxBottom = window.innerHeight - honestReserve - safeBottom;
  const maxByViewport = Math.max(96, maxBottom - top);
  if (btnNo) btnNo.style.transform = noScale === 1 ? "" : `scale(${noScale})`;
  if (btnYes) btnYes.style.transform = yesScale === 1 ? "" : `scale(${yesScale})`;
  void btnYes?.offsetHeight;
  void btnNo?.offsetHeight;
  const yesH = btnYes?.getBoundingClientRect().height || 64;
  const noH = measureNay(btnNo).h || 48;
  const pad = 12;
  const needed = yesH + noH + pad * 3;
  const h = Math.min(maxByViewport, Math.max(96, needed));
  arena.style.height = `${h}px`;
  arena.style.minHeight = "0";
  arena.style.maxHeight = `${maxByViewport}px`;
}

function capYesScale(btnYes, arena, scale) {
  const arenaW = arena?.clientWidth || window.innerWidth;
  const baseW = btnYes?.offsetWidth || 1;
  const maxByArena = (arenaW - 12) / baseW;
  const maxByViewport = (window.innerWidth - 16) / baseW;
  return Math.min(scale, YES_SCALE_MAX, maxByArena, maxByViewport);
}

function measureNay(btnNo) {
  if (!btnNo) return { w: 96, h: 48 };
  return { w: btnNo.offsetWidth, h: btnNo.offsetHeight };
}

function applyNayLabelConstraints(btnNo, arena) {
  if (!btnNo || !arena) return;
  const pad = 10;
  const maxW = Math.max(120, arena.clientWidth - pad * 2);
  btnNo.style.maxWidth = `${maxW}px`;
  btnNo.style.boxSizing = "border-box";
}

function enforceNayWithinBounds(btnYes, btnNo, arena) {
  if (!btnYes || !btnNo || !arena) return;
  applyNayLabelConstraints(btnNo, arena);
  const pad = 10;
  let left = Number.parseFloat(btnNo.style.left);
  let top = Number.parseFloat(btnNo.style.top);
  if (!Number.isFinite(left)) left = pad;
  if (!Number.isFinite(top)) top = pad;
  clampNayPosition(btnYes, btnNo, arena, left, top);
  const arenaRect = arena.getBoundingClientRect();
  let noRect = btnNo.getBoundingClientRect();
  if (noRect.right > arenaRect.right - pad) {
    left -= noRect.right - (arenaRect.right - pad);
  }
  if (noRect.left < arenaRect.left + pad) {
    left = pad;
  }
  if (noRect.right > window.innerWidth - 8) {
    left -= noRect.right - (window.innerWidth - 8);
  }
  clampNayPosition(btnYes, btnNo, arena, Math.max(pad, left), top);
  noRect = btnNo.getBoundingClientRect();
  if (noRect.right > window.innerWidth - 4 || noRect.left < 4) {
    placeNayBelowYes(btnYes, btnNo, arena);
    clampNayPosition(
      btnYes,
      btnNo,
      arena,
      Number.parseFloat(btnNo.style.left) || pad,
      Number.parseFloat(btnNo.style.top) || pad
    );
  }
}

function clampNayPosition(btnYes, btnNo, arena, x, y) {
  if (!btnYes || !btnNo || !arena) return;
  btnYes.style.position = "relative";
  btnYes.style.zIndex = "2";
  btnNo.style.position = "absolute";
  btnNo.style.zIndex = "12";
  btnNo.style.width = "auto";
  btnNo.classList.remove("hidden");
  void btnNo.offsetHeight;
  const pad = 10;
  const arenaW = arena.clientWidth;
  const arenaH = arena.clientHeight;
  const arenaRect = arena.getBoundingClientRect();
  const yesRect = btnYes.getBoundingClientRect();
  const { w: noW, h: noH } = measureNay(btnNo);
  const yesBottom = yesRect.bottom - arenaRect.top;
  const minY = yesBottom + pad;
  let maxY = Math.max(minY, arenaH - noH - pad);
  if (maxY < minY) maxY = minY;
  const maxX = Math.max(pad, arenaW - noW - pad);
  let left = Math.min(Math.max(x, pad), maxX);
  let top = Math.min(Math.max(y, minY), maxY);
  btnNo.style.left = `${left}px`;
  btnNo.style.top = `${top}px`;
  applyNayLabelConstraints(btnNo, arena);
}

function placeNayBelowYes(btnYes, btnNo, arena) {
  if (!btnYes || !btnNo || !arena) return;
  const arenaRect = arena.getBoundingClientRect();
  const yesRect = btnYes.getBoundingClientRect();
  const pad = 10;
  const yesBottom = yesRect.bottom - arenaRect.top;
  const { w: noW } = measureNay(btnNo);
  const maxLeft = Math.max(pad, arena.clientWidth - noW - pad);
  const left = Math.min(Math.max(arena.clientWidth * 0.52, pad), maxLeft);
  clampNayPosition(btnYes, btnNo, arena, left, yesBottom + pad);
}

function reconcileYesScaleForArena(btnYes, btnNo, arena) {
  if (!btnYes || !btnNo || !arena) return;
  let guard = 0;
  while (guard++ < 16) {
    fitDragonArena();
    const pad = 22;
    const yesH = btnYes.getBoundingClientRect().height;
    const noH = measureNay(btnNo).h;
    if (yesH + noH + pad <= arena.clientHeight) return;
    if (yesScale <= 1) return;
    yesScale = Math.max(1, yesScale - 0.05);
    btnYes.style.transform = yesScale === 1 ? "" : `scale(${yesScale})`;
  }
}

function ensureDragonInViewport() {
  const arena = $("dateButtons");
  const btnYes = $("btnYes");
  const btnNo = $("btnNo");
  const wrap = document.querySelector(".dragon-honest-wrap");
  if (!arena || !btnYes || !btnNo) return;
  reconcileYesScaleForArena(btnYes, btnNo, arena);
  fitDragonArena();
  const pad = 10;
  let guard = 0;
  while (guard++ < 12) {
    const noRect = btnNo.getBoundingClientRect();
    const arenaRect = arena.getBoundingClientRect();
    const overBottom = noRect.bottom > arenaRect.bottom - 2;
    const overViewport = noRect.bottom > window.innerHeight - 12;
    if (!overBottom && !overViewport) break;
    const left = Number.parseFloat(btnNo.style.left) || pad;
    const top = Number.parseFloat(btnNo.style.top) || pad;
    clampNayPosition(btnYes, btnNo, arena, left, top - 8);
    if (overViewport && wrap) {
      fitDragonArena();
      placeNayBelowYes(btnYes, btnNo, arena);
    }
  }
}

function initDragon() {
  const btnNo = $("btnNo");
  const btnYes = $("btnYes");
  const arena = $("dateButtons");
  const hp = $("dragonHp");
  let hpVal = 100;
  let nayDodgedThisVisit = false;

  function layoutDragon() {
    btnYes.style.transform = yesScale === 1 ? "" : `scale(${yesScale})`;
    btnNo.style.transform = noScale === 1 ? "" : `scale(${noScale})`;
    reconcileYesScaleForArena(btnYes, btnNo, arena);
    fitDragonArena();
    placeNayBelowYes(btnYes, btnNo, arena);
    ensureDragonInViewport();
  }

  syncDragonLayout = layoutDragon;
  enterDragonScreen = () => {
    nayDodgedThisVisit = false;
    if (state.noAttempts === 0) {
      yesScale = 1;
      noScale = 1;
      hpVal = 100;
      if (hp) hp.style.width = "100%";
      btnNo.textContent = COPY.noLabels[0];
      hide($("dragonFoolCaption"));
    }
    disarmHonestLink();
    showHonestDeclineLink();
    scheduleHonestLinkArm();
    hide($("yesToast"));
    $("dragonScene")?.classList.remove("dragon-win");
    if ($("dragonImg")) $("dragonImg").src = "assets/images/dragon-doubt.webp";
    btnNo.classList.remove("hidden");
    layoutDragon();
  };

  const releaseNayPointer = () => setPointerOnNay(false);
  btnNo?.addEventListener("pointerdown", () => setPointerOnNay(true));
  btnNo?.addEventListener("pointerup", releaseNayPointer);
  btnNo?.addEventListener("pointercancel", releaseNayPointer);
  btnNo?.addEventListener("pointerleave", releaseNayPointer);

  function dodge(e) {
    e?.preventDefault();
    e?.stopPropagation();
    swallowGhostClick();
    state.noAttempts++;
    hpVal = Math.min(100, hpVal + 5);
    if (hp) hp.style.width = hpVal + "%";
    saveState();
    noScale = Math.max(0.75, noScale * 0.9);
    yesScale = capYesScale(btnYes, arena, yesScale * 1.12);
    const i = Math.min(state.noAttempts, COPY.noLabels.length) - 1;
    btnNo.textContent = (COPY.noLabels[i] || "nay").replace(/\{steed\}/g, state.steedName);
    if (state.noAttempts >= 3) {
      const cap = $("dragonFoolCaption");
      if (cap) {
        cap.textContent = COPY.dragonFoolQuote;
        show(cap);
      }
    }

    btnYes.style.transform = yesScale === 1 ? "" : `scale(${yesScale})`;
    btnNo.style.transform = noScale === 1 ? "" : `scale(${noScale})`;
    void btnNo.offsetHeight;

    fitDragonArena();
    const pad = 10;
    const arenaW = arena?.clientWidth || 300;
    const arenaRect = arena.getBoundingClientRect();
    const yesRect = btnYes.getBoundingClientRect();
    const yesBottom = yesRect.bottom - arenaRect.top;
    const { w: noW, h: noH } = measureNay(btnNo);
    const minY = yesBottom + pad;
    const maxY = Math.max(minY, arena.clientHeight - noH - pad);
    const maxX = Math.max(pad, arenaW - noW - pad);
    let x = pad;
    let y = minY;
    for (let t = 0; t < 28; t++) {
      x = pad + Math.random() * Math.max(0, maxX - pad);
      y = minY + Math.random() * Math.max(0, maxY - minY);
      const noLeft = x;
      const noRight = x + noW;
      const noTop = y;
      const noBottom = y + noH;
      const yesLeft = yesRect.left - arenaRect.left;
      const yesRight = yesRect.right - arenaRect.left;
      const yesTop = yesRect.top - arenaRect.top;
      const yesBottomLocal = yesRect.bottom - arenaRect.top;
      const overlaps =
        noLeft < yesRight + pad &&
        noRight > yesLeft - pad &&
        noTop < yesBottomLocal + pad &&
        noBottom > yesTop - pad;
      if (!overlaps) break;
    }
    clampNayPosition(btnYes, btnNo, arena, x, y);
    fitDragonArena();
    enforceNayWithinBounds(btnYes, btnNo, arena);
    ensureDragonInViewport();
    const nayRect = btnNo.getBoundingClientRect();
    const arenaBounds = arena.getBoundingClientRect();
    if (
      nayRect.bottom > arenaBounds.bottom - 2 ||
      nayRect.top < arenaBounds.top + 2 ||
      nayRect.bottom > window.innerHeight - 8
    ) {
      placeNayBelowYes(btnYes, btnNo, arena);
      ensureDragonInViewport();
    }

    scheduleHonestLinkArm();
    if (state.noAttempts >= 3) unlock("stubborn");
  }

  function onNayInteract(e) {
    if (!nayDodgedThisVisit) {
      nayDodgedThisVisit = true;
      dodge(e);
      return;
    }
    e?.preventDefault?.();
    state.noAttempts++;
    hpVal = Math.min(100, hpVal + 5);
    if (hp) hp.style.width = hpVal + "%";
    saveState();
    const i = Math.min(state.noAttempts, COPY.noLabels.length) - 1;
    btnNo.textContent = (COPY.noLabels[i] || "nay").replace(/\{steed\}/g, state.steedName);
    if (state.noAttempts >= 3) {
      const cap = $("dragonFoolCaption");
      if (cap) {
        cap.textContent = COPY.dragonFoolQuote;
        show(cap);
      }
      unlock("stubborn");
    }
    enforceNayWithinBounds(btnYes, btnNo, arena);
    syncDragonLayout();
  }

  btnNo?.addEventListener("pointerdown", onNayInteract, { passive: false });
  btnYes?.addEventListener("click", () => {
    state.secondDate = "yes";
    state.honestNo = false;
    saveState();
    $("dragonScene")?.classList.add("dragon-win");
    $("dragonImg").src = "assets/images/dragon-befriended.webp";
    $("horseQuestImg").src = "assets/images/horse-rear.webp";
    $("horseQuest")?.classList.add("horse-mascot--hop");
    disarmHonestLink();
    hide(btnNo);
    unlock("dragon");
    burstHearts(window.innerWidth / 2, window.innerHeight / 2);
    vibrate([60, 30, 120]);
    const toasts = COPY.yesToasts;
    const msg = toasts[Math.floor(Math.random() * toasts.length)].replace(/\{steed\}/g, state.steedName);
    const yt = $("yesToast");
    if (yt) yt.textContent = msg;
    show(yt);
    setTimeout(() => navigate("tavern"), 1400);
  });

  $("realNoLink")?.addEventListener("click", (e) => {
    if (!honestDeclineClickAllowed(e)) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    state.honestNo = true;
    state.secondDate = "no";
    saveState();
    navigate("honest-no");
  });

  window.addEventListener("resize", () => {
    if (document.body.dataset.screen === "dragon") syncDragonLayout();
  });
  window.addEventListener("dragon-honest-resize", () => {
    if (document.body.dataset.screen === "dragon") syncDragonLayout();
  });
}

function initHonest() {
  $("btnHonestContinue")?.addEventListener("click", () => {
    saveState();
    navigate("tavern");
  });
  onEnterHonest = () => {
    const body = document.querySelector('[data-screen="honest-no"] .body-text');
    if (body) {
      body.textContent = `You remain noble and kind. The realm respects you, and ${state.steedName} still thinks you're great.`;
    }
  };
}

let onEnterHonest = () => {};

function initTavern() {
  const menu = $("tavernMenu");
  FOOD.forEach((f) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "menu-item";
    b.innerHTML = `${iconFood(f.id)}<div><strong>${f.name}</strong><em>${f.line}</em></div>`;
    b.addEventListener("click", () => {
      b.classList.toggle("menu-item--on");
      if (state.food.includes(f.name)) state.food = state.food.filter((x) => x !== f.name);
      else state.food.push(f.name);
      saveState();
    });
    menu?.appendChild(b);
  });

  $("fanumTax")?.addEventListener("change", () => {
    const checked = $("fanumTax")?.checked ?? true;
    state.fanumTax = checked;
    if (!checked) {
      state.achievements = state.achievements.filter((id) => id !== "fanum");
    }
    saveState();
  });
  $("fanumTaxLabel")?.addEventListener("click", () => {
    $("fanumTaxLabel")?.classList.add("wiggle");
  });
  $("btnTavernNext")?.addEventListener("click", () => {
    if ($("fanumTax")?.checked) unlock("fanum");
    navigate("potion");
  });
}

function initPotion() {
  const ing = $("potionIngredients");
  INGREDIENTS.forEach((item) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "potion-ing";
    b.innerHTML = `<strong>${item.label}</strong><em>${item.act}</em>`;
    b.addEventListener("click", () => {
      b.classList.toggle("potion-ing--on");
      if (state.activities.includes(item.act)) state.activities = state.activities.filter((a) => a !== item.act);
      else state.activities.push(item.act);
      saveState();
    });
    ing?.appendChild(b);
  });

  const bases = $("potionBases");
  BASES.forEach((base) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "vial";
    b.style.setProperty("--vial-color", base.color);
    b.textContent = base.name;
    b.addEventListener("click", () => {
      state.potionBase = base.name;
      state.vibe = base.name;
      const glow = $("cauldronGlow");
      if (glow) glow.style.setProperty("--glow-color", base.color);
      document.querySelectorAll(".vial").forEach((v) => v.classList.remove("vial--on"));
      b.classList.add("vial--on");
      saveState();
    });
    bases?.appendChild(b);
  });

  $("notesInput")?.addEventListener("input", (e) => {
    state.notes = e.target.value.trim();
    saveState();
  });

  $("btnStir")?.addEventListener("click", () => {
    if (potionBottled) {
      navigate("stars");
      return;
    }
    stirCount++;
    if (stirCount < 3) {
      $("btnStir").textContent = `Stir (${stirCount}/3)`;
      return;
    }
    state.potionName = buildPotionName();
    unlock("alchemist");
    show($("potionResult"));
    $("potionResult").textContent = `${state.potionName}. Side effects: giggling, stolen fries, losing track of time.`;
    $("btnStir").textContent = "Bottle it & ride on →";
    potionBottled = true;
    saveState();
  });
}

function initStars() {
  const days = [
    "This Friday",
    "This Saturday",
    "This Sunday",
    "Next week (playing hard to get)",
    "Consult the calendar",
  ];
  const dayWrap = $("dayChips");

  function dayLabelWithTime(base) {
    const t = state.time || $("skyDial")?.value;
    if (!t) return base;
    return `${base} · ${t}`;
  }

  function refreshDayChipLabels() {
    dayWrap?.querySelectorAll(".chip-select").forEach((btn, i) => {
      if (i >= 4) return;
      const base = btn.dataset.dayBase || days[i];
      btn.textContent = btn.classList.contains("chip-select--on") ? dayLabelWithTime(base) : base;
    });
  }

  days.forEach((label, i) => {
    const c = document.createElement("button");
    c.type = "button";
    c.className = "chip-select";
    c.dataset.dayBase = label;
    c.textContent = label;
    c.addEventListener("click", () => {
      if (i === 4) {
        show($("datePicker"));
        return;
      }
      state.day = label;
      selectChip(dayWrap, c);
      refreshDayChipLabels();
      saveState();
    });
    dayWrap?.appendChild(c);
  });

  $("datePicker")?.addEventListener("change", (e) => {
    const v = e.target.value;
    state.day = formatPickerDate(v);
    saveState();
  });

  const times = ["Morning ride", "Afternoon", "Golden hour", "Evening stars", "Late-night tales"];
  const sky = $("skyDial");
  times.forEach((t, i) => {
    const o = document.createElement("option");
    o.value = t;
    o.textContent = t;
    sky?.appendChild(o);
  });
  if (sky) {
    sky.value = state.time || "Morning ride";
    state.time = sky.value;
    saveState();
  }
  sky?.addEventListener("input", () => {
    state.time = sky.value;
    document.body.style.setProperty("--sky-phase", sky.selectedIndex / 4);
    const on = dayWrap?.querySelector(".chip-select--on");
    if (on && on.dataset.dayBase) {
      state.day = on.dataset.dayBase;
    }
    refreshDayChipLabels();
    saveState();
  });

  $("btnCoin")?.addEventListener("click", () => {
    unlock("fate");
    $("coinMsg")?.classList.remove("hidden");
  });

  $("btnSealDate")?.addEventListener("click", () => {
    if (sealing) return;
    sealing = true;
    const sealBtn = $("btnSealDate");
    sealBtn?.setAttribute("disabled", "true");
    if (!state.day) state.day = "TBD";
    if (!state.time) state.time = sky?.value || "Morning ride";
    saveState();
    let n = 3;
    const cd = $("countdownNum");
    const box = $("bookingCountdown");
    show(box);
    const iv = setInterval(() => {
      n--;
      if (n > 0) cd.textContent = String(n);
      else {
        clearInterval(iv);
        sealing = false;
        sealBtn?.removeAttribute("disabled");
        navigate("oracle");
      }
    }, 1000);
  });
}

export function restoreOracleFromState() {
  if (!state.tarotKey) return;
  const meta = tarotForKey(state.tarotKey);
  document.querySelectorAll(".tarot-card").forEach((c) => c.classList.add("flipped"));
  const chosen = document.querySelector(`.tarot-card[data-card="${state.tarotKey}"]`);
  chosen?.classList.add("tarot-card--chosen");
  const fortune = $("tarotFortune");
  if (fortune && meta) {
    fortune.textContent = meta.long;
    show(fortune);
  }
  show($("btnOpenLetter"));
}

function initOracle() {
  const cards = document.querySelectorAll(".tarot-card");
  cards.forEach((card) => {
    card.addEventListener("click", () => {
      if (state.tarotKey) return;
      const key = card.dataset.card;
      const meta = tarotForKey(key);
      unlock("fortune");
      state.tarotKey = key;
      state.tarotCard = meta?.title || key;
      saveState();
      document.querySelectorAll(".tarot-card").forEach((c) => c.classList.add("flipped"));
      card.classList.add("tarot-card--chosen");
      const fortune = $("tarotFortune");
      if (fortune && meta) {
        fortune.textContent = meta.long;
        show(fortune);
      }
      show($("btnOpenLetter"));
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

function typeLetter() {
  const el = $("letterBody");
  const paras = CONFIG.letter.map((p) =>
    p
      .replace(/^Dear \{name\},$/, letterSalutation())
      .replace("{name}", guest.isLady ? guest.formal : "my lady")
      .replace("{fromName}", CONFIG.fromName)
      .replace("{steedName}", state.steedName)
  );
  const full = paras.join("\n\n");
  let i = 0;
  el.textContent = "";
  const iv = setInterval(() => {
    el.textContent = full.slice(0, ++i);
    if (i >= full.length) clearInterval(iv);
  }, 35);
  el.addEventListener(
    "click",
    () => {
      el.textContent = full;
      clearInterval(iv);
    },
    { once: true }
  );
}

function initDecree() {
  $("btnShare")?.addEventListener("click", () => shareDecree());
  $("btnSavePng")?.addEventListener("click", () => downloadDecreePng());
  $("btnCopy")?.addEventListener("click", async () => {
    const text = buildSummaryText();
    const toast = $("copyToast");
    try {
      await navigator.clipboard.writeText(text);
    } catch (_) {
      const pre = $("decreePreview");
      if (pre) {
        const range = document.createRange();
        range.selectNodeContents(pre);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    }
    show(toast);
    setTimeout(() => hide(toast), 2000);
  });
  $("btnReplay")?.addEventListener("click", () => {
    requestFreshQuestStart();
  });
}

function activityEssence(activity) {
  const map = {
    "Horse riding (your favourite)": "Galloping Courage",
    "Nature hike + forest picnic": "Forest Moss",
    "Medieval fair or castle visit": "Castle Banners",
    "Fantasy game night together": "Arcane Runes",
    "Movie night": "Silver Screen",
    "Sunset walk + coffee": "Sunset Ember",
    "Picnic among the trees": "Woven Picnic",
    "Painting / pottery date": "Potter's Clay",
    "Karaoke": "Bard's Courage",
    "Cosy night in": "Hearth Warmth",
  };
  return map[activity] || "Adventure";
}

function buildPotionName() {
  const base = state.potionBase || "Moonlight Dew";
  const essences = state.activities.slice(0, 2).map((a) => activityEssence(a));
  if (!essences.length) return `Elixir of ${base}`;
  if (essences.length === 1) return `Elixir of ${base} & ${essences[0]}`;
  return `Elixir of ${base}, ${essences[0]} & ${essences[1]}`;
}

export function onScreenEnter(id) {
  if (id === "honest-no") onEnterHonest();
  if (id === "dragon") {
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => enterDragonScreen()));
  }
  if (id === "decree") {
    const head = document.querySelector('[data-screen="decree"] .title.light');
    if (head) {
      head.textContent = state.honestNo
        ? "By order of the realm — thank you for your honesty"
        : "By royal decree — it's a date ✦";
    }
    unlock("heart", true);
    $("decreePreview").textContent = buildSummaryText();
    boostEmbers();
    playStamp();
    $("waxStampAnim")?.classList.add("stamped");
  }
  if (id === "steed") onEnterSteed();
  if (id === "oracle") {
    hydrateLazyImages(document.querySelector('[data-screen="oracle"]'));
    restoreOracleFromState();
  }
  if (id === "potion") {
    stirCount = 0;
    potionBottled = false;
    const stir = $("btnStir");
    if (stir) stir.textContent = "Stir the cauldron";
  }
  if (id === "stars") {
    sealing = false;
    $("btnSealDate")?.removeAttribute("disabled");
  }
}
