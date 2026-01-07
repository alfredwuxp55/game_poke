
import os
from pathlib import Path

frames_dir = Path(r"/workspace/.preview_frames/")
out_gif = Path(r"/workspace/welcome-preview.gif")

try:
    from PIL import Image
except Exception:
    raise SystemExit("Pillow not installed")

paths = sorted(frames_dir.glob("frame_*.png"))
if not paths:
    raise SystemExit("No frames found")

imgs = [Image.open(p).convert("RGBA") for p in paths]

# 120ms per frame to match capture cadence
imgs[0].save(
    out_gif,
    save_all=True,
    append_images=imgs[1:],
    duration=120,
    loop=0,
    disposal=2,
    optimize=False,
)
print(str(out_gif))
