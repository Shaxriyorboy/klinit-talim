import sys, shutil, os
from gradio_client import Client
prompt, out, seed = sys.argv[1], sys.argv[2], int(sys.argv[3])
w = int(sys.argv[4]) if len(sys.argv) > 4 else 832
h = int(sys.argv[5]) if len(sys.argv) > 5 else 1216
c = Client("black-forest-labs/FLUX.1-schnell", verbose=False, token=os.environ.get("HF_TOKEN") or None)
res = c.predict(prompt=prompt, seed=seed, randomize_seed=False, width=w, height=h, num_inference_steps=4, api_name="/infer")
path = res[0] if isinstance(res, (list, tuple)) else res
shutil.copy(path, out)
print("ok", out, os.path.getsize(out))
