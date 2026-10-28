import { adventurerProfileFromAnswers } from "./chapter1-survey-data.js";
import { RUNTIME_CONFIG } from "./runtime-config.js";
import { submitFeedback } from "./feedback.js";

function guestSlug(state) {
  return (state.eveAdventurerName || "guest").replace(/\s+/g, "-").toLowerCase();
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

export function reportChapter2StartFeedback(state, saveState) {
  if (RUNTIME_CONFIG.questApiUrl) return;
  if (state.feedbackStartSent) return;
  state.feedbackStartSent = true;
  saveState();
  submitFeedback({
    _subject: "Chapter II field quest started",
    idempotencyId: `ch2-start-${guestSlug(state)}${replaySuffix(state)}`,
    part: "chapter-two-start",
    name: state.eveAdventurerName || "",
    excitement: String(state.eveExcitement ?? ""),
    packing: (state.evePacking || []).join(", "),
    choices: JSON.stringify({
      ...buildChapter2ChoicesSnapshot(state),
      partyBuff: state.partyBuff,
    }),
    horse: state.horseId || "",
    timestamp: new Date().toISOString(),
    outcome: "field-quest-started",
  });
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

export function reportChapter2DecreeFeedback(state, saveState) {
  if (RUNTIME_CONFIG.questApiUrl) return;
  if (state.feedbackDecreeSent) return;
  state.feedbackDecreeSent = true;
  saveState();
  submitFeedback({
    _subject: "Chapter II quest answers (decree)",
    idempotencyId: `ch2-decree-${guestSlug(state)}${replaySuffix(state)}`,
    part: "main",
    name: state.eveAdventurerName || "",
    excitement: String(state.eveExcitement ?? ""),
    packing: (state.evePacking || []).join(", "),
    choices: JSON.stringify(buildChapter2ChoicesSnapshot(state)),
    horse: state.horseId || "",
    steedName: state.steedName || "",
    date: state.day || "",
    timestamp: new Date().toISOString(),
    outcome: "decree",
  });
}

export function reportChapter2CompletionFeedback(state, saveState) {
  if (RUNTIME_CONFIG.questApiUrl) return;
  if (state.feedbackCompleteSent) return;
  state.feedbackCompleteSent = true;
  saveState();
  submitFeedback({
    _subject: "Chapter II campfire debrief",
    idempotencyId: `ch2-complete-${guestSlug(state)}${replaySuffix(state)}`,
    part: "completion",
    name: state.eveAdventurerName || "",
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
  });
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
    name: state.eveAdventurerName || "",
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
