import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const W = 1200;
const H = 630;
const logoSize = 360;
const root = process.cwd();

const fontCandidates = [
  "C:/Windows/Fonts/segoeui.ttf",
  "C:/Windows/Fonts/arial.ttf",
  "C:/Windows/Fonts/sylfaen.ttf",
  "C:/Windows/Fonts/tahoma.ttf",
];
const fontFile = fontCandidates.find((p) => fs.existsSync(p));
const fontFamily = fontFile ? "BrandFont" : "serif";
const fontFace = fontFile
  ? `@font-face { font-family: BrandFont; src: url("file:///${fontFile.replace(/\\/g, "/")}"); }`
  : "";

const logo = await sharp(path.join(root, "public/logo-xndzor.png"))
  .resize(logoSize, logoSize, {
    fit: "contain",
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  })
  .png()
  .toBuffer();

const logoTop = 48;
const logoLeft = Math.round((W - logoSize) / 2);

const svg = Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      ${fontFace}
      .title { font-family: ${fontFamily}, 'Segoe UI', Tahoma, sans-serif; font-size: 68px; font-weight: 700; fill: #0a3329; }
      .sub { font-family: ${fontFamily}, 'Segoe UI', Tahoma, sans-serif; font-size: 30px; font-weight: 500; fill: #5a7a6e; }
    </style>
  </defs>
  <rect width="100%" height="100%" fill="#f7fbf9"/>
  <rect x="0" y="0" width="100%" height="12" fill="#8BC34A"/>
  <text x="600" y="470" text-anchor="middle" class="title">Խնձոր</text>
  <text x="600" y="520" text-anchor="middle" class="sub">Xndzor · xndzor.com</text>
</svg>`);

const out = path.join(root, "public/og.png");
await sharp(svg)
  .composite([{ input: logo, top: logoTop, left: logoLeft }])
  .png()
  .toFile(out);

const meta = await sharp(out).metadata();
console.log(
  `Wrote ${out} (${meta.width}x${meta.height}, ${meta.size} bytes) font=${fontFile || "fallback"}`,
);
