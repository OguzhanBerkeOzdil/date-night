import { COPY } from "./config.js";
import { state } from "./state.js";

const EPIGRAPH_SCREENS = new Set([
  "title",
  "summons",
  "steed",
  "sheet",
  "rating",
  "journal",
  "tavern",
  "potion",
  "stars",
  "oracle",
  "decree",
  "honest-no",
]);

const PANEL_EPIGRAPH_SCREENS = new Set([
  "summons",
  "sheet",
  "rating",
  "journal",
  "tavern",
  "potion",
  "stars",
  "honest-no",
  "decree",
]);

const HONEST_EPIGRAPH = {
  text: "I had rather hear my dog bark at a crow than a man swear he loves me.",
  by: "Shakespeare, Much Ado About Nothing (Beatrice)",
};

function isShortViewport() {
  return window.innerHeight <= 680 || window.matchMedia("(max-height: 680px)").matches;
}

function compactQuote(text) {
  const oneLine = text
    .replace(/\s*,\s*\/\s*/g, ", ")
    .replace(/\s*\/\s*/g, " — ")
    .replace(/\s+/g, " ")
    .trim();
  if (oneLine.length <= 88) return oneLine;
  const cut = oneLine.slice(0, 85).trim();
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 40 ? cut.slice(0, lastSpace) : cut).trim()}…`;
}

export function initEpigraphs() {
  document.querySelectorAll(".screen[data-screen]").forEach((section) => {
    const id = section.dataset.screen;
    if (!EPIGRAPH_SCREENS.has(id)) return;
    const inner = section.querySelector(".screen__inner");
    if (!inner || inner.querySelector(".screen-epigraph")) return;
    const el = document.createElement("blockquote");
    el.className = "screen-epigraph";
    el.setAttribute("cite", "");
    inner.appendChild(el);
  });
}

export function updateEpigraph(screenId) {
  document.querySelectorAll(".screen-epigraph").forEach((el) => {
    el.classList.add("hidden");
  });
  if (!EPIGRAPH_SCREENS.has(screenId)) return;
  const section = document.querySelector(`.screen[data-screen="${screenId}"]`);
  const el = section?.querySelector(".screen-epigraph");
  if (!el) return;

  let block = COPY.epigraphs[screenId];
  if (screenId === "steed" && state.steedName === "Clover") {
    block = COPY.cloverEpigraph;
  }
  if (screenId === "honest-no") block = HONEST_EPIGRAPH;
  if (!block) return;

  const short = isShortViewport();
  const hideOnShort = screenId === "dragon" || screenId === "steed";
  if (short && hideOnShort) {
    el.classList.add("hidden");
    return;
  }

  const quoteText = short ? compactQuote(block.text) : block.text;
  el.innerHTML = `<p>${quoteText}</p><footer>— ${block.by}</footer>`;
  el.setAttribute("cite", block.by);
  el.classList.remove("hidden", "screen-epigraph--compact", "screen-epigraph--on-panel", "screen-epigraph--on-sky");
  el.classList.add("screen-epigraph--pill");
  if (PANEL_EPIGRAPH_SCREENS.has(screenId)) {
    el.classList.add("screen-epigraph--on-panel");
  } else {
    el.classList.add("screen-epigraph--on-sky");
  }
  if (short) el.classList.add("screen-epigraph--compact");
}
