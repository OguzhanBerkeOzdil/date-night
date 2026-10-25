/** Prevent Nay pointerdown ghost-clicks from activating the honest-no link. */

let pointerOnNay = false;
let lastNayPointerMs = 0;
let honestRevealTimer = null;
let honestLinkArmed = false;

export function setPointerOnNay(active) {
  pointerOnNay = active;
  if (active) lastNayPointerMs = Date.now();
}

export function swallowGhostClick() {
  const block = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation?.();
  };
  window.addEventListener("click", block, true);
  window.addEventListener("pointerup", block, true);
  window.setTimeout(() => {
    window.removeEventListener("click", block, true);
    window.removeEventListener("pointerup", block, true);
  }, 450);
}

export function disarmHonestLink() {
  honestLinkArmed = false;
  if (honestRevealTimer) clearTimeout(honestRevealTimer);
  honestRevealTimer = null;
  const link = document.getElementById("realNoLink");
  if (!link) return;
  link.classList.remove("honest-link--armed");
  link.classList.add("hidden");
  link.setAttribute("hidden", "");
}

function armHonestLinkIfReady() {
  if (document.body.dataset.screen !== "dragon") return;
  const quietMs = Date.now() - lastNayPointerMs;
  if (pointerOnNay && quietMs < 400) {
    honestRevealTimer = window.setTimeout(armHonestLinkIfReady, 120);
    return;
  }
  const link = document.getElementById("realNoLink");
  if (!link || link.classList.contains("hidden")) return;
  honestLinkArmed = true;
  link.classList.add("honest-link--armed");
}

function tryRevealHonestLink() {
  if (document.body.dataset.screen !== "dragon") return;
  const quietMs = Date.now() - lastNayPointerMs;
  if (pointerOnNay && quietMs < 400) {
    honestRevealTimer = window.setTimeout(tryRevealHonestLink, 120);
    return;
  }
  const link = document.getElementById("realNoLink");
  if (!link) return;
  link.classList.remove("hidden");
  link.removeAttribute("hidden");
  honestRevealTimer = window.setTimeout(() => {
    honestRevealTimer = null;
    armHonestLinkIfReady();
  }, 500);
}

export function scheduleHonestLinkReveal() {
  if (honestRevealTimer) clearTimeout(honestRevealTimer);
  honestRevealTimer = window.setTimeout(() => {
    honestRevealTimer = null;
    tryRevealHonestLink();
  }, 500);
}

export function honestLinkIsArmed() {
  return honestLinkArmed;
}
