import { playBlip } from "./audio.js";

let queue = [];
let typing = false;
let onDone = null;
let steedHideTimer = null;

export function initDialogue() {
  const box = document.getElementById("dialogueBox");
  if (!box) return;
  box.addEventListener("click", () => {
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
  });
}

export function setSteedName(name) {
  const el = document.getElementById("dialogueName");
  if (el) el.textContent = name;
}

export function setPortrait(src) {
  const img = document.getElementById("dialoguePortrait");
  if (img) img.src = src;
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

export function say(lines, done) {
  if (document.body.dataset.screen === "rating") return;
  queue = lines.map(stripDuplicateName);
  onDone = done || null;
  document.getElementById("dialogueBox")?.classList.remove("hidden");
  showNext();
}

export function hideDialogue() {
  if (steedHideTimer) clearTimeout(steedHideTimer);
  steedHideTimer = null;
  document.getElementById("dialogueBox")?.classList.add("hidden");
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
  }, 1600);
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
      if (hint) hint.hidden = false;
      if (!queue.length) scheduleSteedHide();
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
