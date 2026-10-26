import { BG_BY_SCREEN, SCREENS } from "./config.js";
import { pickBgWebpUrl, preloadTarotAssets, preloadUrl } from "./image-utils.js";
import { loadSoundPref, setSoundOn, isSoundOn, unlockAudio, startAmbience } from "./audio.js";
import { initBardQuill, syncBardQuill } from "./bard.js";
import { initEpigraphs, updateEpigraph } from "./epigraph.js";
import { initHud, updateHud } from "./hud.js";
import { hideDialogue, initDialogue } from "./dialogue.js";
import { initParticles } from "./particles.js";
import { initScreens, onScreenEnter } from "./screens.js";
import { guest, hasQuestSave, questOfTitle, saveState, state } from "./state.js";

let current = "title";

function $(id) {
  return document.getElementById(id);
}

function bgSrcsets(name) {
  return {
    landWebp: `assets/images/${name}-landscape.webp 1920w, assets/images/${name}-landscape-2560.webp 2560w`,
    landJpg: `assets/images/${name}-landscape.jpg 1920w, assets/images/${name}-landscape-2560.jpg 2560w`,
    portWebp: `assets/images/${name}.webp 1080w, assets/images/${name}-1440.webp 1440w`,
    portJpg: `assets/images/${name}.jpg 1080w, assets/images/${name}-1440.jpg 1440w`,
  };
}

function preloadBg(name) {
  if (!name) return;
  preloadUrl(pickBgWebpUrl(name));
}

function preloadScreenAssets(screenId) {
  const next = SCREENS[SCREENS.indexOf(screenId) + 1];
  if (next) preloadBg(BG_BY_SCREEN[next]);
  if (screenId === "stars" || next === "oracle") preloadTarotAssets();
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
  const sets = bgSrcsets(name);
  const pic = layer.querySelector(".scene-bg__img");
  const landWebp = $("bgSrcLandWebp");
  const landJpg = $("bgSrcLandJpg");
  const portWebp = $("bgSrcPortWebp");
  const kb = layer.querySelector(".scene-bg__kenburns");
  if (landWebp) landWebp.srcset = sets.landWebp;
  if (landJpg) landJpg.srcset = sets.landJpg;
  if (portWebp) portWebp.srcset = sets.portWebp;
  if (pic) {
    pic.src = `assets/images/${name}.jpg`;
    pic.srcset = sets.portJpg;
  }
  if (kb) {
    kb.classList.toggle("scene-bg__kenburns--slow", screenId === "decree");
  }
  preloadScreenAssets(screenId);
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
    updateEpigraph(screenId);
    syncBardQuill(screenId);
    if (screenId === "decree") document.body.classList.add("bg-celebration");
    else document.body.classList.remove("bg-celebration");
  };

  const useVt =
    document.startViewTransition && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (useVt) {
    const vt = document.startViewTransition(doNav);
    vt?.ready?.catch(() => {});
    vt?.finished?.catch(() => {});
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

export function syncContinueButton() {
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
  initEpigraphs();
  initBardQuill();
  updateEpigraph("title");
  syncBardQuill("title");
  preloadBg("bg-title");
  document.body.dataset.screen = "title";
  setBackground("title");
  updateHud("title");
  document.getElementById("dialogueBox")?.classList.add("hidden");
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
else boot();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js", { scope: "./" }).catch(() => {});
  });
}

/** Playwright / debug: jump to any screen */
window.__questNavigate = navigate;
window.__questReadNoAttempts = () => state.noAttempts;
