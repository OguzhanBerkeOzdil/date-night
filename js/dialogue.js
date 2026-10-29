import { playBlip } from "./audio.js?v=20261209";

let queue = [];
let typing = false;
let onDone = null;
let steedHideTimer = null;
let dialogueHome = null;
let dialogueNext = null;

function rememberDialogueHome() {
  const box = document.getElementById("dialogueBox");
  if (!box || dialogueHome) return;
  dialogueHome = box.parentElement;
  dialogueNext = box.nextSibling;
}

export function attachSteedDialogue() {
  rememberDialogueHome();
  const box = document.getElementById("dialogueBox");
  const anchor = document.getElementById("steedDialogueAnchor");
  if (!box || !anchor || box.parentElement === anchor) return;
  anchor.appendChild(box);
  box.classList.add("dialogue-box--steed");
  anchor.setAttribute("aria-hidden", "false");
}

export function detachSteedDialogue() {
  const box = document.getElementById("dialogueBox");
  if (!box || !dialogueHome || box.parentElement === dialogueHome) return;
  dialogueHome.insertBefore(box, dialogueNext);
  box.classList.remove("dialogue-box--steed");
  document.getElementById("steedDialogueAnchor")?.setAttribute("aria-hidden", "true");
}

function advanceDialogue() {
  const box = document.getElementById("dialogueBox");
  if (!box || box.classList.contains("hidden")) return;
  if (document.body.dataset.screen === "steed") {
    if (typing) {
      skipLine();
      return;
    }
    if (queue.length) {
      showNext();
      return;
    }
    hideDialogue();
    return;
  }
  if (typing) {
    skipLine();
  } else if (queue.length) {
    showNext();
  } else if (onDone) {
    const fn = onDone;
    onDone = null;
    fn();
  }
}

export function initDialogue() {
  const box = document.getElementById("dialogueBox");
  if (!box) return;
  box.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    advanceDialogue();
  });
  box.addEventListener("click", () => {
    advanceDialogue();
  });
}

export function setSteedName(name) {
  const el = document.getElementById("dialogueName");
  if (el) el.textContent = name;
}

export function setPortrait(src) {
  const img = document.getElementById("dialoguePortrait");
  if (img && src) img.src = src;
}

function stripDuplicateName(line) {
  const nameEl = document.getElementById("dialogueName");
  const steed = nameEl?.textContent?.trim();
  if (!steed) return line;
  const prefix = `${steed}:`;
  if (line.startsWith(prefix)) return line.slice(prefix.length).trim();
  if (line.startsWith(`${steed} `)) return line.slice(steed.length).trim();
  return line;
}

export function say(lines, done, { focus = true } = {}) {
  if (document.body.dataset.screen === "rating") return;
  if (document.body.dataset.screen === "steed") attachSteedDialogue();
  if (steedHideTimer) clearTimeout(steedHideTimer);
  steedHideTimer = null;
  queue = lines.map(stripDuplicateName);
  onDone = done || null;
  const box = document.getElementById("dialogueBox");
  box?.classList.remove("hidden");
  box?.setAttribute("tabindex", "0");
  if (focus) box?.focus();
  showNext();
}

export function hideDialogue() {
  if (steedHideTimer) clearTimeout(steedHideTimer);
  steedHideTimer = null;
  detachSteedDialogue();
  const box = document.getElementById("dialogueBox");
  box?.classList.add("hidden");
  box?.setAttribute("tabindex", "-1");
  queue = [];
  typing = false;
  onDone = null;
}

function scheduleSteedHide() {
  if (document.body.dataset.screen !== "steed") return;
  if (queue.length || typing) return;
  if (steedHideTimer) clearTimeout(steedHideTimer);
  steedHideTimer = window.setTimeout(() => {
    if (document.body.dataset.screen === "steed" && !queue.length && !typing) hideDialogue();
  }, 3500);
}

function showNext() {
  const textEl = document.getElementById("dialogueText");
  const hint = document.getElementById("dialogueHint");
  if (!textEl) return;
  if (!queue.length) {
    typing = false;
    if (hint) hint.hidden = !onDone;
    scheduleSteedHide();
    return;
  }
  const line = queue.shift();
  typeLine(line, textEl, hint);
}

let fullLine = "";
let charIx = 0;
let typeTimer = null;

function typeLine(line, el, hint) {
  typing = true;
  fullLine = line;
  charIx = 0;
  el.textContent = "";
  if (hint) hint.hidden = true;
  clearInterval(typeTimer);
  typeTimer = setInterval(() => {
    el.textContent = fullLine.slice(0, ++charIx);
    if (charIx % 2 === 0) playBlip();
    if (charIx >= fullLine.length) {
      clearInterval(typeTimer);
      typing = false;
      if (hint) hint.hidden = document.body.dataset.screen === "steed" && queue.length > 0;
      if (document.body.dataset.screen === "steed" && queue.length) {
        window.setTimeout(() => showNext(), 900);
      } else if (!queue.length) scheduleSteedHide();
    }
  }, 28);
}

function skipLine() {
  clearInterval(typeTimer);
  const el = document.getElementById("dialogueText");
  if (el) el.textContent = fullLine;
  typing = false;
  const hint = document.getElementById("dialogueHint");
  if (hint) hint.hidden = false;
  if (!queue.length) scheduleSteedHide();
}
