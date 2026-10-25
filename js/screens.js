import { CONFIG } from "./config.js";
import { unlock } from "./achievements.js";

// bonus achievements use same unlock()
import { playNeigh, playStamp, playHorn, duckMusic, vibrate, unlockAudio, startAmbience, setSoundOn, isSoundOn } from "./audio.js";
import { say, setSteedName, setPortrait, hideDialogue } from "./dialogue.js";
import { hydrateLazyImages } from "./image-utils.js";
import { iconFood, icons } from "./icons.js";
import { burstHearts, boostEmbers } from "./particles.js";
import { buildSummaryText, downloadDecreePng, shareDecree } from "./decree.js";
import { guest, questOfTitle, letterSalutation, resetState, saveState, state } from "./state.js";

const FOOD = [
  { id: "pizza", name: "Pizza", line: "A peasant classic with a royal taste" },
  { id: "sushi", name: "Sushi", line: "Delicacies from a faraway kingdom" },
  { id: "burger", name: "Burgers & fries", line: "The traditional tavern feast" },
  { id: "pasta", name: "Pasta", line: "Shared spaghetti, one noodle, you know the scene" },
  { id: "taco", name: "Tacos", line: "A taco 'bout a quest" },
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
];

const INGREDIENTS = [
  { label: "Mane of a galloping steed", act: "Horse riding (your favourite)" },
  { label: "Moss from the old forest", act: "Nature hike + forest picnic" },
  { label: "A banner from the castle fair", act: "Medieval fair or castle visit" },
  { label: "A cozy controller rune", act: "Fantasy game night together" },
  { label: "Popcorn of the silver screen", act: "Movie night" },
  { label: "A drop of sunset", act: "Sunset walk + coffee" },
  { label: "A woven picnic basket", act: "Picnic among the trees" },
  { label: "Clay from the potter's wheel", act: "Painting / pottery date" },
  { label: "A brave bard's microphone", act: "Karaoke" },
  { label: "A blanket from the hearth", act: "Cozy night in" },
];

const BASES = [
  { id: "hearth", name: "Hearth Ember", color: "#e8a04a" },
  { id: "rose", name: "Courtly Rose", color: "#e88aa8" },
  { id: "fizz", name: "Chaos Fizz", color: "#5ec4b8" },
  { id: "dew", name: "Moonlight Dew", color: "#b8a8e8" },
  { id: "sap", name: "Wild Sap", color: "#7cb86a" },
];

const CLASSES = [
  { id: "ranger", title: "Ranger of the Wildwood", desc: "Rides fast, finds hidden paths, befriends every animal." },
  { id: "healer", title: "Moonlit Healer", desc: "Fixes bad days with one smile. Passive aura: calm." },
  { id: "bard", title: "Wandering Bard", desc: "Main-character playlist. Inspires the whole party." },
  { id: "knight", title: "Knight of the Heart", desc: "Defends the realm and steals all the fries." },
];

const NO_LABELS = [
  "Nay",
  "Are you sure?",
  "Really sure??",
  "Think of the tavern snacks",
  "The dragon is gaining power",
  "{steed} is crying (fake)",
  "My aura is dropping",
  "Fine, it's tiny now",
  "nay",
];

let navigate;
let yesScale = 1;
let noScale = 1;
let stirCount = 0;

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

function initTitle() {
  document.querySelectorAll("[data-lady]").forEach((el) => {
    el.textContent = questOfTitle();
  });

  $("btnNewGame")?.addEventListener("click", () => {
    setSoundOn(true);
    unlockAudio();
    startAmbience();
    playHorn();
    navigate("summons");
  });

  $("btnContinue")?.addEventListener("click", () => {
    $("continueHint")?.classList.remove("hidden");
    $("btnContinue")?.classList.add("wobble");
  });

  $("btnSoundTitle")?.addEventListener("click", () => {
    setSoundOn(!isSoundOn());
    $("btnSoundTitle").textContent = isSoundOn() ? "♪ Sound: On" : "♪ Sound: Off";
  });
}

function initSummons() {
  const seal = $("waxSealArt");
  const breakSeal = () => {
    if (seal?.classList.contains("cracked")) return;
    seal.classList.add("cracked");
    unlock("seal");
    show($("loadingQuest"));
    runOracleLoad();
  };
  seal?.addEventListener("click", breakSeal);
  seal?.addEventListener("pointerdown", breakSeal);
  $("btnSummonBegin")?.addEventListener("click", () => navigate("steed"));
}

