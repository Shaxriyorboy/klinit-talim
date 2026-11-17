# Fonni kesish: burchaklardagi rangga yaqin va kadr chetiga BOG'LANGAN piksellar fon hisoblanadi.
# Personaj ichidagi o'xshash ranglar (masalan, teri) tegilmaydi.
import sys
import numpy as np
from PIL import Image
from scipy import ndimage

src, dst = sys.argv[1], sys.argv[2]
tol = float(sys.argv[3]) if len(sys.argv) > 3 else 70
im = np.asarray(Image.open(src).convert("RGB")).astype(np.float32)
h, w, _ = im.shape
edge = np.concatenate([im[0], im[-1], im[:, 0], im[:, -1]])
bg = np.median(edge, axis=0)
d = np.sqrt(((im - bg) ** 2).sum(-1))
cand = d < tol
lab, n = ndimage.label(cand)
border = np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))
border = border[border > 0]
bgmask = np.isin(lab, border)
bgmask = ndimage.binary_opening(bgmask, iterations=1)
# yopiq fon parchalari: fon rangiga juda yaqin va katta bo'lsa — ular ham fon
tight = d < 34
lab2, n2 = ndimage.label(tight)
sizes = ndimage.sum(tight, lab2, range(1, n2 + 1))
big = np.isin(lab2, np.nonzero(sizes > 400)[0] + 1)
fg = ~(bgmask | big)
# yumshoq qirra: 2 px
dist_in = ndimage.distance_transform_edt(fg)
alpha = np.clip(dist_in / 2.0, 0, 1)
# qirradagi fon aksini kamaytirish (faqat 3 px chiziqda)
edge_band = (dist_in > 0) & (dist_in < 3.5)
mix = np.clip(1 - dist_in / 3.5, 0, 1)[..., None] * edge_band[..., None]
gray = im.mean(-1, keepdims=True)
rgb = im * (1 - mix * 0.7) + gray * mix * 0.7
out = np.dstack([np.clip(rgb, 0, 255), alpha * 255]).astype(np.uint8)
img = Image.fromarray(out, "RGBA")
img = img.crop(img.getchannel("A").getbbox())
img.save(dst, optimize=True)
print(dst, img.size, "bg", bg.round(), "fg%", round(fg.mean() * 100, 1))
