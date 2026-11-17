# Personaj rasmlari: Hugging Face FLUX.1-schnell (token .env.tools dagi HF_TOKEN dan, ekranga chiqarilmaydi).
# Ishlatish: python3 frontend/scripts/gen-characters.py [chiqish_papka] [ism1,ism2] [seed1,seed2]
import json, os, sys, urllib.request, concurrent.futures as cf
root = "/Users/shaxriyortursunaliyev/StudioProjects/klinik-talim"
tok = [l.split("=",1)[1].strip() for l in open(f"{root}/.env.tools") if l.startswith("HF_TOKEN=")][0]
out = sys.argv[1] if len(sys.argv) > 1 else f"{root}/frontend/public/characters/_generated/raw"
os.makedirs(out, exist_ok=True)
STYLE = ("3D stylized realistic character, Pixar-like, soft studio lighting, high detail skin and fabric, friendly and professional, "
         "waist-up portrait, 3/4 view, looking at camera, consistent character design, no text, no logo, ")
BG = {"magenta": "plain solid flat magenta pink background", "green": "plain solid flat bright chroma green background"}
P = {
 "jasur": ("Central Asian Uzbek man doctor, 35 years old, short dark hair, short neat beard, white lab coat over navy blue scrubs, stethoscope around neck, friendly smile, hands relaxed", "magenta"),
 "bekzod": ("Central Asian Uzbek man anesthesiologist, 40 years old, purple surgical scrubs, patterned purple surgical cap, light blue surgical mask hanging under the chin, focused calm kind look", "green"),
 "nigora": ("young Central Asian Uzbek woman, 27 years old, pregnant, soft pink headscarf covering hair and neck (modest hijab style), light pink hospital gown, gentle slightly worried smile", "green"),
 "sardor": ("Central Asian Uzbek man, 30 years old, short dark hair, clean shaven, casual brown button-up shirt, supportive caring expression", "magenta"),
}
def gen(name, seed):
    desc, bg = P[name]
    body = json.dumps({"inputs": STYLE + desc + ", " + BG[bg], "parameters": {"width": 832, "height": 1216, "seed": seed, "num_inference_steps": 4}}).encode()
    req = urllib.request.Request("https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell", data=body,
        headers={"Authorization": f"Bearer {tok}", "Content-Type": "application/json", "Accept": "image/png"})
    try:
        with urllib.request.urlopen(req, timeout=180) as r:
            data = r.read()
        open(f"{out}/{name}-{seed}.img", "wb").write(data)
        return f"{name}-{seed}: ok {len(data)}"
    except urllib.error.HTTPError as e:
        return f"{name}-{seed}: HTTP {e.code} {e.read()[:200]!r}"
    except Exception as e:
        return f"{name}-{seed}: {e}"
names = sys.argv[2].split(",") if len(sys.argv) > 2 else list(P)
seeds = [int(s) for s in (sys.argv[3].split(",") if len(sys.argv) > 3 else ["11", "27"])]
with cf.ThreadPoolExecutor(4) as ex:
    for r in ex.map(lambda a: gen(*a), [(n, s) for n in names for s in seeds]): print(r)
