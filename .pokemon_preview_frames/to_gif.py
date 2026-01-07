
from pathlib import Path
from PIL import Image

frames_dir = Path(r"/workspace/.pokemon_preview_frames/")
out_gif = Path(r"/workspace/pokemon-preview.gif")

paths = sorted(frames_dir.glob("frame_*.png"))
imgs = [Image.open(p).convert("RGBA") for p in paths]
imgs[0].save(
  out_gif,
  save_all=True,
  append_images=imgs[1:],
  duration=420,
  loop=0,
  disposal=2,
  optimize=False,
)
print(str(out_gif))