function runOracleLoad() {
  const fill = $("loadingFill");
  const text = $("loadingText");
  const steps = [
    { p: 67, t: "Consulting the oracle… 67%…" },
    { p: 77, t: "Asking the horse… she said 6-7 lol…" },
    { p: 100, t: "Scroll unlocked — 100%" },
  ];
  let i = 0;
  const tick = () => {
    if (i >= steps.length) {
      show($("btnSummonBegin"));
      return;
    }
    fill.style.width = steps[i].p + "%";
    text.textContent = steps[i].t;
    i++;
    setTimeout(tick, i === 2 ? 400 : 550);
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
    if (state.affection >= 5) unlock("whisperer");
  });

  carrot?.addEventListener("click", () => {
    state.affection = 5;
    state.fed = true;
    saveState();
    renderAff();
    $("horseIdleImg").src = "assets/images/horse-munch.webp";
    unlock("snack");
    playNeigh();
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
  say([`${name}? I LOVE it. Let's go!`]);
}

export function onEnterSteed() {
  setPortrait("assets/images/horse-idle.webp");
  setSteedName(state.steedName);
  say([
    `*soft neigh* Oh! You must be ${questOfTitle()}. I've heard SO much about you.`,
    `I'm your steed for this quest. Before we ride… may I have a head scratch? It's tradition.`,
  ]);
}

function initSheet() {
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
        ["Patience", "100", "Required for dating him."],
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

  document.querySelectorAll("[data-class]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.steedClass = btn.dataset.class;
      saveState();
      $("classChosen").textContent = `Class chosen: ${state.steedClass}. Title added to your decree.`;
      show($("btnSheetNext"));
    });
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
    if (n >= 7) return "The royal judges say… nay.";
    if (n >= 4) return "6-7?? Not in this kingdom.";
    return "Error 404: that number has been banished.";
  }

  slider?.addEventListener("input", () => {
    last = +slider.value;
    $("ratingValue").textContent = slider.value;
    cap.textContent = caption(last);
  });

  const spring = () => {
    slider.value = "10";
    $("ratingValue").textContent = "10";
    cap.textContent = caption(10);
    slider.classList.add("boing");
    setTimeout(() => slider.classList.remove("boing"), 500);
    if (!bonusShown) {
        bonusShown = true;
      show(chip11);
      show($("ratingChips"));
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
      cap.textContent = "Re-rated: still a 10.";
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

export function fitDragonArena() {
  const arena = $("dateButtons");
  const honestWrap = document.querySelector(".dragon-honest-wrap");
  if (!arena) return;
  const top = arena.getBoundingClientRect().top;
  const safeBottom = 10;
  const honestReserve = Math.max(honestWrap?.offsetHeight || 0, 44) + 10;
  const maxBottom = window.innerHeight - honestReserve - safeBottom;
  const h = Math.max(84, Math.min(132, maxBottom - top));
  arena.style.height = `${h}px`;
  arena.style.minHeight = `${h}px`;
}

function capYesScale(btnYes, arena, scale) {
  const arenaW = arena?.clientWidth || window.innerWidth;
  const baseW = btnYes?.offsetWidth || 1;
  const maxByArena = (arenaW - 12) / baseW;
  const maxByViewport = (window.innerWidth - 16) / baseW;
  return Math.min(scale, YES_SCALE_MAX, maxByArena, maxByViewport);
}

function placeNayBelowYes(btnYes, btnNo, arena) {
  if (!btnYes || !btnNo || !arena) return;
  btnYes.style.position = "relative";
  btnYes.style.zIndex = "2";
  btnNo.style.position = "absolute";
  btnNo.style.zIndex = "6";
  btnNo.style.width = "auto";
  btnNo.classList.remove("hidden");
  void btnYes.offsetHeight;
  const arenaRect = arena.getBoundingClientRect();
  const yesRect = btnYes.getBoundingClientRect();
  const pad = 10;
  const yesBottom = yesRect.bottom - arenaRect.top;
  const noH = btnNo.offsetHeight * noScale;
  const noW = btnNo.offsetWidth * noScale;
  const maxTop = Math.max(pad, arena.clientHeight - noH - pad);
  const top = Math.min(Math.max(yesBottom + pad, pad), maxTop);
  const maxLeft = Math.max(pad, arena.clientWidth - noW - pad);
  const left = Math.min(Math.max(arena.clientWidth * 0.52, pad), maxLeft);
  btnNo.style.left = `${left}px`;
  btnNo.style.top = `${top}px`;
}

function ensureDragonAboveFold() {
  const wrap = document.querySelector(".dragon-honest-wrap");
  const arena = $("dateButtons");
  const btnYes = $("btnYes");
  const btnNo = $("btnNo");
  if (!wrap || !arena) return;
  let guard = 0;
  while (wrap.getBoundingClientRect().bottom > window.innerHeight - 8 && guard++ < 8) {
    const h = Math.max(72, arena.clientHeight - 12);
    arena.style.height = `${h}px`;
    arena.style.minHeight = `${h}px`;
    placeNayBelowYes(btnYes, btnNo, arena);
  }
}

function initDragon() {
  const btnNo = $("btnNo");
  const btnYes = $("btnYes");
  const arena = $("dateButtons");
  const hp = $("dragonHp");
  let hpVal = 100;

  function layoutDragon() {
    fitDragonArena();
    btnYes.style.transform = yesScale === 1 ? "" : `scale(${yesScale})`;
    btnNo.style.transform = noScale === 1 ? "" : `scale(${noScale})`;
    placeNayBelowYes(btnYes, btnNo, arena);
    ensureDragonAboveFold();
  }

  syncDragonLayout = layoutDragon;
  enterDragonScreen = () => {
    if (state.noAttempts === 0) {
      yesScale = 1;
      noScale = 1;
      hpVal = 100;
      if (hp) hp.style.width = "100%";
      btnNo.textContent = NO_LABELS[0];
    }
    hide($("realNoLink"));
    hide($("yesToast"));
    $("dragonScene")?.classList.remove("dragon-win");
    if ($("dragonImg")) $("dragonImg").src = "assets/images/dragon-doubt.webp";
    btnNo.classList.remove("hidden");
    layoutDragon();
  };

  function dodge(e) {
    e?.preventDefault();
    e?.stopPropagation();
    state.noAttempts++;
    hpVal = Math.min(100, hpVal + 5);
    if (hp) hp.style.width = hpVal + "%";
    saveState();
    noScale = Math.max(0.55, noScale * 0.88);
    yesScale = capYesScale(btnYes, arena, yesScale * 1.12);
    const i = Math.min(state.noAttempts, NO_LABELS.length) - 1;
    btnNo.textContent = (NO_LABELS[i] || "nay").replace("{steed}", state.steedName);

    btnYes.style.transform = `scale(${yesScale})`;
    btnNo.style.transform = `scale(${noScale})`;
    void btnYes.offsetHeight;

    const pad = 10;
    const arenaW = arena?.clientWidth || 300;
    const arenaH = arena?.clientHeight || 220;
    const arenaRect = arena.getBoundingClientRect();
    const yesRect = btnYes.getBoundingClientRect();
    const yesBottom = yesRect.bottom - arenaRect.top;
    const noW = btnNo.offsetWidth * noScale;
    const noH = btnNo.offsetHeight * noScale;
    const minY = yesBottom + pad;
    const maxY = Math.max(minY, Math.min(arenaH - noH - pad, arenaH - noH - pad));
    const maxX = Math.max(pad, arenaW - noW - pad);
    let x = pad;
    let y = minY;
    for (let t = 0; t < 24; t++) {
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

    btnNo.style.position = "absolute";
    btnNo.style.left = `${x}px`;
    btnNo.style.top = `${y}px`;

    if (state.noAttempts >= 7) {
      show($("realNoLink"));
      ensureDragonAboveFold();
    }
    if (state.noAttempts >= 3) unlock("stubborn");
  }

  btnNo?.addEventListener("pointerdown", dodge, { passive: false });
  btnYes?.addEventListener("click", () => {
    state.secondDate = "yes";
    state.honestNo = false;
    saveState();
    $("dragonScene")?.classList.add("dragon-win");
    $("dragonImg").src = "assets/images/dragon-befriended.webp";
    $("horseQuestImg").src = "assets/images/horse-rear.webp";
    $("horseQuest")?.classList.add("horse-mascot--hop");
    hide($("realNoLink"));
    hide(btnNo);
    unlock("dragon");
    burstHearts(window.innerWidth / 2, window.innerHeight / 2);
    vibrate([60, 30, 120]);
    show($("yesToast"));
    setTimeout(() => navigate("tavern"), 1400);
  });

  $("realNoLink")?.addEventListener("click", () => {
    state.honestNo = true;
    state.secondDate = "no";
    saveState();
    navigate("honest-no");
  });

  window.addEventListener("resize", () => {
    if (document.body.dataset.screen === "dragon") syncDragonLayout();
  });
}

function initHonest() {
  $("btnHonestContinue")?.addEventListener("click", () => {
    state.secondDate = "yes";
    saveState();
    navigate("tavern");
  });
  onEnterHonest = () => {};
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
    stirCount++;
    $("btnStir").textContent = stirCount < 3 ? `Stir (${stirCount}/3)` : "Bottle it →";
    if (stirCount >= 3) {
      const essence = activityEssence(state.activities[0]);
      state.potionName = `Elixir of ${state.potionBase || "Moonlight Dew"} & ${essence}`;
      unlock("alchemist");
      show($("potionResult"));
      $("potionResult").textContent = `${state.potionName}. Side effects: giggling, holding hands, losing track of time.`;
      $("btnStir").textContent = "Continue →";
      setTimeout(() => navigate("stars"), 400);
    }
  });
}

function initStars() {
  const days = [
    "This Friday eve",
    "This Saturday",
    "This Sunday",
    "Next week (playing hard to get)",
    "Consult the calendar",
  ];
  const dayWrap = $("dayChips");
  days.forEach((label, i) => {
    const c = document.createElement("button");
    c.type = "button";
    c.className = "chip-select";
    c.textContent = label;
    c.addEventListener("click", () => {
      if (i === 4) {
        show($("datePicker"));
        return;
      }
      state.day = label;
      saveState();
    });
    dayWrap?.appendChild(c);
  });

  $("datePicker")?.addEventListener("change", (e) => {
    state.day = e.target.value;
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
    saveState();
  });

  $("btnCoin")?.addEventListener("click", () => {
    unlock("fate");
    $("coinMsg")?.classList.remove("hidden");
  });

  $("btnSealDate")?.addEventListener("click", () => {
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
        navigate("oracle");
      }
    }, 1000);
  });
}

