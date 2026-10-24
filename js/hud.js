import { MAP_NODE } from "./config.js";

/** Token position (% of track) for each map node 0–8 */
const NODE_X = [4, 14, 28, 42, 56, 70, 84, 92, 98];
const NODE_Y = [72, 48, 68, 58, 52, 42, 46, 38, 62];

let trailLength = 100;

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
    img.src = "assets/images/horse-idle.webp";
    img.alt = "";
    img.width = 28;
    img.height = 28;
    token.appendChild(img);
  }

  hud?.addEventListener("click", () => overlay?.classList.add("map-overlay--open"));
  overlay?.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.classList.remove("map-overlay--open");
  });
  document.getElementById("mapClose")?.addEventListener("click", () => overlay?.classList.remove("map-overlay--open"));
}

export function updateHud(screenId) {
  const node = MAP_NODE[screenId] ?? 0;
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
