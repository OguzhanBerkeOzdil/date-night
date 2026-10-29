import {
  chapter1Id,
  chapter1Label,
  decreeCompanionLogLine,
  geraldTollAmount,
  potionSongSideEffect,
  provisionsForDecree,
} from "./chapter2-callbacks.js?v=20261209";
import { state } from "./state.js?v=20261209";

const FALLBACK_NOTES = [
  "Gerald has filed this certificate in triplicate. He is thrilled.",
  "The Royal Goose has been notified and is furious.",
  "Valid for one adventure, one hot chocolate and unlimited terrible lute music.",
  "Not redeemable for dragons.",
  "The horse reserves the right to judge your snack choices.",
];

export function buildRealmCertificateNotes(questState = state) {
  const lines = [];
  const seen = new Set();
  const push = (line) => {
    const text = (line || "").trim();
    if (!text || seen.has(text)) return;
    seen.add(text);
    lines.push(text);
  };

  const answers = questState.chapter1Answers || {};
  const classId = chapter1Id(answers, "class");
  const weaponId = chapter1Id(answers, "weapon");

  if (classId === "potato" && weaponId === "sword") {
    push("Pacifist potato farmer certified to carry a decorative sword (unloaded).");
  } else if (classId || weaponId) {
    const classLine = chapter1Label(answers, "class", "Adventurer");
    const weaponLine = chapter1Label(answers, "weapon", "intent");
    push(`${classLine} cleared to travel with ${weaponLine} — paperwork says "probably fine."`);
  }

  const companionLine = decreeCompanionLogLine(answers);
  if (companionLine.toLowerCase().includes("goose")) {
    push("Companion goose listed as under investigation. Sir Berke agrees.");
  } else if (chapter1Id(answers, "companion")) {
    push(`${companionLine.replace(/^Companion:\s*/i, "")} — registry stamp smudged but valid.`);
  }

  const toll = geraldTollAmount(answers);
  if (toll && toll !== "a reasonable number of potatoes") {
    push(`Mountain toll paid: ${toll}. Receipt lost; Gerald remembers.`);
  }

  const prov = provisionsForDecree(questState);
  if (prov.length) {
    push(`Provisions logged: ${prov.join(", ")} (fanum tax acknowledged).`);
  }

  if (questState.steedName) {
    push(`Steed "${questState.steedName}" passed the no-biting interview.`);
  }

  if (questState.potionName) {
    const side = potionSongSideEffect(answers);
    push(`Official potion: ${questState.potionName}. Side effect watch: ${side}.`);
  }

  if (questState.rating) {
    push(`Adventure energy rated ${questState.rating}/5 — horse packed accordingly.`);
  }

  for (const fallback of FALLBACK_NOTES) {
    if (lines.length >= 5) break;
    push(fallback);
  }

  return lines.slice(0, 5);
}
