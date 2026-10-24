import { MAP_NODE } from "./config.js";

const POINTS = [
  { x: 8, y: 92 },
  { x: 18, y: 78 },
  { x: 32, y: 68 },
  { x: 48, y: 58 },
  { x: 58, y: 48 },
  { x: 68, y: 38 },
  { x: 78, y: 28 },
  { x: 86, y: 18 },
  { x: 92, y: 8 },
];

export function initHud() {
  const hud = document.getElementById("questHud");
  const overlay = document.getElementById("mapOverlay");
  hud?.addEventListener("click", () => overlay?.classList.add("map-overlay--open"));
  overlay?.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.classList.remove("map-overlay--open");
  });
  document.getElementById("mapClose")?.addEventListener("click", () => overlay?.classList.remove("map-overlay--open"));
}

export function updateHud(screenId) {
  const node = MAP_NODE[screenId] ?? 0;
  const token = document.getElementById("mapToken");
  const trail = document.getElementById("mapTrailGold");
  const p = POINTS[node];
  if (token && p) {
    token.style.left = `${p.x}%`;
    token.style.top = `${p.y}%`;
  }
  if (trail) {
    const len = 100;
    const filled = (node / (POINTS.length - 1)) * len;
    trail.style.strokeDasharray = `${filled} ${len}`;
  }
}
