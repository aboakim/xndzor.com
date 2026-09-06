import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const outPath = path.join(root, "public", "og.png");

const fontCandidates = [
  "C:/Windows/Fonts/sylfaen.ttf",
  "/usr/share/fonts/truetype/noto/NotoSerifArmenian-Bold.ttf",
  "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf",
];

const fontPath = fontCandidates.find((p) => fs.existsSync(p));
if (!fontPath) {
  console.error("No Armenian-capable font found for OG generation");
  process.exit(1);
}

const fontB64 = fs.readFileSync(fontPath).toString("base64");
const fontFormat = fontPath.endsWith(".otf") ? "opentype" : "truetype";

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <style>
      @font-face {
        font-family: 'OgArmenian';
        src: url('data:font/${fontFormat};base64,${fontB64}') format('${fontFormat}');
        font-weight: 400 700;
      }
    </style>
  </defs>
  <rect width="1200" height="630" fill="#ffffff"/>
  <g transform="translate(600 250) scale(3.55) translate(-80 -80)">
    <path d="M80 50c-26 0-42 18-42 42s18 44 42 44 42-20 42-44-16-42-42-42z" fill="#b83b34"/>
    <path d="M62 66c8-6 16-6 22 0-8 10-16 14-26 12 0-5 2-9 4-12z" fill="#d4665c" opacity=".65"/>
    <path d="M80 50V34" stroke="#6b5236" stroke-width="6" stroke-linecap="round"/>
    <path d="M80 40c8-10 20-12 28-8-4 12-16 16-28 12z" fill="#5c8f57"/>
  </g>
  <text
    x="600"
    y="525"
    text-anchor="middle"
    font-family="OgArmenian, Sylfaen, serif"
    font-size="96"
    font-weight="700"
    fill="#0a3329"
  >Խնձոր</text>
</svg>`;

const info = await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(outPath);
console.log(`Wrote ${outPath} (${info.width}x${info.height}, ${info.size} bytes)`);
