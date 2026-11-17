# Personaj rasmlari

3D personajlar Hugging Face'dagi **FLUX.1-schnell** (Apache 2.0) bilan generatsiya qilinadi va fon kesiladi.

```bash
uv venv --python 3.12 .venv && uv pip install --python .venv/bin/python gradio_client pillow numpy scipy
# (ixtiyoriy) HF_TOKEN — ../../.env.tools dan: export $(grep -v '^#' ../../.env.tools | xargs)
.venv/bin/python flux.py "<prompt>" jasur.webp 203        # generatsiya (832x1216)
.venv/bin/python keyout.py jasur.webp ../../frontend/public/characters/jasur.png 58   # fonni kesish
```

Promptlar va uslub: `../../assets-brief/PERSONAJLAR.md`. Fon rangi kiyimga qarab tanlanadi
(teal/yashil kiyim — `bright magenta`, qolganlar — `bright green`).

Yangi rasm qo'shilgach `frontend/src/video/sprites.ts` dagi `SPRITES` ro'yxatiga yozing — video va sayt avtomatik foydalanadi.
Hozir tayyor: Dr. Dilnoza (seed 201), Malika opa (seed 202).
