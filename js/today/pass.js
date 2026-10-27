import { QUEST_DATE_LABEL } from "../app-config.js";
import { adventurerProfileFromAnswers } from "../chapter1-survey-data.js";
import { CONFIG } from "../config.js";
import {
  PASS_HEIGHT,
  PASS_WIDTH,
  coverBakedPassSeal,
  passSealRect,
} from "../quest-pass-layout.js";
import { state } from "../state.js";

const PARCHMENT_URL = new URL("../../assets/images/parchment.webp", import.meta.url).href;
const WAX_SEAL_URL = new URL("../../assets/images/wax-seal.webp", import.meta.url).href;

async function loadImage(url) {
  const img = new Image();
  img.decoding = "async";
  img.src = url;
  try {
    await img.decode();
  } catch {
    /* fallback drawing below */
  }
  return img;
}

export async function renderQuestPassCanvas(guestName) {
  await document.fonts.ready;
  const w = PASS_WIDTH;
  const h = PASS_HEIGHT;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d");

  const parchment = await loadImage(PARCHMENT_URL);
  if (parchment.naturalWidth) {
    g.drawImage(parchment, 0, 0, w, h);
    coverBakedPassSeal(g, parchment, w, h);
  } else {
    g.fillStyle = "#f4e8d0";
    g.fillRect(0, 0, w, h);
  }

  g.fillStyle = "#4a1f28";
  g.font = '700 36px "Cinzel", serif';
  g.textAlign = "center";
  g.fillText("QUEST PASS", w / 2, 120);
  g.font = '500 24px "Cinzel", serif';
  g.fillText("Summoned for tomorrow's quest", w / 2, 170);

  g.font = '400 28px "Crimson Pro", serif';
  g.fillText(guestName, w / 2, 280);
  g.font = 'italic 22px "Crimson Pro", serif';
  g.fillText(QUEST_DATE_LABEL, w / 2, 330);

  g.font = '400 20px "Crimson Pro", serif';
  g.fillText("Present this to the realm tomorrow.", w / 2, 400);
  g.fillText("(Or just show up. Paper optional.)", w / 2, 440);

  const profile = adventurerProfileFromAnswers(state.chapter1Answers);
  g.font = '400 18px "Crimson Pro", serif';
  g.fillText(`Class: ${profile.class} · Weapon: ${profile.weapon}`, w / 2, 500);
  g.fillText(`Companion: ${profile.companion}`, w / 2, 530);
  g.fillText(`Issued by ${CONFIG.fromName}`, w / 2, 580);

  const seal = await loadImage(WAX_SEAL_URL);
  const sealBox = passSealRect(w, h);
  if (seal.naturalWidth) {
    g.drawImage(seal, sealBox.x, sealBox.y, sealBox.w, sealBox.h);
  }

  return c;
}

export async function downloadQuestPassPng(guestName) {
  const c = await renderQuestPassCanvas(guestName);
  const blob = await new Promise((resolve, reject) => {
    c.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob null"))), "image/png");
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "quest-pass.png";
  a.click();
  URL.revokeObjectURL(a.href);
}
