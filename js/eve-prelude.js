import { FEEDBACK_HONESTY_NOTE } from "./app-config.js";
import { submitFeedback } from "./feedback.js";
import { RUNTIME_CONFIG } from "./runtime-config.js";
import { sanitizeGuestName, saveState, setGuestName, state } from "./state.js";
import { queueQuestSync } from "./sync.js";
import { showAppToast } from "./ui-feedback.js";
import {
  OWL_INTRO,
  owlWelcome,
  EXCITEMENT_TIERS,
  HERALD_QUESTIONS,
  PACKING_ITEMS,
  PASS_CLOSING,
  HONEST_EXIT_LABEL,
  HONEST_EXIT_BODY,
} from "./today/copy.js";
import { downloadQuestPassPng } from "./today/pass.js";
import { APP_CACHE_VERSION } from "./cache-version.js";

let navigate;

function $(id) {
  return document.getElementById(id);
}

function show(el) {
  el?.classList.remove("hidden");
}

function hide(el) {
  el?.classList.add("hidden");
}

function excitementReaction(level) {
  const tier = EXCITEMENT_TIERS.find((t) => level <= t.max) || EXCITEMENT_TIERS.at(-1);
  return tier.text;
}

function heraldIndex() {
  const answered = Object.keys(state.eveHeraldAnswers || {}).length;
  return Math.min(answered, HERALD_QUESTIONS.length - 1);
}

function renderHerald() {
  const q = HERALD_QUESTIONS[heraldIndex()];
  if (!q) return;
  $("heraldPrompt").textContent = q.prompt;
  const row = $("heraldChoices");
  if (!row) return;
  row.innerHTML = "";
  q.choices.forEach((ch) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn btn--secondary today-choice";
    btn.textContent = ch.label;
    btn.addEventListener("click", () => {
      state.eveHeraldAnswers = { ...state.eveHeraldAnswers, [q.id]: ch.id };
      saveState();
      $("heraldReaction").textContent = q.reactions[ch.id] || "Noted!";
      show($("heraldReaction"));
      if (Object.keys(state.eveHeraldAnswers).length >= HERALD_QUESTIONS.length) {
        show($("btnHeraldNext"));
      } else {
        window.setTimeout(() => renderHerald(), 600);
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
      const checked = state.evePacking || [];
      if (input.checked) state.evePacking = [...checked, item.id];
      else state.evePacking = checked.filter((x) => x !== item.id);
      saveState();
    });
    const span = document.createElement("span");
    span.textContent = item.label;
    label.append(input, span);
    list.appendChild(label);
  });
}

function feedbackId(outcome) {
  const n = (state.eveAdventurerName || "guest").replace(/\s+/g, "-").toLowerCase();
  return `eve-${n}-${outcome}-${APP_CACHE_VERSION}`;
}

function reportEve(outcome) {
  state.eveOutcome = outcome;
  state.consentShared = true;
  saveState();
  queueQuestSync({ immediate: true });
  if (!RUNTIME_CONFIG.questApiUrl) {
    submitFeedback({
      _subject: "Eve of the Quest answers",
      idempotencyId: feedbackId(outcome),
      part: "eve",
      name: state.eveAdventurerName || "",
      excitement: String(state.eveExcitement || ""),
      choices: JSON.stringify(state.eveHeraldAnswers || {}),
      packing: (state.evePacking || []).join(", "),
      horse: state.horseId || "",
      date: "",
      timestamp: new Date().toISOString(),
      outcome,
    });
  }
}

/** Eve decline must not overwrite an accepted or completed quest. */
export function questProgressBlocksEveDecline() {
  return (
    state.chapterOneComplete ||
    state.chapterTwoStarted ||
    state.chapterTwoComplete ||
    state.honestNo ||
    state.chapter === "declined" ||
    state.secondDate === "yes" ||
    state.secondDate === "maybe" ||
    (state.eveComplete && state.eveOutcome === "completed")
  );
}

const EVE_HONEST_SCREENS = new Set(["eve-gate", "eve-excitement", "eve-herald", "eve-packing"]);

