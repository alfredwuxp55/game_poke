import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const FRAMES_DIR = new URL("./.pokemon_preview_frames/", import.meta.url);
const OUT_GIF = new URL("./pokemon-preview.gif", import.meta.url);
const PAGE_URL = new URL("./<!DOCTYPE html>.html", import.meta.url);

async function main() {
  const framesDirPath = fileURLToPath(FRAMES_DIR);
  const outGifPath = fileURLToPath(OUT_GIF);

  await mkdir(framesDirPath, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1100, height: 700 },
    deviceScaleFactor: 2,
  });

  await page.goto(PAGE_URL.href, { waitUntil: "networkidle" });
  await page.waitForTimeout(400);

  // Helper to capture a frame
  async function snap(i) {
    const idx = String(i).padStart(2, "0");
    await page.screenshot({
      path: path.join(framesDirPath, `frame_${idx}.png`),
      fullPage: false,
      omitBackground: false,
    });
  }

  let i = 0;
  await snap(i++);

  // Show a quick interaction path:
  // Main menu -> Start game -> My cards -> switch tabs
  await page.click("#start-button");
  await page.waitForTimeout(350);
  await snap(i++);

  await page.click("#my-cards");
  await page.waitForTimeout(350);
  await snap(i++);

  // Switch a couple of categories
  const tabs = ["超稀有", "史诗", "传奇"];
  for (const cat of tabs) {
    await page.click(`#cards-view .tabs button[data-cat="${cat}"]`);
    await page.waitForTimeout(250);
    await snap(i++);
  }

  // Back to mode menu
  await page.click("#cards-back");
  await page.waitForTimeout(300);
  await snap(i++);

  // Back to main menu
  await page.click("#settings-btn");
  await page.waitForTimeout(180);
  await snap(i++);
  await page.click("#back-main");
  await page.waitForTimeout(320);
  await snap(i++);

  await browser.close();

  // Convert frames -> animated GIF (python + pillow)
  const py = String.raw`
from pathlib import Path
from PIL import Image

frames_dir = Path(r"${framesDirPath}")
out_gif = Path(r"${outGifPath}")

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
`;
  await writeFile(new URL("./.pokemon_preview_frames/to_gif.py", import.meta.url), py, "utf8");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

