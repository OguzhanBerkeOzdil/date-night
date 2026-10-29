import { MAP_NODE } from "./config.js?v=20261213";
import { ensureQuestMapImage, preloadUrl } from "./image-utils.js?v=20261213";

/** Token position (% of track) for each map node 0–8 */
const NODE_X = [4, 14, 28, 42, 56, 70, 84, 92, 98];
const NODE_Y = [72, 48, 68, 58, 52, 42, 46, 38, 62];

let trailLength = 100;
let mapTrigger = null;

function getFocusable(root) {
  return [...root.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')].filter(
    (n) => !n.disabled && !n.closest("[hidden]")
  );
}

function trapFocus(e, root) {
  if (e.key !== "Tab") return;
  const list = getFocusable(root);
  if (!list.length) return;
  const first = list[0];
  const last = list[list.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}

function openMapOverlay(overlay) {
  ensureHudTokenImage();
  ensureQuestMapImage();
  overlay.classList.add("map-overlay--open");
  overlay.removeAttribute("hidden");
  const closeBtn = document.getElementById("mapClose");
  closeBtn?.focus();
  const onKey = (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      closeMapOverlay(overlay);
    } else {
      trapFocus(e, overlay);
    }
  };
  overlay.dataset.keyHandler = "1";
  overlay._onKey = onKey;
  document.addEventListener("keydown", onKey);
}

function closeMapOverlay(overlay) {
  overlay.classList.remove("map-overlay--open");
  overlay.setAttribute("hidden", "");
  if (overlay._onKey) {
    document.removeEventListener("keydown", overlay._onKey);
    overlay._onKey = null;
  }
  mapTrigger?.focus();
}

export function initHud() {
  const hud = document.getElementById("questHud");
  const overlay = document.getElementById("mapOverlay");
  const path = document.getElementById("mapTrailGold");
  const token = document.getElementById("mapToken");

  if (path) {
    trailLength = path.getTotalLength();
    path.style.strokeDasharray = `0 ${trailLength}`;
  }

  if (token && !token.querySelector("img")) {
    const img = document.createElement("img");
    img.alt = "";
    img.width = 28;
    img.height = 28;
    img.decoding = "async";
    img.dataset.lazySrc = "assets/images/horse-idle.webp";
    token.appendChild(img);
  }

  hud?.addEventListener("click", () => {
    mapTrigger = hud;
    openMapOverlay(overlay);
  });
  overlay?.addEventListener("click", (e) => {
    if (e.target === overlay) closeMapOverlay(overlay);
  });
  document.getElementById("mapClose")?.addEventListener("click", () => closeMapOverlay(overlay));
}

function ensureHudTokenImage() {
  const img = document.getElementById("mapToken")?.querySelector("img");
  const url = img?.dataset.lazySrc;
  if (img && url && !img.src) {
    preloadUrl(url);
    img.src = url;
    delete img.dataset.lazySrc;
  }
}

export function updateHud(screenId) {
  const node = MAP_NODE[screenId] ?? 0;
  if (node > 0) ensureHudTokenImage();
  const token = document.getElementById("mapToken");
  const path = document.getElementById("mapTrailGold");

  const x = NODE_X[node] ?? 50;
  const y = NODE_Y[node] ?? 50;
  if (token) {
    token.style.left = `${x}%`;
    token.style.top = `${y}%`;
  }

  if (path && trailLength) {
    const progress = node / (NODE_X.length - 1);
    const filled = progress * trailLength;
    path.style.strokeDasharray = `${filled} ${trailLength}`;
    path.style.strokeDashoffset = "0";
  }

  document.querySelectorAll(".hud-node").forEach((el, i) => {
    el.setAttribute("fill", i <= node ? "#c9a227" : "#8b7355");
    el.setAttribute("r", i === node ? "2.4" : "1.8");
  });
}
