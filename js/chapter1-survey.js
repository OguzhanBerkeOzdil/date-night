import { CHAPTER1_QUESTIONS, CHAPTER1_SURVEY_STEPS } from "./chapter1-survey-data.js";
import { paintSirBerkeCameo } from "./sir-berke-cameo.js";
import { saveState, state } from "./state.js";

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

function currentQuestion() {
  const step = state.chapter1Step ?? 0;
  return CHAPTER1_QUESTIONS[Math.min(step, CHAPTER1_QUESTIONS.length - 1)];
}

function sliderReaction(q, value) {
  const n = Number(value);
  for (const tier of q.reactions) {
    if (n <= tier.max) return tier.text;
  }
  return q.reactions.at(-1)?.text || "Noted.";
}

function persistAnswer(q, payload) {
  if (!state.chapter1Answers) state.chapter1Answers = {};
  state.chapter1Answers[q.id] = payload;
  saveState();
}

function advanceSurvey() {
  const next = (state.chapter1Step ?? 0) + 1;
  if (next >= CHAPTER1_SURVEY_STEPS) {
    state.chapter1Step = CHAPTER1_SURVEY_STEPS;
    saveState();
    navigate("eve-pass");
    return;
  }
  state.chapter1Step = next;
  saveState();
  paintSurveyQuestion();
}

function skipQuestion() {
  const q = currentQuestion();
  persistAnswer(q, { skipped: true, label: "Skipped" });
  advanceSurvey();
}

function selectChoice(q, ch) {
  persistAnswer(q, { id: ch.id, label: ch.label, reaction: ch.reaction });
  $("surveyReaction").textContent = ch.reaction;
  show($("surveyReaction"));
  show($("btnSurveyNext"));
}

function paintSurveyQuestion() {
  const q = currentQuestion();
  if (!q) return;
  paintSirBerkeCameo({ screenId: "eve-survey", questionId: q.id });
  const step = (state.chapter1Step ?? 0) + 1;
  const progress = $("chapter1Progress");
  if (progress) progress.textContent = `Question ${step}/${CHAPTER1_SURVEY_STEPS}`;

  const portrait = $("surveyPortrait");
  if (portrait) {
    portrait.src = q.portrait;
    portrait.alt = "";
    portrait.loading = "lazy";
  }
  $("surveyCharacter").textContent = q.character;
  $("surveyPrompt").textContent = q.prompt;
  hide($("surveyReaction"));
  hide($("btnSurveyNext"));

  const choices = $("surveyChoices");
  const sliderWrap = $("surveySliderWrap");
  const freeWrap = $("surveyFreeTextWrap");
  choices.innerHTML = "";
  choices.classList.toggle("weapon-card-grid", q.type === "weapon-cards");
  hide(sliderWrap);
  hide(freeWrap);

  if (q.type === "slider") {
    show(sliderWrap);
    const slider = $("surveySlider");
    const out = $("surveySliderReaction");
    const val = state.chapter1Answers?.[q.id]?.value ?? 100;
    if (slider) {
      slider.min = String(q.min);
      slider.max = String(q.max);
      slider.value = String(val);
      if (out) out.textContent = sliderReaction(q, val);
      slider.oninput = () => {
        if (out) out.textContent = sliderReaction(q, slider.value);
      };
    }
    const btn = $("btnSurveySliderNext");
    const fresh = btn?.cloneNode(true);
    btn?.replaceWith(fresh);
    fresh?.addEventListener("click", () => {
      const value = Number($("surveySlider")?.value || 0);
      persistAnswer(q, { value, label: `${value} ${q.unit}` });
      $("surveyReaction").textContent = sliderReaction(q, value);
      show($("surveyReaction"));
      show($("btnSurveyNext"));
    });
    return;
  }

  q.choices.forEach((ch) => {
    if (q.type === "weapon-cards") {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "weapon-card";
      btn.setAttribute("aria-label", ch.label);
      const img = document.createElement("img");
      img.className = "weapon-card__img";
      img.alt = "";
      img.loading = "lazy";
      img.src = ch.image;
      const span = document.createElement("span");
      span.className = "weapon-card__label";
      span.textContent = ch.label;
      btn.append(img, span);
      btn.addEventListener("click", () => selectChoice(q, ch));
      choices.appendChild(btn);
    } else {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn btn--secondary today-choice";
      btn.textContent = ch.label;
      btn.addEventListener("click", () => {
        if (ch.freeText) {
          show(freeWrap);
          $("surveyFreeText").value = state.chapter1Answers?.[q.id]?.freeText || "";
          $("surveyFreeText").focus();
          $("surveyPendingChoice")?.setAttribute("data-reaction", ch.reaction);
          return;
        }
        selectChoice(q, ch);
      });
      choices.appendChild(btn);
    }
  });
}

export function onEnterSurvey() {
  paintSurveyQuestion();
}

export function initChapter1Survey(nav) {
  navigate = nav;
  $("btnSurveySkip")?.addEventListener("click", skipQuestion);
  $("btnSurveyNext")?.addEventListener("click", advanceSurvey);
  $("btnSurveyFreeSubmit")?.addEventListener("click", () => {
    const q = currentQuestion();
    const text = ($("surveyFreeText")?.value || "").trim().slice(0, 80);
    const reaction = $("surveyPendingChoice")?.getAttribute("data-reaction") || "Noted!";
    persistAnswer(q, {
      id: "custom",
      label: text || "Custom answer",
      freeText: text,
      reaction,
    });
    $("surveyReaction").textContent = reaction;
    hide($("surveyFreeTextWrap"));
    show($("surveyReaction"));
    show($("btnSurveyNext"));
  });
}
