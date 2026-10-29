import { adventurerProfileFromAnswers } from "./chapter1-survey-data.js?v=20261211";
import { RUNTIME_CONFIG } from "./runtime-config.js?v=20261211";
import { submitFeedback } from "./feedback.js?v=20261211";
import { adventurerDisplayName } from "./chapter2-callbacks.js?v=20261211";

function guestSlug(state) {
  return adventurerDisplayName(state).replace(/\s+/g, "-").toLowerCase();
}

function replaySuffix(state) {
  const n = state.chapter1ReplayCount || 0;
  return n > 0 ? `-r${n}` : "";
}

export function chapter1FeedbackContext(state) {
  return {
    survey: state.chapter1Answers || {},
    legacyChoices: state.eveHeraldAnswers || {},
    excitement: state.eveExcitement,
    packing: state.evePacking || [],
    horsePreset: state.horseId || "",
    profile: adventurerProfileFromAnswers(state.chapter1Answers),
  };
}

/** Snapshot of Chapter II player choices for FormSubmit (JSON in `choices`). */
export function buildChapter2ChoicesSnapshot(state) {
  return {
    chapter1: chapter1FeedbackContext(state),
    steed: {
      horseId: state.horseId,
      steedName: state.steedName,
      steedClass: state.steedClass,
      steedClassPicked: state.steedClassPicked,
    },
    journal: state.todayVibe,
    dragon: state.dragonChoice,
    tavern: { food: state.food, activities: state.activities },
    potion: {
      potionBase: state.potionBase,
      potionName: state.potionName,
      vibe: state.vibe,
      notes: state.notes,
    },
    stars: { day: state.day, time: state.time, fanumTax: state.fanumTax },
    oracle: { tarotKey: state.tarotKey, tarotCard: state.tarotCard },
    rating: {
      value: state.rating,
      chip: state.ratingChip,
      bonus: state.ratingBonus,
    },
    achievements: state.achievements || [],
  };
}

export function buildChapter2CompletionFeedbackPayload(state) {
  return {
    _subject: "Chapter II campfire debrief",
    idempotencyId: chapter2CompletionFeedbackId(state),
    part: "completion",
    name: adventurerDisplayName(state),
    excitement: String(state.eveExcitement ?? ""),
    packing: (state.evePacking || []).join(", "),
    choices: JSON.stringify({
      ...buildChapter2ChoicesSnapshot(state),
      debrief: {
        favoriteMoment: state.favoriteMoment,
        questBadge: state.questBadge,
        futureQuest: state.futureQuest,
        partyBuff: state.partyBuff,
      },
    }),
    horse: state.horseId || "",
    steedName: state.steedName || "",
    timestamp: new Date().toISOString(),
    outcome: "quest-complete",
  };
}

export function reportChapter2CompletionFeedback(state, saveState) {
  if (RUNTIME_CONFIG.questApiUrl) return Promise.resolve({ status: "external" });
  return submitFeedback(buildChapter2CompletionFeedbackPayload(state)).then((result) => {
    state.feedbackCompleteStatus = result.status;
    state.feedbackCompleteSent = ["sent", "duplicate"].includes(result.status);
    saveState();
    return result;
  });
}

export function chapter2CompletionFeedbackId(state) {
  return `ch2-complete-${guestSlug(state)}${replaySuffix(state)}`;
}

export function reportChapter2HonestNoFeedback(state, saveState) {
  if (RUNTIME_CONFIG.questApiUrl) return;
  if (state.feedbackHonestCh2Sent) return;
  state.feedbackHonestCh2Sent = true;
  saveState();
  submitFeedback({
    _subject: "Chapter II honest decline (dragon)",
    idempotencyId: `ch2-honest-${guestSlug(state)}${replaySuffix(state)}`,
    part: "honest",
    name: adventurerDisplayName(state),
    excitement: String(state.eveExcitement ?? ""),
    packing: (state.evePacking || []).join(", "),
    choices: JSON.stringify({
      chapter1: chapter1FeedbackContext(state),
      journal: state.todayVibe,
      dragon: "no",
    }),
    horse: state.horseId || "",
    steedName: state.steedName || "",
    timestamp: new Date().toISOString(),
    outcome: "honest-no",
  });
}
