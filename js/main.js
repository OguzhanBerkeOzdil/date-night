import { BG_BY_SCREEN, SCREENS } from "./config.js";
import { loadSoundPref, setSoundOn, isSoundOn } from "./audio.js";
import { initHud, updateHud } from "./hud.js";
import { hideDialogue, initDialogue } from "./dialogue.js";
import { initParticles } from "./particles.js";
import { initScreens, onScreenEnter } from "./screens.js";
import { guest, hasQuestSave, questOfTitle, saveState, state } from "./state.js";

let current = "title";
const loadedBg = new Set();

function $(id) {
  return document.getElementById(id);
}

function preloadBg(name) {
  if (!name || loadedBg.has(name)) return;
  loadedBg.add(name);
  const img = new Image();
  img.src = `assets/images/${name}.webp`;
}

function resetScroll() {
  try {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  } catch (_) {
    window.scrollTo(0, 0);
  }
  document.documentElement.scrollLeft = 0;
  document.documentElement.scrollTop = 0;
  document.body.scrollLeft = 0;
  document.body.scrollTop = 0;
  const app = $("app");
  if (app) {
    app.scrollTop = 0;
    app.scrollLeft = 0;
  }
  document.querySelectorAll(".screen, .screen__inner, .card-grid, .menu-list").forEach((el) => {
    el.scrollTop = 0;
    el.scrollLeft = 0;
  });
}

function setBackground(screenId) {
  const name = BG_BY_SCREEN[screenId] || "bg-forest";
  const layer = $("bgLayer");
  if (!layer) return;
  const pic = layer.querySelector(".scene-bg__img");
  const src = layer.querySelector("source");
  const kb = layer.querySelector(".scene-bg__kenburns");
  if (pic) pic.src = `assets/images/${name}.jpg`;
  if (src) src.srcset = `assets/images/${name}.webp`;
  if (kb) {
    kb.classList.toggle("scene-bg__kenburns--slow", screenId === "decree");
  }
  const next = SCREENS[SCREENS.indexOf(screenId) + 1];
  if (next) preloadBg(BG_BY_SCREEN[next]);
}

export function navigate(screenId) {
  resetScroll();
  const doNav = () => {
    resetScroll();
    const prev = document.querySelector(`.screen[data-screen="${current}"]`);
    const next = document.querySelector(`.screen[data-screen="${screenId}"]`);
    if (!next) return;
    prev?.classList.remove("screen--active");
    next.classList.add("screen--active");
    current = screenId;
    state.lastScreen = screenId;
    document.body.dataset.screen = screenId;
    hideDialogue();
    setBackground(screenId);
    updateHud(screenId);
    saveState();
    onScreenEnter(screenId);
    if (screenId === "decree") document.body.classList.add("bg-celebration");
    else document.body.classList.remove("bg-celebration");
  };

  const useVt =
    document.startViewTransition && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (useVt) {
    document.startViewTransition(doNav);
  } else {
    doNav();
  }
}

function personalize() {
  document.querySelectorAll("[data-lady]").forEach((el) => {
    el.textContent = questOfTitle();
  });
  document.title = `The Quest of ${questOfTitle()}`;
  document.querySelectorAll("[data-name-only]").forEach((el) => {
    el.textContent = guest.isLady ? guest.formal : guest.display;
  });
}

function initSoundToggle() {
  const btn = $("btnSoundHud");
  loadSoundPref();
  const sync = () => {
    if (btn) btn.innerHTML = isSoundOn() ? "🔊" : "🔇";
    const t = $("btnSoundTitle");
    if (t) t.textContent = isSoundOn() ? "♪ Sound: On" : "♪ Sound: Off";
  };
  sync();
  btn?.addEventListener("click", () => {
    setSoundOn(!isSoundOn());
    sync();
  });
}

function syncContinueButton() {
  const btn = $("btnContinue");
  if (!btn) return;
  if (hasQuestSave()) btn.classList.remove("hidden");
  else btn.classList.add("hidden");
}

function boot() {
  personalize();
  syncContinueButton();
  const sendBtn = document.getElementById("btnShare");
  if (sendBtn) {
    import("./config.js").then(({ CONFIG }) => {
      sendBtn.textContent = `Send it to ${CONFIG.fromName} 💌`;
    });
  }
  initParticles();
  initDialogue();
  initHud();
  initSoundToggle();
  initScreens(navigate);
  preloadBg("bg-title");
  document.body.dataset.screen = "title";
  setBackground("title");
  updateHud("title");
  document.getElementById("dialogueBox")?.classList.add("hidden");
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
else boot();

/** Playwright / debug: jump to any screen */
window.__questNavigate = navigate;
window.__questReadNoAttempts = () => state.noAttempts;
