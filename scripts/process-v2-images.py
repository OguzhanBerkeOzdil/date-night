#!/usr/bin/env python3
"""Process v2 uploads: rembg cutouts + WebP backgrounds."""
from pathlib import Path
import subprocess

from PIL import Image
from rembg import remove

UP = Path("/home/ubuntu/.cursor/projects/workspace/uploads")
OUT = Path("/workspace/assets/images")

CUTOUTS = [
    ("horse-idle_b9c9.jpg", "horse-idle"),
    ("horse-munch_a4ef.jpg", "horse-munch"),
    ("horse-prance_7651.jpg", "horse-rear"),
    ("dragon-doubt_cd37.jpg", "dragon-doubt"),
    ("dragon-befriended_92d2.jpg", "dragon-befriended"),
    ("wax-seal_8542.jpg", "wax-seal"),
]

BACKGROUNDS = [
    ("bg-title_12b2.jpg", "bg-title", 1080, 1920),
    ("bg-meadow-stable_1f2d.jpg", "bg-meadow-stable", 1080, 1920),
    ("bg-tavern_611c.jpg", "bg-tavern", 1080, 1920),
    ("bg-cauldron_db5d.jpg", "bg-cauldron", 1080, 1920),
    ("bg-starry-hill_2939.jpg", "bg-starry-hill", 1080, 1920),
    ("quest-map_4e9b.jpg", "quest-map", 1080, 1920),
]

TAROT = [
    ("tarot-back_6f51.jpg", "tarot-back"),
    ("tarot-steeds_2641.jpg", "tarot-steeds"),
    ("tarot-golden-hour_6c45.jpg", "tarot-golden-hour"),
    ("tarot-hearth_b44e.jpg", "tarot-hearth"),
]


def save_webp(img: Image.Image, path: Path, quality: int = 78):
    img.save(path, "WEBP", quality=quality, method=6)


def process_cutout(src_name: str, base: str):
    src = UP / src_name
    if not src.exists():
        print("missing", src)
        return
    raw = Image.open(src).convert("RGBA")
    out = remove(raw)
    # trim near-transparent padding
    bbox = out.getbbox()
    if bbox:
        out = out.crop(bbox)
    save_webp(out, OUT / f"{base}.webp", quality=82)
    print("cutout", base, OUT / f"{base}.webp", out.size)


def process_bg(src_name: str, base: str, tw: int, th: int):
    src = UP / src_name
    img = Image.open(src).convert("RGB")
    img.thumbnail((tw, th), Image.Resampling.LANCZOS)
    w, h = img.size
    canvas = Image.new("RGB", (tw, th), (244, 232, 208))
    canvas.paste(img, ((tw - w) // 2, (th - h) // 2))
    save_webp(canvas, OUT / f"{base}.webp", quality=76)
    # jpg fallback
    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-i",
            str(OUT / f"{base}.webp"),
            "-q:v",
            "5",
            str(OUT / f"{base}.jpg"),
        ],
        capture_output=True,
    )
    print("bg", base, (tw, th))


def process_tarot(src_name: str, base: str):
    src = UP / src_name
    img = Image.open(src).convert("RGB")
    img.thumbnail((720, 1080), Image.Resampling.LANCZOS)
    save_webp(img, OUT / f"{base}.webp", quality=78)
    print("tarot", base, img.size)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for s, b in CUTOUTS:
        process_cutout(s, b)
    for s, b, tw, th in BACKGROUNDS:
        process_bg(s, b, tw, th)
    for s, b in TAROT:
        process_tarot(s, b)


if __name__ == "__main__":
    main()
