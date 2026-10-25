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

const HONEST_EPIGRAPH = {
  text: "I had rather hear my dog bark at a crow than a man swear he loves me.",
  by: "Shakespeare, Much Ado About Nothing (Beatrice)",
};

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

  el.innerHTML = `<p>${block.text}</p><footer>— ${block.by}</footer>`;
  el.setAttribute("cite", block.by);
  el.classList.remove("hidden");

  const short = window.innerHeight < 680;
  if (short && (screenId === "dragon" || screenId === "steed")) {
    el.classList.add("hidden");
  }
}