/** Keep the sticky honest control scoped to Eve prelude screens only. */
export function syncEveHonestButton(screenId) {
  const honest = $("btnEveHonest");
  if (!honest) return;
  const visible = EVE_HONEST_SCREENS.has(screenId) && !questProgressBlocksEveDecline();
  honest.classList.toggle("hidden", !visible);
  if (visible) {
    honest.removeAttribute("hidden");
    honest.setAttribute("aria-hidden", "false");
    honest.removeAttribute("tabindex");
    honest.disabled = false;
  } else {
    honest.setAttribute("hidden", "");
    honest.setAttribute("aria-hidden", "true");
    honest.setAttribute("tabindex", "-1");
    honest.disabled = true;
  }
}

function finishHonest() {
  if (questProgressBlocksEveDecline()) return;
  state.honestNo = true;
  state.chapter = "declined";
  reportEve("honest-no");
  const body = $("eveHonestBody");
  if (body) body.textContent = HONEST_EXIT_BODY;
  navigate("eve-honest");
}

function finishPass() {
  state.eveComplete = true;
  state.chapterOneComplete = true;
  state.chapter = "chapter-one-complete";
  state.secondDate = "yes";
  reportEve("completed");
  const name = state.eveAdventurerName || "Adventurer";
  $("passName").textContent = name;
  $("passClosing").textContent = PASS_CLOSING;
  navigate("eve-pass");
}

export function onEnterEve(screenId) {
  if (screenId === "eve-gate") {
    $("owlLine").textContent = OWL_INTRO;
    const input = $("guestNameInput");
    if (input && !input.value) {
      const pre = sanitizeGuestName(new URLSearchParams(location.search).get("name") || "");
      if (pre) input.value = pre;
    }
  }
  if (screenId === "eve-excitement") {
    const slider = $("excitementSlider");
    const out = $("excitementReaction");
    if (slider && out) {
      slider.value = String(state.eveExcitement || 3);
      out.textContent = excitementReaction(Number(slider.value));
    }
  }
  if (screenId === "eve-herald") {
    hide($("heraldReaction"));
    hide($("btnHeraldNext"));
    if (!state.eveHeraldAnswers || !Object.keys(state.eveHeraldAnswers).length) {
      state.eveHeraldAnswers = {};
      renderHerald();
    } else {
      renderHerald();
    }
  }
  if (screenId === "eve-packing") renderPacking();
}

export function initEvePrelude(nav) {
  navigate = nav;
  const note = $("eveFeedbackNote");
  if (note) note.textContent = FEEDBACK_HONESTY_NOTE;

  const honestBtn = $("btnEveHonest");
  if (honestBtn) honestBtn.textContent = HONEST_EXIT_LABEL;
  honestBtn?.addEventListener("click", finishHonest);
  $("btnEveHonestDone")?.addEventListener("click", () => navigate("title"));

  $("btnGateNext")?.addEventListener("click", () => {
    const name = sanitizeGuestName($("guestNameInput")?.value || "");
    if (!name) {
      showAppToast("The owl needs a name. Any name.");
      return;
    }
    setGuestName(name);
    saveState();
    document.querySelectorAll("[data-lady]").forEach((el) => {
      el.textContent = `Lady ${name}`;
    });
    document.querySelectorAll("[data-name-only]").forEach((el) => {
      el.textContent = name;
    });
    $("owlLine").textContent = owlWelcome(name);
    navigate("eve-excitement");
  });

  const slider = $("excitementSlider");
  const out = $("excitementReaction");
  const syncExcitement = () => {
    state.eveExcitement = Number(slider?.value || 3);
    if (out) out.textContent = excitementReaction(state.eveExcitement);
    saveState();
  };
  slider?.addEventListener("input", syncExcitement);

  $("btnExcitementNext")?.addEventListener("click", () => {
    syncExcitement();
    state.eveHeraldAnswers = {};
    saveState();
    navigate("eve-herald");
  });

  $("btnHeraldNext")?.addEventListener("click", () => navigate("eve-packing"));

  $("btnPackingNext")?.addEventListener("click", () => finishPass());

  $("btnSavePass")?.addEventListener("click", async () => {
    try {
      await downloadQuestPassPng(state.eveAdventurerName || "Adventurer");
    } catch {
      showAppToast("Couldn't save the pass — try again.");
    }
  });

  $("btnEveContinue")?.addEventListener("click", () => {
    state.eveComplete = true;
    state.chapterOneComplete = true;
    state.chapter = "chapter-one-complete";
    state.secondDate = "yes";
    saveState();
    queueQuestSync({ immediate: true });
    navigate("chapter-lock");
  });
}
