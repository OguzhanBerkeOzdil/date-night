import { MUSIC_SRC } from "./app-config.js";

let ctx = null;
let musicEl = null;
let musicGain = null;
let sfxGain = null;
let musicOsc = null;
let soundOn = false;

export function isSoundOn() {
  return soundOn;
}

export function setSoundOn(v, userTouched = true) {
  soundOn = v;
  try {
    localStorage.setItem("questSound", v ? "1" : "0");
    if (userTouched) localStorage.setItem("questSoundTouched", "1");
  } catch {}
  if (musicGain) musicGain.gain.value = v && !MUSIC_SRC ? 0.12 : 0;
  if (musicEl) {
    if (v) {
      musicEl.play().catch(() => {});
    } else {
      musicEl.pause();
    }
  }
  if (!v && musicOsc && musicGain) musicGain.gain.value = 0;
}

export function loadSoundPref() {
  try {
    soundOn = localStorage.getItem("questSound") === "1";
  } catch {
    soundOn = false;
  }
}

export function soundPrefTouched() {
  try {
    return localStorage.getItem("questSoundTouched") === "1";
  } catch {
    return false;
  }
}

export function unlockAudio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    musicGain = ctx.createGain();
    sfxGain = ctx.createGain();
    musicGain.connect(ctx.destination);
    sfxGain.connect(ctx.destination);
    musicGain.gain.value = soundOn ? 0.12 : 0;
    sfxGain.gain.value = soundOn ? 0.35 : 0;
  }
  if (ctx.state === "suspended") ctx.resume();
}

function tone(freq, dur, type = "sine", vol = 0.15) {
  if (!ctx || !soundOn) return;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.value = vol;
  o.connect(g);
  g.connect(sfxGain);
  const t = ctx.currentTime;
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.start(t);
  o.stop(t + dur);
}

export function playBlip() {
  tone(880, 0.04, "triangle", 0.08);
}

export function playDing() {
  tone(660, 0.08, "sine", 0.2);
  setTimeout(() => tone(990, 0.12, "sine", 0.15), 60);
}

export function playStamp() {
  tone(120, 0.15, "square", 0.25);
}

export function playNeigh() {
  if (!ctx || !soundOn) return;
  [280, 340, 300].forEach((f, i) => setTimeout(() => tone(f, 0.2, "sawtooth", 0.1), i * 80));
}

export function playHorn() {
  tone(392, 0.3, "triangle", 0.18);
  setTimeout(() => tone(523, 0.4, "triangle", 0.15), 200);
}

/** Lazy-load MP3 when configured; otherwise procedural ambience. */
export function ensureBackgroundMusic() {
  if (!soundOn) return;
  unlockAudio();
  if (MUSIC_SRC) {
    if (!musicEl) {
      musicEl = new Audio(MUSIC_SRC);
      musicEl.loop = true;
      musicEl.preload = "none";
    }
    musicEl.play().catch(() => {});
    return;
  }
  startAmbience();
}

export function startAmbience() {
  if (!ctx || musicOsc || MUSIC_SRC) return;
  musicOsc = ctx.createOscillator();
  const lfo = ctx.createOscillator();
  const lfoG = ctx.createGain();
  lfo.frequency.value = 0.08;
  lfoG.gain.value = 30;
  lfo.connect(lfoG);
  lfoG.connect(musicOsc.frequency);
  musicOsc.type = "triangle";
  musicOsc.frequency.value = 196;
  musicOsc.connect(musicGain);
  musicOsc.start();
  lfo.start();
  if (musicGain) musicGain.gain.value = soundOn ? 0.12 : 0;
}

export function duckMusic(on) {
  if (!musicGain || !ctx) return;
  musicGain.gain.setTargetAtTime(on ? 0.05 : soundOn ? 0.12 : 0, ctx.currentTime, 0.3);
}

export function vibrate(pattern) {
  if (navigator.vibrate) {
    try {
      navigator.vibrate(pattern);
    } catch {}
  }
}
