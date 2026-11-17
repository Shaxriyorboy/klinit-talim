# Personaj rasmlaridan bir tekis fonni (yashil yoki pushti) kesib, shaffof PNG yasaydi.
# Ishlatish: python3 frontend/scripts/cutout-characters.py [ism1 ism2 ...]
# Kirish:  public/characters/_generated/raw/<ism>.(png|webp|jpg)
# Chiqish: public/characters/<ism>.png
#
# Usul (chroma key): fon rangi chetdagi piksellardan aniqlanadi va har bir piksel uchun "fonga o'xshashlik" kaliti hisoblanadi:
#   yashil fon  → k = G − max(R, B)      (teri, kiyim, ro'mol uchun manfiy; fon uchun ~+100)
#   pushti fon  → k = min(R − G, B − G)  (fon ~+40; teri, sochlar, jigarrang/oq kiyim uchun ≤ 0)
# Kalitdan yumshoq alfa olinadi, chegarada fon rangi chiqarib tashlanadi (despill) — hoshiya qolmaydi.
# Pushti fonda faqat chetga ulangan hudud kesiladi (lab kabi ichki pushti joylar saqlanadi).
import glob
import os
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.join(os.path.dirname(__file__), "..", "public", "characters")
RAW = os.path.join(ROOT, "_generated", "raw")


def cutout(path: str) -> Image.Image:
    im = Image.open(path).convert("RGB")
    a = np.asarray(im).astype(np.float32)
    h, w, _ = a.shape
    edge = np.concatenate([a[:4].reshape(-1, 3), a[-4:].reshape(-1, 3), a[:, :4].reshape(-1, 3), a[:, -4:].reshape(-1, 3)])
    bg = np.median(edge, axis=0)
    R, G, B = a[..., 0], a[..., 1], a[..., 2]
    green = bg[1] > bg[0] and bg[1] > bg[2]

    if green:
        k = G - np.maximum(R, B)
        kb = bg[1] - max(bg[0], bg[2])
        lo, hi = 0.25 * kb, 0.6 * kb  # lo dan past — to'liq personaj, hi dan yuqori — to'liq fon
    else:
        k = np.minimum(R - G, B - G)
        kb = min(bg[0] - bg[1], bg[2] - bg[1])
        lo, hi = 0.35 * kb, 0.75 * kb
    bgness = np.clip((k - lo) / (hi - lo), 0, 1)  # 0 = personaj, 1 = fon

    if not green:
        # faqat chetga ulangan fon (flood fill) — ichki pushti joylar (lab) saqlanadi
        cand = Image.fromarray(((bgness > 0.05) * 255).astype(np.uint8)).copy()  # copy: numpy xotirasi faqat o'qish uchun
        for seed in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1), (w // 2, 0)]:
            if cand.getpixel(seed) == 255:
                ImageDraw.floodfill(cand, seed, 128)
        outer = np.asarray(cand.filter(ImageFilter.MaxFilter(3))) == 128
        bgness = np.where(outer, bgness, 0)

    alpha = 1 - bgness
    # despill: C = (P − (1−α)·BG) / α ; keyin qolgan fon rangini bostirish
    al = np.clip(alpha, 1e-3, 1)[..., None]
    fg = np.clip((a - (1 - al) * bg) / al, 0, 255)
    if green:
        fg[..., 1] = np.minimum(fg[..., 1], np.maximum(fg[..., 0], fg[..., 2]) + 6)
    else:
        lim = fg[..., 1] + 10
        edge_px = alpha < 0.98
        fg[..., 2] = np.where(edge_px, np.minimum(fg[..., 2], np.maximum(lim, fg[..., 2] * 0.85)), fg[..., 2])
    out = np.dstack([fg, alpha * 255]).astype(np.uint8)
    img = Image.fromarray(out)
    # alfa chegarasini biroz yumshatish
    r, g, b, aa = img.split()
    aa = aa.filter(ImageFilter.GaussianBlur(0.5))
    img = Image.merge("RGBA", (r, g, b, aa))
    bbox = aa.point(lambda v: 255 if v > 16 else 0).getbbox()
    return img.crop(bbox) if bbox else img


def main() -> None:
    names = sys.argv[1:] or sorted({os.path.splitext(os.path.basename(f))[0] for f in glob.glob(os.path.join(RAW, "*"))})
    for n in names:
        src = next(iter(sorted(glob.glob(os.path.join(RAW, n + ".*")))), None)
        if not src:
            print(f"{n}: manba topilmadi")
            continue
        res = cutout(src)
        dst = os.path.join(ROOT, f"{n}.png")
        res.save(dst, optimize=True)
        print(f"{n}: {res.size[0]}x{res.size[1]} → {os.path.relpath(dst)}")


if __name__ == "__main__":
    main()
