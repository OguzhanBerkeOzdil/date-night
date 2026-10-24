import { BG_BY_SCREEN, SCREENS } from "./config.js";
import { loadSoundPref, setSoundOn, isSoundOn } from "./audio.js";
import { initHud, updateHud } from "./hud.js";
import { initDialogue } from "./dialogue.js";
import { initParticles } from "./particles.js";
import { initScreens, onScreenEnter } from "./screens.js";
import { guest, ladyTitle, saveState } from "./state.js";

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

function setBackground(screenId) {
  const name = BG_BY_SCREEN[screenId] || "bg-forest";
  const layer = $("bgLayer");
  if (!layer) return;
  const pic = layer.querySelector("img");
  const src = layer.querySelector("source");
  if (pic) pic.src = `assets/images/${name}.jpg`;
  if (src) src.srcset = `assets/images/${name}.webp`;
  const next = SCREENS[SCREENS.indexOf(screenId) + 1];
  if (next) preloadBg(BG_BY_SCREEN[next]);
}

export function navigate(screenId) {
  const doNav = () => {
    const prev = document.querySelector(`.screen[data-screen="${current}"]`);
    const next = document.querySelector(`.screen[data-screen="${screenId}"]`);
    if (!next) return;
    prev?.classList.remove("screen--active");
    next.classList.add("screen--active");
    current = screenId;
    document.body.dataset.screen = screenId;
    setBackground(screenId);
    updateHud(screenId);
    saveState();
    onScreenEnter(screenId);
    if (screenId === "decree") document.body.classList.add("bg-celebration");
    else document.body.classList.remove("bg-celebration");
  };

  if (document.startViewTransition) {
    document.startViewTransition(doNav);
  } else {
    doNav();
  }
}

function personalize() {
  document.querySelectorAll("[data-lady]").forEach((el) => {
    el.textContent = ladyTitle(guest);
  });
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

function boot() {
  personalize();
  const sendBtn = document.getElementById("btnShare");
  if (sendBtn) {
    import("./config.js").then(({ CONFIG }) => {
      sendBtn.textContent = `Send to ${CONFIG.fromName} 💌`;
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
