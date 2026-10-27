import { state } from "./state.js";

const BASE_REALM_NOTES = [
  "Licensed to wield a cast-iron frying pan in all known kingdoms.",
  "Gerald has filed this certificate in triplicate. He is thrilled.",
  "The Royal Goose has been notified and is furious.",
  "Valid for one adventure, one hot chocolate and unlimited terrible lute music.",
  "Not redeemable for dragons.",
];

export function buildRealmCertificateNotes() {
  const notes = [...BASE_REALM_NOTES];
  const weaponId = state.chapter1Answers?.weapon?.id;
  const classId = state.chapter1Answers?.class?.id;
  if (weaponId === "pacifist" || classId === "potato") {
    notes.push("Certified pacifist. Reginald is still crying.");
  } else if (state.chapter1Answers?.companion?.id === "goose") {
    notes.push("Companion goose listed as 'traitor'. Sir Berke says same.");
  }
  return notes.slice(0, 6);
}
