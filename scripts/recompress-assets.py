#!/usr/bin/env python3
"""Recompress WebP assets: portrait -1440 backgrounds and cutouts."""
from pathlib import Path

from PIL import Image

OUT = Path(__file__).resolve().parents[1] / "assets/images"
BG_QUALITY = 72
CUTOUT_QUALITY = 74

CUTOUT_MAX = {
    "horse-idle.webp": 560,
    "horse-munch.webp": 560,
    "horse-rear.webp": 560,
    "dragon-doubt.webp": 480,
    "dragon-befriended.webp": 480,
    "quest-map.webp": 1920,
    "tarot-back.webp": 220,
    "tarot-steeds.webp": 220,
    "tarot-golden-hour.webp": 220,
    "tarot-hearth.webp": 220,
}


def save_webp(img: Image.Image, path: Path, quality: int):
    if img.mode not in ("RGB", "RGBA"):
        img = img.convert("RGBA" if "A" in img.getbands() else "RGB")
    img.save(path, "WEBP", quality=quality, method=6)


def resize_max(img: Image.Image, max_px: int) -> Image.Image:
    w, h = img.size
    m = max(w, h)
    if m <= max_px:
        return img
    scale = max_px / m
    nw, nh = max(1, int(w * scale)), max(1, int(h * scale))
    return img.resize((nw, nh), Image.Resampling.LANCZOS)


def main():
    for path in sorted(OUT.glob("bg-*-1440.webp")):
        img = Image.open(path)
        save_webp(img, path, BG_QUALITY)
        print("bg", path.name, path.stat().st_size)

    for name, max_px in CUTOUT_MAX.items():
        path = OUT / name
        if not path.exists():
            print("skip missing", name)
            continue
        img = Image.open(path)
        img = resize_max(img, max_px)
        save_webp(img, path, CUTOUT_QUALITY)
        print("cutout", name, img.size, path.stat().st_size)


if __name__ == "__main__":
    main()