function initOracle() {
  const cards = document.querySelectorAll(".tarot-card");
  const names = {
    steeds: "The Two Steeds",
    golden: "The Golden Hour",
    hearth: "The Hearth",
  };
  cards.forEach((card) => {
    card.addEventListener("click", () => {
      unlock("fortune");
      state.tarotCard = names[card.dataset.card] || card.dataset.card;
      saveState();
      document.querySelectorAll(".tarot-card").forEach((c) => c.classList.add("flipped"));
      show($("btnOpenLetter"));
    });
  });

  $("btnOpenLetter")?.addEventListener("click", () => {
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
  el.addEventListener("click", () => {
    el.textContent = full;
    clearInterval(iv);
  });
}

function initDecree() {
  $("btnShare")?.addEventListener("click", () => shareDecree());
  $("btnSavePng")?.addEventListener("click", () => downloadDecreePng());
  $("btnCopy")?.addEventListener("click", async () => {
    await navigator.clipboard.writeText(buildSummaryText());
    show($("copyToast"));
  });
  $("btnReplay")?.addEventListener("click", () => {
    resetState();
    const base = location.pathname + (location.search || "");
    location.replace(base);
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
    "Cozy night in": "Hearth Warmth",
  };
  return map[activity] || "Adventure";
}

export function onScreenEnter(id) {
  if (id === "honest-no") onEnterHonest();
  if (id === "dragon") {
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => enterDragonScreen()));
  }
  if (id === "decree") {
    unlock("heart", true);
    $("decreePreview").textContent = buildSummaryText();
    boostEmbers();
    playStamp();
    $("waxStampAnim")?.classList.add("stamped");
  }
  if (id === "steed") onEnterSteed();
  if (id === "oracle") hydrateLazyImages(document.querySelector('[data-screen="oracle"]'));
}
