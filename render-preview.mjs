import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const FRAMES_DIR = new URL("./.preview_frames/", import.meta.url);
const OUT_GIF = new URL("./welcome-preview.gif", import.meta.url);
const PAGE_URL = new URL("./index.html", import.meta.url);

async function main() {
  const framesDirPath = fileURLToPath(FRAMES_DIR);
  const outGifPath = fileURLToPath(OUT_GIF);

  await mkdir(framesDirPath, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 980, height: 560 },
    deviceScaleFactor: 2,
  });

  await page.goto(PAGE_URL.href, { waitUntil: "networkidle" });
  // Give initial enter animations and typewriter a moment
  await page.waitForTimeout(900);

  const frameCount = 16;
  const frameDelayMs = 120;

  for (let i = 0; i < frameCount; i++) {
    const idx = String(i).padStart(2, "0");
    await page.screenshot({
      path: path.join(framesDirPath, `frame_${idx}.png`),
      omitBackground: false,
      fullPage: false,
    });
    await page.waitForTimeout(frameDelayMs);
  }

  await browser.close();

  // Convert frames -> animated GIF (pure python, installed on demand)
  const py = String.raw`
import os
from pathlib import Path

frames_dir = Path(r"${framesDirPath}")
out_gif = Path(r"${outGifPath}")

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
`;

  await writeFile(new URL("./.preview_frames/to_gif.py", import.meta.url), py, "utf8");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

