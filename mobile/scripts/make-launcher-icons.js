/**
 * Generate Android launcher icons from the official TecnoRexa logo.
 *
 * The previous icons had the TR mark tiny in the middle of a large black
 * canvas, so the app looked like an empty square on the phone home screen.
 * This trims the empty border, scales the mark to fill the icon, and writes
 * every density bucket Android expects.
 */
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const RES = path.resolve(__dirname, "../android/app/src/main/res");
const SRC = path.resolve(__dirname, "../assets/icon.png");

// Android density buckets for the launcher icon.
const DENSITIES = {
  "mipmap-mdpi": 48,
  "mipmap-hdpi": 72,
  "mipmap-xhdpi": 96,
  "mipmap-xxhdpi": 144,
  "mipmap-xxxhdpi": 192,
};

(async () => {
  if (!fs.existsSync(SRC)) {
    console.error("Source icon not found:", SRC);
    process.exit(1);
  }

  // The artwork sits inside a large black canvas. Trimming alone fails because
  // the golden glow around the mark is bright, so crop the central band
  // explicitly and re-frame it as a square.
  const srcMeta = await sharp(SRC).metadata();
  const w = srcMeta.width || 482;
  const h = srcMeta.height || 319;
  console.log(`Source: ${w}x${h}`);

  const cropW = Math.round(w * 0.66);
  const cropH = Math.round(h * 0.60);
  const left = Math.round((w - cropW) / 2);
  const top = Math.round((h - cropH) / 2);

  const trimmed = await sharp(SRC)
    .extract({ left, top, width: cropW, height: cropH })
    .toBuffer();
  console.log(`  cropped to ${cropW}x${cropH} at (${left},${top})`);

  for (const [folder, size] of Object.entries(DENSITIES)) {
    const dir = path.join(RES, folder);
    fs.mkdirSync(dir, { recursive: true });

    // Fit the mark inside the icon with a small margin, on the brand black.
    const inner = Math.round(size * 0.92);
    const buf = await sharp(trimmed)
      .resize(inner, inner, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 1 },
      })
      .extend({
        top: size - inner,
        bottom: size - inner,
        left: size - inner,
        right: size - inner,
        background: { r: 0, g: 0, b: 0, alpha: 1 },
      })
      .png({ compressionLevel: 9 })
      .toBuffer();

    for (const name of [
      "ic_launcher.png",
      "ic_launcher_round.png",
      "ic_launcher_foreground.png",
    ]) {
      fs.writeFileSync(path.join(dir, name), buf);
    }
    console.log(`  ${folder}: ${size}x${size}`);
  }

  console.log("Launcher icons regenerated.");
})();
