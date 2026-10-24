import { playBlip } from "./audio.js";

let queue = [];
let typing = false;
let onDone = null;

export function initDialogue() {
  const box = document.getElementById("dialogueBox");
  if (!box) return;
  box.addEventListener("click", () => {
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

export function say(lines, done) {
  queue = [...lines];
  onDone = done || null;
  document.getElementById("dialogueBox")?.classList.remove("hidden");
  showNext();
}

export function hideDialogue() {
  document.getElementById("dialogueBox")?.classList.add("hidden");
  queue = [];
  typing = false;
}

function showNext() {
  const textEl = document.getElementById("dialogueText");
  const hint = document.getElementById("dialogueHint");
  if (!textEl) return;
  if (!queue.length) {
    typing = false;
    if (hint) hint.hidden = !onDone;
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
}
