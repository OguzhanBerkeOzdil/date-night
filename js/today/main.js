import { FEEDBACK_HONESTY_NOTE } from "../app-config.js";
import { flushFeedbackQueue, submitFeedback } from "../feedback.js";
import { sanitizeGuestName } from "../state.js";
import { loadSoundPref, setSoundOn, isSoundOn, unlockAudio, ensureBackgroundMusic } from "../audio.js";
import { showAppToast } from "../ui-feedback.js";
import {
  OWL_INTRO,
  owlWelcome,
  EXCITEMENT_TIERS,
  HERALD_QUESTIONS,
  PACKING_ITEMS,
  passClosingLine,
  passTitleLine,
  HONEST_EXIT_LABEL,
  HONEST_EXIT_BODY,
} from "./copy.js?v=20261213";
import { downloadQuestPassPng } from "./pass.js?v=20261213";
import { APP_CACHE_VERSION } from "../cache-version.js";
import { chapterOneIsArchived } from "../quest-phase.js";

const state = {
  name: "",
  excitement: 3,
  heraldAnswers: {},
  packingChecked: [],
  outcome: "",
};

function $(id) {
  return document.getElementById(id);
}

function showScreen(id) {
  document.querySelectorAll(".today-screen").forEach((el) => {
    el.classList.toggle("today-screen--active", el.dataset.screen === id);
  });
  document.body.dataset["screen"] = id;
}

function excitementReaction(level) {
  const tier = EXCITEMENT_TIERS.find((t) => level <= t.max) || EXCITEMENT_TIERS.at(-1);
  return tier.text;
}

function heraldIndex() {
  const answered = Object.keys(state.heraldAnswers).length;
  return Math.min(answered, HERALD_QUESTIONS.length - 1);
}

function renderHerald() {
  const q = HERALD_QUESTIONS[heraldIndex()];
  if (!q) return;
  $("heraldPrompt").textContent = q.prompt;
  const row = $("heraldChoices");
  row.innerHTML = "";
  q.choices.forEach((ch) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn btn--secondary today-choice";
    btn.textContent = ch.label;
    btn.addEventListener("click", () => {
      state.heraldAnswers[q.id] = ch.id;
      $("heraldReaction").textContent = q.reactions[ch.id] || "Noted!";
      show($("heraldReaction"));
      if (Object.keys(state.heraldAnswers).length >= HERALD_QUESTIONS.length) {
        show($("btnHeraldNext"));
      } else {
        setTimeout(() => renderHerald(), 600);
      }
    });
    row.appendChild(btn);
  });
}

function renderPacking() {
  const list = $("packingList");
  if (!list || list.dataset.rendered) return;
  list.dataset.rendered = "1";
  PACKING_ITEMS.forEach((item) => {
    const label = document.createElement("label");
    label.className = "today-pack-item" + (item.joke ? "" : " today-pack-item--real");
    const input = document.createElement("input");
    input.type = "checkbox";
    input.value = item.id;
    input.addEventListener("change", () => {
      if (input.checked) state.packingChecked.push(item.id);
      else state.packingChecked = state.packingChecked.filter((x) => x !== item.id);
    });
    const span = document.createElement("span");
    span.textContent = item.label;
    label.append(input, span);
    list.appendChild(label);
  });
}

function show(el) {
  el?.classList.remove("hidden");
}

function hide(el) {
  el?.classList.add("hidden");
}

function feedbackId(outcome) {
  const n = state.name.replace(/\s+/g, "-").toLowerCase() || "guest";
  return `eve-${n}-${outcome}-${APP_CACHE_VERSION}`;
}

function sendFeedback(outcome) {
  state.outcome = outcome;
  submitFeedback({
    _subject: "Eve of the Quest answers",
    idempotencyId: feedbackId(outcome),
    part: "eve",
    name: state.name,
    excitement: String(state.excitement),
    choices: JSON.stringify(state.heraldAnswers),
    packing: state.packingChecked.join(", "),
    horse: "",
    date: "",
    timestamp: new Date().toISOString(),
    outcome,
  });
}

function finishHonest() {
  sendFeedback("honest-no");
  $("honestBody").textContent = HONEST_EXIT_BODY;
  showScreen("honest");
}

function finishPass() {
  sendFeedback("completed");
  $("passName").textContent = state.name;
  const passSummon = $("passSummonLine");
  if (passSummon) passSummon.textContent = passTitleLine();
  $("passClosing").textContent = passClosingLine();
  showScreen("pass");
}

function initGate() {
  const params = new URLSearchParams(location.search);
  const pre = sanitizeGuestName(params.get("name") || "");
  const input = $("guestNameInput");
  if (pre && input) input.value = pre;
  $("owlLine").textContent = OWL_INTRO;
  $("btnGateNext")?.addEventListener("click", () => {
    const name = sanitizeGuestName(input?.value || "");
    if (!name) {
      showAppToast("The owl needs a name. Any name.");
      return;
    }
    state.name = name;
    $("owlLine").textContent = owlWelcome(name);
    showScreen("excitement");
  });
}

function initExcitement() {
  const slider = $("excitementSlider");
  const out = $("excitementReaction");
  const sync = () => {
    state.excitement = Number(slider.value);
    out.textContent = excitementReaction(state.excitement);
  };
  slider?.addEventListener("input", sync);
  sync();
  $("btnExcitementNext")?.addEventListener("click", () => {
    showScreen("herald");
    hide($("heraldReaction"));
    hide($("btnHeraldNext"));
    state.heraldAnswers = {};
    renderHerald();
  });
}

function initHerald() {
  $("btnHeraldNext")?.addEventListener("click", () => {
    showScreen("packing");
    renderPacking();
  });
}

function initPacking() {
  $("btnPackingNext")?.addEventListener("click", () => finishPass());
}

function initPass() {
  $("btnSavePass")?.addEventListener("click", async () => {
    try {
      await downloadQuestPassPng(state.name);
    } catch {
      showAppToast("Couldn't save the pass — try again.");
    }
  });
}

function initHonest() {
  const sticky = $("stickyHonestExit");
  if (sticky) sticky.textContent = HONEST_EXIT_LABEL;
  sticky?.addEventListener("click", finishHonest);
}

function initSound() {
  loadSoundPref();
  const btn = $("btnSoundToday");
  const sync = () => {
    if (btn) btn.textContent = isSoundOn() ? "🔊" : "🔇";
  };
  sync();
  btn?.addEventListener("click", () => {
    unlockAudio();
    setSoundOn(!isSoundOn());
    ensureBackgroundMusic();
    sync();
  });
}

function boot() {
  if (chapterOneIsArchived()) {
    window.location.replace("../");
    return;
  }
  flushFeedbackQueue();
  $("feedbackNote").textContent = FEEDBACK_HONESTY_NOTE;
  initSound();
  initHonest();
  initGate();
  initExcitement();
  initHerald();
  initPacking();
  initPass();
  showScreen("gate");
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
else boot();

window.__todayShowScreen = showScreen;
