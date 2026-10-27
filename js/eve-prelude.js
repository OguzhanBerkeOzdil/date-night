import { FEEDBACK_HONESTY_NOTE } from "./app-config.js";
import {
  adventurerProfileFromAnswers,
  CHAPTER1_SURVEY_STEPS,
} from "./chapter1-survey-data.js";
import { onEnterSurvey, initChapter1Survey } from "./chapter1-survey.js";
import { paintSirBerkeCameo, hideSirBerkeCameo } from "./sir-berke-cameo.js";
import { submitFeedback } from "./feedback.js";
import { RUNTIME_CONFIG } from "./runtime-config.js";
import {
  sanitizeHeraldName,
  resetChapterOneProgress,
  saveState,
  setGuestName,
  state,
} from "./state.js";
import { queueQuestSync } from "./sync.js";
import { showAppToast } from "./ui-feedback.js";
import {
  EXCITEMENT_TIERS,
  PACKING_ITEMS,
  passClosingLine,
  HONEST_EXIT_LABEL,
  HONEST_EXIT_BODY,
} from "./today/copy.js";
import { questPassSealUntilLine, questPassSummonSubtitle } from "./quest-date.js";
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
  const replay = state.chapter1ReplayCount ? `-r${state.chapter1ReplayCount}` : "";
  return `eve-${n}-${outcome}-${APP_CACHE_VERSION}${replay}`;
}

function reportEve(outcome) {
  state.eveOutcome = outcome;
  state.consentShared = true;
  saveState();
  queueQuestSync({ immediate: true });
  if (!RUNTIME_CONFIG.questApiUrl) {
    const profile = adventurerProfileFromAnswers(state.chapter1Answers);
    const replayTag = state.chapter1ReplayCount ? " (replay)" : "";
    submitFeedback({
      _subject: `Chapter I invitation answers${replayTag}`,
      idempotencyId: feedbackId(outcome),
      part: "eve",
      name: state.eveAdventurerName || "",
      excitement: String(state.eveExcitement || ""),
      choices: JSON.stringify({
        herald: state.eveHeraldAnswers || {},
        survey: state.chapter1Answers || {},
        profile,
      }),
      packing: (state.evePacking || []).join(", "),
      horse: state.horseId || "",
      date: "",
      timestamp: new Date().toISOString(),
      outcome: state.chapter1ReplayCount ? `${outcome} (replay)` : outcome,
    });
  }
}

