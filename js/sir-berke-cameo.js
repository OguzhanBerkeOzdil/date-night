/** Sir Berke decorative cameos — Chapter I & II. */

export const SIR_BERKE_BASE = "assets/characters";

export const BERKE_CAMEO_BY_SCREEN = {
  "eve-name": {
    image: `${SIR_BERKE_BASE}/sir-berke-wave.webp`,
    line: "Sir Berke (quest organizer, mostly in charge of snacks)",
  },
  "eve-pass": {
    image: `${SIR_BERKE_BASE}/sir-berke-wave.webp`,
    line: "Sir Berke approves this paperwork.",
  },
  "chapter-two-start": {
    image: `${SIR_BERKE_BASE}/sir-berke-stand.webp`,
    line: "Sir Berke brought snacks. The horse brought opinions.",
  },
  dragon: {
    image: `${SIR_BERKE_BASE}/sir-berke-shield.webp`,
    line: "Sir Berke recommends reading the fine print. Then ignoring it.",
  },
  decree: {
    image: `${SIR_BERKE_BASE}/sir-berke-wave.webp`,
    line: "Sir Berke will file this under \"mostly successful chaos.\"",
  },
};

export const BERKE_CAMEO_BY_QUESTION = {
  weapon: {
    image: `${SIR_BERKE_BASE}/sir-berke-stand.webp`,
    line: "Sir Berke is pretending he knows how to ride.",
  },
  goose: {
    image: `${SIR_BERKE_BASE}/sir-berke-shield.webp`,
    line: "Sir Berke hides behind the shield. The goose is right there.",
  },
};

function $(id) {
  return document.getElementById(id);
}

export function paintSirBerkeCameo({ screenId, questionId } = {}) {
  const root = $("sirBerkeCameo");
  const img = $("sirBerkeImg");
  const line = $("sirBerkeLine");
  if (!root || !img || !line) return;

  const fromQuestion = questionId ? BERKE_CAMEO_BY_QUESTION[questionId] : null;
  const fromScreen = BERKE_CAMEO_BY_SCREEN[screenId];
  const cfg = fromQuestion || fromScreen;

  const slot = document.querySelector(".screen.screen--active [data-sir-berke-slot]");
  if (slot) slot.append(root);

  const panel = document.querySelector(".screen.screen--active .today-panel");
  panel?.classList.toggle("today-panel--berke", Boolean(cfg));

  if (!cfg) {
    root.classList.add("hidden");
    root.setAttribute("hidden", "");
    root.setAttribute("aria-hidden", "true");
    return;
  }

  img.src = cfg.image;
  img.alt = "";
  line.textContent = cfg.line;
  root.classList.remove("hidden");
  root.removeAttribute("hidden");
  root.setAttribute("aria-hidden", "true");
}

export function hideSirBerkeCameo() {
  const root = $("sirBerkeCameo");
  if (!root) return;
  document
    .querySelector(".screen.screen--active .today-panel")
    ?.classList.remove("today-panel--berke");
  root.classList.add("hidden");
  root.setAttribute("hidden", "");
  root.setAttribute("aria-hidden", "true");
}
