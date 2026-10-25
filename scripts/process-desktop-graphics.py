#!/usr/bin/env python3
"""Generate landscape + portrait background variants and upscale cutouts via Real-ESRGAN (spandrel + CPU)."""
from __future__ import annotations

import json
import urllib.request
from pathlib import Path

import numpy as np
import torch
from PIL import Image
from spandrel import ModelLoader

ROOT = Path(__file__).resolve().parents[1]
UPLOADS = Path("/home/ubuntu/.cursor/projects/workspace/uploads")
OUT = ROOT / "assets" / "images"
MODEL_PATH = Path("/tmp/RealESRGAN_x4plus.pth")
CROP = (120, 213, 600, 1067)

LANDSCAPE_UPLOAD = {
    "bg-title": "bg-title_1f6c.jpg",
    "bg-meadow-stable": "bg-meadow-stable_4d9a.jpg",
    "bg-tavern": "bg-tavern_c0d0.jpg",
    "bg-cauldron": "bg-cauldron_54e7.jpg",
    "bg-starry-hill": "bg-starry-hill_a5f0.jpg",
    "bg-forest": "bg-forest_20db.jpg",
    "bg-celebration": "bg-celebration_2516.jpg",
}

PORTRAIT_720 = {
    "bg-title": "bg-title_12b2.jpg",
    "bg-meadow-stable": "bg-meadow-stable_1f2d.jpg",
    "bg-tavern": "bg-tavern_611c.jpg",
    "bg-cauldron": "bg-cauldron_db5d.jpg",
    "bg-starry-hill": "bg-starry-hill_2939.jpg",
    "bg-forest": "bg-forest_6b6a.jpg",
    "bg-celebration": "bg-celebration_7887.jpg",
}

CUTOUTS = [
    "horse-idle.webp",
    "horse-munch.webp",
    "horse-rear.webp",
    "dragon-doubt.webp",
    "dragon-befriended.webp",
    "quest-map.webp",
    "tarot-steeds.webp",
    "tarot-golden-hour.webp",
    "tarot-hearth.webp",
    "tarot-back.webp",
]

_MODEL = None


def get_model():
    global _MODEL
    if _MODEL is not None:
        return _MODEL
    if not MODEL_PATH.exists():
        url = "https://github.com/xinntao/Real-ESRGAN/releases/download/v0.1.0/RealESRGAN_x4plus.pth"
        print("Downloading", url, flush=True)
        urllib.request.urlretrieve(url, MODEL_PATH)
    _MODEL = ModelLoader().load_from_file(str(MODEL_PATH)).eval().to("cpu")
    return _MODEL


def esrgan_4x(img: Image.Image) -> Image.Image:
    model = get_model()
    arr = np.array(img.convert("RGB"), dtype=np.float32) / 255.0
    t = torch.from_numpy(arr).permute(2, 0, 1).unsqueeze(0)
    with torch.no_grad():
        out = model(t)
    o = out.squeeze(0).permute(1, 2, 0).clamp(0, 1).cpu().numpy()
    return Image.fromarray((o * 255).astype(np.uint8))


def save_pair(img: Image.Image, base: Path) -> dict:
    base.parent.mkdir(parents=True, exist_ok=True)
    jpg = base.with_suffix(".jpg")
    webp = base.with_suffix(".webp")
    rgb = img.convert("RGB")
    rgb.save(jpg, "JPEG", quality=88, optimize=True, subsampling=0)
    rgb.save(webp, "WEBP", quality=80, method=6)
    return {"jpg": jpg.stat().st_size, "webp": webp.stat().st_size, "size": list(img.size)}


def portrait_crop(name: str) -> Image.Image:
    rel = PORTRAIT_720[name]
    path = UPLOADS / rel
    if not path.exists():
        path = OUT / f"{name}.jpg"
    im = Image.open(path).convert("RGB")
    if im.size == (720, 1280):
        return im.crop(CROP)
    if im.size == (1080, 1920):
        w, h = im.size
        target_ratio = 480 / 854
        cw = int(h * target_ratio)
        x0 = (w - cw) // 2
        return im.crop((x0, 0, x0 + cw, h))
    return im


def has_outputs(base: Path, sizes: list[tuple[int, int]]) -> bool:
    for suf, (w, h) in zip(["", "-2560"], sizes):
        p = base.parent / f"{base.name}{suf}.webp"
        if not p.exists():
            return False
        if Image.open(p).size != (w, h):
            return False
    return True


def process_landscape(name: str, meta: dict) -> None:
    base_out = OUT / f"{name}-landscape"
    if has_outputs(base_out, [(1920, 1080), (2560, 1440)]):
        print("  skip landscape (exists)", name, flush=True)
        return
    src = UPLOADS / LANDSCAPE_UPLOAD[name]
    base = Image.open(src).convert("RGB")
    up = esrgan_4x(base)
    land2560 = up.resize((2560, 1440), Image.Resampling.LANCZOS)
    land1920 = up.resize((1920, 1080), Image.Resampling.LANCZOS)
    m1 = save_pair(land1920, OUT / f"{name}-landscape")
    m2 = save_pair(land2560, OUT / f"{name}-landscape-2560")
    meta["landscape"][name] = {"1920": m1, "2560": m2}


def process_portrait(name: str, meta: dict) -> None:
    crop = portrait_crop(name)
    up = esrgan_4x(crop)
    p1080 = up.resize((1080, 1920), Image.Resampling.LANCZOS)
    p1440 = up.resize((1440, 2560), Image.Resampling.LANCZOS)
    m0 = save_pair(p1080, OUT / name)
    m1 = save_pair(p1440, OUT / f"{name}-1440")
    meta["portrait"][name] = {"1080": m0, "1440": m1}


def process_cutout(filename: str, meta: dict) -> None:
    path = OUT / filename
    if not path.exists():
        return
    im = Image.open(path).convert("RGBA")
    ow, oh = im.size
    work = im
    max_side = max(ow, oh)
    if max_side > 720:
        s = 720 / max_side
        work = im.resize((int(ow * s), int(oh * s)), Image.Resampling.LANCZOS)
    up = esrgan_4x(work.convert("RGB"))
    target = (ow * 2, oh * 2)
    if up.size != target:
        up = up.resize(target, Image.Resampling.LANCZOS)
    alpha = im.resize(up.size, Image.Resampling.LANCZOS).split()[-1]
    up.putalpha(alpha)
    out = OUT / filename
    up.save(out, "WEBP", quality=82, method=6)
    meta["cutouts"][filename] = {"size": list(up.size), "bytes": out.stat().st_size}


def main() -> None:
    meta = {
        "landscape": {},
        "portrait": {},
        "cutouts": {},
        "upscaler": "RealESRGAN_x4plus via spandrel (PyTorch CPU); 4x enhance then Lanczos to delivery sizes",
    }
    for name in LANDSCAPE_UPLOAD:
        print("landscape", name, flush=True)
        process_landscape(name, meta)
    for name in PORTRAIT_720:
        print("portrait", name, flush=True)
        process_portrait(name, meta)
    for f in CUTOUTS:
        print("cutout", f, flush=True)
        process_cutout(f, meta)
    report = OUT / "graphics-manifest.json"
    report.write_text(json.dumps(meta, indent=2))
    print("wrote", report)


if __name__ == "__main__":
    main()