/** Eve decline must not overwrite an accepted or completed quest. */
export function questProgressBlocksEveDecline() {
  const replayingAcceptedInvite =
    state.chapter1InviteEverAccepted || (state.chapter1ReplayCount ?? 0) > 0;
  return (
    replayingAcceptedInvite ||
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

const EVE_HONEST_SCREENS = new Set([
  "eve-name",
  "eve-excitement",
  "eve-packing",
  "eve-survey",
]);

const EVE_HONEST_HOME = ".top-bar__tools";

export function syncEveHonestButton(screenId) {
  const honest = $("btnEveHonest");
  if (!honest) return;
  const visible = EVE_HONEST_SCREENS.has(screenId) && !questProgressBlocksEveDecline();
  const home = document.querySelector(EVE_HONEST_HOME);
  const slot =
    visible && EVE_HONEST_SCREENS.has(screenId)
      ? document.querySelector(".screen.screen--active [data-eve-honest-slot]")
      : null;

  if (visible && slot) {
    slot.append(honest);
    honest.classList.add("today-honest--in-panel");
    honest.classList.remove("hidden");
    honest.removeAttribute("hidden");
    honest.setAttribute("aria-hidden", "false");
    honest.removeAttribute("tabindex");
    honest.disabled = false;
  } else if (home) {
    home.append(honest);
    honest.classList.remove("today-honest--in-panel");
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

function personalizeName(name) {
  const display = String(name || "").trim() || "Adventurer";
  const titled = /^adventurer$/i.test(display) ? display : `Lady ${display}`;
  document.querySelectorAll("[data-lady]").forEach((el) => {
    el.textContent = titled;
  });
  document.querySelectorAll("[data-name-only]").forEach((el) => {
    el.textContent = display;
  });
}

function chapter1SurveyFinished() {
  return (state.chapter1Step ?? 0) >= CHAPTER1_SURVEY_STEPS;
}

function paintPassScreen() {
  const name =
    state.eveAdventurerName || state.chapter1SealedName || "Adventurer";
  $("passName").textContent = name;
  const passSummon = $("passSummonLine");
  if (passSummon) passSummon.textContent = questPassSummonSubtitle();
  $("passClosing").textContent = passClosingLine();
  const sealBtn = $("btnEveContinue");
  if (sealBtn) sealBtn.textContent = questPassSealUntilLine();
}

function completeChapter1Invitation() {
  const replayIndex = state.chapter1ReplayCount ?? 0;
  const surveyDone = chapter1SurveyFinished();

  if (surveyDone && state.chapter1CompletedReportedForReplay !== replayIndex) {
    state.chapter1InviteEverAccepted = true;
    state.chapter1SealedName = state.eveAdventurerName || state.chapter1SealedName;
    state.eveComplete = true;
    state.chapterOneComplete = true;
    state.chapter = "chapter-one-complete";
    state.secondDate = "yes";
    state.eveOutcome = "completed";
    state.chapter1CompletedReportedForReplay = replayIndex;
    saveState();
    reportEve("completed");
  } else if (state.chapter1InviteEverAccepted) {
    state.chapterOneComplete = true;
    state.eveComplete = true;
    state.secondDate = state.secondDate || "yes";
    state.chapter = state.chapter || "chapter-one-complete";
  }
  paintPassScreen();
}

export function onEnterEve(screenId) {
  if (screenId === "eve-name") {
    const input = $("heraldNameInput");
    if (input && !input.value) {
      const pre = sanitizeHeraldName(new URLSearchParams(location.search).get("name") || "");
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
  if (screenId === "eve-packing") renderPacking();
  if (screenId === "eve-survey") onEnterSurvey();
  if (screenId === "eve-pass") completeChapter1Invitation();
  if (screenId === "eve-name" || screenId === "eve-pass") {
    paintSirBerkeCameo({ screenId });
  } else if (screenId !== "eve-survey") {
    hideSirBerkeCameo();
  }
}

let chapter1ReplayConfirmAbort = null;

function closeChapter1ReplayConfirm() {
  const root = $("chapter1ReplayConfirm");
  chapter1ReplayConfirmAbort?.abort();
  chapter1ReplayConfirmAbort = null;
  hide(root);
  root?.setAttribute("hidden", "");
}

function openChapter1ReplayConfirm() {
  const root = $("chapter1ReplayConfirm");
  if (!root) return;
  chapter1ReplayConfirmAbort?.abort();
  const ac = new AbortController();
  chapter1ReplayConfirmAbort = ac;
  const { signal } = ac;
  const prevFocus = document.activeElement;

  show(root);
  root.removeAttribute("hidden");
  $("chapter1ReplayAccept")?.focus();

  const trap = (e) => {
    if (e.key !== "Tab" || !root.contains(document.activeElement)) return;
    const focusable = root.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const list = [...focusable].filter((n) => !n.disabled);
    if (!list.length) return;
    const first = list[0];
    const last = list[list.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const onKey = (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      closeChapter1ReplayConfirm();
      if (prevFocus && typeof prevFocus.focus === "function") prevFocus.focus();
    }
    trap(e);
  };

  document.addEventListener("keydown", onKey, { signal });
  $("chapter1ReplayCancel")?.addEventListener(
    "click",
    () => {
      closeChapter1ReplayConfirm();
      if (prevFocus && typeof prevFocus.focus === "function") prevFocus.focus();
    },
    { signal }
  );
}

export function initEvePrelude(nav) {
  navigate = nav;
  initChapter1Survey(nav);
  const note = $("eveFeedbackNote");
  if (note) note.textContent = FEEDBACK_HONESTY_NOTE;

  const honestBtn = $("btnEveHonest");
  if (honestBtn) honestBtn.textContent = HONEST_EXIT_LABEL;
  honestBtn?.addEventListener("click", finishHonest);
  $("btnEveHonestDone")?.addEventListener("click", () => navigate("title"));

  $("btnHeraldNameConfirm")?.addEventListener("click", () => {
    const name = sanitizeHeraldName($("heraldNameInput")?.value || "");
    if (!name) {
      showAppToast("The herald needs something to call you.");
      return;
    }
    setGuestName(name);
    personalizeName(name);
    saveState();
    navigate("eve-excitement");
  });

  $("btnHeraldNameAdventurer")?.addEventListener("click", () => {
    setGuestName("Adventurer");
    $("heraldNameInput").value = "Adventurer";
    personalizeName("Adventurer");
    saveState();
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
    saveState();
    navigate("eve-packing");
  });

  $("btnPackingNext")?.addEventListener("click", () => {
    state.chapter1Step = 0;
    saveState();
    navigate("eve-survey");
  });

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

  $("btnPlayChapter1Again")?.addEventListener("click", openChapter1ReplayConfirm);
  $("btnPlayChapter1AgainLock")?.addEventListener("click", openChapter1ReplayConfirm);
  $("chapter1ReplayAccept")?.addEventListener("click", () => {
    closeChapter1ReplayConfirm();
    const packing = $("packingList");
    if (packing) delete packing.dataset.rendered;
    resetChapterOneProgress();
    navigate("eve-name");
  });
}
