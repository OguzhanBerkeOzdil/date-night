import { MUSIC_SRC } from "./app-config.js?v=20261209";

let ctx = null;
let sfxGain = null;
let music = null;
let musicStarted = false;
let musicDucked = false;
let soundOn = false;

const MUSIC_VOLUME = 0.22;
const DUCKED_VOLUME = 0.08;

function syncMusic() {
  if (!music) return;
  music.volume = musicDucked ? DUCKED_VOLUME : MUSIC_VOLUME;
  if (!soundOn || !musicStarted) {
    music.pause();
    return;
  }
  music.play().catch(() => {
    // A browser may require another direct gesture; the next toggle retries.
  });
}

export function ensureBackgroundMusic() {
  if (!MUSIC_SRC) return null;
  if (!music) {
    music = new Audio(new URL(MUSIC_SRC, import.meta.url).href);
    music.loop = true;
    music.preload = "metadata";
    music.playsInline = true;
  }
  if (soundOn) musicStarted = true;
  syncMusic();
  return music;
}

export function isSoundOn() {
  return soundOn;
}

export function setSoundOn(v, userTouched = true) {
  soundOn = v;
  try {
    localStorage.setItem("questSound", v ? "1" : "0");
    if (userTouched) localStorage.setItem("questSoundTouched", "1");
  } catch (_) {}
  if (v) musicStarted = true;
  if (sfxGain) sfxGain.gain.value = v ? 0.35 : 0;
  ensureBackgroundMusic();
}

export function loadSoundPref() {
  try {
    soundOn = localStorage.getItem("questSound") === "1";
  } catch (_) {
    soundOn = false;
  }
}

export function soundPrefTouched() {
  try {
    return localStorage.getItem("questSoundTouched") === "1";
  } catch (_) {
    return false;
  }
}

export function unlockAudio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    sfxGain = ctx.createGain();
    sfxGain.connect(ctx.destination);
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

export function startAmbience() {
  musicStarted = true;
  ensureBackgroundMusic();
}

export function duckMusic(on) {
  musicDucked = Boolean(on);
  syncMusic();
}

export function vibrate(pattern) {
  if (navigator.vibrate) {
    try {
      navigator.vibrate(pattern);
    } catch (_) {}
  }
}
